import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Upload, Send } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { registerWorkflowLightTheme, WORKFLOW_LIGHT_THEME } from '@/utils/monacoTheme';
import type { WorkflowConfiguration } from '../types/workflow';
import type { ColorPalette } from '../themes/colorPalettes';
import { parseTransitionId } from '../utils/transitionUtils';

interface WorkflowJsonEditorProps {
  workflow: WorkflowConfiguration;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (config: WorkflowConfiguration) => void;
  selectedStateId?: string | null;
  selectedTransitionId?: string | null;
  selectedTransitionSection?: 'criterion' | 'processors';
  technicalId?: string;
  palette: ColorPalette;
  onSendToChat?: (data: string) => void;
}

export const WorkflowJsonEditor: React.FC<WorkflowJsonEditorProps> = ({
  workflow,
  isOpen,
  onClose,
  onUpdate,
  selectedStateId,
  selectedTransitionId,
  selectedTransitionSection,
  technicalId,
  palette,
  onSendToChat,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' } | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Resizing state
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Workflow schema for validation
  const workflowSchema = {
    type: 'object',
    required: ['name', 'initialState', 'states'],
    properties: {
      version: {
        type: 'string',
        description: 'Workflow version (optional)'
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


  // Handle AI suggestion application
  const handleApplySuggestion = useCallback((suggestion: string) => {
    try {
      // Try to parse the suggestion as JSON
      const parsed = JSON.parse(suggestion);
      const formattedJson = JSON.stringify(parsed, null, 2);

      // If we have selected text, try to replace it intelligently
      if (editorRef.current) {
        const selection = editorRef.current.getSelection();
        const selectedText = editorRef.current.getModel()?.getValueInRange(selection);

        if (selectedText && selectedText.trim()) {
          editorRef.current.executeEdits('ai-suggestion', [{
            range: selection,
            text: formattedJson
          }]);
        } else {
          // Otherwise, replace the entire content
          setJsonText(formattedJson);
        }
      } else {
        // No editor ref, just update the text
        setJsonText(formattedJson);
      }

    } catch (err) {
      console.error('Failed to apply AI suggestion:', err);
      alert('The AI suggestion is not valid JSON. Please review and apply manually.');
    }
  }, []);

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
        console.log('🔍 Searching for transition:', {
          selectedTransitionId,
          selectedTransitionSection
        });
        // Parse transition ID to get state and transition index
        // Format: "sourceStateId-transitionIndex"
        const parsed = parseTransitionId(selectedTransitionId);
        console.log('📋 Parsed transition ID:', parsed);
        if (parsed) {
          const stateId = parsed.sourceStateId;
          const transitionIndex = parsed.transitionIndex;
          console.log('🎯 Looking for state:', stateId, 'transition index:', transitionIndex);

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

                  // Find the next state to limit our search
                  const nextStateMatch = stateKeyMatches.find(
                    m => m.range.startLineNumber > stateLineNumber + 1
                  );
                  const searchEndLine = nextStateMatch ? nextStateMatch.range.startLineNumber : model.getLineCount();

                  console.log('🔍 Search boundaries:', {
                    transitionsLineNumber,
                    searchEndLine,
                    stateId,
                    transitionIndex
                  });

                  // Strategy: Find the N-th transition object by looking for opening braces
                  // after "transitions": [ and counting them carefully

                  // Get all lines between transitions line and search end
                  const lines: string[] = [];
                  for (let i = transitionsLineNumber; i <= searchEndLine; i++) {
                    lines.push(model.getLineContent(i));
                  }

                  // Find transition objects by counting braces
                  let braceDepth = 0;
                  let transitionCount = 0;
                  let transitionStartLine = -1;
                  let transitionEndLine = -1;
                  let inTransitionsArray = false;

                  for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const actualLineNumber = transitionsLineNumber + i;

                    // Check if we're entering the transitions array
                    if (line.includes('"transitions"') && line.includes('[')) {
                      inTransitionsArray = true;
                      console.log('📍 Found transitions array at line', actualLineNumber);
                      continue;
                    }

                    if (!inTransitionsArray) continue;

                    // Count braces to track transition objects
                    for (let j = 0; j < line.length; j++) {
                      const char = line[j];

                      if (char === '{') {
                        if (braceDepth === 0) {
                          // This is the start of a transition object
                          if (transitionCount === transitionIndex) {
                            transitionStartLine = actualLineNumber;
                            console.log('🎯 Found transition', transitionIndex, 'start at line', transitionStartLine);
                          }
                          transitionCount++;
                        }
                        braceDepth++;
                      } else if (char === '}') {
                        braceDepth--;
                        if (braceDepth === 0 && transitionStartLine !== -1 && transitionEndLine === -1) {
                          // This is the end of our target transition
                          transitionEndLine = actualLineNumber;
                          console.log('🎯 Found transition', transitionIndex, 'end at line', transitionEndLine);
                          break;
                        }
                      }
                    }

                    if (transitionEndLine !== -1) break;
                  }

                  // Now search for the field within the transition boundaries
                  if (transitionStartLine !== -1 && transitionEndLine !== -1) {
                    let searchField = 'name';
                    if (selectedTransitionSection === 'criterion') {
                      searchField = 'criterion';
                    } else if (selectedTransitionSection === 'processors') {
                      searchField = 'processors';
                    }

                    console.log('🔎 Searching for field:', searchField, 'between lines', transitionStartLine, '-', transitionEndLine);

                    const fieldPattern = `"${searchField}"\\s*:`;
                    const fieldMatches = model.findMatches(
                      fieldPattern,
                      false,
                      true,
                      false,
                      null,
                      true
                    );

                    // Find the field within the transition boundaries
                    const fieldInTransition = fieldMatches.find(
                      m => m.range.startLineNumber >= transitionStartLine &&
                           m.range.startLineNumber <= transitionEndLine
                    );

                    if (fieldInTransition) {
                      targetLine = fieldInTransition.range.startLineNumber;
                      console.log('✅ Found target line:', targetLine);

                      // For criterion and processors, find the end of the block to highlight the whole section
                      if (selectedTransitionSection === 'criterion' || selectedTransitionSection === 'processors') {
                        // Find the end of this block by counting braces
                        let blockEndLine = targetLine;
                        const startLine = targetLine;

                        // Check if the value is an object or array
                        const fieldLine = model.getLineContent(targetLine);
                        const hasOpenBrace = fieldLine.includes('{');
                        const hasOpenBracket = fieldLine.includes('[');

                        if (hasOpenBrace || hasOpenBracket) {
                          let depth = 0;
                          let foundStart = false;

                          for (let i = targetLine; i <= transitionEndLine; i++) {
                            const line = model.getLineContent(i);

                            for (let j = 0; j < line.length; j++) {
                              const char = line[j];
                              if (char === '{' || char === '[') {
                                depth++;
                                foundStart = true;
                              } else if (char === '}' || char === ']') {
                                depth--;
                                if (foundStart && depth === 0) {
                                  blockEndLine = i;
                                  console.log('📦 Block spans from line', startLine, 'to', blockEndLine);
                                  // Store the range for multi-line highlighting
                                  (window as any).__highlightRange = { start: startLine, end: blockEndLine };
                                  break;
                                }
                              }
                            }

                            if (depth === 0 && foundStart) break;
                          }
                        }
                      }
                    } else {
                      console.log('❌ Field not found in transition boundaries');
                    }
                  } else {
                    console.log('❌ Could not find transition boundaries');
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
        // Check if we have a range to highlight (for criterion/processors)
        const highlightRange = (window as any).__highlightRange;
        const startLine = highlightRange?.start || targetLine;
        const endLine = highlightRange?.end || targetLine;

        // Clear the temporary range
        delete (window as any).__highlightRange;

        // Reveal and select the line
        editor.revealLineInCenter(startLine);
        editor.setPosition({
          lineNumber: startLine,
          column: 1
        });

        // Highlight the line(s) temporarily
        const decorations = editor.deltaDecorations([], [
          {
            range: new monaco.Range(
              startLine,
              1,
              endLine,
              model.getLineMaxColumn(endLine)
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
  }, [selectedStateId, selectedTransitionId, selectedTransitionSection, isOpen]);

  const handleTextChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;
    setJsonText(value);

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    try {
      const parsed = JSON.parse(value);

      let configToValidate: WorkflowConfiguration;
      let isWrapperFormat = false;

      // Check if this is a wrapper format (has workflows array)
      if (parsed.workflows && Array.isArray(parsed.workflows)) {
        isWrapperFormat = true;
        // Wrapper format - validate the first workflow
        if (parsed.workflows.length === 0) {
          setError('Workflows array cannot be empty - at least one workflow is required');
          return;
        }
        configToValidate = parsed.workflows[0] as WorkflowConfiguration;

        // Show notification for wrapper format
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        setNotification({
          message: `Wrapper format detected. Displaying first workflow (${parsed.workflows.length} total).`,
          type: 'info'
        });
        // Auto-dismiss notification after 5 seconds
        notificationTimeoutRef.current = setTimeout(() => {
          setNotification(null);
        }, 5000);
      } else {
        // Individual workflow format
        configToValidate = parsed as WorkflowConfiguration;
        setNotification(null);
      }

      // Validate required fields with specific error messages
      // version is optional - if provided, it must be a non-empty string
      if (configToValidate.version !== undefined && (typeof configToValidate.version !== 'string' || configToValidate.version.trim() === '')) {
        setError('Field "version" must be a non-empty string if provided');
        return;
      }

      if (!configToValidate.name || typeof configToValidate.name !== 'string' || configToValidate.name.trim() === '') {
        setError('Field "name" is required and must be a non-empty string');
        return;
      }

      if (!configToValidate.initialState || typeof configToValidate.initialState !== 'string' || configToValidate.initialState.trim() === '') {
        setError('Field "initialState" is required and must be a non-empty string');
        return;
      }

      if (!configToValidate.states || typeof configToValidate.states !== 'object') {
        setError('Field "states" is required and must be an object');
        return;
      }

      if (Object.keys(configToValidate.states).length === 0) {
        setError('States object cannot be empty - at least one state is required');
        return;
      }

      // Validate that initialState exists in states
      if (!configToValidate.states[configToValidate.initialState]) {
        setError(`Initial state "${configToValidate.initialState}" does not exist in states object`);
        return;
      }

      // Validate each state has transitions array
      for (const [stateCode, state] of Object.entries(configToValidate.states)) {
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

      // Auto-save after 1 second of no changes
      saveTimeoutRef.current = setTimeout(() => {
        if (onUpdate) {
          console.log('💾 Auto-saving workflow configuration from JSON editor');
          onUpdate(configToValidate);
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, [onUpdate]);

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

        // Validate required fields (version is optional)
        if (!config.name || !config.initialState || !config.states) {
          alert('Invalid workflow JSON: missing required fields (name, initialState, states)');
          return;
        }

        if (Object.keys(config.states).length === 0) {
          alert('Invalid workflow JSON: states object cannot be empty');
          return;
        }

        // Update the editor with the imported JSON
        const formattedJson = JSON.stringify(config, null, 2);
        setJsonText(formattedJson);
      } catch (error) {
        alert(`Error importing workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    input.click();
  }, []);

  // Send to chat handler
  const handleSendToChat = useCallback(() => {
    if (!onSendToChat) return;

    // Send only the configuration node wrapped in markdown code block
    const message = `\`\`\`json\n${jsonText}\n\`\`\``;
    onSendToChat(message);
  }, [onSendToChat, jsonText]);

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
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

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
        className="h-full bg-white shadow-md flex flex-col border-l flex-shrink-0 relative z-10"
        style={{
          width: `${width}px`,
          borderColor: '#d1d9e0'
        }}
      >
      {/* Left Resize Handle */}
      <div
        className="absolute top-0 bottom-0 cursor-ew-resize transition-colors group"
        onMouseDown={handleResizeStart}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed40'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        title="Drag to resize"
        style={{
          left: '0px',
          width: '2px',
          zIndex: 1,
          pointerEvents: 'auto'
        }}
      >
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: '#7c3aed', pointerEvents: 'none' }}
        />
      </div>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{
            borderColor: '#e2e8f0',
            background: '#f8fafc'
          }}
        >
          <div className="flex items-center gap-3">
            <h3
              style={{
                margin: 0,
                color: '#A78BFA',
                fontSize: '15px',
                fontWeight: 500
              }}
            >
              Workflow JSON Editor
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Import from File Button - compact version */}
            <button
              onClick={handleImportFromFile}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105 group"
              style={{
                background: 'linear-gradient(to bottom right, #7c3aed, #6d28d9)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to bottom right, #6d28d9, #5b21b6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to bottom right, #7c3aed, #6d28d9)';
              }}
              title="Import workflow from JSON file"
            >
              <Upload size={16} className="text-white group-hover:scale-110 transition-transform" />
            </button>

            {/* Send to Chat Button - compact version */}
            {onSendToChat && (
              <button
                onClick={handleSendToChat}
                disabled={!!error}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105 group disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: error
                    ? '#6b7280'
                    : 'linear-gradient(to bottom right, #7c3aed, #6d28d9)'
                }}
                onMouseEnter={(e) => {
                  if (!error) {
                    e.currentTarget.style.background = 'linear-gradient(to bottom right, #6d28d9, #5b21b6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!error) {
                    e.currentTarget.style.background = 'linear-gradient(to bottom right, #7c3aed, #6d28d9)';
                  }
                }}
                title={error ? "Fix JSON errors before sending to chat" : "Send workflow to chat"}
              >
                <Send size={16} className="text-white group-hover:scale-110 transition-transform" />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg transition-colors group flex items-center justify-center"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = palette.ui.accentHover + '30'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Close (Esc)"
            >
              <X
                size={16}
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
              backgroundColor: hexToRgba('#dc2626', 0.06),
              borderColor: '#fca5a5'
            }}
          >
            <p className="text-xs font-medium" style={{ color: '#dc2626' }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Notification Message */}
        {notification && (
          <div
            className="mx-4 mt-3 p-2.5 border rounded-lg flex-shrink-0 animate-pulse"
            style={{
              backgroundColor: notification.type === 'warning'
                ? hexToRgba('#f59e0b', 0.08)
                : hexToRgba('#1a8a84', 0.08),
              borderColor: notification.type === 'warning' ? '#fbbf24' : '#1a8a84'
            }}
          >
            <p className="text-xs font-medium" style={{ color: notification.type === 'warning' ? '#92400e' : '#1a8a84' }}>
              ℹ️ {notification.message}
            </p>
          </div>
        )}

        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonText}
              onChange={handleTextChange}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                monacoRef.current = monaco;

                registerWorkflowLightTheme(monaco);
                monaco.editor.setTheme(WORKFLOW_LIGHT_THEME);

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
              theme={WORKFLOW_LIGHT_THEME}
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
                guides: {
                  indentation: true,
                  highlightActiveIndentation: true,
                  bracketPairs: true,
                  bracketPairsHorizontal: 'active',
                },
                suggest: { showKeywords: true, showSnippets: true },
                quickSuggestions: { other: true, comments: false, strings: true },
                padding: { top: 8, bottom: 8 }
              }}
            />
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-1.5 border-t flex-shrink-0"
          style={{
            borderColor: '#e2e8f0',
            background: '#f8fafc'
          }}
        >
          <div className="flex items-center space-x-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: palette.ui.accentColor }}
            ></div>
            <div className="text-xs text-gray-500">
              <strong>Live Editing:</strong> Changes apply automatically
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkflowJsonEditor;
