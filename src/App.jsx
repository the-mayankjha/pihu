import React, { useState, useEffect, useCallback } from 'react';
import Orb from './components/ui/orb/Orb';
import Terminal from './components/ui/Terminal';
import MemoryOverlay from './components/ui/MemoryOverlay';
import WorkflowOverlay from './components/ui/WorkflowOverlay';
import Waveform from './components/ui/Waveform';
import SidebarLeft from './components/ui/SidebarLeft';
import SidebarRight from './components/ui/SidebarRight';
import SettingsPanel from './components/ui/SettingsPanel';
import FullOrbLayout from './components/ui/layouts/FullOrbLayout';
import CompactBarLayout from './components/ui/layouts/CompactBarLayout';
import MiniOrbLayout from './components/ui/layouts/MiniOrbLayout';
import './style.css';
import './dashboard.css';

const App = () => {
  const [isActive, setIsActive] = useState(false);
  const [voiceState, setVoiceState] = useState('idle'); // idle, waking, listening, executing
  const [logs, setLogs] = useState([]);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [showTranscription, setShowTranscription] = useState(false);
  const [systemStatus, setSystemStatus] = useState('System Calibrating...');
  const [showExplorer, setShowExplorer] = useState(false);
  
  // Customization States
  const [theme, setTheme] = useState('nebula');
  const [displayMode, setDisplayMode] = useState('full-orb');
  const [showSettings, setShowSettings] = useState(false);

  const addTerminalLine = useCallback((text, color = 'cyan') => {
    setLogs(prev => [...prev, { text, color }]);
  }, []);

  const activatePIHU = useCallback(() => {
    if (isActive) return;
    setIsActive(true);
    setVoiceState('waking');
    setSystemStatus('Connecting to servers...');
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(false);
    }
    
    // Auto transition to listening after waking
    setTimeout(() => {
      setVoiceState(prev => prev === 'waking' ? 'listening' : prev);
      setSystemStatus('Initialized P.I.H.U v1.2');
    }, 1500);
  }, [isActive]);

  const deactivatePIHU = useCallback(() => {
    if (!isActive) return;
    setIsActive(false);
    setVoiceState('idle');
    setSystemStatus('Initialized P.I.H.U v1.2');
    setLogs([]); // Clear logs on sleep
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  }, [isActive]);

  const handleCommand = useCallback((command) => {
    addTerminalLine(`User: ${command}`, 'cyan');
    setVoiceState('executing');
    
    setTimeout(() => {
      if (command.includes('deactivate') || command.includes('sleep') || command.includes('goodbye')) {
        addTerminalLine('Deactivating core systems...', 'magenta');
        deactivatePIHU();
      } else if (command.includes('network')) {
        addTerminalLine('Scanning local network interfaces...', 'cyan');
        setVoiceState('speaking');
        setTimeout(() => {
          setVoiceState('listening');
        }, 2000);
      } else {
        addTerminalLine(`Command unrecognized: ${command}`, 'magenta');
        setVoiceState('speaking');
        setTimeout(() => {
          setVoiceState('listening');
        }, 2000);
      }
    }, 1200);
  }, [addTerminalLine, deactivatePIHU]);

  // Handle global hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'p') {
        if (!isActive) {
          activatePIHU();
        } else {
          deactivatePIHU();
        }
      }
      if (e.altKey && e.key.toLowerCase() === 'e') {
        setShowExplorer(prev => !prev);
      }
      if (e.key === 'Escape' && isActive) {
        deactivatePIHU();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, activatePIHU, deactivatePIHU]);

  // Handle Voice IPC Events
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onVoiceEvent) {
      const unsubscribe = window.electronAPI.onVoiceEvent((event) => {
        if (event.event === 'calibration_complete') {
          setSystemStatus('Initialized P.I.H.U v1.2');
        } else if (event.event === 'waking') {
          console.log("🔊 Wake word detected:", event.text);
          activatePIHU();
          
          setTranscriptionText(event.text);
          setShowTranscription(true);
          setTimeout(() => setShowTranscription(false), 3000);
          
        } else if (event.event === 'speech_start') {
          if (isActive && voiceState !== 'executing') {
            setVoiceState('listening');
          }
        } else if (event.event === 'speech_end') {
          if (isActive && voiceState !== 'executing') {
            setVoiceState('thinking');
            addTerminalLine('Audio captured. Processing via Python Engine...', 'cyan');
          }
        } else if (event.event === 'command') {
          const command = event.text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim().toLowerCase();
          console.log('Whisper Heard (Command):', command);
          
          if (command) {
            setTranscriptionText(command);
            setShowTranscription(true);
            setTimeout(() => setShowTranscription(false), 3000);
            handleCommand(command);
          } else {
            setVoiceState('listening');
          }
        } else if (event.event === 'background') {
          console.log("Background Whisper heard:", event.text);
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isActive, voiceState, activatePIHU, handleCommand, addTerminalLine]);

  // Blur overlay dynamic class
  const blurClass = `blur-overlay ${isActive ? 'active' : ''}`;

  // Helper for dynamic status badges matching Image 2 states
  const getStatusBadge = () => {
    if (!isActive) {
      return {
        label: 'Idle',
        colorClass: 'idle',
        icon: (
          <svg className="badge-icon icon-idle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="6" stroke="rgba(255,255,255,0.2)" fill="rgba(255,255,255,0.1)" />
            <circle cx="12" cy="12" r="2" fill="rgba(255,255,255,0.4)" />
          </svg>
        )
      };
    }

    switch (voiceState) {
      case 'waking':
      case 'listening':
        return {
          label: 'Listening',
          colorClass: 'listening',
          icon: (
            <div className="badge-pulsing-wrapper">
              <span className="badge-glow-ring listening"></span>
              <svg className="badge-icon icon-listening" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="6" stroke="rgba(59, 130, 246, 0.4)" fill="rgba(59, 130, 246, 0.1)" />
                <circle cx="12" cy="12" r="2.5" fill="#3b82f6" />
              </svg>
            </div>
          )
        };
      case 'thinking':
        return {
          label: 'Thinking',
          colorClass: 'thinking',
          icon: (
            <div className="badge-pulsing-wrapper">
              <span className="badge-glow-ring thinking"></span>
              <svg className="badge-icon icon-thinking" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="6" stroke="rgba(168, 85, 247, 0.4)" fill="rgba(168, 85, 247, 0.1)" />
                <circle cx="12" cy="12" r="2.5" fill="#a855f7" />
              </svg>
            </div>
          )
        };
      case 'executing':
        return {
          label: 'Processing',
          colorClass: 'processing',
          icon: (
            <div className="badge-pulsing-wrapper">
              <span className="badge-glow-ring processing"></span>
              <svg className="badge-icon icon-processing" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="6" stroke="rgba(245, 158, 11, 0.4)" fill="rgba(245, 158, 11, 0.1)" />
                <circle cx="12" cy="12" r="2.5" fill="#f59e0b" />
              </svg>
            </div>
          )
        };
      case 'speaking':
        return {
          label: 'Speaking',
          colorClass: 'speaking',
          icon: (
            <div className="badge-pulsing-wrapper speaking-box">
              <span className="badge-glow-ring speaking"></span>
              <svg className="badge-icon icon-speaking" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 10v4M8 6v12M12 3v18M16 6v12M20 10v4" />
              </svg>
            </div>
          )
        };
      case 'idle':
      default:
        return {
          label: 'Active',
          colorClass: 'active',
          icon: (
            <div className="badge-pulsing-wrapper">
              <span className="badge-glow-ring active"></span>
              <svg className="badge-icon icon-active" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="6" stroke="rgba(16, 185, 129, 0.4)" fill="rgba(16, 185, 129, 0.1)" />
                <circle cx="12" cy="12" r="2.5" fill="#10b981" />
              </svg>
            </div>
          )
        };
    }
  };

  const currentBadge = getStatusBadge();

  return (
    <>
      <div className={blurClass} id="blurOverlay"></div>

      <main className={`ui-layer dashboard-layout ${isActive ? 'active' : ''}`}>
        
        {/* Top Header Bar containing Left Pill (Image 3) and Right Controller + Status Pill (Image 4) */}
        <header className="pihu-top-header">
          {/* Image 3: Left Hand Top Logo Pill */}
          <div className="header-left-pill glass-panel">
            <div className="header-orb-wrapper">
              <div className="header-orb-dot"></div>
              <div className="header-orb-rings"></div>
            </div>
            <span className="header-title">PIHU OS</span>
          </div>

          {/* Image 4: Right Hand Top Control Group */}
          <div className="header-right-group">
            {/* Round glassy button triplet shell */}
            <div className="control-btn-shell glass-panel">
              <button className="control-round-btn" title="AI Sparks">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707" />
                </svg>
              </button>
              <button className={`control-round-btn ${voiceState === 'listening' ? 'active' : ''}`} title="Audio Wave">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10v4M6 6v12M9 10v4M12 4v16M15 8v8M18 11v2M21 9v6" />
                </svg>
              </button>
              <button className="control-round-btn" onClick={() => setShowSettings(true)} title="Settings">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            </div>

            {/* Glass status pill */}
            <div className={`header-status-pill glass-panel state-${currentBadge.colorClass}`}>
              <div className="header-avatar">P</div>
              <div className="header-meta">
                <span className="header-name">PIHU</span>
                <span className="header-state">
                  {currentBadge.icon}
                  <span className="state-label">{currentBadge.label}</span>
                </span>
              </div>
              <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </header>
        
        <div className={`screen-frame ${isActive ? 'active' : ''} ${voiceState !== 'idle' ? voiceState : ''}`} id="screenFrame"></div>
        
        {showExplorer && <SidebarLeft isVisible={isActive} />}
        
        {displayMode === 'full-orb' && (
          <FullOrbLayout 
            voiceState={voiceState} isActive={isActive} logs={logs} 
            transcriptionText={transcriptionText} showTranscription={showTranscription} 
            theme={theme} 
          />
        )}
        
        {displayMode === 'compact-bar' && (
          <CompactBarLayout 
            voiceState={voiceState} isActive={isActive} logs={logs} 
            transcriptionText={transcriptionText} showTranscription={showTranscription} 
            theme={theme} 
          />
        )}

        {displayMode === 'mini-orb' && (
          <MiniOrbLayout 
            voiceState={voiceState} isActive={isActive} logs={logs} 
            transcriptionText={transcriptionText} showTranscription={showTranscription} 
            theme={theme} 
          />
        )}

        <SidebarRight isVisible={isActive} />
      </main>

      <SettingsPanel 
        isVisible={showSettings} 
        onClose={() => setShowSettings(false)}
        theme={theme}
        setTheme={setTheme}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
      />

      <footer className="pihu-unified-footer">
        <div className="footer-left">
          {/* Miniature holographic logo orb */}
          <div className="footer-logo-container">
            <div className="footer-logo-dot"></div>
            <div className="footer-logo-pulse"></div>
          </div>
          <span className="footer-title">PIHU OS</span>
          <span className="footer-version">v1.2.0</span>
          <span className="footer-divider">|</span>
          <div className="footer-status">
            <span className={`status-dot ${systemStatus.includes('Calibrating') ? 'calibrating' : 'operational'}`}></span>
            <span className="status-text">{systemStatus}</span>
          </div>
        </div>
        
        <div className="footer-center">
          Developed by <a href="https://github.com/the-mayankjha" target="_blank" rel="noreferrer" className="footer-dev-link">Mayank Jha</a>
        </div>

        <div className="footer-right">
          <div className="footer-shortcut-pill">
            <svg className="kbd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <line x1="6" y1="8" x2="6" y2="8" /><line x1="10" y1="8" x2="10" y2="8" />
              <line x1="14" y1="8" x2="14" y2="8" /><line x1="18" y1="8" x2="18" y2="8" />
              <line x1="6" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="18" y2="12" />
              <line x1="7" y1="16" x2="17" y2="16" />
            </svg>
            <span className="shortcut-text">Press ⌥ + P to {isActive ? 'sleep' : 'talk'}</span>
          </div>
          <svg className="sparkle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707" />
          </svg>
        </div>
      </footer>
    </>
  );
};

export default App;
