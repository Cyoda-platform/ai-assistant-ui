import React, { useState } from 'react';
import { Users, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

interface UserSelectorProps {
  onUserSelected?: (userId: string) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ onUserSelected }) => {
  const authStore = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(authStore.selectedUserId || '');
  const [tempValue, setTempValue] = useState(authStore.selectedUserId || '');

  const handleOpenDialog = () => {
    setTempValue(inputValue);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (tempValue.trim()) {
      authStore.setSelectedUserId(tempValue.trim());
      setInputValue(tempValue.trim());
      onUserSelected?.(tempValue.trim());
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setTempValue(inputValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    authStore.setSelectedUserId('');
    setInputValue('');
    onUserSelected?.('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Display current selected user */}
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
        <Users size={16} className="text-teal-600" />
        <span className="text-sm text-slate-700">
          {inputValue ? `User: ${inputValue}` : 'Select User'}
        </span>
      </div>

      {/* Clear button */}
      {inputValue && (
        <button
          onClick={handleClear}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Clear selected user"
        >
          <X size={16} />
        </button>
      )}

      {/* Edit button */}
      <button
        onClick={handleOpenDialog}
        className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
      >
        Change
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 border border-slate-200" style={{ colorScheme: 'light' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#0f172a' }}>Select User ID</h3>

            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter user ID"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 mb-4"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              autoFocus
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: '#ffffff', color: '#374151', border: '1px solid #9ca3af' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!tempValue.trim()}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector;

