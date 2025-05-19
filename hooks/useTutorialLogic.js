// hooks/useTutorialLogic.js
import { useState, useCallback, useMemo } from 'react';
import { EVENT_CHOICE_TYPE } from '../data/events';
import { STATUS_TYPE } from '../data/abilityCards';

export const TUTORIAL_STEPS = {
  START: 'START',
  MENTOR_SELECT_PROMPT: 'MENTOR_SELECT_PROMPT',
  MENTOR_CONFIRM_A: 'MENTOR_CONFIRM_A',
  IKUSEI_R1_STATUS_PROMPT: 'IKUSEI_R1_STATUS_PROMPT',
  IKUSEI_R1_STATUS_RESULT: 'IKUSEI_R1_STATUS_RESULT',
  IKUSEI_R1_CARD_PROMPT: 'IKUSEI_R1_CARD_PROMPT',
  IKUSEI_R1_CARD_ACQUIRED: 'IKUSEI_R1_CARD_ACQUIRED',
  IKUSEI_R2_STATUS_PROMPT: 'IKUSEI_R2_STATUS_PROMPT',
  IKUSEI_R2_STATUS_RESULT: 'IKUSEI_R2_STATUS_RESULT',
  IKUSEI_R2_CARD_PROMPT: 'IKUSEI_R2_CARD_PROMPT',
  IKUSEI_R2_CARD_ACQUIRED: 'IKUSEI_R2_CARD_ACQUIRED',
  IKUSEI_END_TRANSITION_PROMPT: 'IKUSEI_END_TRANSITION_PROMPT', // 育成終了画面表示用
  EVENT_TRIGGER_PROMPT: 'EVENT_TRIGGER_PROMPT',
  EVENT_SCENARIO_DISPLAY: 'EVENT_SCENARIO_DISPLAY',
  EVENT_CHOICE_PROMPT: 'EVENT_CHOICE_PROMPT',
  EVENT_RESULT_DISPLAY: 'EVENT_RESULT_DISPLAY',
  ITEM_USE_PHASE_PROMPT: 'ITEM_USE_PHASE_PROMPT',
  ITEM_SELECT_ITEM_PROMPT: 'ITEM_SELECT_ITEM_PROMPT',
  ITEM_SELECT_TARGET_PROMPT: 'ITEM_SELECT_TARGET_PROMPT',
  ITEM_CONFIRM_USE_PROMPT: 'ITEM_CONFIRM_USE_PROMPT',
  EXAM_PHASE_PROMPT: 'EXAM_PHASE_PROMPT',
  EXAM_SELECT_TARGET_EXAMINER_PROMPT: 'EXAM_SELECT_TARGET_EXAMINER_PROMPT',
  EXAM_SELECT_HAND_CARD_PROMPT: 'EXAM_SELECT_HAND_CARD_PROMPT',
  EXAM_CONFIRM_CARD_PLAY_PROMPT: 'EXAM_CONFIRM_CARD_PLAY_PROMPT',
  EXAM_ROUND_RESULT_DISPLAY: 'EXAM_ROUND_RESULT_DISPLAY',
  EXAM_FINAL_RESULT_PROMPT: 'EXAM_FINAL_RESULT_PROMPT',
  END: 'END',
};

