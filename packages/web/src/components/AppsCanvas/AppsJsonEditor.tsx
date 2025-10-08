import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save, Download, Upload, Sparkles } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { AppRoot } from './types/appSchema';
import { validateAppConfig, downloadAppConfig } from './loadAppConfig';

interface AppsJsonEditorProps {
  appData: AppRoot;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AppRoot) => void;
  navigateToNode?: string | null;
  onNavigated?: () => void;
  palette?: {
    ui: {
      panelBorder: string;
      panelGradientVia: string;
      panelGradientTo: string;
    };
  };
}

// App schema for validation (from app_schema.json)
const appSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "App Configuration Schema",
  "type": "object",
  "properties": {
    "app": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "version": { "type": "string" },
        "author": { "type": "string" },
        "license": { "type": "string" },
        "repository": { "type": "string" },
        "requirement": { "type": "string" },
        "environments": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "url": { "type": "string" },
              "status": { "type": "string" }
            },
            "required": ["name", "url", "status"]
          }
        },
        "entities": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "version": { "type": "string" },
              "description": { "type": "string" },
              "cyoda_url": { "type": "string" },
              "github_url": { "type": "string" },
              "model": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "age": { "type": "number" },
                  "breed": { "type": "string" }
                },
                "required": ["name", "age", "breed"]
              },
              "workflows": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" },
                    "cyoda_url": { "type": "string" },
                    "github_url": { "type": "string" },
                    "config": {
                      "type": "object",
                      "properties": {
                        "states": {
                          "type": "object",
                          "additionalProperties": {
                            "type": "object",
                            "properties": {
                              "transitions": {
                                "type": "array",
                                "items": {
                                  "type": "object",
                                  "properties": {
                                    "name": { "type": "string" },
                                    "next": { "type": "string" }
                                  },
                                  "required": ["name", "next"]
                                }
                              }
                            },
                            "required": ["transitions"]
                          }
                        }
                      },
                      "required": ["states"]
                    }
                  },
                  "required": ["name", "cyoda_url", "github_url", "config"]
                }
              }
            },
            "required": ["name", "version", "description", "cyoda_url", "github_url", "model", "workflows"]
          }
        }
      },
      "required": ["name", "description", "version", "author", "license", "repository", "requirement", "environments", "entities"]
    }
  },
  "required": ["app"]
};

