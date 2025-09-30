/**
 * Modern Fashionable Color Palette for Workflow Editor
 * Inspired by Vercel, Linear, and contemporary design systems
 * Features: Vibrant gradients, glassmorphism, and smooth transitions
 */

export const workflowTheme = {
  // Node Types - Formal professional gradients with website colors
  nodes: {
    initial: {
      gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)', // Pink gradient (from logo)
      border: '#EC4899',
      color: '#EC4899',
      glow: 'rgba(236, 72, 153, 0.4)',
      name: 'Pink'
    },
    terminal: {
      gradient: 'linear-gradient(135deg, #0D8484 0%, #14b8a6 100%)', // Teal gradient (website primary)
      border: '#0D8484',
      color: '#0D8484',
      glow: 'rgba(13, 132, 132, 0.4)',
      name: 'Teal'
    },
    normal: {
      gradient: 'linear-gradient(135deg, #2e8861 0%, #10B981 100%)', // Green gradient (website secondary)
      border: '#2e8861',
      color: '#2e8861',
      glow: 'rgba(46, 136, 97, 0.4)',
      name: 'Green'
    },
    selected: {
      border: '#109f9f',
      glow: 'rgba(16, 159, 159, 0.5)',
      name: 'Teal-Light'
    }
  },

  // Transition Types
  transitions: {
    manual: {
      color: '#EC4899',
      colorLight: '#F472B6',
      colorDark: '#DB2777',
      badge: {
        background: 'rgba(236, 72, 153, 0.15)',
        border: 'rgba(236, 72, 153, 0.4)',
        text: '#F9A8D4'
      },
      name: 'Pink'
    },
    auto: {
      color: '#0D8484',
      colorLight: '#14b8a6',
      colorDark: '#0A6363',
      badge: {
        background: 'rgba(13, 132, 132, 0.15)',
        border: 'rgba(13, 132, 132, 0.4)',
        text: '#5EEAD4'
      },
      name: 'Teal'
    }
  },

  // Edge/Connection Colors
  edges: {
    manual: '#EC4899',      // Pink - matches manual badge
    auto: '#0D8484',        // Teal - matches auto badge
    default: '#64748B',     // Slate gray - neutral
    hover: '#94A3B8',       // Lighter slate
    selected: '#109f9f'     // Teal-Light
  },

  // Background & UI - Glassmorphism and modern layers
  background: {
    canvas: '#0F172A',      // Deep slate
    node: '#1E293B',        // Slate 800
    panel: '#334155',       // Slate 700
    hover: '#475569',       // Slate 600
    glass: 'rgba(30, 41, 59, 0.8)',      // Glass effect
    glassLight: 'rgba(51, 65, 85, 0.6)', // Lighter glass
    overlay: 'rgba(15, 23, 42, 0.95)'    // Modal overlay
  },

  // Text Colors - High contrast for readability
  text: {
    primary: '#F8FAFC',     // Almost white
    secondary: '#E2E8F0',   // Slate 200
    muted: '#94A3B8',       // Slate 400
    disabled: '#64748B'     // Slate 500
  },

  // Status Colors - Vibrant and clear
  status: {
    success: '#10B981',     // Emerald
    warning: '#F59E0B',     // Amber
    error: '#EF4444',       // Red
    info: '#3B82F6'         // Blue
  },

  // Validation - Clear visual feedback
  validation: {
    valid: {
      color: '#10B981',
      background: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.4)'
    },
    error: {
      color: '#EF4444',
      background: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.4)'
    },
    warning: {
      color: '#F59E0B',
      background: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.4)'
    }
  },

  // Shadows - Depth and elevation
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(139, 92, 246, 0.3)',
    glowStrong: '0 0 30px rgba(139, 92, 246, 0.5)',
  },

  // Border styles
  border: {
    default: '#334155',
    light: '#475569',
    focus: '#8B5CF6',
    glass: 'rgba(255, 255, 255, 0.1)'
  }
};

export type WorkflowTheme = typeof workflowTheme;

