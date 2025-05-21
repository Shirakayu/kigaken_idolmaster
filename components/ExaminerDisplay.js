// components/ExaminerDisplay.js
import React from 'react';

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
    >
        <h4>{examiner.name}</h4>
        <p>使用回数: {examiner.satisfactionCount !== undefined ? examiner.satisfactionCount : 'N/A'}</p>
        {showPreferredStatus && examiner.preferredStatus && (
            <p>
                評価されやすいステータス: {examiner.preferredStatus}
                {/* ★ preferredStatusMultiplier が存在し、かつ0より大きい場合のみ表示 */}
                {examiner.preferredStatusMultiplier && examiner.preferredStatusMultiplier > 0 ? ` (効果x${examiner.preferredStatusMultiplier.toFixed(1)})` : ''}
            </p>
        )}
    </div>
);

export default ExaminerDisplay;