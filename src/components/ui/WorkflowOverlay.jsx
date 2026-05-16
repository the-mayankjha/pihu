import React, { useRef } from 'react';
import Draggable from 'react-draggable';

const WorkflowOverlay = ({ isVisible }) => {
  const nodeRef = useRef(null);

  if (!isVisible) return null;

  return (
    <Draggable handle=".panel-header" nodeRef={nodeRef} defaultPosition={{ x: 40, y: 40 }}>
      <div className="overlay-container top-left" id="automationOverlay" ref={nodeRef}>
        <div className="glass-panel">
          <div className="panel-header" style={{ cursor: 'move' }}>
            <span className="dot purple"></span>
            <h3>Workflows</h3>
          </div>
          <ul className="workflow-list">
            <li><span className="status-icon active"></span> Compiling Codebase</li>
            <li><span className="status-icon pending"></span> Syncing Memory</li>
            <li><span className="status-icon inactive"></span> Network Scan</li>
          </ul>
        </div>
      </div>
    </Draggable>
  );
};

export default WorkflowOverlay;
