import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderBash } from './bash';

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}));

// Mock markdownActions
vi.mock('./actions', () => ({
  default: vi.fn(),
}));

describe('markdown/bash', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('renderBash', () => {
    it('should return HTML with bash wrapper', () => {
      const result = renderBash('echo "hello"', 'echo "hello"');

      expect(result).toContain('<div class="wrapper wrapper-bash"');
      expect(result).toContain('</div>');
    });

    it('should include unique ID with bash prefix', () => {
      const result = renderBash('test', 'test');

      expect(result).toContain('id="bash-test-uuid-123"');
    });

    it('should include copy button', () => {
      const result = renderBash('test', 'test');

      expect(result).toContain('<a class="copy" href="#">');
      expect(result).toContain('<span>copy</span>');
    });

    it('should include code content in pre/code tags', () => {
      const code = 'ls -la';
      const result = renderBash(code, code);

      expect(result).toContain('<pre><code>');
      expect(result).toContain(code);
      expect(result).toContain('</code></pre>');
    });

    it('should wrap everything in actions div', () => {
      const result = renderBash('test', 'test');

      expect(result).toContain('<div class="actions">');
      expect(result).toMatch(/<div class="actions">[\s\S]*<a class="copy"/);
    });

    it('should schedule markdownActions with setTimeout', async () => {
      const markdownActions = (await import('./actions')).default;
      const code = 'echo "test"';

      // Create the element in DOM
      document.body.innerHTML = renderBash(code, code);

      // Verify setTimeout was scheduled (by advancing timers)
      expect(markdownActions).not.toHaveBeenCalled();

      vi.runAllTimers();

      // markdownActions should be called after timer
      expect(markdownActions).toHaveBeenCalledTimes(1);
    });

    it('should call markdownActions with element and raw text', async () => {
      const markdownActions = (await import('./actions')).default;
      const text = 'echo "hello"';
      const raw = 'echo "hello"';

      document.body.innerHTML = renderBash(text, raw);
      vi.runAllTimers();

      const element = document.getElementById('bash-test-uuid-123');
      expect(markdownActions).toHaveBeenCalledWith(element, raw);
    });

    it('should handle element not found gracefully', async () => {
      const markdownActions = (await import('./actions')).default;

      // Don't add the HTML to DOM
      renderBash('test', 'test');

      vi.runAllTimers();

      // Should not throw error, markdownActions not called
      expect(markdownActions).not.toHaveBeenCalled();
    });

    describe('code content handling', () => {
      it('should handle multiline bash code', () => {
        const code = 'echo "line 1"\necho "line 2"\necho "line 3"';
        const result = renderBash(code, code);

        expect(result).toContain(code);
      });

      it('should handle bash code with special characters', () => {
        const code = 'echo "$HOME" && ls -la | grep "test"';
        const result = renderBash(code, code);

        expect(result).toContain(code);
      });

      it('should handle empty bash code', () => {
        const result = renderBash('', '');

        expect(result).toContain('<pre><code></code></pre>');
      });

      it('should handle bash code with quotes', () => {
        const code = 'echo "hello" && echo \'world\'';
        const result = renderBash(code, code);

        expect(result).toContain(code);
      });

      it('should handle bash scripts with comments', () => {
        const code = '#!/bin/bash\n# This is a comment\necho "test"';
        const result = renderBash(code, code);

        expect(result).toContain(code);
      });
    });

    describe('HTML structure', () => {
      it('should have correct wrapper class structure', () => {
        const result = renderBash('test', 'test');

        expect(result).toMatch(/<div class="wrapper wrapper-bash"/);
      });

      it('should nest actions inside wrapper', () => {
        const result = renderBash('test', 'test');

        // actions div should be inside wrapper div
        expect(result).toMatch(
          /<div class="wrapper wrapper-bash"[\s\S]*<div class="actions">[\s\S]*<\/div>[\s\S]*<\/div>/
        );
      });

      it('should nest pre/code inside wrapper', () => {
        const result = renderBash('test', 'test');

        // pre/code should be inside wrapper div
        expect(result).toMatch(
          /<div class="wrapper wrapper-bash"[\s\S]*<pre><code>[\s\S]*<\/code><\/pre>[\s\S]*<\/div>/
        );
      });

      it('should place actions before pre/code', () => {
        const result = renderBash('test', 'test');

        const actionsIndex = result.indexOf('<div class="actions">');
        const preIndex = result.indexOf('<pre>');

        expect(actionsIndex).toBeLessThan(preIndex);
      });
    });

    describe('integration scenarios', () => {
      it('should handle common bash commands', () => {
        const commands = [
          'ls -la',
          'cd /home/user',
          'npm install',
          'git commit -m "message"',
          'docker ps',
        ];

        commands.forEach((cmd) => {
          const result = renderBash(cmd, cmd);
          expect(result).toContain(cmd);
        });
      });

      it('should handle bash pipelines', () => {
        const code = 'cat file.txt | grep "pattern" | sort | uniq';
        const result = renderBash(code, code);

        expect(result).toContain(code);
      });

      it('should handle bash with redirections', () => {
        const code = 'echo "test" > output.txt 2>&1';
        const result = renderBash(code, code);

        expect(result).toContain(code);
      });

      it('should handle bash with variables', () => {
        const code = 'VAR="value"\necho $VAR';
        const result = renderBash(code, code);

        expect(result).toContain(code);
      });
    });

    describe('edge cases', () => {
      it('should handle very long bash code', () => {
        const longCode = 'echo "test"\n'.repeat(1000);
        const result = renderBash(longCode, longCode);

        expect(result).toContain(longCode);
      });

      it('should handle bash with HTML-like content', () => {
        const code = 'echo "<div>test</div>"';
        const result = renderBash(code, code);

        expect(result).toContain(code);
      });

      it('should differentiate text from raw', async () => {
        const text = 'echo "hello"';
        const raw = 'echo "hello world"';

        const result = renderBash(text, raw);

        // HTML should contain text
        expect(result).toContain(text);

        // markdownActions receives text parameter (not raw)
        document.body.innerHTML = result;
        vi.runAllTimers();

        const markdownActions = (await import('./actions')).default;
        expect(markdownActions).toHaveBeenCalledWith(
          expect.anything(),
          text
        );
      });
    });
  });
});
