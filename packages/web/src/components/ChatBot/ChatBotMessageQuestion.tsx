import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Bot, Clock, Sparkles, CheckCircle } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import { useTextResponsiveContainer } from '@/hooks/useTextResponsiveContainer';

interface Message {
  text: string | object;
  last_modified?: string;
  raw?: any;
  approve?: boolean;
}

interface ChatBotMessageQuestionProps {
  message: Message;
  isLoading: boolean;
  onApproveQuestion: (data: any) => void;
}

const ChatBotMessageQuestion: React.FC<ChatBotMessageQuestionProps> = ({
  message,
  isLoading,
  onApproveQuestion
}) => {
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);

  const messageText = useMemo(() => {
    const text = message.text;
    if (typeof text === 'object' && text !== null) {
      return JSON.stringify(text, null, 2);
    }
    return text;
  }, [message.text]);

  const date = useMemo(() => {
    if (!message.last_modified) return '';
    return dayjs(message.last_modified).format('HH:mm');
  }, [message.last_modified]);

  // Get responsive container class for bot message (left-aligned)
  const containerInfo = useTextResponsiveContainer(messageText, {
    baseClass: 'text-responsive-container bot-message'
  });

  const onClickApproveQuestion = () => {
    setIsLoadingApprove(true);
    onApproveQuestion(message.raw);
    setTimeout(() => {
      setIsLoadingApprove(false);
    }, 2000);
  };

  return (
    <div className="flex justify-start mb-6 animate-fade-in-up">
      <div className="flex items-start space-x-3 w-full max-w-[95%]">
        {/* AI Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-purple-400/30">
          <Bot size={18} className="text-white" />
        </div>

        <div className="flex-1">
          {/* AI Badge */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center space-x-1.5 bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-600">
              <Sparkles size={12} className="text-purple-400" />
              <span className="text-xs font-medium text-slate-300">CYODA AI</span>
            </div>
            {date && (
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Clock size={12} />
                <span>{date}</span>
              </div>
            )}
          </div>

          {/* Message Bubble - Left aligned bot message */}
          <div className={containerInfo.className}>
            <MarkdownRenderer className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {messageText}
            </MarkdownRenderer>
          </div>

          {/* Message Actions */}
          {message.approve && (
            <div className="flex items-center justify-start mt-2 px-2">
              <button
                onClick={onClickApproveQuestion}
                disabled={isLoading || isLoadingApprove}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none border border-green-400/20"
                title="Approve this response"
              >
                {isLoadingApprove ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                <span className="text-sm font-medium">Approve</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBotMessageQuestion;
