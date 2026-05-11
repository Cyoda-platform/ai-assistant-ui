import React, { useState, useRef } from 'react';
import { Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { registerWorkflowLightTheme, WORKFLOW_LIGHT_THEME } from '@/utils/monacoTheme';
import type { Monaco } from '@monaco-editor/react';
import './JsonEditor.css';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  isValid: boolean;
  error?: string;
  disabled?: boolean;
}

const ELASTICSEARCH_SUGGESTIONS = [
  // Top-level fields
  { label: 'query', kind: 5, insertText: '"query": {}' },
  { label: 'size', kind: 5, insertText: '"size": 100' },
  { label: 'from', kind: 5, insertText: '"from": 0' },
  { label: 'sort', kind: 5, insertText: '"sort": []' },

  // Query types
  { label: 'bool', kind: 5, insertText: '"bool": { "must": [], "filter": [] }' },
  { label: 'match_all', kind: 5, insertText: '"match_all": {}' },
  { label: 'match', kind: 5, insertText: '"match": { "field": "value" }' },
  { label: 'term', kind: 5, insertText: '"term": { "field": "value" }' },
  { label: 'terms', kind: 5, insertText: '"terms": { "field": [] }' },
  { label: 'range', kind: 5, insertText: '"range": { "field": { "gte": "", "lte": "" } }' },

  // Bool clauses
  { label: 'must', kind: 5, insertText: '"must": []' },
  { label: 'filter', kind: 5, insertText: '"filter": []' },
  { label: 'should', kind: 5, insertText: '"should": []' },
  { label: 'must_not', kind: 5, insertText: '"must_not": []' },

  // Common log fields
  { label: '@timestamp', kind: 6, insertText: '"@timestamp"' },
  { label: 'level', kind: 6, insertText: '"level"' },
  { label: 'message', kind: 6, insertText: '"message"' },
  { label: 'pod', kind: 6, insertText: '"pod"' },
  { label: 'namespace', kind: 6, insertText: '"namespace"' },
  { label: 'spanId', kind: 6, insertText: '"spanId"' },
  { label: 'traceId', kind: 6, insertText: '"traceId"' },
  { label: 'exception', kind: 6, insertText: '"exception"' },
  { label: 'class', kind: 6, insertText: '"class"' },
  { label: 'thread', kind: 6, insertText: '"thread"' },
  { label: 'deployment', kind: 6, insertText: '"deployment"' },
  { label: 'nodeIp', kind: 6, insertText: '"nodeIp"' },

  // Log levels
  { label: 'ERROR', kind: 21, insertText: '"ERROR"' },
  { label: 'WARN', kind: 21, insertText: '"WARN"' },
  { label: 'INFO', kind: 21, insertText: '"INFO"' },
  { label: 'DEBUG', kind: 21, insertText: '"DEBUG"' },
  { label: 'TRACE', kind: 21, insertText: '"TRACE"' },

  // Time range shortcuts
  { label: 'now-1h', kind: 21, insertText: '"now-1h"' },
  { label: 'now-24h', kind: 21, insertText: '"now-24h"' },
  { label: 'now-7d', kind: 21, insertText: '"now-7d"' },
  { label: 'now', kind: 21, insertText: '"now"' },
];

const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  onApply,
  isValid,
  error,
  disabled = false
}) => {
  const [copied, setCopied] = useState(false);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    monacoRef.current = monaco;

    // Register custom autocomplete for Elasticsearch fields
    if (monaco && monaco.languages) {
      monaco.languages.registerCompletionItemProvider('json', {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          return {
            suggestions: ELASTICSEARCH_SUGGESTIONS.map(s => ({
              ...s,
              range,
              sortText: s.label,
            }))
          };
        },
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // Silently fail if JSON is invalid
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed));
    } catch (e) {
      // Silently fail if JSON is invalid
    }
  };

  return (
    <div className="json-editor-container">
      <div className="json-editor-toolbar">
        <div className="json-editor-title">
          <span>Elasticsearch Query DSL</span>
          {!isValid && error && (
            <div className="json-editor-error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="json-editor-actions">
          <button
            onClick={handleFormat}
            className="json-editor-btn"
            title="Format JSON"
            disabled={disabled}
          >
            Format
          </button>
          <button
            onClick={handleMinify}
            className="json-editor-btn"
            title="Minify JSON"
            disabled={disabled}
          >
            Minify
          </button>
          <button
            onClick={handleCopy}
            className="json-editor-btn"
            title="Copy to clipboard"
            disabled={disabled}
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <div className="json-editor-wrapper">
        <Editor
          height="300px"
          defaultLanguage="json"
          value={value}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorMount}
          theme={WORKFLOW_LIGHT_THEME}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 2,
            wordWrap: 'on',
            readOnly: disabled,
          }}
        />
      </div>

      <div className="json-editor-footer">
        <button
          onClick={onApply}
          disabled={!isValid || disabled}
          className="json-editor-apply-btn"
        >
          Apply Query
        </button>
      </div>
    </div>
  );
};

export default JsonEditor;

