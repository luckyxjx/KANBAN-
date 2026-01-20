import React from 'react';
import './DemoModeToggle.css';

interface DemoModeToggleProps {
  demoMode: boolean;
  onToggle: (enabled: boolean) => void;
}

const DemoModeToggle: React.FC<DemoModeToggleProps> = ({ demoMode, onToggle }) => {
  return (
    <div className="demo-mode-toggle">
      <label className="demo-toggle-label">
        <input
          type="checkbox"
          checked={demoMode}
          onChange={(e) => onToggle(e.target.checked)}
          className="demo-toggle-input"
        />
        <span className="demo-toggle-slider"></span>
        <span className="demo-toggle-text">Demo Mode</span>
      </label>
      {demoMode && (
        <div className="demo-mode-notice">
          🎭 Demo mode active - Authentication bypassed
        </div>
      )}
    </div>
  );
};

export default DemoModeToggle;