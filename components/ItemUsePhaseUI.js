// components/ItemUsePhaseUI.js
import React, { useState, useEffect } from 'react';
import { allItems as allItemData } from '../data/items';
import ExaminerDisplay from './ExaminerDisplay';

const ItemUsePhaseUI = ({
    playerState, examiners,
    onItemUse,
    onItemSelect: onTutorialItemSelect,
    onExaminerSelect: onTutorialExaminerSelect,
    onConfirmItemUse: onTutorialConfirmItemUse,
    onSkipItemUse,
    selectedItemId: selectedItemInstanceIdFromParent,
    selectedExaminerName: selectedExaminerNameFromParent,
    tutorialControl
}) => {

  const traitChangeItemInstances = playerState.inventory?.traitChangeItems || [];
  const isTutorialMode = !!tutorialControl;
  const currentTargetElementId = isTutorialMode ? tutorialControl.targetElementId : null;

  const [localSelectedItemId, setLocalSelectedItemId] = useState(null);
  const [localSelectedExaminerName, setLocalSelectedExaminerName] = useState(null);

  useEffect(() => {
    if (isTutorialMode) {
      setLocalSelectedItemId(selectedItemInstanceIdFromParent);
      setLocalSelectedExaminerName(selectedExaminerNameFromParent);
    } else {
      if (localSelectedItemId && !traitChangeItemInstances.find(inst => inst.instanceId === localSelectedItemId)) {
          setLocalSelectedItemId(null);
          setLocalSelectedExaminerName(null);
      }
    }
  }, [isTutorialMode, selectedItemInstanceIdFromParent, selectedExaminerNameFromParent, traitChangeItemInstances, localSelectedItemId]);

  const finalSelectedItemInstanceId = isTutorialMode ? selectedItemInstanceIdFromParent : localSelectedItemId;
  const finalSelectedExaminerName = isTutorialMode ? selectedExaminerNameFromParent : localSelectedExaminerName;

  const getItemDataFromInstanceId = (instanceId) => {
    const itemInstance = traitChangeItemInstances.find(inst => inst.instanceId === instanceId);
    return itemInstance ? allItemData[itemInstance.id] : null;
  };

  const handleItemButtonClick = (itemInstanceId) => {
    if (isTutorialMode && onTutorialItemSelect) {
      onTutorialItemSelect(itemInstanceId);
    } else if (!isTutorialMode) {
      setLocalSelectedItemId(prevId => prevId === itemInstanceId ? null : itemInstanceId);
      setLocalSelectedExaminerName(null);
    }
  };

  const handleExaminerDisplayClick = (examinerName) => {
    if (finalSelectedItemInstanceId) {
      if (isTutorialMode && onTutorialExaminerSelect) {
        onTutorialExaminerSelect(examinerName);
      } else if (!isTutorialMode) {
        setLocalSelectedExaminerName(examinerName);
      }
    }
  };

  const handleConfirmClick = () => {
    const itemInstanceToUse = traitChangeItemInstances.find(inst => inst.instanceId === finalSelectedItemInstanceId);
    if (isTutorialMode && onTutorialConfirmItemUse) {
      onTutorialConfirmItemUse();
    } else if (!isTutorialMode && onItemUse && itemInstanceToUse && finalSelectedExaminerName) {
        onItemUse(itemInstanceToUse.instanceId, itemInstanceToUse.id, finalSelectedExaminerName);
        setLocalSelectedItemId(null);
        setLocalSelectedExaminerName(null);
    }
  };

  if (traitChangeItemInstances.length === 0) {
    if (isTutorialMode) {
        return <p style={{color: 'red', padding: '20px'}}>チュートリアルエラー: アイテムインベントリが空です。</p>;
    }
    return (
      <div style={{ border: '1px solid green', padding: '15px', margin: '10px 0' }}>
        <h2>アイテム使用フェイズ</h2>
        <p>使用可能な特性変更アイテムがありません。</p>
        <button onClick={onSkipItemUse} style={{ padding: '10px 15px' }}>試験へ進む</button>
      </div>
    );
  }

  const currentSelectedItemData = getItemDataFromInstanceId(finalSelectedItemInstanceId);

  return (
    <div style={{ border: '1px solid green', padding: '15px', margin: '10px 0' }}>
      <h2>アイテム使用フェイズ (試験開始前)</h2>
      <p>特性変更アイテムを使用しますか？使用する場合、アイテムと対象の試験官を選択してください。</p>
      <h4>所持アイテム</h4>
      {traitChangeItemInstances.map(itemInstance => {
        if (!itemInstance || !itemInstance.id || !allItemData[itemInstance.id]) {
            return null;
        }
        const itemBaseData = allItemData[itemInstance.id];
        const itemButtonId = `item_button_inst_${itemInstance.instanceId}`;
        const isDisabled = isTutorialMode && currentTargetElementId && currentTargetElementId !== itemButtonId;
        return (
          <button
            key={itemInstance.instanceId}
            id={itemButtonId}
            onClick={() => handleItemButtonClick(itemInstance.instanceId)}
            style={{
              margin: '5px', padding: '8px',
              border: finalSelectedItemInstanceId === itemInstance.instanceId ? '2px solid blue' : '1px solid #ccc',
              opacity: isDisabled ? 0.5 : 1,
              pointerEvents: isDisabled ? 'none' : 'auto',
            }}
            disabled={isDisabled}
          >
            {itemBaseData.name} <small>({itemBaseData.description})</small>
          </button>
        );
      })}

      {finalSelectedItemInstanceId && currentSelectedItemData && (
        <div style={{marginTop: '15px'}}>
          <h4>対象の試験官を選択</h4>
          <p>選択中アイテム: {currentSelectedItemData.name} (→ {currentSelectedItemData.targetStatus} に変更)</p>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
            {examiners.map(ex => {
              const examinerDisplayId = `examiner_display_${ex.name}`;
              const isDisabled = isTutorialMode && currentTargetElementId && currentTargetElementId !== examinerDisplayId;
              return (
                <ExaminerDisplay
                  key={ex.name}
                  examiner={ex}
                  isSelected={finalSelectedExaminerName === ex.name}
                  onSelect={() => handleExaminerDisplayClick(ex.name)}
                  showPreferredStatus={true}
                  isDisabledByTutorial={isDisabled}
                  idForTutorial={examinerDisplayId}
                />
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        {(() => {
            const confirmButtonId = "button_confirm_item_use";
            const canConfirm = finalSelectedItemInstanceId && finalSelectedExaminerName;
            const isConfirmDisabledByTutorial = isTutorialMode && currentTargetElementId && currentTargetElementId !== confirmButtonId;
            const finalConfirmDisabled = !canConfirm || isConfirmDisabledByTutorial;

            const skipButtonId = "button_skip_item_use";
            const isSkipDisabledByTutorial = isTutorialMode && currentTargetElementId && currentTargetElementId !== skipButtonId && onSkipItemUse;

            return (
                <>
                    <button
                        id={confirmButtonId}
                        onClick={handleConfirmClick}
                        disabled={finalConfirmDisabled}
                        style={{
                            padding: '10px 15px', marginRight: '10px',
                            backgroundColor: (!finalConfirmDisabled) ? 'orange' : 'grey',
                            opacity: finalConfirmDisabled ? 0.5 : 1,
                            pointerEvents: finalConfirmDisabled ? 'none' : 'auto',
                        }}
                    >
                        このアイテムを使用する
                    </button>
                    <button
                        id={skipButtonId}
                        onClick={onSkipItemUse}
                        style={{
                            padding: '10px 15px',
                            opacity: isSkipDisabledByTutorial ? 0.5 : 1,
                            pointerEvents: isSkipDisabledByTutorial ? 'none' : 'auto',
                        }}
                        disabled={isSkipDisabledByTutorial}
                    >
                        アイテムを使用せずに試験へ進む
                    </button>
                </>
            );
        })()}
      </div>
    </div>
  );
};

export default ItemUsePhaseUI;