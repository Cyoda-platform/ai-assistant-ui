import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useTextResponsiveContainer,
  useTextResponsiveStyles,
  getTextResponsiveClassName
} from './useTextResponsiveContainer';

describe('useTextResponsiveContainer', () => {
  describe('compact content', () => {
    it('should return compact variant for short text', () => {
      const { result } = renderHook(() =>
        useTextResponsiveContainer('Short text')
      );

      expect(result.current.sizeVariant).toBe('compact');
      expect(result.current.isCompact).toBe(true);
      expect(result.current.isComfortable).toBe(false);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.estimatedWidth).toBe('min(300px, 90vw)');
    });

    it('should calculate text metrics correctly for compact text', () => {
      const content = 'Hello world';
      const { result } = renderHook(() => useTextResponsiveContainer(content));

      expect(result.current.textLength).toBe(11);
      expect(result.current.wordCount).toBe(2);
      expect(result.current.lineCount).toBe(1);
    });
  });

  describe('medium content', () => {
    it('should return medium variant for medium text', () => {
      const content = 'This is a medium length text that should trigger the medium size variant for the container';
      const { result } = renderHook(() => useTextResponsiveContainer(content));

      expect(result.current.sizeVariant).toBe('');
      expect(result.current.isCompact).toBe(false);
      expect(result.current.isComfortable).toBe(false);
      expect(result.current.isMedium).toBe(true);
      expect(result.current.estimatedWidth).toBe('min(450px, 90vw)');
    });
  });

  describe('comfortable content', () => {
    it('should return comfortable variant for long text', () => {
      const content = 'This is a very long text that should definitely trigger the comfortable size variant for the container. It needs to be at least 200 characters long to meet the comfortable threshold requirement. Let me add some more text to make sure we reach that threshold.';
      const { result } = renderHook(() => useTextResponsiveContainer(content));

      expect(result.current.sizeVariant).toBe('comfortable');
      expect(result.current.isCompact).toBe(false);
      expect(result.current.isComfortable).toBe(true);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.estimatedWidth).toBe('min(600px, 90vw)');
    });

    it('should count lines correctly for multi-line text', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const { result } = renderHook(() => useTextResponsiveContainer(content));

      expect(result.current.lineCount).toBe(3);
    });
  });

  describe('custom options', () => {
    it('should use custom baseClass', () => {
      const { result } = renderHook(() =>
        useTextResponsiveContainer('Test', { baseClass: 'custom-class' })
      );

      expect(result.current.className).toContain('custom-class');
    });

    it('should use custom compactThreshold', () => {
      const content = 'This is 30 characters long';
      const { result } = renderHook(() =>
        useTextResponsiveContainer(content, { compactThreshold: 100 })
      );

      expect(result.current.isCompact).toBe(true);
      expect(result.current.sizeVariant).toBe('compact');
    });

    it('should use custom comfortableThreshold', () => {
      const content = 'This is 30 characters long';
      const { result } = renderHook(() =>
        useTextResponsiveContainer(content, { compactThreshold: 10, comfortableThreshold: 25 })
      );

      expect(result.current.isComfortable).toBe(true);
      expect(result.current.sizeVariant).toBe('comfortable');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const { result } = renderHook(() => useTextResponsiveContainer(''));

      expect(result.current.textLength).toBe(0);
      expect(result.current.wordCount).toBe(1); // split() returns [''] for empty string
      expect(result.current.lineCount).toBe(1);
      expect(result.current.isCompact).toBe(true);
    });

    it('should handle undefined content', () => {
      const { result } = renderHook(() =>
        useTextResponsiveContainer(undefined as any)
      );

      expect(result.current.textLength).toBe(0);
      expect(result.current.isCompact).toBe(true);
    });

    it('should handle content at exact threshold', () => {
      const content = 'a'.repeat(50);
      const { result } = renderHook(() => useTextResponsiveContainer(content));

      expect(result.current.isCompact).toBe(true);
      expect(result.current.isMedium).toBe(false);
    });

    it('should handle content at exact comfortable threshold', () => {
      const content = 'a'.repeat(200);
      const { result } = renderHook(() => useTextResponsiveContainer(content));

      expect(result.current.isComfortable).toBe(true);
      expect(result.current.isMedium).toBe(false);
    });
  });

  describe('className generation', () => {
    it('should generate correct className for compact', () => {
      const { result } = renderHook(() => useTextResponsiveContainer('Short'));

      expect(result.current.className).toBe('text-responsive-container text-responsive-container.compact');
    });

    it('should generate correct className for comfortable', () => {
      const content = 'a'.repeat(250);
      const { result } = renderHook(() => useTextResponsiveContainer(content));

      expect(result.current.className).toBe('text-responsive-container text-responsive-container.comfortable');
    });

    it('should generate correct className for medium', () => {
      const content = 'a'.repeat(100);
      const { result } = renderHook(() => useTextResponsiveContainer(content));

      expect(result.current.className).toBe('text-responsive-container');
    });
  });
});

