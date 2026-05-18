import React, { useState, useEffect, useCallback } from 'react';
import Orb from './components/ui/Orb';
import Terminal from './components/ui/Terminal';
import MemoryOverlay from './components/ui/MemoryOverlay';
import WorkflowOverlay from './components/ui/WorkflowOverlay';
import Waveform from './components/ui/Waveform';
import Transcription from './components/ui/Transcription';
import './style.css'; // We'll move the CSS here or import it directly

const App = () => {
  const [isActive, setIsActive] = useState(false);
  const [voiceState, setVoiceState] = useState('idle'); // idle, waking, listening, executing
  const [logs, setLogs] = useState([]);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [showTranscription, setShowTranscription] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Initialized P.I.H.U v1.2');

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
      window.electronAPI.onVoiceEvent((event) => {
        if (event.event === 'waking') {
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
    }
  }, [isActive, voiceState, activatePIHU, handleCommand, addTerminalLine]);

  // Blur overlay dynamic class
  const blurClass = `blur-overlay ${isActive ? 'active' : ''}`;

  return (
    <>
      <div className={blurClass} id="blurOverlay"></div>

      <main className={`ui-layer ${isActive ? 'active' : ''}`}>
        
        <div className={`screen-frame ${isActive ? 'active' : ''} ${voiceState !== 'idle' ? voiceState : ''}`} id="screenFrame"></div>

        <WorkflowOverlay isVisible={voiceState === 'executing'} />
        <MemoryOverlay isVisible={voiceState === 'executing'} />
        <Terminal logs={logs} isVisible={voiceState === 'executing'} />

        <div className="transcription-container">
            <Waveform isVisible={isActive && voiceState === 'listening'} />
            <Transcription text={transcriptionText} isVisible={showTranscription} />
        </div>

        <Orb voiceState={voiceState} />
      </main>

      {!isActive && (
        <div className="hint-text">Press <strong>Option + P</strong> to activate PIHU</div>
      )}

      <div className="right-label">
        <strong>P.I.H.U</strong> - {systemStatus}
      </div>

      <div className="bottom-center-label">
        Developed by <a href="https://github.com/the-mayankjha" target="_blank" rel="noreferrer">Mayank Jha</a>
      </div>
    </>
  );
};

export default App;
