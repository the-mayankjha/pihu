import React, { useEffect, useRef } from 'react';
import Draggable from 'react-draggable';

const Terminal = ({ logs, isVisible }) => {
  const terminalBodyRef = useRef(null);
  const nodeRef = useRef(null); // Fix for React 18 StrictMode findDOMNode error

  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isVisible) return null;

  return (
    <Draggable handle=".panel-header" nodeRef={nodeRef} defaultPosition={{ x: (window.innerWidth / 2) - 300, y: window.innerHeight - 300 }}>
      <div className="console-container" id="aiConsole" ref={nodeRef}>
        <div className="glass-panel console-panel">
          <div className="panel-header" style={{ cursor: 'move' }}>
            <span className="dot blue"></span>
            <h3>PIHU Console</h3>
            <div className="spacer"></div>
            <span className="latency">12ms</span>
          </div>
          <div className="terminal-body" id="terminalBody" ref={terminalBodyRef}>
            <div className="terminal-line"><span className="prompt">_&gt;</span> System initialized.</div>
            <div className="terminal-line"><span className="prompt cyan">*</span> Awaiting command...</div>
            
            {logs.map((log, idx) => (
              <div key={idx} className="terminal-line">
                <span className={`prompt ${log.color ? log.color : 'cyan'}`}>
                  {log.color === 'magenta' ? '!' : '*'}
                </span> {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default Terminal;
