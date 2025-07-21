import hljs from 'highlight.js';

export function renderCodeHighlight(text: string, lang?: string): string {
  try {
    let highlightedCode: string;

    if (lang && hljs.getLanguage(lang)) {
      const result = hljs.highlight(text, { language: lang });
      highlightedCode = result.value;
    } else {
      const result = hljs.highlightAuto(text);
      highlightedCode = result.value;
      lang = result.language || 'text';
    }

    return `<pre><code class="hljs language-${lang}">${highlightedCode}</code></pre>`;
  } catch (error) {
    console.warn('Code highlighting failed:', error);
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(text)}</code></pre>`;
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export const supportedLanguages = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
  'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala',
  'html', 'css', 'scss', 'sass', 'less',
  'json', 'xml', 'yaml', 'toml', 'ini',
  'sql', 'mongodb', 'redis',
  'bash', 'shell', 'powershell', 'batch',
  'dockerfile', 'nginx', 'apache',
  'markdown', 'latex', 'tex',
  'diff', 'patch',
  'makefile', 'cmake',
  'vim', 'lua', 'perl', 'r', 'matlab',
  'arduino', 'assembly', 'cobol', 'fortran', 'haskell',
  'dart', 'elixir', 'erlang', 'clojure', 'lisp'
];
