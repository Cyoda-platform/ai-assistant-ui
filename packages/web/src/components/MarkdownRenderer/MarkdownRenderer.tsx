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
      <div className="relative group my-4">
        <div className="flex items-center justify-between bg-slate-800/50 border border-slate-600 border-b-0 rounded-t-lg px-4 py-2">
          <span className="text-xs text-slate-400 font-mono">{language}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
        <pre className="bg-slate-900/50 border border-slate-600 rounded-b-lg p-4 overflow-x-auto mt-0">
          <code className={codeClassName}>
            {codeChildren}
          </code>
        </pre>
      </div>
    );
  };

  return (
    <div className={`prose prose-invert prose-base max-w-none ${className}`}>
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
                <div className="my-6">
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
              <code className="bg-slate-900/50 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },

          // Custom blockquote styling
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-teal-400 bg-teal-500/5 pl-4 py-2 my-4 italic">
                {children}
              </blockquote>
            );
          },

          // Custom table styling
          table({ children }) {
            return (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full border border-slate-600 rounded-lg overflow-hidden">
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
              <th className="px-4 py-2 text-left font-semibold text-slate-200 border-b border-slate-600">
                {children}
              </th>
            );
          },

          td({ children }) {
            return (
              <td className="px-4 py-2 text-slate-300 border-b border-slate-700">
                {children}
              </td>
            );
          },

          // Custom link styling
          a({ href, children }) {
            return (
              <a
                href={href}
                className="text-teal-400 hover:text-teal-300 underline transition-colors"
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
              <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0">
                {children}
              </h1>
            );
          },

          h2({ children }) {
            return (
              <h2 className="text-xl font-bold text-white mb-3 mt-5">
                {children}
              </h2>
            );
          },

          h3({ children }) {
            return (
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">
                {children}
              </h3>
            );
          },

          h4({ children }) {
            return (
              <h4 className="text-base font-semibold text-white mb-2 mt-3">
                {children}
              </h4>
            );
          },

          h5({ children }) {
            return (
              <h5 className="text-sm font-semibold text-white mb-2 mt-3">
                {children}
              </h5>
            );
          },

          h6({ children }) {
            return (
              <h6 className="text-xs font-semibold text-white mb-2 mt-3">
                {children}
              </h6>
            );
          },

          // Custom list styling
          ul({ children }) {
            return (
              <ul className="list-disc list-inside space-y-1 my-4 text-slate-300">
                {children}
              </ul>
            );
          },

          ol({ children }) {
            return (
              <ol className="list-decimal list-inside space-y-1 my-4 text-slate-300">
                {children}
              </ol>
            );
          },

          li({ children }) {
            return (
              <li className="text-slate-300">
                {children}
              </li>
            );
          },

          // Custom paragraph styling
          p({ children }) {
            return (
              <p className="text-slate-300 leading-relaxed my-3 first:mt-0 last:mb-0">
                {children}
              </p>
            );
          },

          // Custom horizontal rule
          hr() {
            return (
              <hr className="border-slate-600 my-6" />
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
