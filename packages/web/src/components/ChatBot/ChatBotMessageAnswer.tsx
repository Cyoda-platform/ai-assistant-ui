import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { User, Clock, Copy, Check } from 'lucide-react';
import FilePreview from '@/components/FilePreview/FilePreview';
import { useAuthStore } from '@/stores/auth';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import { useTextResponsiveContainer } from '@/hooks/useTextResponsiveContainer';

interface Message {
  text: string | object;
  last_modified?: string;
  file?: File;
  files?: File[];
}

interface ChatBotMessageAnswerProps {
  message: Message;
}

const ChatBotMessageAnswer: React.FC<ChatBotMessageAnswerProps> = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const authStore = useAuthStore();

  const messageText = useMemo(() => {
    let text = message.text;
    if (!text) return '';

    if (typeof text === 'object') {
      return JSON.stringify(text, null, 2);
    }

    return text;
  }, [message.text]);

  const date = useMemo(() => {
    if (!message.last_modified) return '';
    return dayjs(message.last_modified).format('HH:mm');
  }, [message.last_modified]);

  // User avatar and initials
  const userAvatar = authStore.picture;
  const userInitials = useMemo(() => {
    const { family_name = 'C', given_name = 'U' } = authStore;
    const familyInitial = family_name.charAt(0).toUpperCase();
    const givenInitial = given_name.charAt(0).toUpperCase();
    return `${givenInitial}${familyInitial}`;
  }, [authStore.family_name, authStore.given_name]);

  const userName = useMemo(() => {
    const { given_name, family_name } = authStore;
    if (given_name && family_name) {
      return `${given_name} ${family_name}`;
    }
    if (given_name) return given_name;
    if (family_name) return family_name;
    return 'You';
  }, [authStore.given_name, authStore.family_name]);

  // Get responsive container class based on message text length
  const containerInfo = useTextResponsiveContainer(messageText, {
    baseClass: 'text-responsive-container user-message'
  });

  const currentFile = message.file || null;
  const currentFiles = message.files || (currentFile ? [currentFile] : []);

  const handleCopy = async () => {
    try {
      const textToCopy = typeof message.text === 'object'
        ? JSON.stringify(message.text, null, 2)
        : message.text;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="flex justify-end mb-2 animate-fade-in-up">
      <div className="flex items-start space-x-2 max-w-[85%]">
        {/* Message Content Container */}
        <div className="flex flex-col items-end space-y-1.5 flex-1">
          {/* User Badge */}
          <div className="flex items-center space-x-1.5">
            {date && (
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Clock size={10} />
                <span className="text-[10px]">{date}</span>
              </div>
            )}
            <div className="flex items-center space-x-1 bg-slate-800/50 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-600">
              <span className="text-[10px] font-medium text-slate-300">{userName}</span>
              <User size={10} className="text-teal-400" />
            </div>
          </div>

          {/* Message Bubble - Right aligned user message */}
          <div className={`${containerInfo.className} relative group`}>
            <div className="text-sm pr-6">
              <MarkdownRenderer>
                {messageText}
              </MarkdownRenderer>
            </div>
            {currentFiles.length > 0 && (
              <div className="mt-3 pt-3 border-t border-teal-500/30">
                <div className="flex flex-wrap gap-2">
                  {currentFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="text-xs">
                      <FilePreview file={file} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Copy Button - Inside message container, top right */}
            <button
              onClick={handleCopy}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded bg-teal-600/30 hover:bg-teal-600/50 text-slate-300 hover:text-white transition-all duration-200 flex items-center justify-center border border-teal-500/30"
              title="Copy message"
            >
              {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
            </button>
          </div>
        </div>

        {/* User Avatar */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden border border-teal-500/30">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-semibold">
              {userInitials}
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default ChatBotMessageAnswer;
