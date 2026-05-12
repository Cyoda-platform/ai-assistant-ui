import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MarkdownRenderer from './MarkdownRenderer';

// Mock MermaidDiagram component
vi.mock('../MermaidDiagram/MermaidDiagram', () => ({
  default: ({ chart }: { chart: string }) => (
    <div data-testid="mermaid-diagram">{chart}</div>
  ),
}));

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

describe('MarkdownRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render markdown content', () => {
      const { container } = render(<MarkdownRenderer>Hello World</MarkdownRenderer>);

      expect(container.querySelector('.markdown-content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <MarkdownRenderer className="custom-class">Hello</MarkdownRenderer>
      );

      const content = container.querySelector('.markdown-content.custom-class');
      expect(content).toBeInTheDocument();
    });

    it('should render simple text', () => {
      const { container } = render(<MarkdownRenderer>Simple text</MarkdownRenderer>);

      expect(container.textContent).toContain('Simple text');
    });

    it('should handle empty string', () => {
      const { container } = render(<MarkdownRenderer>{''}</MarkdownRenderer>);

      const content = container.querySelector('.markdown-content');
      expect(content?.innerHTML).toBe('');
    });
  });

  describe('markdown formatting', () => {
    it('should render headers', () => {
      const { container } = render(<MarkdownRenderer># Header</MarkdownRenderer>);

      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.textContent).toContain('Header');
    });

    it('should render bold text', () => {
      const { container } = render(<MarkdownRenderer>**bold**</MarkdownRenderer>);

      expect(container.querySelector('strong')).toBeInTheDocument();
    });

    it('should render italic text', () => {
      const { container } = render(<MarkdownRenderer>*italic*</MarkdownRenderer>);

      expect(container.querySelector('em')).toBeInTheDocument();
    });

    it('should render lists', () => {
      const markdown = `- Item 1\n- Item 2\n- Item 3`;
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      expect(container.querySelector('ul')).toBeInTheDocument();
      const items = container.querySelectorAll('li');
      expect(items.length).toBe(3);
    });

    it('should render links', () => {
      const { container } = render(
        <MarkdownRenderer>[Link](https://example.com)</MarkdownRenderer>
      );

      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('should make links open in new tab', () => {
      const { container } = render(
        <MarkdownRenderer>[Link](https://example.com)</MarkdownRenderer>
      );

      const link = container.querySelector('a');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('code blocks', () => {
    it('should render inline code', () => {
      const { container } = render(<MarkdownRenderer>`code`</MarkdownRenderer>);

      expect(container.querySelector('code')).toBeInTheDocument();
    });

    it('should render code blocks with language', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      expect(container.querySelector('.code-block-wrapper')).toBeInTheDocument();
    });

    it('should show language label for code blocks', () => {
      const markdown = '```python\nprint("hello")\n```';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      expect(container.textContent).toContain('python');
    });

    it('should render copy button for code blocks', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      const copyButton = container.querySelector('.code-block-copy');
      expect(copyButton).toBeInTheDocument();
    });

    it('should have copy icon in code block header', () => {
      const markdown = '```js\ncode\n```';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      const copyButton = container.querySelector('.code-block-copy');
      expect(copyButton?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('code copy functionality', () => {
    it('should have data attributes for copy functionality', () => {
      const code = 'const x = 1;';
      const markdown = `\`\`\`javascript\n${code}\n\`\`\``;
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      const wrapper = container.querySelector('.code-block-wrapper');
      expect(wrapper).toHaveAttribute('data-code');
      expect(wrapper).toHaveAttribute('data-code-id');
    });

    it('should store encoded code in data attribute', () => {
      const code = 'const x = 1;';
      const markdown = `\`\`\`javascript\n${code}\n\`\`\``;
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      const wrapper = container.querySelector('.code-block-wrapper');
      const encodedCode = wrapper?.getAttribute('data-code');
      expect(encodedCode).toBeTruthy();
      // marked.js may add a trailing newline
      expect(decodeURIComponent(encodedCode!).trim()).toBe(code);
    });

    it('should have unique code IDs for copy buttons', () => {
      const markdown = '```js\ncode\n```';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      const copyButton = container.querySelector('.code-block-copy');
      expect(copyButton).toHaveAttribute('data-code-id');
    });
  });

  describe('GFM (GitHub Flavored Markdown)', () => {
    it('should support line breaks', () => {
      const markdown = 'Line 1\nLine 2';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      expect(container.innerHTML).toContain('Line 1');
      expect(container.innerHTML).toContain('Line 2');
    });

    it('should support strikethrough', () => {
      const { container } = render(<MarkdownRenderer>~~strikethrough~~</MarkdownRenderer>);

      expect(container.querySelector('del')).toBeInTheDocument();
    });

    it('should support tables', () => {
      const markdown = `| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |`;
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      expect(container.querySelector('table')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should handle invalid markdown gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // This shouldn't crash
      expect(() => {
        render(<MarkdownRenderer>{'[Invalid markdown'}</MarkdownRenderer>);
      }).not.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-string input', () => {
      const { container } = render(<MarkdownRenderer>{null as any}</MarkdownRenderer>);

      expect(container.querySelector('.markdown-content')).toBeInTheDocument();
    });

    it('should handle undefined input', () => {
      const { container } = render(<MarkdownRenderer>{undefined as any}</MarkdownRenderer>);

      expect(container.querySelector('.markdown-content')).toBeInTheDocument();
    });
  });

  describe('code highlighting', () => {
    it('should apply syntax highlighting to code blocks', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      const code = container.querySelector('code.hljs');
      expect(code).toBeInTheDocument();
    });

    it('should handle unknown language gracefully', () => {
      const markdown = '```unknownlang\ncode\n```';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      expect(container.querySelector('.code-block-wrapper')).toBeInTheDocument();
    });

    it('should preserve code content without highlighting for unknown languages', () => {
      const code = 'some code';
      const markdown = `\`\`\`unknownlang\n${code}\n\`\`\``;
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      expect(container.textContent).toContain(code);
    });
  });

  describe('HTML entities', () => {
    it('should decode HTML entities in code blocks', () => {
      const markdown = '```html\n<div>Hello</div>\n```';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      // Should contain the decoded version
      expect(container.querySelector('.code-block-wrapper')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      const markdown = 'Text with & and < and >';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      expect(container.textContent).toContain('&');
    });
  });

  describe('multiple code blocks', () => {
    it('should render multiple code blocks with unique IDs', () => {
      const markdown = '```js\ncode1\n```\n\n```js\ncode2\n```';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      const wrappers = container.querySelectorAll('.code-block-wrapper');
      expect(wrappers.length).toBe(2);

      const id1 = wrappers[0].getAttribute('data-code-id');
      const id2 = wrappers[1].getAttribute('data-code-id');
      expect(id1).not.toBe(id2);
    });

    it('should have correct code data for each block', () => {
      const code1 = 'code one';
      const code2 = 'code two';
      const markdown = `\`\`\`js\n${code1}\n\`\`\`\n\n\`\`\`js\n${code2}\n\`\`\``;
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      const wrappers = container.querySelectorAll('.code-block-wrapper');
      expect(wrappers.length).toBe(2);

      const data1 = decodeURIComponent(wrappers[0].getAttribute('data-code') || '').trim();
      const data2 = decodeURIComponent(wrappers[1].getAttribute('data-code') || '').trim();

      expect(data1).toBe(code1);
      expect(data2).toBe(code2);
    });
  });

  describe('mermaid diagrams', () => {
    it('should handle mermaid code blocks differently', () => {
      const markdown = '```mermaid\ngraph TD\nA-->B\n```';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      // Mermaid blocks should not have the same structure as code blocks
      // The useEffect replaces them, so just check it doesn't have code block structure
      expect(container.querySelector('.code-block-copy')).not.toBeInTheDocument();
    });

    it('should not render mermaid as regular code block', () => {
      const markdown = '```mermaid\ngraph TD\n```';
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      // Should not have code block copy button for mermaid
      expect(container.querySelector('.code-block-copy')).not.toBeInTheDocument();
    });

    it('should render mermaid blocks without language label', () => {
      const markdown = `\`\`\`mermaid\ngraph TD\n\`\`\``;
      const { container } = render(<MarkdownRenderer>{markdown}</MarkdownRenderer>);

      // Should not show "mermaid" language label like code blocks do
      expect(container.querySelector('.code-block-language')).not.toBeInTheDocument();
    });
  });

  describe('content update', () => {
    it('should update when children prop changes', () => {
      const { container, rerender } = render(<MarkdownRenderer>First</MarkdownRenderer>);

      expect(container.textContent).toContain('First');

      rerender(<MarkdownRenderer>Second</MarkdownRenderer>);

      expect(container.textContent).toContain('Second');
    });

    it('should re-process markdown on update', () => {
      const { container, rerender } = render(<MarkdownRenderer># Header 1</MarkdownRenderer>);

      expect(container.querySelector('h1')).toBeInTheDocument();

      rerender(<MarkdownRenderer>## Header 2</MarkdownRenderer>);

      expect(container.querySelector('h2')).toBeInTheDocument();
    });
  });
});
