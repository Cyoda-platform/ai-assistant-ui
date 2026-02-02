import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreakpoints } from './HelperBreakpoints';

describe('HelperBreakpoints', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    // Set default window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
  });

  describe('breakpoint detection', () => {
    it('should detect xs breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 400 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.xs).toBe(true);
      expect(result.current.sm).toBe(false);
      expect(result.current.md).toBe(false);
      expect(result.current.lg).toBe(false);
      expect(result.current.xl).toBe(false);
    });

    it('should detect sm breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 800 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.xs).toBe(false);
      expect(result.current.sm).toBe(true);
      expect(result.current.md).toBe(false);
      expect(result.current.lg).toBe(false);
      expect(result.current.xl).toBe(false);
    });

    it('should detect md breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1000 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.xs).toBe(false);
      expect(result.current.sm).toBe(false);
      expect(result.current.md).toBe(true);
      expect(result.current.lg).toBe(false);
      expect(result.current.xl).toBe(false);
    });

    it('should detect lg breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1500 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.xs).toBe(false);
      expect(result.current.sm).toBe(false);
      expect(result.current.md).toBe(false);
      expect(result.current.lg).toBe(true);
      expect(result.current.xl).toBe(false);
    });

    it('should detect xl breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 2000 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.xs).toBe(false);
      expect(result.current.sm).toBe(false);
      expect(result.current.md).toBe(false);
      expect(result.current.lg).toBe(false);
      expect(result.current.xl).toBe(true);
    });
  });

  describe('boundary values', () => {
    it('should handle exact sm breakpoint (768)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.sm).toBe(true);
      expect(result.current.xs).toBe(false);
    });

    it('should handle exact md breakpoint (992)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 992 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.md).toBe(true);
      expect(result.current.sm).toBe(false);
    });

    it('should handle exact lg breakpoint (1200)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1200 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.lg).toBe(true);
      expect(result.current.md).toBe(false);
    });

    it('should handle exact xl breakpoint (1920)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1920 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.xl).toBe(true);
      expect(result.current.lg).toBe(false);
    });
  });

  describe('isSmaller helper', () => {
    it('should return true when width is smaller than breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 500 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.isSmaller('md')).toBe(true);
      expect(result.current.isSmaller('lg')).toBe(true);
    });

    it('should return false when width is greater than or equal to breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1000 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.isSmaller('md')).toBe(false);
      expect(result.current.isSmaller('xs')).toBe(false);
    });
  });

  describe('isGreater helper', () => {
    it('should return true when width is greater than or equal to breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1000 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.isGreater('sm')).toBe(true);
      expect(result.current.isGreater('md')).toBe(true);
    });

    it('should return false when width is smaller than breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 500 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.isGreater('lg')).toBe(false);
      expect(result.current.isGreater('xl')).toBe(false);
    });
  });

  describe('current width', () => {
    it('should return current window width', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1234 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.current).toBe(1234);
    });
  });

  describe('breakpoints object', () => {
    it('should expose breakpoints object', () => {
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.breakpoints).toEqual({
        xs: 480,
        sm: 768,
        md: 992,
        lg: 1200,
        xl: 1920
      });
    });
  });

  describe('window resize', () => {
    it('should update breakpoints on window resize', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 400 });
      const { result } = renderHook(() => useBreakpoints());

      expect(result.current.xs).toBe(true);

      act(() => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 1500 });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.lg).toBe(true);
      expect(result.current.xs).toBe(false);
    });

    it('should cleanup resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useBreakpoints());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });
});
