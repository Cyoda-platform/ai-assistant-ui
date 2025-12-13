import React, { useState, useEffect } from 'react';
import { FileText, Eye, Code2, Send, Loader2, ArrowLeft, Github } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Requirement } from '@/components/AppsCanvas/types/appSchema';
import Editor from '@monaco-editor/react';

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
    setMarkdownText(value || '');
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
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header with GitHub Link */}
      {requirement && (requirement.metadata?.filePath || getGitHubUrl(requirement)) && (
        <div className="border-b border-gray-700 bg-gray-800/50 px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            GitHub Path
          </div>
          {getGitHubUrl(requirement) ? (
            <a
              href={getGitHubUrl(requirement)!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-mono break-all"
              title="View on GitHub"
            >
              <Github size={14} />
              {requirement.metadata?.filePath}
            </a>
          ) : (
            <div className="flex items-center gap-2 text-gray-400 text-sm font-mono break-all">
              <Github size={14} />
              {requirement.metadata?.filePath || 'No GitHub path available'}
            </div>
          )}
        </div>
      )}

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
              options={{
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
        ) : viewMode === 'split' ? (
          // Split View - Editor on left, preview on right
          <div className="h-full flex">
            <div className="w-1/2 border-r border-gray-700">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={markdownText}
                onChange={handleTextChange}
                theme="vs-dark"
                options={{
                  readOnly: false,
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
            <div className="w-1/2 overflow-auto bg-gray-900 p-6">
              <div className="prose prose-invert prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdownText}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          // Preview Only
          <div className="h-full overflow-auto bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto prose prose-invert prose-slate prose-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdownText}
              </ReactMarkdown>
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
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 bg-orange-600/80 hover:bg-orange-500/80 border border-orange-500 text-white whitespace-nowrap"
            title="Send edited requirement to chat"
          >
            <Send size={12} />
            <span>Send to Chat</span>
          </button>
        )}
      </div>
    </div>
  );
};

