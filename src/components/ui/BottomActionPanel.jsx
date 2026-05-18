import React from 'react';
import Waveform from './Waveform';

const BottomActionPanel = ({ voiceState, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="bottom-action-panel glass-panel">
      <div className="mic-icon-container">
        <span className="mic-icon">🎙️</span>
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
