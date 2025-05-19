// data/mentors.js
import { STATUS_TYPE } from './abilityCards';

export const mentors = [
  // --- ウエツカA, B, C (固定ボーナス) ---
  {
    id: 'uetsuka_a',
    name: 'ウエツカA',
    description: 'in vivoステータスの成長を安定してサポートする。',
    statusBonus: { [STATUS_TYPE.IN_VIVO]: 0.30 }, // In Vivo成長率 +30%
  },
  {
    id: 'uetsuka_b',
    name: 'ウエツカB',
    description: 'in vitroステータスの成長を安定してサポートする。',
    statusBonus: { [STATUS_TYPE.IN_VITRO]: 0.30 }, // In Vitro成長率 +30%
  },
  {
    id: 'uetsuka_c',
    name: 'ウエツカC',
    description: 'in silicoステータスの成長を安定してサポートする。',
    statusBonus: { [STATUS_TYPE.IN_SILICO]: 0.30 }, // In Silico成長率 +30%
  },
  // --- ウエツカD, E, F (確率ボーナス) ---
  // 要件ではD,E,F全てin vivoですが、ここでは例としてin vitro, in silicoも対象にしています。
  // もし全てin vivoで正しい場合は、statusプロパティを修正してください。
  {
    id: 'uetsuka_d',
    name: 'ウエツカD',
    description: '時折、in vivo研究で大きなひらめきを与える。',
    statusBonus: { type: 'probability', probability: 0.30, status: STATUS_TYPE.IN_VIVO, bonus: 1.00 }, // 30%の確率でIn Vivo成長率 +100%
  },
  {
    id: 'uetsuka_e',
    name: 'ウエツカE',
    description: '時折、in vitro研究で大きなひらめきを与える。', // 要件に合わせて in vivo に修正可
    statusBonus: { type: 'probability', probability: 0.30, status: STATUS_TYPE.IN_VITRO, bonus: 1.00 }, // 30%の確率でIn Vitro成長率 +100%
  },
  {
    id: 'uetsuka_f',
    name: 'ウエツカF',
    description: '時折、in silico研究で大きなひらめきを与える。', // 要件に合わせて in vivo に修正可
    statusBonus: { type: 'probability', probability: 0.30, status: STATUS_TYPE.IN_SILICO, bonus: 1.00 }, // 30%の確率でIn Silico成長率 +100%
  },
  // --- ウエツカG, H, I (複数ステータスへの影響) ---
  {
    id: 'uetsuka_g',
    name: 'ウエツカG',
    description: 'in vivoに特化するが、in vitroは少し疎かになるかも。',
    statusBonus: { [STATUS_TYPE.IN_VIVO]: 0.50, [STATUS_TYPE.IN_VITRO]: -0.20 }, // In Vivo +50%, In Vitro -20%
  },
  {
    id: 'uetsuka_h',
    name: 'ウエツカH',
    description: 'in vitroに特化するが、in silicoは少し疎かになるかも。',
    statusBonus: { [STATUS_TYPE.IN_VITRO]: 0.50, [STATUS_TYPE.IN_SILICO]: -0.20 }, // In Vitro +50%, In Silico -20%
  },
  {
    id: 'uetsuka_i',
    name: 'ウエツカI',
    description: 'in silicoに特化するが、in vivoは少し疎かになるかも。',
    statusBonus: { [STATUS_TYPE.IN_SILICO]: 0.50, [STATUS_TYPE.IN_VIVO]: -0.20 }, // In Silico +50%, In Vivo -20%
  },
  // 既存のメンター定義例（コメントアウトまたは削除）
  /*
  {
    id: 'mentor_a_old',
    name: 'A教授 (分子生物学の権威)',
    description: 'In Vivo研究の指導に長ける。基礎を重視。',
    statusBonus: { [STATUS_TYPE.IN_VIVO]: 0.15, [STATUS_TYPE.IN_VITRO]: 0.05 },
    // specialAbilityCardId: 'mentor_a_special', // 削除
  },
  {
    id: 'mentor_b_old',
    name: 'B博士 (情報科学の鬼才)',
    description: 'In Silico解析が得意。大胆な発想を促す。',
    statusBonus: { [STATUS_TYPE.IN_SILICO]: 0.20, [STATUS_TYPE.IN_VIVO]: -0.05 },
    // specialAbilityCardId: 'mentor_b_special', // 削除
  },
  {
    id: 'mentor_c_old',
    name: 'C研究員 (実験手技の達人)',
    description: 'In Vitro実験の精度向上を助ける。堅実派。',
    statusBonus: { [STATUS_TYPE.IN_VITRO]: 0.15, [STATUS_TYPE.IN_SILICO]: 0.05 },
    // specialAbilityCardId: 'mentor_c_special', // 削除
  },
  */
];

// メンター固有カードは廃止のため、以下は削除またはコメントアウト
// export const mentorSpecialCards = [ /* ... */ ];

// allAbilityCardsへの追加処理も不要
// import { allAbilityCards as baseAllAbilityCards } from './abilityCards';
// if (typeof mentorSpecialCards !== 'undefined') { // 安全チェック
//   mentorSpecialCards.forEach(card => {
//     if (baseAllAbilityCards && !baseAllAbilityCards.has(card.id)) {
//       baseAllAbilityCards.set(card.id, card);
//     }
  // });
// }