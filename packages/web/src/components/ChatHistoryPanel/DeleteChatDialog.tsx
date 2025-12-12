import React, { useState, useEffect } from 'react';
import { Modal, Button, App } from 'antd';
import { AlertTriangle } from 'lucide-react';
import { useAssistantStore } from '@/stores/assistant';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST } from '@/helpers/HelperConstants';
import './DeleteChatDialog.css';

interface DeleteChatDialogProps {
  visible: boolean;
  chatId: string | null;
  chatName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeleteChatDialog: React.FC<DeleteChatDialogProps> = ({
  visible,
  chatId,
  chatName,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const assistantStore = useAssistantStore();
  const { message } = App.useApp();

  const handleOk = async () => {
    if (!chatId) return;

    try {
      setLoading(true);
      console.log('🗑️ DeleteChatDialog - Deleting chat:', { chatId, chatName });

      // Call the API to delete the chat
      await assistantStore.deleteChatById(chatId);
      console.log('✅ deleteChatById completed');

      // Refresh the chat list
      console.log('🔄 Calling getChats()');
      await assistantStore.getChats();
      console.log('✅ getChats() completed');

      // Notify success
      message.success('Chat deleted successfully');

      // Trigger chat list update
      eventBus.$emit(UPDATE_CHAT_LIST);

      // Call success callback
      onSuccess?.();

      // Close dialog
      onClose();

    } catch (error) {
      console.error('Failed to delete chat:', error);
      message.error('Failed to delete chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      wrapClassName="delete-chat-modal"
      title={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <div className="text-base font-semibold text-red-400">Delete Chat</div>
            <div className="text-xs text-slate-400 font-normal">This action cannot be undone</div>
          </div>
        </div>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Delete Chat"
      cancelText="Cancel"
      okButtonProps={{ danger: true }}
      destroyOnHidden
      centered
    >
      <div className="space-y-6">
        <p className="text-slate-300 text-base">
          Are you sure you want to delete this chat?
        </p>
        {chatName && (
          <div className="pl-4 border-l-2 border-slate-600">
            <p className="text-slate-400 truncate">{chatName}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DeleteChatDialog;

