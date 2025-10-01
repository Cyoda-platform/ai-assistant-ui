import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { InlineNameEditor } from './InlineNameEditor';
import type { StateDefinition } from '../types/workflow';

interface StateEditorProps {
  stateId: string | null;
  stateDefinition: StateDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (stateId: string, definition: StateDefinition) => void;
  onDelete?: (stateId: string) => void;
}

export const StateEditor: React.FC<StateEditorProps> = ({
  stateId,
  stateDefinition,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [stateName, setStateName] = useState('');

  useEffect(() => {
    if (isOpen) {
      const currentName = stateDefinition?.name || stateId || '';
      setStateName(currentName);
    }
  }, [isOpen, stateDefinition, stateId]);

  const handleSave = () => {
    if (stateId) {
      // Preserve existing transitions and only update the name
      const updatedDefinition: StateDefinition = {
        ...stateDefinition,
        name: stateName.trim() || stateId,
        transitions: stateDefinition?.transitions || []
      };
      onSave(stateId, updatedDefinition);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete && stateId && confirm('Are you sure you want to delete this state?')) {
      onDelete(stateId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Edit State Name
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State Name
              </label>
              <InlineNameEditor
                value={stateName}
                placeholder={`State name (defaults to "${stateId}")`}
                onSave={setStateName}
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>State ID: <span className="font-mono">{stateId}</span></p>
              <p className="mt-1">
                To edit transitions, use the transition editor by clicking on the transition edges.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex items-center space-x-2"
              >
                <Trash2 size={16} />
                <span>Delete State</span>
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
