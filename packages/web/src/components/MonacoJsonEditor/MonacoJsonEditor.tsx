import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface MonacoJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string | number;
  readOnly?: boolean;
  language?: string;
  theme?: 'vs-dark' | 'light' | 'workflow-dark';
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative';
}

const MonacoJsonEditor: React.FC<MonacoJsonEditorProps> = ({
  value,
  onChange,
  height = '500px',
  readOnly = false,
  language = 'json',
  theme = 'workflow-dark',
  minimap = true,
  lineNumbers = 'on'
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
    editorRef.current = editor;

    // Define custom theme matching the application design
    monacoInstance.editor.defineTheme('workflow-dark', {
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
    monacoInstance.editor.setTheme('workflow-dark');

    // Configure JSON language features
    monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: true,
    });

    // Add custom keybindings
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
      // Trigger save action (you can emit an event here)
    });

    // Format on paste
    editor.onDidPaste(() => {
      editor.getAction('editor.action.formatDocument')?.run();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  return (
    <div style={{
      height,
      border: '1px solid rgba(139, 92, 246, 0.3)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      background: '#1E293B'
    }}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          readOnly,
          minimap: {
            enabled: minimap,
          },
          lineNumbers,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
          fontLigatures: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          wrappingIndent: 'indent',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          renderWhitespace: 'selection',
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            showWords: true,
            showSnippets: true,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          matchBrackets: 'always',
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoIndent: 'full',
          padding: {
            top: 16,
            bottom: 16,
          },
        }}
      />
    </div>
  );
};

export default MonacoJsonEditor;