const initialTutorialFlow = [
  { id: TUTORIAL_STEPS.START, message: "研究者育成ゲームのチュートリアルへようこそ！\nこのゲームでは、自分自身の能力を磨き、成果を発表し、一人前の研究者になることが目標です。\nまずはあなたの研究をサポートするメンターを選びましょう。", nextButtonText: "メンター選択へ", showNextButton: true, allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }], },
  { id: TUTORIAL_STEPS.MENTOR_SELECT_PROMPT, message: "ゲームを開始すると、3人のメンター候補がランダムに表示されます。\nこの中から、自身のメンターにする人物を選びます。\n今回は一番左の「ウエツカA」を選んでみましょう。\n「ウエツカA」は『in vivo』研究の成長を安定してサポートしてくれます。", targetElementId: "mentor_card_uetsuka_a", allowedActions: [{ type: 'CLICK_ELEMENT', elementId: 'mentor_card_uetsuka_a', expectedData: 'uetsuka_a' }], showNextButton: false, },
  { id: TUTORIAL_STEPS.MENTOR_CONFIRM_A, message: "「ウエツカA」を選択しました。\nゲームを開始して、育成に進みましょう。", nextButtonText: "育成へ進む", showNextButton: true, allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }], },
  { id: TUTORIAL_STEPS.IKUSEI_R1_STATUS_PROMPT, message: "育成フェイズです。\nここでは『in vivo』『in vitro』『in silico』の中から成長させるステータスを選択します。\n今回は『In Vivo』を育成しましょう。\n『In Vivoを育成』ボタンを押してください。", targetElementId: "button_status_in_vivo", allowedActions: [{ type: 'SELECT_STATUS', status: STATUS_TYPE.IN_VIVO }], showNextButton: false, },
  { id: TUTORIAL_STEPS.IKUSEI_R1_STATUS_RESULT, message: "（成長結果表示中...）", nextButtonText: "カード獲得へ", allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }], showNextButton: true, },
  { id: TUTORIAL_STEPS.IKUSEI_R1_CARD_PROMPT, message: "ステータスを成長させた後はカードを入手します。\nランダムに表示される3枚の中から１枚を選び獲得します。\n今回は『発現誘導実験』を選びましょう。\nこのカードはIn Vivoステータスを参照して試験官の満足度を上げます。", targetElementId: "card_option_ii_発現誘導実験", allowedActions: [{ type: 'SELECT_CARD', cardId: 'ii_発現誘導実験' }], showNextButton: false, },
  { id: TUTORIAL_STEPS.IKUSEI_R1_CARD_ACQUIRED, message: "（カード獲得表示中...）", nextButtonText: "育成ラウンド2へ", allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }], showNextButton: true, },
  { id: TUTORIAL_STEPS.IKUSEI_R2_STATUS_PROMPT, message: "育成ラウンド2です。\n今度は好きなステータスを選んで育成してみましょう。", targetElementId: null, allowedActions: [ { type: 'SELECT_STATUS', status: STATUS_TYPE.IN_VIVO }, { type: 'SELECT_STATUS', status: STATUS_TYPE.IN_VITRO }, { type: 'SELECT_STATUS', status: STATUS_TYPE.IN_SILICO }, ], showNextButton: false, },
  { id: TUTORIAL_STEPS.IKUSEI_R2_STATUS_RESULT, message: "（成長結果表示中...）", nextButtonText: "カード獲得へ", allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }], showNextButton: true, },
  { id: TUTORIAL_STEPS.IKUSEI_R2_CARD_PROMPT, message: "カードを自由に1枚選んでみましょう。\n提示されるカードは『Echo』『祖先配列推定』『キムワイプ』です。", targetElementId: null, allowedActions: [ { type: 'SELECT_CARD', cardId: 'kigai_Echo' }, { type: 'SELECT_CARD', cardId: 'ii_祖先配列推定' }, { type: 'SELECT_CARD', cardId: 'uhn_キムワイプ' }, ], showNextButton: false, },
  {
    id: TUTORIAL_STEPS.IKUSEI_R2_CARD_ACQUIRED,
    message: "（カード獲得表示中...）",
    nextButtonText: "イベントへ", // 変更: 次はイベントトリガープロンプト
    allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }],
    showNextButton: true,
  },
  {
    id: TUTORIAL_STEPS.EVENT_TRIGGER_PROMPT,
    message: "育成中、稀にイベントが発生することがあります。",
    nextButtonText: "イベントを見る",
    allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }],
    showNextButton: true,
  },
  {
    id: TUTORIAL_STEPS.EVENT_SCENARIO_DISPLAY,
    message: "（イベントシナリオ表示中...）",
    nextButtonText: "選択肢へ",
    allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }],
    showNextButton: true,
  },
  {
    id: TUTORIAL_STEPS.EVENT_CHOICE_PROMPT,
    message: "今回は『ノートの情報を整理し、発表資料に活かす』を選んで、アイテムを入手してみましょう。\n試験の前に、試験官から評価を得やすいステータスの傾向をアイテムで変更できます。",
    targetElementId: `event_choice_${EVENT_CHOICE_TYPE.RANDOM_ITEM_TRAIT_CHANGE}`,
    allowedActions: [{ type: 'EVENT_CHOICE', choiceType: EVENT_CHOICE_TYPE.RANDOM_ITEM_TRAIT_CHANGE }],
    showNextButton: false,
  },
  {
    id: TUTORIAL_STEPS.EVENT_RESULT_DISPLAY,
    message: "（イベント結果表示中...）",
    nextButtonText: "育成終了確認へ", // 変更: 次は育成終了画面
    allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }],
    showNextButton: true,
  },
  {
    id: TUTORIAL_STEPS.IKUSEI_END_TRANSITION_PROMPT, // イベントの後に移動
    message: "2ラウンドの育成とイベントが完了しました。\n（実際のゲームでは、試験ごとに決められたラウンド数だけ育成できます）",
    nextButtonText: "アイテム使用へ",
    allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }],
    showNextButton: true,
  },
  {
    id: TUTORIAL_STEPS.ITEM_USE_PHASE_PROMPT,
    message: "試験の前に、持っているアイテムを使うことができます。\nイベントで入手した『最新の実験プロトコル (In Vivo)』を使いましょう。",
    nextButtonText: "アイテム選択へ",
    allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }],
    showNextButton: true,
  },
  { id: TUTORIAL_STEPS.ITEM_SELECT_ITEM_PROMPT, message: "使用するアイテム『最新の実験プロトコル (In Vivo)』を選択してください。", targetItemBaseId: 'trait_change_vivo', allowedActions: [{ type: 'SELECT_ITEM', itemId: 'trait_change_vivo' }], showNextButton: false, },
  { id: TUTORIAL_STEPS.ITEM_SELECT_TARGET_PROMPT, message: "次に、アイテムを使用する対象の試験官を選択します。\n現在『In Vitro』を評価しやすくなっている『教授』に使ってみましょう。", targetElementId: "examiner_display_教授", allowedActions: [{ type: 'SELECT_EXAMINER_FOR_ITEM', examinerName: '教授' }], showNextButton: false, },
  { id: TUTORIAL_STEPS.ITEM_CONFIRM_USE_PROMPT, message: "『教授』に『最新の実験プロトコル (In Vivo)』を使用します。\n「このアイテムを使用する」ボタンを押してください。", targetElementId: "button_confirm_item_use", allowedActions: [{ type: 'CONFIRM_ITEM_USE', itemId: 'trait_change_vivo', examinerName: '教授' }], showNextButton: false, },
  { id: TUTORIAL_STEPS.EXAM_PHASE_PROMPT, message: "いよいよ試験です！\n取得したカードからランダムに配られる手札を使って、\n試験官の満足度をあげましょう！\n試験官の満足度をあげることで「評価」が得られます。\nノルマ評価を達成し、次のステップへと進みましょう。\n計３回の試験を突破することでゲームクリアになります。", nextButtonText: "手札確認へ", allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }], showNextButton: true, },
  { id: TUTORIAL_STEPS.EXAM_SELECT_TARGET_EXAMINER_PROMPT, message: "手札の『発現誘導実験』は『In Vivo』のカードです。\nこれを『教授』に使ってみましょう。\nまず、対象の『教授』を選んでください。", targetElementId: "examiner_display_教授", allowedActions: [{ type: 'SELECT_EXAMINER_FOR_CARD', examinerName: '教授' }], showNextButton: false, },
  { id: TUTORIAL_STEPS.EXAM_SELECT_HAND_CARD_PROMPT, message: "次に、使用するカード『発現誘導実験』を選んでください。", targetElementId: "hand_card_ii_発現誘導実験", allowedActions: [{ type: 'SELECT_HAND_CARD', cardId: 'ii_発現誘導実験' }], showNextButton: false, },
  { id: TUTORIAL_STEPS.EXAM_CONFIRM_CARD_PLAY_PROMPT, message: "『教授』に『発現誘導実験』を使用します。\n「カードを使用する」ボタンを押してください。", targetElementId: "button_play_card", allowedActions: [{ type: 'CONFIRM_CARD_PLAY', cardId: 'ii_発現誘導実験', examinerName: '教授' }], showNextButton: false, },
  { id: TUTORIAL_STEPS.EXAM_ROUND_RESULT_DISPLAY, message: "（試験ラウンド結果表示中...）", nextButtonText: "試験終了", allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }], showNextButton: true, },
  { id: TUTORIAL_STEPS.EXAM_FINAL_RESULT_PROMPT, message: "試験が終了しました。これが試験の一連の流れです。\n実際のゲームでは、より多くのカードが登場します。", nextButtonText: "チュートリアル完了", allowedActions: [{ type: 'TUTORIAL_NEXT_BUTTON' }], showNextButton: true, },
  { id: TUTORIAL_STEPS.END, message: "チュートリアルお疲れ様でした！\n本編のゲームをお楽しみください！", nextButtonText: "タイトルへ戻る", showNextButton: true, allowedActions: [{ type: 'CLICK_NEXT_TO_TITLE' }], },
];

