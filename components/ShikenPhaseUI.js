// components/ShikenPhaseUI.js
import React from 'react';
import ExaminerDisplay from './ExaminerDisplay';
import HandDisplay from './HandDisplay';
import { allAbilityCards } from '../utils/cardUtils';
// EXAM_SETTINGS は currentExamSettings prop として親から渡されるので、ここでは直接インポート不要

const ShikenPhaseUI = ({
    playerState, examiners, currentExamSettings, currentExamRound, hand,
    onExaminerSelect,     // 親から受け取る: 試験官が選択されたときのコールバック
    onCardSelect,         // 親から受け取る: カードが選択されたときのコールバック
    onPlayCard,           // 親から受け取る: 「カードを使用する」ボタンが押されたときのコールバック
    currentExamScore,
    lastRoundResultData,
    onProceedFromRoundResult,
    selectedCardInstanceId, // 親から受け取る: 選択中のカードのインスタンスID
    selectedExaminerName,   // 親から受け取る: 選択中の試験官の名前
    tutorialControl         // チュートリアルモードでのみ渡される
}) => {

  const isTutorialMode = !!tutorialControl;
  const currentTargetElementId = isTutorialMode ? tutorialControl.targetElementId : null;

  // 選択状態は親コンポーネント(game.js or tutorial.js)からpropsで渡される
  const finalSelectedCardInstanceId = selectedCardInstanceId;
  const finalSelectedExaminerName = selectedExaminerName;

  const canPlayCard = finalSelectedCardInstanceId && finalSelectedExaminerName && !lastRoundResultData;

  const getSelectedCardName = () => {
    if (!finalSelectedCardInstanceId || !hand) return "";
    const cardInst = hand.find(c => c.instanceId === finalSelectedCardInstanceId);
    return cardInst && allAbilityCards ? allAbilityCards.get(cardInst.baseId)?.name : "";
  };

  const isNormaAchievedInUI = currentExamSettings && currentExamScore >= currentExamSettings.normaScore;

  if (lastRoundResultData) {
    return (
      <div style={{ border: '1px solid purple', padding: '15px', margin: '10px 0', textAlign: 'center' }}>
        <h2>ラウンド {currentExamRound +1} の結果</h2> {/* currentExamRoundはカード使用前のラウンド */}
        <p>使用カード: 「{lastRoundResultData.playedCardName}」 (対象: {lastRoundResultData.targetExaminerName})</p>
        <div style={{ margin: '10px 0', padding: '10px', border: '1px solid #eee', maxHeight: '200px', overflowY: 'auto' }}>
            {lastRoundResultData.examinerResults && lastRoundResultData.examinerResults.length > 0 ? lastRoundResultData.examinerResults.map(res => (
                <p key={res.name} style={{margin: '5px 0'}}>
                    <strong>{res.name}:</strong> 満足度 {res.oldSatisfaction.toFixed(1)} → {res.newSatisfaction.toFixed(1)}
                    (<span style={{color: res.satisfactionIncrease >= 0 ? 'green' : 'red'}}>{res.satisfactionIncrease >= 0 ? '+' : ''}{res.satisfactionIncrease.toFixed(1)}</span>)
                    {res.evaluationGained > 0 && <span style={{color: 'blue', marginLeft: '10px'}}>評価スコア +{res.evaluationGained}</span>}
                </p>
            )) : <p>特に満足度の変化はありませんでした。</p>}
        </div>
        <p style={{fontWeight: 'bold'}}>このターンで得た総評価スコア: {lastRoundResultData.totalEvaluationGainedThisTurn}</p>
        <p style={{fontWeight: 'bold'}}>現在の試験スコア: {currentExamScore}</p> {/* 更新後のスコア */}
        <button onClick={onProceedFromRoundResult} style={{padding: '10px 20px', fontSize: '1.1em', backgroundColor: 'teal', color: 'white', marginTop: '15px', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>次へ</button>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid salmon', padding: '15px', margin: '10px 0' }}>
      <h2>試験フェイズ: {currentExamSettings?.name || "試験"} (ラウンド: {currentExamRound + 1} / {currentExamSettings?.roundLimit || 'N/A'})</h2>
      <p>現在の試験スコア: {currentExamScore} / ノルマ: {currentExamSettings?.normaScore || 'N/A'}</p>
      {currentExamSettings && isNormaAchievedInUI && currentExamRound + 1 <= currentExamSettings.roundLimit && (<p style={{color: 'green', fontWeight: 'bold', textAlign: 'center'}}>ノルマ達成！ {currentExamRound + 1 < currentExamSettings.roundLimit ? "残りラウンドでさらにスコアを稼げます！" : "試験終了です。"}</p>)}

      <h4>試験官 (クリックで対象を選択)</h4>
      <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
        {examiners && examiners.map(ex => { // examiners の存在をチェック
          const examinerDisplayId = `examiner_display_${ex.name}`;
          const isDisabledByTutorial = isTutorialMode && currentTargetElementId && currentTargetElementId !== examinerDisplayId && !finalSelectedExaminerName;
          return (
            <ExaminerDisplay
              key={ex.name}
              examiner={ex}
              isSelected={finalSelectedExaminerName === ex.name}
              onSelect={() => onExaminerSelect(ex.name)}
              idForTutorial={examinerDisplayId}
              isDisabledByTutorial={isDisabledByTutorial}
              showPreferredStatus={true}
            />
          );
        })}
      </div>

      <HandDisplay
        hand={hand || []} // hand が undefined の場合のフォールバック
        selectedCardInstanceId={finalSelectedCardInstanceId}
        onCardSelect={onCardSelect} // ★ 親から渡された onCardSelect を HandDisplay に渡す
        disabled={lastRoundResultData !== null}
        tutorialControl={isTutorialMode ? { targetElementId: currentTargetElementId } : null}
      />

      {finalSelectedCardInstanceId && <p style={{marginTop: '10px', textAlign:'center'}}>選択中カード: {getSelectedCardName()}</p>}
      {finalSelectedExaminerName && <p style={{textAlign:'center'}}>対象試験官: {finalSelectedExaminerName}</p>}

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        {(() => {
            const playButtonId = "button_play_card";
            const isPlayButtonDisabledByTutorial = isTutorialMode && currentTargetElementId && currentTargetElementId !== playButtonId;
            const finalCanPlay = canPlayCard && (currentExamSettings && currentExamRound + 1 <= currentExamSettings.roundLimit);

            return (
                <button
                    id={playButtonId}
                    onClick={onPlayCard} // 親から渡された onPlayCard を使用
                    disabled={!finalCanPlay || isPlayButtonDisabledByTutorial}
                    style={{
                        padding: '10px 20px', fontSize: '1.1em',
                        backgroundColor: (finalCanPlay && !isPlayButtonDisabledByTutorial) ? 'blue' : 'grey',
                        color: 'white',
                        opacity: (!finalCanPlay || isPlayButtonDisabledByTutorial) ? 0.5 : 1,
                        pointerEvents: (!finalCanPlay || isPlayButtonDisabledByTutorial) ? 'none' : 'auto',
                    }}
                >
                    カードを使用する
                </button>
            );
        })()}
      </div>
    </div>
  );
};

export default ShikenPhaseUI;