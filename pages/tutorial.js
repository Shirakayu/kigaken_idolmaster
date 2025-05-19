// pages/tutorial.js
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useTutorialLogic, TUTORIAL_STEPS } from '../hooks/useTutorialLogic';
import TutorialMessage from '../components/TutorialMessage';
import { useGameInitialization } from '../hooks/useGameInitialization';
import { mentors as allMentorsData } from '../data/mentors';
import ConfirmMentorModal from '../components/ConfirmMentorModal';

import PlayerStatusDisplay from '../components/PlayerStatusDisplay';
import MentorInfoDisplay from '../components/MentorInfoDisplay';
import IkuseiPhaseUINew from '../components/IkuseiPhaseUINew';
import ItemUsePhaseUI from '../components/ItemUsePhaseUI';
import ShikenPhaseUI from '../components/ShikenPhaseUI';
import ExamResultDisplay from '../components/ExamResultDisplay';
import ItemUseResultModal from '../components/ItemUseResultModal';

import mentorStyles from '../styles/Home.module.css';
import { STATUS_TYPE } from '../data/abilityCards';
import { allAbilityCards as allCardDataMap, generateUniqueCardInstanceId, resetUniqueCardInstanceIdCounter as resetCardIdCounter } from '../utils/cardUtils';
import { EXAM_SETTINGS, EXAMINER_EVALUATION_WEIGHT, getInitialExaminerState as getBaseInitialExaminerState } from '../data/initialGameState';
import { allEvents, EVENT_CHOICE_TYPE } from '../data/events';
import { allItems, ITEM_TYPE } from '../data/items';

const TutorialMentorSelectionCard = ({ mentor, onSelect, isDisabled }) => {
  return (
    <div
      id={`mentor_card_${mentor.id}`}
      className={`${mentorStyles.card} ${isDisabled ? 'tutorial-disabled' : ''}`}
      onClick={isDisabled ? undefined : () => onSelect(mentor)}
      style={{ cursor: isDisabled ? 'default' : 'pointer' }}
    >
      <h2>{mentor.name}</h2>
      <p>{mentor.description}</p>
    </div>
  );
};

