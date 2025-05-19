// components/IkuseiPhaseUINew.js
import React from 'react';
import { EXAM_SETTINGS } from '../data/initialGameState';
import { STATUS_TYPE } from '../data/abilityCards';
// import { allAbilityCards as globalAllAbilityCards } from '../utils/cardUtils'; // 必要に応じて

const IkuseiPhaseUINew = ({
    playerState, currentIkuseiRoundTotal, step, lastGrowth, options, lastAcquired,
    onStatusSelect, onProceedToCardSelection, onCardAcquire, onProceedToNextRoundOrEvent,
    isEventActive, currentEvent, onEventChoice, eventResult,
    onCloseEvent, setIkuseiPhaseStep,
    onConfirmForcedExamTransition,
    tutorialControl // チュートリアルモードでない場合は undefined や null が渡される想定
  }) => {

  const displayRoundLimit = playerState && EXAM_SETTINGS[playerState.currentExamIndex] ?
                            EXAM_SETTINGS[playerState.currentExamIndex].roundLimitBeforeExam : 'N/A';
  const displayCurrentRound = playerState ? currentIkuseiRoundTotal + 1 : 1;

  // 通常プレイ時かチュートリアルプレイ時かを判定するフラグ
  const isTutorialMode = !!tutorialControl;

  return (
    <div style={{ border: '1px solid lightblue', padding: '15px', margin: '10px 0' }}>
      <h2>
        育成フェイズ (ラウンド: {displayCurrentRound} / {displayRoundLimit})
      </h2>
      {isEventActive && currentEvent ? (
        <div style={{border: '2px dashed orange', padding: '10px', margin: '10px 0'}}>
          <h3>ランダムイベント発生！</h3><h4>{currentEvent.name}</h4>
          {step === 'EVENT_SCENARIO' && (
            <>
              <p style={{border: '1px solid #ddd', padding: '10px', margin: '10px 0', whiteSpace: 'pre-wrap'}}>{currentEvent.scenario}</p>
              <button onClick={() => {if(setIkuseiPhaseStep) setIkuseiPhaseStep('EVENT_CHOICES')}} style={{ margin: '5px', padding: '8px' }}>選択肢へ進む</button>
            </>
          )}
          {step === 'EVENT_CHOICES' && currentEvent.choices && (
            <div>
                <p>どうしますか？</p>
                {currentEvent.choices.map((choice, index) => {
                    const choiceButtonId = `event_choice_${choice.type}`;
                    // チュートリアルモードの場合のみ無効化を考慮
                    const isDisabled = isTutorialMode && tutorialControl?.targetElementId && tutorialControl.targetElementId !== choiceButtonId;
                    return (
                        <button
                            key={index}
                            id={choiceButtonId}
                            onClick={() => onEventChoice(choice)}
                            style={{
                                margin: '5px', padding: '8px', display: 'block',
                                opacity: isDisabled ? 0.5 : 1,
                                pointerEvents: isDisabled ? 'none' : 'auto',
                                border: '1px solid #ccc',
                                backgroundColor: isDisabled ? '#f0f0f0' : 'white',
                            }}
                            disabled={isDisabled}
                        >
                            {choice.text}
                        </button>
                    );
                })}
            </div>
          )}
          {step === 'EVENT_RESULT' && eventResult && (
            <div>
                <h4>イベント結果</h4>
                <p>
                    {eventResult.type === 'card' && `カード「${eventResult.name}」を入手しました！`}
                    {eventResult.type === 'item' && eventResult.item && `アイテム「${eventResult.item.name}」を入手しました！`}
                    {(!eventResult.name && !eventResult.item && eventResult.type !== 'none') && "特に何も得られませんでした。"}
                    {eventResult.type === 'none' && `${eventResult.name}`}
                </p>
                <button onClick={onCloseEvent} style={{ margin: '5px', padding: '8px' }}>育成に戻る</button>
            </div>
          )}
        </div>
      ) : step === 'FORCED_EXAM_TRANSITION' ? (
        <div style={{textAlign: 'center', padding: '20px'}}>
            <h3>育成期間終了</h3>
            <p style={{margin: '10px 0'}}>まもなく{playerState ? (EXAM_SETTINGS[playerState.currentExamIndex]?.name || "次の試験") : "次の試験"}が始まります。</p>
            <button onClick={onConfirmForcedExamTransition} style={{ padding: '10px 20px', fontSize: '1.1em', backgroundColor: 'orange', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>試験の準備へ進む</button>
        </div>
      ) : (
        <>
          {step === 'SELECT_STATUS' && (
            <div>
              <h4>どのステータスを伸ばしますか？</h4>
              {[STATUS_TYPE.IN_VIVO, STATUS_TYPE.IN_VITRO, STATUS_TYPE.IN_SILICO]
                .map(status => {
                  const buttonId = `button_status_${status.replace(' ', '_')}`;
                  // チュートリアルモードの場合のみ無効化を考慮
                  const isDisabled = isTutorialMode && tutorialControl?.targetElementId && tutorialControl.targetElementId !== buttonId;
                  return (
                    <button
                      key={status}
                      id={buttonId}
                      onClick={() => onStatusSelect(status)}
                      style={{
                        margin: '5px', padding: '8px',
                        border: '1px solid gray',
                        opacity: isDisabled ? 0.5 : 1,
                        pointerEvents: isDisabled ? 'none' : 'auto',
                      }}
                      disabled={isDisabled}
                    >
                      {status} を育成
                    </button>
                  );
                })}
            </div>
          )}
          {step === 'SHOW_GROWTH' && lastGrowth && (
            <div>
                <h4>成長結果</h4>
                {lastGrowth.probabilityBonusTriggered && (<p style={{color: 'orange', fontWeight: 'bold'}}>ラッキー！確率ボーナスが発動しました！</p>)}
                <p>
                    {lastGrowth.status} が <strong>{lastGrowth.growth.toFixed(1)}</strong> 変化しました！ <br />
                    (基礎変化量: {lastGrowth.baseGrowth.toFixed(1)}, メンター影響: {lastGrowth.bonus.toFixed(1)})
                </p>
                {/* 通常プレイ時にはこのボタンを表示する */}
                {!isTutorialMode && onProceedToCardSelection && (
                  <button onClick={onProceedToCardSelection} style={{ margin: '10px 5px', padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    カード獲得へ進む
                  </button>
                )}
            </div>
          )}
          {step === 'SELECT_CARD' && options && options.length > 0 && (
            <div>
              <h4>獲得するカードを1枚選択してください</h4>
              {options.map(cardData => {
                if (!cardData || !cardData.id) {
                    return null;
                }
                const cardIdForControl = `card_option_${cardData.id}`;
                // チュートリアルモードの場合のみ無効化を考慮
                const isDisabled = isTutorialMode && tutorialControl?.targetElementId && tutorialControl.targetElementId !== cardIdForControl;
                return (
                  <button
                    key={cardData.id}
                    id={cardIdForControl}
                    onClick={() => onCardAcquire(cardData.id)}
                    style={{
                      margin: '5px', padding: '8px', display: 'block', textAlign: 'left', width: '90%',
                      border: '1px solid #ccc',
                      opacity: isDisabled ? 0.5 : 1,
                      pointerEvents: isDisabled ? 'none' : 'auto',
                      backgroundColor: isDisabled ? '#f0f0f0' : 'white',
                    }}
                    disabled={isDisabled}
                  >
                    <strong>{cardData.name}</strong> ({cardData.rarity})<br />
                    <small>{cardData.description}</small>
                  </button>
                );
              })}
            </div>
          )}
          {step === 'SELECT_CARD' && (!options || options.length === 0) && (
            <div>
                <p>提示できるカードがありませんでした。</p>
                {/* 通常プレイ時にはこのボタンを表示する */}
                {!isTutorialMode && onProceedToNextRoundOrEvent && (
                    <button onClick={onProceedToNextRoundOrEvent} style={{ margin: '10px 5px', padding: '8px 15px', cursor: 'pointer' }}>
                        次の育成ステップへ
                    </button>
                )}
            </div>
          )}
          {step === 'SHOW_ACQUISITION' && lastAcquired && (
            <div>
                <h4>カード獲得！</h4>
                <p>「{lastAcquired.name}」を獲得しました！</p>
                {/* 通常プレイ時にはこのボタンを表示する */}
                {!isTutorialMode && onProceedToNextRoundOrEvent && (
                    <button onClick={onProceedToNextRoundOrEvent} style={{ margin: '10px 5px', padding: '8px 15px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        次の育成ステップへ
                    </button>
                )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default IkuseiPhaseUINew;