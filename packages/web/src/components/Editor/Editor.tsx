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

    // Define custom theme matching the application design
    monaco.editor.defineTheme('workflow-dark', {
      base: 'vs-dark', // Critical for correct scrollbars and menus
      inherit: true,
      rules: [
        { token: '', foreground: 'E2E8F0' }, // Default text color
        { token: 'string.key.json', foreground: '2DD4BF' }, // JSON keys - teal accent
        { token: 'string.value.json', foreground: '86EFAC' }, // JSON string values - light green
        { token: 'number', foreground: 'FCD34D' }, // Numbers - amber
        { token: 'keyword', foreground: '2DD4BF' }, // Keywords - teal accent
        { token: 'comment', foreground: '64748B' }, // Comments - muted gray
      ],
      colors: {
        // Main editor background - deep dark blue matching app
        'editor.background': '#0E1525',
        'editor.foreground': '#E2E8F0',

        // Line numbers and gutter
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#2DD4BF',
        'editorGutter.background': '#0E1525',

        // Current line highlight
        'editor.lineHighlightBackground': '#1E293B',
        'editor.lineHighlightBorder': '#1E293B',

        // Cursor - bright teal
        'editorCursor.foreground': '#2DD4BF',

        // Selection
        'editor.selectionBackground': '#1E293B',
        'editor.inactiveSelectionBackground': '#1E293B80',

        // Minimap - CRITICAL: must match editor background to avoid white bars
        'editorMinimap.background': '#0E1525',
        'minimapSlider.background': '#33415540',
        'minimapSlider.hoverBackground': '#33415560',
        'minimapSlider.activeBackground': '#33415580',

        // Sticky scroll - CRITICAL: must match editor background
        'editorStickyScroll.background': '#0E1525',
        'editorStickyScrollHover.background': '#1E293B',

        // Scrollbars
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#33415580',
        'scrollbarSlider.hoverBackground': '#334155A0',
        'scrollbarSlider.activeBackground': '#334155C0',

        // Bracket matching
        'editorBracketMatch.background': '#1E293B',
        'editorBracketMatch.border': '#2DD4BF',

        // Widget backgrounds (autocomplete, hover, etc.)
        'editorWidget.background': '#1E293B',
        'editorWidget.border': '#2DD4BF',
        'editorSuggestWidget.background': '#1E293B',
        'editorSuggestWidget.border': '#2DD4BF',
        'editorSuggestWidget.selectedBackground': '#334155',
        'editorHoverWidget.background': '#1E293B',
        'editorHoverWidget.border': '#2DD4BF',

        // Indentation guides
        'editorIndentGuide.background': '#334155',
        'editorIndentGuide.activeBackground': '#475569',
      }
    });

    // Set the custom theme
    monaco.editor.setTheme('workflow-dark');

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
      },
      theme: 'workflow-dark'
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
