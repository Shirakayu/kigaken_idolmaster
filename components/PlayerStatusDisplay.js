// components/PlayerStatusDisplay.js
import React from 'react';
import { STATUS_TYPE } from '../data/abilityCards';

const PlayerStatusDisplay = ({ playerState, onOpenDeckViewer }) => { // ★ onOpenDeckViewer を props で受け取る
  const additionalDeckLength = playerState?.additionalDeck?.length || 0;
  const usedAdditionalCardsLength = playerState?.usedAdditionalCardsThisExam?.length || 0;
  const traitChangeItemsLength = playerState?.inventory?.traitChangeItems?.length || 0;

  return (
    <div style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> {/* ★ タイトルとボタンを横並びにするため */}
        <h3>プレイヤーステータス</h3>
        {/* ★ 確認ボタンの追加 */}
        {onOpenDeckViewer && ( // gameState が試験または育成中など、意味のある場面でのみ表示する制御も可能
          <button
            onClick={onOpenDeckViewer}
            style={{ padding: '5px 10px', fontSize: '0.9em' }}
          >
            山札確認
          </button>
        )}
      </div>
      {playerState && playerState.stats ? (
        <>
          <p>In Vivo: {playerState.stats[STATUS_TYPE.IN_VIVO].toFixed(1)}</p>
          <p>In Vitro: {playerState.stats[STATUS_TYPE.IN_VITRO].toFixed(1)}</p>
          <p>In Silico: {playerState.stats[STATUS_TYPE.IN_SILICO].toFixed(1)}</p>
        </>
      ) : ( <p>ステータス情報なし</p> )}
      <p>総スコア: {playerState ? playerState.totalScore : 0}</p>
      <p>育成獲得カード枚数: {additionalDeckLength}</p>
      <p>使用済みカード枚数(今試験): {usedAdditionalCardsLength}</p>
      <p>特性変更アイテム: {traitChangeItemsLength}</p>
    </div>
  );
};

export default PlayerStatusDisplay;