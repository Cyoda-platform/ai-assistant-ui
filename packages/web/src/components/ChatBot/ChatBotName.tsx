import React from 'react';

interface ChatBotNameProps {
  technicalId: string;
}

const ChatBotName: React.FC<ChatBotNameProps> = ({ technicalId }) => {
  return (
    <div className="chat-bot-name">
      <h3>Chat {technicalId}</h3>
    </div>
  );
};

export default ChatBotName;
