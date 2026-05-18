import React from 'react';

const SidebarRight = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <aside className="sidebar-right">
      <div className="status-pill top-right glass-panel">
        <div className="avatar-circle">P</div>
        <div className="status-info">
          <div className="name">PIHU</div>
          <div className="state"><span className="dot active"></span> Active</div>
        </div>
        <div className="actions">
          <span className="icon">☀️</span>
          <span className="icon">⚙️</span>
        </div>
      </div>

      <div className="context-panel glass-panel">
        <h3 className="panel-title">Context Awareness</h3>
        <div className="context-item">
          <div className="icon file-icon">📄</div>
          <div className="details">
            <div className="label">Active File</div>
            <div className="value">Orb.jsx</div>
          </div>
        </div>
        <div className="context-item">
          <div className="icon folder-icon">📁</div>
          <div className="details">
            <div className="label">Workspace</div>
            <div className="value">PIHU OS</div>
          </div>
        </div>
        <div className="context-item">
          <div className="icon cursor-icon">↗</div>
          <div className="details">
            <div className="label">Cursor Position</div>
            <div className="value">Ln 23, Col 33</div>
          </div>
        </div>
        <div className="context-item">
          <div className="icon lang-icon">JS</div>
          <div className="details">
            <div className="label">Language</div>
            <div className="value">JavaScript (JSX)</div>
          </div>
        </div>
        <div className="context-item">
          <div className="icon history-icon">↺</div>
          <div className="details">
            <div className="label">Recent Command</div>
            <div className="value">Editing Orb Component</div>
          </div>
        </div>
      </div>

      <div className="system-panel glass-panel">
        <h3 className="panel-title">System Status</h3>
        <div className="system-item">
          <div className="icon cpu-icon">⚙️</div>
          <div className="details">
            <div className="label">CPU</div>
            <div className="value">23%</div>
          </div>
        </div>
        <div className="system-item">
          <div className="icon memory-icon">🖬</div>
          <div className="details">
            <div className="label">Memory</div>
            <div className="value">6.1 GB / 16 GB</div>
          </div>
        </div>
        <div className="system-item">
          <div className="icon battery-icon">🔋</div>
          <div className="details">
            <div className="label">Battery</div>
            <div className="value">87% (Charging)</div>
          </div>
        </div>
        <div className="system-item">
          <div className="icon mode-icon">⚙</div>
          <div className="details">
            <div className="label">Mode</div>
            <div className="value">Developer Mode</div>
          </div>
        </div>
      </div>
      
      <div className="hint-pill-right glass-panel">
        ✨ Try saying<br/>
        <span className="subtext">"Explain this code" or "Open terminal"</span>
      </div>
    </aside>
  );
};

export default SidebarRight;
