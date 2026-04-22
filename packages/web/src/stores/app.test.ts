import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from './app';

// Mock HelperStorage
vi.mock('@/helpers/HelperStorage', () => {
  return {
    default: class {
      private storage = new Map();
      get(key: string, defaultValue: any) {
        return this.storage.get(key) ?? defaultValue;
      }
      set(key: string, value: any) {
        this.storage.set(key, value);
      }
    },
  };
});

describe('appStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      isSidebarHidden: false,
      isCanvasHidden: false,
      theme: 'dark',
      consentDialog: true,
      workflowLayout: 'vertical',
    });
  });

  describe('sidebar', () => {
    it('should initialize with sidebar visible', () => {
      const { isSidebarHidden } = useAppStore.getState();
      expect(isSidebarHidden).toBe(false);
    });

    it('should toggle sidebar without argument', () => {
      const { toggleSidebar } = useAppStore.getState();

      toggleSidebar();
      expect(useAppStore.getState().isSidebarHidden).toBe(true);

      toggleSidebar();
      expect(useAppStore.getState().isSidebarHidden).toBe(false);
    });

    it('should set sidebar state explicitly with argument', () => {
      const { toggleSidebar } = useAppStore.getState();

      toggleSidebar(true);
      expect(useAppStore.getState().isSidebarHidden).toBe(true);

      toggleSidebar(false);
      expect(useAppStore.getState().isSidebarHidden).toBe(false);
    });
  });

  describe('canvas', () => {
    it('should initialize with canvas visible', () => {
      const { isCanvasHidden } = useAppStore.getState();
      expect(isCanvasHidden).toBe(false);
    });

    it('should toggle canvas', () => {
      const { toggleCanvas } = useAppStore.getState();

      toggleCanvas();
      expect(useAppStore.getState().isCanvasHidden).toBe(true);

      toggleCanvas();
      expect(useAppStore.getState().isCanvasHidden).toBe(false);
    });
  });

  describe('theme', () => {
    it('should always be dark theme', () => {
      const { theme } = useAppStore.getState();
      expect(theme).toBe('dark');
    });

    it('should enforce dark theme even when trying to set light', () => {
      const { setTheme } = useAppStore.getState();

      setTheme('light');
      expect(useAppStore.getState().theme).toBe('dark');

      setTheme('blue');
      expect(useAppStore.getState().theme).toBe('dark');
    });
  });

  describe('consent dialog', () => {
    it('should initialize with consent dialog enabled', () => {
      const { consentDialog } = useAppStore.getState();
      expect(consentDialog).toBe(true);
    });

    it('should set consent dialog state', () => {
      const { setConsentDialog } = useAppStore.getState();

      setConsentDialog(false);
      expect(useAppStore.getState().consentDialog).toBe(false);

      setConsentDialog(true);
      expect(useAppStore.getState().consentDialog).toBe(true);
    });
  });

  describe('workflow layout', () => {
    it('should initialize with vertical layout', () => {
      const { workflowLayout } = useAppStore.getState();
      expect(workflowLayout).toBe('vertical');
    });

    it('should set workflow layout', () => {
      const { setWorkflowLayout } = useAppStore.getState();

      setWorkflowLayout('horizontal');
      expect(useAppStore.getState().workflowLayout).toBe('horizontal');

      setWorkflowLayout('vertical');
      expect(useAppStore.getState().workflowLayout).toBe('vertical');
    });
  });
});
