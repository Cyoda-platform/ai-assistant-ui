import React, { useState, useEffect, useRef } from 'react';
import { FileText, Eye, Code2, Send, Loader2, ArrowLeft, Github, Copy, Check, Maximize2, Settings, Upload, Download, FileDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Requirement } from '@/components/AppsCanvas/types/appSchema';
import Editor, { useMonaco } from '@monaco-editor/react';
import { message, Dropdown, Slider } from 'antd';
import { EnhancedRequirementPreview } from './EnhancedRequirementPreview';
import './RequirementEditor.css';

interface RequirementEditorProps {
  appId: string;
  requirementId?: string; // ID of the specific requirement to edit
  requirementData?: Requirement; // Single requirement data
  requirements?: Array<{ content?: string; title?: string; filePath?: string }>; // Legacy: Requirements from GitHub
  appData?: any; // AppRoot data for GitHub URL construction
  onSendToChat?: (message: string) => void;
  onBack?: () => void; // Callback to go back to requirements list
}

export const RequirementEditor: React.FC<RequirementEditorProps> = ({
  appId,
  requirementId,
  requirementData,
  requirements,
  appData,
  onSendToChat,
  onBack
}) => {
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'preview' | 'split' | 'markdown'>('split');
  const [markdownText, setMarkdownText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Editor settings
  const [fontSize, setFontSize] = useState(13);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [fontFamily, setFontFamily] = useState('Consolas');
  const [showSettings, setShowSettings] = useState(false);

  // Editor refs
  const editorRef = useRef<any>(null);
  const splitEditorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const monaco = useMonaco();

  const getGitHubUrl = (req: Requirement) => {
    if (!req.metadata?.filePath || !appData) return null;

    const owner = appData.app?.metadata?.owner || 'Cyoda-platform';
    const repo = appData.app?.metadata?.repository || 'mcp-cyoda-quart-app';
    const branch = appData.app?.metadata?.branch || 'main';
    const filePath = req.metadata.filePath.replace(/^\.\//, '');

    return `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`;
  };

  // Default template for new requirements
  const getDefaultTemplate = (appName: string = 'Application') => `# ${appName} Requirements

## Overview
Application description

## Functional Requirements

### FR-001: [Requirement Title]
**Priority:** High | Medium | Low
**Status:** Draft | In Progress | Completed

**Description:**
[Detailed description of the requirement]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

---

## Non-Functional Requirements

### NFR-001: Performance
- Response time < 200ms
- Support 1000 concurrent users

### NFR-002: Security
- Authentication required
- Data encryption at rest and in transit

---

## Technical Requirements

### Tech Stack
- Frontend: React + TypeScript
- Backend: Node.js
- Database: PostgreSQL

### APIs
- RESTful API endpoints
- GraphQL support

---

## User Stories

### US-001: As a user, I want to...
**Given** [context]
**When** [action]
**Then** [expected result]

---

## Dependencies
- External service A
- Third-party library B

## Constraints
- Budget limitations
- Timeline constraints
- Technical limitations

## Notes
Additional notes and considerations...
`;

  // Update editor settings when they change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: fontSize,
        lineHeight: Math.round(lineHeight * 20),
        fontFamily: fontFamily,
      });
    }
    if (splitEditorRef.current) {
      splitEditorRef.current.updateOptions({
        fontSize: fontSize,
        lineHeight: Math.round(lineHeight * 20),
        fontFamily: fontFamily,
      });
    }
  }, [fontSize, lineHeight, fontFamily]);

  // Load requirement data from props
  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      // Priority 1: Use specific requirement data if provided (from RequirementsList)
      if (requirementData) {
        const reqData: Requirement = {
          id: requirementData.id,
          title: requirementData.title,
          content: requirementData.content || getDefaultTemplate(requirementData.title),
          metadata: requirementData.metadata, // Preserve metadata with filePath and fileName
          priority: requirementData.priority,
          status: requirementData.status,
        };
        setRequirement(reqData);
        setMarkdownText(reqData.content);
        console.log('✅ Loaded specific requirement:', {
          title: requirementData.title,
          hasMetadata: !!requirementData.metadata,
          filePath: requirementData.metadata?.filePath
        });
      }
      // Priority 2: Use requirements from props if available (from GitHub analyze endpoint)
      else if (requirements && requirements.length > 0) {
        const firstReq = requirements[0]; // Use first requirement for now
        const reqData = {
          content: firstReq.content || getDefaultTemplate(),
          app_id: appId,
        };
        setRequirement(reqData);
        setMarkdownText(reqData.content);
        console.log('✅ Loaded requirement from GitHub:', firstReq.filePath);
      } else {
        // No requirements, use default template
        console.log('⚠️ No requirements provided, using default template');
        setMarkdownText(getDefaultTemplate());
      }
    } catch (err: any) {
      console.error('Failed to load requirement:', err);
      setError(err?.message || 'Failed to load requirement');
      setMarkdownText(getDefaultTemplate());
    } finally {
      setLoading(false);
    }
  }, [appId, requirementId, requirementData, requirements]);



  const handleTextChange = (value: string | undefined) => {
    const text = value || '';
    setMarkdownText(text);
    // Calculate word count
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(markdownText);
    setIsCopied(true);
    message.success('Copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const supportedFormats = ['md', 'markdown', 'txt', 'text', 'html', 'htm', 'rtf', 'json', 'xml', 'csv'];

    if (!supportedFormats.includes(extension)) {
      message.error(`Unsupported file format. Supported formats: ${supportedFormats.join(', ')}`);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      let content = e.target?.result as string;

      try {
        // Convert different formats to markdown
        switch (extension) {
          case 'md':
          case 'markdown':
          case 'txt':
          case 'text':
            // Plain text and markdown - use as is
            setMarkdownText(content);
            break;

          case 'html':
          case 'htm':
            // Convert HTML to markdown
            content = await convertHtmlToMarkdown(content);
            setMarkdownText(content);
            break;

          case 'rtf':
            // Strip RTF formatting and extract plain text
            content = stripRtfFormatting(content);
            setMarkdownText(content);
            break;

          case 'json':
            // Pretty print JSON in a code block
            try {
              const jsonObj = JSON.parse(content);
              const formatted = JSON.stringify(jsonObj, null, 2);
              setMarkdownText(`# ${file.name}\n\n\`\`\`json\n${formatted}\n\`\`\``);
            } catch {
              setMarkdownText(`# ${file.name}\n\n\`\`\`\n${content}\n\`\`\``);
            }
            break;

          case 'xml':
            // Display XML in a code block
            setMarkdownText(`# ${file.name}\n\n\`\`\`xml\n${content}\n\`\`\``);
            break;

          case 'csv':
            // Convert CSV to markdown table
            content = convertCsvToMarkdownTable(content);
            setMarkdownText(content);
            break;

          default:
            setMarkdownText(content);
        }

        message.success(`Loaded ${file.name} (${extension.toUpperCase()})`);
      } catch (error) {
        console.error('File conversion error:', error);
        message.warning(`Loaded ${file.name} but conversion may be incomplete`);
        setMarkdownText(content);
      }
    };

    reader.onerror = () => {
      message.error('Failed to read file');
    };

    reader.readAsText(file);

    // Reset input so same file can be uploaded again
    event.target.value = '';
  };

  // Helper function to convert HTML to Markdown
  const convertHtmlToMarkdown = async (html: string): Promise<string> => {
    try {
      // Use Turndown library for HTML to Markdown conversion
      const TurndownService = (await import('turndown')).default;
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
      });
      return turndownService.turndown(html);
    } catch (error) {
      // Fallback: basic HTML stripping
      const temp = document.createElement('div');
      temp.innerHTML = html;
      return temp.textContent || temp.innerText || html;
    }
  };

  // Helper function to strip RTF formatting
  const stripRtfFormatting = (rtf: string): string => {
    // Basic RTF to plain text conversion
    // Remove RTF control words and braces
    let text = rtf.replace(/\\[a-z]{1,32}(-?\d{1,10})?[ ]?/g, '');
    text = text.replace(/[{}]/g, '');
    text = text.replace(/\\\\/g, '\\');
    text = text.replace(/\\'/g, "'");

    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    return text;
  };

  // Helper function to convert CSV to Markdown table
  const convertCsvToMarkdownTable = (csv: string): string => {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return '';

    const rows = lines.map(line => {
      // Simple CSV parsing (handles basic cases)
      const cells = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
      return cells;
    });

    if (rows.length === 0) return '';

    // Create markdown table
    const header = '| ' + rows[0].join(' | ') + ' |';
    const separator = '| ' + rows[0].map(() => '---').join(' | ') + ' |';
    const body = rows.slice(1).map(row => '| ' + row.join(' | ') + ' |').join('\n');

    return `# CSV Data\n\n${header}\n${separator}\n${body}`;
  };

  const handleDownloadMarkdown = () => {
    const fileName = requirement?.title
      ? `${requirement.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
      : 'requirement.md';

    const blob = new Blob([markdownText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success(`Downloaded ${fileName}`);
  };

  const handleDownloadPDF = async () => {
    try {
      message.info('Generating PDF...');

      // Create a temporary div with the rendered content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.padding = '20mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.color = 'black';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.innerHTML = `
        <style>
          h1 { font-size: 24px; margin-top: 20px; margin-bottom: 10px; }
          h2 { font-size: 20px; margin-top: 16px; margin-bottom: 8px; }
          h3 { font-size: 16px; margin-top: 12px; margin-bottom: 6px; }
          p { margin-bottom: 10px; line-height: 1.6; }
          ul, ol { margin-left: 20px; margin-bottom: 10px; }
          li { margin-bottom: 5px; }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
          pre { background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; }
          blockquote { border-left: 4px solid #ddd; padding-left: 12px; color: #666; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
        </style>
      `;

      // Convert markdown to HTML
      const { unified } = await import('unified');
      const { default: remarkParse } = await import('remark-parse');
      const { default: remarkRehype } = await import('remark-rehype');
      const { default: rehypeStringify } = await import('rehype-stringify');

      const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeStringify)
        .process(markdownText);

      const htmlContent = String(file);
      tempDiv.innerHTML += htmlContent;
      document.body.appendChild(tempDiv);

      // Use browser's print functionality
      const fileName = requirement?.title
        ? `${requirement.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
        : 'requirement.pdf';

      // For now, open print dialog (browser native PDF export)
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${requirement?.title || 'Requirement'}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20mm; color: black; }
                h1 { font-size: 24px; margin-top: 20px; margin-bottom: 10px; }
                h2 { font-size: 20px; margin-top: 16px; margin-bottom: 8px; }
                h3 { font-size: 16px; margin-top: 12px; margin-bottom: 6px; }
                p { margin-bottom: 10px; line-height: 1.6; }
                ul, ol { margin-left: 20px; margin-bottom: 10px; }
                li { margin-bottom: 5px; }
                code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
                pre { background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; }
                blockquote { border-left: 4px solid #ddd; padding-left: 12px; color: #666; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f5f5f5; }
                @media print {
                  body { margin: 0; padding: 20mm; }
                }
              </style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }

      document.body.removeChild(tempDiv);
      message.success('PDF export ready - use your browser\'s print dialog to save as PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      message.error('Failed to export PDF. Please try downloading as Markdown instead.');
    }
  };

  const fontFamilies = [
    { label: 'Consolas', value: 'Consolas' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Menlo', value: 'Menlo' },
    { label: 'Monaco', value: 'Monaco' },
    { label: 'Fira Code', value: 'Fira Code' },
    { label: 'JetBrains Mono', value: 'JetBrains Mono' },
  ];

  const handleFontChange = (font: string) => {
    setFontFamily(font);
    message.success(`Font changed to ${font}`);
  };

  const downloadMenu = {
    items: [
      {
        key: 'download-markdown',
        label: (
          <div className="flex items-center gap-2">
            <Download size={14} />
            <span>Download as Markdown</span>
          </div>
        ),
        onClick: handleDownloadMarkdown,
      },
      {
        key: 'download-pdf',
        label: (
          <div className="flex items-center gap-2">
            <FileDown size={14} />
            <span>Download as PDF</span>
          </div>
        ),
        onClick: handleDownloadPDF,
      },
    ],
  };

  const settingsMenu = {
    items: [
      {
        key: 'font-family-group',
        label: 'Font Family',
        type: 'group',
        children: fontFamilies.map(font => ({
          key: `font-${font.value}`,
          label: (
            <div className="flex items-center justify-between w-full">
              <span>{font.label}</span>
              {fontFamily === font.value && <span className="text-orange-400 ml-2">✓</span>}
            </div>
          ),
          onClick: () => handleFontChange(font.value),
        })),
      },
      { type: 'divider' },
      {
        key: 'font-size-label',
        label: `Font Size: ${fontSize}px`,
        disabled: true,
      },
      {
        key: 'font-size-slider',
        label: (
          <div className="px-2 py-2 w-48" onClick={(e) => e.stopPropagation()}>
            <Slider
              min={10}
              max={20}
              value={fontSize}
              onChange={(value) => setFontSize(value as number)}
              marks={{ 10: '10', 15: '15', 20: '20' }}
              tooltip={{ formatter: (value) => `${value}px` }}
            />
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      {
        key: 'line-height-label',
        label: `Line Height: ${lineHeight.toFixed(1)}`,
        disabled: true,
      },
      {
        key: 'line-height-slider',
        label: (
          <div className="px-2 py-2 w-48" onClick={(e) => e.stopPropagation()}>
            <Slider
              min={1}
              max={2.5}
              step={0.1}
              value={lineHeight}
              onChange={(value) => setLineHeight(value as number)}
              marks={{ 1: '1', 1.5: '1.5', 2: '2', 2.5: '2.5' }}
              tooltip={{ formatter: (value) => value.toFixed(1) }}
            />
          </div>
        ),
        disabled: true,
      },
    ],
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 size={64} className="mx-auto mb-4 text-orange-400 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            Loading Requirements...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Compact Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Title and Path */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white truncate">{requirement?.title || 'Requirement'}</h3>

          {requirement && (requirement.metadata?.filePath || getGitHubUrl(requirement)) && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
              {getGitHubUrl(requirement) ? (
                <a
                  href={getGitHubUrl(requirement)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono truncate transition-colors"
                  style={{ color: '#fb923c' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fdba74'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#fb923c'}
                  title="View on GitHub"
                >
                  <Github size={12} className="flex-shrink-0" />
                  <span className="truncate">{requirement.metadata?.filePath}</span>
                </a>
              ) : (
                <div className="flex items-center gap-1 text-gray-500 font-mono truncate">
                  <Github size={12} className="flex-shrink-0" />
                  <span className="truncate">Not saved</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-0.5 bg-slate-800/50 rounded border border-slate-600/50 p-0.5">
            <button
              onClick={() => setViewMode('markdown')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'markdown'
                  ? 'bg-orange-600/30 text-orange-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              title="Edit mode"
            >
              <Code2 size={14} />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'split'
                  ? 'bg-orange-600/30 text-orange-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              title="Split view"
            >
              <FileText size={14} />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'preview'
                  ? 'bg-orange-600/30 text-orange-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              title="Preview mode"
            >
              <Eye size={14} />
            </button>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded bg-slate-700/50 text-gray-400 hover:text-gray-300 border border-slate-600/50 transition-all"
            title="Upload file (supports: .md, .txt, .html, .json, .xml, .csv, .rtf)"
          >
            <Upload size={16} />
          </button>

          <Dropdown menu={downloadMenu} trigger={['click']} overlayClassName="editor-settings-dropdown">
            <button
              className="p-1.5 rounded bg-slate-700/50 text-gray-400 hover:text-gray-300 border border-slate-600/50 transition-all"
              title="Download"
            >
              <Download size={16} />
            </button>
          </Dropdown>

          <Dropdown menu={settingsMenu} trigger={['click']} overlayClassName="editor-settings-dropdown">
            <button
              className="p-1.5 rounded bg-slate-700/50 text-gray-400 hover:text-gray-300 border border-slate-600/50 transition-all"
              title="Editor settings"
            >
              <Settings size={16} />
            </button>
          </Dropdown>

          <button
            onClick={handleCopyToClipboard}
            className="p-1.5 rounded bg-slate-700/50 text-gray-400 hover:text-gray-300 border border-slate-600/50 transition-all"
            title="Copy to clipboard"
          >
            {isCopied ? <Check size={16} className="text-orange-400" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'markdown' ? (
          // Markdown Editor - Always editable
          <div className="h-full">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={markdownText}
              onChange={handleTextChange}
              theme="vs-dark"
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              options={{
                readOnly: false,
                minimap: { enabled: false },
                fontSize: fontSize,
                fontFamily: fontFamily,
                lineHeight: Math.round(lineHeight * 20),
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
                bracketPairColorization: { enabled: true },
                'bracketPairColorization.independentColorPoolPerBracketType': true,
                cursorBlinking: 'blink',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                renderWhitespace: 'selection',
                renderControlCharacters: true,
                guides: {
                  indentation: true,
                  bracketPairs: true,
                },
                fontLigatures: true,
                links: true,
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: false,
                },
                suggest: {
                  showSnippets: true,
                  showKeywords: true,
                },
              }}
            />
          </div>
        ) : viewMode === 'preview' ? (
          // Preview Only Mode
          <div className="h-full overflow-auto bg-slate-900/30 requirement-preview-split">
            <EnhancedRequirementPreview
              markdownText={markdownText}
              requirement={requirement}
            />
          </div>
        ) : (
          // Split View - Editor on left, preview on right
          <div className="h-full flex">
            <div className="w-1/2 border-r border-slate-700/50 requirement-editor-split">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={markdownText}
                onChange={handleTextChange}
                theme="vs-dark"
                onMount={(editor) => {
                  splitEditorRef.current = editor;
                }}
                options={{
                  readOnly: false,
                  minimap: { enabled: false },
                  fontSize: fontSize,
                  fontFamily: fontFamily,
                  lineHeight: Math.round(lineHeight * 20),
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true,
                  bracketPairColorization: { enabled: true },
                  'bracketPairColorization.independentColorPoolPerBracketType': true,
                  cursorBlinking: 'blink',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  renderWhitespace: 'selection',
                  renderControlCharacters: true,
                  guides: {
                    indentation: true,
                    bracketPairs: true,
                  },
                  fontLigatures: true,
                  links: true,
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: false,
                  },
                  suggest: {
                    showSnippets: true,
                    showKeywords: true,
                  },
                }}
              />
            </div>
            <div className="w-1/2 overflow-auto bg-slate-900/30 requirement-preview-split">
              <EnhancedRequirementPreview
                markdownText={markdownText}
                requirement={requirement}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer with Send Button - Fixed at bottom */}
      <div className="border-t border-gray-700 bg-gray-800/50 p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 whitespace-nowrap"
              title="Go back to requirements list"
            >
              <ArrowLeft size={12} />
              <span>Back</span>
            </button>
          )}
        </div>
        {onSendToChat && (
          <button
            onClick={() => onSendToChat(markdownText)}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 text-white whitespace-nowrap"
            style={{ backgroundColor: '#f97316' }}
            title="Send edited requirement to chat"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
          >
            <Send size={12} />
            <span>Send to Chat</span>
          </button>
        )}
      </div>

      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,.text,.html,.htm,.rtf,.json,.xml,.csv"
        onChange={handleUploadFile}
        style={{ display: 'none' }}
      />
    </div>
  );
};

