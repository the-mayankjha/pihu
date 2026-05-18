import React from 'react';
import Waveform from './Waveform';

const BottomActionPanel = ({ voiceState, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="bottom-action-panel glass-panel">
      <div className="mic-ring-outer">
        <div className="mic-ring-inner">
          <svg className="mic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </div>
      </div>
      
      <div className="action-status">
        <div className="primary-text">
          {voiceState === 'listening' ? 'Listening...' : voiceState === 'executing' ? 'Processing...' : 'Connecting...'}
        </div>
        <div className="secondary-text">Speak now</div>
      </div>
      
      <div className="waveform-wrapper">
        <Waveform isVisible={true} />
      </div>
      
      <div className="wake-word-info">
        <div className="label">Wake Word</div>
        <div className="value">"Hey Pihu"</div>
        <div className="signal-bars">
          <span className="bar low"></span>
          <span className="bar medium"></span>
          <span className="bar high"></span>
          <span className="bar max"></span>
        </div>
      </div>
    </div>
  );
};

export default BottomActionPanel;
