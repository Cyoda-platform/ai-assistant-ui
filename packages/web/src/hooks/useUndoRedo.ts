/**
 * Simple undo/redo system for workflow editor
 */
import { useState, useMemo, useCallback } from 'react';

export function useUndoRedo(maxHistorySize = 50) {
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const canUndo = useMemo(() => currentIndex > 0, [currentIndex]);
  const canRedo = useMemo(() => currentIndex < history.length - 1, [currentIndex, history.length]);

  const saveState = useCallback((data: string) => {
    if (history.length > 0 && history[currentIndex] === data) {
      return;
    }

    setHistory(prevHistory => {
      let newHistory = [...prevHistory];
      
      if (currentIndex < newHistory.length - 1) {
        newHistory = newHistory.slice(0, currentIndex + 1);
      }

      newHistory.push(data);

      if (newHistory.length > maxHistorySize) {
        newHistory = newHistory.slice(-maxHistorySize);
      }

      return newHistory;
    });

    setCurrentIndex(prevIndex => {
      const newHistoryLength = Math.min(
        currentIndex < history.length - 1 ? currentIndex + 2 : history.length + 1,
        maxHistorySize
      );
      return newHistoryLength - 1;
    });
  }, [history, currentIndex, maxHistorySize]);

  const undo = useCallback((): string | null => {
    if (!canUndo) return null;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [canUndo, currentIndex, history]);

  const redo = useCallback((): string | null => {
    if (!canRedo) return null;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [canRedo, currentIndex, history]);

  const initialize = useCallback((initialData: string) => {
    setHistory([initialData]);
    setCurrentIndex(0);
  }, []);

  return {
    history,
    currentIndex,
    canUndo,
    canRedo,
    saveState,
    undo,
    redo,
    initialize
  };
}
