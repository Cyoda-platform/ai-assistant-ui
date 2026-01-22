import { create } from 'zustand';

export type HighlightContext = 'canvas' | 'cloud' | 'tasks' | null;

interface HeaderHighlightState {
  highlightedContext: HighlightContext;
  setHighlightedContext: (context: HighlightContext) => void;
  clearHighlight: () => void;
}

/**
 * Store for managing which header button should be highlighted (pulsing animation)
 * This is used to draw user attention to relevant contexts when AI suggests actions
 */
export const useHeaderHighlightStore = create<HeaderHighlightState>((set) => ({
  highlightedContext: null,
  
  setHighlightedContext: (context: HighlightContext) => {
    set({ highlightedContext: context });
  },
  
  clearHighlight: () => {
    set({ highlightedContext: null });
  },
}));

