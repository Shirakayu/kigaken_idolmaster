// components/MentorInfoDisplay.js
import React from 'react';
// import { STATUS_TYPE } from '../data/abilityCards'; // 現在の表示では不要そうなのでコメントアウト

const MentorInfoDisplay = ({ mentors }) => (
  <div style={{ border: '1px solid #e0e0e0', padding: '10px', marginBottom: '10px' }}>
    <h4>選択中メンター</h4>
    {mentors.map(mentor => (
      <div key={mentor.id} style={{ marginLeft: '10px', fontSize: '0.9em' }}>
        <strong>{mentor.name}</strong>
        <small> ({mentor.description})</small>
      </div>
    ))}
  </div>
);

export default MentorInfoDisplay;