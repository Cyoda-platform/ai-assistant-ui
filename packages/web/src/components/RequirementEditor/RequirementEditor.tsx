import React, { useState, useEffect } from 'react';
import { FileText, Edit2, Save, X, Eye, Code2, Loader2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Editor from '@monaco-editor/react';
import apiService from '@/services/apiService';

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
  onSendToChat?: (message: string) => void;
}

export const RequirementEditor: React.FC<RequirementEditorProps> = ({ appId, onSendToChat }) => {
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'split' | 'markdown'>('split');
  const [markdownText, setMarkdownText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

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

  // Load requirement data from API
  useEffect(() => {
    const loadRequirement = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getRequirementDetail(appId);
        setRequirement(data);
        setMarkdownText(data.content || getDefaultTemplate());
        setHasChanges(false);
      } catch (err: any) {
        console.error('Failed to load requirement:', err);
        setError(err?.error?.message || 'Failed to load requirement');
        // If requirement doesn't exist, initialize with default template
        setMarkdownText(getDefaultTemplate());
      } finally {
        setLoading(false);
      }
    };

    loadRequirement();
  }, [appId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Call API to save requirement
      const updatedReq = await apiService.saveRequirementDetail(appId, {
        content: markdownText,
        format: 'markdown',
      });

      // Update local state
      setRequirement(updatedReq);
      setMarkdownText(updatedReq.content);
      setEditMode(false);
      setHasChanges(false);

      console.log('✅ Requirement saved successfully:', updatedReq);
    } catch (err: any) {
      console.error('❌ Failed to save requirement:', err);
      setError(err?.error?.message || 'Failed to save requirement');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setMarkdownText(requirement?.content || getDefaultTemplate());
    setEditMode(false);
    setHasChanges(false);
    setError(null);
  };

  const handleTextChange = (value: string | undefined) => {
    setMarkdownText(value || '');
    setHasChanges(true);
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
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <FileText size={24} className="text-orange-400" />
          <div>
            <h2 className="text-xl font-bold text-white">
              Requirements
            </h2>
            <p className="text-sm text-gray-400">Application Requirements Document</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Send to Chat Button */}
          {onSendToChat && (
            <button
              onClick={() => {
                const message = `Here are the requirements:\n\n${markdownText}\n\nPlease review these requirements and help me improve them.`;
                onSendToChat(message);
              }}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-teal-500/25"
              title="Send to chat"
            >
              <Send size={16} />
              <span>Send to Chat</span>
            </button>
          )}

          {/* View Mode Toggle */}
          {!editMode && (
            <>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === 'preview'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <Eye size={16} />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === 'split'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <span>Split</span>
              </button>
              <button
                onClick={() => setViewMode('markdown')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === 'markdown'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <Code2 size={16} />
                <span>Markdown</span>
              </button>
            </>
          )}

          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit2 size={16} />
              <span>Edit</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  hasChanges && !saving
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </>
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
        {editMode || viewMode === 'markdown' ? (
          // Markdown Editor
          <div className="h-full">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={markdownText}
              onChange={handleTextChange}
              theme="vs-dark"
              options={{
                readOnly: !editMode,
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
          // Split View
          <div className="h-full flex">
            <div className="w-1/2 border-r border-gray-700">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={markdownText}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
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

