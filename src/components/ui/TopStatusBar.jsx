import React from 'react';

const TopStatusBar = ({ voiceState, isVisible }) => {
  if (!isVisible || voiceState === 'idle') return null;

  let text = "PIHU is active and listening...";
  if (voiceState === 'waking') text = "Connecting to PIHU...";
  if (voiceState === 'executing') text = "Processing command...";

  return (
    <div className="top-status-pill glass-panel">
      <div className="status-dots left">
        <span className="dot d1"></span><span className="dot d2"></span><span className="dot d3"></span><span className="dot d4"></span>
      </div>
      
      <div className="status-center">
        <div className="status-text">{text}</div>
        <div className="pill-waveform">
          <div className="wave"></div><div className="wave"></div><div className="wave"></div>
          <div className="wave"></div><div className="wave"></div><div className="wave"></div>
          <div className="wave"></div><div className="wave"></div><div className="wave"></div>
        </div>
      </div>
      
      <div className="status-dots right">
        <span className="dot d4"></span><span className="dot d3"></span><span className="dot d2"></span><span className="dot d1"></span>
      </div>
    </div>
  );
};

export default TopStatusBar;
