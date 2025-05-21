// data/initialGameState.js
import { STATUS_TYPE } from './abilityCards';

export const EXAMINER_NAMES = ['教授', '講師', 'ポスドク'];

export const EXAM_SETTINGS = [
  {
    roundLimit: 7,
    normaScore: 300,
    name: "第1回中間報告会",
    roundLimitBeforeExam: 5,
  },
  {
    roundLimit: 7,
    normaScore: 500,
    name: "第2回中間報告会",
    roundLimitBeforeExam: 5,
  },
  {
    roundLimit: 9,
    normaScore: 800,
    name: "最終研究発表会",
    roundLimitBeforeExam: 7,
  },
];

export const TOTAL_EXAMS = EXAM_SETTINGS.length;

export const getInitialPlayerState = () => ({
  stats: {
    [STATUS_TYPE.IN_VIVO]: 10.0,
    [STATUS_TYPE.IN_VITRO]: 10.0,
    [STATUS_TYPE.IN_SILICO]: 10.0,
  },
  additionalDeck: [],
  currentExamFullDeck: [],
  usedAdditionalCardsThisExam: [],
  inventory: {
    traitChangeItems: [],
  },
  selectedMentors: [],
  currentExamIndex: 0,
  totalScore: 0,
});

export const getInitialExaminerState = () => {
  return EXAMINER_NAMES.map(name => {
    const basicPlayableStatuses = [ STATUS_TYPE.IN_VIVO, STATUS_TYPE.IN_VITRO, STATUS_TYPE.IN_SILICO ];
    const randomStatus = basicPlayableStatuses[Math.floor(Math.random() * basicPlayableStatuses.length)];

    return {
      name: name,
      satisfactionCount: 0,
      preferredStatus: randomStatus,
      preferredStatusMultiplier: 2.0, // ★ 一律 2.0 に固定
    };
  });
};