import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useResizablePanel } from './useResizablePanel';

describe('useResizablePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('resizing-active');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default width when no localStorage value', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
        })
      );

      expect(result.current.width).toBe(300);
      expect(result.current.isResizing).toBe(false);
    });

    it('should load width from localStorage when available', () => {
      localStorage.setItem('test-panel', '350');

      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
          storageKey: 'test-panel',
        })
      );

      expect(result.current.width).toBe(350);
    });

    it('should use default width when localStorage value is invalid', () => {
      localStorage.setItem('test-panel', 'invalid');

      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
          storageKey: 'test-panel',
        })
      );

      expect(result.current.width).toBe(300);
    });

    it('should use default width when localStorage value is below minWidth', () => {
      localStorage.setItem('test-panel', '100');

      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
          storageKey: 'test-panel',
        })
      );

      expect(result.current.width).toBe(300);
    });

    it('should use default width when localStorage value is above maxWidth', () => {
      localStorage.setItem('test-panel', '600');

      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
          storageKey: 'test-panel',
        })
      );

      expect(result.current.width).toBe(300);
    });
  });

  describe('setWidth', () => {
    it('should update width programmatically', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
        })
      );

      act(() => {
        result.current.setWidth(400);
      });

      expect(result.current.width).toBe(400);
    });

    it('should constrain width to minWidth', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
        })
      );

      act(() => {
        result.current.setWidth(150);
      });

      expect(result.current.width).toBe(200);
    });

    it('should constrain width to maxWidth', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
        })
      );

      act(() => {
        result.current.setWidth(600);
      });

      expect(result.current.width).toBe(500);
    });

    it('should save width to localStorage when storageKey is provided', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
          storageKey: 'test-panel',
        })
      );

      act(() => {
        result.current.setWidth(350);
      });

      expect(localStorage.getItem('test-panel')).toBe('350');
    });
  });

  describe('mouse interactions', () => {
    it('should start resizing on mouse down', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
        })
      );

      const mouseEvent = new MouseEvent('mousedown', { clientX: 100 }) as any;
      mouseEvent.preventDefault = vi.fn();

      act(() => {
        result.current.handleMouseDown(mouseEvent);
      });

      expect(result.current.isResizing).toBe(true);
      expect(document.body.style.cursor).toBe('col-resize');
      expect(document.body.style.userSelect).toBe('none');
      expect(document.body.classList.contains('resizing-active')).toBe(true);
    });

    it('should resize panel on mouse move (left side)', async () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
          side: 'left',
        })
      );

      // Start resizing
      const mouseDownEvent = new MouseEvent('mousedown', { clientX: 100 }) as any;
      mouseDownEvent.preventDefault = vi.fn();

      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });

      // Move mouse to the right (increase width)
      const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 150 });

      act(() => {
        document.dispatchEvent(mouseMoveEvent);
      });

      await waitFor(() => {
        expect(result.current.width).toBe(350); // 300 + (150 - 100)
      });
    });

    it('should resize panel on mouse move (right side)', async () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
          side: 'right',
        })
      );

      // Start resizing
      const mouseDownEvent = new MouseEvent('mousedown', { clientX: 100 }) as any;
      mouseDownEvent.preventDefault = vi.fn();

      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });

      // Move mouse to the left (increase width for right side)
      const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 50 });

      act(() => {
        document.dispatchEvent(mouseMoveEvent);
      });

      await waitFor(() => {
        expect(result.current.width).toBe(350); // 300 - (50 - 100) = 300 + 50
      });
    });

    it('should stop resizing on mouse up', async () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
        })
      );

      // Start resizing
      const mouseDownEvent = new MouseEvent('mousedown', { clientX: 100 }) as any;
      mouseDownEvent.preventDefault = vi.fn();

      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });

      expect(result.current.isResizing).toBe(true);

      // Stop resizing
      const mouseUpEvent = new MouseEvent('mouseup');

      act(() => {
        document.dispatchEvent(mouseUpEvent);
      });

      await waitFor(() => {
        expect(result.current.isResizing).toBe(false);
        expect(document.body.style.cursor).toBe('');
        expect(document.body.style.userSelect).toBe('');
        expect(document.body.classList.contains('resizing-active')).toBe(false);
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup event listeners on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
        })
      );

      // Start resizing
      const mouseDownEvent = new MouseEvent('mousedown', { clientX: 100 }) as any;
      mouseDownEvent.preventDefault = vi.fn();

      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });

      // Unmount
      unmount();

      // Verify cleanup
      expect(document.body.style.cursor).toBe('');
      expect(document.body.style.userSelect).toBe('');
      expect(document.body.classList.contains('resizing-active')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid mouse movements', async () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
          storageKey: 'test-panel',
        })
      );

      // Start resizing
      const mouseDownEvent = new MouseEvent('mousedown', { clientX: 100 }) as any;
      mouseDownEvent.preventDefault = vi.fn();

      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });

      // Multiple rapid movements
      for (let i = 1; i <= 5; i++) {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 100 + i * 10 });
        act(() => {
          document.dispatchEvent(mouseMoveEvent);
        });
      }

      await waitFor(() => {
        expect(result.current.width).toBe(350); // 300 + 50
        expect(localStorage.getItem('test-panel')).toBe('350');
      });
    });

    it('should not move when mouse moves without being in resize state', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 300,
          minWidth: 200,
          maxWidth: 500,
        })
      );

      const initialWidth = result.current.width;

      // Try to move without starting resize
      const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 200 });
      act(() => {
        document.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.width).toBe(initialWidth);
    });
  });
});
