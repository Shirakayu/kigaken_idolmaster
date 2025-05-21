// pages/game.js
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { EXAM_SETTINGS, TOTAL_EXAMS } from '../data/initialGameState'; // initialDeckCardIds のために STATUS_TYPE も必要だったが、initialDeckCardIds の取得方法変更により不要になる可能性

import PlayerStatusDisplay from '../components/PlayerStatusDisplay';
import MentorInfoDisplay from '../components/MentorInfoDisplay';
import IkuseiPhaseUINew from '../components/IkuseiPhaseUINew';
import ShikenPhaseUI from '../components/ShikenPhaseUI';
import ItemUseResultModal from '../components/ItemUseResultModal';
import ItemUsePhaseUI from '../components/ItemUsePhaseUI';
import ExamResultDisplay from '../components/ExamResultDisplay';
import DeckViewerModal from '../components/DeckViewerModal'; // ★ 新規インポート

import { useGameInitialization } from '../hooks/useGameInitialization';
import { useIkuseiLogic } from '../hooks/useIkuseiLogic';
import { useEventLogic } from '../hooks/useEventLogic';
import { useShikenLogic } from '../hooks/useShikenLogic';

import {
    allAbilityCards, // ★ allAbilityCards は直接使う
    useCardPoolsByRarity,
    // generateUniqueCardInstanceId // game.js では直接使わない想定
} from '../utils/cardUtils';
import { TARGET_TYPE } from '../data/abilityCards';
import { initialDeckCards as rawInitialDeckCardsData } from '../data/abilityCards'; // ★ 初期デッキデータを直接インポート


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

  const [selectedExamCardInstanceId, setSelectedExamCardInstanceId] = useState(null);
  const [selectedExamExaminerName, setSelectedExamExaminerName] = useState(null);

  // ★ DeckViewerModal の表示状態管理
  const [showDeckViewerModal, setShowDeckViewerModal] = useState(false);

  const cardPoolsByRarity = useCardPoolsByRarity();

  // initialDeckCardIds を直接データから取得する形に変更
  const initialDeckCardInstances = useMemo(() => {
      // 初期デッキカードはインスタンスIDを持たない (またはゲーム開始時に一意に振る) 想定
      // ここでは baseId のみを持つオブジェクトとして扱う (DeckViewerModal側で詳細取得)
      return rawInitialDeckCardsData.map(card => ({ baseId: card.id, isInitial: true }));
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
    rawInitialDeckCardsData.map(c => c.id), // shikenLogic にはIDの配列を渡す
    setItemUseResultMessage,
    setShowItemUseResultModal
  );
  const {
    prepareExaminersForNewExam,
    preparePlayerForExam,
    handleCardPlay: originalShikenHandleCardPlay,
    proceedToNextExamRoundOrEndExam,
    handleProceedFromExamResult,
    handleItemUse,
    closeItemUseResultModal,
    skipItemUseAndProceedToExam,
  } = shikenLogic;

  const executeExamCardPlay = useCallback(() => {
    if (!selectedExamCardInstanceId || !currentHand || !allAbilityCards) {
        console.warn("Card not selected or hand/cardData not available.");
        return;
    }
    const cardInstance = currentHand.find(c => c.instanceId === selectedExamCardInstanceId);
    if (!cardInstance) {
        console.warn("Selected card instance not found in hand.");
        return;
    }
    const cardData = allAbilityCards.get(cardInstance.baseId);
    if (!cardData) {
        console.warn("Card data not found for selected card.");
        return;
    }
    let targetNameToPass = null;
    if (cardData.targetType === TARGET_TYPE.SINGLE) {
      if (!selectedExamExaminerName) {
        alert("単体対象カードです。対象の試験官を選択してください。");
        console.warn("単体対象カードですが、試験官が選択されていません。");
        return;
      }
      targetNameToPass = selectedExamExaminerName;
    }
    originalShikenHandleCardPlay(selectedExamCardInstanceId, targetNameToPass);
  }, [selectedExamCardInstanceId, selectedExamExaminerName, currentHand, originalShikenHandleCardPlay]);


  const handleExamCardSelect = useCallback((instanceId) => {
    if (lastRoundResult) return;
    setSelectedExamCardInstanceId(instanceId);
  }, [lastRoundResult]);

  const handleExamExaminerSelect = useCallback((examinerName) => {
    if (lastRoundResult) return;
    setSelectedExamExaminerName(examinerName);
  }, [lastRoundResult]);

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

  // ★ DeckViewerModal 用のカードリスト生成ロジック
  const deckCardsForModal = useMemo(() => {
    if (!playerState) return [];
    if (gameState === '育成' || gameState === 'ITEM_USE_BEFORE_EXAM') { // 育成中またはアイテム使用前
      const additional = playerState.additionalDeck || [];
      return [...additional, ...initialDeckCardInstances]; // isInitial フラグがついた初期カード
    } else if (gameState === '試験') {
      const fullDeck = playerState.currentExamFullDeck || [];
      const usedIds = playerState.usedAdditionalCardsThisExam || [];
      return fullDeck.filter(cardInst => {
        if (cardInst.isInitial) return true; // 初期カードは常に山札にあるとみなす（手札に来る可能性）
        return !usedIds.includes(cardInst.instanceId);
      });
    }
    return [];
  }, [playerState, gameState, initialDeckCardInstances]);

  const usedCardsForModal = useMemo(() => {
    if (!playerState || gameState !== '試験') return []; // 試験中のみ
    const usedInstances = playerState.usedAdditionalCardsThisExam || [];
    // usedAdditionalCardsThisExam は instanceId の配列なので、
    // currentExamFullDeck から該当するインスタンスを探して返す
    return (playerState.currentExamFullDeck || []).filter(cardInst =>
        usedInstances.includes(cardInst.instanceId) && !cardInst.isInitial // 初期カードは使用済みに含めない
    );
  }, [playerState, gameState]);

  const handleOpenDeckViewer = useCallback(() => {
    setShowDeckViewerModal(true);
  }, []);

  const handleCloseDeckViewer = useCallback(() => {
    setShowDeckViewerModal(false);
  }, []);


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

      {/* ★ PlayerStatusDisplay に onOpenDeckViewer を渡す */}
      <PlayerStatusDisplay playerState={playerState} onOpenDeckViewer={handleOpenDeckViewer} />
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
        />
      )}

      {gameState === 'ITEM_USE_BEFORE_EXAM' && playerState && (
        <ItemUsePhaseUI
            playerState={playerState}
            examiners={examiners}
            onItemUse={handleItemUse}
            onSkipItemUse={() => skipItemUseAndProceedToExam(proceedToExamPhase)}
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

      {/* ★ DeckViewerModal のレンダリング */}
      <DeckViewerModal
        isOpen={showDeckViewerModal}
        onClose={handleCloseDeckViewer}
        deckCards={deckCardsForModal}
        usedCards={usedCardsForModal}
        initialTab="deck" // デフォルトで山札タブを開く
      />
    </div>
  );
}