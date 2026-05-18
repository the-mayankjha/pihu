import React from 'react';

const TopStatusBar = ({ voiceState, isVisible }) => {
  if (!isVisible) return null;

  let text = 'PIHU is idle...';
  if (voiceState === 'waking') text = 'PIHU is connecting to servers...';
  if (voiceState === 'listening') text = 'PIHU is active and listening...';
  if (voiceState === 'executing') text = 'PIHU is processing request...';

  return (
    <div className="top-status-bar glass-panel">
      <div className="status-text">{text}</div>
      <div className="mini-waveform">
        <span className="wave"></span>
        <span className="wave"></span>
        <span className="wave"></span>
        <span className="wave"></span>
        <span className="wave"></span>
        <span className="wave"></span>
      </div>
    </div>
  );
};

export default TopStatusBar;
