import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderCodeHighlight, supportedLanguages } from './codeHighlight';
import hljs from 'highlight.js';

// Mock highlight.js
vi.mock('highlight.js', () => ({
  default: {
    highlight: vi.fn(),
    getLanguage: vi.fn(),
  },
}));

describe('markdown/codeHighlight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderCodeHighlight', () => {
    describe('with supported language', () => {
      it('should highlight code when language is supported', () => {
        const mockHighlightedCode = '<span class="hljs-keyword">const</span> x = 1';
        vi.mocked(hljs.getLanguage).mockReturnValue(true as any);
        vi.mocked(hljs.highlight).mockReturnValue({ value: mockHighlightedCode } as any);

        const result = renderCodeHighlight('const x = 1', 'javascript');

        expect(hljs.getLanguage).toHaveBeenCalledWith('javascript');
        expect(hljs.highlight).toHaveBeenCalledWith('const x = 1', { language: 'javascript' });
        expect(result).toContain('hljs language-javascript');
        expect(result).toContain(mockHighlightedCode);
      });

      it('should wrap highlighted code in pre and code tags', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(true as any);
        vi.mocked(hljs.highlight).mockReturnValue({ value: 'highlighted' } as any);

        const result = renderCodeHighlight('test', 'python');

        expect(result).toMatch(/^<pre><code class="hljs language-python">.*<\/code><\/pre>$/);
      });

      it('should include language class in output', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(true as any);
        vi.mocked(hljs.highlight).mockReturnValue({ value: 'code' } as any);

        const result = renderCodeHighlight('test', 'typescript');

        expect(result).toContain('language-typescript');
      });
    });

    describe('with unsupported language', () => {
      it('should escape HTML when language is not supported', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const result = renderCodeHighlight('<script>alert("xss")</script>', 'unknown');

        expect(result).toContain('&lt;script&gt;');
        expect(result).toContain('&lt;/script&gt;');
        expect(result).not.toContain('<script>');
      });

      it('should use provided language in class even if not supported', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const result = renderCodeHighlight('test', 'customlang');

        expect(result).toContain('language-customlang');
      });

      it('should not call highlight when language is not supported', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        renderCodeHighlight('test', 'unknown');

        expect(hljs.highlight).not.toHaveBeenCalled();
      });
    });

    describe('without language', () => {
      it('should escape HTML when no language provided', () => {
        const result = renderCodeHighlight('<div>test</div>');

        expect(result).toContain('&lt;div&gt;');
        expect(result).toContain('&lt;/div&gt;');
      });

      it('should use "text" as default language class', () => {
        const result = renderCodeHighlight('plain text');

        expect(result).toContain('language-text');
      });

      it('should not call getLanguage when no language provided', () => {
        renderCodeHighlight('test');

        expect(hljs.getLanguage).not.toHaveBeenCalled();
      });
    });

    describe('HTML escaping', () => {
      it('should escape ampersands', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const result = renderCodeHighlight('a & b', 'text');

        expect(result).toContain('a &amp; b');
      });

      it('should escape less than signs', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const result = renderCodeHighlight('a < b', 'text');

        expect(result).toContain('a &lt; b');
      });

      it('should escape greater than signs', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const result = renderCodeHighlight('a > b', 'text');

        expect(result).toContain('a &gt; b');
      });

      it('should escape double quotes', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const result = renderCodeHighlight('say "hello"', 'text');

        expect(result).toContain('&quot;hello&quot;');
      });

      it('should escape single quotes', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const result = renderCodeHighlight("it's working", 'text');

        expect(result).toContain('it&#39;s working');
      });

      it('should escape multiple special characters', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const result = renderCodeHighlight('<tag attr="value" & more=\'test\'>', 'text');

        expect(result).toContain('&lt;tag attr=&quot;value&quot; &amp; more=&#39;test&#39;&gt;');
      });
    });

    describe('error handling', () => {
      it('should fallback to escaped HTML on highlight error', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(true as any);
        vi.mocked(hljs.highlight).mockImplementation(() => {
          throw new Error('Highlight failed');
        });

        const result = renderCodeHighlight('<code>test</code>', 'javascript');

        expect(result).toContain('&lt;code&gt;');
        expect(result).toContain('language-javascript');
      });

      it('should log warning on error', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.mocked(hljs.getLanguage).mockReturnValue(true as any);
        vi.mocked(hljs.highlight).mockImplementation(() => {
          throw new Error('Test error');
        });

        renderCodeHighlight('test', 'javascript');

        expect(consoleWarnSpy).toHaveBeenCalledWith('Code highlighting failed:', expect.any(Error));
        consoleWarnSpy.mockRestore();
      });

      it('should still return valid HTML on error', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(true as any);
        vi.mocked(hljs.highlight).mockImplementation(() => {
          throw new Error('Error');
        });

        const result = renderCodeHighlight('test', 'javascript');

        expect(result).toMatch(/^<pre><code.*>.*<\/code><\/pre>$/);
      });
    });

    describe('real-world examples', () => {
      it('should handle JavaScript code', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(true as any);
        vi.mocked(hljs.highlight).mockReturnValue({
          value: '<span class="hljs-keyword">function</span> test() {}'
        } as any);

        const result = renderCodeHighlight('function test() {}', 'javascript');

        expect(result).toContain('language-javascript');
        expect(result).toContain('hljs-keyword');
      });

      it('should handle Python code', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(true as any);
        vi.mocked(hljs.highlight).mockReturnValue({
          value: '<span class="hljs-keyword">def</span> test():'
        } as any);

        const result = renderCodeHighlight('def test():', 'python');

        expect(result).toContain('language-python');
      });

      it('should handle SQL code', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(true as any);
        vi.mocked(hljs.highlight).mockReturnValue({
          value: '<span class="hljs-keyword">SELECT</span> * FROM users'
        } as any);

        const result = renderCodeHighlight('SELECT * FROM users', 'sql');

        expect(result).toContain('language-sql');
      });

      it('should handle multiline code', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const code = 'line 1\nline 2\nline 3';
        const result = renderCodeHighlight(code, 'text');

        expect(result).toContain('line 1\nline 2\nline 3');
      });

      it('should handle code with special characters', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const code = 'if (x < 10 && y > 5) { return "success"; }';
        const result = renderCodeHighlight(code, 'text');

        expect(result).toContain('&lt;');
        expect(result).toContain('&gt;');
        expect(result).toContain('&amp;');
        expect(result).toContain('&quot;');
      });
    });

    describe('edge cases', () => {
      it('should handle empty string', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const result = renderCodeHighlight('', 'text');

        expect(result).toMatch(/^<pre><code.*><\/code><\/pre>$/);
      });

      it('should handle very long code', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const longCode = 'x'.repeat(10000);
        const result = renderCodeHighlight(longCode, 'text');

        expect(result).toContain(longCode);
      });

      it('should handle code with only special characters', () => {
        vi.mocked(hljs.getLanguage).mockReturnValue(null as any);

        const result = renderCodeHighlight('&<>"\'', 'text');

        expect(result).toContain('&amp;&lt;&gt;&quot;&#39;');
      });

      it('should handle undefined language as no language', () => {
        const result = renderCodeHighlight('test', undefined);

        expect(result).toContain('language-text');
      });
    });
  });

  describe('supportedLanguages', () => {
    it('should be an array', () => {
      expect(Array.isArray(supportedLanguages)).toBe(true);
    });

    it('should contain common languages', () => {
      expect(supportedLanguages).toContain('javascript');
      expect(supportedLanguages).toContain('typescript');
      expect(supportedLanguages).toContain('python');
      expect(supportedLanguages).toContain('java');
    });

    it('should contain web languages', () => {
      expect(supportedLanguages).toContain('html');
      expect(supportedLanguages).toContain('css');
      expect(supportedLanguages).toContain('scss');
    });

    it('should contain config languages', () => {
      expect(supportedLanguages).toContain('json');
      expect(supportedLanguages).toContain('yaml');
      expect(supportedLanguages).toContain('toml');
    });

    it('should contain database languages', () => {
      expect(supportedLanguages).toContain('sql');
      expect(supportedLanguages).toContain('mongodb');
    });

    it('should contain shell languages', () => {
      expect(supportedLanguages).toContain('bash');
      expect(supportedLanguages).toContain('shell');
      expect(supportedLanguages).toContain('powershell');
    });

    it('should have at least 40 languages', () => {
      expect(supportedLanguages.length).toBeGreaterThanOrEqual(40);
    });

    it('should have all unique values', () => {
      const uniqueLanguages = new Set(supportedLanguages);
      expect(uniqueLanguages.size).toBe(supportedLanguages.length);
    });
  });
});
