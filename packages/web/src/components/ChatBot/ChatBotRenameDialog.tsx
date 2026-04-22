import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { message } from 'antd';
import { Edit } from 'lucide-react';
import { useAssistantStore } from '@/stores/assistant';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST } from '@/helpers/HelperConstants';

interface ChatBotRenameDialogProps {
  visible: boolean;
  chatId: string | null;
  currentName: string;
  onClose: () => void;
  onSuccess?: (newName: string) => void;
}

const ChatBotRenameDialog: React.FC<ChatBotRenameDialogProps> = ({
  visible,
  chatId,
  currentName,
  onClose,
  onSuccess
}) => {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const assistantStore = useAssistantStore();

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (visible && currentName) {
      // Replace newlines with spaces to keep text in one line
      const singleLineName = currentName.replace(/[\r\n]+/g, ' ');
      setNewName(singleLineName);
      setError('');
      // Reset textarea height when dialog opens
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder="Enter new chat name"]') as HTMLTextAreaElement;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
        }
      }, 0);
    }
  }, [visible, currentName]);

  const validateName = (name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return 'Please enter a chat name';
    }
    if (name.length > 100) {
      return 'Chat name cannot exceed 100 characters';
    }
    return null;
  };

  const handleOk = async () => {
    if (!chatId) return;

    const trimmedName = newName.trim();
    const validationError = validateName(trimmedName);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (trimmedName === currentName) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the API to rename the chat
      await assistantStore.renameChatById(chatId, { chat_name: trimmedName });

      // Notify success
      message.success('Chat renamed successfully');

      // Trigger chat list update
      eventBus.$emit(UPDATE_CHAT_LIST);

      // Call success callback
      onSuccess?.(trimmedName);

      // Close dialog
      onClose();

    } catch (error) {
      console.error('Failed to rename chat:', error);
      setError('Failed to rename chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewName('');
    setError('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !loading) {
      e.preventDefault();
      handleOk();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!visible) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center space-x-2.5 px-5 py-4 border-b border-slate-700">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500/20">
            <Edit size={16} className="text-teal-400" />
          </div>
          <h3 className="font-semibold text-white">Rename Chat</h3>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-400">
              Chat Name
            </label>
            <textarea
              value={newName}
              onChange={(e) => {
                // Replace newlines with spaces to keep text in one line
                const singleLineValue = e.target.value.replace(/[\r\n]+/g, ' ');
                setNewName(singleLineValue);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              maxLength={100}
              placeholder="Enter new chat name"
              autoFocus
              disabled={loading}
              rows={1}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-hidden whitespace-pre-wrap break-words"
              style={{
                minHeight: '36px',
                maxHeight: '100px',
                height: 'auto',
                wordBreak: 'break-word'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 100) + 'px';
              }}
            />
            <div className="flex items-center justify-between">
              {error ? (
                <p className="text-xs text-red-400">{error}</p>
              ) : (
                <p className="text-xs text-slate-500">Maximum 100 characters</p>
              )}
              <p className="text-xs text-slate-500">{newName.length} / 100</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700 bg-slate-900/30">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleOk}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: '#14b8a6' }}
          >
            {loading ? 'Renaming...' : 'Rename'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ChatBotRenameDialog;
