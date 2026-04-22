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
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50">
        <Users size={16} className="text-teal-400" />
        <span className="text-sm text-slate-300">
          {inputValue ? `User: ${inputValue}` : 'Select User'}
        </span>
      </div>

      {/* Clear button */}
      {inputValue && (
        <button
          onClick={handleClear}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Clear selected user"
        >
          <X size={16} />
        </button>
      )}

      {/* Edit button */}
      <button
        onClick={handleOpenDialog}
        className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
      >
        Change
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-96 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Select User ID</h3>
            
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter user ID"
              className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 mb-4"
              autoFocus
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
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

