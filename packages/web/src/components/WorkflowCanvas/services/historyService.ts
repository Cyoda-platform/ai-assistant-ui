// ABOUTME: This file provides session-based history management for workflow changes with undo/redo functionality
// and per-workflow history tracking using sessionStorage for persistence.

import type { UIWorkflowData } from '../types/workflow';
import { configService } from './configService';

const HISTORY_STORAGE_KEY = 'statemachine-ui-history';

interface WorkflowHistoryEntry {
  timestamp: number;
  workflow: UIWorkflowData;
  description: string;
}

interface WorkflowHistory {
  entries: WorkflowHistoryEntry[];
  currentIndex: number; // -1 means at the latest state
}

interface HistoryStorage {
  [workflowId: string]: WorkflowHistory;
}

export class HistoryService {
  private static instance: HistoryService;
  private storage: HistoryStorage;

  private constructor() {
    this.storage = this.loadFromSession();
  }

  public static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  /**
   * Load history from sessionStorage
   */
  private loadFromSession(): HistoryStorage {
    try {
      const stored = sessionStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load history from sessionStorage:', error);
    }
    return {};
  }

  /**
   * Save history to sessionStorage
   */
  private saveToSession(): void {
    try {
      sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(this.storage));
    } catch (error) {
      console.warn('Failed to save history to sessionStorage:', error);
    }
  }

  /**
   * Add a new workflow state to history
   */
  public addEntry(workflowId: string, workflow: UIWorkflowData, description: string): void {
    if (!this.storage[workflowId]) {
      this.storage[workflowId] = {
        entries: [],
        currentIndex: -1
      };
    }

    const history = this.storage[workflowId];
    const maxDepth = configService.getHistoryConfig().maxDepth;

    // If we're not at the latest state (user has undone some actions),
    // remove all entries after current index before adding new entry
    if (history.currentIndex >= 0) {
      history.entries = history.entries.slice(0, history.currentIndex + 1);
    }

    // Add new entry
    const entry: WorkflowHistoryEntry = {
      timestamp: Date.now(),
      workflow: JSON.parse(JSON.stringify(workflow)), // Deep clone
      description
    };

    history.entries.push(entry);

    // Maintain max depth by removing oldest entries
    if (history.entries.length > maxDepth) {
      const removeCount = history.entries.length - maxDepth;
      history.entries.splice(0, removeCount);
    }

    // Reset to latest state
    history.currentIndex = -1;

    this.saveToSession();
  }

  /**
   * Undo the last action for a workflow
   */
  public undo(workflowId: string): UIWorkflowData | null {
    const history = this.storage[workflowId];
    if (!history || history.entries.length === 0) {
      return null;
    }

    // If at latest state, move to last entry (which is the previous state)
    if (history.currentIndex === -1) {
      if (history.entries.length === 1) {
        // Only one entry, can't undo further
        return null;
      }
      history.currentIndex = history.entries.length - 2; // Go to second-to-last entry
    } else if (history.currentIndex > 0) {
      history.currentIndex--;
    } else {
      // Already at oldest entry
      return null;
    }

    this.saveToSession();
    return JSON.parse(JSON.stringify(history.entries[history.currentIndex].workflow));
  }

  /**
   * Redo the next action for a workflow
   */
  public redo(workflowId: string): UIWorkflowData | null {
    const history = this.storage[workflowId];
    if (!history || history.entries.length === 0) {
      return null;
    }

    // Can only redo if we're not at the latest state
    if (history.currentIndex === -1) {
      return null;
    }

    if (history.currentIndex < history.entries.length - 1) {
      history.currentIndex++;
      this.saveToSession();
      return JSON.parse(JSON.stringify(history.entries[history.currentIndex].workflow));
    } else {
      // Already at the last entry, can't redo further
      return null;
    }
  }

  /**
   * Check if undo is available for a workflow
   */
  public canUndo(workflowId: string): boolean {
    const history = this.storage[workflowId];
    if (!history || history.entries.length === 0) {
      return false;
    }

    // Can undo if we have more than one entry and we're not at the oldest entry
    if (history.currentIndex === -1) {
      return history.entries.length > 1;
    } else {
      return history.currentIndex > 0;
    }
  }

  /**
   * Check if redo is available for a workflow
   */
  public canRedo(workflowId: string): boolean {
    const history = this.storage[workflowId];
    if (!history || history.entries.length === 0) {
      return false;
    }

    return history.currentIndex >= 0 && history.currentIndex < history.entries.length - 1;
  }

  /**
   * Get the number of available undo operations
   */
  public getUndoCount(workflowId: string): number {
    const history = this.storage[workflowId];
    if (!history || history.entries.length === 0) {
      return 0;
    }

    if (history.currentIndex === -1) {
      return Math.max(0, history.entries.length - 1); // Can undo to previous states
    } else {
      return history.currentIndex; // Can undo to earlier states
    }
  }

  /**
   * Get the number of available redo operations
   */
  public getRedoCount(workflowId: string): number {
    const history = this.storage[workflowId];
    if (!history || history.entries.length === 0) {
      return 0;
    }

    if (history.currentIndex === -1) {
      return 0;
    } else {
      return history.entries.length - history.currentIndex - 1;
    }
  }

  /**
   * Clear history for a specific workflow
   */
  public clearWorkflowHistory(workflowId: string): void {
    delete this.storage[workflowId];
    this.saveToSession();
  }

  /**
   * Clear all history
   */
  public clearAllHistory(): void {
    this.storage = {};
    this.saveToSession();
  }

  /**
   * Reload storage from session (useful for testing)
   */
  public reloadFromSession(): void {
    this.storage = this.loadFromSession();
  }

  /**
   * Get debug information about history storage
   */
  public getDebugInfo(): { [workflowId: string]: { entries: number; currentIndex: number; undoCount: number; redoCount: number } } {
    const debug: { [workflowId: string]: { entries: number; currentIndex: number; undoCount: number; redoCount: number } } = {};

    Object.keys(this.storage).forEach(workflowId => {
      const history = this.storage[workflowId];
      debug[workflowId] = {
        entries: history.entries.length,
        currentIndex: history.currentIndex,
        undoCount: this.getUndoCount(workflowId),
        redoCount: this.getRedoCount(workflowId)
      };
    });

    return debug;
  }
}

// Export singleton instance
export const historyService = HistoryService.getInstance();
