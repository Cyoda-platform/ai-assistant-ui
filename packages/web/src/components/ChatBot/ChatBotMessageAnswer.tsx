import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import FilePreview from '@/components/FilePreview/FilePreview';
import HelperMarkdown from '@/helpers/HelperMarkdown';

interface Message {
  text: string | object;
  last_modified?: string;
  file?: File;
}

interface ChatBotMessageAnswerProps {
  message: Message;
}

const ChatBotMessageAnswer: React.FC<ChatBotMessageAnswerProps> = ({ message }) => {
  const computedMessage = useMemo(() => {
    let text = message.text;
    if (!text) return '';
    
    if (typeof text === 'object') {
      return JSON.stringify(text, null, 2);
    }

    return HelperMarkdown.parseMarkdown(text);
  }, [message.text]);

  const date = useMemo(() => {
    if (!message.last_modified) return '';
    return dayjs(message.last_modified).format('DD/MM/YYYY HH:mm:ss');
  }, [message.last_modified]);

  const currentFile = message.file || null;

  return (
    <div className="chat-bot-message-answer">
      <div className="chat-bot-message-answer__title">
        <span>USER | <small className="chat-bot-message-answer__date">{date}</small></span>
      </div>
      <div 
        dangerouslySetInnerHTML={{ __html: computedMessage }} 
        className="chat-bot-message-answer__body"
      />
      {currentFile && <FilePreview file={currentFile} />}
    </div>
  );
};

export default ChatBotMessageAnswer;
