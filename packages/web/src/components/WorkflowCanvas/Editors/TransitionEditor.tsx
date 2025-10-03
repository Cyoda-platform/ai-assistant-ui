import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, Trash2, Check, AlertCircle, Code2, Edit } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { InlineNameEditor } from './InlineNameEditor';
import type { TransitionDefinition, WorkflowConfiguration } from '../types/workflow';
import type { ColorPalette } from '../themes/colorPalettes';

interface TransitionEditorProps {
  transitionId: string | null;
  transitionDefinition: TransitionDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (transitionId: string, definition: TransitionDefinition) => void;
  onDelete?: (transitionId: string) => void;
  workflowConfig?: WorkflowConfiguration | null; // Optional workflow context for autocomplete
  palette: ColorPalette; // Color palette for theming
}

export const TransitionEditor: React.FC<TransitionEditorProps> = ({
  transitionId,
  transitionDefinition,
  isOpen,
  onClose,
  onSave,
  onDelete,
  workflowConfig,
  palette
}) => {
  const [transitionName, setTransitionName] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Transition JSON Schema for validation
  const transitionSchema = {
    type: 'object',
    required: ['name', 'next', 'manual'],
    properties: {
      name: {
        type: 'string',
        description: 'Transition name (must be unique within state)',
        minLength: 1
      },
      next: {
        type: 'string',
        description: 'Target state code (must match a state key in workflow)',
        minLength: 1
      },
      manual: {
        type: 'boolean',
        description: 'Whether this transition requires manual triggering (true) or is automatic (false)'
      },
      disabled: {
        type: 'boolean',
        description: 'Whether this transition is disabled and should not execute'
      },
      processors: {
        type: 'array',
        description: 'Array of processors to execute during transition (optional)',
        items: {
          type: 'object',
          required: ['name', 'config', 'executionMode'],
          properties: {
            name: {
              type: 'string',
              description: 'Processor name (e.g., "PaymentProcessor", "EmailNotifier")',
              minLength: 1
            },
            executionMode: {
              type: 'string',
              enum: ['SYNC', 'ASYNC_NEW_TX', 'ASYNC_SAME_TX'],
              description: 'Execution mode: SYNC (synchronous), ASYNC_NEW_TX (async new transaction), ASYNC_SAME_TX (async same transaction)'
            },
            config: {
              type: 'object',
              required: ['calculationNodesTags'],
              description: 'Processor configuration',
              properties: {
                attachEntity: {
                  type: 'boolean',
                  description: 'Whether to attach the entity to the processor execution'
                },
                calculationNodesTags: {
                  type: 'string',
                  enum: ['cyoda_application'],
                  description: 'Tags for calculation nodes (currently only "cyoda_application" is supported)'
                },
                responseTimeoutMs: {
                  type: 'integer',
                  description: 'Response timeout in milliseconds (e.g., 30000 for 30 seconds)',
                  minimum: 0
                },
                retryPolicy: {
                  type: 'string',
                  enum: ['FIXED', 'EXPONENTIAL', 'LINEAR'],
                  description: 'Retry policy: FIXED (fixed interval), EXPONENTIAL (exponential backoff), LINEAR (linear backoff)'
                }
              }
            }
          }
        }
      },
      criterion: {
        type: 'object',
        description: 'Condition that must be met for this transition to execute (optional)',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ['function', 'group', 'simple'],
            description: 'Type of criterion: "simple" (single condition), "group" (multiple conditions), "function" (custom function)'
          },
          jsonPath: {
            type: 'string',
            description: 'JSON path to the field to evaluate (e.g., "$.payment.status") - required for simple criterion',
            minLength: 1
          },
          operation: {
            type: 'string',
            enum: ['EQUALS', 'GREATER_THAN', 'GREATER_OR_EQUAL', 'LESS_THAN', 'LESS_OR_EQUAL', 'NOT_EQUALS'],
            description: 'Comparison operation - required for simple criterion'
          },
          value: {
            oneOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' }
            ],
            description: 'Value to compare against (string, number, or boolean) - required for simple criterion'
          },
          operator: {
            type: 'string',
            enum: ['AND', 'OR'],
            description: 'Logical operator for combining conditions - required for group criterion'
          },
          conditions: {
            type: 'array',
            description: 'Array of sub-conditions - required for group criterion',
            items: {
              type: 'object',
              description: 'Individual condition (can be simple or nested group)'
            }
          }
        }
      }
    }
  };

  // Resizable panel state
  const [panelSize, setPanelSize] = useState({ width: 672, height: 450 }); // 25% smaller than original (896x600)
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const panelRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });

  // Default transition definition for new transitions
  const defaultDefinition: TransitionDefinition = {
    next: '',
    name: '',
    manual: false,
    disabled: false
  };

  useEffect(() => {
    if (isOpen) {
      const definition = transitionDefinition || defaultDefinition;
      setTransitionName(definition.name || '');

      try {
        setJsonText(JSON.stringify(definition, null, 2));
        setError(null);
        setIsValid(true);
      } catch (err) {
        setJsonText('{}');
        setError('Invalid data provided');
        setIsValid(false);
      }
    }
  }, [isOpen, transitionDefinition]);

  const validateJson = (text: string) => {
    try {
      const parsed = JSON.parse(text);

      // Additional validation beyond JSON syntax
      if (!parsed.name || typeof parsed.name !== 'string' || parsed.name.trim() === '') {
        setError('Field "name" is required and must be a non-empty string');
        setIsValid(false);
        return null;
      }

      if (!parsed.next || typeof parsed.next !== 'string' || parsed.next.trim() === '') {
        setError('Field "next" is required and must be a non-empty string (target state code)');
        setIsValid(false);
        return null;
      }

      if (typeof parsed.manual !== 'boolean') {
        setError('Field "manual" is required and must be a boolean (true or false)');
        setIsValid(false);
        return null;
      }

      // Validate processors if present
      if (parsed.processors && Array.isArray(parsed.processors)) {
        for (let i = 0; i < parsed.processors.length; i++) {
          const proc = parsed.processors[i];
          if (!proc.name || typeof proc.name !== 'string') {
            setError(`Processor ${i + 1}: "name" is required and must be a string`);
            setIsValid(false);
            return null;
          }
          if (!proc.executionMode || !['SYNC', 'ASYNC_NEW_TX', 'ASYNC_SAME_TX'].includes(proc.executionMode)) {
            setError(`Processor ${i + 1}: "executionMode" must be one of: SYNC, ASYNC_NEW_TX, ASYNC_SAME_TX`);
            setIsValid(false);
            return null;
          }
          if (!proc.config || typeof proc.config !== 'object') {
            setError(`Processor ${i + 1}: "config" is required and must be an object`);
            setIsValid(false);
            return null;
          }
        }
      }

      setError(null);
      setIsValid(true);
      return parsed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid JSON format';
      setError(errorMessage);
      setIsValid(false);
      return null;
    }
  };

  const handleTextChange = (value: string) => {
    setJsonText(value);
    validateJson(value);
  };

  const handleSave = () => {
    const parsed = validateJson(jsonText);
    if (parsed !== null && isValid && transitionId) {
      // Use the name from the JSON if it exists, otherwise use the inline editor name
      const finalName = (parsed.name !== undefined) ? parsed.name : transitionName.trim();
      const updatedDefinition: TransitionDefinition = {
        ...parsed,
        name: finalName
      };
      onSave(transitionId, updatedDefinition);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete && transitionId && confirm('Are you sure you want to delete this transition?')) {
      onDelete(transitionId);
      onClose();
    }
  };

  // Drag handlers for moving the panel
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Only allow dragging from header
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) {
      return; // Don't drag if clicking buttons or inputs
    }

    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;

      // Constrain to viewport
      const maxX = window.innerWidth - 400; // min width
      const maxY = window.innerHeight - 300; // min height

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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



  // Resize handlers

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setResizeDirection(direction);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startSizeRef.current = { ...panelSize };
  }, [panelSize]);

  // Handle resize events
  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing || !resizeDirection) return;

        const deltaX = e.clientX - startPosRef.current.x;
        const deltaY = e.clientY - startPosRef.current.y;
        const startSize = startSizeRef.current;

        let newWidth = startSize.width;
        let newHeight = startSize.height;

        // Calculate new dimensions based on resize direction
        if (resizeDirection.includes('right')) {
          newWidth = Math.max(400, startSize.width + deltaX);
        }
        if (resizeDirection.includes('left')) {
          newWidth = Math.max(400, startSize.width - deltaX);
        }
        if (resizeDirection.includes('bottom')) {
          newHeight = Math.max(300, startSize.height + deltaY);
        }
        if (resizeDirection.includes('top')) {
          newHeight = Math.max(300, startSize.height - deltaY);
        }

        // Constrain to viewport
        const maxWidth = window.innerWidth - 32;
        const maxHeight = window.innerHeight - 32;
        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, maxHeight);

        setPanelSize({ width: newWidth, height: newHeight });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        setResizeDirection('');
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizeDirection]);



  if (!isOpen) return null;

  const title = transitionId ? `Edit Transition: ${transitionId}` : 'Create Transition';

  return (
    <div
      ref={panelRef}
      className="fixed rounded-lg shadow-2xl flex flex-col border-2 z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${panelSize.width}px`,
        height: `${panelSize.height}px`,
        minWidth: '400px',
        minHeight: '300px',
        maxWidth: '95vw',
        maxHeight: '95vh',
        cursor: isDragging ? 'grabbing' : 'default',
        background: `linear-gradient(to bottom right, ${palette.ui.panelGradientFrom}, ${palette.ui.panelGradientVia}, ${palette.ui.panelGradientTo})`,
        borderColor: palette.ui.panelBorder
      }}
    >
      {/* Header with Inline Name Editor - Draggable */}
      <div
        className="flex items-center justify-between p-4 border-b-2 flex-shrink-0 cursor-grab active:cursor-grabbing"
        style={{
          borderColor: palette.ui.panelBorder,
          background: `linear-gradient(to right, ${palette.ui.panelGradientFrom}80, ${palette.ui.panelGradientVia}80)`
        }}
        onMouseDown={handleDragStart}
      >
          <div className="flex items-center space-x-3 flex-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0"
              style={{
                background: `linear-gradient(to bottom right, ${palette.ui.accentColor}, ${palette.ui.accentHover})`
              }}
            >
              <Edit size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400">Edit Transition</div>
              <InlineNameEditor
                value={transitionName}
                placeholder="Enter transition name"
                onSave={setTransitionName}
                className="text-sm font-medium"
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors group flex-shrink-0"
            style={{
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${palette.ui.accentHover}30`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Close (Esc)"
          >
            <X
              size={18}
              className="text-gray-400 transition-colors"
              onMouseEnter={(e) => (e.currentTarget as SVGElement).style.color = palette.ui.accentColor}
              onMouseLeave={(e) => (e.currentTarget as SVGElement).style.color = ''}
            />
          </button>
        </div>

        {/* JSON Editor */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                <Code2 size={16} style={{ color: palette.ui.accentColor }} />
                <span>Transition Configuration (JSON)</span>
              </label>
              {isValid && (
                <div className="flex items-center space-x-1 text-xs" style={{ color: palette.ui.accentColor }}>
                  <Check size={14} />
                  <span>Valid</span>
                </div>
              )}
            </div>

            <div
              className="flex-1 rounded-lg overflow-hidden border-2 transition-colors shadow-lg"
              style={{
                borderColor: error ? '#dc2626' : palette.ui.accentColor,
                boxShadow: error
                  ? '0 10px 15px -3px rgba(220, 38, 38, 0.2)'
                  : `0 10px 15px -3px ${palette.ui.accentColor}20`
              }}
            >
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonText}
                onChange={(value) => handleTextChange(value || '')}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  monacoRef.current = monaco;

                  // Configure JSON schema validation
                  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                    validate: true,
                    schemas: [{
                      uri: 'http://myserver/transition-schema.json',
                      fileMatch: ['*'],
                      schema: transitionSchema
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

                      // Get state names from workflow config if available
                      const stateKeys = workflowConfig?.states ? Object.keys(workflowConfig.states) : [];

                      // Suggest state names for "next" field
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

                      // Suggest processor template
                      if (textUntilPosition.includes('"processors"') && textUntilPosition.endsWith('[')) {
                        suggestions.push({
                          label: 'New Processor',
                          kind: monaco.languages.CompletionItemKind.Snippet,
                          insertText: [
                            '{',
                            '  "name": "${1:ProcessorName}",',
                            '  "executionMode": "${2|SYNC,ASYNC_NEW_TX,ASYNC_SAME_TX|}",',
                            '  "config": {',
                            '    "calculationNodesTags": "cyoda_application",',
                            '    "responseTimeoutMs": ${3:30000}',
                            '  }',
                            '}'
                          ].join('\n'),
                          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                          documentation: 'Insert a new processor',
                          detail: 'Processor template'
                        });

                        suggestions.push({
                          label: 'Processor with Retry',
                          kind: monaco.languages.CompletionItemKind.Snippet,
                          insertText: [
                            '{',
                            '  "name": "${1:ProcessorName}",',
                            '  "executionMode": "${2|SYNC,ASYNC_NEW_TX,ASYNC_SAME_TX|}",',
                            '  "config": {',
                            '    "calculationNodesTags": "cyoda_application",',
                            '    "responseTimeoutMs": ${3:30000},',
                            '    "retryPolicy": "${4|FIXED,EXPONENTIAL,LINEAR|}"',
                            '  }',
                            '}'
                          ].join('\n'),
                          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                          documentation: 'Insert a processor with retry policy',
                          detail: 'Processor with retry template'
                        });
                      }

                      // Suggest criterion templates
                      if (textUntilPosition.includes('"criterion"') && textUntilPosition.endsWith(': {')) {
                        suggestions.push({
                          label: 'Simple Criterion',
                          kind: monaco.languages.CompletionItemKind.Snippet,
                          insertText: [
                            '"type": "simple",',
                            '"jsonPath": "${1:$.field.path}",',
                            '"operation": "${2|EQUALS,NOT_EQUALS,GREATER_THAN,LESS_THAN,GREATER_OR_EQUAL,LESS_OR_EQUAL|}",',
                            '"value": "${3:value}"'
                          ].join('\n'),
                          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                          documentation: 'Simple condition (single field check)',
                          detail: 'Simple criterion'
                        });

                        suggestions.push({
                          label: 'Group Criterion (AND)',
                          kind: monaco.languages.CompletionItemKind.Snippet,
                          insertText: [
                            '"type": "group",',
                            '"operator": "AND",',
                            '"conditions": [',
                            '  {',
                            '    "type": "simple",',
                            '    "jsonPath": "${1:$.field1}",',
                            '    "operation": "EQUALS",',
                            '    "value": "${2:value1}"',
                            '  },',
                            '  {',
                            '    "type": "simple",',
                            '    "jsonPath": "${3:$.field2}",',
                            '    "operation": "EQUALS",',
                            '    "value": "${4:value2}"',
                            '  }',
                            ']'
                          ].join('\n'),
                          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                          documentation: 'Multiple conditions combined with AND',
                          detail: 'Group criterion (AND)'
                        });

                        suggestions.push({
                          label: 'Group Criterion (OR)',
                          kind: monaco.languages.CompletionItemKind.Snippet,
                          insertText: [
                            '"type": "group",',
                            '"operator": "OR",',
                            '"conditions": [',
                            '  {',
                            '    "type": "simple",',
                            '    "jsonPath": "${1:$.field1}",',
                            '    "operation": "EQUALS",',
                            '    "value": "${2:value1}"',
                            '  },',
                            '  {',
                            '    "type": "simple",',
                            '    "jsonPath": "${3:$.field2}",',
                            '    "operation": "EQUALS",',
                            '    "value": "${4:value2}"',
                            '  }',
                            ']'
                          ].join('\n'),
                          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                          documentation: 'Multiple conditions combined with OR',
                          detail: 'Group criterion (OR)'
                        });
                      }

                      return { suggestions };
                    }
                  });
                }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  formatOnPaste: true,
                  formatOnType: true,
                  wordWrap: 'on',
                  wrappingIndent: 'indent',
                  folding: true,
                  foldingStrategy: 'indentation',
                  showFoldingControls: 'always',
                  bracketPairColorization: {
                    enabled: true
                  },
                  guides: {
                    bracketPairs: true,
                    indentation: true
                  },
                  suggest: {
                    showKeywords: true,
                    showSnippets: true
                  },
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: true
                  },
                  padding: {
                    top: 12,
                    bottom: 12
                  }
                }}
              />
            </div>

            {error && (
              <div
                className="mt-3 p-3 border-2 rounded-lg text-sm backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(to right, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.15))',
                  borderColor: '#dc2626',
                  color: '#fca5a5'
                }}
              >
                <div className="flex items-start space-x-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">JSON Error:</strong>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex justify-between p-4 border-t flex-shrink-0"
          style={{
            borderColor: palette.ui.panelBorder,
            background: `linear-gradient(to right, ${palette.ui.panelGradientFrom}, ${palette.ui.panelGradientVia}, ${palette.ui.panelGradientFrom})`
          }}
        >
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-white rounded-lg shadow-lg transition-all hover:shadow-xl hover:scale-105"
                style={{
                  background: 'linear-gradient(to right, #dc2626, #b91c1c)',
                  boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #b91c1c, #991b1b)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(220, 38, 38, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #dc2626, #b91c1c)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.3)';
                }}
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-all text-white shadow-md"
            style={{
              backgroundColor: isValid ? palette.ui.accentColor : '#4b5563',
              color: isValid ? 'white' : '#9ca3af',
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: isValid ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (isValid) {
                e.currentTarget.style.backgroundColor = palette.ui.accentHover;
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (isValid) {
                e.currentTarget.style.backgroundColor = palette.ui.accentColor;
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            <Save size={16} />
            <span>Save</span>
          </button>
        </div>

        {/* Resize Handles */}
        {/* Corner handles */}
        <div
          className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, 'top-left')}
          style={{ background: 'linear-gradient(-45deg, transparent 30%, #6b7280 30%, #6b7280 70%, transparent 70%)' }}
        />
        <div
          className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          style={{ background: 'linear-gradient(45deg, transparent 30%, #6b7280 30%, #6b7280 70%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          style={{ background: 'linear-gradient(45deg, transparent 30%, #6b7280 30%, #6b7280 70%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          style={{ background: 'linear-gradient(-45deg, transparent 30%, #6b7280 30%, #6b7280 70%, transparent 70%)' }}
        />

        {/* Edge handles */}
        <div
          className="absolute top-0 left-3 right-3 h-1 cursor-n-resize opacity-0 hover:opacity-100 transition-opacity bg-gray-500"
          onMouseDown={(e) => handleResizeStart(e, 'top')}
        />
        <div
          className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize opacity-0 hover:opacity-100 transition-opacity bg-gray-500"
          onMouseDown={(e) => handleResizeStart(e, 'bottom')}
        />
        <div
          className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize opacity-0 hover:opacity-100 transition-opacity bg-gray-500"
          onMouseDown={(e) => handleResizeStart(e, 'left')}
        />
        <div
          className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize opacity-0 hover:opacity-100 transition-opacity bg-gray-500"
          onMouseDown={(e) => handleResizeStart(e, 'right')}
        />
      </div>
  );
};
