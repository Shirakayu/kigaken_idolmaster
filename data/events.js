// data/events.js
export const EVENT_CHOICE_TYPE = {
  RANDOM_CARD: 'random_card',
  RANDOM_ITEM_TRAIT_CHANGE: 'random_item_trait_change',
};

export const allEvents = [
  {
    id: 'event_001',
    name: '思わぬ発見', // イベントの内部的な名前
    scenario: '研究室の片隅で、古びたノートを見つけた。中には興味深い記述が…（仮）',
    choices: [
      {
        text: 'ノートの記述を元に新しいアプローチを試す (ランダムなカード1枚入手)',
        type: EVENT_CHOICE_TYPE.RANDOM_CARD,
      },
      {
        text: 'ノートの情報を整理し、発表資料に活かす (特性変更アイテム1つ入手)',
        type: EVENT_CHOICE_TYPE.RANDOM_ITEM_TRAIT_CHANGE,
      },
    ],
  },
  // 今後、ここにイベントを追加していく
  // {
  //   id: 'event_002',
  //   name: '共同研究の誘い',
  //   scenario: '隣の研究室の著名な教授から共同研究の誘いがあった！（仮）',
  //   choices: [ ... ],
  // },
];

export const getRandomEvent = () => {
  if (allEvents.length === 0) return null;
  return allEvents[Math.floor(Math.random() * allEvents.length)];
};