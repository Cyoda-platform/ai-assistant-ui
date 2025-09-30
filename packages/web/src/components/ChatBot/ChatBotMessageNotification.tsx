import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Bell, Clock, Sparkles } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import LogoSmall from '@/assets/images/logo-small.svg';

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

  return (
    <div className="flex justify-start mb-6 animate-fade-in-up">
      <div className="flex items-start space-x-3 w-full max-w-[95%]">
        {/* Notification Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
          <img src={LogoSmall} alt="CYODA" className="w-10 h-10" />
        </div>

        <div className="flex-1">
          {/* Notification Badge */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center space-x-1.5 bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-600">
              <Sparkles size={12} className="text-pink-400" />
              <span className="text-xs font-medium text-slate-300">CYODA NOTIFICATION</span>
            </div>
            {date && (
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Clock size={12} />
                <span>{date}</span>
              </div>
            )}
          </div>

          {/* Message Bubble */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl rounded-tl-md px-6 py-4 shadow-lg hover:shadow-xl hover:border-slate-600 transition-all duration-200">
            <MarkdownRenderer>
              {messageText}
            </MarkdownRenderer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBotMessageNotification;
