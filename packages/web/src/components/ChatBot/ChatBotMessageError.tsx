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
  const containerInfo = useTextResponsiveContainer(message.text);
  const date = message.last_modified 
    ? dayjs(message.last_modified).format('DD/MM/YYYY HH:mm:ss')
    : dayjs().format('DD/MM/YYYY HH:mm:ss');

  return (
    <div className="w-full flex justify-start mb-6">
      <div className="max-w-[85%]">
        {/* Error Badge */}
        <div className="flex items-center space-x-2 mb-2 ml-12">
          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertCircle size={10} />
            <span>ERROR</span>
          </span>
          <span className="text-xs text-slate-500">{date}</span>
        </div>

        {/* Error Message Bubble */}
        <div className="flex items-start space-x-3">
          {/* Error Icon Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <AlertCircle size={20} className="text-white" />
          </div>

          {/* Error Content */}
          <div className={`${containerInfo.className} rounded-tl-md`}>
            <div className="flex items-start">
              <div className="flex-1 min-w-0">
                <p className="text-base text-red-100 leading-relaxed whitespace-pre-wrap break-words">
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

