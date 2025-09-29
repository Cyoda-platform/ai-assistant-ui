import React, { useState } from 'react';
import { Button } from 'antd';
import MenuIcon from '@/assets/images/icons/menu.svg?react';
import AuthState from '@/components/AuthState/AuthState';
import ChatBotMenuDesktop from './ChatBotMenuDesktop';
import ChatBotMenuMobile from './ChatBotMenuMobile';
import EntitiesDetailsDialog from '@/components/EntitiesDetailsDialog/EntitiesDetailsDialog';

interface ChatBotTopActionsProps {
  children?: React.ReactNode;
  onToggleCanvas: () => void;
  chatData?: any;
  canvasVisible?: boolean;
}

const ChatBotTopActions: React.FC<ChatBotTopActionsProps> = ({
  children,
  onToggleCanvas,
  chatData,
  canvasVisible = false
}) => {
  const [entitiesDialogVisible, setEntitiesDialogVisible] = useState(false);
  const [isLoadingRollback, setIsLoadingRollback] = useState(false);

  const onClickDrawerSideBar = () => {
    // Handle drawer sidebar toggle
    console.log('Toggle drawer sidebar');
  };

  const onEntitiesDetails = () => {
    setEntitiesDialogVisible(true);
  };

  const onSupport = () => {
    // Handle support action
    console.log('Contact support');
  };

  const onRollbackChat = () => {
    setIsLoadingRollback(true);
    // Handle rollback chat logic
    console.log('Rollback chat');
    setTimeout(() => {
      setIsLoadingRollback(false);
    }, 2000);
  };

  return (
    <>
      <div className="chat-bot-top-actions">
        <div className="chat-bot-top-actions__left-part">
          <Button
            onClick={onClickDrawerSideBar}
            className="btn btn-default btn-icon hidden-above-md"
            icon={<MenuIcon className="fill-stroke" />}
          />
          <div className="chat-bot-top-actions__chat-name">
            {children}
          </div>
        </div>

        <div className="chat-bot-top-actions__right-part hidden-below-md">
          <ChatBotMenuDesktop
            canvasVisible={canvasVisible}
            onToggleCanvas={onToggleCanvas}
            onEntitiesDetails={onEntitiesDetails}
            onSupport={onSupport}
          />
          <AuthState />
        </div>

        <div className="chat-bot-top-actions__right-part hidden-above-md">
          <AuthState />
          <ChatBotMenuMobile
            canvasVisible={canvasVisible}
            onToggleCanvas={onToggleCanvas}
            onEntitiesDetails={onEntitiesDetails}
            onSupport={onSupport}
          />
        </div>
      </div>

      <EntitiesDetailsDialog
        visible={entitiesDialogVisible}
        onClose={() => setEntitiesDialogVisible(false)}
        chatData={chatData}
        isLoadingRollback={isLoadingRollback}
        onRollbackChat={onRollbackChat}
      />
    </>
  );
};

export default ChatBotTopActions;