export default function TutorialPage() {
  const router = useRouter();

  const {
    currentTutorialStep,
    showNextButton,
    nextButtonText,
    targetElementId: originalTargetElementId,
    targetItemBaseId,
    isTutorialActionAllowed,
    completeTutorialStep,
  } = useTutorialLogic();

  const {
    playerState, setPlayerState,
    examiners, setExaminers,
    gameState, setGameState,
    currentIkuseiRound, setCurrentIkuseiRound,
    currentExamRound, setCurrentExamRound,
    currentExamScore, setCurrentExamScore,
    currentHand, setCurrentHand,
    lastRoundResult, setLastRoundResult,
    currentExamResultInfo, setCurrentExamResultInfo,
    itemUseResultMessage, setItemUseResultMessage,
    showItemUseResultModal, setShowItemUseResultModal,
    initializeGame,
  } = useGameInitialization();

  const [tutorialLastGrowth, setTutorialLastGrowth] = useState(null);
  const [tutorialCardOptions, setTutorialCardOptions] = useState([]);
  const [tutorialLastAcquiredCardId, setTutorialLastAcquiredCardId] = useState(null);
  const [tutorialIkuseiPhaseStep, setTutorialIkuseiPhaseStep] = useState('SELECT_STATUS');

  const [tutorialMentorOptions, setTutorialMentorOptions] = useState([]);
  const [selectedTutorialMentor, setSelectedTutorialMentor] = useState(null);
  const [showConfirmMentorModalTutorial, setShowConfirmMentorModalTutorial] = useState(false);

  const [tutorialIsEventActive, setTutorialIsEventActive] = useState(false);
  const [tutorialCurrentEventData, setTutorialCurrentEventData] = useState(null);
  const [tutorialEventResultInfo, setTutorialEventResultInfo] = useState(null);

  const [selectedItemIdForItemUse, setSelectedItemIdForItemUse] = useState(null);
  const [selectedExaminerNameForItemUse, setSelectedExaminerNameForItemUse] = useState(null);

  const [selectedCardInstanceIdForExam, setSelectedCardInstanceIdForExam] = useState(null);
  const [selectedExaminerNameForExam, setSelectedExaminerNameForExam] = useState(null);

  const dynamicTargetElementId = useMemo(() => {
    if (currentTutorialStep?.id === TUTORIAL_STEPS.ITEM_SELECT_ITEM_PROMPT && targetItemBaseId && playerState?.inventory?.traitChangeItems) {
      const targetInstance = playerState.inventory.traitChangeItems.find(inst => inst.id === targetItemBaseId);
      if (targetInstance) {
        return `item_button_inst_${targetInstance.instanceId}`;
      }
    }
    return originalTargetElementId;
  }, [currentTutorialStep, playerState, targetItemBaseId, originalTargetElementId]);

  const currentTutorialMessage = useMemo(() => {
    if (!currentTutorialStep) return "";
    let msg = currentTutorialStep.message;
    if (currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R1_STATUS_RESULT && tutorialLastGrowth?.growth !== undefined) {
      msg = `In Vivoが ${tutorialLastGrowth.growth.toFixed(1)} 上昇しました！\nこれはメンター『ウエツカA』のサポート効果(${tutorialLastGrowth.bonus > 0 ? '+' : ''}${tutorialLastGrowth.bonus.toFixed(1)})が含まれています。\n次はアビリティカードを獲得します。`;
    } else if (currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R2_STATUS_RESULT && tutorialLastGrowth?.growth !== undefined && tutorialLastGrowth?.status) {
        msg = `${tutorialLastGrowth.status.toUpperCase()}が ${tutorialLastGrowth.growth.toFixed(1)} 上昇しました！\n(メンター効果: ${tutorialLastGrowth.bonus.toFixed(1)})\n次はアビリティカードを獲得します。`;
    } else if ((currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R1_CARD_ACQUIRED || currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R2_CARD_ACQUIRED) && tutorialLastAcquiredCardId) {
      const cardName = allCardDataMap.get(tutorialLastAcquiredCardId)?.name || "不明なカード";
      msg = `『${cardName}』を獲得しました！\n${currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R1_CARD_ACQUIRED ? '育成ラウンド2に進みます。' : '次はイベントが発生します。'}`;
    } else if (currentTutorialStep.id === TUTORIAL_STEPS.EVENT_SCENARIO_DISPLAY && tutorialCurrentEventData) {
        msg = `イベント発生！「${tutorialCurrentEventData.name}」\n\n${tutorialCurrentEventData.scenario}`;
    } else if (currentTutorialStep.id === TUTORIAL_STEPS.EVENT_RESULT_DISPLAY && tutorialEventResultInfo) {
        if (tutorialEventResultInfo.type === 'item' && tutorialEventResultInfo.item) {
            msg = `イベント結果: アイテム「${tutorialEventResultInfo.item.name}」を入手しました！`;
        } else if (tutorialEventResultInfo.type === 'card' && tutorialEventResultInfo.name) {
            msg = `イベント結果: カード「${tutorialEventResultInfo.name}」を入手しました！`;
        } else { msg = "イベント結果: 特に何も起こらなかった。"; }
    } else if (currentTutorialStep.id === TUTORIAL_STEPS.EXAM_ROUND_RESULT_DISPLAY && lastRoundResult) {
        msg = `カード「${lastRoundResult.playedCardName}」を ${lastRoundResult.targetExaminerName} に使用しました。\n`;
        if (lastRoundResult.examinerResults && lastRoundResult.examinerResults.length > 0) {
            lastRoundResult.examinerResults.forEach(r => {
                msg += `${r.name}: 満足度 ${r.oldSatisfaction.toFixed(1)} → ${r.newSatisfaction.toFixed(1)} (${r.satisfactionIncrease >= 0 ? '+' : ''}${r.satisfactionIncrease.toFixed(1)})\n`;
            });
        } else { msg += "特に満足度の変化はありませんでした。\n"; }
        msg += `このターンで総評価 ${lastRoundResult.totalEvaluationGainedThisTurn} を獲得！`;
    } else if (currentTutorialStep.id === TUTORIAL_STEPS.EXAM_FINAL_RESULT_PROMPT && currentExamResultInfo) {
        msg = `${currentExamResultInfo.examName} 終了！\n結果: ${currentExamResultInfo.isClear ? 'ノルマ達成！' : 'ノルマ未達成...'}\n獲得スコア: ${currentExamResultInfo.achievedScore} / ノルマ: ${currentExamResultInfo.normaScore}`;
    }
    return msg;
  }, [currentTutorialStep, tutorialLastGrowth, tutorialLastAcquiredCardId, tutorialCurrentEventData, tutorialEventResultInfo, itemUseResultMessage, lastRoundResult, currentExamResultInfo]);

  useEffect(() => {
    if (!currentTutorialStep) return;
    if (currentTutorialStep.id === TUTORIAL_STEPS.START && !playerState) { resetCardIdCounter(); }
    if (currentTutorialStep.id === TUTORIAL_STEPS.MENTOR_SELECT_PROMPT && tutorialMentorOptions.length === 0) { const fixedOptions = [allMentorsData.find(m => m.id === 'uetsuka_a'), allMentorsData.find(m => m.id === 'uetsuka_b'), allMentorsData.find(m => m.id === 'uetsuka_c')].filter(Boolean); setTutorialMentorOptions(fixedOptions); }
    if ((currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R1_STATUS_PROMPT || currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R2_STATUS_PROMPT) && playerState) { setGameState('育成'); setTutorialIkuseiPhaseStep('SELECT_STATUS'); setTutorialIsEventActive(false); setTutorialCurrentEventData(null); setTutorialEventResultInfo(null); if (currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R1_STATUS_PROMPT) { setCurrentIkuseiRound(0); } else if (currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R2_STATUS_PROMPT) { setCurrentIkuseiRound(1); setTutorialLastGrowth(null); setTutorialLastAcquiredCardId(null); } }
    if ((currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R1_CARD_PROMPT || currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R2_CARD_PROMPT) && playerState) { if (currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R1_CARD_PROMPT) { setTutorialCardOptions(['ii_発現誘導実験', 'uhn_ＰＣＲ反応', 'uhn_アライメント']); } else if (currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R2_CARD_PROMPT) { setTutorialCardOptions(['kigai_Echo', 'ii_祖先配列推定', 'uhn_キムワイプ']); } setTutorialIkuseiPhaseStep('SELECT_CARD'); }
    if ((currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R1_CARD_ACQUIRED || currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R2_CARD_ACQUIRED) && playerState) { setTutorialIkuseiPhaseStep('SHOW_ACQUISITION'); }
    if (currentTutorialStep.id === TUTORIAL_STEPS.EVENT_SCENARIO_DISPLAY && !tutorialCurrentEventData) { const fixedEvent = allEvents.find(event => event.id === 'event_001'); if (fixedEvent) { setTutorialCurrentEventData(fixedEvent); setTutorialIsEventActive(true); setTutorialIkuseiPhaseStep('EVENT_SCENARIO'); } else { console.error("Tutorial Error: Fixed event 'event_001' not found."); completeTutorialStep({ error: 'event_not_found'}); } }
    if (currentTutorialStep.id === TUTORIAL_STEPS.EVENT_CHOICE_PROMPT && tutorialIsEventActive) { setTutorialIkuseiPhaseStep('EVENT_CHOICES'); }
    if (currentTutorialStep.id === TUTORIAL_STEPS.EVENT_RESULT_DISPLAY && tutorialIsEventActive) { setTutorialIkuseiPhaseStep('EVENT_RESULT'); }
    if (currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_END_TRANSITION_PROMPT && playerState) { setGameState('育成'); setTutorialIkuseiPhaseStep('FORCED_EXAM_TRANSITION'); setTutorialIsEventActive(false); setTutorialCurrentEventData(null); }
    if (currentTutorialStep.id === TUTORIAL_STEPS.ITEM_USE_PHASE_PROMPT) { setGameState('ITEM_USE_BEFORE_EXAM'); setTutorialIsEventActive(false); const initialTutorialExaminers = getBaseInitialExaminerState().map(ex => { let preferredStatus = STATUS_TYPE.IN_SILICO; if (ex.name === '教授') preferredStatus = STATUS_TYPE.IN_VITRO; else if (ex.name === '講師') preferredStatus = STATUS_TYPE.IN_VIVO; const examSetting = EXAM_SETTINGS[0]; return { ...ex, satisfaction: 0, maxSatisfaction: examSetting.maxSatisfactionPerExaminer, preferredStatus: preferredStatus, preferredStatusMultiplier: 2, achievedEvaluationMilestones: {} }; }); setExaminers(initialTutorialExaminers); setSelectedItemIdForItemUse(null); setSelectedExaminerNameForItemUse(null); if (showItemUseResultModal) setShowItemUseResultModal(false); }
    if (currentTutorialStep.id === TUTORIAL_STEPS.EXAM_PHASE_PROMPT && playerState) { if (showItemUseResultModal) { setShowItemUseResultModal(false); setItemUseResultMessage(''); } setGameState('試験'); setCurrentExamRound(0); setCurrentExamScore(0); setLastRoundResult(null); setCurrentExamResultInfo(null); const fixedHandBaseIds = ['ii_発現誘導実験', 'initial_培地調製', 'initial_濃度計算']; const fixedHandInstances = fixedHandBaseIds.map(baseId => ({ baseId: baseId, instanceId: generateUniqueCardInstanceId(), isInitial: !!allCardDataMap.get(baseId)?.isInitial })); setCurrentHand(fixedHandInstances); if (playerState.usedAdditionalCardsThisExam) setPlayerState(p => ({ ...p, usedAdditionalCardsThisExam: [] })); setSelectedCardInstanceIdForExam(null); setSelectedExaminerNameForExam(null); }
    if (currentTutorialStep.id === TUTORIAL_STEPS.EXAM_FINAL_RESULT_PROMPT && !currentExamResultInfo && playerState) { const examSetting = EXAM_SETTINGS[0]; const norma = examSetting.normaScore; const isClear = currentExamScore >= norma; setCurrentExamResultInfo({ examName: examSetting.name, achievedScore: currentExamScore, normaScore: norma, isClear: isClear, isGameClear: false, isGameOver: !isClear, finalTotalScore: playerState.totalScore + currentExamScore, }); setGameState('EXAM_RESULT_DISPLAY'); }
  }, [currentTutorialStep, playerState, tutorialMentorOptions.length, setGameState, setExaminers, setCurrentHand, setPlayerState, initializeGame, currentIkuseiRound, setCurrentIkuseiRound, tutorialCurrentEventData, tutorialIsEventActive, currentExamScore, currentExamResultInfo, showItemUseResultModal, setShowItemUseResultModal, completeTutorialStep, targetItemBaseId, setItemUseResultMessage]);

  const handleTutorialNextButtonClick = () => {
    const currentActionType = currentTutorialStep?.allowedActions?.[0]?.type;
    if (isTutorialActionAllowed(currentActionType || 'TUTORIAL_NEXT_BUTTON')) {
      if (currentTutorialStep?.id === TUTORIAL_STEPS.END || currentTutorialStep?.id === TUTORIAL_STEPS.EXAM_FINAL_RESULT_PROMPT) { router.push('/'); return; }
      if (currentTutorialStep?.id === TUTORIAL_STEPS.MENTOR_CONFIRM_A) { if (selectedTutorialMentor) { initializeGame([selectedTutorialMentor.id], 'tutorial'); completeTutorialStep({ action: 'proceed_to_ikusei' }); } return; }
      if (currentTutorialStep?.id === TUTORIAL_STEPS.EVENT_RESULT_DISPLAY) { setTutorialIsEventActive(false); setTutorialCurrentEventData(null); }
      completeTutorialStep({ action: 'next_button' });
    }
  };

  const handleTutorialMentorSelect = (mentor) => { if (isTutorialActionAllowed('CLICK_ELEMENT', { elementId: `mentor_card_${mentor.id}`, expectedData: mentor.id })) { setSelectedTutorialMentor(mentor); setShowConfirmMentorModalTutorial(true); } };
  const confirmTutorialMentorAndProceed = useCallback(() => { setShowConfirmMentorModalTutorial(false); if (selectedTutorialMentor) { completeTutorialStep({ mentorId: selectedTutorialMentor.id }); } }, [selectedTutorialMentor, completeTutorialStep]);
  const handleTutorialStatusSelect = useCallback((status) => { if (isTutorialActionAllowed('SELECT_STATUS', { status })) { let growthAmount = 0; if (currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R1_STATUS_PROMPT) { growthAmount = 5.0; } else if (currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R2_STATUS_PROMPT) { growthAmount = 4.0; } let mentorBonus = 0; let probabilityBonusTriggered = false; if (status === STATUS_TYPE.IN_VIVO && playerState?.selectedMentors.find(m => m.id === 'uetsuka_a')) { const mentor = playerState.selectedMentors.find(m => m.id === 'uetsuka_a'); if (mentor && mentor.statusBonus && typeof mentor.statusBonus[STATUS_TYPE.IN_VIVO] === 'number') { mentorBonus = growthAmount * mentor.statusBonus[STATUS_TYPE.IN_VIVO];}} const totalGrowth = growthAmount + mentorBonus; setTutorialLastGrowth({ status, growth: totalGrowth, baseGrowth: growthAmount, bonus: mentorBonus, probabilityBonusTriggered }); if (playerState) { const currentStatVal = playerState.stats[status] || 0; const newStats = { ...playerState.stats, [status]: parseFloat((currentStatVal + totalGrowth).toFixed(1)) }; setPlayerState(p => ({ ...p, stats: newStats })); } setTutorialIkuseiPhaseStep('SHOW_GROWTH'); completeTutorialStep({ status, growth: totalGrowth }); } }, [isTutorialActionAllowed, completeTutorialStep, playerState, setPlayerState, currentTutorialStep]);
  const handleTutorialCardAcquire = useCallback((cardId) => { if (isTutorialActionAllowed('SELECT_CARD', { cardId })) { setTutorialLastAcquiredCardId(cardId); if (playerState) { const newCardInstance = { baseId: cardId, instanceId: generateUniqueCardInstanceId() }; setPlayerState(p => ({ ...p, additionalDeck: [...(p.additionalDeck || []), newCardInstance] })); } completeTutorialStep({ cardId }); } }, [isTutorialActionAllowed, completeTutorialStep, playerState, setPlayerState]);
  const handleTutorialEventChoice = useCallback((choice) => { if (isTutorialActionAllowed('EVENT_CHOICE', { choiceType: choice.type })) { let resultName = ''; let acquiredItemFull = null; let acquiredItemInstance = null; if (choice.type === EVENT_CHOICE_TYPE.RANDOM_ITEM_TRAIT_CHANGE) { acquiredItemFull = allItems['trait_change_vivo']; if (acquiredItemFull) { acquiredItemInstance = { id: acquiredItemFull.id, instanceId: generateUniqueCardInstanceId() }; setPlayerState(p => { const currentItems = p.inventory?.traitChangeItems || []; const newInventoryItems = [...currentItems, acquiredItemInstance]; return { ...p, inventory: { ...(p.inventory || {}), traitChangeItems: newInventoryItems } }; }); resultName = acquiredItemFull.name; } else { resultName = '目的のアイテムが見つかりませんでした。'; } setTutorialEventResultInfo({ type: 'item', name: resultName, item: acquiredItemFull }); } else if (choice.type === EVENT_CHOICE_TYPE.RANDOM_CARD) { const fixedCardId = 'uhn_キムワイプ'; const cardData = allCardDataMap.get(fixedCardId); if (cardData) { const newCardInstance = { baseId: fixedCardId, instanceId: generateUniqueCardInstanceId() }; setPlayerState(p => ({ ...p, additionalDeck: [...(p.additionalDeck || []), newCardInstance] })); resultName = cardData.name; } else { resultName = '獲得できるカードがありませんでした。'; } setTutorialEventResultInfo({ type: 'card', name: resultName, item: null });} completeTutorialStep({ choiceType: choice.type, resultName }); } }, [isTutorialActionAllowed, completeTutorialStep, setPlayerState]);
  const handleCloseTutorialEvent = useCallback(() => { setTutorialIsEventActive(false); }, []);
  const handleTutorialSelectItem = useCallback((itemInstanceId) => { const itemInstance = playerState?.inventory?.traitChangeItems.find(i => i.instanceId === itemInstanceId); if (itemInstance && isTutorialActionAllowed('SELECT_ITEM', { itemBaseId: itemInstance.id } )) { setSelectedItemIdForItemUse(itemInstanceId); completeTutorialStep({ itemInstanceId, itemBaseId: itemInstance.id }); } }, [isTutorialActionAllowed, completeTutorialStep, playerState]);
  const handleTutorialSelectExaminerForItem = useCallback((examinerName) => { if (isTutorialActionAllowed('SELECT_EXAMINER_FOR_ITEM', { examinerName })) { setSelectedExaminerNameForItemUse(examinerName); completeTutorialStep({ examinerName }); } }, [isTutorialActionAllowed, completeTutorialStep]);
  const handleTutorialConfirmItemUse = useCallback(() => { const itemInstance = playerState?.inventory?.traitChangeItems.find(inst => inst.instanceId === selectedItemIdForItemUse); if (itemInstance && selectedExaminerNameForItemUse && isTutorialActionAllowed('CONFIRM_ITEM_USE', { itemId: itemInstance.id, examinerName: selectedExaminerNameForItemUse })) { const itemBaseData = allItems[itemInstance.id]; const targetExIndex = examiners.findIndex(ex => ex.name === selectedExaminerNameForItemUse); if (itemBaseData && targetExIndex !== -1 && itemBaseData.type === ITEM_TYPE.TRAIT_CHANGE) { const updatedExaminers = examiners.map((ex, index) => index === targetExIndex ? { ...ex, preferredStatus: itemBaseData.targetStatus } : ex ); setExaminers(updatedExaminers); if (playerState?.inventory?.traitChangeItems) { const itemIndexToRemove = playerState.inventory.traitChangeItems.findIndex(inst => inst.instanceId === selectedItemIdForItemUse); if (itemIndexToRemove > -1) { const newItems = [...playerState.inventory.traitChangeItems]; newItems.splice(itemIndexToRemove, 1); setPlayerState(p => ({ ...p, inventory: { ...p.inventory, traitChangeItems: newItems }})); } } setItemUseResultMessage(`${selectedExaminerNameForItemUse}の評価しやすいステータスが「${itemBaseData.targetStatus}」に変更されました。`); } else { setItemUseResultMessage("アイテムの使用に失敗しました。"); } setShowItemUseResultModal(true); /* completeTutorialStepはモーダルクローズ時に */ } }, [selectedItemIdForItemUse, selectedExaminerNameForItemUse, isTutorialActionAllowed, examiners, setExaminers, playerState, setPlayerState, setItemUseResultMessage, setShowItemUseResultModal]);
  const handleCloseItemUseResultModal = useCallback(() => { setShowItemUseResultModal(false); setItemUseResultMessage(''); if (currentTutorialStep.id === TUTORIAL_STEPS.ITEM_CONFIRM_USE_PROMPT) { completeTutorialStep({ action: 'item_use_modal_closed_proceed_to_exam' }); } }, [setShowItemUseResultModal, setItemUseResultMessage, currentTutorialStep, completeTutorialStep]);
  const handleTutorialSelectExaminerForCard = useCallback((examinerName) => { if (isTutorialActionAllowed('SELECT_EXAMINER_FOR_CARD', { examinerName })) { setSelectedExaminerNameForExam(examinerName); completeTutorialStep({ examinerName }); } }, [isTutorialActionAllowed, completeTutorialStep]);
  const handleTutorialSelectHandCard = useCallback((cardInstanceId) => { const cardInstance = currentHand.find(c => c.instanceId === cardInstanceId); if (cardInstance && isTutorialActionAllowed('SELECT_HAND_CARD', { cardId: cardInstance.baseId })) { setSelectedCardInstanceIdForExam(cardInstanceId); completeTutorialStep({ cardId: cardInstance.baseId }); } }, [currentHand, isTutorialActionAllowed, completeTutorialStep]);
  const handleTutorialConfirmCardPlay = useCallback(() => { const cardInstance = currentHand.find(c => c.instanceId === selectedCardInstanceIdForExam); if (cardInstance && selectedExaminerNameForExam && isTutorialActionAllowed('CONFIRM_CARD_PLAY', { cardId: cardInstance.baseId, examinerName: selectedExaminerNameForExam })) { const cardData = allCardDataMap.get(cardInstance.baseId); if (!cardData || !playerState || !examiners) return; let satisfactionIncrease = 0; let evaluationGained = 0; const targetExaminerIndex = examiners.findIndex(e => e.name === selectedExaminerNameForExam); if (targetExaminerIndex === -1) return; const originalExaminer = examiners[targetExaminerIndex]; const playerInVivo = playerState.stats[STATUS_TYPE.IN_VIVO] || 0; if (cardData.id === 'ii_発現誘導実験' && originalExaminer.name === '教授') { const multiplier = (originalExaminer.preferredStatus === STATUS_TYPE.IN_VIVO ? originalExaminer.preferredStatusMultiplier : 1); satisfactionIncrease = playerInVivo * 1.5 * multiplier; satisfactionIncrease = parseFloat(satisfactionIncrease.toFixed(1)); const tempNewSatisfaction = originalExaminer.satisfaction + satisfactionIncrease; const normaPercentage33 = Math.floor(originalExaminer.maxSatisfaction * 0.33); if (EXAMINER_EVALUATION_WEIGHT['教授']?.satisfactionThresholds?.['33'] && originalExaminer.satisfaction < normaPercentage33 && tempNewSatisfaction >= normaPercentage33 && !originalExaminer.achievedEvaluationMilestones['33']) { evaluationGained = EXAMINER_EVALUATION_WEIGHT['教授'].satisfactionThresholds['33']; } } const updatedExaminers = [...examiners]; const newSatisfaction = Math.min(originalExaminer.maxSatisfaction, parseFloat((originalExaminer.satisfaction + satisfactionIncrease).toFixed(1))); updatedExaminers[targetExaminerIndex] = { ...originalExaminer, satisfaction: newSatisfaction, achievedEvaluationMilestones: evaluationGained > 0 ? { ...originalExaminer.achievedEvaluationMilestones, '33': true } : originalExaminer.achievedEvaluationMilestones }; setExaminers(updatedExaminers); const newScore = currentExamScore + evaluationGained; setCurrentExamScore(newScore); setLastRoundResult({ playedCardName: cardData.name, targetExaminerName: selectedExaminerNameForExam, examinerResults: [{ name: selectedExaminerNameForExam, satisfactionIncrease: satisfactionIncrease, oldSatisfaction: originalExaminer.satisfaction, newSatisfaction: newSatisfaction, evaluationGained: evaluationGained, }], totalEvaluationGainedThisTurn: evaluationGained }); if (!cardInstance.isInitial && playerState.usedAdditionalCardsThisExam) { setPlayerState(p => ({ ...p, usedAdditionalCardsThisExam: [...p.usedAdditionalCardsThisExam, cardInstance.instanceId] })); } setSelectedCardInstanceIdForExam(null); completeTutorialStep({ cardId: cardInstance.baseId, examinerName: selectedExaminerNameForExam, evaluationGained }); } }, [selectedCardInstanceIdForExam, selectedExaminerNameForExam, currentHand, examiners, playerState, isTutorialActionAllowed, completeTutorialStep, setExaminers, currentExamScore, setCurrentExamScore, setLastRoundResult, setPlayerState]);
  const handleProceedFromTutorialExamResult = useCallback(() => { if (currentTutorialStep.id === TUTORIAL_STEPS.EXAM_FINAL_RESULT_PROMPT) { completeTutorialStep({action: 'exam_result_proceed'}); } }, [currentTutorialStep, completeTutorialStep]);

  if (!currentTutorialStep) { return <div>チュートリアルを読み込み中...</div>; }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: 'auto' }}>
      <Head><title>研究者育成ゲーム - チュートリアル</title></Head>
      {currentTutorialStep.id !== TUTORIAL_STEPS.END && <h2 style={{textAlign: 'center', marginBottom: '10px', fontSize: '1.2em', color: 'crimson'}}>チュートリアル進行中</h2>}

      {currentTutorialStep.id === TUTORIAL_STEPS.MENTOR_SELECT_PROMPT && ( <div className={mentorStyles.main} style={{ padding: '10px', margin: '10px 0' }}> <h3 style={{textAlign: 'center'}}>メンターを選択</h3> <div className={mentorStyles.grid}> {tutorialMentorOptions.map((mentor) => ( <TutorialMentorSelectionCard key={mentor.id} mentor={mentor} onSelect={handleTutorialMentorSelect} isDisabled={dynamicTargetElementId !== `mentor_card_${mentor.id}`} /> ))} </div> </div> )}
      {showConfirmMentorModalTutorial && selectedTutorialMentor && ( <ConfirmMentorModal mentor={selectedTutorialMentor} onConfirm={confirmTutorialMentorAndProceed} onCancel={() => setShowConfirmMentorModalTutorial(false)} step={1} /> )}

      {playerState && currentTutorialStep.id !== TUTORIAL_STEPS.START && currentTutorialStep.id !== TUTORIAL_STEPS.MENTOR_SELECT_PROMPT && ( <> <PlayerStatusDisplay playerState={playerState} /> {playerState.selectedMentors.length > 0 && <MentorInfoDisplay mentors={playerState.selectedMentors} />} </> )}

      {playerState && gameState === '育成' && ( <IkuseiPhaseUINew playerState={playerState} currentIkuseiRoundTotal={currentIkuseiRound} step={tutorialIkuseiPhaseStep} lastGrowth={tutorialLastGrowth} options={tutorialCardOptions.map(id => allCardDataMap.get(id)).filter(Boolean)} lastAcquired={tutorialLastAcquiredCardId ? allCardDataMap.get(tutorialLastAcquiredCardId) : null} onStatusSelect={handleTutorialStatusSelect} onProceedToCardSelection={() => { if (currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R1_STATUS_RESULT || currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R2_STATUS_RESULT) completeTutorialStep();}} onCardAcquire={handleTutorialCardAcquire} onProceedToNextRoundOrEvent={() => { if (currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R1_CARD_ACQUIRED || currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_R2_CARD_ACQUIRED || currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_END_TRANSITION_PROMPT) completeTutorialStep();}} isEventActive={tutorialIsEventActive} currentEvent={tutorialCurrentEventData} onEventChoice={handleTutorialEventChoice} eventResult={tutorialEventResultInfo} onCloseEvent={handleCloseTutorialEvent} setIkuseiPhaseStep={setTutorialIkuseiPhaseStep} onConfirmForcedExamTransition={() => { if (currentTutorialStep.id === TUTORIAL_STEPS.IKUSEI_END_TRANSITION_PROMPT) completeTutorialStep({ action: 'confirmed_ikusei_end_from_uibutton_if_used' });}} tutorialControl={{ targetElementId: dynamicTargetElementId }} /> )}

      {playerState && gameState === 'ITEM_USE_BEFORE_EXAM' && examiners && examiners.length > 0 && (
        <ItemUsePhaseUI playerState={playerState} examiners={examiners} onItemSelect={handleTutorialSelectItem} onExaminerSelect={handleTutorialSelectExaminerForItem} onConfirmItemUse={handleTutorialConfirmItemUse} onSkipItemUse={() => { if (currentTutorialStep.id === TUTORIAL_STEPS.ITEM_CONFIRM_USE_PROMPT) completeTutorialStep({action: 'skip_item_use'});}} selectedItemId={selectedItemIdForItemUse} selectedExaminerName={selectedExaminerNameForItemUse} tutorialControl={{ targetElementId: dynamicTargetElementId }} />
      )}
      {showItemUseResultModal && ( <ItemUseResultModal message={itemUseResultMessage} onClose={handleCloseItemUseResultModal} /> )}

      {playerState && gameState === '試験' && examiners && examiners.length > 0 && currentHand && currentHand.length > 0 && (
        <ShikenPhaseUI playerState={playerState} examiners={examiners} currentExamSettings={EXAM_SETTINGS[0]} currentExamRound={currentExamRound} hand={currentHand} onExaminerSelect={handleTutorialSelectExaminerForCard} onCardSelect={handleTutorialSelectHandCard} onPlayCard={handleTutorialConfirmCardPlay} currentExamScore={currentExamScore} lastRoundResultData={lastRoundResult} onProceedFromRoundResult={() => { if (currentTutorialStep.id === TUTORIAL_STEPS.EXAM_ROUND_RESULT_DISPLAY) completeTutorialStep();}} selectedCardInstanceId={selectedCardInstanceIdForExam} selectedExaminerName={selectedExaminerNameForExam} tutorialControl={{ targetElementId: dynamicTargetElementId }} />
      )}
      {gameState === 'EXAM_RESULT_DISPLAY' && currentExamResultInfo && ( <ExamResultDisplay resultInfo={currentExamResultInfo} onProceed={handleProceedFromTutorialExamResult} /> )}

      <TutorialMessage message={currentTutorialMessage} onNext={showNextButton ? handleTutorialNextButtonClick : undefined} nextButtonText={nextButtonText} showNextButton={showNextButton} />
    </div>
  );
}