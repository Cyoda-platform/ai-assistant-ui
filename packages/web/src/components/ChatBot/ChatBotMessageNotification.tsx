import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import NotificationIcon from '@/assets/images/icons/notification.svg';
import HelperMarkdown from '@/helpers/HelperMarkdown';

interface Message {
  text: string | object;
  last_modified?: string;
  editable?: boolean;
}

interface ChatBotMessageNotificationProps {
  message: Message;
  onUpdateNotification: (data: any) => void;
}

const ChatBotMessageNotification: React.FC<ChatBotMessageNotificationProps> = ({
  message,
  onUpdateNotification
}) => {
  const computedMessage = useMemo(() => {
    const text = message.text;
    if (typeof text === 'object' && text !== null) {
      return JSON.stringify(text, null, 2);
    }

    return HelperMarkdown.parseMarkdown(text);
  }, [message.text]);

  const date = useMemo(() => {
    if (!message.last_modified) return '';
    return dayjs(message.last_modified).format('DD/MM/YYYY HH:mm:ss');
  }, [message.last_modified]);

  return (
    <div className={`chat-bot-message-notification ${message.editable ? 'chat-bot-message-notification--editable' : ''}`}>
      <div className="chat-bot-message-notification__title">
        <span className="chat-bot-message-notification__cyoda-wrapper-icon">
          <NotificationIcon />
        </span>
        <span>Notification | <small className="chat-bot-message-notification__date">{date}</small></span>
      </div>
      
      <div 
        dangerouslySetInnerHTML={{ __html: computedMessage }} 
        className="chat-bot-message-notification__body"
      />
    </div>
  );
};

export default ChatBotMessageNotification;
