import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save, Sparkles, Upload } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { WorkflowConfiguration } from '../types/workflow';
import { WorkflowAIAssistant } from './WorkflowAIAssistant';
import type { ColorPalette } from '../themes/colorPalettes';

interface WorkflowJsonEditorProps {
  workflow: WorkflowConfiguration;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WorkflowConfiguration) => void;
  selectedStateId?: string | null;
  selectedTransitionId?: string | null;
  technicalId?: string;
  palette: ColorPalette;
}

export const WorkflowJsonEditor: React.FC<WorkflowJsonEditorProps> = ({
  workflow,
  isOpen,
  onClose,
  onSave,
  selectedStateId,
  selectedTransitionId,
  technicalId,
  palette,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');

  // Resizing state
  const [width, setWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Workflow schema for validation
  const workflowSchema = {
    type: 'object',
    required: ['version', 'name', 'initialState', 'states'],
    properties: {
      version: {
        type: 'string',
        description: 'Workflow version'
      },
      name: {
        type: 'string',
        description: 'Workflow name'
      },
      desc: {
        type: 'string',
        description: 'Workflow description'
      },
      initialState: {
        type: 'string',
        description: 'Initial state code'
      },
      active: {
        type: 'boolean',
        description: 'Whether workflow is active'
      },
      states: {
        type: 'object',
        description: 'Map of state codes to state definitions',
        additionalProperties: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'State display name'
            },
            transitions: {
              type: 'array',
              description: 'Array of transitions from this state',
              items: {
                type: 'object',
                required: ['name', 'next', 'manual'],
                properties: {
                  name: {
                    type: 'string',
                    description: 'Transition name'
                  },
                  next: {
                    type: 'string',
                    description: 'Target state code'
                  },
                  manual: {
                    type: 'boolean',
                    description: 'Whether this transition requires manual triggering'
                  },
                  disabled: {
                    type: 'boolean',
                    description: 'Whether this transition is disabled'
                  },
                  processors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['name', 'config', 'executionMode'],
                      properties: {
                        name: { type: 'string' },
                        executionMode: {
                          type: 'string',
                          enum: ['SYNC', 'ASYNC_NEW_TX', 'ASYNC_SAME_TX']
                        },
                        config: {
                          type: 'object',
                          required: ['calculationNodesTags'],
                          properties: {
                            attachEntity: { type: 'boolean' },
                            calculationNodesTags: {
                              type: 'string',
                              enum: ['cyoda_application']
                            },
                            responseTimeoutMs: { type: 'integer' },
                            retryPolicy: {
                              type: 'string',
                              enum: ['FIXED', 'EXPONENTIAL', 'LINEAR']
                            }
                          }
                        }
                      }
                    }
                  },
                  criterion: {
                    type: 'object',
                    required: ['type'],
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['function', 'group', 'simple']
                      },
                      jsonPath: { type: 'string' },
                      operation: {
                        type: 'string',
                        enum: ['EQUALS', 'GREATER_THAN', 'GREATER_OR_EQUAL', 'LESS_THAN', 'LESS_OR_EQUAL', 'NOT_EQUALS']
                      },
                      value: {
                        oneOf: [
                          { type: 'string' },
                          { type: 'number' },
                          { type: 'boolean' }
                        ]
                      },
                      operator: {
                        type: 'string',
                        enum: ['AND', 'OR']
                      },
                      conditions: { type: 'array' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  // Update JSON text when workflow changes (from canvas edits)
  useEffect(() => {
    if (workflow) {
      try {
        const newJsonText = JSON.stringify(workflow, null, 2);
        // Only update if different to avoid cursor jumping
        if (newJsonText !== jsonText) {
          setJsonText(newJsonText);
          setError(null);
        }
      } catch (err) {
        setJsonText('{}');
        setError('Invalid workflow data');
      }
    }
  }, [workflow]); // Don't include jsonText to avoid loops

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle AI Assistant hotkey (Cmd/Ctrl + K)
  useEffect(() => {
    const handleAIHotkey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && isOpen) {
        e.preventDefault();
        // Get selected text from editor if available
        if (editorRef.current) {
          const selection = editorRef.current.getSelection();
          const selectedContent = editorRef.current.getModel()?.getValueInRange(selection);
          setSelectedText(selectedContent || '');
        }
        setShowAIAssistant(true);
      }
    };

    document.addEventListener('keydown', handleAIHotkey);
    return () => document.removeEventListener('keydown', handleAIHotkey);
  }, [isOpen]);

  // Handle AI suggestion application
  const handleApplySuggestion = useCallback((suggestion: string) => {
    try {
      // Try to parse the suggestion as JSON
      const parsed = JSON.parse(suggestion);
      const formattedJson = JSON.stringify(parsed, null, 2);

      // If we have selected text, try to replace it intelligently
      if (editorRef.current && selectedText) {
        const selection = editorRef.current.getSelection();
        editorRef.current.executeEdits('ai-suggestion', [{
          range: selection,
          text: formattedJson
        }]);
        // Trigger save after a short delay to allow editor to update
        setTimeout(() => {
          const currentValue = editorRef.current?.getValue();
          if (currentValue) {
            try {
              const updatedParsed = JSON.parse(currentValue);
              onSave(updatedParsed);
            } catch (e) {
              console.error('Failed to save after partial edit:', e);
            }
          }
        }, 100);
      } else {
        // Otherwise, replace the entire content and save immediately
        setJsonText(formattedJson);
        // Trigger save immediately for full replacement
        onSave(parsed);
      }

      setShowAIAssistant(false);
    } catch (err) {
      console.error('Failed to apply AI suggestion:', err);
      alert('The AI suggestion is not valid JSON. Please review and apply manually.');
    }
  }, [selectedText, onSave]);

  // Navigate to selected state or transition in JSON
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !isOpen) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    try {
      const model = editor.getModel();
      if (!model) return;

      const text = model.getValue();
      let targetLine: number | null = null;

      if (selectedTransitionId) {
        // Parse transition ID to get state and transition index
        // Format: "stateId-transition-index"
        const parts = selectedTransitionId.split('-transition-');
        if (parts.length === 2) {
          const stateId = parts[0];
          const transitionIndex = parseInt(parts[1], 10);

          try {
            // First find the state definition as a key
            const statesMatches = model.findMatches(
              '"states"',
              false,
              false,
              true,
              null,
              true
            );

            if (statesMatches.length > 0) {
              const statesLine = statesMatches[0].range.startLineNumber;

              // Find the state ID as a key (not a value)
              const stateKeyPattern = `"${stateId}"\\s*:`;
              const stateKeyMatches = model.findMatches(
                stateKeyPattern,
                false,
                true, // isRegex
                false,
                null,
                true
              );

              const stateKeyMatchesAfterStates = stateKeyMatches.filter(
                m => m.range.startLineNumber > statesLine
              );

              if (stateKeyMatchesAfterStates.length > 0) {
                const stateLineNumber = stateKeyMatchesAfterStates[0].range.startLineNumber;

                // Find "transitions" array after this state
                const transitionsMatches = model.findMatches(
                  '"transitions"',
                  false,
                  false,
                  true,
                  null,
                  true
                );

                const transitionsAfterState = transitionsMatches.filter(
                  m => m.range.startLineNumber > stateLineNumber
                );

                if (transitionsAfterState.length > 0) {
                  const transitionsLineNumber = transitionsAfterState[0].range.startLineNumber;

                  // Find all "name" fields after the transitions array
                  const nameMatches = model.findMatches(
                    '"name"\\s*:',
                    false,
                    true, // isRegex
                    false,
                    null,
                    true
                  );

                  // Filter to get name fields after transitions line
                  const namesAfterTransitions = nameMatches.filter(
                    m => m.range.startLineNumber > transitionsLineNumber
                  );

                  // Find the next state to limit our search
                  const nextStateMatch = stateKeyMatches.find(
                    m => m.range.startLineNumber > stateLineNumber + 1
                  );
                  const searchEndLine = nextStateMatch ? nextStateMatch.range.startLineNumber : model.getLineCount();

                  // Filter to only names within this state's scope
                  const namesInScope = namesAfterTransitions.filter(
                    m => m.range.startLineNumber < searchEndLine
                  );

                  // Get the nth occurrence based on transitionIndex
                  if (namesInScope.length > transitionIndex) {
                    targetLine = namesInScope[transitionIndex].range.startLineNumber;
                  }
                }
              }
            }
          } catch (parseErr) {
            console.error('Error parsing JSON for transition navigation:', parseErr);
          }
        }
      } else if (selectedStateId) {
        // Navigate to the state definition (the state ID as a key, not a value)
        try {
          // First find the "states" object
          const statesMatches = model.findMatches(
            '"states"',
            false,
            false,
            true,
            null,
            true
          );

          if (statesMatches.length > 0) {
            const statesLine = statesMatches[0].range.startLineNumber;

            // Search for the state ID as a key (followed by colon and optional whitespace)
            // This ensures we find "state_id": { not "next": "state_id"
            const stateKeyPattern = `"${selectedStateId}"\\s*:`;
            const stateKeyMatches = model.findMatches(
              stateKeyPattern,
              false,
              true, // isRegex = true
              false,
              null,
              true
            );

            // Find the match after the "states" line
            const stateKeyMatchesAfterStates = stateKeyMatches.filter(
              m => m.range.startLineNumber > statesLine
            );

            if (stateKeyMatchesAfterStates.length > 0) {
              // Found the state definition line
              targetLine = stateKeyMatchesAfterStates[0].range.startLineNumber;
            }
          }
        } catch (parseErr) {
          console.error('Error parsing JSON for state navigation:', parseErr);
        }
      }

      if (targetLine !== null) {
        // Reveal and select the line
        editor.revealLineInCenter(targetLine);
        editor.setPosition({
          lineNumber: targetLine,
          column: 1
        });

        // Highlight the line temporarily
        const decorations = editor.deltaDecorations([], [
          {
            range: new monaco.Range(
              targetLine,
              1,
              targetLine,
              model.getLineMaxColumn(targetLine)
            ),
            options: {
              isWholeLine: true,
              className: 'highlighted-line',
              glyphMarginClassName: 'highlighted-glyph'
            }
          }
        ]);

        // Remove highlight after 2 seconds
        setTimeout(() => {
          editor.deltaDecorations(decorations, []);
        }, 2000);
      }
    } catch (err) {
      console.error('Error navigating to selection:', err);
    }
  }, [selectedStateId, selectedTransitionId, isOpen]);

  const handleTextChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;
    setJsonText(value);

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    try {
      const parsed = JSON.parse(value) as WorkflowConfiguration;

      // Validate required fields with specific error messages
      if (!parsed.version || typeof parsed.version !== 'string' || parsed.version.trim() === '') {
        setError('Field "version" is required and must be a non-empty string');
        return;
      }

      if (!parsed.name || typeof parsed.name !== 'string' || parsed.name.trim() === '') {
        setError('Field "name" is required and must be a non-empty string');
        return;
      }

      if (!parsed.initialState || typeof parsed.initialState !== 'string' || parsed.initialState.trim() === '') {
        setError('Field "initialState" is required and must be a non-empty string');
        return;
      }

      if (!parsed.states || typeof parsed.states !== 'object') {
        setError('Field "states" is required and must be an object');
        return;
      }

      if (Object.keys(parsed.states).length === 0) {
        setError('States object cannot be empty - at least one state is required');
        return;
      }

      // Validate that initialState exists in states
      if (!parsed.states[parsed.initialState]) {
        setError(`Initial state "${parsed.initialState}" does not exist in states object`);
        return;
      }

      // Validate each state has transitions array
      for (const [stateCode, state] of Object.entries(parsed.states)) {
        if (!state.transitions || !Array.isArray(state.transitions)) {
          setError(`State "${stateCode}" must have a "transitions" array`);
          return;
        }

        // Validate each transition
        for (let i = 0; i < state.transitions.length; i++) {
          const trans = state.transitions[i];
          if (!trans.name || typeof trans.name !== 'string') {
            setError(`State "${stateCode}", transition ${i + 1}: "name" is required and must be a string`);
            return;
          }
          if (!trans.next || typeof trans.next !== 'string') {
            setError(`State "${stateCode}", transition ${i + 1}: "next" is required and must be a string`);
            return;
          }
          if (typeof trans.manual !== 'boolean') {
            setError(`State "${stateCode}", transition ${i + 1}: "manual" is required and must be a boolean`);
            return;
          }
        }
      }

      setError(null);

      // Debounce auto-save (500ms delay)
      saveTimeoutRef.current = setTimeout(() => {
        onSave(parsed);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, [onSave]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = width;
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;

    // Add cursor style to body
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = resizeStartX.current - e.clientX; // Inverted because we're on the left edge
      const newWidth = resizeStartWidth.current + deltaX;

      // Constrain width between 300px and 80% of viewport
      const minWidth = 300;
      const maxWidth = window.innerWidth * 0.8;
      setWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Import from file handler
  const handleImportFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const config = JSON.parse(text) as WorkflowConfiguration;

        // Validate required fields
        if (!config.version || !config.name || !config.initialState || !config.states) {
          alert('Invalid workflow JSON: missing required fields (version, name, initialState, states)');
          return;
        }

        if (Object.keys(config.states).length === 0) {
          alert('Invalid workflow JSON: states object cannot be empty');
          return;
        }

        // Update the editor with the imported JSON
        const formattedJson = JSON.stringify(config, null, 2);
        setJsonText(formattedJson);

        // Trigger save after a short delay to allow the editor to update
        setTimeout(() => {
          onSave(config);
        }, 100);
      } catch (error) {
        alert(`Error importing workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    input.click();
  }, [onSave]);

  if (!isOpen) return null;

  // Convert hex color to rgba for animations
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <>
      <style>{`
        .highlighted-line {
          background-color: ${hexToRgba(palette.ui.accentColor, 0.2)} !important;
          animation: highlight-fade 2s ease-out;
        }
        .highlighted-glyph {
          background-color: ${hexToRgba(palette.ui.accentColor, 0.5)} !important;
        }
        @keyframes highlight-fade {
          0% { background-color: ${hexToRgba(palette.ui.accentColor, 0.4)}; }
          100% { background-color: ${hexToRgba(palette.ui.accentColor, 0.1)}; }
        }
      `}</style>
      <div
        className="h-full bg-gray-800 shadow-2xl flex flex-col border-l-2 flex-shrink-0 relative z-10"
        style={{
          width: `${width}px`,
          borderColor: palette.ui.panelBorder
        }}
      >
      {/* Left Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:w-1.5 transition-all z-20 group"
        onMouseDown={handleResizeStart}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = palette.ui.accentColor}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        title="Drag to resize"
      >
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: palette.ui.accentHover }}
        />
      </div>
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b-2 flex-shrink-0"
          style={{
            borderColor: palette.ui.panelBorder,
            background: `linear-gradient(to right, ${palette.ui.panelGradientVia}30, ${palette.ui.panelGradientTo}30)`
          }}
        >
          <div className="flex items-center gap-3">
            {/* Import from File Button - Allows importing workflow JSON from a file
                Purpose: Quick access to import workflow configuration
                Size: 40x40px (w-10 h-10) - matches standard icon size for panel headers
                Alignment: Vertically centered with title text using flex items-center */}
            <button
              onClick={handleImportFromFile}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all hover:scale-105 group"
              style={{
                background: `linear-gradient(to bottom right, ${palette.ui.accentColor}, ${palette.ui.accentHover})`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(to bottom right, ${palette.ui.accentHover}, ${palette.ui.panelBorder})`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(to bottom right, ${palette.ui.accentColor}, ${palette.ui.accentHover})`;
              }}
              title="Import workflow from JSON file"
            >
              <Upload size={20} className="text-white group-hover:scale-110 transition-transform" />
            </button>
            <div>
              <h3
                className="text-lg font-bold text-transparent bg-clip-text"
                style={{
                  backgroundImage: `linear-gradient(to right, ${palette.ui.panelTitleFrom}, ${palette.ui.panelTitleTo})`
                }}
              >
                Workflow JSON Editor
              </h3>
              <p className="text-xs text-gray-400">
                Edit the complete workflow configuration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* AI Assistant Button */}
            <button
              onClick={() => {
                // Get selected text from editor if available
                if (editorRef.current) {
                  const selection = editorRef.current.getSelection();
                  const selectedContent = editorRef.current.getModel()?.getValueInRange(selection);
                  setSelectedText(selectedContent || '');
                }
                setShowAIAssistant(true);
              }}
              className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              title="Ask AI Assistant (⌘K / Ctrl+K)"
            >
              <Sparkles size={16} className="text-white animate-pulse" />
              <span className="text-white font-medium text-sm">Ask AI</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors group"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = palette.ui.accentHover + '30'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Close (Esc)"
            >
              <X
                size={20}
                className="text-gray-500 dark:text-gray-400 transition-colors"
                onMouseEnter={(e) => (e.currentTarget as SVGElement).style.color = palette.ui.accentColor}
                onMouseLeave={(e) => (e.currentTarget as SVGElement).style.color = ''}
              />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mx-4 mt-3 p-2.5 border rounded-lg flex-shrink-0"
            style={{
              backgroundColor: hexToRgba('#dc2626', 0.1),
              borderColor: '#dc2626'
            }}
          >
            <p className="text-xs font-medium" style={{ color: '#fca5a5' }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Monaco Editor */}
        <div className="flex-1 p-4 overflow-hidden">
          <div
            className="h-full rounded-lg overflow-hidden border-2 transition-colors shadow-lg"
            style={{
              borderColor: error ? '#dc2626' : palette.ui.accentColor,
              boxShadow: error
                ? `0 10px 15px -3px ${hexToRgba('#dc2626', 0.2)}`
                : `0 10px 15px -3px ${hexToRgba(palette.ui.accentColor, 0.1)}`
            }}
          >
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonText}
              onChange={handleTextChange}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                monacoRef.current = monaco;

                // Configure JSON schema validation
                monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                  validate: true,
                  schemas: [{
                    uri: 'http://myserver/workflow-schema.json',
                    fileMatch: ['*'],
                    schema: workflowSchema
                  }]
                });

                // Register custom autocomplete provider
                monaco.languages.registerCompletionItemProvider('json', {
                  provideCompletionItems: (model, position) => {
                    const textUntilPosition = model.getValueInRange({
                      startLineNumber: 1,
                      startColumn: 1,
                      endLineNumber: position.lineNumber,
                      endColumn: position.column
                    });

                    const suggestions: any[] = [];

                    try {
                      // Parse current JSON to get context
                      const currentJson = JSON.parse(jsonText);
                      const stateKeys = currentJson.states ? Object.keys(currentJson.states) : [];

                      // Suggest state names for "initialState" field
                      if (textUntilPosition.includes('"initialState"') && textUntilPosition.endsWith(': "')) {
                        stateKeys.forEach(stateKey => {
                          suggestions.push({
                            label: stateKey,
                            kind: monaco.languages.CompletionItemKind.Value,
                            insertText: stateKey,
                            documentation: `Existing state: ${stateKey}`,
                            detail: 'State reference'
                          });
                        });
                      }

                      // Suggest state names for "next" field in transitions
                      if (textUntilPosition.includes('"next"') && textUntilPosition.endsWith(': "')) {
                        stateKeys.forEach(stateKey => {
                          suggestions.push({
                            label: stateKey,
                            kind: monaco.languages.CompletionItemKind.Value,
                            insertText: stateKey,
                            documentation: `Target state: ${stateKey}`,
                            detail: 'State reference'
                          });
                        });
                      }

                      // Suggest transition template
                      if (textUntilPosition.includes('"transitions"') && textUntilPosition.endsWith('[')) {
                        suggestions.push({
                          label: 'New Transition',
                          kind: monaco.languages.CompletionItemKind.Snippet,
                          insertText: [
                            '{',
                            '  "name": "${1:transition_name}",',
                            '  "next": "${2:target_state}",',
                            '  "manual": ${3|true,false|}',
                            '}'
                          ].join('\n'),
                          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                          documentation: 'Insert a new transition',
                          detail: 'Transition template'
                        });

                        suggestions.push({
                          label: 'Transition with Processor',
                          kind: monaco.languages.CompletionItemKind.Snippet,
                          insertText: [
                            '{',
                            '  "name": "${1:transition_name}",',
                            '  "next": "${2:target_state}",',
                            '  "manual": ${3|true,false|},',
                            '  "processors": [',
                            '    {',
                            '      "name": "${4:ProcessorName}",',
                            '      "executionMode": "${5|SYNC,ASYNC_NEW_TX,ASYNC_SAME_TX|}",',
                            '      "config": {',
                            '        "calculationNodesTags": "cyoda_application",',
                            '        "responseTimeoutMs": ${6:30000}',
                            '      }',
                            '    }',
                            '  ]',
                            '}'
                          ].join('\n'),
                          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                          documentation: 'Insert a transition with processor',
                          detail: 'Transition with processor template'
                        });

                        suggestions.push({
                          label: 'Transition with Criterion',
                          kind: monaco.languages.CompletionItemKind.Snippet,
                          insertText: [
                            '{',
                            '  "name": "${1:transition_name}",',
                            '  "next": "${2:target_state}",',
                            '  "manual": ${3|true,false|},',
                            '  "criterion": {',
                            '    "type": "simple",',
                            '    "jsonPath": "${4:$.field.path}",',
                            '    "operation": "${5|EQUALS,NOT_EQUALS,GREATER_THAN,LESS_THAN|}",',
                            '    "value": "${6:value}"',
                            '  }',
                            '}'
                          ].join('\n'),
                          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                          documentation: 'Insert a transition with condition',
                          detail: 'Transition with criterion template'
                        });
                      }

                      // Suggest new state template
                      if (textUntilPosition.includes('"states"') && textUntilPosition.match(/"[^"]*":\s*$/)) {
                        suggestions.push({
                          label: 'New State',
                          kind: monaco.languages.CompletionItemKind.Snippet,
                          insertText: [
                            '{',
                            '  "transitions": []',
                            '}'
                          ].join('\n'),
                          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                          documentation: 'Insert a new state',
                          detail: 'State template'
                        });
                      }
                    } catch (e) {
                      // JSON parsing failed, provide basic templates
                    }

                    return { suggestions };
                  }
                });
              }}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 13,
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true,
                wordWrap: 'on',
                folding: true,
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true, indentation: true },
                suggest: { showKeywords: true, showSnippets: true },
                quickSuggestions: { other: true, comments: false, strings: true },
                padding: { top: 12, bottom: 12 }
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between p-3 border-t-2 flex-shrink-0"
          style={{
            borderColor: palette.ui.panelBorder,
            background: `linear-gradient(to right, ${palette.ui.panelGradientVia}30, ${palette.ui.panelGradientTo}30)`
          }}
        >
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: palette.ui.accentColor }}
            ></div>
            <div className="text-xs text-gray-400">
              <strong>Live Editing:</strong> Changes apply automatically
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Press <kbd className="px-2 py-0.5 bg-gray-700 rounded text-xs">⌘K</kbd> or <kbd className="px-2 py-0.5 bg-gray-700 rounded text-xs">Ctrl+K</kbd> for AI help
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <WorkflowAIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        currentWorkflow={jsonText}
        selectedText={selectedText}
        onApplySuggestion={handleApplySuggestion}
        technicalId={technicalId}
      />
    </>
  );
};

