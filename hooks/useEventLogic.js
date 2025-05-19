// hooks/useEventLogic.js
import { useState, useCallback } from 'react';
import { EVENT_CHOICE_TYPE, getRandomEvent as getRandomEventData, allEvents as baseAllEvents } from '../data/events';
import { getRandomTraitChangeItem, allItems as allItemData } from '../data/items';
import { allAbilityCards, generateUniqueCardInstanceId, RARITY_APPEARANCE_CHANCE, RARITY } from '../utils/cardUtils';

export const useEventLogic = (
    playerState,
    setPlayerState,
    cardPoolsByRarity,
    onEventComplete, // (was triggerNextIkuseiStepAfterEvent)
    mode = 'normal', // 'normal' or 'tutorial'
    currentTutorialStep = null // チュートリアルステップ情報
) => {
  const [isEventActive, setIsEventActive] = useState(false);
  const [currentEventData, setCurrentEventData] = useState(null);
  const [eventResultInfo, setEventResultInfo] = useState(null);
  const [eventUiStep, setEventUiStep] = useState(''); // 'EVENT_SCENARIO', 'EVENT_CHOICES', 'EVENT_RESULT' or ''

  const tryTriggerRandomEvent = useCallback(() => {
    // チュートリアルモードで特定のステップがイベントをトリガーする場合の処理は、
    // tutorial.js 側でこの関数を呼ばずに直接イベントデータをセットする形でも良い
    if (mode === 'tutorial' && currentTutorialStep?.forceEventId) {
        const event = baseAllEvents.find(e => e.id === currentTutorialStep.forceEventId);
        if (event) {
            setCurrentEventData(event);
            setIsEventActive(true);
            setEventUiStep('EVENT_SCENARIO');
            return true;
        } else {
            console.warn(`Tutorial: Forced event with id ${currentTutorialStep.forceEventId} not found.`);
            return false;
        }
    }

    // 通常のランダムイベント発生ロジック
    if (baseAllEvents.length > 0 && Math.random() < 0.3) { // 30%の確率でイベント発生 (調整可能)
      const event = getRandomEventData();
      if (event) {
        setCurrentEventData(event);
        setIsEventActive(true);
        setEventUiStep('EVENT_SCENARIO');
        return true;
      }
    }
    return false;
  }, [setCurrentEventData, setIsEventActive, setEventUiStep, mode, currentTutorialStep]);

  const handleEventChoice = useCallback((choice) => {
    if (!isEventActive || !currentEventData || eventUiStep !== 'EVENT_CHOICES' || !playerState) return;

    let resultName = '';
    let acquiredItemFull = null;
    let acquiredItemInstance = null;
    let acquiredCardData = null;

    if (choice.type === EVENT_CHOICE_TYPE.RANDOM_CARD) {
      let selectedCardBaseId = null;
      const rarityProbabilities = RARITY_APPEARANCE_CHANCE;
      const rarityKeys = Object.keys(rarityProbabilities);
      let chosenRarityKey = null;
      const rand = Math.random();
      let cumulativeProbability = 0;
      for (const rarityKey of rarityKeys) {
        cumulativeProbability += rarityProbabilities[rarityKey];
        if (rand <= cumulativeProbability) { chosenRarityKey = rarityKey; break; }
      }
      if (!chosenRarityKey) { chosenRarityKey = RARITY.UHN; } // フォールバック

      const pool = cardPoolsByRarity[chosenRarityKey];
      if (pool && pool.length > 0) {
        selectedCardBaseId = pool[Math.floor(Math.random() * pool.length)];
      } else { // フォールバックでUHNから引く
        const uhnPool = cardPoolsByRarity[RARITY.UHN];
        if (uhnPool && uhnPool.length > 0) {
            selectedCardBaseId = uhnPool[Math.floor(Math.random() * uhnPool.length)];
        }
      }

      if (selectedCardBaseId) {
        acquiredCardData = allAbilityCards.get(selectedCardBaseId);
        if (acquiredCardData) {
          const newCardInstance = { baseId: selectedCardBaseId, instanceId: generateUniqueCardInstanceId() };
          setPlayerState(p => ({ ...p, additionalDeck: [...(p.additionalDeck || []), newCardInstance] }));
          resultName = acquiredCardData.name;
        } else {
            resultName = 'カードデータが見つかりません'; // 念のため
        }
      } else {
        resultName = '獲得できるカードなし';
      }
      setEventResultInfo({ type: 'card', name: resultName, item: null, card: acquiredCardData });

    } else if (choice.type === EVENT_CHOICE_TYPE.RANDOM_ITEM_TRAIT_CHANGE) {
      if (mode === 'tutorial' && currentTutorialStep?.fixedEventItemResultId) {
        // チュートリアルで固定アイテム結果の場合
        acquiredItemFull = allItemData[currentTutorialStep.fixedEventItemResultId];
      } else {
        // 通常プレイ時
        acquiredItemFull = getRandomTraitChangeItem();
      }

      if (acquiredItemFull) {
        acquiredItemInstance = {
            id: acquiredItemFull.id,
            instanceId: generateUniqueCardInstanceId()
        };
        setPlayerState(p => {
            const currentItems = p.inventory?.traitChangeItems || [];
            const newInventoryItems = [...currentItems, acquiredItemInstance];
            return {
                ...p,
                inventory: { ...(p.inventory || {}), traitChangeItems: newInventoryItems }
            };
        });
        resultName = acquiredItemFull.name;
      } else {
        resultName = '獲得できるアイテムなし';
      }
      setEventResultInfo({ type: 'item', name: resultName, item: acquiredItemFull, card: null });
    }
    // 他のイベント選択タイプがあればここに追加

    setEventUiStep('EVENT_RESULT');
  }, [isEventActive, currentEventData, eventUiStep, playerState, cardPoolsByRarity, setPlayerState, setEventResultInfo, setEventUiStep, mode, currentTutorialStep]);

  const closeEvent = useCallback(() => {
    setIsEventActive(false);
    setCurrentEventData(null);
    setEventResultInfo(null);
    setEventUiStep('');
    if (onEventComplete) {
      onEventComplete();
    }
  }, [setIsEventActive, setCurrentEventData, setEventResultInfo, setEventUiStep, onEventComplete]);

  return {
    isEventActive,
    currentEventData,
    eventResultInfo,
    eventUiStep,
    setEventUiStep,
    tryTriggerRandomEvent,
    handleEventChoice,
    closeEvent,
  };
};