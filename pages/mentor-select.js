// pages/mentor-select.js
import Head from 'next/head';
import Link from 'next/link';
import { mentors as allMentorsData } from '../data/mentors';
import styles from '../styles/Home.module.css';
import { useState, useEffect, useCallback } from 'react';

// Helper function to shuffle an array
const shuffleArray = (array) => {
  // 引数が配列でない場合は空の配列を返すようにする
  if (!Array.isArray(array)) {
    console.warn("shuffleArray received a non-array argument:", array);
    return []; 
  }
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const ConfirmMentorModal = ({ mentor, onConfirm, onCancel, step }) => {
  if (!mentor) return null;
  return (
    <div style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
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


export default function MentorSelectPage() {
  const [selectionStep, setSelectionStep] = useState(1);
  const [firstMentorOptions, setFirstMentorOptions] = useState([]);
  const [secondMentorOptions, setSecondMentorOptions] = useState([]);
  const [selectedMentor1, setSelectedMentor1] = useState(null);
  const [selectedMentor2, setSelectedMentor2] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmingMentor, setConfirmingMentor] = useState(null);
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  const generateFirstMentorOptions = useCallback(() => {
    // console.log("Generating first mentor options...");
    if (allMentorsData && Array.isArray(allMentorsData) && allMentorsData.length > 0) {
      const shuffledMentors = shuffleArray(allMentorsData);
      const options = shuffledMentors.slice(0, Math.min(3, shuffledMentors.length));
      // console.log("First options:", options);
      setFirstMentorOptions(options);
    } else {
      console.warn("allMentorsData is not available or empty, cannot generate first mentor options.");
      setFirstMentorOptions([]);
    }
  }, []); // allMentorsDataは外部定数なので依存配列は空

  const generateAndSetSecondMentorOptions = useCallback((firstSelectedMentor) => {
    // console.log("Generating and setting second mentor options, excluding:", firstSelectedMentor?.name);
    if (!firstSelectedMentor || !allMentorsData || !Array.isArray(allMentorsData) || allMentorsData.length === 0) {
        setSecondMentorOptions([]);
        return;
    }
    let poolForSecond = allMentorsData.filter(m => m.id !== firstSelectedMentor.id);
    
    if (poolForSecond.length === 0) {
        setSecondMentorOptions([]); 
        console.warn("Not enough unique mentors for second selection.");
        return;
    }
    const options = shuffleArray(poolForSecond).slice(0, Math.min(3, poolForSecond.length));
    // console.log("Second options to set:", options);
    setSecondMentorOptions(options);
  }, []); // allMentorsDataは外部定数なので依存配列は空

  useEffect(() => {
    generateFirstMentorOptions();
  }, [generateFirstMentorOptions]);


  const openConfirmationModal = (mentor, action) => {
    setConfirmingMentor(mentor);
    setOnConfirmAction(() => action); 
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (onConfirmAction) {
      onConfirmAction(); 
    }
    setShowConfirmModal(false);
    setConfirmingMentor(null);
    setOnConfirmAction(null);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmingMentor(null);
    setOnConfirmAction(null);
  };

  const handleFirstMentorSelect = (mentor) => {
    openConfirmationModal(mentor, () => {
      setSelectedMentor1(mentor);
      setSelectionStep(2);
      generateAndSetSecondMentorOptions(mentor); 
    });
  };

  const handleSecondMentorSelect = (mentor) => {
    openConfirmationModal(mentor, () => {
      setSelectedMentor2(mentor);
    });
  };
  
  const currentOptions = selectionStep === 1 ? firstMentorOptions : secondMentorOptions;

  const titleText = selectionStep === 1 
    ? "1人目のメンターを選択してください" 
    : (selectedMentor2 ? "メンター選択完了！" : "2人目のメンターを選択してください");

  const shouldShowOptions = currentOptions && currentOptions.length > 0 && !(selectedMentor1 && selectedMentor2);

  return (
    <div className={styles.container}>
      <Head>
        <title>研究者育成ゲーム - メンター選択</title>
        <meta name="description" content="あなたの研究を導くメンターを選びましょう" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          {titleText}
        </h1>

        {!(selectedMentor1 && selectedMentor2) && (
          <p className={styles.description}>
            {selectionStep === 1
              ? "提示されたメンターの中から1人目を選んでください。"
              : `1人目のメンター: ${selectedMentor1?.name || '(未選択)'}。提示されたメンターの中から2人目を選んでください。`}
          </p>
        )}

        {shouldShowOptions && (
          <div className={styles.grid}>
            {currentOptions.map((mentor) => (
              <div
                key={mentor.id}
                className={`${styles.card}`} 
                onClick={() => {
                  if (selectionStep === 1) {
                    handleFirstMentorSelect(mentor);
                  } else if (selectionStep === 2 && !selectedMentor2) {
                    handleSecondMentorSelect(mentor);
                  }
                }}
                style={{ 
                    cursor: (selectionStep === 2 && selectedMentor2) ? 'default' : 'pointer',
                }}
              >
                <h2>{mentor.name}</h2>
                <p>{mentor.description}</p>
                <p>得意ステータス補正: 
                  {mentor.statusBonus.type === 'probability' 
                    ? `${(mentor.statusBonus.probability * 100).toFixed(0)}%の確率で${mentor.statusBonus.status}成長${(mentor.statusBonus.bonus * 100).toFixed(0)}%UP`
                    : JSON.stringify(mentor.statusBonus)
                  }
                </p>
              </div>
            ))}
          </div>
        )}

        {selectedMentor1 && selectedMentor2 && (
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <h3>選択したメンター</h3>
            <p>1人目: <strong>{selectedMentor1.name}</strong></p>
            <p>2人目: <strong>{selectedMentor2.name}</strong></p>
            <Link href={{
              pathname: '/game',
              query: { mentors: [selectedMentor1.id, selectedMentor2.id].join(',') }
            }} legacyBehavior>
              <a className={styles.startButton} style={{display: 'inline-block', marginTop: '20px'}}>ゲーム開始</a>
            </Link>
          </div>
        )}
        
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <Link href="/" legacyBehavior>
                <a className={styles.backButton}>タイトルへ戻る</a>
            </Link>
        </div>
      </main>

      {showConfirmModal && confirmingMentor && (
        <ConfirmMentorModal 
          mentor={confirmingMentor}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          step={selectionStep}
        />
      )}
    </div>
  );
}