// ABOUTME: This file provides a custom React hook for handling global keyboard shortcuts
// with cross-platform support for undo/redo operations.

import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const useKeyboardShortcuts = ({ onUndo, onRedo, canUndo, canRedo }: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field or textarea - don't trigger shortcuts there
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      // Detect platform for correct modifier key
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Undo: Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
      if (ctrlOrCmd && event.key === 'z' && !event.shiftKey && canUndo) {
        event.preventDefault();
        onUndo();
        return;
      }

      // Redo: Cmd+Shift+Z (Mac) or Ctrl+Y (Windows/Linux)
      if (canRedo) {
        if (isMac && ctrlOrCmd && event.key === 'z' && event.shiftKey) {
          event.preventDefault();
          onRedo();
          return;
        }
        
        if (!isMac && ctrlOrCmd && event.key === 'y') {
          event.preventDefault();
          onRedo();
          return;
        }
      }
    };

    // Add global event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onUndo, onRedo, canUndo, canRedo]);
};
