import React from 'react';

const SidebarLeft = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <aside className="sidebar-left glass-panel">
      <div className="sidebar-header">
        <div className="avatar-icon"></div>
        <div className="brand-text">PIHU OS</div>
        <div className="menu-icon">...</div>
      </div>
      
      <div className="explorer-section">
        <div className="section-title">EXPLORER</div>
        
        <div className="tree-node root-node">
          <span className="caret down"></span> PIHU OS
        </div>
        
        <div className="tree-children">
          <div className="tree-node">
            <span className="caret down"></span> 📁 src
          </div>
          <div className="tree-children nested">
            <div className="tree-node">📁 assets</div>
            <div className="tree-node"><span className="caret down"></span> 📁 components</div>
            <div className="tree-children nested">
              <div className="tree-node active">📄 Orb.jsx</div>
              <div className="tree-node">📄 Terminal.jsx</div>
              <div className="tree-node">📄 Transcription.jsx</div>
              <div className="tree-node">📄 Waveform.jsx</div>
              <div className="tree-node">📄 WorkflowOverlay.jsx</div>
            </div>
            <div className="tree-node">📁 utils</div>
            <div className="tree-node">📄 App.jsx</div>
            <div className="tree-node">📄 main.jsx</div>
            <div className="tree-node">📄 style.css</div>
          </div>
          <div className="tree-node">📁 public</div>
          <div className="tree-node">📁 node_modules</div>
          <div className="tree-node git">📄 .gitignore</div>
          <div className="tree-node npm">📄 package.json</div>
          <div className="tree-node config">📄 vite.config.js</div>
          <div className="tree-node md">📄 README.md</div>
        </div>
      </div>
      
      <div className="sidebar-footer">
        <div className="hint-pill">
          Press <span className="key-cap">esc</span> to pause
        </div>
      </div>
    </aside>
  );
};

export default SidebarLeft;
