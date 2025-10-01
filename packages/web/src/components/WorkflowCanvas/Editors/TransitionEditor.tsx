import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, Trash2, Check, AlertCircle, Code2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { InlineNameEditor } from './InlineNameEditor';
import type { TransitionDefinition } from '../types/workflow';

interface TransitionEditorProps {
  transitionId: string | null;
  transitionDefinition: TransitionDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (transitionId: string, definition: TransitionDefinition) => void;
  onDelete?: (transitionId: string) => void;
}

export const TransitionEditor: React.FC<TransitionEditorProps> = ({
  transitionId,
  transitionDefinition,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [transitionName, setTransitionName] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const editorRef = useRef<any>(null);

  // Resizable panel state
  const [panelSize, setPanelSize] = useState({ width: 896, height: 600 }); // Default: max-w-4xl ≈ 896px
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={panelRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col relative"
        style={{
          width: `${panelSize.width}px`,
          height: `${panelSize.height}px`,
          minWidth: '400px',
          minHeight: '300px',
          maxWidth: '95vw',
          maxHeight: '95vh'
        }}
      >
        {/* Header with Inline Name Editor */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3 flex-1">
            <span className="text-lg font-medium text-gray-900 dark:text-white">Edit Transition:</span>
            <InlineNameEditor
              value={transitionName}
              placeholder="Enter transition name (e.g., 'Submit for Review', 'Approve', 'Reject')"
              onSave={setTransitionName}
              className="flex-1"
            />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* JSON Editor */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Code2 size={16} className="text-lime-500" />
                <span>Transition Configuration (JSON)</span>
              </label>
              {isValid && (
                <div className="flex items-center space-x-1 text-xs text-lime-600 dark:text-lime-400">
                  <Check size={14} />
                  <span>Valid</span>
                </div>
              )}
            </div>

            <div className={`flex-1 rounded-lg overflow-hidden border-2 transition-colors ${
              error
                ? 'border-pink-400 dark:border-pink-500 shadow-lg shadow-pink-500/20'
                : 'border-lime-300 dark:border-lime-600 shadow-lg shadow-lime-500/10'
            }`}>
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonText}
                onChange={(value) => handleTextChange(value || '')}
                onMount={(editor) => {
                  editorRef.current = editor;
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
              <div className="mt-3 p-3 bg-gradient-to-r from-pink-50 via-fuchsia-50 to-rose-50 dark:from-pink-950/30 dark:via-fuchsia-950/30 dark:to-rose-950/30 border-2 border-pink-300 dark:border-pink-600 rounded-lg text-sm text-pink-700 dark:text-pink-400 backdrop-blur-sm">
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
        <div className="flex justify-between p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 hover:from-pink-600 hover:via-fuchsia-600 hover:to-rose-600 text-white rounded-lg shadow-lg shadow-pink-500/30 transition-all hover:shadow-xl hover:shadow-pink-500/40 hover:scale-105"
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
            className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-all ${
              isValid
                ? 'bg-lime-600 hover:bg-lime-700 text-white shadow-md hover:shadow-lg hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
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
    </div>
  );
};
