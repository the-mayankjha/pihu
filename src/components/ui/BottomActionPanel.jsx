import React from 'react';
import Waveform from './Waveform';

const BottomActionPanel = ({ voiceState, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="bottom-action-panel glass-panel">
      {/* Background lens flares */}
      <div className="panel-glow-flare flare-left"></div>
      <div className="panel-glow-flare flare-right"></div>
      
      <div className="mic-outer-container">
        {/* Two thin concentric instrumentation rings with 4 tiny beads */}
        <div className="mic-radar-rings">
          <div className="ring ring-outer">
            <span className="bead b-top"></span>
            <span className="bead b-bottom"></span>
            <span className="bead b-left"></span>
            <span className="bead b-right"></span>
          </div>
          <div className="ring ring-inner"></div>
        </div>
        
        {/* Glowing gradient-bordered microphone button */}
        <div className="mic-button-core">
          {/* Inner 3D spherical glow and glass sheen */}
          <div className="mic-glass-sphere"></div>
          <svg className="mic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="3" width="6" height="11" rx="3" ry="3" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </div>
      </div>
      
      <div className="action-status">
        <div className="primary-text">
          {voiceState === 'listening' && 'Listening...'}
          {voiceState === 'waking' && 'Waking up...'}
          {voiceState === 'thinking' && 'Thinking...'}
          {voiceState === 'executing' && 'Processing...'}
          {voiceState === 'speaking' && 'Speaking...'}
          {voiceState === 'idle' && 'Active'}
          {!['listening', 'waking', 'thinking', 'executing', 'speaking', 'idle'].includes(voiceState) && 'Connecting...'}
        </div>
        <div className="secondary-text">
          {voiceState === 'listening' ? 'Speak now' : 
           voiceState === 'waking' ? 'Get ready' : 
           voiceState === 'thinking' ? 'Analyzing...' : 
           voiceState === 'executing' ? 'Running command' : 
           voiceState === 'speaking' ? 'Assistant speaking' : 'Speak now'}
        </div>
      </div>
      
      <div className="waveform-wrapper">
        <Waveform isVisible={voiceState === 'listening' || voiceState === 'executing'} voiceState={voiceState} />
      </div>
      
      <div className="wake-word-info">
        <div className="label">Wake Word</div>
        <div className="value">"Hey Pihu"</div>
        <div className="signal-bars">
          <span className="bar b1"></span>
          <span className="bar b2"></span>
          <span className="bar b3"></span>
          <span className="bar b4"></span>
          <span className="bar b5"></span>
        </div>
      </div>
    </div>
  );
};

export default BottomActionPanel;
