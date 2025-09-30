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
    <div className="flex justify-end mb-3 animate-fade-in-up">
      <div className="flex items-start space-x-3 max-w-[85%]">
        {/* Message Content Container */}
        <div className="flex flex-col items-end space-y-2 flex-1">
          {/* User Badge */}
          <div className="flex items-center space-x-2">
            {date && (
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Clock size={12} />
                <span>{date}</span>
              </div>
            )}
            <div className="flex items-center space-x-1.5 bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-600">
              <span className="text-xs font-medium text-slate-300">{userName}</span>
              <User size={12} className="text-teal-400" />
            </div>
          </div>

          {/* Message Bubble - Right aligned user message */}
          <div className={`${containerInfo.className} relative group pb-12`}>
            <MarkdownRenderer>
              {messageText}
            </MarkdownRenderer>
            {currentFiles.length > 0 && (
              <div className="mt-4 pt-4 border-t border-teal-500/30">
                <div className="flex flex-wrap gap-3">
                  {currentFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="text-xs">
                      <FilePreview file={file} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Copy Button - Bottom Right Corner */}
            <button
              onClick={handleCopy}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              title="Copy message"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* User Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden border-2 border-teal-500/30">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
              {userInitials}
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default ChatBotMessageAnswer;
