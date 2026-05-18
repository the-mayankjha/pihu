import React from 'react';

const SettingsPanel = ({ isVisible, onClose, theme, setTheme, displayMode, setDisplayMode }) => {
  if (!isVisible) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-panel glass-panel">
        <div className="settings-header">
          <h2>UI CONCEPTS</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

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

      </div>
    </div>
  );
};

export default SettingsPanel;
