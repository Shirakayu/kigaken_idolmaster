// components/ExamResultDisplay.js
import React from 'react';

const ExamResultDisplay = ({ resultInfo, onProceed }) => {
  if (!resultInfo) return null;
  let title = "";
  let message = "";
  if (resultInfo.isGameClear) {
    title = "ゲームクリア！";
    message = `全ての試験をクリアしました！素晴らしい成果です！`;
  } else if (resultInfo.isClear) {
    title = `${resultInfo.examName} クリア！`;
    message = `ノルマ ${resultInfo.normaScore} に対し、${resultInfo.achievedScore} の評価を得ました。`;
  } else if (resultInfo.isGameOver) {
    title = "ゲームオーバー...";
    message = `${resultInfo.examName} でノルマを達成できませんでした。`;
  } else {
      title = "試験結果";
      message = "結果を確認してください。";
  }
  return (
    <div style={{ border: '2px solid #ccc', padding: '20px', marginTop: '20px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
      <h2>{title}</h2>
      <p style={{ fontSize: '1.1em', margin: '15px 0' }}>{message}</p>
      {resultInfo.isClear && !resultInfo.isGameClear && (<p>現在の総スコア: {resultInfo.finalTotalScore}</p>)}
      {resultInfo.isGameClear && (<p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>最終総スコア: {resultInfo.finalTotalScore}</p>)}
      {!resultInfo.isGameClear && !resultInfo.isGameOver && (<p style={{marginTop: '10px', color: 'gray'}}>次の試験に向けて育成を続けましょう。</p>)}
      <button onClick={onProceed} style={{padding: '10px 20px', fontSize: '1em', cursor: 'pointer', backgroundColor: 'dodgerblue', color: 'white', border: 'none', borderRadius: '5px', marginTop: '20px'}}>
        {resultInfo.isGameClear || resultInfo.isGameOver ? 'タイトルへ戻る' : '次の育成へ'}
      </button>
    </div>
  );
};

export default ExamResultDisplay;