import { describe, it, expect, vi } from 'vitest';
import HelperMarkdown from './HelperMarkdown';

// Mock the markdown modules
vi.mock('./markdown/mermaid', () => ({
  renderMermaid: vi.fn((text, raw) => `<div class="mermaid">${text}</div>`)
}));

vi.mock('./markdown/plantuml', () => ({
  renderPlantUML: vi.fn((text, raw) => `<div class="plantuml">${text}</div>`)
}));

vi.mock('./markdown/bash', () => ({
  renderBash: vi.fn((text, raw) => `<div class="bash">${text}</div>`)
}));

vi.mock('./markdown/codeHighlight', () => ({
  renderCodeHighlight: vi.fn((text, lang) => `<pre><code class="language-${lang}">${text}</code></pre>`)
}));

describe('HelperMarkdown', () => {
  describe('parseMarkdown', () => {
    it('should parse simple text', () => {
      const result = HelperMarkdown.parseMarkdown('Hello world');

      expect(result).toContain('Hello world');
    });

    it('should parse headings', () => {
      const result = HelperMarkdown.parseMarkdown('# Title\n## Subtitle');

      expect(result).toContain('<h1');
      expect(result).toContain('Title');
      expect(result).toContain('<h2');
      expect(result).toContain('Subtitle');
    });

    it('should parse bold text', () => {
      const result = HelperMarkdown.parseMarkdown('**bold text**');

      expect(result).toContain('<strong>bold text</strong>');
    });

    it('should parse italic text', () => {
      const result = HelperMarkdown.parseMarkdown('*italic text*');

      expect(result).toContain('<em>italic text</em>');
    });

    it('should parse links with target blank', () => {
      const result = HelperMarkdown.parseMarkdown('[Example](https://example.com)');

      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
      expect(result).toContain('>Example</a>');
    });

    it('should parse links with title', () => {
      const result = HelperMarkdown.parseMarkdown('[Example](https://example.com "Title")');

      expect(result).toContain('title="Title"');
    });

    it('should wrap tables in a div', () => {
      const markdown = '| Header1 | Header2 |\n|---------|----------|\n| Cell1   | Cell2   |';
      const result = HelperMarkdown.parseMarkdown(markdown);

      expect(result).toContain('class="markdown-table-wrap"');
      expect(result).toContain('<table>');
      expect(result).toContain('Header1');
    });

    it('should parse lists', () => {
      const result = HelperMarkdown.parseMarkdown('- Item 1\n- Item 2');

      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
    });

    it('should parse numbered lists', () => {
      const result = HelperMarkdown.parseMarkdown('1. First\n2. Second');

      expect(result).toContain('<ol>');
      expect(result).toContain('<li>First</li>');
      expect(result).toContain('<li>Second</li>');
    });

    it('should enable line breaks with breaks option', () => {
      const result = HelperMarkdown.parseMarkdown('Line 1\nLine 2');

      expect(result).toContain('<br>');
    });

    it('should parse blockquotes', () => {
      const result = HelperMarkdown.parseMarkdown('> Quote text');

      expect(result).toContain('<blockquote>');
      expect(result).toContain('Quote text');
    });

    it('should parse horizontal rules', () => {
      const result = HelperMarkdown.parseMarkdown('---');

      expect(result).toContain('<hr');
    });
  });

  describe('code block handling', () => {
    it('should render mermaid diagrams', async () => {
      const { renderMermaid } = await import('./markdown/mermaid');
      const markdown = '```mermaid\ngraph TD\nA-->B\n```';

      const result = HelperMarkdown.parseMarkdown(markdown);

      expect(renderMermaid).toHaveBeenCalled();
      expect(result).toContain('mermaid');
    });

    it('should render plantuml diagrams', async () => {
      const { renderPlantUML } = await import('./markdown/plantuml');
      const markdown = '```plantuml\n@startuml\nA -> B\n@enduml\n```';

      const result = HelperMarkdown.parseMarkdown(markdown);

      expect(renderPlantUML).toHaveBeenCalled();
      expect(result).toContain('plantuml');
    });

    it('should render bash code blocks', async () => {
      const { renderBash } = await import('./markdown/bash');
      const markdown = '```bash\necho "hello"\n```';

      const result = HelperMarkdown.parseMarkdown(markdown);

      expect(renderBash).toHaveBeenCalled();
      expect(result).toContain('bash');
    });

    it('should render shell code blocks', async () => {
      const { renderBash } = await import('./markdown/bash');
      const markdown = '```shell\nls -la\n```';

      const result = HelperMarkdown.parseMarkdown(markdown);

      expect(renderBash).toHaveBeenCalled();
    });

    it('should render markdown code blocks', async () => {
      const { renderBash } = await import('./markdown/bash');
      const markdown = '```markdown\n# Title\n```';

      const result = HelperMarkdown.parseMarkdown(markdown);

      expect(renderBash).toHaveBeenCalled();
    });

    it('should use code highlight for other languages', async () => {
      const { renderCodeHighlight } = await import('./markdown/codeHighlight');
      const markdown = '```javascript\nconst x = 1;\n```';

      const result = HelperMarkdown.parseMarkdown(markdown);

      expect(renderCodeHighlight).toHaveBeenCalledWith(expect.stringContaining('const x = 1'), 'javascript');
      expect(result).toContain('language-javascript');
    });

    it('should render inline code', () => {
      const result = HelperMarkdown.parseMarkdown('This is `inline code` text');

      expect(result).toContain('<code>inline code</code>');
    });
  });

  describe('GitHub Flavored Markdown', () => {
    it('should parse strikethrough', () => {
      const result = HelperMarkdown.parseMarkdown('~~strikethrough~~');

      expect(result).toContain('<del>strikethrough</del>');
    });

    it('should parse task lists', () => {
      const result = HelperMarkdown.parseMarkdown('- [ ] Unchecked\n- [x] Checked');

      expect(result).toContain('type="checkbox"');
      expect(result).toContain('checked=""');
    });
  });
});
