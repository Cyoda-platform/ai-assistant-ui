import { describe, it, expect, beforeEach } from 'vitest';
import { useAppsTabsStore, AppTab } from './appsTabs';

describe('appsTabsStore', () => {
  const mockTab1 = {
    modelName: 'app1',
    modelVersion: 1,
    displayName: 'App 1',
    isDirty: false,
    technicalId: 'app-tech-id-1',
  };

  const mockTab2 = {
    modelName: 'app2',
    modelVersion: 1,
    displayName: 'App 2',
    isDirty: false,
    technicalId: 'app-tech-id-2',
  };

  beforeEach(() => {
    // Reset store
    useAppsTabsStore.setState({
      tabs: [],
      activeTabId: null,
    });
  });

  describe('initial state', () => {
    it('should initialize with no tabs', () => {
      const { tabs } = useAppsTabsStore.getState();
      expect(tabs).toEqual([]);
    });

    it('should initialize with no active tab', () => {
      const { activeTabId } = useAppsTabsStore.getState();
      expect(activeTabId).toBeNull();
    });
  });

  describe('openTab', () => {
    it('should open a new tab and return it', () => {
      const { openTab } = useAppsTabsStore.getState();

      const result = openTab(mockTab1);

      const { tabs, activeTabId } = useAppsTabsStore.getState();
      expect(tabs).toHaveLength(1);
      expect(tabs[0]).toMatchObject(mockTab1);
      expect(activeTabId).toBe('app-tech-id-1');
      expect(result).toMatchObject(mockTab1);
    });

    it('should open multiple tabs', () => {
      const { openTab } = useAppsTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);

      const { tabs, activeTabId } = useAppsTabsStore.getState();
      expect(tabs).toHaveLength(2);
      expect(activeTabId).toBe('app-tech-id-2');
    });

    it('should not duplicate existing tab', () => {
      const { openTab } = useAppsTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab1);

      const { tabs } = useAppsTabsStore.getState();
      expect(tabs).toHaveLength(1);
    });

    it('should activate existing tab when opened again and return it', () => {
      const { openTab } = useAppsTabsStore.getState();

      const tab1 = openTab(mockTab1);
      openTab(mockTab2);
      const tab1Again = openTab(mockTab1);

      const { activeTabId } = useAppsTabsStore.getState();
      expect(activeTabId).toBe('app-tech-id-1');
      expect(tab1Again).toEqual(tab1);
    });
  });

  describe('closeTab', () => {
    it('should close a tab', () => {
      const { openTab, closeTab } = useAppsTabsStore.getState();

      openTab(mockTab1);
      closeTab('app-tech-id-1');

      const { tabs, activeTabId } = useAppsTabsStore.getState();
      expect(tabs).toHaveLength(0);
      expect(activeTabId).toBeNull();
    });

    it('should switch to next tab when closing active tab', () => {
      const { openTab, closeTab } = useAppsTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      closeTab('app-tech-id-2');

      const { tabs, activeTabId } = useAppsTabsStore.getState();
      expect(tabs).toHaveLength(1);
      expect(activeTabId).toBe('app-tech-id-1');
    });

    it('should keep active tab when closing non-active tab', () => {
      const { openTab, closeTab } = useAppsTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      closeTab('app-tech-id-1');

      const { tabs, activeTabId } = useAppsTabsStore.getState();
      expect(tabs).toHaveLength(1);
      expect(tabs[0].id).toBe('app-tech-id-2');
      expect(activeTabId).toBe('app-tech-id-2');
    });

    it('should handle closing non-existent tab gracefully', () => {
      const { openTab, closeTab } = useAppsTabsStore.getState();

      openTab(mockTab1);
      closeTab('non-existent-id');

      const { tabs } = useAppsTabsStore.getState();
      expect(tabs).toHaveLength(1);
    });
  });

  describe('setActiveTab', () => {
    it('should set active tab', () => {
      const { openTab, setActiveTab } = useAppsTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      setActiveTab('app-tech-id-1');

      const { activeTabId } = useAppsTabsStore.getState();
      expect(activeTabId).toBe('app-tech-id-1');
    });

    it('should not set active tab for non-existent tab', () => {
      const { openTab, setActiveTab } = useAppsTabsStore.getState();

      openTab(mockTab1);
      setActiveTab('non-existent-id');

      const { activeTabId } = useAppsTabsStore.getState();
      expect(activeTabId).toBe('app-tech-id-1');
    });
  });

  describe('updateTab', () => {
    it('should update tab properties', () => {
      const { openTab, updateTab } = useAppsTabsStore.getState();

      openTab(mockTab1);
      updateTab('app-tech-id-1', { isDirty: true, displayName: 'Updated App' });

      const { tabs } = useAppsTabsStore.getState();
      expect(tabs[0].isDirty).toBe(true);
      expect(tabs[0].displayName).toBe('Updated App');
    });

    it('should update tab ID and active tab ID if changed', () => {
      const { openTab, updateTab } = useAppsTabsStore.getState();

      openTab(mockTab1);
      updateTab('app-tech-id-1', { id: 'new-app-tech-id' });

      const { tabs, activeTabId } = useAppsTabsStore.getState();
      expect(tabs[0].id).toBe('new-app-tech-id');
      expect(activeTabId).toBe('new-app-tech-id');
    });

    it('should not affect other tabs', () => {
      const { openTab, updateTab } = useAppsTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      updateTab('app-tech-id-1', { isDirty: true });

      const { tabs } = useAppsTabsStore.getState();
      expect(tabs[0].isDirty).toBe(true);
      expect(tabs[1].isDirty).toBe(false);
    });
  });

  describe('closeAllTabs', () => {
    it('should close all tabs', () => {
      const { openTab, closeAllTabs } = useAppsTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      closeAllTabs();

      const { tabs, activeTabId } = useAppsTabsStore.getState();
      expect(tabs).toHaveLength(0);
      expect(activeTabId).toBeNull();
    });
  });

  describe('closeOtherTabs', () => {
    it('should close all tabs except specified one', () => {
      const { openTab, closeOtherTabs } = useAppsTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      closeOtherTabs('app-tech-id-1');

      const { tabs, activeTabId } = useAppsTabsStore.getState();
      expect(tabs).toHaveLength(1);
      expect(tabs[0].id).toBe('app-tech-id-1');
      expect(activeTabId).toBe('app-tech-id-1');
    });

    it('should handle non-existent tab gracefully', () => {
      const { openTab, closeOtherTabs } = useAppsTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      closeOtherTabs('non-existent-id');

      const { tabs } = useAppsTabsStore.getState();
      expect(tabs).toHaveLength(2);
    });
  });

  describe('getActiveTab', () => {
    it('should return active tab', () => {
      const { openTab, getActiveTab } = useAppsTabsStore.getState();

      openTab(mockTab1);
      const activeTab = getActiveTab();

      expect(activeTab).not.toBeNull();
      expect(activeTab?.id).toBe('app-tech-id-1');
    });

    it('should return null when no active tab', () => {
      const { getActiveTab } = useAppsTabsStore.getState();

      const activeTab = getActiveTab();
      expect(activeTab).toBeNull();
    });
  });

  describe('hasUnsavedChanges', () => {
    it('should return false when no tabs have unsaved changes', () => {
      const { openTab, hasUnsavedChanges } = useAppsTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);

      expect(hasUnsavedChanges()).toBe(false);
    });

    it('should return true when any tab has unsaved changes', () => {
      const { openTab, updateTab, hasUnsavedChanges } = useAppsTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      updateTab('app-tech-id-1', { isDirty: true });

      expect(hasUnsavedChanges()).toBe(true);
    });

    it('should return false when no tabs exist', () => {
      const { hasUnsavedChanges } = useAppsTabsStore.getState();

      expect(hasUnsavedChanges()).toBe(false);
    });
  });
});
