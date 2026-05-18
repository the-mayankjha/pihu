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

  const handleCommand = useCallback((command) => {
    addTerminalLine(`User: ${command}`, 'cyan');
    
    setTimeout(() => {
      if (command.includes('deactivate') || command.includes('sleep') || command.includes('goodbye')) {
        addTerminalLine('Deactivating core systems...', 'magenta');
        deactivatePIHU();
      } else if (command.includes('network')) {
        addTerminalLine('Scanning local network interfaces...', 'cyan');
        setTimeout(() => {
          setVoiceState('listening');
        }, 1500);
      } else {
        addTerminalLine(`Command unrecognized: ${command}`, 'magenta');
        setTimeout(() => {
          setVoiceState('listening');
        }, 1000);
      }
    }, 500);
  }, [addTerminalLine]);

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
            setVoiceState('executing');
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

  return (
    <>
      <div className={blurClass} id="blurOverlay"></div>

      <main className={`ui-layer dashboard-layout ${isActive ? 'active' : ''}`}>
        
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

        <SidebarRight isVisible={isActive} onOpenSettings={() => setShowSettings(true)} />
      </main>

      <SettingsPanel 
        isVisible={showSettings} 
        onClose={() => setShowSettings(false)}
        theme={theme}
        setTheme={setTheme}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
      />

      {!isActive && (
        <>
          <div className="hint-text">Press <strong>Option + P</strong> to activate PIHU</div>
          <div className="right-label">
            <strong>P.I.H.U</strong> - {systemStatus}
          </div>
          <div className="bottom-center-label">
            Developed by <a href="https://github.com/the-mayankjha" target="_blank" rel="noreferrer" style={{ color: '#ffffff', textDecoration: 'none' }}>Mayank Jha</a>
          </div>
        </>
      )}
    </>
  );
};

export default App;
