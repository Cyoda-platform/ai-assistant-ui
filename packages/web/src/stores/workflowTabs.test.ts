import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkflowTabsStore, WorkflowTab } from './workflowTabs';

describe('workflowTabsStore', () => {
  const mockTab1 = {
    modelName: 'workflow1',
    modelVersion: 1,
    displayName: 'Workflow 1',
    isDirty: false,
    technicalId: 'tech-id-1',
  };

  const mockTab2 = {
    modelName: 'workflow2',
    modelVersion: 1,
    displayName: 'Workflow 2',
    isDirty: false,
    technicalId: 'tech-id-2',
  };

  beforeEach(() => {
    // Reset store
    useWorkflowTabsStore.setState({
      tabs: [],
      activeTabId: null,
    });
  });

  describe('initial state', () => {
    it('should initialize with no tabs', () => {
      const { tabs } = useWorkflowTabsStore.getState();
      expect(tabs).toEqual([]);
    });

    it('should initialize with no active tab', () => {
      const { activeTabId } = useWorkflowTabsStore.getState();
      expect(activeTabId).toBeNull();
    });
  });

  describe('openTab', () => {
    it('should open a new tab', () => {
      const { openTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);

      const { tabs, activeTabId } = useWorkflowTabsStore.getState();
      expect(tabs).toHaveLength(1);
      expect(tabs[0]).toMatchObject(mockTab1);
      expect(activeTabId).toBe('tech-id-1');
    });

    it('should open multiple tabs', () => {
      const { openTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);

      const { tabs, activeTabId } = useWorkflowTabsStore.getState();
      expect(tabs).toHaveLength(2);
      expect(activeTabId).toBe('tech-id-2');
    });

    it('should not duplicate existing tab', () => {
      const { openTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab1);

      const { tabs } = useWorkflowTabsStore.getState();
      expect(tabs).toHaveLength(1);
    });

    it('should activate existing tab when opened again', () => {
      const { openTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      openTab(mockTab1);

      const { activeTabId } = useWorkflowTabsStore.getState();
      expect(activeTabId).toBe('tech-id-1');
    });
  });

  describe('closeTab', () => {
    it('should close a tab', () => {
      const { openTab, closeTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      closeTab('tech-id-1');

      const { tabs, activeTabId } = useWorkflowTabsStore.getState();
      expect(tabs).toHaveLength(0);
      expect(activeTabId).toBeNull();
    });

    it('should switch to next tab when closing active tab', () => {
      const { openTab, closeTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      closeTab('tech-id-2');

      const { tabs, activeTabId } = useWorkflowTabsStore.getState();
      expect(tabs).toHaveLength(1);
      expect(activeTabId).toBe('tech-id-1');
    });

    it('should keep active tab when closing non-active tab', () => {
      const { openTab, closeTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      closeTab('tech-id-1');

      const { tabs, activeTabId } = useWorkflowTabsStore.getState();
      expect(tabs).toHaveLength(1);
      expect(tabs[0].id).toBe('tech-id-2');
      expect(activeTabId).toBe('tech-id-2');
    });

    it('should handle closing non-existent tab gracefully', () => {
      const { openTab, closeTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      closeTab('non-existent-id');

      const { tabs } = useWorkflowTabsStore.getState();
      expect(tabs).toHaveLength(1);
    });
  });

  describe('setActiveTab', () => {
    it('should set active tab', () => {
      const { openTab, setActiveTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      setActiveTab('tech-id-1');

      const { activeTabId } = useWorkflowTabsStore.getState();
      expect(activeTabId).toBe('tech-id-1');
    });

    it('should not set active tab for non-existent tab', () => {
      const { openTab, setActiveTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      setActiveTab('non-existent-id');

      const { activeTabId } = useWorkflowTabsStore.getState();
      expect(activeTabId).toBe('tech-id-1');
    });
  });

  describe('updateTab', () => {
    it('should update tab properties', () => {
      const { openTab, updateTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      updateTab('tech-id-1', { isDirty: true, displayName: 'Updated Workflow' });

      const { tabs } = useWorkflowTabsStore.getState();
      expect(tabs[0].isDirty).toBe(true);
      expect(tabs[0].displayName).toBe('Updated Workflow');
    });

    it('should update tab ID and active tab ID if changed', () => {
      const { openTab, updateTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      updateTab('tech-id-1', { id: 'new-tech-id' });

      const { tabs, activeTabId } = useWorkflowTabsStore.getState();
      expect(tabs[0].id).toBe('new-tech-id');
      expect(activeTabId).toBe('new-tech-id');
    });

    it('should not affect other tabs', () => {
      const { openTab, updateTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      updateTab('tech-id-1', { isDirty: true });

      const { tabs } = useWorkflowTabsStore.getState();
      expect(tabs[0].isDirty).toBe(true);
      expect(tabs[1].isDirty).toBe(false);
    });
  });

  describe('closeAllTabs', () => {
    it('should close all tabs', () => {
      const { openTab, closeAllTabs } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      closeAllTabs();

      const { tabs, activeTabId } = useWorkflowTabsStore.getState();
      expect(tabs).toHaveLength(0);
      expect(activeTabId).toBeNull();
    });
  });

  describe('closeOtherTabs', () => {
    it('should close all tabs except specified one', () => {
      const { openTab, closeOtherTabs } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      closeOtherTabs('tech-id-1');

      const { tabs, activeTabId } = useWorkflowTabsStore.getState();
      expect(tabs).toHaveLength(1);
      expect(tabs[0].id).toBe('tech-id-1');
      expect(activeTabId).toBe('tech-id-1');
    });

    it('should handle non-existent tab gracefully', () => {
      const { openTab, closeOtherTabs } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      closeOtherTabs('non-existent-id');

      const { tabs } = useWorkflowTabsStore.getState();
      expect(tabs).toHaveLength(2);
    });
  });

  describe('getActiveTab', () => {
    it('should return active tab', () => {
      const { openTab, getActiveTab } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      const activeTab = getActiveTab();

      expect(activeTab).not.toBeNull();
      expect(activeTab?.id).toBe('tech-id-1');
    });

    it('should return null when no active tab', () => {
      const { getActiveTab } = useWorkflowTabsStore.getState();

      const activeTab = getActiveTab();
      expect(activeTab).toBeNull();
    });
  });

  describe('hasUnsavedChanges', () => {
    it('should return false when no tabs have unsaved changes', () => {
      const { openTab, hasUnsavedChanges } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);

      expect(hasUnsavedChanges()).toBe(false);
    });

    it('should return true when any tab has unsaved changes', () => {
      const { openTab, updateTab, hasUnsavedChanges } = useWorkflowTabsStore.getState();

      openTab(mockTab1);
      openTab(mockTab2);
      updateTab('tech-id-1', { isDirty: true });

      expect(hasUnsavedChanges()).toBe(true);
    });

    it('should return false when no tabs exist', () => {
      const { hasUnsavedChanges } = useWorkflowTabsStore.getState();

      expect(hasUnsavedChanges()).toBe(false);
    });
  });
});
