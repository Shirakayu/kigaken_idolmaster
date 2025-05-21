// components/DeckViewerModal.js
import React, { useState, useEffect } from 'react';
import { allAbilityCards } from '../utils/cardUtils'; // カード詳細情報を取得するために使用

const DeckViewerModal = ({ isOpen, onClose, deckCards = [], usedCards = [], initialTab = "deck" }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [hoveredCard, setHoveredCard] = useState(null); // ホバー中のカードデータ
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, visible: false }); // ツールチップの位置と表示状態

  useEffect(() => {
    // モーダルが開かれたときに初期タブを設定し、ホバー情報をリセット
    if (isOpen) {
      setActiveTab(initialTab);
      setHoveredCard(null);
      setTooltipPosition({ top: 0, left: 0, visible: false });
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

  const handleMouseEnterCard = (cardData, event) => {
    setHoveredCard(cardData);
    // マウスカーソル位置を基準にツールチップ位置を調整
    const tooltipOffsetX = 15;
    const tooltipOffsetY = 10;
    let left = event.clientX + tooltipOffsetX;
    let top = event.clientY + tooltipOffsetY;

    // ツールチップが画面外に出ないように簡易的な調整
    // (より洗練されたライブラリなどでは自動的に行われる)
    const tooltipMockWidth = 300; // ツールチップの想定されるおおよその幅
    const tooltipMockHeight = 150; // ツールチップの想定されるおおよその高さ

    if (left + tooltipMockWidth > window.innerWidth) {
      left = event.clientX - tooltipMockWidth - tooltipOffsetX; // 右側にはみ出るなら左側に表示
    }
    if (top + tooltipMockHeight > window.innerHeight) {
      top = event.clientY - tooltipMockHeight - tooltipOffsetY; // 下側にはみ出るなら上側に表示
    }
    // 念のため画面左端、上端もチェック
    if (left < 0) left = tooltipOffsetX;
    if (top < 0) top = tooltipOffsetY;


    setTooltipPosition({ top, left, visible: true });
  };

  const handleMouseLeaveCard = () => {
    setHoveredCard(null);
    setTooltipPosition({ top: 0, left: 0, visible: false });
  };

  return (
    <div style={{ // オーバーレイ
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 2005
    }}>
      <div style={{ // モーダル本体
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

        <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '10px' }}>
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
                  key={cardInstance.instanceId || cardData.id + `-${index}`}
                  style={{
                    border: '1px solid #ddd', padding: '10px', margin: '5px 0',
                    borderRadius: '4px', backgroundColor: cardInstance.isInitial ? '#f9f9f9' : '#fff',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => handleMouseEnterCard(cardData, e)}
                  onMouseLeave={handleMouseLeaveCard}
                >
                  <strong>{cardData.name}</strong> ({cardData.rarity})
                  {cardInstance.isInitial && <small style={{ color: 'gray', marginLeft: '10px' }}>(初期カード)</small>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ツールチップ表示部分 */}
      {tooltipPosition.visible && hoveredCard && (
        <div style={{
          position: 'fixed',
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '6px',
          zIndex: 2010,
          maxWidth: '300px',
          pointerEvents: 'none',
          fontSize: '1.1em',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          whiteSpace: 'pre-wrap'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2em', borderBottom: '1px solid #555', paddingBottom: '5px' }}>{hoveredCard.name}</h4>
          <p style={{ margin: 0, fontSize: '1em' }}>{hoveredCard.description}</p>
        </div>
      )}
    </div>
  );
};

export default DeckViewerModal;