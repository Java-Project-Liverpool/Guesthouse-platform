import React, { createContext, useEffect, useState } from 'react';
import type { ThemeMode } from '../types';

export interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('dumela_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateTheme = () => {
      const activeTheme: 'light' | 'dark' =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;

      setResolvedTheme(activeTheme);
      document.documentElement.setAttribute('data-theme', activeTheme);
      localStorage.setItem('dumela_theme', theme);
    };

    updateTheme();

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
