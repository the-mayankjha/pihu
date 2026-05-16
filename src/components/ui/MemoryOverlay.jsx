import React, { useRef } from 'react';
import Draggable from 'react-draggable';

const MemoryOverlay = ({ isVisible }) => {
  const nodeRef = useRef(null);
  
  if (!isVisible) return null;

  return (
    <Draggable handle=".panel-header" nodeRef={nodeRef} defaultPosition={{ x: window.innerWidth - 320, y: 40 }}>
      <div className="overlay-container top-right" id="memoryOverlay" ref={nodeRef}>
        <div className="glass-panel">
          <div className="panel-header" style={{ cursor: 'move' }}>
            <span className="dot cyan"></span>
            <h3>Memory Core</h3>
          </div>
          <div className="memory-stats">
            <div className="stat-row"><span>Local DB:</span> <span>Online</span></div>
            <div className="stat-row"><span>Vector Count:</span> <span>14,204</span></div>
            <div className="stat-row"><span>Last Sync:</span> <span>2m ago</span></div>
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default MemoryOverlay;
