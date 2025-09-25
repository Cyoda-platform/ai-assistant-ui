import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Form, Row, Col } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useAssistantStore } from '@/stores/assistant';
import { useAuthStore } from '@/stores/auth';
import { isInIframe } from '@/helpers/HelperIframe';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST } from '@/helpers/HelperConstants';

const { TextArea } = Input;

interface CreateChatResponse {
  technical_id: string;
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
    // Check for URL parameters on mount
    const params = new URLSearchParams(window.location.search);
    if (params.has('name')) {
      const name = params.get('name');
      form.setFieldsValue({ name });
      handleSubmit({ name, description: '' });

      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('name');
      window.history.replaceState({}, '', url);
    }
  }, [form]);

  const handleSubmit = async (values: { name: string; description: string }) => {
    setIsLoading(true);
    try {
      const { data } = await assistantStore.postChats(values);
      if (!authStore.isLoggedIn) {
        assistantStore.setGuestChatsExist(true);
      }
      onCreated(data);
      eventBus.$emit(UPDATE_CHAT_LIST);
    } finally {
      setIsLoading(false);
    }
  };

  // Get clickable examples from translations
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
    <div className="new-chat">
      <div className="new-chat__content">
        <div className="new-chat__header">
          <h1 className="new-chat__title">{t('new_chat.h1')}</h1>
          <h2 className="new-chat__subtitle">{t('new_chat.h2')}</h2>
          <p className="new-chat__question">{t('new_chat.title')}</p>
        </div>

        <Form
          form={form}
          onFinish={handleSubmit}
          className="new-chat__form"
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Please enter your request' }]}
          >
            <TextArea
              placeholder={t('new_chat.input.placeholder')}
              autoSize={{ minRows: 3, maxRows: 6 }}
              className="new-chat__textarea"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              icon={<SendOutlined />}
              className="new-chat__submit-btn"
            >
              Send
            </Button>
          </Form.Item>
        </Form>

        {clickableExamples.length > 0 && (
          <div className="new-chat__examples">
            <h3>{t('examples.title')}</h3>
            <Row gutter={[16, 16]}>
              {clickableExamples.map((example, index) => (
                <Col xs={24} sm={12} md={8} key={index}>
                  <Button
                    type="default"
                    className="new-chat__example-btn"
                    onClick={() => {
                      form.setFieldsValue({ name: example });
                      handleSubmit({ name: example, description: '' });
                    }}
                  >
                    {example}
                  </Button>
                </Col>
              ))}
            </Row>
            <p className="new-chat__examples-more">
              {t('examples.items.readonly')}
            </p>
          </div>
        )}
      </div>

      <div className="new-chat__footer">
        <p>
          Copyright © {year}{' '}
          <a target="_blank" href="https://www.cyoda.com/" rel="noopener noreferrer">
            CYODA Ltd.
          </a>
        </p>
      </div>
    </div>
  );
};

export default NewChat;
