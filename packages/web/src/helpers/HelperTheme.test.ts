import { describe, it, expect } from 'vitest';
import { useDetectTheme } from './HelperTheme';

describe('HelperTheme', () => {
  describe('useDetectTheme', () => {
    it('should always return dark theme', () => {
      const theme = useDetectTheme();
      expect(theme).toBe('dark');
    });

    it('should consistently return dark theme on multiple calls', () => {
      expect(useDetectTheme()).toBe('dark');
      expect(useDetectTheme()).toBe('dark');
      expect(useDetectTheme()).toBe('dark');
    });

    it('should return a string', () => {
      const theme = useDetectTheme();
      expect(typeof theme).toBe('string');
    });
  });
});
