/**
 * Undo/Redo hook for Workflow state management
 * Saves complete workflow state including configuration and layout
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import type { UIWorkflowData } from '../types/workflow';

interface HistoryState {
  workflow: UIWorkflowData;
}

interface UseUndoRedoWorkflowOptions {
  maxHistorySize?: number;
  debounceMs?: number;
  enableKeyboardShortcuts?: boolean;
}

export function useUndoRedoWorkflow(
  currentWorkflow: UIWorkflowData | null,
  onWorkflowRestore: (workflow: UIWorkflowData) => void,
  options: UseUndoRedoWorkflowOptions = {}
) {
  const {
    maxHistorySize = 50,
    debounceMs = 500,
    enableKeyboardShortcuts = true,
  } = options;

  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUndoRedoActionRef = useRef(false);
  const lastSavedStateRef = useRef<string | null>(null);

  // Save current state to history with debounce
  const saveState = useCallback(() => {
    // Don't save if this is an undo/redo action or no workflow
    if (isUndoRedoActionRef.current || !currentWorkflow) {
      return;
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      const currentStateStr = JSON.stringify(currentWorkflow);

      // Skip if state hasn't changed
      if (currentStateStr === lastSavedStateRef.current) {
        return;
      }

      lastSavedStateRef.current = currentStateStr;

      const newState: HistoryState = {
        workflow: JSON.parse(currentStateStr),
      };

      setPast((prevPast) => {
        const newPast = [...prevPast, newState];
        // Limit history size
        if (newPast.length > maxHistorySize) {
          return newPast.slice(-maxHistorySize);
        }
        return newPast;
      });

      // Clear future when new state is saved
      setFuture([]);
    }, debounceMs);
  }, [currentWorkflow, maxHistorySize, debounceMs]);

  // Save state immediately (for drag stop events)
  const saveStateImmediate = useCallback(() => {
    // Don't save if this is an undo/redo action or no workflow
    if (isUndoRedoActionRef.current || !currentWorkflow) {
      return;
    }

    // Clear any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const currentStateStr = JSON.stringify(currentWorkflow);

    // Skip if state hasn't changed
    if (currentStateStr === lastSavedStateRef.current) {
      return;
    }

    lastSavedStateRef.current = currentStateStr;

    const newState: HistoryState = {
      workflow: JSON.parse(currentStateStr),
    };

    setPast((prevPast) => {
      const newPast = [...prevPast, newState];
      // Limit history size
      if (newPast.length > maxHistorySize) {
        return newPast.slice(-maxHistorySize);
      }
      return newPast;
    });

    // Clear future when new state is saved
    setFuture([]);
  }, [currentWorkflow, maxHistorySize]);

  // Undo action
  const undo = useCallback(() => {
    if (past.length === 0 || !currentWorkflow) {
      return;
    }

    // Set flag BEFORE any state changes
    isUndoRedoActionRef.current = true;

    const previousState = past[past.length - 1];
    const newPast = past.slice(0, -1);

    // Save current state to future BEFORE restoring
    const currentState: HistoryState = {
      workflow: JSON.parse(JSON.stringify(currentWorkflow)),
    };

    // Update history stacks
    setPast(newPast);
    setFuture((prevFuture) => [...prevFuture, currentState]);

    // Restore previous state - this will trigger workflow update
    onWorkflowRestore(previousState.workflow);

    // Reset flag after a delay to allow workflow update to complete
    setTimeout(() => {
      isUndoRedoActionRef.current = false;
    }, 150);
  }, [past, currentWorkflow, onWorkflowRestore]);

  // Redo action
  const redo = useCallback(() => {
    if (future.length === 0 || !currentWorkflow) {
      return;
    }

    // Set flag BEFORE any state changes
    isUndoRedoActionRef.current = true;

    const nextState = future[future.length - 1];
    const newFuture = future.slice(0, -1);

    // Save current state to past BEFORE restoring
    const currentState: HistoryState = {
      workflow: JSON.parse(JSON.stringify(currentWorkflow)),
    };

    // Update history stacks
    setFuture(newFuture);
    setPast((prevPast) => [...prevPast, currentState]);

    // Restore next state - this will trigger workflow update
    onWorkflowRestore(nextState.workflow);

    // Reset flag after a delay to allow workflow update to complete
    setTimeout(() => {
      isUndoRedoActionRef.current = false;
    }, 150);
  }, [future, currentWorkflow, onWorkflowRestore]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Undo: Ctrl+Z or Cmd+Z
      if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }

      // Redo: Ctrl+Y or Cmd+Shift+Z
      if (
        (isCtrlOrCmd && event.key === 'y') ||
        (isCtrlOrCmd && event.shiftKey && event.key === 'z')
      ) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, enableKeyboardShortcuts]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    saveState,
    saveStateImmediate,
  };
}
