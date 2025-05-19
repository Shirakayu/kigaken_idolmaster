// utils/cardUtils.js
import { useMemo } from 'react';
import { RARITY, initialDeckCards as baseInitialDeckCardsData, acquirableCards as baseAcquirableCardsData } from '../data/abilityCards';
// allAbilityCards はここで生成するか、別途 gameData.js のような場所で一元管理してインポートする。
// ここでは、このファイル内で生成する例を示す。
const allCardsList = [
  ...baseInitialDeckCardsData,
  ...baseAcquirableCardsData,
];
export const allAbilityCards = new Map(allCardsList.map(card => [card.id, card]));


let uniqueCardInstanceIdCounter = 0;
export const generateUniqueCardInstanceId = () => {
  uniqueCardInstanceIdCounter++;
  return `cardInstance_${uniqueCardInstanceIdCounter}`;
};
export const resetUniqueCardInstanceIdCounter = () => { // ゲーム初期化時に呼ぶ
    uniqueCardInstanceIdCounter = 0;
};

export const RARITY_APPEARANCE_CHANCE = {
  [RARITY.UHN]: 0.55,
  [RARITY.II]: 0.35,
  [RARITY.KIGAI]: 0.10,
};

export const useCardPoolsByRarity = () => { // useCardPoolsByRarityInternal からリネーム
  return useMemo(() => {
    const pools = {
      [RARITY.UHN]: [],
      [RARITY.II]: [],
      [RARITY.KIGAI]: [],
    };
    allAbilityCards.forEach(card => {
      if (!card.isInitial) {
        if (pools[card.rarity]) {
          pools[card.rarity].push(card.id);
        } else {
          // console.warn(`Card with unknown rarity found: ${card.name} - ${card.rarity}`);
        }
      }
    });
    return pools;
  }, []); // allAbilityCards はこのファイル内で定義されているので依存配列は空でOK
};