import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Code, Maximize2, Minimize2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { registerWorkflowLightTheme, WORKFLOW_LIGHT_THEME } from '@/utils/monacoTheme';

interface NodeJsonEditorProps {
  data: any;
  onSave: (updatedData: any) => void;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const NodeJsonEditor: React.FC<NodeJsonEditorProps> = ({
  data,
  onSave,
  title = 'Edit JSON',
  isOpen,
  onClose
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  // Initialize JSON text when editor opens
  useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(data, null, 2));
      setError(null);
    }
  }, [isOpen, data]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setError(null);
      onSave(parsed);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    onClose();
    setError(null);
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div
        className="bg-slate-800 border-2 border-slate-600 rounded-lg shadow-2xl w-[800px] h-[600px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-700 border-b border-slate-600 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Code size={20} className="text-slate-300" />
            <h4 className="text-base font-semibold text-white">{title}</h4>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 hover:bg-slate-600 rounded transition-colors"
            title="Close"
          >
            <X size={20} className="text-slate-300" />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="json"
            value={jsonText}
            onChange={(value) => setJsonText(value || '')}
            onMount={handleEditorDidMount}
            theme={WORKFLOW_LIGHT_THEME}
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

        {/* Error Display */}
        {error && (
          <div className="px-4 py-2 bg-red-900/50 border-t border-red-700 text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-4 py-3 bg-slate-700 border-t border-slate-600 rounded-b-lg">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

