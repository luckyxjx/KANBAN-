import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from './icons';
import './ThemeToggle.css';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
  };

  return (
    <div className="theme-toggle">
      <div className="theme-options">
        <button
          className={`theme-option ${theme === 'light' ? 'active' : ''}`}
          onClick={() => handleThemeChange('light')}
          title="Light mode"
        >
          <SunIcon size={16} />
        </button>
        
        <button
          className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => handleThemeChange('dark')}
          title="Dark mode"
        >
          <MoonIcon size={16} />
        </button>
        
        <button
          className={`theme-option ${theme === 'auto' ? 'active' : ''}`}
          onClick={() => handleThemeChange('auto')}
          title="Auto (follow system)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </button>
      </div>
      
      <span className="theme-label">
        {theme === 'auto' ? (isDark ? 'Auto (Dark)' : 'Auto (Light)') : theme}
      </span>
    </div>
  );
};

export default ThemeToggle;