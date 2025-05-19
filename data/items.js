// data/items.js
import { STATUS_TYPE } from './abilityCards';

export const ITEM_TYPE = {
  TRAIT_CHANGE: 'trait_change',
  // 他にもアイテムタイプが増えるかも
};

export const allItems = {
  'trait_change_vivo': {
    id: 'trait_change_vivo',
    name: '最新の実験プロトコル (In Vivo)',
    type: ITEM_TYPE.TRAIT_CHANGE,
    description: '試験官1人の評価されやすいステータスを「In Vivo」に変更する。',
    targetStatus: STATUS_TYPE.IN_VIVO,
  },
  'trait_change_vitro': {
    id: 'trait_change_vitro',
    name: '高純度試薬セット (In Vitro)',
    type: ITEM_TYPE.TRAIT_CHANGE,
    description: '試験官1人の評価されやすいステータスを「In Vitro」に変更する。',
    targetStatus: STATUS_TYPE.IN_VITRO,
  },
  'trait_change_silico': {
    id: 'trait_change_silico',
    name: '高性能計算クラスター利用権 (In Silico)',
    type: ITEM_TYPE.TRAIT_CHANGE,
    description: '試験官1人の評価されやすいステータスを「In Silico」に変更する。',
    targetStatus: STATUS_TYPE.IN_SILICO,
  },
};

export const getRandomTraitChangeItem = () => {
  const traitChangeItems = Object.values(allItems).filter(item => item.type === ITEM_TYPE.TRAIT_CHANGE);
  if (traitChangeItems.length === 0) return null;
  return traitChangeItems[Math.floor(Math.random() * traitChangeItems.length)];
};