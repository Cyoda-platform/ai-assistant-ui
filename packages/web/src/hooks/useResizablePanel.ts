import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizablePanelOptions {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  storageKey?: string;
  side?: 'left' | 'right'; // Which side of the screen the panel is on
}

interface UseResizablePanelReturn {
  width: number;
  isResizing: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  setWidth: (width: number) => void;
}

export const useResizablePanel = ({
  defaultWidth,
  minWidth,
  maxWidth,
  storageKey,
  side = 'left' // Default to left side for backward compatibility
}: UseResizablePanelOptions): UseResizablePanelReturn => {
  // Load initial width from localStorage if available
  const getInitialWidth = () => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedWidth = parseInt(stored, 10);
        if (!isNaN(parsedWidth) && parsedWidth >= minWidth && parsedWidth <= maxWidth) {
          return parsedWidth;
        }
      }
    }
    return defaultWidth;
  };

  const [width, setWidthState] = useState(getInitialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Save width to localStorage when it changes
  const setWidth = useCallback((newWidth: number) => {
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setWidthState(constrainedWidth);

    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, constrainedWidth.toString());
    }
  }, [minWidth, maxWidth, storageKey]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startX.current;
    // For left-side panels, dragging right (positive deltaX) increases width
    // For right-side panels, dragging left (negative deltaX) increases width, so we negate
    const newWidth = side === 'left'
      ? startWidth.current + deltaX
      : startWidth.current - deltaX;
    setWidth(newWidth);
  }, [isResizing, setWidth, side]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('resizing-active');
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing-active');
  }, [width]);

  // Add and remove event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('resizing-active');
    };
  }, []);

  return {
    width,
    isResizing,
    handleMouseDown,
    setWidth
  };
};
