import React, { useState, useEffect } from 'react';
import { Database, Edit2, Save, X, ChevronRight, ChevronDown, Loader2, Send, ArrowLeft } from 'lucide-react';
import Editor from '@monaco-editor/react';
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
    if (value === null || value === undefined) return 'text-gray-500';
    if (typeof value === 'string') return 'text-green-400';
    if (typeof value === 'number') return 'text-blue-400';
    if (typeof value === 'boolean') return 'text-purple-400';
    if (isArray) return 'text-yellow-400';
    if (isObject) return 'text-cyan-400';
    return 'text-gray-400';
  };

  return (
    <div className="font-mono text-sm">
      <div className="flex items-center space-x-1 py-0.5 hover:bg-gray-800/50 rounded px-1">
        {isExpandable ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-gray-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-gray-400" />
            ) : (
              <ChevronRight size={14} className="text-gray-400" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <span className="text-blue-300">{label}:</span>

        {!isExpanded && isExpandable && (
          <span className={`${getTypeColor()} ml-1`}>{getValuePreview()}</span>
        )}

        {!isExpandable && (
          <span className={`${getTypeColor()} ml-1`}>{getValuePreview()}</span>
        )}
      </div>

      {isExpanded && isExpandable && (
        <div className="ml-4 border-l border-gray-700 pl-2">
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

export const EntityEditor: React.FC<EntityEditorProps> = ({ appId, entityId, entityData, onSendToChat, onBack }) => {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonWarnings, setJsonWarnings] = useState<string[]>([]);

  // Load entity from API or use provided data
  useEffect(() => {
    const loadEntity = async () => {
      try {
        setLoading(true);
        setError(null);

        let data: Entity;

        // If entity data is provided directly (repository mode), use it
        if (entityData) {
          console.log('📦 Using provided entity data:', entityData);
          console.log('📦 Entity model (content):', entityData.model);
          data = entityData;
        } else {
          // For repository mode, we expect entityData to be provided
          throw new Error('Entity data not provided. This editor is for repository mode only.');
        }

        setEntity(data);

        // Display entity as Python code if it's from repository analysis
        // Otherwise fall back to JSON display
        const displayContent = data.model || {};
        let textToDisplay = '';

        if (typeof displayContent === 'string') {
          // If it's already a string (Python code), use it directly
          textToDisplay = displayContent;
        } else {
          // If it's an object, stringify it as JSON
          textToDisplay = JSON.stringify(displayContent, null, 2);
        }

        setJsonText(textToDisplay);
        validateJson(textToDisplay);
      } catch (err: any) {
        console.error('❌ Failed to load entity:', err);
        setError(err?.message || 'Failed to load entity');
      } finally {
        setLoading(false);
      }
    };

    loadEntity();
  }, [appId, entityId, entityData]);

  // JSON validation - only check if it's valid JSON, no schema validation
  const validateJson = (text: string) => {
    try {
      JSON.parse(text);
      setJsonWarnings([]);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
      setJsonWarnings([]);
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
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to entities list"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
          )}
          <Database size={24} className="text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">
              {currentEntity.name} <span className="text-gray-400">v{currentEntity.version}</span>
            </h2>
            <p className="text-sm text-gray-400">{currentEntity.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Send to Chat Button */}
          {onSendToChat && (
            <button
              onClick={() => {
                // Send only the entity content (model), not the entire entity object
                const entityContent = currentEntity.model || currentEntity;
                const entityJson = JSON.stringify(entityContent, null, 2);
                onSendToChat(entityJson);
              }}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-teal-500/25"
              title="Send to chat"
            >
              <Send size={16} />
              <span>Send to Chat</span>
            </button>
          )}




        </div>
      </div>

      {/* Content - Split View: JSON Editor + Tree Preview */}
      <div className="flex-1 overflow-auto">
          <div className="h-full flex flex-col">
            <div className="flex-1 flex">
              {/* JSON Editor */}
              <div className="w-1/2 border-r border-gray-700 p-4">
                <div className="h-full rounded-lg overflow-hidden border-2 border-gray-700">
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    value={jsonText}
                    onChange={handleJsonChange}
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
              </div>

              {/* Tree View */}
              <div className="w-1/2 p-4 overflow-auto">
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-full flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Tree Preview</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-auto flex-1 mb-4">
                    {!jsonError && entity && (
                      <TreeNode
                        label={entity.name}
                        value={entity.model || entity}
                      />
                    )}
                    {jsonError && (
                      <div className="text-red-400 text-sm">
                        Fix JSON errors to see tree preview
                      </div>
                    )}
                  </div>

                  {/* Entity Metadata */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Entity Name</div>
                      <div className="text-white font-mono text-xs">{currentEntity.name}</div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Version</div>
                      <div className="text-white font-mono text-xs">{currentEntity.version}</div>
                    </div>
                    {currentEntity.github_url && (
                      <div className="bg-gray-900 rounded-lg p-3 col-span-2">
                        <div className="text-xs text-gray-400 mb-1">GitHub Path</div>
                        <a
                          href={currentEntity.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline text-xs break-all font-mono"
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
              <div className="border-t border-gray-700 p-4 bg-gray-800">
                {jsonError && (
                  <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 mb-2">
                    <strong>❌ Error:</strong> {jsonError}
                  </div>
                )}
                {!jsonError && jsonWarnings.length > 0 && (
                  <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200">
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
    </div>
  );
};

