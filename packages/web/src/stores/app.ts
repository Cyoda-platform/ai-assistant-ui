import { create } from 'zustand';
import HelperStorage from "@/helpers/HelperStorage";

const helperStorage = new HelperStorage();

interface AppStore {
  // State
  isSidebarHidden: boolean;
  isCanvasHidden: boolean;
  theme: string; // Always 'dark' - light mode not supported
  consentDialog: boolean;
  workflowLayout: 'horizontal' | 'vertical';

  // Actions
  toggleSidebar: (value?: boolean) => void;
  toggleCanvas: () => void;
  setTheme: (theme: string) => void; // Kept for compatibility but always sets 'dark'
  setConsentDialog: (value: boolean) => void;
  setWorkflowLayout: (layout: 'horizontal' | 'vertical') => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state from storage
  isSidebarHidden: helperStorage.get('app:isSidebarHidden', false),
  isCanvasHidden: helperStorage.get('app:isCanvasHidden', false),
  theme: 'dark', // Always dark mode - light mode not supported
  consentDialog: helperStorage.get('app:consentDialog', true),
  workflowLayout: helperStorage.get('app:workflowLayout', 'vertical') as 'horizontal' | 'vertical',

  // Actions
  toggleSidebar(value?: boolean) {
    set((state) => {
      const newValue = value !== undefined ? value : !state.isSidebarHidden;
      helperStorage.set("app:isSidebarHidden", newValue);
      return { isSidebarHidden: newValue };
    });
  },

  toggleCanvas() {
    set((state) => {
      const newValue = !state.isCanvasHidden;
      helperStorage.set("app:isCanvasHidden", newValue);
      return { isCanvasHidden: newValue };
    });
  },

  setTheme(theme: string) {
    // Always enforce dark mode - light mode not supported
    set({ theme: 'dark' });
    helperStorage.set("app:theme", 'dark');
  },

  setConsentDialog(value: boolean) {
    set({ consentDialog: value });
    helperStorage.set("app:consentDialog", value);
  },

  setWorkflowLayout(layout: 'horizontal' | 'vertical') {
    set({ workflowLayout: layout });
    helperStorage.set("app:workflowLayout", layout);
  }
}));
