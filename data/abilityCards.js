// data/abilityCards.js

export const RARITY = {
  INITIAL: '初期',
  UHN: 'う～ん',
  II: 'いい',
  KIGAI: '気がいい',
};

export const TARGET_TYPE = {
  SINGLE: 'single',
  ALL: 'all',
  PLAYER_SELF: 'player_self',
  RANDOM_TWO: 'random_two',
};

export const STATUS_TYPE = {
  IN_VIVO: 'in vivo',
  IN_VITRO: 'in vitro',
  IN_SILICO: 'in silico',
  NONE: 'none',      // ステータスを参照しない
  AVERAGE: 'average',  // プレイヤーの3ステータスの平均
  RANDOM: 'random',   // ランダムなステータス (in vivo, in vitro, in silico のいずれか)
  // HIGHEST_OWN_STATUS や LOWEST_OWN_STATUS も必要に応じて追加可能
};

// --- 初期デッキ用カード ---
export const initialDeckCards = [
  // 既存の初期カードはIDや効果を新しいものに合わせるか、新しいカードで完全に置き換え。
  // ここでは新しい定義に合わせて一部調整。
  // 初期カード
  {
    id: 'initial_培地調製',
    name: '培地調製',
    rarity: RARITY.INITIAL,
    description: '対象1人の満足度を『in vivo』×0.7上昇',
    targetType: TARGET_TYPE.SINGLE,
    referredStatus: STATUS_TYPE.IN_VIVO,
    effectMultiplier: 0.7,
    isInitial: true,
  },
  {
    id: 'initial_濃度計算',
    name: '濃度計算',
    rarity: RARITY.INITIAL,
    description: '対象1人の満足度を『in vitro』×0.7上昇',
    targetType: TARGET_TYPE.SINGLE,
    referredStatus: STATUS_TYPE.IN_VITRO,
    effectMultiplier: 0.7,
    isInitial: true,
  },
  {
    id: 'initial_ブラインドタッチ',
    name: 'ブラインドタッチ',
    rarity: RARITY.INITIAL,
    description: '対象1人の満足度を『in silico』×0.7上昇',
    targetType: TARGET_TYPE.SINGLE,
    referredStatus: STATUS_TYPE.IN_SILICO,
    effectMultiplier: 0.7,
    isInitial: true,
  },
];

