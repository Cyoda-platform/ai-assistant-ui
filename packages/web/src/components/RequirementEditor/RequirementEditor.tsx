import React, { useState, useEffect } from 'react';
import { FileText, Eye, Code2, Send, Loader2, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Requirement } from '@/components/AppsCanvas/types/appSchema';
import Editor from '@monaco-editor/react';

interface Requirement {
  id?: string;
  app_id?: string;
  content: string;
  format?: 'markdown';
  created_at?: string;
  updated_at?: string;
}

interface RequirementEditorProps {
  appId: string;
  requirementId?: string; // ID of the specific requirement to edit
  requirementData?: Requirement; // Single requirement data
  requirements?: Array<{ content?: string; title?: string; filePath?: string }>; // Legacy: Requirements from GitHub
  onSendToChat?: (message: string) => void;
  onBack?: () => void; // Callback to go back to requirements list
}

export const RequirementEditor: React.FC<RequirementEditorProps> = ({
  appId,
  requirementId,
  requirementData,
  requirements,
  onSendToChat,
  onBack
}) => {
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'preview' | 'split' | 'markdown'>('split');
  const [markdownText, setMarkdownText] = useState('');

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
        const reqData = {
          id: requirementData.id,
          content: requirementData.content || getDefaultTemplate(requirementData.title),
          app_id: appId,
        };
        setRequirement(reqData);
        setMarkdownText(reqData.content);
        console.log('✅ Loaded specific requirement:', requirementData.title);
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
    </div>
  );
};

