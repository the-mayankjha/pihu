import React from 'react';
import WorkflowOverlay from '../WorkflowOverlay';
import MemoryOverlay from '../MemoryOverlay';
import Terminal from '../Terminal';
import Transcription from '../Transcription';
import BottomActionPanel from '../BottomActionPanel';
import SuggestedActions from '../SuggestedActions';

const CompactBarLayout = ({ voiceState, isActive, logs, transcriptionText, showTranscription, theme }) => {
  return (
    <div className={`center-workspace compact-bar-layout theme-${theme}`}>
      {/* 
        In compact mode, we don't show the Orb or TopStatusBar. 
        We just show the transcription and the BottomActionPanel 
        centered or placed appropriately.
      */}

      <WorkflowOverlay isVisible={voiceState === 'executing'} />
      <MemoryOverlay isVisible={voiceState === 'executing'} />
      <Terminal logs={logs} isVisible={voiceState === 'executing'} />

      <div className="transcription-container compact-transcription">
          <Transcription text={transcriptionText} isVisible={showTranscription} />
      </div>

      <div className="compact-action-wrapper">
         <BottomActionPanel voiceState={voiceState} isVisible={isActive} />
         <SuggestedActions isVisible={isActive && voiceState === 'idle'} />
      </div>
    </div>
  );
};

export default CompactBarLayout;
