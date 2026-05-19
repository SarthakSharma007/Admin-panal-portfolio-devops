import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext'; // This import will now work
import './ThemeToggle.css';

const ThemeToggle = () => {
  // 1. Get 'theme' from the hook, not 'isDarkMode'
  const { theme, toggleTheme } = useTheme();

  // 2. Create 'isDarkMode' based on the 'theme' state
  const isDarkMode = theme === 'dark';

  // The rest of your code will now work
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-inner">
        <div className={`theme-icon ${isDarkMode ? 'dark' : 'light'}`}>
          {isDarkMode ? <FaMoon /> : <FaSun />}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;