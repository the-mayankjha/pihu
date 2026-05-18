import React, { useState, useEffect } from 'react';

const SidebarRight = ({ isVisible }) => {
  // State to hold live Apple IO telemetry
  const [stats, setStats] = useState({
    cpu: 23,
    memory: { percent: 38, usedGB: '6.1', totalGB: '16.0' },
    battery: { percent: 87, isCharging: true }
  });

  // History state for real-time oscilloscope graphs
  const [cpuHistory, setCpuHistory] = useState([20, 22, 25, 23, 24, 21, 26, 25, 23, 22, 24, 23, 25, 22, 23]);
  const [memHistory, setMemHistory] = useState([35, 36, 38, 38, 37, 38, 38, 38, 37, 38, 38, 38, 38, 38, 38]);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onSystemStats) {
      const unsubscribe = window.electronAPI.onSystemStats((data) => {
        setStats(data);
        setCpuHistory(prev => {
          const next = [...prev.slice(1), data.cpu];
          return next;
        });
        setMemHistory(prev => {
          const next = [...prev.slice(1), data.memory.percent];
          return next;
        });
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  // Helpers to draw smooth live oscilloscope paths
  const generatePath = (history, width = 230, height = 45) => {
    if (history.length === 0) return '';
    const points = history.map((val, index) => {
      const x = (index / (history.length - 1)) * width;
      const y = height - (val / 100) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const generateAreaPath = (history, width = 230, height = 45) => {
    const linePath = generatePath(history, width, height);
    if (!linePath) return '';
    return `${linePath} L ${width},${height} L 0,${height} Z`;
  };

  if (!isVisible) return null;

  return (
    <aside className="sidebar-right glass-panel">
      {/* CONTEXT AWARENESS BLOCK */}
      <div className="sidebar-section context-section">
        <div className="section-header">
          <span className="section-title">CONTEXT AWARENESS</span>
          <svg className="scan-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2m-10 0H5a2 2 0 0 1-2-2v-2" />
          </svg>
        </div>

        <div className="glass-rows-container">
          <div className="glass-row">
            <div className="row-icon file-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="row-info">
              <span className="row-label">Active File</span>
              <span className="row-value">SidebarRight.jsx</span>
            </div>
          </div>

          <div className="glass-row">
            <div className="row-icon folder-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="row-info">
              <span className="row-label">Workspace</span>
              <span className="row-value">PIHU OS</span>
            </div>
          </div>

          <div className="glass-row">
            <div className="row-icon cursor-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 4 13 11" />
                <line x1="13" y1="11" x2="10" y2="14" />
              </svg>
            </div>
            <div className="row-info">
              <span className="row-label">Cursor Position</span>
              <span className="row-value">Ln 14, Col 25</span>
            </div>
          </div>

          <div className="glass-row">
            <div className="row-icon recent-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="3" />
                <circle cx="12" cy="19" r="3" />
                <path d="M12 8v8" />
              </svg>
            </div>
            <div className="row-info">
              <span className="row-label">Recent Change</span>
              <span className="row-value">Hardware telemetry active</span>
            </div>
          </div>

          <div className="glass-row">
            <div className="row-icon git-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="18" r="3" />
                <circle cx="6" cy="6" r="3" />
                <path d="M13 6h3a2 2 0 0 1 2 2v7" />
                <line x1="6" y1="9" x2="6" y2="21" />
              </svg>
            </div>
            <div className="row-info">
              <span className="row-label">Git Status</span>
              <span className="row-value">3 files modified</span>
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM STATUS BLOCK */}
      <div className="sidebar-section system-section">
        <div className="section-header">
          <span className="section-title">SYSTEM STATUS</span>
        </div>

        <div className="radial-metrics-container">
          <div className="radial-row">
            <div className="radial-progress-wrapper">
              <svg className="radial-svg" viewBox="0 0 36 36">
                <circle className="radial-bg" cx="18" cy="18" r="15.915" />
                <circle className="radial-fill cpu-fill" cx="18" cy="18" r="15.915" strokeDasharray={`${stats.cpu} 100`} />
              </svg>
              <div className="radial-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
                </svg>
              </div>
            </div>
            <div className="radial-info">
              <span className="radial-label">CPU</span>
              <span className="radial-value">{stats.cpu}%</span>
            </div>
          </div>

          <div className="radial-row">
            <div className="radial-progress-wrapper">
              <svg className="radial-svg" viewBox="0 0 36 36">
                <circle className="radial-bg" cx="18" cy="18" r="15.915" />
                <circle className="radial-fill mem-fill" cx="18" cy="18" r="15.915" strokeDasharray={`${stats.memory.percent} 100`} />
              </svg>
              <div className="radial-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                  <line x1="7" y1="15" x2="7" y2="15" />
                  <line x1="12" y1="15" x2="12" y2="15" />
                </svg>
              </div>
            </div>
            <div className="radial-info">
              <span className="radial-label">Memory</span>
              <span className="radial-value">{stats.memory.usedGB} GB / {stats.memory.totalGB} GB</span>
            </div>
          </div>

          <div className="radial-row">
            <div className="radial-progress-wrapper">
              <svg className="radial-svg" viewBox="0 0 36 36">
                <circle className="radial-bg" cx="18" cy="18" r="15.915" />
                <circle className="radial-fill bat-fill" cx="18" cy="18" r="15.915" strokeDasharray={`${stats.battery.percent} 100`} />
              </svg>
              <div className="radial-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
                  <line x1="22" y1="11" x2="22" y2="13" />
                </svg>
              </div>
            </div>
            <div className="radial-info">
              <span className="radial-label">Battery</span>
              <span className="radial-value">{stats.battery.percent}% {stats.battery.isCharging ? '(Charging)' : ''}</span>
            </div>
          </div>

          <div className="radial-row">
            <div className="radial-progress-wrapper">
              <svg className="radial-svg" viewBox="0 0 36 36">
                <circle className="radial-bg" cx="18" cy="18" r="15.915" />
                <circle className="radial-fill mode-fill" cx="18" cy="18" r="15.915" strokeDasharray="100 100" />
              </svg>
              <div className="radial-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
            </div>
            <div className="radial-info">
              <span className="radial-label">Mode</span>
              <span className="radial-value">Developer Mode</span>
            </div>
          </div>
        </div>

        {/* Real-time Oscilloscope Sparkline Graph */}
        <div className="system-graph-container">
          <div className="graph-header">
            <span className="graph-label">REALTIME METRICS FLOW</span>
            <div className="graph-legend">
              <span className="legend-item cpu"><span className="legend-dot"></span>CPU</span>
              <span className="legend-item mem"><span className="legend-dot"></span>MEM</span>
            </div>
          </div>
          <div className="sparkline-wrapper">
            <svg className="sparkline-svg" viewBox="0 0 230 45">
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Memory Area and Path */}
              <path d={generateAreaPath(memHistory)} fill="url(#memGrad)" />
              <path d={generatePath(memHistory)} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />

              {/* CPU Area and Path */}
              <path d={generateAreaPath(cpuHistory)} fill="url(#cpuGrad)" />
              <path d={generatePath(cpuHistory)} fill="none" stroke="#00f2fe" strokeWidth="2.0" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* LIVE ACTIVITY BLOCK */}
      <div className="sidebar-section activity-section">
        <div className="section-header">
          <span className="section-title">LIVE ACTIVITY</span>
        </div>

        <div className="activity-rows-container">
          <div className="activity-row">
            <div className="activity-left">
              <svg className="activity-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span className="activity-text">Indexing project files</span>
            </div>
            <span className="activity-time">2s ago</span>
          </div>

          <div className="activity-row">
            <div className="activity-left">
              <svg className="activity-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <span className="activity-text">Synced with memory</span>
            </div>
            <span className="activity-time">4s ago</span>
          </div>

          <div className="activity-row">
            <div className="activity-left">
              <svg className="activity-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M21 16H3M21 12H3M21 8H3" />
              </svg>
              <span className="activity-text">Background agent active</span>
            </div>
            <span className="activity-time">10s ago</span>
          </div>

          <div className="activity-row active">
            <div className="activity-left">
              <svg className="activity-icon neon-mic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="3" width="6" height="11" rx="3" ry="3" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
              <span className="activity-text">Listening for commands</span>
            </div>
            <span className="activity-time green-glow">
              <span className="live-dot"></span>
              now
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarRight;
