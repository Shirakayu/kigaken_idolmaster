// components/PlayerStatusDisplay.js
import React from 'react';
import { STATUS_TYPE } from '../data/abilityCards'; // STATUS_TYPE を data ディレクトリからインポート

const PlayerStatusDisplay = ({ playerState }) => {
  const additionalDeckLength = playerState?.additionalDeck?.length || 0;
  const usedAdditionalCardsLength = playerState?.usedAdditionalCardsThisExam?.length || 0;
  const traitChangeItemsLength = playerState?.inventory?.traitChangeItems?.length || 0;

  return (
    <div style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
      <h3>プレイヤーステータス</h3>
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