describe('useTextResponsiveStyles', () => {
  it('should return styles for compact text', () => {
    const { result } = renderHook(() => useTextResponsiveStyles('Short'));

    expect(result.current.maxWidth).toBe('min(300px, 90vw)');
    expect(result.current.width).toBe('fit-content');
    expect(result.current.wordWrap).toBe('break-word');
    expect(result.current.minWidth).toBe('150px');
  });

  it('should return styles for medium text', () => {
    const content = 'a'.repeat(100);
    const { result } = renderHook(() => useTextResponsiveStyles(content));

    expect(result.current.maxWidth).toBe('min(450px, 90vw)');
    expect(result.current.minWidth).toBe('200px');
  });

  it('should return styles for comfortable text', () => {
    const content = 'a'.repeat(250);
    const { result } = renderHook(() => useTextResponsiveStyles(content));

    expect(result.current.maxWidth).toBe('min(600px, 90vw)');
  });

  it('should return styles for very long text', () => {
    const content = 'a'.repeat(400);
    const { result } = renderHook(() => useTextResponsiveStyles(content));

    expect(result.current.maxWidth).toBe('min(750px, 90vw)');
  });

  it('should include break-word properties', () => {
    const { result } = renderHook(() => useTextResponsiveStyles('Test'));

    expect(result.current.wordWrap).toBe('break-word');
    expect(result.current.overflowWrap).toBe('break-word');
    expect(result.current.hyphens).toBe('auto');
  });

  it('should calculate dynamic padding', () => {
    const content = 'Test';
    const { result } = renderHook(() => useTextResponsiveStyles(content));

    expect(result.current.padding).toBeDefined();
    expect(typeof result.current.padding).toBe('string');
  });
});

describe('getTextResponsiveClassName', () => {
  it('should return compact class for short text', () => {
    const className = getTextResponsiveClassName(30);

    expect(className).toBe('text-responsive-container compact');
  });

  it('should return base class for medium text', () => {
    const className = getTextResponsiveClassName(100);

    expect(className).toBe('text-responsive-container');
  });

  it('should return comfortable class for long text', () => {
    const className = getTextResponsiveClassName(250);

    expect(className).toBe('text-responsive-container comfortable');
  });

  it('should use custom base class', () => {
    const className = getTextResponsiveClassName(30, 'custom-base');

    expect(className).toBe('custom-base compact');
  });

  it('should handle exact threshold values', () => {
    expect(getTextResponsiveClassName(50)).toBe('text-responsive-container compact');
    expect(getTextResponsiveClassName(51)).toBe('text-responsive-container');
    expect(getTextResponsiveClassName(200)).toBe('text-responsive-container comfortable');
    expect(getTextResponsiveClassName(199)).toBe('text-responsive-container');
  });

  it('should handle zero length', () => {
    const className = getTextResponsiveClassName(0);

    expect(className).toBe('text-responsive-container compact');
  });
});
