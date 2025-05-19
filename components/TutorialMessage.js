// components/TutorialMessage.js
import React from 'react';

const TutorialMessage = ({ message, onNext, nextButtonText = "次へ", showNextButton = true }) => {
  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px 25px',
      borderRadius: '8px',
      zIndex: 2000,
      maxWidth: '80%',
      textAlign: 'center',
      boxShadow: '0px 0px 15px rgba(0,0,0,0.5)'
    }}>
      <p style={{ margin: 0, marginBottom: showNextButton && onNext ? '15px' : '0', whiteSpace: 'pre-wrap' }}>{message}</p>
      {showNextButton && onNext && ( // onNext が存在する場合のみボタンを表示
        <button
          onClick={onNext}
          style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          {nextButtonText}
        </button>
      )}
    </div>
  );
};

export default TutorialMessage;