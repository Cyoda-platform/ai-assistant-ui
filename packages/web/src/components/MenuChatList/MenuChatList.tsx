import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Empty, Spin } from 'antd';
import { useAssistantStore } from '@/stores/assistant';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST } from '@/helpers/HelperConstants';

interface MenuChatListProps {
  onReady?: () => void;
  onActive?: (active: boolean) => void;
}

const MenuChatList: React.FC<MenuChatListProps> = ({ onReady, onActive }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const assistantStore = useAssistantStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load chats on mount
    loadChats();

    // Listen for chat list updates
    const handleUpdateChatList = () => {
      loadChats();
    };

    eventBus.$on(UPDATE_CHAT_LIST, handleUpdateChatList);

    return () => {
      eventBus.$off(UPDATE_CHAT_LIST, handleUpdateChatList);
    };
  }, []);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      await assistantStore.getChats();
      onReady?.();
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chats = assistantStore.chats || [];
  const isEmpty = chats.length === 0;

  if (isLoading) {
    return (
      <div className="menu-chat-list">
        <Spin size="small" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="menu-chat-list">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="menu-chat-list__empty">
              <h4>{t('menu_chat_list.empty.title')}</h4>
              <p>{t('menu_chat_list.empty.description')}</p>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="menu-chat-list">
      {/* Chat list implementation will be added here */}
      <div className="menu-chat-list__items">
        {chats.map((chat: any) => (
          <div key={chat.id} className="menu-chat-list__item">
            {chat.name || 'Untitled Chat'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuChatList;
