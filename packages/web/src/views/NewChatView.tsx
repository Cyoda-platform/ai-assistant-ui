import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from 'antd';
import AuthState from '@/components/AuthState/AuthState';
import NewChat from '@/components/NewChat/NewChat';
import VersionApp from '@/components/VersionApp/VersionApp';
import { isInIframe } from '@/helpers/HelperIframe';
import LogoUrl from '@/assets/images/logo.svg?url';
import LogoUrlSmall from '@/assets/images/logo-small.svg?url';

const { Title } = Typography;

interface CreateChatResponse {
  technical_id: string;
}

const NewChatView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onCreated = (data: CreateChatResponse) => {
    navigate(`/chat-bot/view/${data.technical_id}`);
  };

  return (
    <div className="main-layout new-chat-view">
      <div className="new-chat-view__header">
        <div className="new-chat-view__logo">
          <img
            alt="logo"
            src={isInIframe ? LogoUrlSmall : LogoUrl}
            className="new-chat-view__logo-img"
          />
        </div>
        <div className="new-chat-view__header-right">
          <VersionApp />
          <AuthState />
        </div>
      </div>

      <div className="new-chat-view__content">
        <NewChat onCreated={onCreated} />
      </div>
    </div>
  );
};

export default NewChatView;
