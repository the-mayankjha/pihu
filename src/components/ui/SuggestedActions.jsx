import React from 'react';

const SuggestedActions = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="suggested-actions-container">
      <div className="suggested-header">
        <span className="dot"></span>
        <span className="line"></span>
        <span className="text">You can try saying</span>
        <span className="line"></span>
        <span className="dot"></span>
      </div>
      
      <div className="suggested-buttons">
        <button className="suggested-btn">
          <span className="icon">{'</>'}</span>
          <span className="label">Open my project in VS Code</span>
        </button>
        
        <button className="suggested-btn">
          <span className="icon">📅</span>
          <span className="label">Show my daily summary</span>
        </button>
        
        <button className="suggested-btn">
          <span className="icon">📄</span>
          <span className="label">Find notes from yesterday</span>
        </button>
        
        <button className="suggested-btn">
          <span className="icon">{'>_'}</span>
          <span className="label">Run tests and fix errors</span>
        </button>
      </div>
    </div>
  );
};

export default SuggestedActions;
