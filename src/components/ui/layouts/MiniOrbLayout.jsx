import React from 'react';
import WorkflowOverlay from '../WorkflowOverlay';
import MemoryOverlay from '../MemoryOverlay';
import Terminal from '../Terminal';
import Transcription from '../Transcription';
import Orb from '../orb/Orb';
import BottomActionPanel from '../BottomActionPanel';
import TopStatusBar from '../TopStatusBar';

const MiniOrbLayout = ({ voiceState, isActive, logs, transcriptionText, showTranscription, theme }) => {
  return (
    <div className={`center-workspace mini-orb-layout theme-${theme}`}>
      <TopStatusBar voiceState={voiceState} isVisible={isActive} />

      <WorkflowOverlay isVisible={voiceState === 'executing'} />
      <MemoryOverlay isVisible={voiceState === 'executing'} />
      <Terminal logs={logs} isVisible={voiceState === 'executing'} />

      <div className="transcription-container">
          <Transcription text={transcriptionText} isVisible={showTranscription} />
      </div>

      <div className="mini-orb-wrapper">
        <Orb voiceState={voiceState} theme={theme} />
      </div>

      <BottomActionPanel voiceState={voiceState} isVisible={isActive} />
    </div>
  );
};

export default MiniOrbLayout;
