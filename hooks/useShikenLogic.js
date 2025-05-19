// hooks/useShikenLogic.js
import { useCallback, useEffect, useMemo } from 'react';
import {
    EXAM_SETTINGS,
    TOTAL_EXAMS,
    EXAMINER_EVALUATION_WEIGHT,
    getInitialExaminerState
} from '../data/initialGameState';
import { STATUS_TYPE, TARGET_TYPE } from '../data/abilityCards';
import { allAbilityCards, generateUniqueCardInstanceId } from '../utils/cardUtils';
import { allItems as allItemData, ITEM_TYPE } from '../data/items';

export const useShikenLogic = (
    playerState, setPlayerState,
    gameState, setGameState,
    examiners, setExaminers,
    currentExamRound, setCurrentExamRound,
    currentExamScore, setCurrentExamScore,
    currentHand, setCurrentHand,
    examBuffs, setExamBuffs,
    lastRoundResult, setLastRoundResult,
    pendingExamUpdateRef,
    currentExamResultInfo, setCurrentExamResultInfo,
    setCurrentIkuseiRound,
    initialDeckCardIds,
    setItemUseResultMessage,
    setShowItemUseResultModal
) => {

  const prepareExaminersForNewExam = useCallback(() => {
    if (!playerState) return;
    const currentExamIndex = playerState.currentExamIndex;
    const currentExamSetting = EXAM_SETTINGS[currentExamIndex];
    let maxSatisfactionForThisExam;

    if (!currentExamSetting) {
        console.error("Current exam setting not found for index:", currentExamIndex);
        maxSatisfactionForThisExam = EXAM_SETTINGS[0]?.maxSatisfactionPerExaminer || 60;
    } else {
        maxSatisfactionForThisExam = currentExamSetting.maxSatisfactionPerExaminer;
    }

    const newExaminers = getInitialExaminerState().map(ex => {
      const basicPlayableStatuses = [ STATUS_TYPE.IN_VIVO, STATUS_TYPE.IN_VITRO, STATUS_TYPE.IN_SILICO ];
      const randomStatus = basicPlayableStatuses[Math.floor(Math.random() * basicPlayableStatuses.length)];
      const randomMultiplier = Math.random() < 0.7 ? 2 : 1.5;
      return {
        ...ex,
        satisfaction: 0,
        maxSatisfaction: maxSatisfactionForThisExam,
        preferredStatus: randomStatus,
        preferredStatusMultiplier: randomMultiplier,
        achievedEvaluationMilestones: {}
      };
    });
    setExaminers(newExaminers);
  }, [playerState, setExaminers]);

  const preparePlayerForExam = useCallback(() => {
    if (!playerState) return;
    let examDeckInstances = playerState.additionalDeck ? [...playerState.additionalDeck] : [];
    initialDeckCardIds.forEach(baseId => {
      const initialCardData = allAbilityCards.get(baseId);
      if (initialCardData && initialCardData.isInitial) {
          examDeckInstances.push({ baseId: baseId, instanceId: generateUniqueCardInstanceId(), isInitial: true });
      }
    });
    const finalExamDeck = examDeckInstances.sort(() => 0.5 - Math.random());
    setPlayerState(p => ({ ...p, currentExamFullDeck: finalExamDeck, usedAdditionalCardsThisExam: [] }));
    setCurrentExamRound(0);
    setCurrentExamScore(0);
    setLastRoundResult(null);
    setCurrentExamResultInfo(null);
    setExamBuffs({ satisfactionMultiplier: 1, statsPercentageBonus: 0, nextCardMultiplier: 1 });
    setCurrentHand([]); // 試験準備完了時に手札を空にして、useEffectで最初の描画を促す
  }, [playerState, setPlayerState, initialDeckCardIds, setCurrentExamRound, setCurrentExamScore, setLastRoundResult, setCurrentExamResultInfo, setExamBuffs, setCurrentHand]);

  const drawNewHand = useCallback(() => {
    if (!playerState || !playerState.currentExamFullDeck || playerState.usedAdditionalCardsThisExam === undefined) {
        setCurrentHand([]); return;
    }

    const availableCardInstances = playerState.currentExamFullDeck.filter(cardInst =>
        cardInst.isInitial || !playerState.usedAdditionalCardsThisExam.includes(cardInst.instanceId)
    );

    let newHandCardInstances = [];
    if (availableCardInstances.length < 3 && availableCardInstances.length > 0) {
        newHandCardInstances = [...availableCardInstances].sort(() => 0.5 - Math.random());
    } else if (availableCardInstances.length >= 3) {
        const shuffledAvailableInstances = [...availableCardInstances].sort(() => 0.5 - Math.random());
        for (let i = 0; i < 3; i++) {
            newHandCardInstances.push(shuffledAvailableInstances[i]);
        }
    } else {
        // console.warn("drawNewHand: No available cards in deck.");
        setCurrentHand([]);
        return;
    }
    setCurrentHand(newHandCardInstances);
  }, [playerState, setCurrentHand]); // initialDeckCardIds は直接使わないので削除

  useEffect(() => {
    if (gameState === '試験' && !lastRoundResult && !currentExamResultInfo && currentHand.length === 0) {
      drawNewHand();
    }
  }, [gameState, currentExamRound, lastRoundResult, currentExamResultInfo, currentHand, drawNewHand]);


  const handleCardPlay = useCallback((playedCardInstanceId, targetExaminerNameInput) => {
    if (gameState !== '試験' || !playerState || !playedCardInstanceId || lastRoundResult) {
        const card = currentHand.find(c => c.instanceId === playedCardInstanceId);
        const cardDataForCheck = card ? allAbilityCards.get(card.baseId) : null;
        if (cardDataForCheck && cardDataForCheck.targetType !== TARGET_TYPE.PLAYER_SELF && !targetExaminerNameInput) {
             console.error("Target examiner name not provided for non-PLAYER_SELF card"); return;
        }
        if(!cardDataForCheck && !playedCardInstanceId) return;
    }

    const playedCardInstance = currentHand.find(cardInst => cardInst.instanceId === playedCardInstanceId);
    if (!playedCardInstance) { console.error("Played card instance not found in hand"); return; }
    const cardData = allAbilityCards.get(playedCardInstance.baseId);
    if (!cardData) { console.error("Card data not found for played card"); return; }

    let roundExaminerResults = [];
    let totalEvaluationGainedThisTurn = 0;
    let nextExaminersState = examiners ? [...examiners] : [];
    let newPlayerStatsForThisTurn = { ...(playerState.stats || {}) };

    if (examBuffs.statsPercentageBonus > 0) {
      for (const statKey in newPlayerStatsForThisTurn) {
        newPlayerStatsForThisTurn[statKey] = parseFloat((newPlayerStatsForThisTurn[statKey] * (1 + examBuffs.statsPercentageBonus)).toFixed(1));
      }
    }

    if (cardData.targetType === TARGET_TYPE.PLAYER_SELF) {
      let newExamBuffs = { ...examBuffs };
      if (cardData.effectType === 'buff_exam_satisfaction_multiplier' && cardData.effectValue) {
        newExamBuffs.satisfactionMultiplier = Math.max(newExamBuffs.satisfactionMultiplier, cardData.effectValue);
      } else if (cardData.effectType === 'buff_next_card_satisfaction_multiplier' && cardData.effectValue) {
        newExamBuffs.nextCardMultiplier = cardData.effectValue;
      } else if (cardData.effectType === 'buff_exam_stats_percentage' && cardData.effectValue) {
        newExamBuffs.statsPercentageBonus = Math.max(newExamBuffs.statsPercentageBonus, cardData.effectValue);
      }
      setExamBuffs(newExamBuffs);
      pendingExamUpdateRef.current = { updatedExaminersAfterPlay: examiners, newScoreAfterPlay: currentExamScore }; // 試験官の状態は変更なし
      setLastRoundResult({ playedCardName: cardData.name, targetExaminerName: "自分", examinerResults: [], totalEvaluationGainedThisTurn: 0 });
    } else {
      if (!targetExaminerNameInput && cardData.targetType === TARGET_TYPE.SINGLE) { console.error("Target examiner name not provided for single target card"); return; }
      let actualTargets = [];
      if (cardData.targetType === TARGET_TYPE.SINGLE) { actualTargets = examiners.filter(ex => ex.name === targetExaminerNameInput); }
      else if (cardData.targetType === TARGET_TYPE.ALL) { actualTargets = [...examiners]; }
      else if (cardData.targetType === TARGET_TYPE.RANDOM_TWO) { const shuffledExaminers = [...examiners].sort(() => 0.5 - Math.random()); actualTargets = shuffledExaminers.slice(0, 2); }

      nextExaminersState = examiners.map((examiner) => {
        let currentSatisfactionIncrease = 0.0;
        let affected = actualTargets.some(t => t.name === examiner.name);
        let actualReferredStatus = cardData.referredStatus;
        let evaluationGainedThisCard = 0;

        if (affected) {
          let baseIncrease = 0;
          if (actualReferredStatus === STATUS_TYPE.RANDOM) { const playableStatuses = [STATUS_TYPE.IN_VIVO, STATUS_TYPE.IN_VITRO, STATUS_TYPE.IN_SILICO]; actualReferredStatus = playableStatuses[Math.floor(Math.random() * playableStatuses.length)]; }
          if (actualReferredStatus === STATUS_TYPE.NONE && cardData.effectValue !== undefined) { baseIncrease = cardData.effectValue; }
          else if (actualReferredStatus === STATUS_TYPE.AVERAGE) { const vivo = newPlayerStatsForThisTurn[STATUS_TYPE.IN_VIVO] || 0; const vitro = newPlayerStatsForThisTurn[STATUS_TYPE.IN_VITRO] || 0; const silico = newPlayerStatsForThisTurn[STATUS_TYPE.IN_SILICO] || 0; const avg = (vivo + vitro + silico) / 3; baseIncrease = avg * (cardData.effectMultiplier || 1); }
          else if (newPlayerStatsForThisTurn[actualReferredStatus] !== undefined) { if (cardData.effectType === 'random_multiplier' && cardData.effectMultiplierMin !== undefined && cardData.effectMultiplierMax !== undefined) { const randomMult = Math.random() * (cardData.effectMultiplierMax - cardData.effectMultiplierMin) + cardData.effectMultiplierMin; baseIncrease = newPlayerStatsForThisTurn[actualReferredStatus] * randomMult; } else { baseIncrease = newPlayerStatsForThisTurn[actualReferredStatus] * (cardData.effectMultiplier || 1); } }
          if (examiner.preferredStatus === actualReferredStatus && ![STATUS_TYPE.NONE, STATUS_TYPE.AVERAGE].includes(actualReferredStatus)) { baseIncrease *= examiner.preferredStatusMultiplier; }
          baseIncrease *= examBuffs.satisfactionMultiplier; baseIncrease *= examBuffs.nextCardMultiplier; currentSatisfactionIncrease = parseFloat(baseIncrease.toFixed(1));
        }
        const oldSatisfaction = examiner.satisfaction;
        const newSatisfaction = Math.min(examiner.maxSatisfaction, parseFloat((oldSatisfaction + currentSatisfactionIncrease).toFixed(1)));
        const examinerWeightData = EXAMINER_EVALUATION_WEIGHT[examiner.name];
        const updatedMilestones = { ...examiner.achievedEvaluationMilestones };
        if (affected && examinerWeightData) { for (const thresholdPercentStr in examinerWeightData.satisfactionThresholds) { const thresholdPercent = parseInt(thresholdPercentStr); const satisfactionThresholdValue = Math.floor(examiner.maxSatisfaction * (thresholdPercent / 100)); if (newSatisfaction >= satisfactionThresholdValue && oldSatisfaction < satisfactionThresholdValue && !updatedMilestones[thresholdPercentStr]) { evaluationGainedThisCard += Math.round(examinerWeightData.satisfactionThresholds[thresholdPercentStr] * examinerWeightData.base); updatedMilestones[thresholdPercentStr] = true; } } }
        totalEvaluationGainedThisTurn += evaluationGainedThisCard;
        if (affected && (currentSatisfactionIncrease !== 0 || evaluationGainedThisCard !== 0)) { roundExaminerResults.push({ name: examiner.name, satisfactionIncrease: currentSatisfactionIncrease, oldSatisfaction: oldSatisfaction, newSatisfaction: newSatisfaction, evaluationGained: evaluationGainedThisCard }); }
        return { ...examiner, satisfaction: newSatisfaction, achievedEvaluationMilestones: updatedMilestones };
      });
      if (examBuffs.nextCardMultiplier !== 1) { setExamBuffs(prev => ({ ...prev, nextCardMultiplier: 1 })); }
      pendingExamUpdateRef.current = { updatedExaminersAfterPlay: nextExaminersState, newScoreAfterPlay: currentExamScore + totalEvaluationGainedThisTurn };
      setLastRoundResult({ playedCardName: cardData.name, targetExaminerName: cardData.targetType === TARGET_TYPE.ALL ? "全員" : (cardData.targetType === TARGET_TYPE.RANDOM_TWO ? "ランダム2名" : targetExaminerNameInput), examinerResults: roundExaminerResults, totalEvaluationGainedThisTurn: totalEvaluationGainedThisTurn });
    }
    if (!playedCardInstance.isInitial) { setPlayerState(prev => ({ ...prev, usedAdditionalCardsThisExam: [...(prev.usedAdditionalCardsThisExam || []), playedCardInstance.instanceId] })); }
  }, [gameState, playerState, currentHand, examiners, examBuffs, currentExamScore, lastRoundResult, setExamBuffs, pendingExamUpdateRef, setLastRoundResult, setPlayerState]);

  const proceedToNextExamRoundOrEndExam = useCallback(() => {
    if (!lastRoundResult || !pendingExamUpdateRef.current) { setLastRoundResult(null); if (pendingExamUpdateRef.current) pendingExamUpdateRef.current = null; return; }
    const { updatedExaminersAfterPlay, newScoreAfterPlay } = pendingExamUpdateRef.current;
    const finalExaminersForThisProceed = updatedExaminersAfterPlay;
    const finalScoreForThisProceed = newScoreAfterPlay;
    pendingExamUpdateRef.current = null;

    setExaminers(finalExaminersForThisProceed);
    setCurrentExamScore(finalScoreForThisProceed);
    setLastRoundResult(null);

    const currentExamSettingsVal = playerState ? EXAM_SETTINGS[playerState.currentExamIndex] : null;
    if (!currentExamSettingsVal) { setGameState('RESULT_GAMEOVER'); return; }
    const isNormaAchieved = finalScoreForThisProceed >= currentExamSettingsVal.normaScore;
    const allSatisfiedMax = finalExaminersForThisProceed.every(ex => ex.satisfaction >= ex.maxSatisfaction);
    const isLastPlayableRound = currentExamRound >= currentExamSettingsVal.roundLimit - 1;
    let examResultStatus = { examName: currentExamSettingsVal.name, achievedScore: finalScoreForThisProceed, normaScore: currentExamSettingsVal.normaScore, isClear: false, isGameClear: false, isGameOver: false, finalTotalScore: playerState.totalScore };

    if ((isNormaAchieved && allSatisfiedMax) || isLastPlayableRound) {
      if (isNormaAchieved) {
        examResultStatus.isClear = true;
        examResultStatus.finalTotalScore = playerState.totalScore + finalScoreForThisProceed;
        if (playerState.currentExamIndex + 1 >= TOTAL_EXAMS) { examResultStatus.isGameClear = true; }
      } else { examResultStatus.isGameOver = true; }
      setCurrentExamResultInfo(examResultStatus);
      setGameState('EXAM_RESULT_DISPLAY');
    } else {
      setCurrentExamRound(prevRound => prevRound + 1);
      setCurrentHand([]); // 次のラウンドに進む際に手札を空にして、useEffectで再描画を促す
    }
  }, [lastRoundResult, pendingExamUpdateRef, playerState, currentExamRound, setExaminers, setCurrentExamScore, setLastRoundResult, setCurrentExamResultInfo, setGameState, setCurrentExamRound, setCurrentHand]);

  const handleProceedFromExamResult = useCallback(() => {
    if (!currentExamResultInfo) return;
    if (currentExamResultInfo.isGameClear) { setPlayerState(prev => ({ ...prev, totalScore: currentExamResultInfo.finalTotalScore })); setGameState('RESULT_CLEAR'); }
    else if (currentExamResultInfo.isGameOver) { setPlayerState(prev => ({ ...prev, totalScore: currentExamResultInfo.finalTotalScore })); setGameState('RESULT_GAMEOVER'); }
    else if (currentExamResultInfo.isClear) { setPlayerState(prev => ({ ...prev, totalScore: currentExamResultInfo.finalTotalScore, currentExamIndex: prev.currentExamIndex + 1 })); setCurrentIkuseiRound(0); setGameState('育成'); }
    else { setGameState('育成'); } // 安全策
    setCurrentExamResultInfo(null);
  }, [currentExamResultInfo, setPlayerState, setGameState, setCurrentIkuseiRound, setCurrentExamResultInfo]);

  const handleItemUse = useCallback((itemInstanceId, itemBaseId, targetExaminerName) => {
    const item = allItemData[itemBaseId];
    const targetExIndex = examiners.findIndex(ex => ex.name === targetExaminerName);
    if (!item || targetExIndex === -1 || item.type !== ITEM_TYPE.TRAIT_CHANGE) { setItemUseResultMessage("アイテムの使用に失敗しました。"); setShowItemUseResultModal(true); return; }
    const updatedExaminers = examiners.map((ex, index) => index === targetExIndex ? { ...ex, preferredStatus: item.targetStatus } : ex );
    setExaminers(updatedExaminers);
    if (playerState?.inventory?.traitChangeItems) {
        const itemIndexToRemove = playerState.inventory.traitChangeItems.findIndex(inst => inst.instanceId === itemInstanceId);
        if (itemIndexToRemove > -1) { const newItems = [...playerState.inventory.traitChangeItems]; newItems.splice(itemIndexToRemove, 1); setPlayerState(p => ({ ...p, inventory: { ...p.inventory, traitChangeItems: newItems }})); }
        else { console.warn(`Item instance ${itemInstanceId} (base: ${itemBaseId}) not found in inventory for removal.`); }
    }
    setItemUseResultMessage(`${targetExaminerName}の評価しやすいステータスが「${item.targetStatus}」に変更されました。`); setShowItemUseResultModal(true);
  }, [examiners, playerState, setExaminers, setPlayerState, setItemUseResultMessage, setShowItemUseResultModal]);

  const closeItemUseResultModal = useCallback(() => { setShowItemUseResultModal(false); setItemUseResultMessage(''); }, [setShowItemUseResultModal, setItemUseResultMessage]);

  const skipItemUseAndProceedToExam = useCallback((proceedToExamPhaseFunc) => {
    if (typeof proceedToExamPhaseFunc === 'function') { proceedToExamPhaseFunc(); }
    else { console.error("skipItemUseAndProceedToExam: proceedToExamPhaseFunc is not a function"); }
  }, []);

  return {
    prepareExaminersForNewExam,
    preparePlayerForExam,
    handleCardPlay,
    proceedToNextExamRoundOrEndExam,
    handleProceedFromExamResult,
    handleItemUse,
    closeItemUseResultModal,
    skipItemUseAndProceedToExam,
  };
};