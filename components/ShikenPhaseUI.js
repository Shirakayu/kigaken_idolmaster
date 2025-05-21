// components/ShikenPhaseUI.js
import React, { useMemo } from 'react';
import ExaminerDisplay from './ExaminerDisplay';
import HandDisplay from './HandDisplay';
import { allAbilityCards } from '../utils/cardUtils';
import { TARGET_TYPE } from '../data/abilityCards';

const ShikenPhaseUI = ({
    playerState, examiners, currentExamSettings, currentExamRound, hand,
    onExaminerSelect,
    onCardSelect,
    onPlayCard,
    currentExamScore,
    lastRoundResultData,
    onProceedFromRoundResult,
    selectedCardInstanceId,
    selectedExaminerName,
    tutorialControl
}) => {

  const isTutorialMode = !!tutorialControl;
  const currentTargetElementId = isTutorialMode ? tutorialControl.targetElementId : null;

  const finalSelectedCardInstanceId = selectedCardInstanceId;
  const finalSelectedExaminerName = selectedExaminerName;

  const selectedCardData = useMemo(() => {
    if (!finalSelectedCardInstanceId || !hand || !allAbilityCards) return null;
    const cardInst = hand.find(c => c.instanceId === finalSelectedCardInstanceId);
    return cardInst ? allAbilityCards.get(cardInst.baseId) : null;
  }, [finalSelectedCardInstanceId, hand]);


  const canPlayCard = finalSelectedCardInstanceId && selectedCardData &&
                      (selectedCardData.targetType === TARGET_TYPE.PLAYER_SELF ||
                       selectedCardData.targetType === TARGET_TYPE.ALL ||
                       selectedCardData.targetType === TARGET_TYPE.RANDOM_TWO ||
                       finalSelectedExaminerName) &&
                      !lastRoundResultData;


  const getSelectedCardName = () => {
    return selectedCardData ? selectedCardData.name : "";
  };

  const isNormaAchievedInUI = currentExamSettings && currentExamScore >= currentExamSettings.normaScore;

  if (lastRoundResultData) {
    const maxAttentionForDisplay = 5;
    // ★ 変更点: カード名と対象の後に改行を追加
    let resultMessage = `使用カード: 「${lastRoundResultData.playedCardName}」 (対象: ${lastRoundResultData.targetDescription})\n\n`; // ここに改行を一つ追加

    if (lastRoundResultData.effects && lastRoundResultData.effects.length > 0) {
      lastRoundResultData.effects.forEach((effect, index) => {
        const attentionBefore = Math.max(0, maxAttentionForDisplay - (effect.satisfactionCountForThisPlay - 1));
        const attentionAfter = Math.max(0, maxAttentionForDisplay - effect.satisfactionCountForThisPlay);

        resultMessage += `--- ${effect.examinerName} ---\n`;
        resultMessage += `  注目度: ${attentionBefore} → ${attentionAfter}\n`;
        resultMessage += `  獲得スコア: ${effect.scoreGainedThisTarget}\n`;
        if (index < lastRoundResultData.effects.length - 1) {
            resultMessage += `\n`;
        }
      });
      resultMessage += `\nこのカードでの総獲得スコア: ${lastRoundResultData.totalScoreGainedThisPlay}\n`;

    } else if (lastRoundResultData.targetDescription === "自分") {
        resultMessage += `自己強化カードを使用しました。\n`;
    } else if (lastRoundResultData.targetDescription && lastRoundResultData.targetDescription !== "自分") {
        resultMessage += `効果対象がいませんでした。\n`;
    }


    return (
      <div style={{ border: '1px solid purple', padding: '15px', margin: '10px 0', textAlign: 'center' }}>
        <h2>ラウンド {currentExamRound +1} の結果</h2>
        <div style={{ margin: '10px 0', padding: '10px', border: '1px solid #eee', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
            {resultMessage}
        </div>
        <p style={{fontWeight: 'bold'}}>現在の試験スコア: {lastRoundResultData.newTotalExamScore} / ノルマ: {currentExamSettings?.normaScore || 'N/A'}</p>
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
        {examiners && examiners.map(ex => {
          const examinerDisplayId = `examiner_display_${ex.name}`;
          const isDisabledByTutorial = isTutorialMode && currentTargetElementId && currentTargetElementId !== examinerDisplayId &&
                                      !(selectedCardData?.targetType === TARGET_TYPE.ALL || selectedCardData?.targetType === TARGET_TYPE.RANDOM_TWO || selectedCardData?.targetType === TARGET_TYPE.PLAYER_SELF) &&
                                      !finalSelectedExaminerName;
          const disableSelection = selectedCardData &&
                                   (selectedCardData.targetType === TARGET_TYPE.ALL ||
                                    selectedCardData.targetType === TARGET_TYPE.RANDOM_TWO ||
                                    selectedCardData.targetType === TARGET_TYPE.PLAYER_SELF);

          return (
            <ExaminerDisplay
              key={ex.name}
              examiner={ex}
              isSelected={finalSelectedExaminerName === ex.name && !disableSelection}
              onSelect={disableSelection ? undefined : () => onExaminerSelect(ex.name)}
              idForTutorial={examinerDisplayId}
              isDisabledByTutorial={isDisabledByTutorial || disableSelection}
              showPreferredStatus={true}
            />
          );
        })}
      </div>

      <HandDisplay
        hand={hand || []}
        selectedCardInstanceId={finalSelectedCardInstanceId}
        onCardSelect={onCardSelect}
        disabled={lastRoundResultData !== null}
        tutorialControl={isTutorialMode ? { targetElementId: currentTargetElementId } : null}
      />

      {finalSelectedCardInstanceId && <p style={{marginTop: '10px', textAlign:'center'}}>選択中カード: {getSelectedCardName()}</p>}
      {finalSelectedExaminerName && selectedCardData && selectedCardData.targetType === TARGET_TYPE.SINGLE && <p style={{textAlign:'center'}}>対象試験官: {finalSelectedExaminerName}</p>}

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        {(() => {
            const playButtonId = "button_play_card";
            const isPlayButtonDisabledByTutorial = isTutorialMode && currentTargetElementId && currentTargetElementId !== playButtonId;
            const finalCanPlay = canPlayCard && (currentExamSettings && currentExamRound + 1 <= currentExamSettings.roundLimit);

            return (
                <button
                    id={playButtonId}
                    onClick={onPlayCard}
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