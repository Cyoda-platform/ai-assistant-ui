import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Form } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useAssistantStore } from '@/stores/assistant';
import { useAuthStore } from '@/stores/auth';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST } from '@/helpers/HelperConstants';

const { TextArea } = Input;

interface CreateChatResponse {
  technical_id: string;
  initialMessage?: string;
}

interface NewChatProps {
  onCreated: (data: CreateChatResponse) => void;
}

const NewChat: React.FC<NewChatProps> = ({ onCreated }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const assistantStore = useAssistantStore();
  const authStore = useAuthStore();
  const year = new Date().getFullYear();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('name')) {
      const name = params.get('name');
      form.setFieldsValue({ name });
      handleSubmit({ name, description: '' });
      const url = new URL(window.location.href);
      url.searchParams.delete('name');
      window.history.replaceState({}, '', url);
    }
  }, [form]);

  const handleSubmit = async (values: { name: string; description: string }) => {
    setIsLoading(true);
    const initialMessage = values.name;
    const tempId = `temp-${Date.now()}`;
    onCreated({ technical_id: tempId, initialMessage });

    try {
      const chatName = values.name.substring(0, 50) + (values.name.length > 50 ? '...' : '');
      const { data } = await assistantStore.postChats({
        name: chatName,
        description: values.description || ''
      } as any);

      if (!(authStore as any).isLoggedIn) {
        assistantStore.setGuestChatsExist(true);
      }

      onCreated({
        technical_id: data.technical_id,
        initialMessage
      });
      eventBus.$emit(UPDATE_CHAT_LIST);
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getClickableExamples = () => {
    try {
      const examples = t('examples.items.clickable', { returnObjects: true });
      return Array.isArray(examples) ? examples : [];
    } catch {
      return [];
    }
  };

  const clickableExamples = getClickableExamples();

  return (
    <div className="new-chat bg-white min-h-full">
      <div className="new-chat__content max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">{t('new_chat.h1')}</h1>
          <p className="text-sm text-slate-600 leading-relaxed">{t('new_chat.h2')}</p>
          <p className="text-xs text-slate-500 mt-1">{t('new_chat.title')}</p>
        </div>

        <Form
          form={form}
          onFinish={handleSubmit}
          className="new-chat__form mb-6"
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Please enter your request' }]}
          >
            <TextArea
              placeholder={t('new_chat.input.placeholder')}
              autoSize={{ minRows: 3, maxRows: 6 }}
              className="new-chat__textarea rounded-lg border-slate-200"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              icon={<SendOutlined />}
              className="new-chat__submit-btn bg-blue-600 hover:bg-blue-700 border-blue-600"
            >
              Send
            </Button>
          </Form.Item>
        </Form>

        {clickableExamples.length > 0 && (
          <div className="new-chat__examples">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">{t('examples.title')}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {clickableExamples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-colors"
                  onClick={() => {
                    form.setFieldsValue({ name: example });
                    handleSubmit({ name: example, description: '' });
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
            <p className="new-chat__examples-more text-xs text-slate-400 mt-2">
              {t('examples.items.readonly')}
            </p>
          </div>
        )}
      </div>

      <div className="new-chat__footer border-t border-slate-200 px-6 py-4">
        <p className="text-xs text-slate-400">
          Copyright © {year}{' '}
          <a target="_blank" href="https://www.cyoda.com/" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">
            CYODA Ltd.
          </a>
        </p>
      </div>
    </div>
  );
};

export default NewChat;