export const AppsJsonEditor: React.FC<AppsJsonEditorProps> = ({
  appData,
  isOpen,
  onClose,
  onSave,
  navigateToNode,
  onNavigated,
  palette,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Resizing state
  const [width, setWidth] = useState(() => {
    try {
      const stored = localStorage.getItem('apps-json-editor-width');
      return stored ? parseInt(stored, 10) : 600;
    } catch {
      return 600;
    }
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Default palette if not provided
  const defaultPalette = {
    ui: {
      panelBorder: '#475569',
      panelGradientVia: '#1e293b',
      panelGradientTo: '#0f172a',
    },
  };
  const activePalette = palette || defaultPalette;

  // Initialize JSON text from appData
  useEffect(() => {
    if (isOpen && appData) {
      console.log('📄 Initializing JSON editor with app data');
      setJsonText(JSON.stringify(appData, null, 2));
      setError(null);
    }
  }, [isOpen, appData]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 AppsJsonEditor state:', {
      isOpen,
      hasAppData: !!appData,
      width,
      hasError: !!error,
    });
  }, [isOpen, appData, width, error]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = width;
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = resizeStartX.current - e.clientX; // Inverted for left edge
      const newWidth = resizeStartWidth.current + deltaX;
      const minWidth = 300;
      const maxWidth = window.innerWidth * 0.8;
      const constrainedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      setWidth(constrainedWidth);

      // Persist to localStorage
      try {
        localStorage.setItem('apps-json-editor-width', constrainedWidth.toString());
      } catch (error) {
        console.warn('Failed to save editor width:', error);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Navigate to node in JSON when requested
  useEffect(() => {
    if (navigateToNode && editorRef.current && monacoRef.current) {
      const editor = editorRef.current;
      const text = editor.getValue();
      const lines = text.split('\n');

      // Find the line number for the node
      let lineNumber = 1;
      let found = false;

      // Parse node ID to determine what to search for
      // Node IDs are like: "app-root", "environment-production", "entity-pet-v1", "workflow-pet-adoption", "group-environments"

      if (navigateToNode === 'app-root') {
        // Navigate to app section (line 2 typically)
        lineNumber = 2;
        found = true;
      } else if (navigateToNode.startsWith('group-')) {
        // Group nodes - navigate to the array section
        const groupType = navigateToNode.replace('group-', '').replace('workflows-entity-', '');
        if (groupType === 'environments') {
          // Find "environments" array
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('"environments"') && lines[i].includes('[')) {
              lineNumber = i + 1;
              found = true;
              break;
            }
          }
        } else if (groupType === 'entities') {
          // Find "entities" array
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('"entities"') && lines[i].includes('[')) {
              lineNumber = i + 1;
              found = true;
              break;
            }
          }
        } else if (groupType.startsWith('workflows')) {
          // Find "workflows" array within an entity
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('"workflows"') && lines[i].includes('[')) {
              lineNumber = i + 1;
              found = true;
              break;
            }
          }
        }
      } else if (navigateToNode.startsWith('environment-')) {
        // Find environment by name
        // ID format: "environment-production"
        const envName = navigateToNode.replace('environment-', '').replace(/-/g, ' ');

        // Search for the environment
        let inEnvironmentsSection = false;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('"environments"')) {
            inEnvironmentsSection = true;
          }
          if (inEnvironmentsSection && lines[i].includes('"name"') && lines[i].includes(`"${envName}"`)) {
            lineNumber = i + 1;
            found = true;
            break;
          }
          if (inEnvironmentsSection && lines[i].includes('"entities"')) {
            break; // Moved past environments section
          }
        }
      } else if (navigateToNode.startsWith('entity-')) {
        // Find entity by name and version
        // ID format: "entity-pet-1" or "entity-pet-v1"
        // Extract name and version
        const withoutPrefix = navigateToNode.replace('entity-', '');

        // Split by last dash to separate name from version
        const lastDashIndex = withoutPrefix.lastIndexOf('-');
        let entityName = withoutPrefix;
        let entityVersion = '';

        if (lastDashIndex > 0) {
          entityName = withoutPrefix.substring(0, lastDashIndex).replace(/-/g, ' ');
          entityVersion = withoutPrefix.substring(lastDashIndex + 1).replace(/^v/, ''); // Remove 'v' prefix if present
        }

        console.log('🔍 Searching for entity:', { entityName, entityVersion, nodeId: navigateToNode });

        // Search for the entity - need to match both name AND version
        let inEntitiesSection = false;
        let currentEntityStartLine = -1;
        let foundName = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Track when we enter entities section
          if (line.includes('"entities"')) {
            inEntitiesSection = true;
            continue;
          }

          // Exit if we've left entities section
          if (inEntitiesSection && line.trim() === ']' && !line.includes('"entities"')) {
            // Could be end of entities array
            const nextNonEmpty = lines.slice(i + 1).find(l => l.trim());
            if (nextNonEmpty && !nextNonEmpty.includes('{')) {
              break;
            }
          }

          // Look for entity name
          if (inEntitiesSection && line.includes('"name"') && line.includes(`"${entityName}"`)) {
            currentEntityStartLine = i + 1;
            foundName = true;

            // Now look for matching version in the next few lines
            for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
              if (lines[j].includes('"version"') && lines[j].includes(`"${entityVersion}"`)) {
                // Found matching entity!
                lineNumber = currentEntityStartLine;
                found = true;
                console.log('✅ Found entity at line:', lineNumber);
                break;
              }
              // If we hit another entity or end of object, stop looking
              if (lines[j].includes('"name"') || (lines[j].trim() === '}' && !lines[j].includes(','))) {
                break;
              }
            }

            if (found) break;
          }
        }

        if (!found) {
          console.warn('❌ Could not find entity:', { entityName, entityVersion, nodeId: navigateToNode });
        }
      } else if (navigateToNode.startsWith('workflow-')) {
        // Find workflow by name
        // ID format: "workflow-pet-adoption"
        const workflowName = navigateToNode.replace('workflow-', '').replace(/-/g, ' ');

        // Search for the workflow
        let inWorkflowsSection = false;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('"workflows"')) {
            inWorkflowsSection = true;
          }
          if (inWorkflowsSection && lines[i].includes('"name"') && lines[i].includes(`"${workflowName}"`)) {
            lineNumber = i + 1;
            found = true;
            break;
          }
        }
      }

      if (found) {
        // Scroll to the line and highlight it
        editor.revealLineInCenter(lineNumber);
        editor.setPosition({ lineNumber, column: 1 });
        editor.setSelection({
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber + 1,
          endColumn: 1,
        });
        editor.focus();
      } else {
        console.warn('Could not find node in JSON:', navigateToNode);
      }

      // Notify that navigation is complete
      onNavigated?.();
    }
  }, [navigateToNode, onNavigated]);

  // Configure Monaco editor with app schema
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure JSON validation with app schema
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        uri: 'http://myserver/app-schema.json',
        fileMatch: ['*'],
        schema: appSchema
      }]
    });

    // Set editor options
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 13,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
    });
  }, []);

  // Handle JSON text changes with auto-save
  const handleChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setJsonText(value);

      // Clear previous save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Validate JSON
      try {
        const parsed = JSON.parse(value);
        const validation = validateAppConfig(parsed);

        if (!validation.valid) {
          setError(validation.errors.join('\n'));
        } else {
          setError(null);

          // Auto-save after 500ms of no changes
          saveTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Auto-saving app config...');
            onSave(parsed as AppRoot);
          }, 500);
        }
      } catch (e: any) {
        setError(`Invalid JSON: ${e.message}`);
      }
    }
  }, [onSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      const validation = validateAppConfig(parsed);

      if (!validation.valid) {
        setError(validation.errors.join('\n'));
        return;
      }

      onSave(parsed as AppRoot);
      setError(null);
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
    }
  }, [jsonText, onSave]);

  // Handle export
  const handleExport = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      downloadAppConfig(parsed as AppRoot, 'app_config.json');
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
    }
  }, [jsonText]);

  // Handle import
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const text = await file.text();
        try {
          const parsed = JSON.parse(text);
          const validation = validateAppConfig(parsed);

          if (!validation.valid) {
            setError(validation.errors.join('\n'));
            return;
          }

          setJsonText(JSON.stringify(parsed, null, 2));
          setError(null);
        } catch (err: any) {
          setError(`Invalid JSON file: ${err.message}`);
        }
      }
    };
    input.click();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to close
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      // Cmd/Ctrl+S to manually save
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && isOpen) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSave]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute top-0 right-0 h-full bg-gray-800 shadow-2xl flex flex-col border-l-2 flex-shrink-0 z-[1000]"
      style={{
        width: `${width}px`,
        borderColor: activePalette.ui.panelBorder
      }}
    >
      {/* Left Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:w-2.5 transition-all z-20 group"
        onMouseDown={handleResizeStart}
        style={{
          background: isResizing ? activePalette.ui.panelBorder : 'transparent',
        }}
      >
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-12 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: `linear-gradient(to right, transparent, ${activePalette.ui.panelBorder}40, transparent)`,
          }}
        />
      </div>

      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b-2 flex-shrink-0"
        style={{
          borderColor: activePalette.ui.panelBorder,
          background: `linear-gradient(to right, ${activePalette.ui.panelGradientVia}30, ${activePalette.ui.panelGradientTo}30)`
        }}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={handleImport}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-all hover:scale-105"
            title="Import from file"
          >
            <Upload size={18} />
          </button>
          <h3 className="text-lg font-semibold text-white">App Configuration</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all hover:scale-105 flex items-center space-x-1.5 text-sm font-medium"
            title="Save changes (Cmd/Ctrl+S)"
          >
            <Save size={14} />
            <span>Save</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-all hover:scale-105"
            title="Close editor (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className="p-3 border-b-2 flex-shrink-0"
          style={{
            borderColor: activePalette.ui.panelBorder,
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5'
          }}
        >
          <div className="font-semibold mb-1 text-sm">⚠️ Validation Errors:</div>
          <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 p-4 overflow-hidden">
        <div
          className="h-full rounded-lg overflow-hidden border-2"
          style={{ borderColor: activePalette.ui.panelBorder }}
        >
          <Editor
            height="100%"
            defaultLanguage="json"
            value={jsonText}
            onChange={handleChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              readOnly: false,
              minimap: { enabled: true },
              fontSize: 13,
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

      {/* Footer */}
      <div
        className="flex items-center justify-between p-3 border-t-2 flex-shrink-0"
        style={{
          borderColor: activePalette.ui.panelBorder,
          background: activePalette.ui.panelGradientTo + '40'
        }}
      >
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            <span>Live editing</span>
          </span>
          <span>Auto-save: 500ms</span>
        </div>
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span>Esc to close</span>
          <span>Cmd/Ctrl+S to save</span>
          <span className={error ? 'text-red-400' : 'text-green-400'}>
            {error ? '❌ Invalid' : '✅ Valid'}
          </span>
        </div>
      </div>
    </div>
  );
};

