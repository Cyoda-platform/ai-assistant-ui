import React, { useState } from 'react';
import { Modal, Select, Button, message, AutoComplete } from 'antd';
import { Code, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAssistantStore } from '@/stores/assistant';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST } from '@/helpers/HelperConstants';

const { Option } = Select;

// Predefined app name choices
const APP_NAME_CHOICES = [
  { value: 'Pet Store' },
  { value: 'Weather Forecast' },
];

interface NewAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (chatId: string, appName: string) => void;
}

export const NewAppDialog: React.FC<NewAppDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [programmingLanguage, setProgrammingLanguage] = useState<string>('');
  const [appName, setAppName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const assistantStore = useAssistantStore();

  const handleSubmit = async () => {
    if (!programmingLanguage) {
      message.error('Please select a programming language');
      return;
    }

    if (!appName || appName.trim() === '') {
      message.error('Please enter an app name');
      return;
    }

    setIsLoading(true);

    try {
      // Create the chat message with app name
      const chatMessage = `Hello! I want to build a Cyoda-based app called "${appName.trim()}" using ${programmingLanguage}. Please start the build app workflow in an optimized flow.`;

      // Create a new chat with the message
      const { data } = await assistantStore.postChats({
        name: chatMessage,
        description: ''
      });

      // Emit event to update chat list
      eventBus.$emit(UPDATE_CHAT_LIST);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data.technical_id, appName.trim());
      } else {
        // Fallback: just navigate to chat
        navigate(`/chat-bot/view/${data.technical_id}`);
      }

      message.success('Chat created successfully!');
      handleClose();
    } catch (error: any) {
      console.error('Failed to create chat:', error);
      message.error(error.message || 'Failed to create chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setProgrammingLanguage('');
    setAppName('');
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <Code size={20} className="text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Create New App</h3>
            <p className="text-xs text-gray-400 font-normal">Start building your Cyoda application</p>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      centered
      width={600}
      footer={null}
      className="canvas-modal"
    >
      <div className="space-y-5">
        {/* App Name Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            App Name <span className="text-red-400">*</span>
          </label>
          <AutoComplete
            value={appName}
            onChange={setAppName}
            options={APP_NAME_CHOICES}
            placeholder="Enter app name or choose from suggestions"
            size="large"
            disabled={isLoading}
            className="w-full rounded-lg"
            filterOption={(inputValue, option) =>
              option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
            }
          />
          <p className="mt-1.5 text-xs text-gray-500">
            💡 Choose from suggestions or enter your own app name
          </p>
        </div>

        {/* Programming Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Programming Language *
          </label>
          <Select
            value={programmingLanguage}
            onChange={setProgrammingLanguage}
            placeholder="Select programming language"
            className="w-full"
            size="large"
            disabled={isLoading}
          >
            <Option value="python">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🐍</span>
                <span>Python</span>
              </div>
            </Option>
            <Option value="java">
              <div className="flex items-center gap-2">
                <span className="text-red-600">☕</span>
                <span>Java</span>
              </div>
            </Option>
          </Select>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 rounded-lg p-3">
          <p className="text-sm text-white">
            <strong>What happens next:</strong>
          </p>
          <ul className="mt-2 text-xs text-white space-y-1 list-disc list-inside">
            <li>A new chat will be created with the AI assistant</li>
            <li>The assistant will guide you through building your Cyoda app</li>
            <li>You'll be able to interact with the assistant to customize your app</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            onClick={handleClose}
            disabled={isLoading}
            size="large"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={isLoading || !programmingLanguage || !appName}
            size="large"
            icon={isLoading ? <Loader2 className="animate-spin" size={16} /> : null}
          >
            {isLoading ? 'Starting Chat...' : 'Start Building'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

