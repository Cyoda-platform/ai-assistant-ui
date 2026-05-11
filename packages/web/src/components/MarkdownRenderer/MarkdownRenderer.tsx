import React, { useState, useMemo, useEffect } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import './MarkdownRenderer.css';
import MermaidDiagram from '../MermaidDiagram/MermaidDiagram';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, className = '' }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const html = useMemo(() => {
    if (!children || typeof children !== 'string') {
      return '';
    }

    // Configure marked with GFM and breaks
    marked.setOptions({
      gfm: true,
      breaks: true,
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (e) {
            console.error('Highlight error:', e);
          }
        }
        return code;
      },
    });

    try {
      let result = marked(children) as string;

      // Post-process: wrap code blocks with our custom structure
      result = result.replace(
        /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
        (match, lang, code) => {
          if (lang === 'mermaid') {
            return `<div class="mermaid-wrapper" data-mermaid="${encodeURIComponent(code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'))}"></div>`;
          }

          const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
          const decodedCode = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

          return `
            <div class="code-block-wrapper" data-code="${encodeURIComponent(decodedCode)}" data-code-id="${codeId}">
              <div class="code-block-header">
                <span class="code-block-language">${lang}</span>
                <button class="code-block-copy" data-code-id="${codeId}">
                  <span class="copy-icon">📋</span>
                </button>
              </div>
              <pre class="code-block-pre"><code class="hljs language-${lang}">${code}</code></pre>
            </div>
          `;
        }
      );

      // Post-process: make all links open in a new tab
      result = result.replace(
        /<a href="([^"]+)">/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">'
      );

      return result;
    } catch (error) {
      console.error('Markdown parse error:', error);
      return children;
    }
  }, [children]);

  // Handle code copy clicks
  useEffect(() => {
    const handleCopyClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.code-block-copy') as HTMLButtonElement;
      if (button) {
        const codeId = button.dataset.codeId;
        const wrapper = button.closest('.code-block-wrapper') as HTMLElement;
        if (wrapper && codeId) {
          const encodedCode = wrapper.dataset.code;
          if (encodedCode) {
            const code = decodeURIComponent(encodedCode);
            handleCopy(code, codeId);
          }
        }
      }
    };

    document.addEventListener('click', handleCopyClick);
    return () => document.removeEventListener('click', handleCopyClick);
  }, []);

  // Render Mermaid diagrams after HTML is set
  useEffect(() => {
    const mermaidWrappers = document.querySelectorAll('.mermaid-wrapper');
    mermaidWrappers.forEach((wrapper) => {
      const encoded = wrapper.getAttribute('data-mermaid');
      if (encoded) {
        const chart = decodeURIComponent(encoded);
        const container = document.createElement('div');
        container.className = 'my-3';
        wrapper.parentNode?.replaceChild(container, wrapper);

        // Render Mermaid component
        const root = (window as any).__MERMAID_ROOTS__ || ((window as any).__MERMAID_ROOTS__ = new Map());
        if (!root.has(container)) {
          import('react-dom/client').then(({ createRoot }) => {
            const reactRoot = createRoot(container);
            root.set(container, reactRoot);
            reactRoot.render(<MermaidDiagram chart={chart} />);
          });
        }
      }
    });
  }, [html]);

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownRenderer;
