import React, { useEffect, useRef, useState } from 'react';
import { Row, Col } from 'antd';
import ChatBotSubmitForm from './ChatBotSubmitForm';
import ChatLoader from './ChatLoader';
import ChatBotMessageQuestion from './ChatBotMessageQuestion';
import ChatBotMessageNotification from './ChatBotMessageNotification';
import ChatBotMessageAnswer from './ChatBotMessageAnswer';
import ChatBotTopActions from './ChatBotTopActions';
import ChatBotName from './ChatBotName';
import ChatBotMessageFunction from './ChatBotMessageFunction';

interface Message {
  type: 'question' | 'answer' | 'notification' | 'ui_function';
  text: string;
  raw?: any;
  last_modified?: string;
  file?: File;
  approve?: boolean;
  editable?: boolean;
}

interface ChatBotProps {
  isLoading: boolean;
  disabled: boolean;
  messages: Message[];
  technicalId: string;
  onAnswer: (data: { answer: string; file?: File }) => void;
  onApproveQuestion: (data: any) => void;
  onUpdateNotification: (data: any) => void;
  onToggleCanvas: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({
  isLoading,
  disabled,
  messages,
  technicalId,
  onAnswer,
  onApproveQuestion,
  onUpdateNotification,
  onToggleCanvas
}) => {
  const chatBotPlaceholderRef = useRef<HTMLDivElement>(null);
  const [chatBotPlaceholderHeight, setChatBotPlaceholderHeight] = useState(0);

  const scrollDownMessages = () => {
    const messagesHtml = document.querySelector('.chat-bot__inner-messages');
    if (messagesHtml) {
      messagesHtml.scrollTo(0, messagesHtml.scrollHeight);
    }
  };

  const getOffset = (type: string) => {
    if (type === 'answer') return 9;
    return ['question', 'notification', 'ui_function'].includes(type) ? 1 : 8;
  };

  const getSpan = (type: string) => {
    return ['question', 'notification', 'ui_function'].includes(type) ? 22 : 14;
  };

  useEffect(() => {
    // Auto-scroll when messages change
    scrollDownMessages();
  }, [messages]);

  const renderMessage = (message: Message, index: number) => {
    switch (message.type) {
      case 'question':
        return (
          <ChatBotMessageQuestion
            key={index}
            message={message}
            isLoading={isLoading}
            onApproveQuestion={onApproveQuestion}
          />
        );
      case 'notification':
        return (
          <ChatBotMessageNotification
            key={index}
            message={message}
            onUpdateNotification={onUpdateNotification}
          />
        );
      case 'answer':
        return (
          <ChatBotMessageAnswer
            key={index}
            message={message}
          />
        );
      case 'ui_function':
        return (
          <ChatBotMessageFunction
            key={index}
            message={message}
            onApproveQuestion={onApproveQuestion}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="chat-bot">
      <ChatBotTopActions onToggleCanvas={onToggleCanvas}>
        <ChatBotName technicalId={technicalId} />
      </ChatBotTopActions>

      <div className="chat-bot__body">
        <div className="chat-bot__messages">
          <div className="chat-bot__inner-messages">
            {messages.map((message, index) => (
              <Row key={index}>
                <Col 
                  className="chat-bot__inner-messages-col" 
                  offset={getOffset(message.type)}
                  span={getSpan(message.type)}
                >
                  {renderMessage(message, index)}
                </Col>
              </Row>
            ))}
            {isLoading && <ChatLoader />}
            <div 
              ref={chatBotPlaceholderRef} 
              className="chat-bot__placeholder" 
              style={{ minHeight: `${chatBotPlaceholderHeight}px` }}
            />
          </div>
          <div className="chat-bot__form">
            <ChatBotSubmitForm 
              disabled={disabled} 
              onAnswer={onAnswer}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
