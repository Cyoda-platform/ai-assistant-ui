// ABOUTME: This file defines color palettes for the workflow canvas
// Supports multiple themes: cyoda-light (default), blue-violet, greeny-pink, and cyberpunk

export type ThemeName = 'cyoda-light' | 'bluey-orange' | 'greeny-pink' | 'cyberpunk';

export interface ColorPalette {
  name: string;
  description: string;
  colors: {
    // State node colors
    stateInitial: string;
    stateFinal: string;
    stateNormal: string;

    // Transition colors
    transitionManual: string;
    transitionAutomated: string;
  };
  ui: {
    // UI panel colors
    panelBorder: string;
    panelGradientFrom: string;
    panelGradientVia: string;
    panelGradientTo: string;
    panelTitleFrom: string;
    panelTitleTo: string;
    accentColor: string;
    accentHover: string;
  };
}

export const COLOR_PALETTES: Record<ThemeName, ColorPalette> = {
  'cyoda-light': {
    name: 'Cyoda Light',
    description: 'Cyoda brand light theme — teal accents on white',
    colors: {
      stateInitial: '#1a8a84',   // Cyoda primary teal (WCAG on white)
      stateFinal: '#94a3b8',     // Slate-400 — archived/final state
      stateNormal: '#4FB8B0',    // Cyoda brand teal — normal state
      transitionManual: '#7c3aed',    // Violet — manual transitions
      transitionAutomated: '#1a8a84', // Primary teal — automated transitions
    },
    ui: {
      panelBorder: '#1a8a84',        // --primary teal
      panelGradientFrom: '#ffffff',  // pure white
      panelGradientVia: '#f0fdfa',   // very light teal
      panelGradientTo: '#e8f7f6',    // --proof-bar-bg
      panelTitleFrom: '#1a8a84',     // primary teal
      panelTitleTo: '#0d9488',       // teal-600
      accentColor: '#1a8a84',        // --primary
      accentHover: '#145f5b',        // --accent-foreground (dark teal)
    }
  },
  'bluey-orange': {
    name: 'Blue Violet',
    description: 'Professional blue and violet palette',
    colors: {
      stateInitial: '#6366f1',    // Indigo-500 (Created - bright indigo)
      stateFinal: '#64748b',      // Steel Gray (Archived - gray)
      stateNormal: '#3b82f6',     // Blue-500 (Activate - professional blue)
      transitionManual: '#a855f7', // Purple-500 (Manual transitions - purple)
      transitionAutomated: '#7c3aed', // Violet-600 (Automated transitions - darker violet)
    },
    ui: {
      panelBorder: '#7c3aed',     // Violet-600
      panelGradientFrom: '#1e1b4b', // Indigo-950
      panelGradientVia: '#3730a3',  // Indigo-800
      panelGradientTo: '#7c3aed',   // Violet-600
      panelTitleFrom: '#c4b5fd',    // Violet-300
      panelTitleTo: '#a78bfa',      // Violet-400
      accentColor: '#7c3aed',       // Violet-600
      accentHover: '#a855f7',       // Purple-500
    }
  },
  'greeny-pink': {
    name: 'Greeny Pink',
    description: 'Fresh green and vibrant pink palette',
    colors: {
      stateInitial: '#ff69b4',    // Hot Pink (Created - brighter)
      stateFinal: '#64748b',      // Steel Gray-Blue (Archived - gray)
      stateNormal: '#ec4899',     // Vibrant Pink (Activate - darker than Created)
      transitionManual: '#22c55e', // Green-500 (Manual transitions - neon green)
      transitionAutomated: '#84cc16', // Lime-500 (Automated transitions - neon yellow-green)
    },
    ui: {
      panelBorder: '#ec4899',     // Vibrant Pink
      panelGradientFrom: '#831843', // Pink-950
      panelGradientVia: '#9d174d',  // Pink-900
      panelGradientTo: '#ec4899',   // Vibrant Pink
      panelTitleFrom: '#f9a8d4',    // Pink-300
      panelTitleTo: '#f472b6',      // Pink-400
      accentColor: '#ec4899',       // Vibrant Pink
      accentHover: '#f472b6',       // Light Pink
    }
  },
  'cyberpunk': {
    name: 'Cyberpunk Neon',
    description: 'Vibrant neon lime/emerald for a futuristic look',
    colors: {
      stateInitial: '#00cc77',    // Darker Neon Emerald Green (Created)
      stateFinal: '#64748b',      // Gray (Archived)
      stateNormal: '#00bb66',     // Even darker Neon Emerald (Activate)
      transitionManual: '#99dd00', // Muted Neon Lime/Salad (Manual transitions)
      transitionAutomated: '#88cc00', // Slightly darker Muted Neon Lime/Salad (Automated transitions)
    },
    ui: {
      panelBorder: '#00ff88',     // Neon Emerald Green
      panelGradientFrom: '#0a3a2a', // Dark Green
      panelGradientVia: '#0d5a3d',  // Medium Green
      panelGradientTo: '#00ff88',   // Neon Emerald Green
      panelTitleFrom: '#00ff88',    // Neon Emerald Green
      panelTitleTo: '#00dd77',      // Slightly darker Neon Emerald
      accentColor: '#00ff88',       // Neon Emerald Green
      accentHover: '#00dd77',       // Slightly darker neon green
    }
  }
};

export const DEFAULT_THEME: ThemeName = 'cyoda-light';

/**
 * Get color palette for a given theme
 */
export function getColorPalette(theme: ThemeName): ColorPalette {
  return COLOR_PALETTES[theme] || COLOR_PALETTES[DEFAULT_THEME];
}

/**
 * Get all available theme names
 */
export function getAvailableThemes(): ThemeName[] {
  return Object.keys(COLOR_PALETTES) as ThemeName[];
}

