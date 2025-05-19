// components/ExaminerDisplay.js
import React from 'react';
import { EXAM_SETTINGS } from '../data/initialGameState';

const ExaminerDisplay = ({
    examiner, isSelected, onSelect, showPreferredStatus = true,
    isDisabledByTutorial,
    idForTutorial
}) => (
    <div
        key={examiner.name}
        id={idForTutorial}
        style={{
            border: `2px solid ${isSelected ? 'blue' : '#ccc'}`,
            margin: '10px',
            padding: '10px',
            cursor: (onSelect && !isDisabledByTutorial) ? 'pointer' : 'default',
            backgroundColor: isSelected ? '#e0f7fa' : 'white',
            width: '30%',
            textAlign: 'center',
            minWidth: '150px',
            opacity: isDisabledByTutorial ? 0.5 : 1,
            pointerEvents: isDisabledByTutorial ? 'none' : 'auto',
        }}
        onClick={(onSelect && !isDisabledByTutorial) ? () => onSelect(examiner.name) : undefined}
        // className={isDisabledByTutorial ? 'tutorial-disabled' : ''} // CSSクラスで制御する場合
    >
        <h4>{examiner.name}</h4>
        <p>満足度: {examiner.satisfaction.toFixed(1)} / {examiner.maxSatisfaction?.toFixed(1) ?? (EXAM_SETTINGS[0]?.maxSatisfactionPerExaminer?.toFixed(1) || 'N/A')}</p>
        {showPreferredStatus && <p>評価されやすいステータス: {examiner.preferredStatus} (効果x{examiner.preferredStatusMultiplier})</p>}
    </div>
);

export default ExaminerDisplay;