import React, { useState, useEffect } from 'react';
import { Database, Edit2, Save, X, ChevronRight, ChevronDown, Loader2, Send, ArrowLeft, Github } from 'lucide-react';
import Editor, { Monaco } from '@monaco-editor/react';
import apiService from '@/services/apiService';

interface Entity {
  name: string;
  version: string;
  description: string;
  cyoda_url: string;
  github_url: string;
  model: any;
  workflows?: any[];
}

interface EntityEditorProps {
  appId: string;
  entityId: string;
  entityData?: Entity; // Optional: provide entity data directly (for repository mode)
  appData?: any; // AppRoot data for GitHub URL construction
  onSendToChat?: (entityJson: string) => void;
  onBack?: () => void;
}

// Tree node component for rendering JSON as a tree
const TreeNode: React.FC<{
  label: string;
  value: any;
  level?: number;
  isLast?: boolean;
}> = ({ label, value, level = 0, isLast = false }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const getValuePreview = () => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (isArray) return `Array(${value.length})`;
    if (isObject) return `Object(${Object.keys(value).length})`;
    return String(value);
  };

  const getTypeColor = () => {
    if (value === null || value === undefined) return 'text-slate-400';
    if (typeof value === 'string') return 'text-emerald-700'; // Strings - dark green
    if (typeof value === 'number') return 'text-blue-700'; // Numbers - dark blue
    if (typeof value === 'boolean') return 'text-purple-700'; // Boolean - dark purple
    if (isArray) return 'text-amber-700'; // Arrays - dark amber
    if (isObject) return 'text-teal-700'; // Objects - dark teal
    return 'text-slate-400';
  };

  return (
    <div className="font-mono text-sm">
      <div className="flex items-center space-x-1 py-0.5 hover:bg-slate-100 rounded px-1">
        {isExpandable ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-slate-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-slate-600" />
            ) : (
              <ChevronRight size={14} className="text-slate-600" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <span className="text-teal-700 font-semibold">{label}:</span>

        {!isExpanded && isExpandable && (
          <span className={`${getTypeColor()} ml-1`}>{getValuePreview()}</span>
        )}

        {!isExpandable && (
          <span className={`${getTypeColor()} ml-1`}>{getValuePreview()}</span>
        )}
      </div>

      {isExpanded && isExpandable && (
        <div className="ml-4 border-l border-slate-300 pl-2">
          {isArray ? (
            value.map((item: any, index: number) => (
              <TreeNode
                key={index}
                label={`[${index}]`}
                value={item}
                level={level + 1}
                isLast={index === value.length - 1}
              />
            ))
          ) : (
            Object.entries(value).map(([key, val], index, arr) => (
              <TreeNode
                key={key}
                label={key}
                value={val}
                level={level + 1}
                isLast={index === arr.length - 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const EntityEditor: React.FC<EntityEditorProps> = ({ appId, entityId, entityData, appData, onSendToChat, onBack }) => {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonWarnings, setJsonWarnings] = useState<string[]>([]);
  const [parsedModel, setParsedModel] = useState<any>(null); // Parsed JSON for tree preview

  const getGitHubUrl = (ent: Entity) => {
    if (!ent.github_url || !appData) return null;

    const owner = appData.app?.metadata?.owner || 'Cyoda-platform';
    const repo = appData.app?.metadata?.repository || 'mcp-cyoda-quart-app';
    const branch = appData.app?.metadata?.branch || 'main';
    const filePath = ent.github_url.replace(/^\.\//, '');

    return `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`;
  };

  // Load entity from API or use provided data
  useEffect(() => {
    // If entity data is provided, use it immediately
    if (entityData) {
      try {
        setLoading(true);
        setError(null);

        console.log('📦 Using provided entity data:', entityData);
        console.log('📦 Entity model (content):', entityData.model);
        console.log('📦 Entity name:', entityData.name);

        setEntity(entityData);

        // Display entity as Python code if it's from repository analysis
        // Otherwise fall back to JSON display
        const displayContent = entityData.model || {};
        let textToDisplay = '';

        if (typeof displayContent === 'string') {
          // If it's already a string (Python code), use it directly
          textToDisplay = displayContent;
        } else {
          // If it's an object, stringify it as JSON
          textToDisplay = JSON.stringify(displayContent, null, 2);
        }

        console.log('📝 Setting jsonText to:', textToDisplay.substring(0, 100) + '...');
        setJsonText(textToDisplay);
        validateJson(textToDisplay);
      } catch (err: any) {
        console.error('❌ Failed to load entity:', err);
        setError(err?.message || 'Failed to load entity');
      } finally {
        setLoading(false);
      }
      return;
    }

    // If entity data is not yet provided, wait briefly then show error
    console.log('⏳ Waiting for entity data...');
    setLoading(true);

    const timeout = setTimeout(() => {
      if (!entityData) {
        console.error('❌ Entity data not available after timeout');
        setError('Entity data not available. Please go back and try again.');
        setLoading(false);
      }
    }, 3000); // Wait 3 seconds before showing error

    return () => clearTimeout(timeout);
  }, [entityData]);

  // JSON validation - only check if it's valid JSON, no schema validation
  const validateJson = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      setParsedModel(parsed);
      setJsonWarnings([]);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
      setJsonWarnings([]);
      // Don't clear parsedModel on error - keep showing last valid state
    }
  };



  const handleJsonChange = (value: string | undefined) => {
    const text = value || '';
    setJsonText(text);
    validateJson(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 size={64} className="mx-auto mb-4 text-blue-400 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            Loading Entity...
          </h2>
          <p className="text-gray-500">
            Please wait while we fetch the entity data
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database size={64} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            Error Loading Entity
          </h2>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            No Entity Selected
          </h2>
          <p className="text-gray-500">
            Click on an entity node in the Apps canvas to view and edit it
          </p>
        </div>
      </div>
    );
  }

  const currentEntity = entity!;

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Content - Split View: JSON Editor + Tree Preview */}
      <div className="flex-1 overflow-auto w-full">
        <div className="h-full w-full flex flex-col">
          <div className="flex-1 flex w-full">
            {/* JSON Editor */}
            <div className="flex-1 border-r border-slate-200 p-4 min-w-0">
              <div className="h-full rounded-lg overflow-hidden border-2 border-slate-200">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={jsonText}
                  onChange={handleJsonChange}
                  theme="workflow-dark"
                  onMount={(editor, monaco) => {
                    // Define custom theme with light colors for light background
                    monaco.editor.defineTheme('workflow-light', {
                      base: 'vs',
                      inherit: true,
                      rules: [
                        { token: '', foreground: '0F172A' },
                        { token: 'string.key.json', foreground: '0D9488' }, // Teal 700 for keys
                        { token: 'string.value.json', foreground: '15803D' }, // Emerald 700 for string values
                        { token: 'number', foreground: '1E40AF' }, // Blue 700 for numbers
                        { token: 'keyword.json', foreground: '6B21A8' }, // Purple 700 for true/false/null
                        { token: 'keyword', foreground: '6B21A8' },
                        { token: 'comment', foreground: '64748B' },
                      ],
                      colors: {
                        'editor.background': '#FFFFFF',
                        'editor.foreground': '#0F172A',
                        'editorLineNumber.foreground': '#94A3B8',
                        'editorLineNumber.activeForeground': '#1a8a84',
                        'editorGutter.background': '#FFFFFF',
                        'editor.lineHighlightBackground': '#4FB8B010',
                        'editor.lineHighlightBorder': '#4FB8B000',
                        'editorCursor.foreground': '#1a8a84',
                        'editor.selectionBackground': '#D1D5DB40',
                        'editor.inactiveSelectionBackground': '#D1D5DB20',
                        'editorMinimap.background': '#FFFFFF',
                        'minimapSlider.background': '#CBD5E180',
                        'minimapSlider.hoverBackground': '#94A3B8',
                        'minimapSlider.activeBackground': '#64748B',
                        'editorStickyScroll.background': '#FFFFFF',
                        'editorStickyScrollHover.background': '#F8FAFC',
                        'scrollbar.shadow': '#00000000',
                        'scrollbarSlider.background': '#CBD5E180',
                        'scrollbarSlider.hoverBackground': '#94A3B8',
                        'scrollbarSlider.activeBackground': '#64748B',
                        'editorBracketMatch.background': '#00000000',
                        'editorBracketMatch.border': '#1a8a84',
                        'editorWidget.background': '#FFFFFF',
                        'editorWidget.border': '#D1D5DB',
                        'editorSuggestWidget.background': '#FFFFFF',
                        'editorSuggestWidget.border': '#D1D5DB',
                        'editorSuggestWidget.selectedBackground': '#F1F5F9',
                        'editorHoverWidget.background': '#FFFFFF',
                        'editorHoverWidget.border': '#D1D5DB',
                        'editorIndentGuide.background': '#E2E8F0',
                        'editorIndentGuide.activeBackground': '#CBD5E1',
                      }
                    });
                    monaco.editor.setTheme('workflow-light');
                  }}
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
                    guides: {
                      indentation: true,
                      highlightActiveIndentation: true,
                      bracketPairs: true,
                      bracketPairsHorizontal: 'active',
                    },
                    bracketPairColorization: {
                      enabled: true,
                    },
                  }}
                />
              </div>
            </div>

            {/* Tree View */}
            <div className="flex-1 p-4 overflow-auto min-w-0">
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 h-full flex flex-col">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Tree Preview</h3>
                <div className="bg-white rounded-lg p-4 overflow-auto flex-1 mb-4 border border-slate-200">
                  {!jsonError && entity && parsedModel && (
                    <TreeNode
                      label={entity.name}
                      value={parsedModel}
                    />
                  )}
                  {jsonError && (
                    <div className="text-red-600 text-sm">
                      Fix JSON errors to see tree preview
                    </div>
                  )}
                </div>

                {/* Entity Metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-xs text-slate-600 mb-1">Entity Name</div>
                    <div className="text-slate-900 font-mono text-xs">{currentEntity.name}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-xs text-slate-600 mb-1">Version</div>
                    <div className="text-slate-900 font-mono text-xs">{currentEntity.version}</div>
                  </div>
                  {currentEntity.github_url && getGitHubUrl(currentEntity) && (
                    <div className="bg-white rounded-lg p-3 col-span-2 border border-slate-200">
                      <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                        <Github size={12} />
                        GitHub Path
                      </div>
                      <a
                        href={getGitHubUrl(currentEntity)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:text-teal-700 underline text-xs break-all font-mono flex items-center gap-1"
                        title="View on GitHub"
                      >
                        {currentEntity.github_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lint Messages */}
          {(jsonError || jsonWarnings.length > 0) && (
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              {jsonError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-2">
                  <strong>❌ Error:</strong> {jsonError}
                </div>
              )}
              {!jsonError && jsonWarnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                  <strong>⚠️ Warnings:</strong>
                  <ul className="mt-2 ml-4 list-disc text-sm">
                    {jsonWarnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer with Send Button - Fixed at bottom */}
      <div className="border-t border-slate-200 bg-white p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 whitespace-nowrap"
              title="Go back to entities list"
            >
              <ArrowLeft size={12} />
              <span>Back</span>
            </button>
          )}
        </div>
        {onSendToChat && !jsonError && (
          <button
            onClick={() => onSendToChat(jsonText)}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white whitespace-nowrap"
            title="Send edited entity to chat"
          >
            <Send size={12} />
            <span>Send to Chat</span>
          </button>
        )}
      </div>
    </div>
  );
};

