import { create } from 'zustand';

export interface WorkflowTab {
  id: string; // Unique identifier for the tab (combination of modelName and modelVersion)
  modelName: string;
  modelVersion: number;
  displayName: string; // Display name for the tab
  isDirty: boolean; // Has unsaved changes
  technicalId: string; // Technical ID for storage
}

interface WorkflowTabsState {
  tabs: WorkflowTab[];
  activeTabId: string | null;

  // Actions
  openTab: (tab: Omit<WorkflowTab, 'id'>) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<WorkflowTab>) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  getActiveTab: () => WorkflowTab | null;
  hasUnsavedChanges: () => boolean;
}

export const useWorkflowTabsStore = create<WorkflowTabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tabData) => {
    const { tabs, activeTabId } = get();

    // Create unique ID from modelName and modelVersion
    const tabId = `${tabData.modelName}_v${tabData.modelVersion}`;

    // Check if tab already exists
    const existingTab = tabs.find(t => t.id === tabId);

    if (existingTab) {
      // Tab already exists, just activate it
      set({ activeTabId: tabId });
    } else {
      // Create new tab
      const newTab: WorkflowTab = {
        id: tabId,
        ...tabData,
      };

      set({
        tabs: [...tabs, newTab],
        activeTabId: tabId,
      });
    }
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const tabIndex = tabs.findIndex(t => t.id === tabId);

    if (tabIndex === -1) return;

    const newTabs = tabs.filter(t => t.id !== tabId);
    let newActiveTabId = activeTabId;

    // If closing the active tab, switch to another tab
    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        // Switch to the tab to the right, or the last tab if closing the rightmost
        const nextIndex = Math.min(tabIndex, newTabs.length - 1);
        newActiveTabId = newTabs[nextIndex].id;
      } else {
        newActiveTabId = null;
      }
    }

    set({
      tabs: newTabs,
      activeTabId: newActiveTabId,
    });
  },

  setActiveTab: (tabId) => {
    const { tabs } = get();
    const tab = tabs.find(t => t.id === tabId);

    if (tab) {
      set({ activeTabId: tabId });
    }
  },

  updateTab: (tabId, updates) => {
    const { tabs, activeTabId } = get();

    // Check if the ID is being changed
    const isIdChanging = updates.id && updates.id !== tabId;

    const updatedTabs = tabs.map(tab =>
      tab.id === tabId ? { ...tab, ...updates } : tab
    );

    // If the active tab's ID changed, update activeTabId
    const newActiveTabId = isIdChanging && activeTabId === tabId
      ? updates.id
      : activeTabId;

    set({
      tabs: updatedTabs,
      activeTabId: newActiveTabId
    });
  },

  closeAllTabs: () => {
    set({
      tabs: [],
      activeTabId: null,
    });
  },

  closeOtherTabs: (tabId) => {
    const { tabs } = get();
    const tab = tabs.find(t => t.id === tabId);

    if (tab) {
      set({
        tabs: [tab],
        activeTabId: tabId,
      });
    }
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find(t => t.id === activeTabId) || null;
  },

  hasUnsavedChanges: () => {
    const { tabs } = get();
    return tabs.some(tab => tab.isDirty);
  },
}));

