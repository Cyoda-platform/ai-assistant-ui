import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import AuthState from '@/components/AuthState/AuthState';
import ChatBotMenuDesktop from './ChatBotMenuDesktop';
import ChatBotMenuMobile from './ChatBotMenuMobile';
import styles from './ChatBotTopActions.module.scss';

interface ChatBotTopActionsProps {
  children?: React.ReactNode;
  onToggleCanvas: () => void;
  onEntitiesDetails?: () => void;
  onToggleChatHistory?: () => void;
  chatData?: any;
  canvasVisible?: boolean;
  chatHistoryVisible?: boolean;
}

const ChatBotTopActions: React.FC<ChatBotTopActionsProps> = ({
  children,
  onToggleCanvas,
  onEntitiesDetails,
  onToggleChatHistory,
  chatData,
  canvasVisible = false,
  chatHistoryVisible = true
}) => {
  const [isLoadingRollback, setIsLoadingRollback] = useState(false);

  const onClickDrawerSideBar = () => {
    // Handle drawer sidebar toggle
    console.log('Toggle drawer sidebar');
  };

  const handleEntitiesDetails = () => {
    if (onEntitiesDetails) {
      onEntitiesDetails();
    }
  };

  const handleChatHistoryToggle = () => {
    if (onToggleChatHistory) {
      onToggleChatHistory();
    }
  };

  const onSupport = () => {
    const url = "https://discord.com/invite/95rdAyBZr2";
    window.open(url, '_blank')?.focus();
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
      <div className={styles.chatBotTopActions}>
        <div className={styles.leftSection}>
          <div className={styles.brandSection}>
            <div className={styles.brandTitle}>CYODA</div>
            <span className={styles.alphaBadge}>ALPHA</span>
          </div>

          {/* Breadcrumb Navigation */}
          <div className={styles.breadcrumbSection}>
            <ChevronRight size={14} />
            {children}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className={styles.rightSection}>
          <div className={styles.buttonGroup}>
            <ChatBotMenuDesktop
              canvasVisible={canvasVisible}
              chatHistoryVisible={chatHistoryVisible}
              onToggleCanvas={onToggleCanvas}
              onEntitiesDetails={handleEntitiesDetails}
              onToggleChatHistory={handleChatHistoryToggle}
              onSupport={onSupport}
            />
          </div>
        </div>

        {/* Mobile Actions */}
        <div className={styles.mobileRightSection}>
          <ChatBotMenuMobile
            canvasVisible={canvasVisible}
            chatHistoryVisible={chatHistoryVisible}
            onToggleCanvas={onToggleCanvas}
            onEntitiesDetails={handleEntitiesDetails}
            onToggleChatHistory={handleChatHistoryToggle}
            onSupport={onSupport}
          />
        </div>
      </div>


    </>
  );
};

export default ChatBotTopActions;
