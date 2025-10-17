import React, { useState, useEffect } from 'react';
import { Database, Edit2, Save, X, ChevronRight, ChevronDown, FileJson, Network, Loader2, Send } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { JsonGraphVisualizer } from './JsonGraphVisualizer';
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
  onSendToChat?: (entityJson: string) => void;
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

export const EntityEditor: React.FC<EntityEditorProps> = ({ appId, entityId, onSendToChat }) => {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedEntity, setEditedEntity] = useState<Entity | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'json' | 'split' | 'graph'>('graph');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonWarnings, setJsonWarnings] = useState<string[]>([]);

  // Load entity from API
  useEffect(() => {
    const loadEntity = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📥 Loading entity:', { appId, entityId });

        const data = await apiService.getEntityDetail(appId, entityId);
        console.log('✅ Entity loaded:', data);

        setEntity(data);
        setEditedEntity(data);
        setJsonText(JSON.stringify(data, null, 2));
        validateJson(JSON.stringify(data, null, 2));
      } catch (err: any) {
        console.error('❌ Failed to load entity:', err);
        setError(err.error?.message || 'Failed to load entity');
      } finally {
        setLoading(false);
      }
    };

    loadEntity();
  }, [appId, entityId]);

  // JSON validation and linting
  const validateJson = (text: string) => {
    const warnings: string[] = [];

    try {
      const parsed = JSON.parse(text);

      // Lint checks
      if (!parsed.name) warnings.push('Missing required field: name');
      if (!parsed.version) warnings.push('Missing required field: version');
      if (!parsed.description) warnings.push('Missing recommended field: description');
      if (!parsed.model) warnings.push('Missing required field: model');
      if (parsed.workflows && !Array.isArray(parsed.workflows)) {
        warnings.push('Field "workflows" should be an array');
      }

      setJsonWarnings(warnings);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
      setJsonWarnings([]);
    }
  };

  const handleSave = async () => {
    if (viewMode === 'json' || viewMode === 'split') {
      try {
        const parsed = JSON.parse(jsonText);
        validateJson(jsonText);

        if (jsonError) {
          return; // Don't save if there are errors
        }

        setEditedEntity(parsed);
        await saveEntity(parsed);
      } catch (err: any) {
        setJsonError(err.message);
      }
    } else {
      if (editedEntity) {
        await saveEntity(editedEntity);
      }
    }
  };

  const saveEntity = async (entityData: Entity) => {
    try {
      setSaving(true);
      setError(null);
      console.log('💾 Saving entity:', { appId, entityId, entityData });

      const savedEntity = await apiService.saveEntityDetail(appId, entityId, entityData);
      console.log('✅ Entity saved:', savedEntity);

      setEntity(savedEntity);
      setEditedEntity(savedEntity);
      setEditMode(false);
    } catch (err: any) {
      console.error('❌ Failed to save entity:', err);
      setError(err.error?.message || 'Failed to save entity');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedEntity(entity);
    const text = entity ? JSON.stringify(entity, null, 2) : '';
    setJsonText(text);
    validateJson(text);
    setEditMode(false);
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

  if (!entity && !editedEntity) {
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

  const currentEntity = editedEntity || entity!;

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <Database size={24} className="text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">
              {currentEntity.name} <span className="text-gray-400">v{currentEntity.version}</span>
            </h2>
            <p className="text-sm text-gray-400">{currentEntity.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Send to Chat Button */}
          {onSendToChat && (
            <button
              onClick={() => {
                const entityJson = JSON.stringify(currentEntity, null, 2);
                const message = `Here is the entity configuration:\n\n\`\`\`json\n${entityJson}\n\`\`\`\n\nPlease review this configuration and help me improve it.`;
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
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              viewMode === 'graph'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <Network size={16} />
            <span>Graph</span>
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              viewMode === 'tree'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <span>Tree</span>
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              viewMode === 'split'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <span>Split</span>
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              viewMode === 'json'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <FileJson size={16} />
            <span>JSON</span>
          </button>

          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit2 size={16} />
              <span>Edit</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2 transition-colors"
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
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'graph' ? (
          <div className="h-full">
            <JsonGraphVisualizer
              data={currentEntity}
              onNodeClick={(path, value) => {
                console.log('Node clicked:', path, value);
              }}
            />
          </div>
        ) : viewMode === 'json' ? (
          <div className="h-full flex flex-col p-4">
            <div className="flex-1 rounded-lg overflow-hidden border-2 border-gray-700">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonText}
                onChange={handleJsonChange}
                theme="vs-dark"
                options={{
                  readOnly: !editMode,
                  minimap: { enabled: true },
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
            {jsonError && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                <strong>❌ Error:</strong> {jsonError}
              </div>
            )}
            {!jsonError && jsonWarnings.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200">
                <strong>⚠️ Warnings:</strong>
                <ul className="mt-2 ml-4 list-disc">
                  {jsonWarnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : viewMode === 'split' ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 flex">
              {/* JSON Editor */}
              <div className="w-1/2 border-r border-gray-700 p-4">
                <div className="h-full rounded-lg overflow-hidden border-2 border-gray-700">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={jsonText}
                    onChange={handleJsonChange}
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
              </div>

              {/* Tree View */}
              <div className="w-1/2 p-4 overflow-auto">
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Tree Preview</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                    {!jsonError && editedEntity && (
                      <TreeNode label={editedEntity.name} value={editedEntity} />
                    )}
                    {jsonError && (
                      <div className="text-red-400 text-sm">
                        Fix JSON errors to see tree preview
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
        ) : (
          <div className="p-6">
            <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Database size={20} className="text-blue-400" />
                <span>Entity Structure</span>
              </h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                <TreeNode label={currentEntity.name} value={currentEntity} />
              </div>

              {/* Quick Info */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Cyoda URL</div>
                  <a
                    href={currentEntity.cyoda_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline text-sm break-all"
                  >
                    {currentEntity.cyoda_url}
                  </a>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">GitHub URL</div>
                  <a
                    href={currentEntity.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline text-sm break-all"
                  >
                    {currentEntity.github_url}
                  </a>
                </div>
              </div>

              {currentEntity.workflows && currentEntity.workflows.length > 0 && (
                <div className="mt-4 bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Workflows ({currentEntity.workflows.length})</div>
                  <div className="space-y-2">
                    {currentEntity.workflows.map((workflow: any, index: number) => (
                      <div key={index} className="text-sm text-white bg-gray-800 rounded px-3 py-2">
                        {workflow.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

