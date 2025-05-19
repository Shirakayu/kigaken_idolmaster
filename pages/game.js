// pages/game.js
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { EXAM_SETTINGS, TOTAL_EXAMS } from '../data/initialGameState';

import PlayerStatusDisplay from '../components/PlayerStatusDisplay';
import MentorInfoDisplay from '../components/MentorInfoDisplay';
import IkuseiPhaseUINew from '../components/IkuseiPhaseUINew';
import ShikenPhaseUI from '../components/ShikenPhaseUI';
import ItemUseResultModal from '../components/ItemUseResultModal';
import ItemUsePhaseUI from '../components/ItemUsePhaseUI';
import ExamResultDisplay from '../components/ExamResultDisplay';

import { useGameInitialization } from '../hooks/useGameInitialization';
import { useIkuseiLogic } from '../hooks/useIkuseiLogic';
import { useEventLogic } from '../hooks/useEventLogic';
import { useShikenLogic } from '../hooks/useShikenLogic';

import {
    allAbilityCards,
    useCardPoolsByRarity,
} from '../utils/cardUtils';


// --- Main Game Component ---
export default function GamePage() {
  const router = useRouter();

  const {
    playerState, setPlayerState,
    examiners, setExaminers,
    gameState, setGameState,
    currentIkuseiRound, setCurrentIkuseiRound,
    currentExamRound, setCurrentExamRound,
    currentExamScore, setCurrentExamScore,
    currentHand, setCurrentHand,
    lastRoundResult, setLastRoundResult,
    pendingExamUpdateRef,
    currentExamResultInfo, setCurrentExamResultInfo,
    itemUseResultMessage, setItemUseResultMessage,
    showItemUseResultModal, setShowItemUseResultModal,
    examBuffs, setExamBuffs,
    initializeGame,
  } = useGameInitialization();

  // 試験フェイズでのカード選択と試験官選択のためのstate
  const [selectedExamCardInstanceId, setSelectedExamCardInstanceId] = useState(null);
  const [selectedExamExaminerName, setSelectedExamExaminerName] = useState(null);


  const cardPoolsByRarity = useCardPoolsByRarity();
  const initialDeckCardIds = useMemo(() => {
    if (allAbilityCards && allAbilityCards.size > 0) {
        return Array.from(allAbilityCards.values()).filter(c => c.isInitial).map(c => c.id);
    }
    return [];
  }, []);


  const ikuseiLogicHookInstanceRef = useRef(null);

  const eventLogicHook = useEventLogic(
    playerState,
    setPlayerState,
    cardPoolsByRarity,
    () => ikuseiLogicHookInstanceRef.current?.proceedAfterEvent()
  );
  const {
    isEventActive,
    currentEventData,
    eventResultInfo,
    eventUiStep,
    setEventUiStep,
    tryTriggerRandomEvent,
    handleEventChoice,
    closeEvent,
  } = eventLogicHook;

  const ikuseiLogicResult = useIkuseiLogic(
    playerState,
    setPlayerState,
    currentIkuseiRound,
    setCurrentIkuseiRound,
    isEventActive,
    tryTriggerRandomEvent
  );
  const {
    ikuseiPhaseStep,
    setIkuseiPhaseStep,
    lastGrowthInfo,
    cardOptions,
    lastAcquiredCardId,
    handleStatusSelect,
    proceedToCardSelection,
    handleCardAcquire,
    triggerNextIkuseiStep,
    resetIkuseiStateForExam,
  } = ikuseiLogicResult;

  useEffect(() => {
    ikuseiLogicHookInstanceRef.current = ikuseiLogicResult;
  }, [ikuseiLogicResult]);

  const shikenLogic = useShikenLogic(
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
  );
  const {
    prepareExaminersForNewExam,
    preparePlayerForExam,
    handleCardPlay: originalShikenHandleCardPlay,
    proceedToNextExamRoundOrEndExam,
    handleProceedFromExamResult,
    handleItemUse, // ★ これを ItemUsePhaseUI に渡す
    closeItemUseResultModal,
    skipItemUseAndProceedToExam,
  } = shikenLogic;

  // 試験フェイズのカードプレイ実行ハンドラ
  const executeExamCardPlay = useCallback(() => {
    if (selectedExamCardInstanceId && selectedExamExaminerName) {
      originalShikenHandleCardPlay(selectedExamCardInstanceId, selectedExamExaminerName);
      // 選択のリセットは useEffect で行うか、shikenLogic内で行う
    }
  }, [selectedExamCardInstanceId, selectedExamExaminerName, originalShikenHandleCardPlay]);

  // 試験フェイズでカードが選択されたときのハンドラ
  const handleExamCardSelect = useCallback((instanceId) => {
    if (lastRoundResult) return;
    setSelectedExamCardInstanceId(instanceId);
  }, [lastRoundResult]);

  // 試験フェイズで試験官が選択されたときのハンドラ
  const handleExamExaminerSelect = useCallback((examinerName) => {
    if (lastRoundResult) return;
    setSelectedExamExaminerName(examinerName);
  }, [lastRoundResult]);

  // 手札更新時やラウンド結果表示時に選択をリセット
  useEffect(() => {
    if (gameState === '試験') {
      if (lastRoundResult) {
        setSelectedExamCardInstanceId(null);
        setSelectedExamExaminerName(null);
      } else if (currentHand.length > 0 && !currentHand.find(card => card.instanceId === selectedExamCardInstanceId)) {
        setSelectedExamCardInstanceId(null);
      }
    }
  }, [currentHand, lastRoundResult, gameState, selectedExamCardInstanceId]);


  const handleConfirmForcedExamTransition = useCallback(() => {
    if (gameState !== '育成' || !playerState) return;
    resetIkuseiStateForExam();
    if (isEventActive && closeEvent) {
      closeEvent();
    }
    prepareExaminersForNewExam();
    setGameState('ITEM_USE_BEFORE_EXAM');
  }, [gameState, playerState, resetIkuseiStateForExam, setGameState, isEventActive, closeEvent, prepareExaminersForNewExam]);

  const proceedToExamPhase = useCallback(() => {
    preparePlayerForExam();
    setSelectedExamCardInstanceId(null);
    setSelectedExamExaminerName(null);
    setGameState('試験');
  }, [preparePlayerForExam, setGameState]);


  if (gameState === 'LOADING' || !playerState) {
    return <div style={{ padding: '20px', fontSize: '1.5em' }}>ゲームをロード中... (State: {gameState})</div>;
  }

  const displayIkuseiStep = isEventActive ? eventUiStep : ikuseiPhaseStep;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: 'auto' }}>
      <Head><title>研究者育成ゲーム (プロトタイプ)</title></Head>
      <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1000 }}>
        <Link href="/" legacyBehavior><a style={{ padding: '8px 15px', backgroundColor: '#f0f0f0', color: 'black', border: '1px solid #ccc', borderRadius: '5px', textDecoration: 'none', fontSize: '0.9em' }}>タイトルへ戻る (リセット)</a></Link>
      </div>
      <h1 style={{textAlign: 'center', marginBottom: '20px'}}>研究者育成ゲーム</h1>

      <PlayerStatusDisplay playerState={playerState} />
      {playerState.selectedMentors.length > 0 && <MentorInfoDisplay mentors={playerState.selectedMentors} />}

      {gameState === '育成' && (
        <IkuseiPhaseUINew
          playerState={playerState}
          currentIkuseiRoundTotal={currentIkuseiRound}
          step={displayIkuseiStep}
          lastGrowth={lastGrowthInfo}
          options={cardOptions.map(id => allAbilityCards.get(id)).filter(Boolean)}
          lastAcquired={lastAcquiredCardId ? allAbilityCards.get(lastAcquiredCardId) : null}
          onStatusSelect={handleStatusSelect}
          onProceedToCardSelection={proceedToCardSelection}
          onCardAcquire={handleCardAcquire}
          onProceedToNextRoundOrEvent={triggerNextIkuseiStep}
          onConfirmForcedExamTransition={handleConfirmForcedExamTransition}
          isEventActive={isEventActive}
          currentEvent={currentEventData}
          onEventChoice={handleEventChoice}
          eventResult={eventResultInfo}
          onCloseEvent={closeEvent}
          setIkuseiPhaseStep={isEventActive ? setEventUiStep : setIkuseiPhaseStep}
          // tutorialControl は渡さない (通常プレイのため)
        />
      )}

      {gameState === 'ITEM_USE_BEFORE_EXAM' && playerState && (
        <ItemUsePhaseUI
            playerState={playerState}
            examiners={examiners}
            onItemUse={handleItemUse} // ★ useShikenLogic から取得した handleItemUse を渡す
            onSkipItemUse={() => skipItemUseAndProceedToExam(proceedToExamPhase)}
            // チュートリアル用の onItemSelect, onExaminerSelect, onConfirmItemUse,
            // selectedItemId, selectedExaminerName, tutorialControl は渡さない
        />
      )}
      {gameState === '試験' && playerState && EXAM_SETTINGS[playerState.currentExamIndex] && !currentExamResultInfo && (
        <ShikenPhaseUI
            playerState={playerState}
            examiners={examiners}
            currentExamSettings={EXAM_SETTINGS[playerState.currentExamIndex]}
            currentExamRound={currentExamRound}
            hand={currentHand}
            onExaminerSelect={handleExamExaminerSelect}
            onCardSelect={handleExamCardSelect}
            onPlayCard={executeExamCardPlay}
            currentExamScore={currentExamScore}
            lastRoundResultData={lastRoundResult}
            onProceedFromRoundResult={proceedToNextExamRoundOrEndExam}
            selectedCardInstanceId={selectedExamCardInstanceId}
            selectedExaminerName={selectedExamExaminerName}
            // tutorialControl は渡さない
        />
      )}
      {gameState === 'EXAM_RESULT_DISPLAY' && currentExamResultInfo && (
        <ExamResultDisplay
            resultInfo={currentExamResultInfo}
            onProceed={handleProceedFromExamResult}
        />
      )}
      {(gameState === 'RESULT_CLEAR' || gameState === 'RESULT_GAMEOVER') && (
        <div style={{ border: '2px solid gold', padding: '20px', marginTop: '20px', textAlign: 'center' }}>
            <h2>{gameState === 'RESULT_CLEAR' ? 'ゲームクリア！' : 'ゲームオーバー...'}</h2>
            <p style={{fontSize: '1.2em'}}>最終スコア: {playerState?.totalScore ?? currentExamResultInfo?.finalTotalScore ?? 0}</p>
            <button onClick={() => router.push('/')} style={{padding: '10px 20px', fontSize: '1em', cursor: 'pointer'}}> タイトルへ戻る </button>
        </div>
      )}
      {showItemUseResultModal && ( <ItemUseResultModal message={itemUseResultMessage} onClose={closeItemUseResultModal} /> )}
    </div>
  );
}