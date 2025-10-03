import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  Settings,
  Activity,
  Grid3X3,
  Search,
  Zap,
  Send,
  PaperclipIcon,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Plus,
  Lock,
  Unlock,
  Eye,
  FileText,
  Columns2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import ChatBotEditorWorkflowSimple from './ChatBotEditorWorkflowSimple';
import ChatBotEditorWorkflowNew from './ChatBotEditorWorkflowNew';
import MermaidDiagram from '../MermaidDiagram/MermaidDiagram';
import { WorkflowTabs } from '@/components/WorkflowTabs/WorkflowTabs';
import { useWorkflowTabsStore } from '@/stores/workflowTabs';
import { Modal, Form, Input, InputNumber } from 'antd';
import SettingsDialog from '@/components/SettingsDialog/SettingsDialog';

interface ChatBotCanvasProps {
  messages: any[];
  isLoading: boolean;
  technicalId: string;
  onAnswer: (data: { answer: string; files?: File[] }) => void;
  onApproveQuestion: (data: any) => void;
  onUpdateNotification: (data: any) => void;
  onToggleCanvas: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

type MarkdownMode = 'preview' | 'split' | 'edit';

const ChatBotCanvas: React.FC<ChatBotCanvasProps> = ({
  messages,
  isLoading,
  technicalId,
  onAnswer,
  onApproveQuestion,
  onUpdateNotification,
  onToggleCanvas,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'markdown'>('workflow');
  const [markdownContent, setMarkdownContent] = useState(`# Welcome to Canvas Markdown Editor

This editor supports **GitHub Flavored Markdown** with real-time preview and Mermaid diagrams!

## Example Workflow Diagram

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
\`\`\`

## Features

- ✅ **Real-time preview** in split mode
- ✅ **Mermaid diagrams** for flowcharts, sequence diagrams, and more
- ✅ **Syntax highlighting** for code blocks
- ✅ **Three viewing modes**: Edit, Split, Preview
- ✅ **Fullscreen support** (Ctrl+Shift+F)

## Code Example

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
};
\`\`\`

## More Mermaid Examples

### Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant User
    participant App
    participant API
    User->>App: Click button
    App->>API: Send request
    API-->>App: Return data
    App-->>User: Display result
\`\`\`

### Gantt Chart

\`\`\`mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements    :a1, 2024-01-01, 7d
    Design         :a2, after a1, 5d
    section Development
    Implementation :a3, after a2, 14d
    Testing       :a4, after a3, 7d
\`\`\`

> **Tip**: Switch between Edit, Split, and Preview modes using the buttons in the header!
`);
  const [workflowData, setWorkflowData] = useState('');
  const [markdownMode, setMarkdownMode] = useState<MarkdownMode>('split');
  const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Workflow tabs state
  const { tabs, activeTabId, openTab, updateTab, getActiveTab } = useWorkflowTabsStore();
  const activeWorkflowTab = getActiveTab();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((content: string, files?: File[]) => {
    onAnswer({ answer: content, files });
  }, [onAnswer]);

  const handleMarkdownSubmit = useCallback(() => {
    if (markdownContent.trim()) {
      handleSubmit(markdownContent, attachedFiles);
      setAttachedFiles([]); // Clear files after submit
    }
  }, [markdownContent, attachedFiles, handleSubmit]);

  const handleFileAttach = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setAttachedFiles(Array.from(files));
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleWorkflowSubmit = useCallback(() => {
    if (workflowData.trim()) {
      handleSubmit(workflowData);
    }
  }, [workflowData, handleSubmit]);

  // Workflow tabs handlers - create new tab directly without modal
  const handleNewWorkflowTab = useCallback(() => {
    // Generate a unique counter for new tabs
    const newTabCounter = tabs.filter(t => t.modelName.startsWith('new-workflow')).length + 1;
    const modelName = `new-workflow-${newTabCounter}`;
    const modelVersion = 1;
    const workflowTechnicalId = `${modelName}_v${modelVersion}_${Date.now()}`;

    openTab({
      modelName,
      modelVersion,
      displayName: `${modelName}.${modelVersion}`,
      isDirty: false,
      technicalId: workflowTechnicalId,
    });
  }, [openTab, tabs]);

  const handleWorkflowUpdate = useCallback((tabId: string, data: { canvasData: string; workflowMetaData: any }) => {
    // Mark tab as dirty when workflow is updated
    updateTab(tabId, { isDirty: true });
    setWorkflowData(data.canvasData);
  }, [updateTab]);

  const getMarkdownModeIcon = (mode: MarkdownMode) => {
    switch (mode) {
      case 'preview':
        return <Eye size={14} />;
      case 'split':
        return <Columns2 size={14} />;
      case 'edit':
        return <FileText size={14} />;
    }
  };

  const getMarkdownModeLabel = (mode: MarkdownMode) => {
    switch (mode) {
      case 'preview':
        return 'Preview';
      case 'split':
        return 'Split';
      case 'edit':
        return 'Edit';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/95 backdrop-blur-sm">
      {/* Canvas Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center space-x-2">
          <Activity size={18} className="text-teal-400" />
          <h3 className="font-semibold text-white translate-y-[20%]">Canvas</h3>
          <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full">Active</span>
        </div>
        <div className="flex items-center space-x-2">
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen (Ctrl+Shift+F)"}
            >
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
          )}
          <button
            onClick={onToggleCanvas}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Close Canvas"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Tabs - Hidden for now, only showing Workflow */}
      {/* <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/30">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'workflow'
                ? 'bg-teal-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Activity size={14} />
            <span>Workflow</span>
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'markdown'
                ? 'bg-teal-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Grid3X3 size={14} />
            <span>Markdown</span>
          </button>
        </div>

        {/* Markdown Mode Selector - Only show when markdown tab is active */}
        {/* {activeTab === 'markdown' && (
          <div className="flex items-center space-x-1">
            {(['edit', 'split', 'preview'] as MarkdownMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setMarkdownMode(mode)}
                className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                  markdownMode === mode
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title={getMarkdownModeLabel(mode)}
              >
                {getMarkdownModeIcon(mode)}
                <span className="hidden sm:inline">{getMarkdownModeLabel(mode)}</span>
              </button>
            ))}
          </div>
        )} */}
      {/* </div> */}

      {/* Canvas Content */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {activeTab === 'workflow' ? (
          <>
            {/* Workflow Tabs */}
            <WorkflowTabs onNewTab={handleNewWorkflowTab} />

            {/* Workflow Editor */}
            <div className="flex-1 overflow-hidden">
              {activeWorkflowTab ? (
                <ChatBotEditorWorkflowNew
                  key={activeWorkflowTab.id}
                  technicalId={activeWorkflowTab.technicalId}
                  modelName={activeWorkflowTab.modelName}
                  modelVersion={activeWorkflowTab.modelVersion}
                  onAnswer={onAnswer}
                  onUpdate={(data) => handleWorkflowUpdate(activeWorkflowTab.id, data)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Activity size={64} className="mx-auto mb-4 text-gray-600" />
                    <h2 className="text-xl font-semibold text-gray-300 mb-2">
                      No Workflow Open
                    </h2>
                    <p className="text-gray-500 mb-6">
                      Click the + button to open a workflow
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-slate-900/50 p-4">
            <div className="h-full flex flex-col">
              {/* Markdown Content Area */}
              <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Editor Panel - Show in edit and split modes */}
                {(markdownMode === 'edit' || markdownMode === 'split') && (
                  <div className={`flex flex-col ${markdownMode === 'split' ? 'flex-1' : 'w-full'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                        <FileText size={16} className="text-teal-400" />
                        <span>Editor</span>
                      </h4>
                    </div>
                    <div className="flex-1 bg-slate-800/80 rounded-lg border border-slate-600 p-4 backdrop-blur-sm flex flex-col">
                      <textarea
                        ref={textareaRef}
                        value={markdownContent}
                        onChange={(e) => setMarkdownContent(e.target.value)}
                        className="flex-1 w-full bg-transparent text-slate-300 placeholder-slate-500 resize-none focus:outline-none font-mono text-sm leading-relaxed scrollbar-thin"
                        placeholder="# Start writing your markdown here...

## Features
- Real-time preview
- Syntax highlighting
- Mermaid diagrams
- Export options

**Bold text** and *italic text* supported.

> Blockquotes for important notes

```javascript
// Code blocks with syntax highlighting
const example = 'Hello World';
```

```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```"
                      />
                    </div>
                  </div>
                )}

                {/* Preview Panel - Show in preview and split modes */}
                {(markdownMode === 'preview' || markdownMode === 'split') && (
                  <div className={`flex flex-col ${markdownMode === 'split' ? 'flex-1' : 'w-full'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                        <Eye size={16} className="text-teal-400" />
                        <span>Preview</span>
                      </h4>
                    </div>
                    <div className="flex-1 bg-slate-800/80 rounded-lg border border-slate-600 p-4 backdrop-blur-sm overflow-y-auto scrollbar-thin">
                      {markdownContent ? (
                        <div className="prose prose-invert prose-slate max-w-none prose-sm">
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

                                // Handle other code blocks
                                if (!inline && match) {
                                  return (
                                    <div className="relative group">
                                      <pre className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 overflow-x-auto">
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    </div>
                                  );
                                }

                                // Inline code
                                return (
                                  <code className="bg-slate-900/50 px-1 py-0.5 rounded text-sm" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {markdownContent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-sm italic">
                          Start typing in the editor to see the preview...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-600 mt-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleFileAttach}
                    className="p-1.5 rounded-md hover:bg-slate-700 transition-colors text-slate-400 hover:text-white relative"
                    title="Attach File"
                  >
                    <PaperclipIcon size={14} />
                    {attachedFiles.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {attachedFiles.length}
                      </span>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {attachedFiles.length > 0 && (
                    <div className="flex items-center space-x-1">
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="flex items-center space-x-1 bg-slate-700 px-2 py-1 rounded text-xs">
                          <span className="text-slate-300">{file.name}</span>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="text-slate-400 hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-slate-500">
                    {markdownContent.length} characters
                  </span>
                </div>
                <button
                  onClick={handleMarkdownSubmit}
                  disabled={!markdownContent.trim()}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        visible={settingsDialogVisible}
        onClose={() => setSettingsDialogVisible(false)}
      />
    </div>
  );
};

export default ChatBotCanvas;
