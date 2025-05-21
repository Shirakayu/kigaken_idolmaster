// components/ExaminerDisplay.js
import React from 'react';

const ExaminerDisplay = ({
    examiner, isSelected, onSelect, showPreferredStatus = true,
    isDisabledByTutorial,
    idForTutorial
}) => {
    // 表示用の注目度を計算 (最大5から開始し、内部的なsatisfactionCountが増えるごとに減少)
    // examiner.satisfactionCount が 0 のとき注目度 5
    // examiner.satisfactionCount が 1 のとき注目度 4
    // ...
    // examiner.satisfactionCount が 4 のとき注目度 1
    // examiner.satisfactionCount が 5以上 のとき注目度 0 (または任意の最小値)
    const maxAttentionLevel = 5; // 注目度の最大値（初期値）
    // satisfactionCount が undefined の場合は 0 として扱う (初期状態など)
    const currentSatisfactionCount = examiner.satisfactionCount || 0;
    const currentAttentionLevel = Math.max(0, maxAttentionLevel - currentSatisfactionCount);

    return (
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
            <p>注目度: {currentAttentionLevel}</p>
            {showPreferredStatus && examiner.preferredStatus && (
                <p>
                    評価されやすいステータス: {examiner.preferredStatus}
                    {examiner.preferredStatusMultiplier && examiner.preferredStatusMultiplier > 0 ? ` (効果x${examiner.preferredStatusMultiplier.toFixed(1)})` : ''}
                </p>
            )}
        </div>
    );
};

export default ExaminerDisplay;