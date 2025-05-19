// components/HandDisplay.js
import React from 'react';
import { allAbilityCards } from '../utils/cardUtils';

const HandDisplay = ({ hand, selectedCardInstanceId, onCardSelect, disabled, tutorialControl }) => {
  const isTutorialMode = !!tutorialControl;
  const currentTargetElementId = isTutorialMode ? tutorialControl.targetElementId : null;

  return (
    <div style={{ marginTop: '20px' }}>
      <h4>手札 (3枚)</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {hand.map(cardInstance => {
          const cardData = allAbilityCards.get(cardInstance.baseId);
          if (!cardData) return ( <div key={cardInstance.instanceId || `empty-${Math.random()}`} style={{ border: '1px dashed #ccc', padding: '10px', margin: '5px', width: '150px', minHeight: '80px', backgroundColor: '#f9f9f9' }}>カード情報なし (BaseID: {cardInstance.baseId})</div> );

          const cardElementId = `hand_card_${cardData.id}`; // IDはベースIDで
          // チュートリアル中で、ターゲットが指定されていて、このカードがターゲットでない場合は無効
          // ただし、既にカードが選択されている場合は、他のカードを無効化する必要はないかもしれないので、
          // currentTargetElementId が手札カードを指している場合のみ、他のカードを無効化する。
          let isDisabledByTutorial = false;
          if (isTutorialMode && currentTargetElementId && currentTargetElementId.startsWith('hand_card_')) {
              isDisabledByTutorial = currentTargetElementId !== cardElementId;
          }


          const finalDisabled = disabled || isDisabledByTutorial;
          const isSelected = selectedCardInstanceId === cardInstance.instanceId;

          const cardStyle = {
            border: `2px solid ${isSelected && !finalDisabled ? 'red' : 'black'}`,
            padding: '10px', margin: '5px',
            cursor: finalDisabled ? 'default' : 'pointer',
            width: '180px', minHeight: '100px',
            backgroundColor: isSelected && !finalDisabled ? '#ffe0e0' : (cardInstance.isInitial ? '#fff' : '#e6ffe6'),
            opacity: finalDisabled ? 0.5 : 1,
            pointerEvents: finalDisabled ? 'none' : 'auto',
          };

          return (
            <div
              key={cardInstance.instanceId}
              id={cardElementId}
              style={cardStyle}
              onClick={finalDisabled ? undefined : () => onCardSelect(cardInstance.instanceId)}
            >
              <strong>{cardData.name}</strong> ({cardData.rarity})
              <p style={{ fontSize: '0.8em', marginTop: '5px' }}>{cardData.description}</p>
              {cardInstance.isInitial && <small style={{color: 'gray'}}>(初期カード)</small>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HandDisplay;