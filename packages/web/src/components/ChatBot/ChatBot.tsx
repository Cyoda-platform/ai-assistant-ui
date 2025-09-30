import React, { useEffect, useRef, useState } from 'react';
import { Row, Col } from 'antd';
import ChatBotSubmitForm from './ChatBotSubmitForm';
import ChatLoader from './ChatLoader';
import ChatBotMessageQuestion from './ChatBotMessageQuestion';
import ChatBotMessageNotification from './ChatBotMessageNotification';
import ChatBotMessageAnswer from './ChatBotMessageAnswer';
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
  chatData?: any;
  canvasVisible?: boolean;
  chatHistoryVisible?: boolean;
  onAnswer: (data: { answer: string; file?: File }) => void;
  onApproveQuestion: (data: any) => void;
  onUpdateNotification: (data: any) => void;
  onToggleCanvas: () => void;
  onEntitiesDetails?: () => void;
  onToggleChatHistory?: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({
  isLoading,
  disabled,
  messages,
  technicalId,
  chatData,
  canvasVisible = false,
  onAnswer,
  onApproveQuestion,
  onUpdateNotification,
  onToggleCanvas,
  onEntitiesDetails
}) => {
  const chatBotPlaceholderRef = useRef<HTMLDivElement>(null);
  const [chatBotPlaceholderHeight, setChatBotPlaceholderHeight] = useState(0);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollDownMessages = (smooth = false) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
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
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 h-full">
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto chat-container min-h-0"
      >
        <div className="max-w-[90%] mx-auto p-6 w-full">
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div key={index} className="w-full">
                {renderMessage(message, index)}
              </div>
            ))}
            {isLoading && (
              <div className="w-full">
                <ChatLoader />
              </div>
            )}
            <div
              ref={chatBotPlaceholderRef}
              className="h-4"
            />
          </div>
        </div>
      </div>

      {/* Input Area at Bottom */}
      <div className="border-t border-slate-700 glass p-4 flex-shrink-0">
        <div className="max-w-[90%] mx-auto w-full">
          <ChatBotSubmitForm
            disabled={disabled}
            onAnswer={onAnswer}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
