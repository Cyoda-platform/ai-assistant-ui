import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import * as monaco from 'monaco-editor';
import type { EditorAction } from '@/utils/editorUtils';

// Monaco Environment setup
if (typeof window !== 'undefined') {
  (window as any).MonacoEnvironment = {
    getWorkerUrl: function (_moduleId: string, _label: string) {
      return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
        self.MonacoEnvironment = {
          baseUrl: '/monaco-editor/esm/'
        };
        self.importScripts = function() {};
        self.require = function() {};
        self.define = function() {};
      `)}`;
    }
  };
}

interface EditorProps {
  value?: string;
  language?: string;
  editable?: boolean;
  actions?: EditorAction[];
  onChange?: (value: string) => void;
  onReady?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface EditorRef {
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

const Editor = forwardRef<EditorRef, EditorProps>(({
  value = '',
  language = 'text/plain',
  editable = true,
  actions = [],
  onChange,
  onReady,
  className = '',
  style = { height: '400px', width: '100%' }
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Expose editor instance to parent
  useImperativeHandle(ref, () => ({
    editor: editorRef.current
  }));

  // Update listener extension function
  const updateListenerExtension = (editor: monaco.editor.IStandaloneCodeEditor) => {
    if (onChange) {
      const currentValue = editor.getValue();
      onChange(currentValue);
    }
  };

  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current) return;

    const editor = monaco.editor.create(containerRef.current, {
      value,
      language,
      automaticLayout: true,
      readOnly: !editable,
      renderLineHighlight: "none",
      overviewRulerBorder: false,
      minimap: { enabled: false },
      padding: {
        top: 10,
        bottom: 0
      },
      wordWrap: 'on',
      wrappingStrategy: 'advanced',
      scrollBeyondLastLine: false,
      scrollBeyondLastColumn: 0,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10
      }
    });

    editorRef.current = editor;

    // Set up content change listener
    editor.getModel()?.onDidChangeContent(() => {
      updateListenerExtension(editor);
    });

    // Add custom actions
    actions.forEach(action => {
      editor.addAction({
        id: action.id,
        label: action.label,
        contextMenuGroupId: action.contextMenuGroupId,
        keybindings: action.keybindings,
        run: () => action.run(editor)
      });
    });

    // Call onReady callback
    if (onReady) {
      onReady(editor);
    }

    // Cleanup function
    return () => {
      editor.dispose();
      editorRef.current = null;
    };
  }, []); // Only run on mount

  // Update value when prop changes
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Update language when prop changes
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  // Update readonly state when editable prop changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: !editable });
    }
  }, [editable]);

  // Update actions when they change
  useEffect(() => {
    if (editorRef.current) {
      // Note: Monaco doesn't provide a direct way to remove actions,
      // so we would need to recreate the editor if actions change frequently
      // For now, actions are expected to be stable
    }
  }, [actions]);

  return (
    <div 
      ref={containerRef}
      className={`editor ${!editable ? 'editor-disable' : ''} ${className}`}
      style={style}
    />
  );
});

Editor.displayName = 'Editor';

export default Editor;
