import React from 'react';

const Waveform = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="waveform-container" id="waveform">
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
    </div>
  );
};

export default Waveform;
