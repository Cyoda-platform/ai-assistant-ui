import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Trash2, Check, AlertCircle } from 'lucide-react';

interface JsonEditorProps {
  title: string;
  data: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: () => void;
  schema?: any; // JSON schema for validation (optional)
  readOnly?: boolean;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  title,
  data,
  isOpen,
  onClose,
  onSave,
  onDelete,
  schema,
  readOnly = false
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (isOpen && data !== null && data !== undefined) {
      try {
        setJsonText(JSON.stringify(data, null, 2));
        setError(null);
        setIsValid(true);
      } catch (err) {
        setJsonText('{}');
        setError('Invalid data provided');
        setIsValid(false);
      }
    }
  }, [isOpen, data]);

  const validateJson = useCallback((text: string) => {
    try {
      const parsed = JSON.parse(text);

      // Basic JSON validation passed
      setError(null);
      setIsValid(true);

      // TODO: Add JSON schema validation here if schema is provided
      if (schema) {
        // Placeholder for schema validation
        // Could integrate with ajv or similar library
      }

      return parsed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid JSON format';
      setError(errorMessage);
      setIsValid(false);
      return null;
    }
  }, [schema]);

  const handleTextChange = (value: string) => {
    setJsonText(value);
    validateJson(value);
  };

  const handleSave = () => {
    const parsed = validateJson(jsonText);
    if (parsed !== null && isValid) {
      onSave(parsed);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this item?')) {
      onDelete();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-white">
              {title}
            </h3>
            {isValid ? (
              <div className="flex items-center space-x-1 text-green-400">
                <Check size={16} />
                <span className="text-sm">Valid JSON</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-400">
                <AlertCircle size={16} />
                <span className="text-sm">Invalid JSON</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full flex flex-col">
            <textarea
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              readOnly={readOnly}
              className={`flex-1 w-full p-3 border rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                readOnly
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-900 text-white'
              } ${
                error
                  ? 'border-red-400'
                  : 'border-gray-600'
              }`}
              placeholder="Enter JSON configuration..."
              spellCheck={false}
            />

            {error && (
              <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex justify-between p-4 border-t border-gray-700 flex-shrink-0">
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isValid}
                className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-md transition-colors ${
                  isValid
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save size={16} />
                <span>Save</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
