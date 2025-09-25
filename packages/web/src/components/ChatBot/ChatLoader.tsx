import React from 'react';
import { Spin } from 'antd';

const ChatLoader: React.FC = () => {
  return (
    <div className="chat-loader">
      <Spin size="large" />
      <p>Loading...</p>
    </div>
  );
};

export default ChatLoader;
