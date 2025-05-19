// components/ConfirmMentorModal.js
import React from 'react';

const ConfirmMentorModal = ({ mentor, onConfirm, onCancel, step }) => {
  if (!mentor) return null;
  return (
    <div style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2001 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>メンター選択確認</h3>
        <p style={{ fontSize: '1.1em', marginBottom: '25px' }}><strong>{mentor.name}</strong> を{step}人目のメンターとして選択しますか？</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <button onClick={onConfirm} style={{ padding: '10px 25px', fontSize: '1em', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>はい</button>
          <button onClick={onCancel} style={{ padding: '10px 25px', fontSize: '1em', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>いいえ</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmMentorModal;