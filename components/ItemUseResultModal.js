// components/ItemUseResultModal.js
import React from 'react';

const ItemUseResultModal = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', minWidth: '300px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>アイテム使用結果</h3>
        <p style={{ fontSize: '1.1em', marginBottom: '25px', color: '#555' }}>{message}</p>
        <button onClick={onClose} style={{ padding: '10px 25px', fontSize: '1em', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>OK</button>
      </div>
    </div>
  );
};

export default ItemUseResultModal;