import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Create and export the context
export const ThemeContext = createContext();

// 2. Create and export the provider
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme ? savedTheme : (prefersDark ? 'dark' : 'light');
  });

  useEffect(() => {
    // THIS IS THE FIX:
    // We change this from document.body.className = theme
    // to match what your index.css file expects.
    document.documentElement.setAttribute('data-theme', theme); 
    
    localStorage.setItem('theme', theme);
  }, [theme]); // This array ensures the effect runs only when 'theme' changes

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Create and export the 'useTheme' hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};