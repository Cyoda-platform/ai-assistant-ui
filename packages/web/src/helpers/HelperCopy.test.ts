import { describe, it, expect, beforeEach, vi } from 'vitest';
import HelperCopy from './HelperCopy';

describe('HelperCopy', () => {
  beforeEach(() => {
    // Clear any previous mocks
    vi.clearAllMocks();

    // Clean up any leftover textareas
    document.body.innerHTML = '';
  });

  describe('copy with modern Clipboard API', () => {
    beforeEach(() => {
      // Mock modern Clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        configurable: true,
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      // Mock secure context
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        configurable: true,
        value: true,
      });
    });

    it('should use navigator.clipboard.writeText when available', async () => {
      const text = 'Hello, World!';

      await HelperCopy.copy(text);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    });

    it('should copy simple text', async () => {
      await HelperCopy.copy('simple text');

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('simple text');
    });

    it('should copy empty string', async () => {
      await HelperCopy.copy('');

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
    });

    it('should copy multiline text', async () => {
      const multiline = 'Line 1\nLine 2\nLine 3';

      await HelperCopy.copy(multiline);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(multiline);
    });

    it('should copy text with special characters', async () => {
      const special = 'Hello 世界 🌍 @#$%^&*()';

      await HelperCopy.copy(special);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(special);
    });

    it('should return a Promise', () => {
      const result = HelperCopy.copy('test');

      expect(result).toBeInstanceOf(Promise);
    });

    it('should handle clipboard API errors', async () => {
      const error = new Error('Clipboard write failed');
      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(error);

      await expect(HelperCopy.copy('test')).rejects.toThrow('Clipboard write failed');
    });
  });

  describe('copy with fallback (execCommand)', () => {
    beforeEach(() => {
      // Remove or disable modern Clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      // Mock document.execCommand
      document.execCommand = vi.fn().mockReturnValue(true);
    });

    it('should use fallback when Clipboard API is not available', async () => {
      const text = 'Fallback text';

      await HelperCopy.copy(text);

      // Should have created and removed a textarea
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(document.body.children.length).toBe(0); // Textarea should be removed
    });

    it('should create textarea with correct text', async () => {
      const text = 'Test content';
      document.execCommand = vi.fn((command) => {
        if (command === 'copy') {
          // Check textarea exists and has correct value
          const textarea = document.querySelector('textarea');
          expect(textarea).toBeTruthy();
          expect(textarea?.value).toBe(text);
        }
        return true;
      });

      await HelperCopy.copy(text);
    });

    it('should set textarea styles for invisibility', async () => {
      document.execCommand = vi.fn((command) => {
        if (command === 'copy') {
          const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
          expect(textarea.style.position).toBe('fixed');
          expect(textarea.style.opacity).toBe('0');
        }
        return true;
      });

      await HelperCopy.copy('test');
    });

    it('should select textarea before copying', async () => {
      const selectSpy = vi.fn();
      document.execCommand = vi.fn((command) => {
        if (command === 'copy') {
          const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
          textarea.select = selectSpy;
          textarea.select();
        }
        return true;
      });

      await HelperCopy.copy('test');

      expect(selectSpy).toHaveBeenCalled();
    });

    it('should remove textarea after copying', async () => {
      await HelperCopy.copy('test');

      // Textarea should be removed from DOM
      expect(document.querySelector('textarea')).toBeNull();
      expect(document.body.children.length).toBe(0);
    });

    it('should handle execCommand errors gracefully', async () => {
      document.execCommand = vi.fn(() => {
        throw new Error('execCommand failed');
      });

      // Should not throw error - errors are caught silently
      await expect(HelperCopy.copy('test')).resolves.toBeUndefined();

      // Textarea should still be removed
      expect(document.querySelector('textarea')).toBeNull();
    });

    it('should return a resolved Promise for fallback', async () => {
      const result = await HelperCopy.copy('test');

      expect(result).toBeUndefined();
    });

    it('should handle multiline text in fallback', async () => {
      const multiline = 'Line 1\nLine 2\nLine 3';
      document.execCommand = vi.fn((command) => {
        if (command === 'copy') {
          const textarea = document.querySelector('textarea');
          expect(textarea?.value).toBe(multiline);
        }
        return true;
      });

      await HelperCopy.copy(multiline);
    });

    it('should handle empty string in fallback', async () => {
      document.execCommand = vi.fn((command) => {
        if (command === 'copy') {
          const textarea = document.querySelector('textarea');
          expect(textarea?.value).toBe('');
        }
        return true;
      });

      await HelperCopy.copy('');
    });
  });

  describe('copy with non-secure context', () => {
    beforeEach(() => {
      // Mock Clipboard API exists but non-secure context
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        configurable: true,
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      // Mock non-secure context (HTTP instead of HTTPS)
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        configurable: true,
        value: false,
      });

      // Mock execCommand for fallback
      document.execCommand = vi.fn().mockReturnValue(true);
    });

    it('should use fallback in non-secure context even if Clipboard API exists', async () => {
      await HelperCopy.copy('test');

      // Should NOT use Clipboard API
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();

      // Should use fallback
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      // Setup modern Clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        configurable: true,
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        configurable: true,
        value: true,
      });
    });

    it('should copy very long text', async () => {
      const longText = 'a'.repeat(10000);

      await HelperCopy.copy(longText);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(longText);
    });

    it('should copy text with tabs and newlines', async () => {
      const formatted = '\t\tIndented\n\t\tText\n\nWith blank lines';

      await HelperCopy.copy(formatted);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(formatted);
    });

    it('should copy JSON strings', async () => {
      const json = JSON.stringify({ key: 'value', nested: { data: [1, 2, 3] } }, null, 2);

      await HelperCopy.copy(json);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(json);
    });

    it('should copy HTML strings', async () => {
      const html = '<div class="container"><p>Hello</p></div>';

      await HelperCopy.copy(html);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(html);
    });

    it('should copy text with quotes', async () => {
      const quoted = 'She said "Hello" and he said \'Hi\'';

      await HelperCopy.copy(quoted);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(quoted);
    });
  });
});
