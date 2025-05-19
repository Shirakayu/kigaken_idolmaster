// hooks/useIkuseiLogic.js
import { useState, useCallback } from 'react';
import { EXAM_SETTINGS } from '../data/initialGameState';
import { STATUS_TYPE, RARITY } from '../data/abilityCards';
import { allAbilityCards, RARITY_APPEARANCE_CHANCE, useCardPoolsByRarity, generateUniqueCardInstanceId } from '../utils/cardUtils';
// import { getRandomEvent, allEvents as baseAllEvents } from '../data/events'; // イベント発生ロジックは親から渡される関数に委ねる

export const useIkuseiLogic = (
    playerState, 
    setPlayerState, 
    currentIkuseiRound, 
    setCurrentIkuseiRound,
    isEventActive, // from useEventLogic (via GamePage)
    tryTriggerRandomEvent // from useEventLogic (via GamePage)
) => {
  const [ikuseiPhaseStep, setLocalIkuseiPhaseStep] = useState('SELECT_STATUS');
  const [lastGrowthInfo, setLastGrowthInfo] = useState(null);
  const [cardOptions, setCardOptions] = useState([]);
  const [lastAcquiredCardId, setLastAcquiredCardId] = useState(null);

  const cardPoolsByRarity = useCardPoolsByRarity();

  const advanceIkuseiRound = useCallback(() => {
    if (!playerState) return false;
    const nextIkuseiRound = currentIkuseiRound + 1;
    setCurrentIkuseiRound(nextIkuseiRound);

    const ikuseiRoundsPerExam = EXAM_SETTINGS[playerState.currentExamIndex]?.roundLimitBeforeExam || 10;
    if (nextIkuseiRound >= ikuseiRoundsPerExam) { 
      setLocalIkuseiPhaseStep('FORCED_EXAM_TRANSITION'); 
      return true; 
    }
    return false;
  }, [currentIkuseiRound, playerState, setCurrentIkuseiRound, setLocalIkuseiPhaseStep]);


  const handleStatusSelect = useCallback((selectedStatus) => {
    if (isEventActive || ikuseiPhaseStep !== 'SELECT_STATUS' || !playerState) return;
    
    const baseGrowthFactor = Math.random() * 4.0 + 1.0;
    let finalGrowth = baseGrowthFactor;
    let mentorBonusAppliedValue = 0.0;
    let probabilityBonusTriggered = false;

    playerState.selectedMentors.forEach(mentor => {
      if (mentor.statusBonus) {
        const bonusConfig = mentor.statusBonus;
        if (bonusConfig.type === 'probability') {
          if (bonusConfig.status === selectedStatus && Math.random() < bonusConfig.probability) {
            const bonusAmount = baseGrowthFactor * bonusConfig.bonus;
            finalGrowth += bonusAmount;
            mentorBonusAppliedValue += bonusAmount;
            probabilityBonusTriggered = true;
          }
        } else {
          if (bonusConfig[selectedStatus] !== undefined) {
            const bonusEffect = bonusConfig[selectedStatus];
            const bonusAmount = baseGrowthFactor * bonusEffect;
            finalGrowth += bonusAmount;
            mentorBonusAppliedValue += bonusAmount;
          }
        }
      }
    });

    const newStatValueRaw = playerState.stats[selectedStatus] + finalGrowth;
    const newStatValueRounded = parseFloat(newStatValueRaw.toFixed(1));
    const finalNewStat = Math.max(0, newStatValueRounded);

    setPlayerState(prevPlayerState => ({
      ...prevPlayerState,
      stats: { ...prevPlayerState.stats, [selectedStatus]: finalNewStat },
    }));
    setLastGrowthInfo({ status: selectedStatus, growth: finalGrowth, baseGrowth: baseGrowthFactor, bonus: mentorBonusAppliedValue, probabilityBonusTriggered });
    setLocalIkuseiPhaseStep('SHOW_GROWTH');
  }, [isEventActive, ikuseiPhaseStep, playerState, setPlayerState, setLastGrowthInfo, setLocalIkuseiPhaseStep]);

  const proceedToCardSelectionInternal = useCallback(() => {
    const presentedOptions = [];
    const rarityProbabilities = RARITY_APPEARANCE_CHANCE;
    const rarityKeys = Object.keys(rarityProbabilities);

    for (let i = 0; i < 3; i++) {
      let chosenRarityKey = null;
      const rand = Math.random();
      let cumulativeProbability = 0;
      for (const rarityKey of rarityKeys) {
        cumulativeProbability += rarityProbabilities[rarityKey];
        if (rand <= cumulativeProbability) { chosenRarityKey = rarityKey; break; }
      }
      if (!chosenRarityKey) { chosenRarityKey = RARITY.UHN; }

      const pool = cardPoolsByRarity[chosenRarityKey];
      if (pool && pool.length > 0) {
        let selectedCardId; let attempts = 0; const maxAttempts = pool.length * 2 + 5;
        do {
            selectedCardId = pool[Math.floor(Math.random() * pool.length)];
            attempts++;
        } while (presentedOptions.includes(selectedCardId) && attempts < maxAttempts && pool.length > presentedOptions.length);
        if (!presentedOptions.includes(selectedCardId) || pool.length <= presentedOptions.length) {
            if (selectedCardId) presentedOptions.push(selectedCardId);
        } else if (presentedOptions.length < 3) {
             const uhnPool = cardPoolsByRarity[RARITY.UHN];
             if (uhnPool && uhnPool.length > 0) {
                 let fallbackCardId; let fallbackAttempts = 0;
                 do { fallbackCardId = uhnPool[Math.floor(Math.random() * uhnPool.length)]; fallbackAttempts++; } while (presentedOptions.includes(fallbackCardId) && fallbackAttempts < uhnPool.length * 2 + 5 && uhnPool.length > presentedOptions.length);
                 if (!presentedOptions.includes(fallbackCardId) || uhnPool.length <= presentedOptions.length) { if (fallbackCardId) presentedOptions.push(fallbackCardId); }
             }
        }
      } else {
        const uhnPool = cardPoolsByRarity[RARITY.UHN];
        if (uhnPool && uhnPool.length > 0) { presentedOptions.push(uhnPool[Math.floor(Math.random() * uhnPool.length)]);}
      }
    }
    let safetyCounter = 0;
    while (presentedOptions.length < 3 && cardPoolsByRarity[RARITY.UHN]?.length > 0 && safetyCounter < 10) {
        const uhnPool = cardPoolsByRarity[RARITY.UHN];
        const fallbackCardId = uhnPool[Math.floor(Math.random() * uhnPool.length)];
        if (fallbackCardId && !presentedOptions.includes(fallbackCardId)) {
            presentedOptions.push(fallbackCardId);
        }
        safetyCounter++;
    }
    if (presentedOptions.length === 0 && (cardPoolsByRarity[RARITY.UHN]?.length > 0 || cardPoolsByRarity[RARITY.II]?.length > 0 || cardPoolsByRarity[RARITY.KIGAI]?.length > 0)) {
        const uhnPool = cardPoolsByRarity[RARITY.UHN];
        if (uhnPool && uhnPool.length > 0) { for (let i = 0; i < Math.min(3, uhnPool.length); i++) { if (presentedOptions.length < 3 && !presentedOptions.includes(uhnPool[i])) presentedOptions.push(uhnPool[i]); } }
    }
    setCardOptions(presentedOptions.filter(Boolean).slice(0,3));
    setLocalIkuseiPhaseStep('SELECT_CARD');
  }, [cardPoolsByRarity, setCardOptions, setLocalIkuseiPhaseStep]);

  const proceedToCardSelection = useCallback(() => {
    if (isEventActive || ikuseiPhaseStep !== 'SHOW_GROWTH' || !playerState) {
        return; 
    }
    setLastGrowthInfo(null); 
    proceedToCardSelectionInternal();
  }, [isEventActive, ikuseiPhaseStep, playerState, proceedToCardSelectionInternal, setLastGrowthInfo]);

  const handleCardAcquire = useCallback((cardBaseId) => {
    if (isEventActive || ikuseiPhaseStep !== 'SELECT_CARD' || !playerState) return; 
    const cardData = allAbilityCards.get(cardBaseId); 
    if (!cardData) return;
    const newCardInstance = { baseId: cardBaseId, instanceId: generateUniqueCardInstanceId() };
    setPlayerState(p => ({ ...p, additionalDeck: [...(p.additionalDeck || []), newCardInstance] })); 
    setLastAcquiredCardId(cardBaseId); 
    setLocalIkuseiPhaseStep('SHOW_ACQUISITION'); 
    setCardOptions([]);
  }, [isEventActive, ikuseiPhaseStep, playerState, setPlayerState, setLastAcquiredCardId, setLocalIkuseiPhaseStep, setCardOptions]);
  
  const proceedAfterEvent = useCallback(() => {
    // console.log("proceedAfterEvent called in useIkuseiLogic");
    const forced = advanceIkuseiRound();
    if (!forced) {
        setLocalIkuseiPhaseStep('SELECT_STATUS');
    }
  }, [advanceIkuseiRound, setLocalIkuseiPhaseStep]);

  const triggerNextIkuseiStep = useCallback(() => {
    // console.log("triggerNextIkuseiStep called in useIkuseiLogic");
    setLastAcquiredCardId(null); 
    setCardOptions([]);
    
    const currentExamData = playerState ? EXAM_SETTINGS[playerState.currentExamIndex] : null;
    const ikuseiRoundsPerExam = currentExamData?.roundLimitBeforeExam || 10;
    const isNextRoundForcedTransition = (currentIkuseiRound + 1) >= ikuseiRoundsPerExam;

    let eventOccurred = false;
    if (!isNextRoundForcedTransition && tryTriggerRandomEvent) { 
      // console.log("Attempting to trigger random event...");
      eventOccurred = tryTriggerRandomEvent();
      // console.log("Event occurred:", eventOccurred);
    }
    
    if (!eventOccurred) {
      // console.log("No event occurred, advancing round or setting to select status.");
      const forced = advanceIkuseiRound();
      if (!forced) {
          setLocalIkuseiPhaseStep('SELECT_STATUS');
      }
    }
    // イベントが発生した場合、useEventLogic が setIkuseiPhaseStep('EVENT_SCENARIO') を呼び、
    // イベント終了後に closeEvent -> onEventComplete (これが proceedAfterEvent) が呼ばれる
  }, [playerState, currentIkuseiRound, advanceIkuseiRound, tryTriggerRandomEvent, setLocalIkuseiPhaseStep, setLastAcquiredCardId, setCardOptions]);

  const resetIkuseiStateForExam = useCallback(() => {
    setLocalIkuseiPhaseStep('SELECT_STATUS');
    setLastGrowthInfo(null); 
    setCardOptions([]); 
    setLastAcquiredCardId(null); 
  }, [setLocalIkuseiPhaseStep, setLastGrowthInfo, setCardOptions, setLastAcquiredCardId]);

  return {
    ikuseiPhaseStep,
    setIkuseiPhaseStep: setLocalIkuseiPhaseStep,
    lastGrowthInfo,
    cardOptions,
    lastAcquiredCardId,
    handleStatusSelect,
    proceedToCardSelection,
    handleCardAcquire,
    triggerNextIkuseiStep,
    resetIkuseiStateForExam,
    proceedAfterEvent,
  };
};