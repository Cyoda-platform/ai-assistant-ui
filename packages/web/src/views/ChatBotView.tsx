import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { useParams } from 'react-router-dom';
import ChatBot from '@/components/ChatBot/ChatBot';
import { useAssistantStore } from '@/stores/assistant';

const ChatBotView: React.FC = () => {
  const { technicalId } = useParams<{ technicalId: string }>();
  const assistantStore = useAssistantStore();
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // Get messages from store or mock data for now
  const messages = assistantStore.messages || [];

  const onAnswer = async (data: { answer: string; file?: File }) => {
    setIsLoading(true);
    try {
      // Handle answer submission
      console.log('Answer submitted:', data);
      // await assistantStore.submitAnswer(data);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onApproveQuestion = async (data: any) => {
    try {
      console.log('Question approved:', data);
      // await assistantStore.approveQuestion(data);
    } catch (error) {
      console.error('Error approving question:', error);
    }
  };

  const onUpdateNotification = async (data: any) => {
    try {
      console.log('Notification updated:', data);
      // await assistantStore.updateNotification(data);
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const onToggleCanvas = () => {
    setCanvasVisible(!canvasVisible);
  };

  if (!technicalId) {
    return <div>No chat ID provided</div>;
  }

  return (
    <>
      <ChatBot
        technicalId={technicalId}
        onAnswer={onAnswer}
        onApproveQuestion={onApproveQuestion}
        onToggleCanvas={onToggleCanvas}
        onUpdateNotification={onUpdateNotification}
        disabled={disabled}
        isLoading={isLoading}
        messages={messages}
      />

      <Modal
        open={canvasVisible}
        onCancel={onToggleCanvas}
        width="100%"
        style={{ top: 0, height: '100vh' }}
        className="chat-bot-dialog"
        footer={null}
        closable={true}
      >
        {/* ChatBotCanvas placeholder */}
        <div>
          <h2>Canvas View</h2>
          <p>Canvas implementation placeholder</p>
        </div>
      </Modal>
    </>
  );
};

export default ChatBotView;
