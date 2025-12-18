import React, { useState, useEffect, useRef } from 'react';
import { FileText, Eye, Code2, Send, Loader2, ArrowLeft, Github, Copy, Check, Maximize2, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Requirement } from '@/components/AppsCanvas/types/appSchema';
import Editor, { useMonaco } from '@monaco-editor/react';
import { message, Dropdown, Slider } from 'antd';
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
              {fontFamily === font.value && <span className="text-blue-400 ml-2">✓</span>}
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
          <Loader2 size={64} className="mx-auto mb-4 text-blue-400 animate-spin" />
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
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-mono truncate transition-colors"
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
          <button
            onClick={() => setViewMode(viewMode === 'markdown' ? 'split' : 'markdown')}
            className={`p-1.5 rounded transition-all ${
              viewMode === 'markdown'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-700/50 text-gray-400 hover:text-gray-300 border border-slate-600/50'
            }`}
            title={viewMode === 'markdown' ? 'Switch to split view' : 'Switch to edit mode'}
          >
            {viewMode === 'markdown' ? <Code2 size={16} /> : <Eye size={16} />}
          </button>

          <Dropdown menu={settingsMenu} trigger={['click']}>
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
            {isCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>

          {onSendToChat && (
            <button
              onClick={() => onSendToChat(markdownText)}
              className="p-1.5 rounded bg-orange-600/20 text-orange-400 hover:text-orange-300 border border-orange-500/30 transition-all"
              title="Send to chat"
            >
              <Send size={16} />
            </button>
          )}

          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded bg-slate-700/50 text-gray-400 hover:text-gray-300 border border-slate-600/50 transition-all"
              title="Go back"
            >
              <ArrowLeft size={16} />
            </button>
          )}
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
            <div className="w-1/2 overflow-auto bg-slate-900/30 p-6 requirement-preview-split">
              <div className="prose prose-invert prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdownText}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

