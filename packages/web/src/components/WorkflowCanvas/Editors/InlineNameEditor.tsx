import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Check, X } from 'lucide-react';

// ABOUTME: This component provides elegant inline name editing with pencil icon
// that transforms into a text input when clicked, with check/cancel actions.

interface InlineNameEditorProps {
  value: string;
  placeholder?: string;
  onSave: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export const InlineNameEditor: React.FC<InlineNameEditorProps> = ({
  value,
  placeholder = "Enter name",
  onSave,
  className = "",
  inputClassName = "",
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    onSave(trimmedValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Auto-save on blur
    handleSave();
  };

  if (isEditing) {
    return (
      <div
        className={`flex items-center space-x-1 ${className}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder={placeholder}
          className={`flex-1 px-3 py-2 text-lg font-medium border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${inputClassName}`}
        />
        <button
          type="button"
          onClick={handleSave}
          className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
          title="Save name"
        >
          <Check size={18} />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          title="Cancel editing"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 group ${className}`} onDoubleClick={handleStartEdit}>
      <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
        {value || placeholder}
      </span>
      {!disabled && (
        <button
          type="button"
          onClick={handleStartEdit}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-all duration-200"
          title="Edit name"
        >
          <Edit2 size={16} />
        </button>
      )}
    </div>
  );
};
