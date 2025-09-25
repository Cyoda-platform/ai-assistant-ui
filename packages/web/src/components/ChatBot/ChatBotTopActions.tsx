import React from 'react';
import { Button } from 'antd';
import MenuIcon from '@/assets/images/icons/menu.svg';
import AuthState from '@/components/AuthState/AuthState';

interface ChatBotTopActionsProps {
  children?: React.ReactNode;
  onToggleCanvas: () => void;
}

const ChatBotTopActions: React.FC<ChatBotTopActionsProps> = ({
  children,
  onToggleCanvas
}) => {
  const onClickDrawerSideBar = () => {
    // Handle drawer sidebar toggle
    console.log('Toggle drawer sidebar');
  };

  return (
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
        {/* ChatBotMenuDesktop placeholder */}
        <div>Desktop Menu Placeholder</div>
        <AuthState />
      </div>
      
      <div className="chat-bot-top-actions__right-part hidden-above-md">
        <AuthState />
        {/* Mobile menu placeholder */}
      </div>
    </div>
  );
};

export default ChatBotTopActions;
