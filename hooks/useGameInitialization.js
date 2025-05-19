// hooks/useGameInitialization.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getInitialPlayerState, getInitialExaminerState, EXAM_SETTINGS } from '../data/initialGameState'; // EXAM_SETTINGS は状況に応じて
import { mentors as allMentorsData } from '../data/mentors';
import { resetUniqueCardInstanceIdCounter } from '../utils/cardUtils';

export const useGameInitialization = () => {
  const router = useRouter();
  const [playerState, setPlayerState] = useState(null);
  const [examiners, setExaminers] = useState([]);
  const [gameState, setGameState] = useState('LOADING'); // 初期はLOADING
  const [currentIkuseiRound, setCurrentIkuseiRound] = useState(0);
  // ikuseiPhaseStep は tutorial.js や game.js で管理
  const [isEventActive, setIsEventActive] = useState(false);
  const [currentEventData, setCurrentEventData] = useState(null);
  // eventResultInfo も同様
  const [currentExamRound, setCurrentExamRound] = useState(0);
  const [currentExamScore, setCurrentExamScore] = useState(0);
  const [currentHand, setCurrentHand] = useState([]);
  const [lastRoundResult, setLastRoundResult] = useState(null);
  const pendingExamUpdateRef = useRef(null);
  const [currentExamResultInfo, setCurrentExamResultInfo] = useState(null);
  const [itemUseResultMessage, setItemUseResultMessage] = useState('');
  const [showItemUseResultModal, setShowItemUseResultModal] = useState(false);
  const [examBuffs, setExamBuffs] = useState({
    satisfactionMultiplier: 1,
    statsPercentageBonus: 0,
    nextCardMultiplier: 1,
  });
  const [lastGrowthInfo, setLastGrowthInfo] = useState(null); // game.js用
  const [cardOptions, setCardOptions] = useState([]); // game.js用
  const [lastAcquiredCardId, setLastAcquiredCardId] = useState(null); // game.js用


  const initializeGame = useCallback((selectedMentorIds, mode = 'normal') => {
    // console.log(`Initializing game with mentor IDs: ${selectedMentorIds}, Mode: ${mode}`);
    const initialPlayer = getInitialPlayerState();
    const selectedMentorsData = selectedMentorIds.map(id => allMentorsData.find(m => m.id === id)).filter(Boolean);
    initialPlayer.selectedMentors = selectedMentorsData;

    if (mode === 'tutorial') {
      // console.log("Tutorial mode: Specific initializations if any.");
      // チュートリアル固有の初期ステータス調整などがあればここで行う
      // 例: initialPlayer.stats[STATUS_TYPE.IN_VIVO] = 15.0;
    }

    setPlayerState(initialPlayer);
    setExaminers(getInitialExaminerState()); // 試験官も初期化
    setCurrentIkuseiRound(0);
    setGameState(mode === 'tutorial' ? 'TUTORIAL_MENTOR_SELECTED' : '育成'); // ★ チュートリアル時は専用のgameStateを設定しても良い
                                                                         // または、tutorial.js側でgameStateを管理
    setIsEventActive(false);
    setCurrentEventData(null);
    resetUniqueCardInstanceIdCounter();
    setCurrentHand([]);
    setLastRoundResult(null);
    if(pendingExamUpdateRef.current) pendingExamUpdateRef.current = null;
    setCurrentExamResultInfo(null);
    setItemUseResultMessage('');
    setShowItemUseResultModal(false);
    setExamBuffs({ satisfactionMultiplier: 1, statsPercentageBonus: 0, nextCardMultiplier: 1 });
    setLastGrowthInfo(null);
    setCardOptions([]);
    setLastAcquiredCardId(null);
    setCurrentExamRound(0);
    setCurrentExamScore(0);
  }, []); // 依存配列は空でOK

  // 通常のゲーム開始時のメンター選択処理 (game.js で使われる想定)
  useEffect(() => {
    // このuseEffectは game.js での初期化用なので、tutorial.js では直接 initializeGame を呼ぶ
    if (router.isReady && router.pathname === '/game') { // /game の場合のみ
      const { mentors: mentorQuery } = router.query;
      let selectedMentorIdsFromQuery = [];
      if (!mentorQuery) {
        // game.js でメンター未選択ならmentor-selectへリダイレクトするので、ここは通らないはず
      } else {
        selectedMentorIdsFromQuery = typeof mentorQuery === 'string' ? mentorQuery.split(',') : [];
      }
      if (selectedMentorIdsFromQuery.length > 0 && !playerState) { // playerStateがまだない場合のみ初期化
        initializeGame(selectedMentorIdsFromQuery, 'normal');
      } else if (selectedMentorIdsFromQuery.length === 0 && !playerState) {
        // console.warn("No mentors selected for /game, redirecting to mentor select.");
        // router.push('/mentor-select'); // GamePage側で処理
      }
    }
  }, [router.isReady, router.query, router.pathname, playerState, initializeGame]);


  return {
    playerState, setPlayerState,
    examiners, setExaminers,
    gameState, setGameState,
    currentIkuseiRound, setCurrentIkuseiRound,
    // ikuseiPhaseStep, setIkuseiPhaseStep, // 呼び出し元で管理
    isEventActive, setIsEventActive,
    currentEventData, setCurrentEventData,
    // eventResultInfo, setEventResultInfo, // 呼び出し元で管理
    currentExamRound, setCurrentExamRound,
    currentExamScore, setCurrentExamScore,
    currentHand, setCurrentHand,
    lastRoundResult, setLastRoundResult,
    pendingExamUpdateRef,
    currentExamResultInfo, setCurrentExamResultInfo,
    itemUseResultMessage, setItemUseResultMessage,
    showItemUseResultModal, setShowItemUseResultModal,
    examBuffs, setExamBuffs,
    lastGrowthInfo, setLastGrowthInfo, // game.js用
    cardOptions, setCardOptions,       // game.js用
    lastAcquiredCardId, setLastAcquiredCardId, // game.js用
    initializeGame,
  };
};