import React, { useState, useEffect } from 'react';

const SettingsPanel = ({ isVisible, onClose, theme, setTheme, displayMode, setDisplayMode, userName, setUserName }) => {
  const [activeTab, setActiveTab] = useState('appearance');

  // Load state from localStorage or default
  const [blurStrength, setBlurStrength] = useState(() => localStorage.getItem('pihu_blur') || '24');
  const [micDevice, setMicDevice] = useState(() => localStorage.getItem('pihu_mic') || 'MacBook Air Microphone');
  const [modelType, setModelType] = useState(() => localStorage.getItem('pihu_model') || 'base');
  const [wakeWord, setWakeWord] = useState(() => localStorage.getItem('pihu_wakeword') || 'clap');
  const [silenceCounter, setSilenceCounter] = useState(() => localStorage.getItem('pihu_silence') || '1.5');
  const [startOnBoot, setStartOnBoot] = useState(() => localStorage.getItem('pihu_boot') === 'true');
  const [hideDockIcon, setHideDockIcon] = useState(() => localStorage.getItem('pihu_dock') === 'true');
  const [shortcutKey, setShortcutKey] = useState(() => localStorage.getItem('pihu_shortcut') || 'Alt + P');

  const [wakeEngine, setWakeEngine] = useState(() => localStorage.getItem('pihu_wake_engine') || 'whisper');
  const [accessKey, setAccessKey] = useState(() => localStorage.getItem('pihu_access_key') || '');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('pihu_blur', blurStrength);
    // Apply blur strength dynamically to the overlay background!
    const overlay = document.getElementById('blurOverlay');
    if (overlay) {
      overlay.style.backdropFilter = `blur(${blurStrength}px)`;
      overlay.style.webkitBackdropFilter = `blur(${blurStrength}px)`;
    }
  }, [blurStrength]);

  useEffect(() => { localStorage.setItem('pihu_mic', micDevice); }, [micDevice]);
  useEffect(() => { localStorage.setItem('pihu_model', modelType); }, [modelType]);
  useEffect(() => { localStorage.setItem('pihu_wakeword', wakeWord); }, [wakeWord]);
  useEffect(() => { localStorage.setItem('pihu_silence', silenceCounter); }, [silenceCounter]);
  useEffect(() => { localStorage.setItem('pihu_boot', startOnBoot); }, [startOnBoot]);
  useEffect(() => { localStorage.setItem('pihu_dock', hideDockIcon); }, [hideDockIcon]);
  useEffect(() => { localStorage.setItem('pihu_shortcut', shortcutKey); }, [shortcutKey]);
  useEffect(() => { localStorage.setItem('pihu_wake_engine', wakeEngine); }, [wakeEngine]);
  useEffect(() => { localStorage.setItem('pihu_access_key', accessKey); }, [accessKey]);

  // Debounced sync to config.json on disk
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.electronAPI && window.electronAPI.saveConfig) {
        window.electronAPI.saveConfig({
          access_key: accessKey,
          engine: wakeEngine
        });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [wakeEngine, accessKey]);

  const handleQuitApp = () => {
    if (window.electronAPI && window.electronAPI.quitApp) {
      window.electronAPI.quitApp();
    } else {
      alert("Quit requested. (Electron process bridge not active)");
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      id="blurOverlay"
      className="settings-overlay" 
      style={{ backdropFilter: `blur(${blurStrength}px)`, WebkitBackdropFilter: `blur(${blurStrength}px)` }}
      onClick={(e) => e.target.className === 'settings-overlay' && onClose()}
    >
      <div className="settings-panel glass-panel two-pane-layout">
        
        {/* Left-hand Navigation Sidebar */}
        <aside className="settings-sidebar">
          <div className="sidebar-brand">
            <span className="brand-dot"></span>
            <h3>PIHU OS CORE</h3>
          </div>
          
          <nav className="settings-nav">
            <button 
              className={`nav-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 2 12 22Z" />
                <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" />
              </svg>
              Appearance
            </button>

            <button 
              className={`nav-tab-btn ${activeTab === 'voice' ? 'active' : ''}`}
              onClick={() => setActiveTab('voice')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="3" width="6" height="11" rx="3" ry="3" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
              Voice & Audio
            </button>

            <button 
              className={`nav-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
              onClick={() => setActiveTab('system')}
            >
              <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Core System
            </button>
          </nav>

          <button className="quit-app-btn" onClick={handleQuitApp}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="tab-icon">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
            </svg>
            Shutdown OS
          </button>
        </aside>

        {/* Right-hand Configuration pane */}
        <section className="settings-body">
          <div className="body-header">
            <h2>SYSTEM SETTINGS</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="scrollable-config-area">
            
            {/* TAB 1: APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="tab-view fade-in">
                <div className="settings-section">
                  <h3>DISPLAY MODES</h3>
                  <div className="mode-options">
                    <div 
                      className={`mode-card ${displayMode === 'full-orb' ? 'active' : ''}`}
                      onClick={() => setDisplayMode('full-orb')}
                    >
                      <div className="mode-preview full-orb-preview"></div>
                      <span>FULL ORB</span>
                    </div>
                    
                    <div 
                      className={`mode-card ${displayMode === 'compact-bar' ? 'active' : ''}`}
                      onClick={() => setDisplayMode('compact-bar')}
                    >
                      <div className="mode-preview compact-bar-preview"></div>
                      <span>COMPACT BAR</span>
                    </div>
                    
                    <div 
                      className={`mode-card ${displayMode === 'mini-orb' ? 'active' : ''}`}
                      onClick={() => setDisplayMode('mini-orb')}
                    >
                      <div className="mode-preview mini-orb-preview"></div>
                      <span>MINI ORB</span>
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>USER PROFILE & GREETING</h3>
                  <div className="shortcut-input-wrapper" style={{ marginTop: '8px' }}>
                    <input 
                      type="text" 
                      className="glass-shortcut-input"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name..."
                      style={{ width: '100%', outline: 'none' }}
                    />
                  </div>
                  <p className="slider-hint">Your assistant will greet you by this name when waking up.</p>
                </div>

                <div className="settings-section">
                  <h3>THEME VARIANTS</h3>
                  <div className="theme-options">
                    <div 
                      className={`theme-swatch nebula ${theme === 'nebula' ? 'active' : ''}`}
                      onClick={() => setTheme('nebula')}
                      title="Nebula (Deep Blue/Purple)"
                    ></div>
                    <div 
                      className={`theme-swatch ocean ${theme === 'ocean' ? 'active' : ''}`}
                      onClick={() => setTheme('ocean')}
                      title="Ocean (Teal/Mint)"
                    ></div>
                    <div 
                      className={`theme-swatch sunset ${theme === 'sunset' ? 'active' : ''}`}
                      onClick={() => setTheme('sunset')}
                      title="Sunset (Orange/Red)"
                    ></div>
                    <div 
                      className={`theme-swatch matrix ${theme === 'matrix' ? 'active' : ''}`}
                      onClick={() => setTheme('matrix')}
                      title="Matrix (Green)"
                    ></div>
                  </div>
                </div>

                <div className="settings-section">
                  <div className="slider-row">
                    <h3>BACKDROP BLUR STRENGTH</h3>
                    <span className="slider-value">{blurStrength}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="60" 
                    value={blurStrength} 
                    onChange={(e) => setBlurStrength(e.target.value)}
                    className="glass-slider"
                  />
                  <p className="slider-hint">Controls the background overlay blur intensity behind the translucent desktop frame.</p>
                </div>
              </div>
            )}

            {/* TAB 2: VOICE & AUDIO */}
            {activeTab === 'voice' && (
              <div className="tab-view fade-in">
                <div className="settings-section">
                  <h3>AUDIO INPUT DEVICE</h3>
                  <div className="glass-select-wrapper">
                    <select 
                      className="glass-select"
                      value={micDevice} 
                      onChange={(e) => setMicDevice(e.target.value)}
                    >
                      <option value="MacBook Air Microphone">MacBook Air Microphone (Built-in)</option>
                      <option value="Studio USB Mic">Studio USB Mic (External CoreAudio)</option>
                      <option value="System Soundflower">Soundflower (Virtual Loopback)</option>
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>WHISPER MODEL ENGINE</h3>
                  <div className="glass-select-wrapper">
                    <select 
                      className="glass-select"
                      value={modelType} 
                      onChange={(e) => setModelType(e.target.value)}
                    >
                      <option value="tiny">Faster-Whisper Tiny (Ultra Fast, 39MB)</option>
                      <option value="base">Faster-Whisper Base (Recommended, 74MB)</option>
                      <option value="small">Faster-Whisper Small (High Precision, 244MB)</option>
                    </select>
                  </div>
                  <p className="slider-hint">Higher-sized engines provide superior accuracy but increase GPU/CPU compilation overhead.</p>
                </div>

                <div className="settings-section">
                  <div className="slider-row">
                    <h3>WAKE DETECTION MODE</h3>
                  </div>
                  <div className="capsule-option-group">
                    <button 
                      className={`capsule-btn ${wakeWord === 'clap' ? 'active' : ''}`}
                      onClick={() => setWakeWord('clap')}
                    >
                      Clap Detection
                    </button>
                    <button 
                      className={`capsule-btn ${wakeWord === 'pihu' ? 'active' : ''}`}
                      onClick={() => setWakeWord('pihu')}
                    >
                      "Hey Pihu" Wake word
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <div className="slider-row">
                    <h3>WAKE DETECTION ENGINE</h3>
                  </div>
                  <div className="capsule-option-group">
                    <button 
                      className={`capsule-btn ${wakeEngine === 'whisper' ? 'active' : ''}`}
                      onClick={() => setWakeEngine('whisper')}
                    >
                      Whisper VAD (Local)
                    </button>
                    <button 
                      className={`capsule-btn ${wakeEngine === 'openwakeword' ? 'active' : ''}`}
                      onClick={() => setWakeEngine('openwakeword')}
                    >
                      openWakeWord (Local)
                    </button>
                  </div>
                  <p className="slider-hint">Choose between local Whisper acoustic VAD or high-precision openWakeWord.</p>
                </div>

                {wakeEngine === 'openwakeword' && (
                  <div className="settings-section fade-in">
                    <h3>OPENWAKEWORD CONFIGURATION</h3>
                    <p className="slider-hint" style={{ color: '#ffffff', opacity: 0.9, lineHeight: '1.5' }}>
                      🟢 <strong>100% Free, Local & Private:</strong> No API keys or tokens required! Runs extremely fast using native ONNX runtime on your CPU.
                    </p>
                    <p className="slider-hint" style={{ marginTop: '8px', lineHeight: '1.5' }}>
                      To use custom wake words, drop your trained <code>.onnx</code> model files inside the <code>wakeword_models/</code> folder in your project directory. If no custom models are present, openWakeWord will automatically listen to built-in keywords: <strong>"Hey Jarvis"</strong> and <strong>"Alexa"</strong>.
                    </p>
                  </div>
                )}

                <div className="settings-section">
                  <div className="slider-row">
                    <h3>SILENCE THRESHOLD TIMEOUT</h3>
                    <span className="slider-value">{silenceCounter}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="4.0" 
                    step="0.1"
                    value={silenceCounter} 
                    onChange={(e) => setSilenceCounter(e.target.value)}
                    className="glass-slider"
                  />
                  <p className="slider-hint">Defines the duration of silence before the Voice engine completes recording and translates.</p>
                </div>
              </div>
            )}

            {/* TAB 3: CORE SYSTEM */}
            {activeTab === 'system' && (
              <div className="tab-view fade-in">
                <div className="settings-section">
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h3>STARTUP ON BOOT</h3>
                      <span className="slider-hint">Launches PIHU OS background listener automatically upon logging in.</span>
                    </div>
                    <label className="glass-switch">
                      <input 
                        type="checkbox" 
                        checked={startOnBoot} 
                        onChange={(e) => setStartOnBoot(e.target.checked)}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-section">
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h3>HIDE DOCK ICON</h3>
                      <span className="slider-hint">Hides the app icon from the macOS Dock for a completely headless overlay experience.</span>
                    </div>
                    <label className="glass-switch">
                      <input 
                        type="checkbox" 
                        checked={hideDockIcon} 
                        onChange={(e) => setHideDockIcon(e.target.checked)}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>GLOBAL KEYBOARD SHORTCUT</h3>
                  <div className="shortcut-input-wrapper">
                    <input 
                      type="text" 
                      className="glass-shortcut-input"
                      value={shortcutKey}
                      onChange={(e) => setShortcutKey(e.target.value)}
                      placeholder="Press Hotkeys..."
                    />
                    <button className="shortcut-btn">Record</button>
                  </div>
                  <p className="slider-hint">Standard shortcut to activate/deactivate the holographic panel overlay instantly from anywhere.</p>
                </div>
              </div>
            )}

          </div>
        </section>

      </div>
    </div>
  );
};

export default SettingsPanel;
