import React, { useEffect } from 'react';

const Transcription = ({ text, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div id="transcriptionText" className="transcription-text">
      {text}
    </div>
  );
};

export default Transcription;
