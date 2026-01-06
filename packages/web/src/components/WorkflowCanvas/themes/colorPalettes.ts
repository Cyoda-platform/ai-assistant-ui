// ABOUTME: This file defines color palettes for the workflow canvas
// Supports multiple themes: bluey-orange (default), greeny-pink, and cyberpunk

export type ThemeName = 'bluey-orange' | 'greeny-pink' | 'cyberpunk';

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
  'bluey-orange': {
    name: 'Bluey Orange',
    description: 'Professional blue and orange palette',
    colors: {
      stateInitial: '#6366f1',    // Indigo-500
      stateFinal: '#8b5cf6',      // Violet-500
      stateNormal: '#0ea5e9',     // Sky-500
      transitionManual: '#f59e0b', // Amber-500
      transitionAutomated: '#8b5cf6', // Violet-500
    },
    ui: {
      panelBorder: '#7c3aed',     // Purple-600
      panelGradientFrom: '#1e1b4b', // Indigo-950
      panelGradientVia: '#5b21b6',  // Violet-900
      panelGradientTo: '#4c1d95',   // Purple-900
      panelTitleFrom: '#a78bfa',    // Violet-400
      panelTitleTo: '#818cf8',      // Indigo-400
      accentColor: '#8b5cf6',       // Violet-500
      accentHover: '#7c3aed',       // Violet-600
    }
  },
  'greeny-pink': {
    name: 'Greeny Pink',
    description: 'Fresh green and vibrant pink palette',
    colors: {
      stateInitial: '#ec4899',    // Pink-500
      stateFinal: '#a855f7',      // Purple-500
      stateNormal: '#10b981',     // Emerald-500
      transitionManual: '#ec4899', // Pink-500
      transitionAutomated: '#10b981', // Emerald-500
    },
    ui: {
      panelBorder: '#ec4899',     // Pink-500
      panelGradientFrom: '#831843', // Pink-950
      panelGradientVia: '#9d174d',  // Pink-900
      panelGradientTo: '#be185d',   // Pink-800
      panelTitleFrom: '#f9a8d4',    // Pink-300
      panelTitleTo: '#f472b6',      // Pink-400
      accentColor: '#ec4899',       // Pink-500
      accentHover: '#db2777',       // Pink-600
    }
  },
  'cyberpunk': {
    name: 'Cyberpunk Neon',
    description: 'Vibrant neon lime/emerald for a futuristic look',
    colors: {
      stateInitial: '#84cc16',    // Lime-500
      stateFinal: '#10b981',      // Emerald-500
      stateNormal: '#22c55e',     // Green-500
      transitionManual: '#a3e635', // Lime-400
      transitionAutomated: '#34d399', // Emerald-400
    },
    ui: {
      panelBorder: '#365314',     // Lime-950 border
      panelGradientFrom: '#111827', // Gray-900
      panelGradientVia: '#1a2e05',  // Lime-950/30
      panelGradientTo: '#022c22',   // Emerald-950/30
      panelTitleFrom: '#a3e635',    // Lime-400
      panelTitleTo: '#34d399',      // Emerald-400
      accentColor: '#84cc16',       // Lime-500
      accentHover: '#65a30d',       // Lime-600
    }
  }
};

export const DEFAULT_THEME: ThemeName = 'bluey-orange';

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

