// components/DeckViewerModal.js
import React, { useState, useEffect } from 'react';
import { allAbilityCards } from '../utils/cardUtils'; // カード詳細情報を取得するために使用

const DeckViewerModal = ({ isOpen, onClose, deckCards = [], usedCards = [], initialTab = "deck" }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    // モーダルが開かれたときに初期タブを設定
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) {
    return null;
  }

  const cardsToDisplay = activeTab === "deck" ? deckCards : usedCards;

  const getCardDetails = (cardInstance) => {
    if (!cardInstance || !cardInstance.baseId) return null;
    return allAbilityCards.get(cardInstance.baseId);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 2005 // 他のモーダルより手前に
    }}>
      <div style={{
        backgroundColor: 'white', padding: '20px', borderRadius: '8px',
        width: '80%', maxWidth: '600px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>{activeTab === "deck" ? "山札確認" : "使用済みカード確認"}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '5px'
          }}>×</button>
        </div>

        <div style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <button
            onClick={() => setActiveTab("deck")}
            style={{
              padding: '8px 15px', marginRight: '10px', cursor: 'pointer',
              backgroundColor: activeTab === "deck" ? '#007bff' : '#f0f0f0',
              color: activeTab === "deck" ? 'white' : 'black',
              border: '1px solid #ccc', borderRadius: '5px'
            }}
          >
            山札 ({deckCards.length})
          </button>
          <button
            onClick={() => setActiveTab("used")}
            style={{
              padding: '8px 15px', cursor: 'pointer',
              backgroundColor: activeTab === "used" ? '#007bff' : '#f0f0f0',
              color: activeTab === "used" ? 'white' : 'black',
              border: '1px solid #ccc', borderRadius: '5px'
            }}
          >
            使用済み ({usedCards.length})
          </button>
        </div>

        <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '10px' /* スクロールバーのため */ }}>
          {cardsToDisplay.length === 0 ? (
            <p>{activeTab === "deck" ? "山札にカードがありません。" : "使用済みカードはありません。"}</p>
          ) : (
            cardsToDisplay.map((cardInstance, index) => {
              const cardData = getCardDetails(cardInstance);
              if (!cardData) {
                return <div key={cardInstance.instanceId || `unknown-${index}`}>不明なカード (ID: {cardInstance.baseId})</div>;
              }
              return (
                <div
                  key={cardInstance.instanceId || cardData.id + `-${index}`} // instanceIdがない場合(初期カードなど)も考慮
                  title={cardData.description} // ★ カーソルホバーで説明表示
                  style={{
                    border: '1px solid #ddd', padding: '10px', margin: '5px 0',
                    borderRadius: '4px', backgroundColor: cardInstance.isInitial ? '#f9f9f9' : '#fff'
                  }}
                >
                  <strong>{cardData.name}</strong> ({cardData.rarity})
                  {cardInstance.isInitial && <small style={{ color: 'gray', marginLeft: '10px' }}>(初期カード)</small>}
                  <p style={{ fontSize: '0.85em', margin: '5px 0 0 0', whiteSpace: 'pre-wrap' }}>
                    {/* ツールチップで表示するので、ここでは省略しても良い */}
                    {/* {cardData.description} */}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckViewerModal;