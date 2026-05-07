import React from 'react';
import { AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { useTextResponsiveContainer } from '@/hooks/useTextResponsiveContainer';

interface Message {
  type: string;
  text: string;
  raw?: any;
  last_modified?: string;
}

interface ChatBotMessageErrorProps {
  message: Message;
}

const ChatBotMessageError: React.FC<ChatBotMessageErrorProps> = ({ message }) => {
  const containerInfo = useTextResponsiveContainer(message.text, {
    baseClass: 'text-responsive-container bot-message'
  });
  const date = message.last_modified
    ? dayjs(message.last_modified).format('DD/MM/YYYY HH:mm:ss')
    : dayjs().format('DD/MM/YYYY HH:mm:ss');

  return (
    <div className="w-full flex justify-start mb-6 px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl w-full">
        {/* Error Badge */}
        <div className="flex items-center space-x-2 mb-2 ml-14">
          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
            <AlertCircle size={10} />
            <span>ERROR</span>
          </span>
          <span className="text-xs text-slate-500">{date}</span>
        </div>

        {/* Error Message Bubble */}
        <div className="flex items-start space-x-3">
          {/* Error Icon Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <AlertCircle size={24} className="text-white" />
          </div>

          {/* Error Content */}
          <div className={`${containerInfo.className} rounded-tl-md`}>
            <div className="flex items-start">
              <div className="flex-1 min-w-0">
                <p className="text-base text-red-700 leading-relaxed whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBotMessageError;

