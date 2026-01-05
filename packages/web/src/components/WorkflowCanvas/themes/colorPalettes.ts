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
      stateInitial: '#0ea5e9',    // Cyan/Sky Blue (Created - bright cyan)
      stateFinal: '#64748b',      // Steel Blue-Gray (Archived - more gray with blue tone)
      stateNormal: '#3b82f6',     // Light Professional Blue (Activate - lighter blue)
      transitionManual: '#f59e0b', // Amber-500 (Manual transitions - orange)
      transitionAutomated: '#ff6b35', // Neon Orange (Automated transitions - vibrant neon orange)
    },
    ui: {
      panelBorder: '#3b82f6',     // Light Professional Blue
      panelGradientFrom: '#0f172a', // Slate-950
      panelGradientVia: '#1e3a8a',  // Blue-900
      panelGradientTo: '#3b82f6',   // Light Professional Blue
      panelTitleFrom: '#93c5fd',    // Blue-300
      panelTitleTo: '#60a5fa',      // Blue-400
      accentColor: '#3b82f6',       // Light Professional Blue
      accentHover: '#0ea5e9',       // Cyan/Sky Blue
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

