import React, { useState, useEffect, useRef } from 'react';
import { Modal } from 'antd';
import { useParams } from 'react-router-dom';
import ChatBot from '@/components/ChatBot/ChatBot';
import { useAssistantStore } from '@/stores/assistant';

interface Message {
  id: string;
  text: string;
  file?: File;
  editable?: boolean;
  approve?: boolean;
  raw?: any;
  type: 'question' | 'answer' | 'notification' | 'ui_function';
}

const ChatBotView: React.FC = () => {
  const { technicalId } = useParams<{ technicalId: string }>();
  const assistantStore = useAssistantStore();
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatData, setChatData] = useState<any>(null);

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const promiseIntervalRef = useRef<Promise<any> | null>(null);

  const BASE_INTERVAL = parseInt(import.meta.env.VITE_APP_QUESTION_POLLING_INTERVAL_MS) || 5000;
  const MAX_INTERVAL = parseInt(import.meta.env.VITE_APP_QUESTION_MAX_POLLING_INTERVAL) || 7000;
  const JITTER_PERCENT = 0.1;
  const currentIntervalRef = useRef(BASE_INTERVAL);

  // Add message to the messages array
  const addMessage = (el: any): boolean => {
    let type = 'answer';
    if (el.question) type = 'question';
    else if (el.notification) type = 'notification';
    else if (el.type === 'ui_function') type = 'ui_function';

    let messageAdded = false;

    // Use functional update to access current state
    setMessages(prevMessages => {
      // Check if message already exists in current state
      const existingMessage = prevMessages.find(m => m.id === el.technical_id);
      if (existingMessage) {
        messageAdded = false;
        return prevMessages; // No change
      }

      const newMessage: Message = {
        id: el.technical_id,
        text: el.message || el.answer,
        file: el.file,
        editable: !!el.editable,
        approve: !!el.approve,
        last_modified: el.last_modified,
        raw: el,
        type: type as Message['type']
      };

      messageAdded = true;
      return [...prevMessages, newMessage];
    });

    return messageAdded;
  };

  // Load chat history
  const loadChatHistory = async (id?: string): Promise<boolean> => {
    if (id && id !== technicalId) return false;
    if (promiseIntervalRef.current || !technicalId) return false;

    abortControllerRef.current = new AbortController();
    const newResults: boolean[] = [];
    const isFirstRequest = messages.length === 0;

    try {
      promiseIntervalRef.current = assistantStore.getChatById(technicalId, {
        signal: abortControllerRef.current.signal
      });
      const { data } = await promiseIntervalRef.current;
      setChatData(data);

      // Process all messages and get the last one
      let lastProcessedMessage: any = null;
      data.chat_body.dialogue.forEach((el: any) => {
        const result = addMessage(el);
        newResults.push(result);
        lastProcessedMessage = el; // Keep track of the last message processed
      });

      // Check if the last message in the dialogue is a question or ui_function
      // This indicates the AI has finished processing and the chat should be unblocked
      const dialogue = data.chat_body.dialogue;
      if (dialogue && dialogue.length > 0) {
        const lastMessage = dialogue[dialogue.length - 1];
        const messageType = lastMessage.question ? 'question' :
                           lastMessage.type === 'ui_function' ? 'ui_function' : 'answer';

        if (['question', 'ui_function'].includes(messageType)) {
          setIsLoading(false);
        }
      }
    } finally {
      promiseIntervalRef.current = null;
    }

    return newResults.some(el => el);
  };

  // Poll for new messages
  const pollChat = async () => {
    try {
      const gotNew = await loadChatHistory();
      currentIntervalRef.current = gotNew ? BASE_INTERVAL : Math.min(currentIntervalRef.current * 2, MAX_INTERVAL);
    } catch (err) {
      currentIntervalRef.current = Math.min(currentIntervalRef.current * 2, MAX_INTERVAL);
    }

    const jitterFactor = 1 + (Math.random() * 2 - 1) * JITTER_PERCENT;
    const nextDelay = Math.round(currentIntervalRef.current * jitterFactor);
    pollTimeoutRef.current = setTimeout(pollChat, nextDelay);
  };

  const onAnswer = async (data: { answer: string; file?: File }) => {
    if (!technicalId) return;

    setDisabled(true);
    try {
      let response;
      if (data.file) {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('answer', data.answer);
        const result = await assistantStore.postAnswers(technicalId, formData);
        response = result.data;
      } else {
        const result = await assistantStore.postTextAnswers(technicalId, data);
        response = result.data;
      }

      if (response?.answer_technical_id) {
        // Add the answer message immediately
        const answerMessage = {
          technical_id: response.answer_technical_id,
          answer: data.answer,
          file: data.file
        };
        addMessage(answerMessage);
        setIsLoading(true);
        loadChatHistory();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setDisabled(false);
    }
  };

  const onApproveQuestion = async (data: any) => {
    if (!technicalId) return;
    setIsLoading(true);
    try {
      await assistantStore.postApproveQuestion(technicalId, data);
    } catch (error) {
      console.error('Error approving question:', error);
      setIsLoading(false);
    }
    await loadChatHistory();
  };

  const onUpdateNotification = async (data: any) => {
    if (!technicalId) return;
    setIsLoading(true);
    try {
      await assistantStore.putNotification(technicalId, data);
    } catch (error) {
      console.error('Error updating notification:', error);
      setIsLoading(false);
    }
    await loadChatHistory();
  };

  const onToggleCanvas = () => {
    setCanvasVisible(!canvasVisible);
  };

  // Initialize chat and start polling
  useEffect(() => {
    if (!technicalId) return;

    setIsLoading(true);
    setMessages([]);
    setChatData(null);

    // Clear any existing polling
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Start polling
    pollChat();

    return () => {
      // Cleanup on unmount or technicalId change
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [technicalId]);

  // Update disabled state based on loading
  useEffect(() => {
    setDisabled(isLoading);
  }, [isLoading]);

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
        chatData={chatData}
        canvasVisible={canvasVisible}
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
