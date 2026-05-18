import React from 'react';
import TopStatusBar from '../TopStatusBar';
import WorkflowOverlay from '../WorkflowOverlay';
import MemoryOverlay from '../MemoryOverlay';
import Terminal from '../Terminal';
import Transcription from '../Transcription';
import Orb from '../orb/Orb';
import BottomActionPanel from '../BottomActionPanel';
import SuggestedActions from '../SuggestedActions';

const FullOrbLayout = ({ voiceState, isActive, logs, transcriptionText, showTranscription, theme }) => {
  return (
    <div className="center-workspace full-orb-layout">
      <TopStatusBar voiceState={voiceState} isVisible={isActive} />

      <WorkflowOverlay isVisible={voiceState === 'executing'} />
      <MemoryOverlay isVisible={voiceState === 'executing'} />
      <Terminal logs={logs} isVisible={voiceState === 'executing'} />

      <div className="transcription-container">
          <Transcription text={transcriptionText} isVisible={showTranscription} />
      </div>

      <Orb voiceState={voiceState} theme={theme} />

      <div className="bottom-layout-stack">
        <BottomActionPanel voiceState={voiceState} isVisible={isActive} />
        <SuggestedActions isVisible={isActive && voiceState === 'idle'} />
      </div>
    </div>
  );
};

export default FullOrbLayout;
