import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import MermaidDiagram from '../MermaidDiagram/MermaidDiagram';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, className = '' }) => {
  // Component for code block with copy button
  const CodeBlock: React.FC<{ language: string; code: string; className?: string; children?: React.ReactNode }> = ({ language, code, className: codeClassName, children: codeChildren }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    return (
      <div className="relative group my-2">
        <div className="flex items-center justify-between bg-slate-800/50 border border-slate-600 border-b-0 rounded-t-md px-3 py-1.5">
          <span className="text-xs text-slate-400 font-mono">{language}</span>
          <button
            onClick={handleCopy}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          </button>
        </div>
        <pre className="bg-slate-900/50 border border-slate-600 rounded-b-md p-3 overflow-x-auto mt-0">
          <code className={codeClassName}>
            {codeChildren}
          </code>
        </pre>
      </div>
    );
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom code block renderer to handle Mermaid diagrams
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeContent = String(children).replace(/\n$/, '');

            // Handle Mermaid diagrams
            if (language === 'mermaid' && !inline) {
              return (
                <div className="my-3">
                  <MermaidDiagram chart={codeContent} />
                </div>
              );
            }

            // Handle other code blocks with copy button
            if (!inline && match) {
              return (
                <CodeBlock
                  language={language}
                  code={codeContent}
                  className={className}
                >
                  {children}
                </CodeBlock>
              );
            }

            // Inline code
            return (
              <code className="bg-slate-800/60 px-1.5 py-0.5 rounded text-sm text-teal-300 font-mono" {...props}>
                {children}
              </code>
            );
          },

          // Custom blockquote styling
          blockquote({ children }) {
            return (
              <blockquote className="border-l-3 border-teal-400 bg-teal-500/5 pl-3 py-1 my-2 italic text-slate-300">
                {children}
              </blockquote>
            );
          },

          // Custom table styling
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3">
                <table className="min-w-full border border-slate-600 rounded-md overflow-hidden text-sm">
                  {children}
                </table>
              </div>
            );
          },

          thead({ children }) {
            return (
              <thead className="bg-slate-800/50">
                {children}
              </thead>
            );
          },

          th({ children }) {
            return (
              <th className="px-3 py-1.5 text-left font-semibold text-slate-200 border-b border-slate-600">
                {children}
              </th>
            );
          },

          td({ children }) {
            return (
              <td className="px-3 py-1.5 text-slate-300 border-b border-slate-700">
                {children}
              </td>
            );
          },

          // Custom link styling
          a({ href, children }) {
            return (
              <a
                href={href}
                className="text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },

          // Custom heading styling
          h1({ children }) {
            return (
              <h1 className="text-xl font-bold text-white mb-2 mt-3 first:mt-0">
                {children}
              </h1>
            );
          },

          h2({ children }) {
            return (
              <h2 className="text-lg font-bold text-white mb-2 mt-3">
                {children}
              </h2>
            );
          },

          h3({ children }) {
            return (
              <h3 className="text-base font-semibold text-white mb-1.5 mt-2.5">
                {children}
              </h3>
            );
          },

          h4({ children }) {
            return (
              <h4 className="text-base font-semibold text-white mb-1.5 mt-2">
                {children}
              </h4>
            );
          },

          h5({ children }) {
            return (
              <h5 className="text-sm font-semibold text-white mb-1 mt-2">
                {children}
              </h5>
            );
          },

          h6({ children }) {
            return (
              <h6 className="text-sm font-semibold text-slate-200 mb-1 mt-2">
                {children}
              </h6>
            );
          },

          // Custom list styling
          ul({ children }) {
            return (
              <ul className="list-disc ml-4 space-y-0.5 my-2 text-slate-300 text-base">
                {children}
              </ul>
            );
          },

          ol({ children }) {
            return (
              <ol className="list-decimal ml-4 space-y-0.5 my-2 text-slate-300 text-base">
                {children}
              </ol>
            );
          },

          li({ children }) {
            return (
              <li className="text-slate-300 text-base leading-relaxed">
                {children}
              </li>
            );
          },

          // Custom paragraph styling
          p({ children }) {
            return (
              <p className="text-slate-300 text-base leading-relaxed my-2 first:mt-0 last:mb-0">
                {children}
              </p>
            );
          },

          // Custom horizontal rule
          hr() {
            return (
              <hr className="border-slate-600 my-3" />
            );
          },

          // Custom emphasis styling
          em({ children }) {
            return (
              <em className="text-slate-200 italic">
                {children}
              </em>
            );
          },

          strong({ children }) {
            return (
              <strong className="text-white font-semibold">
                {children}
              </strong>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
