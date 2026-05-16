import React from 'react';

const Orb = ({ voiceState }) => {
  // Map our high-level state to the CSS classes from the original DOM manipulations
  // Idle: no special class needed
  // Waking: 'waking'
  // Listening: 'listening'
  // Executing: 'executing'

  const containerClass = `orb-container ${voiceState !== 'idle' ? voiceState : ''}`;
  
  return (
    <div className={containerClass} id="orbContainer">
        <div className="hologram-ring extra"></div>
        <div className="hologram-ring outer"></div>
        <div className="hologram-ring middle"></div>
        <div className="hologram-ring inner"></div>
        <div className="orb-core" id="orbCore">
            <span className="orb-text">PIHU</span>
        </div>
    </div>
  );
};

export default Orb;
