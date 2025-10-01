import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { WorkflowConfiguration } from '../types/workflow';

interface WorkflowJsonEditorProps {
  workflow: WorkflowConfiguration;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WorkflowConfiguration) => void;
  selectedStateId?: string | null;
  selectedTransitionId?: string | null;
}

export const WorkflowJsonEditor: React.FC<WorkflowJsonEditorProps> = ({
  workflow,
  isOpen,
  onClose,
  onSave,
  selectedStateId,
  selectedTransitionId,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

          // Parse the JSON to find the exact line
          try {
            const parsed = JSON.parse(text);
            if (parsed.states && parsed.states[stateId]) {
              const state = parsed.states[stateId];
              if (state.transitions && state.transitions[transitionIndex]) {
                const transition = state.transitions[transitionIndex];
                const transitionName = transition.name;

                // Search for the transition name within the state's transitions array
                // First find the state
                const stateMatches = model.findMatches(
                  `"${stateId}"`,
                  false,
                  false,
                  true,
                  null,
                  true
                );

                if (stateMatches.length > 0) {
                  const stateLineNumber = stateMatches[0].range.startLineNumber;

                  // Then find "transitions" after the state
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

                    // Find the transition name after the transitions array
                    const nameMatches = model.findMatches(
                      `"name"`,
                      false,
                      false,
                      true,
                      null,
                      true
                    );

                    const namesAfterTransitions = nameMatches.filter(
                      m => m.range.startLineNumber > transitionsLineNumber
                    );

                    // Get the nth occurrence (based on transitionIndex)
                    if (namesAfterTransitions.length > transitionIndex) {
                      targetLine = namesAfterTransitions[transitionIndex].range.startLineNumber;
                    }
                  }
                }
              }
            }
          } catch (parseErr) {
            console.error('Error parsing JSON for navigation:', parseErr);
          }
        }
      } else if (selectedStateId) {
        // Search for the state key in the states object
        const stateMatches = model.findMatches(
          `"${selectedStateId}"`,
          false,
          false,
          true,
          null,
          true
        );

        // Find the match within "states" context
        const statesMatches = model.findMatches(
          '"states"',
          false,
          false,
          true,
          null,
          true
        );

        if (statesMatches.length > 0 && stateMatches.length > 0) {
          const statesLine = statesMatches[0].range.startLineNumber;
          const matchesAfterStates = stateMatches.filter(
            m => m.range.startLineNumber > statesLine
          );
          if (matchesAfterStates.length > 0) {
            targetLine = matchesAfterStates[0].range.startLineNumber;
          }
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

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .highlighted-line {
          background-color: rgba(132, 204, 22, 0.2) !important;
          animation: highlight-fade 2s ease-out;
        }
        .highlighted-glyph {
          background-color: rgba(132, 204, 22, 0.5) !important;
        }
        @keyframes highlight-fade {
          0% { background-color: rgba(132, 204, 22, 0.4); }
          100% { background-color: rgba(132, 204, 22, 0.1); }
        }
      `}</style>
      <div
        className="h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col border-l-2 border-lime-200 dark:border-lime-800 flex-shrink-0 relative z-10"
        style={{ width: `${width}px` }}
      >
      {/* Left Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-lime-500 hover:w-1.5 transition-all z-20 group"
        onMouseDown={handleResizeStart}
        title="Drag to resize"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-lime-400 dark:bg-lime-600 rounded-r opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-lime-200 dark:border-lime-800 bg-gradient-to-r from-lime-50 to-emerald-50 dark:from-lime-950/30 dark:to-emerald-950/30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">{ }</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-600 to-emerald-600 dark:from-lime-400 dark:to-emerald-400">
                Workflow JSON Editor
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Edit the complete workflow configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-lime-100 dark:hover:bg-lime-900/30 transition-colors group"
            title="Close (Esc)"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-lime-600 dark:group-hover:text-lime-400" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-3 p-2.5 bg-pink-50 dark:bg-pink-950/30 border border-pink-300 dark:border-pink-700 rounded-lg flex-shrink-0">
            <p className="text-xs text-pink-700 dark:text-pink-300 font-medium">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Monaco Editor */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className={`h-full rounded-lg overflow-hidden border-2 transition-colors ${
            error
              ? 'border-pink-400 dark:border-pink-500 shadow-lg shadow-pink-500/20'
              : 'border-lime-300 dark:border-lime-600 shadow-lg shadow-lime-500/10'
          }`}>
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
        <div className="flex items-center justify-between p-3 border-t-2 border-lime-200 dark:border-lime-800 bg-gradient-to-r from-lime-50 to-emerald-50 dark:from-lime-950/30 dark:to-emerald-950/30 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse"></div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Live Editing:</strong> Changes apply automatically
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>
      </div>
    </>
  );
};

