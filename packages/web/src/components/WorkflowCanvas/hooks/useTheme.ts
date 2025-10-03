// ABOUTME: Custom hook for managing workflow canvas theme with localStorage persistence

import { useState, useEffect, useCallback } from 'react';
import { ThemeName, DEFAULT_THEME, getColorPalette, ColorPalette } from '../themes/colorPalettes';

const THEME_STORAGE_KEY = 'workflow-canvas-theme';

/**
 * Hook for managing workflow canvas theme
 * Persists theme selection to localStorage
 */
export function useTheme() {
  // Load theme from localStorage or use default
  const [theme, setThemeState] = useState<ThemeName>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && (stored === 'bluey-orange' || stored === 'greeny-pink' || stored === 'cyberpunk')) {
        return stored as ThemeName;
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    return DEFAULT_THEME;
  });

  // Get current color palette
  const palette = getColorPalette(theme);

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, []);

  return {
    theme,
    setTheme,
    palette,
  };
}