export const useTutorialLogic = (initialFlow = initialTutorialFlow) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tutorialFlowData] = useState(initialFlow);
  const currentTutorialStep = useMemo(() => tutorialFlowData[currentStepIndex] || null, [currentStepIndex, tutorialFlowData]);
  const showNextButton = useMemo(() => currentTutorialStep?.showNextButton !== undefined ? currentTutorialStep.showNextButton : true, [currentTutorialStep]);
  const nextButtonText = useMemo(() => currentTutorialStep?.nextButtonText || "次へ", [currentTutorialStep]);
  const targetElementId = useMemo(() => currentTutorialStep?.targetElementId || null, [currentTutorialStep]);
  const targetItemBaseId = useMemo(() => currentTutorialStep?.targetItemBaseId || null, [currentTutorialStep]);
  const isTutorialActionAllowed = useCallback((actionType, actionDetail) => {
    if (!currentTutorialStep || !currentTutorialStep.allowedActions) { return false; }
    return currentTutorialStep.allowedActions.some(allowedAction => {
      if (allowedAction.type !== actionType) return false;
      if (actionType === 'CLICK_ELEMENT') { return allowedAction.elementId === actionDetail?.elementId && (allowedAction.expectedData === undefined || allowedAction.expectedData === actionDetail?.expectedData); }
      if (actionType === 'SELECT_STATUS') { return allowedAction.status === actionDetail?.status; }
      if (actionType === 'SELECT_CARD') { return allowedAction.cardId === actionDetail?.cardId; }
      if (actionType === 'EVENT_CHOICE') { return allowedAction.choiceType === actionDetail?.choiceType; }
      if (actionType === 'CLICK_NEXT_TO_TITLE') { return true; }
      if (actionType === 'TUTORIAL_NEXT_BUTTON') { return true; }
      if (actionType === 'SELECT_ITEM') { return allowedAction.itemId === actionDetail?.itemBaseId; }
      if (actionType === 'SELECT_EXAMINER_FOR_ITEM' || actionType === 'SELECT_EXAMINER_FOR_CARD') { return allowedAction.examinerName === actionDetail?.examinerName; }
      if (actionType === 'CONFIRM_ITEM_USE' || actionType === 'CONFIRM_CARD_PLAY') { return allowedAction.itemId === actionDetail?.itemId && allowedAction.examinerName === actionDetail?.examinerName; }
      if (actionType === 'SELECT_HAND_CARD') { return allowedAction.cardId === actionDetail?.cardId; }
      return false;
    });
  }, [currentTutorialStep]);
  const completeTutorialStep = useCallback((actionData = {}) => { const nextIndex = currentStepIndex + 1; if (nextIndex < tutorialFlowData.length) { setCurrentStepIndex(nextIndex); } else { const endIndex = tutorialFlowData.findIndex(step => step.id === TUTORIAL_STEPS.END); if (endIndex !== -1) { setCurrentStepIndex(endIndex); } } }, [currentStepIndex, tutorialFlowData, setCurrentStepIndex]);
  const setTutorialStepById = useCallback((stepId) => { const stepIndex = tutorialFlowData.findIndex(step => step.id === stepId); if (stepIndex !== -1) { setCurrentStepIndex(stepIndex); } else { console.warn(`Tutorial step with id "${stepId}" not found.`); } }, [tutorialFlowData]);
  return { currentTutorialStep, showNextButton, nextButtonText, targetElementId, targetItemBaseId, isTutorialActionAllowed, completeTutorialStep, setTutorialStepById };
};