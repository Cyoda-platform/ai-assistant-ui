import React, { useState, useEffect } from 'react';
import { Modal, Input, Form, message } from 'antd';
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
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const assistantStore = useAssistantStore();

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (visible && currentName) {
      form.setFieldsValue({ name: currentName });
    }
  }, [visible, currentName, form]);

  const handleOk = async () => {
    if (!chatId) return;

    try {
      const values = await form.validateFields();
      const newName = values.name.trim();

      if (newName === currentName) {
        onClose();
        return;
      }

      setLoading(true);

      // Call the API to rename the chat
      await assistantStore.renameChatById(chatId, { name: newName });

      // Notify success
      message.success('Chat renamed successfully');

      // Trigger chat list update
      eventBus.$emit(UPDATE_CHAT_LIST);

      // Call success callback
      onSuccess?.(newName);

      // Close dialog
      onClose();

    } catch (error) {
      console.error('Failed to rename chat:', error);
      message.error('Failed to rename chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Rename Chat"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Rename"
      cancelText="Cancel"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Chat Name"
          rules={[
            { required: true, message: 'Please enter a chat name' },
            { max: 100, message: 'Chat name cannot exceed 100 characters' },
            {
              validator: (_, value) => {
                if (value && value.trim().length === 0) {
                  return Promise.reject(new Error('Chat name cannot be empty'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input
            placeholder="Enter new chat name"
            maxLength={100}
            showCount
            autoFocus
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChatBotRenameDialog;
