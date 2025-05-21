// hooks/useShikenLogic.js
import { useCallback, useEffect, useMemo } from 'react';
import {
    EXAM_SETTINGS,
    TOTAL_EXAMS,
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
    const newExaminers = getInitialExaminerState().map(ex => ({
      ...ex,
      satisfactionCount: 0,
    }));
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
    setCurrentHand([]);
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
        setCurrentHand([]);
        return;
    }
    setCurrentHand(newHandCardInstances);
  }, [playerState, setCurrentHand]);

  useEffect(() => {
    if (gameState === '試験' && !lastRoundResult && !currentExamResultInfo && currentHand.length === 0) {
      drawNewHand();
    }
  }, [gameState, currentExamRound, lastRoundResult, currentExamResultInfo, currentHand, drawNewHand]);

  const handleCardPlay = useCallback((playedCardInstanceId, targetExaminerNameInput) => { // targetExaminerNameInput can be null
    const playedCardInstance = currentHand.find(cardInst => cardInst.instanceId === playedCardInstanceId);
    if (!playedCardInstance) { console.error("Played card instance not found in hand"); return; }
    const cardData = allAbilityCards.get(playedCardInstance.baseId);
    if (!cardData) { console.error("Card data not found for played card"); return; }

    if (gameState !== '試験' || !playerState || lastRoundResult) {
        console.warn("Cannot play card in current state or lastRoundResult exists.");
        return;
    }

    if (cardData.targetType === TARGET_TYPE.SINGLE && !targetExaminerNameInput) {
        console.error("Target examiner name not provided for SINGLE target card by game.js logic. This should not happen if game.js is correct.");
        // This case should ideally be caught by game.js's executeExamCardPlay
        return;
    }

    let roundCardPlayResultSummary = {
        playedCardName: cardData.name,
        targetDescription: "",
        effects: [],
        totalScoreGainedThisPlay: 0,
        newTotalExamScore: currentExamScore,
    };
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
      roundCardPlayResultSummary.targetDescription = "自分";

    } else { // 試験官をターゲットとするカード (SINGLE, ALL, RANDOM_TWO)
      let actualTargets = [];
      if (cardData.targetType === TARGET_TYPE.SINGLE) {
        const singleTarget = examiners.find(ex => ex.name === targetExaminerNameInput); // targetExaminerNameInput should be valid here
        if (singleTarget) actualTargets.push(singleTarget);
        roundCardPlayResultSummary.targetDescription = targetExaminerNameInput;
      } else if (cardData.targetType === TARGET_TYPE.ALL) {
        actualTargets = [...examiners];
        roundCardPlayResultSummary.targetDescription = "全員";
      } else if (cardData.targetType === TARGET_TYPE.RANDOM_TWO) {
        const shuffledExaminers = [...examiners].sort(() => 0.5 - Math.random());
        actualTargets = shuffledExaminers.slice(0, Math.min(2, shuffledExaminers.length));
        roundCardPlayResultSummary.targetDescription = `ランダム${actualTargets.length}名`;
      }

      if (actualTargets.length === 0) {
        console.warn("No valid targets found for examiner-targeted card play.");
        roundCardPlayResultSummary.targetDescription = roundCardPlayResultSummary.targetDescription || "対象なし";
      }

      let updatedExaminersState = [...examiners];
      let totalScoreThisPlay = 0;

      actualTargets.forEach(targetEx => {
        let baseEvaluation = 0;
        let referredStatusForCalc = cardData.referredStatus;

        if (cardData.referredStatus === STATUS_TYPE.RANDOM) {
            const playableStatuses = [STATUS_TYPE.IN_VIVO, STATUS_TYPE.IN_VITRO, STATUS_TYPE.IN_SILICO];
            referredStatusForCalc = playableStatuses[Math.floor(Math.random() * playableStatuses.length)];
        }

        if (referredStatusForCalc === STATUS_TYPE.NONE && cardData.effectValue !== undefined) {
          baseEvaluation = cardData.effectValue;
        } else if (newPlayerStatsForThisTurn[referredStatusForCalc] !== undefined) {
          if (cardData.effectType === 'random_multiplier' && cardData.effectMultiplierMin !== undefined && cardData.effectMultiplierMax !== undefined) {
            const randomMult = Math.random() * (cardData.effectMultiplierMax - cardData.effectMultiplierMin) + cardData.effectMultiplierMin;
            baseEvaluation = newPlayerStatsForThisTurn[referredStatusForCalc] * randomMult;
          } else {
            baseEvaluation = newPlayerStatsForThisTurn[referredStatusForCalc] * (cardData.effectMultiplier || 1);
          }
        } else if (referredStatusForCalc === STATUS_TYPE.AVERAGE) {
          const vivo = newPlayerStatsForThisTurn[STATUS_TYPE.IN_VIVO] || 0;
          const vitro = newPlayerStatsForThisTurn[STATUS_TYPE.IN_VITRO] || 0;
          const silico = newPlayerStatsForThisTurn[STATUS_TYPE.IN_SILICO] || 0;
          const avg = (vivo + vitro + silico) / 3;
          baseEvaluation = avg * (cardData.effectMultiplier || 1);
        }
        baseEvaluation = parseFloat(baseEvaluation.toFixed(1));

        let preferredStatusAppliedMultiplier = 1.0;
        if (targetEx.preferredStatus === referredStatusForCalc &&
            referredStatusForCalc !== STATUS_TYPE.NONE &&
            referredStatusForCalc !== STATUS_TYPE.AVERAGE &&
            targetEx.preferredStatusMultiplier
            ) {
          baseEvaluation *= targetEx.preferredStatusMultiplier;
          preferredStatusAppliedMultiplier = targetEx.preferredStatusMultiplier;
        }
        baseEvaluation = parseFloat(baseEvaluation.toFixed(1));

        baseEvaluation *= examBuffs.satisfactionMultiplier;
        baseEvaluation *= examBuffs.nextCardMultiplier;
        baseEvaluation = parseFloat(baseEvaluation.toFixed(1));

        const targetIndexInState = updatedExaminersState.findIndex(ex => ex.name === targetEx.name);
        if (targetIndexInState === -1) return;

        const newSatisfactionCount = updatedExaminersState[targetIndexInState].satisfactionCount + 1;
        updatedExaminersState[targetIndexInState] = {
            ...updatedExaminersState[targetIndexInState],
            satisfactionCount: newSatisfactionCount
        };

        let satisfactionCountMultiplier = 0.75;
        if (newSatisfactionCount === 1) satisfactionCountMultiplier = 2.0;
        else if (newSatisfactionCount === 2) satisfactionCountMultiplier = 1.66;
        else if (newSatisfactionCount === 3) satisfactionCountMultiplier = 1.33;
        else if (newSatisfactionCount === 4) satisfactionCountMultiplier = 1.00;

        let examinerBaseMultiplier = 0.75;
        if (targetEx.name === '教授') examinerBaseMultiplier = 1.5;
        else if (targetEx.name === '講師') examinerBaseMultiplier = 1.0;

        const scoreGainedForThisTarget = parseFloat((baseEvaluation * examinerBaseMultiplier * satisfactionCountMultiplier).toFixed(1));
        totalScoreThisPlay += scoreGainedForThisTarget;

        roundCardPlayResultSummary.effects.push({
            examinerName: targetEx.name,
            baseEvaluationBeforePreferred: parseFloat((baseEvaluation / preferredStatusAppliedMultiplier).toFixed(1)),
            preferredStatusBonusApplied: preferredStatusAppliedMultiplier > 1.0,
            preferredStatusMultiplierUsed: preferredStatusAppliedMultiplier,
            finalBaseEvaluation: baseEvaluation,
            referredStatusUsed: referredStatusForCalc,
            satisfactionCountForThisPlay: newSatisfactionCount,
            satisfactionCountMultiplier: satisfactionCountMultiplier,
            examinerBaseMultiplier: examinerBaseMultiplier,
            scoreGainedThisTarget: scoreGainedForThisTarget,
        });
      });

      setExaminers(updatedExaminersState);

      roundCardPlayResultSummary.totalScoreGainedThisPlay = parseFloat(totalScoreThisPlay.toFixed(1));
      const newTotalExamScore = parseFloat((currentExamScore + totalScoreThisPlay).toFixed(1));
      setCurrentExamScore(newTotalExamScore);
      roundCardPlayResultSummary.newTotalExamScore = newTotalExamScore;

      if (examBuffs.nextCardMultiplier !== 1) {
        setExamBuffs(prev => ({ ...prev, nextCardMultiplier: 1 }));
      }
    }

    setLastRoundResult(roundCardPlayResultSummary);

    if (!playedCardInstance.isInitial) {
      setPlayerState(prev => ({ ...prev, usedAdditionalCardsThisExam: [...(prev.usedAdditionalCardsThisExam || []), playedCardInstance.instanceId] }));
    }
  }, [gameState, playerState, currentHand, examiners, examBuffs, currentExamScore, lastRoundResult, setExamBuffs, setExaminers, setCurrentExamScore, setLastRoundResult, setPlayerState]);

  const proceedToNextExamRoundOrEndExam = useCallback(() => {
    setLastRoundResult(null);
    const currentExamSettingsVal = playerState ? EXAM_SETTINGS[playerState.currentExamIndex] : null;
    if (!currentExamSettingsVal) {
      console.error("Exam settings not found!");
      setGameState('RESULT_GAMEOVER');
      return;
    }
    const isNormaAchieved = currentExamScore >= currentExamSettingsVal.normaScore;
    const isLastPlayableRound = currentExamRound >= currentExamSettingsVal.roundLimit - 1;
    let examResultStatus = {
      examName: currentExamSettingsVal.name,
      achievedScore: currentExamScore,
      normaScore: currentExamSettingsVal.normaScore,
      isClear: false,
      isGameClear: false,
      isGameOver: false,
      finalTotalScore: playerState.totalScore
    };
    if (isLastPlayableRound) {
      if (isNormaAchieved) {
        examResultStatus.isClear = true;
        examResultStatus.finalTotalScore += currentExamScore;
        if (playerState.currentExamIndex + 1 >= TOTAL_EXAMS) {
          examResultStatus.isGameClear = true;
        }
      } else {
        examResultStatus.isGameOver = true;
      }
      setCurrentExamResultInfo(examResultStatus);
      setGameState('EXAM_RESULT_DISPLAY');
    } else {
      setCurrentExamRound(prevRound => prevRound + 1);
      setCurrentHand([]);
    }
  }, [playerState, currentExamScore, currentExamRound, setGameState, setCurrentExamResultInfo, setCurrentExamRound, setCurrentHand, setLastRoundResult]);

  const handleProceedFromExamResult = useCallback(() => {
    if (!currentExamResultInfo) return;
    if (currentExamResultInfo.isGameClear) {
      setPlayerState(prev => ({ ...prev, totalScore: currentExamResultInfo.finalTotalScore }));
      setGameState('RESULT_CLEAR');
    } else if (currentExamResultInfo.isGameOver) {
      setPlayerState(prev => ({ ...prev, totalScore: currentExamResultInfo.finalTotalScore }));
      setGameState('RESULT_GAMEOVER');
    } else if (currentExamResultInfo.isClear) {
      setPlayerState(prev => ({
        ...prev,
        totalScore: currentExamResultInfo.finalTotalScore,
        currentExamIndex: prev.currentExamIndex + 1
      }));
      setCurrentIkuseiRound(0);
      setGameState('育成');
    } else {
      setGameState('育成');
    }
    setCurrentExamResultInfo(null);
  }, [currentExamResultInfo, setPlayerState, setGameState, setCurrentIkuseiRound, setCurrentExamResultInfo]);

  const handleItemUse = useCallback((itemInstanceId, itemBaseId, targetExaminerName) => {
    const item = allItemData[itemBaseId];
    const targetExIndex = examiners.findIndex(ex => ex.name === targetExaminerName);
    if (!item || targetExIndex === -1 || item.type !== ITEM_TYPE.TRAIT_CHANGE) {
      setItemUseResultMessage("アイテムの使用に失敗しました。");
      setShowItemUseResultModal(true);
      return;
    }
    const updatedExaminers = examiners.map((ex, index) =>
      index === targetExIndex ? { ...ex, preferredStatus: item.targetStatus, preferredStatusMultiplier: 2.0 } : ex
    );
    setExaminers(updatedExaminers);
    if (playerState?.inventory?.traitChangeItems) {
        const itemIndexToRemove = playerState.inventory.traitChangeItems.findIndex(inst => inst.instanceId === itemInstanceId);
        if (itemIndexToRemove > -1) {
            const newItems = [...playerState.inventory.traitChangeItems];
            newItems.splice(itemIndexToRemove, 1);
            setPlayerState(p => ({ ...p, inventory: { ...p.inventory, traitChangeItems: newItems }}));
        } else {
            console.warn(`Item instance ${itemInstanceId} (base: ${itemBaseId}) not found in inventory for removal.`);
        }
    }
    setItemUseResultMessage(`${targetExaminerName}の評価しやすいステータスが「${item.targetStatus}」に変更されました。`);
    setShowItemUseResultModal(true);
  }, [examiners, playerState, setExaminers, setPlayerState, setItemUseResultMessage, setShowItemUseResultModal]);

  const closeItemUseResultModal = useCallback(() => {
    setShowItemUseResultModal(false);
    setItemUseResultMessage('');
  }, [setShowItemUseResultModal, setItemUseResultMessage]);

  const skipItemUseAndProceedToExam = useCallback((proceedToExamPhaseFunc) => {
    if (typeof proceedToExamPhaseFunc === 'function') {
      proceedToExamPhaseFunc();
    } else {
      console.error("skipItemUseAndProceedToExam: proceedToExamPhaseFunc is not a function");
    }
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