// --- 育成で入手可能なカード ---
export const acquirableCards = [
  // === レアリティ: う～ん ===
  {
    id: 'uhn_形質転換', name: '形質転換', rarity: RARITY.UHN,
    description: '対象1人の満足度を『in vivo』×1.0上昇', // 説明文と参照ステータスを合わせる (元はin vitro x1 / ref in vivo)
    targetType: TARGET_TYPE.SINGLE, referredStatus: STATUS_TYPE.IN_VIVO, effectMultiplier: 1.0,
  },
  {
    id: 'uhn_ＰＣＲ反応', name: 'ＰＣＲ反応', rarity: RARITY.UHN,
    description: '対象1人の満足度を『in vitro』×1.0上昇',
    targetType: TARGET_TYPE.SINGLE, referredStatus: STATUS_TYPE.IN_VITRO, effectMultiplier: 1.0,
  },
  {
    id: 'uhn_アライメント', name: 'アライメント', rarity: RARITY.UHN,
    description: '対象1人の満足度を『in silico』×1.0上昇',
    targetType: TARGET_TYPE.SINGLE, referredStatus: STATUS_TYPE.IN_SILICO, effectMultiplier: 1.0,
  },
  {
    id: 'uhn_ミニプレップ', name: 'ミニプレップ', rarity: RARITY.UHN,
    description: '全員の満足度を『in vivo』×0.3上昇',
    targetType: TARGET_TYPE.ALL, referredStatus: STATUS_TYPE.IN_VIVO, effectMultiplier: 0.3,
  },
  {
    id: 'uhn_エタノール沈殿', name: 'エタノール沈殿', rarity: RARITY.UHN,
    description: '全員の満足度を『in vitro』×0.3上昇',
    targetType: TARGET_TYPE.ALL, referredStatus: STATUS_TYPE.IN_VITRO, effectMultiplier: 0.3,
  },
  {
    id: 'uhn_クラスタリング', name: 'クラスタリング', rarity: RARITY.UHN,
    description: '全員の満足度を『in silico』×0.3上昇',
    targetType: TARGET_TYPE.ALL, referredStatus: STATUS_TYPE.IN_SILICO, effectMultiplier: 0.3,
  },
  {
    id: 'uhn_キムワイプ', name: 'キムワイプ', rarity: RARITY.UHN,
    description: '対象1人の満足度を固定値20上昇させる',
    targetType: TARGET_TYPE.SINGLE,
    referredStatus: STATUS_TYPE.NONE,
    effectValue: 20, // 固定値上昇
  },

  // === レアリティ: いい ===
  {
    id: 'ii_発現誘導実験', name: '発現誘導実験', rarity: RARITY.II,
    description: '対象1人の満足度を『in vivo』×1.5上昇',
    targetType: TARGET_TYPE.SINGLE, referredStatus: STATUS_TYPE.IN_VIVO, effectMultiplier: 1.5,
  },
  {
    id: 'ii_無細胞転写翻訳', name: '無細胞転写翻訳', rarity: RARITY.II,
    description: '対象1人の満足度を『in vitro』×1.5上昇',
    targetType: TARGET_TYPE.SINGLE, referredStatus: STATUS_TYPE.IN_VITRO, effectMultiplier: 1.5,
  },
  {
    id: 'ii_祖先配列推定', name: '祖先配列推定', rarity: RARITY.II,
    description: '対象1人の満足度を『in silico』×1.5上昇',
    targetType: TARGET_TYPE.SINGLE, referredStatus: STATUS_TYPE.IN_SILICO, effectMultiplier: 1.5,
  },
  {
    id: 'ii_寒天培地上観察', name: '寒天培地上観察', rarity: RARITY.II,
    description: '全員の満足度を『in vivo』×0.7上昇',
    targetType: TARGET_TYPE.ALL, referredStatus: STATUS_TYPE.IN_VIVO, effectMultiplier: 0.7,
  },
  {
    id: 'ii_SDS-PAGE', name: 'SDS-PAGE', rarity: RARITY.II,
    description: '全員の満足度を『in vitro』×0.7上昇',
    targetType: TARGET_TYPE.ALL, referredStatus: STATUS_TYPE.IN_VITRO, effectMultiplier: 0.7,
  },
  {
    id: 'ii_表現空間構築', name: '表現空間構築', rarity: RARITY.II,
    description: '全員の満足度を『in silico』×0.5上昇', // 元は0.3だったが、レアリティ「いい」なので少し上方修正
    targetType: TARGET_TYPE.ALL, referredStatus: STATUS_TYPE.IN_SILICO, effectMultiplier: 0.5,
  },
  {
    id: 'ii_発表スライド査読', name: '発表スライド査読', rarity: RARITY.II,
    description: '全員の満足度を『自身の平均ステータス』×0.5上昇 (試験官の得意補正なし)',
    targetType: TARGET_TYPE.ALL, referredStatus: STATUS_TYPE.AVERAGE, effectMultiplier: 0.5,
  },
  {
    id: 'ii_質疑応答', name: '質疑応答', rarity: RARITY.II,
    description: 'ランダムな試験官2人の満足度を、自身のランダムなステータス×1.0上昇',
    targetType: TARGET_TYPE.RANDOM_TWO, referredStatus: STATUS_TYPE.RANDOM, effectMultiplier: 1.0,
  },
  {
    id: 'ii_パチンコバイオロジー', name: 'パチンコバイオロジー', rarity: RARITY.II,
    description: '対象1人の満足度を『in vivo』×0.5～2.0上昇（ランダム）',
    targetType: TARGET_TYPE.SINGLE, referredStatus: STATUS_TYPE.IN_VIVO, 
    effectType: 'random_multiplier', effectMultiplierMin: 0.5, effectMultiplierMax: 2.0,
  },

  // === レアリティ: 気がいい ===
  {
    id: 'kigai_Synergy', name: 'Synergy', rarity: RARITY.KIGAI,
    description: '対象1人の満足度を『in vivo』×2.0上昇',
    targetType: TARGET_TYPE.SINGLE, referredStatus: STATUS_TYPE.IN_VIVO, effectMultiplier: 2.0,
  },
  {
    id: 'kigai_Echo', name: 'Echo', rarity: RARITY.KIGAI,
    description: '対象1人の満足度を『in vitro』×2.0上昇',
    targetType: TARGET_TYPE.SINGLE, referredStatus: STATUS_TYPE.IN_VITRO, effectMultiplier: 2.0,
  },
  {
    id: 'kigai_alpha-hold', name: 'alpha-hold', rarity: RARITY.KIGAI,
    description: '対象1人の満足度を『in silico』×2.0上昇',
    targetType: TARGET_TYPE.SINGLE, referredStatus: STATUS_TYPE.IN_SILICO, effectMultiplier: 2.0,
  },
  {
    id: 'kigai_チェレンコフ光', name: 'チェレンコフ光', rarity: RARITY.KIGAI,
    description: '試験官全員の満足度を『自身の平均ステータス』×1.5上昇',
    targetType: TARGET_TYPE.ALL, referredStatus: STATUS_TYPE.AVERAGE, effectMultiplier: 1.5,
  },
  {
    id: 'kigai_ラボパスタ', name: 'ラボパスタ', rarity: RARITY.KIGAI,
    description: '次に使用するカードによる満足度上昇効果を2.5倍にする。',
    targetType: TARGET_TYPE.PLAYER_SELF, referredStatus: STATUS_TYPE.NONE,
    effectType: 'buff_next_card_satisfaction_multiplier', effectValue: 2.5,
  },
  {
    id: 'kigai_ラボ鍋', name: 'ラボ鍋', rarity: RARITY.KIGAI,
    description: 'この試験フェイズ中、自分が使用するカードによる満足度上昇効果を1.5倍にする。',
    targetType: TARGET_TYPE.PLAYER_SELF, referredStatus: STATUS_TYPE.NONE,
    effectType: 'buff_exam_satisfaction_multiplier', effectValue: 1.5, duration: 'exam',
  },
  {
    id: 'kigai_ラボ酒', name: 'ラボ酒', rarity: RARITY.KIGAI,
    description: 'この試験フェイズ中のみ、自分の全ステータスが20%上昇したものとして扱われる。',
    targetType: TARGET_TYPE.PLAYER_SELF, referredStatus: STATUS_TYPE.NONE,
    effectType: 'buff_exam_stats_percentage', effectValue: 0.20, duration: 'exam',
  },

];