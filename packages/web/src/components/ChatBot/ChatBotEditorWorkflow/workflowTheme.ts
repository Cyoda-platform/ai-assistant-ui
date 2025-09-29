/**
 * Unified Color Palette for Workflow Editor
 * Consistent colors across nodes, edges, badges, and UI elements
 */

export const workflowTheme = {
  // Node Types
  nodes: {
    initial: {
      gradient: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
      border: '#0F766E',
      color: '#14B8A6',
      name: 'Teal'
    },
    terminal: {
      gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
      border: '#047857',
      color: '#10B981',
      name: 'Green'
    },
    normal: {
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
      border: '#1E40AF',
      color: '#3B82F6',
      name: 'Blue'
    },
    selected: {
      border: '#F59E0B',
      glow: 'rgba(245, 158, 11, 0.4)',
      name: 'Amber'
    }
  },

  // Transition Types
  transitions: {
    manual: {
      color: '#F59E0B',
      colorLight: '#FCD34D',
      colorDark: '#D97706',
      badge: {
        background: 'rgba(251, 191, 36, 0.2)',
        border: 'rgba(251, 191, 36, 0.4)',
        text: '#FCD34D'
      },
      name: 'Amber/Yellow'
    },
    auto: {
      color: '#10B981',
      colorLight: '#34D399',
      colorDark: '#059669',
      badge: {
        background: 'rgba(16, 185, 129, 0.2)',
        border: 'rgba(16, 185, 129, 0.4)',
        text: '#34D399'
      },
      name: 'Emerald/Green'
    }
  },

  // Edge/Connection Colors
  edges: {
    manual: '#F59E0B',      // Amber - matches manual badge
    auto: '#10B981',        // Emerald - matches auto badge
    default: '#64748B',     // Slate gray - neutral
    hover: '#94A3B8',       // Lighter slate
    selected: '#F59E0B'     // Amber
  },

  // Background & UI
  background: {
    canvas: '#0F172A',      // Slate 900
    node: '#1E293B',        // Slate 800
    panel: '#334155',       // Slate 700
    hover: '#475569'        // Slate 600
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',
    secondary: '#E2E8F0',   // Slate 200
    muted: '#94A3B8',       // Slate 400
    disabled: '#64748B'     // Slate 500
  },

  // Status Colors
  status: {
    success: '#10B981',     // Emerald
    warning: '#F59E0B',     // Amber
    error: '#EF4444',       // Red
    info: '#3B82F6'         // Blue
  },

  // Validation
  validation: {
    valid: {
      color: '#10B981',
      background: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)'
    },
    error: {
      color: '#EF4444',
      background: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)'
    },
    warning: {
      color: '#F59E0B',
      background: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)'
    }
  }
};

export type WorkflowTheme = typeof workflowTheme;

