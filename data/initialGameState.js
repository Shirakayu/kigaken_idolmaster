// data/initialGameState.js
import { STATUS_TYPE } from './abilityCards';

export const EXAMINER_NAMES = ['教授', '講師', 'ポスドク'];

export const EXAM_SETTINGS = [
  {
    roundLimit: 5,
    normaScore: 50,
    name: "第1回中間報告会",
    roundLimitBeforeExam: 5,
    maxSatisfactionPerExaminer: 75
  },
  {
    roundLimit: 5,
    normaScore: 75,
    name: "第2回中間報告会",
    roundLimitBeforeExam: 5,
    maxSatisfactionPerExaminer: 100
  },
  {
    roundLimit: 5,
    normaScore: 100,
    name: "最終研究発表会",
    roundLimitBeforeExam: 6,
    maxSatisfactionPerExaminer: 135
  },
];

export const TOTAL_EXAMS = EXAM_SETTINGS.length;

export const EXAMINER_EVALUATION_WEIGHT = {
  '教授': { base: 1, satisfactionThresholds: { 33: 10, 66: 20, 100: 40 } },
  '講師': { base: 1, satisfactionThresholds: { 33: 8, 66: 15, 100: 30 } },
  'ポスドク': { base: 1, satisfactionThresholds: { 33: 5, 66: 10, 100: 20 } },
};

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
    traitChangeItems: [], // 形式: [{ id: 'trait_change_vivo', instanceId: 'item_instance_123' }, ...]
  },
  selectedMentors: [],
  currentExamIndex: 0,
  totalScore: 0,
});

export const getInitialExaminerState = () => {
  return EXAMINER_NAMES.map(name => ({
    name: name,
    satisfaction: 0,
    preferredStatus: STATUS_TYPE.IN_VIVO, // 初期値、試験開始時にランダム設定される
    preferredStatusMultiplier: 2, // 初期値、試験開始時にランダム設定される可能性あり
    achievedEvaluationMilestones: {}, // 例: { '33': true, '66': false, '100': false }
    // maxSatisfaction は試験開始時に EXAM_SETTINGS から動的に設定
  }));
};