import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Home,
  History,
  Settings,
  HelpCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  X
} from 'lucide-react';
import ChatBot from '@/components/ChatBot/ChatBot';
import ChatBotCanvas from '@/components/ChatBot/ChatBotCanvas';
import Header from '@/components/Header/Header';
import { NotificationManager, useNotifications } from '@/components/Notification/Notification';
import { useAssistantStore } from '@/stores/assistant';
import EntityDataPanel from '@/components/EntityDataPanel/EntityDataPanel';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';
import { useResizablePanel } from '@/hooks/useResizablePanel';

interface Message {
  id: string;
  text: string;
  file?: File;
  editable?: boolean;
  approve?: boolean;
  raw?: any;
  type: 'question' | 'answer' | 'notification' | 'ui_function';
}

interface HeaderNotification {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const ChatBotView: React.FC = () => {
  const { technicalId } = useParams<{ technicalId: string }>();
  const navigate = useNavigate();
  const assistantStore = useAssistantStore();
  const { notifications, removeNotification, showSuccess, showError, showInfo } = useNotifications();
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [isEntityDataOpen, setIsEntityDataOpen] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatData, setChatData] = useState<any>(null);
  const [headerNotifications, setHeaderNotifications] = useState<HeaderNotification[]>([]);
  const notificationIdCounter = useRef(1);

  // Resizable panels - start at max width
  const chatHistoryResize = useResizablePanel({
    defaultWidth: 400, // Start at maximum width
    minWidth: 200,     // Minimum width for chat names
    maxWidth: 400,     // Maximum width to not overwhelm
    storageKey: 'chatHistory-width'
  });

  const entityDataResize = useResizablePanel({
    defaultWidth: 600, // Start at maximum width
    minWidth: 320,     // Minimum width for entity details
    maxWidth: 600,     // Maximum width
    storageKey: 'entityData-width'
  });

  const canvasResize = useResizablePanel({
    defaultWidth: 800, // Start at maximum width for canvas
    minWidth: 400,     // Minimum width for canvas
    maxWidth: 1200,    // Maximum width for canvas
    storageKey: 'canvas-width'
  });

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const promiseIntervalRef = useRef<Promise<any> | null>(null);

  const BASE_INTERVAL = parseInt(import.meta.env.VITE_APP_QUESTION_POLLING_INTERVAL_MS) || 5000;
  const MAX_INTERVAL = parseInt(import.meta.env.VITE_APP_QUESTION_MAX_POLLING_INTERVAL) || 7000;
  const JITTER_PERCENT = 0.1;
  const currentIntervalRef = useRef(BASE_INTERVAL);

  // Keyboard shortcuts for canvas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+F or F11 for fullscreen toggle (only when canvas is open)
      if (canvasVisible && ((e.ctrlKey && e.shiftKey && e.key === 'F') || e.key === 'F11')) {
        e.preventDefault();
        setIsCanvasFullscreen(!isCanvasFullscreen);
      }
      // Escape to exit fullscreen
      if (isCanvasFullscreen && e.key === 'Escape') {
        e.preventDefault();
        setIsCanvasFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canvasVisible, isCanvasFullscreen]);

  // Add header notification for new messages
  const addHeaderNotification = (message: Message) => {
    const now = new Date();
    const timestamp = 'Just now';

    if (message.type === 'question') {
      // For questions - ring the bell (increase count)
      const notification: HeaderNotification = {
        id: notificationIdCounter.current++,
        type: 'info',
        title: 'New Question',
        message: message.text.substring(0, 100) + (message.text.length > 100 ? '...' : ''),
        timestamp,
        isRead: false
      };
      setHeaderNotifications(prev => [notification, ...prev]);
    } else if (message.type === 'notification') {
      // For notifications - just add info, don't increase count
      const notification: HeaderNotification = {
        id: notificationIdCounter.current++,
        type: 'warning',
        title: 'System Notification',
        message: message.text.substring(0, 100) + (message.text.length > 100 ? '...' : ''),
        timestamp,
        isRead: true // Mark as read so it doesn't increase the count
      };
      setHeaderNotifications(prev => [notification, ...prev]);
    }
  };

  // Add message to the messages array
  const addMessage = (el: any, isNewMessage: boolean = false): boolean => {
    let type = 'answer';
    if (el.question) type = 'question';
    else if (el.notification) type = 'notification';
    else if (el.type === 'ui_function') type = 'ui_function';

    let messageAdded = false;
    let newMessageObj: Message | null = null;

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
      newMessageObj = newMessage;
      return [...prevMessages, newMessage];
    });

    // Add header notification if this is a new message from polling
    if (messageAdded && isNewMessage && newMessageObj) {
      addHeaderNotification(newMessageObj);
    }

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

      // Only update chatData if entities_data has changed or is not empty
      // This prevents flickering when entities_data temporarily becomes empty during polling
      const newEntitiesData = data?.chat_body?.entities_data;
      const currentEntitiesData = chatData?.chat_body?.entities_data;

      // Check if entities data has actually changed
      const entitiesChanged = JSON.stringify(newEntitiesData) !== JSON.stringify(currentEntitiesData);

      // Update chatData only if:
      // 1. It's the first load (chatData is null)
      // 2. Entities data has changed
      // 3. New entities data is not empty/undefined
      if (!chatData || entitiesChanged || (newEntitiesData && Object.keys(newEntitiesData).length > 0)) {
        setChatData(data);
      }

      // Process all messages and get the last one
      let lastProcessedMessage: any = null;
      data.chat_body.dialogue.forEach((el: any) => {
        // Mark as new message if not first request (polling detected new message)
        const result = addMessage(el, !isFirstRequest);
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

        console.log('=== Chat Blocking Logic ===');
        console.log('Last message type:', messageType);
        console.log('Last message:', lastMessage);
        console.log('Should unblock?', ['question', 'ui_function'].includes(messageType));
        console.log('==========================');

        if (['question', 'ui_function'].includes(messageType)) {
          console.log('✅ UNBLOCKING CHAT - Question or UI Function received');
          setIsLoading(false);
          setDisabled(false); // Unblock the chat when question or ui_function arrives
        } else {
          console.log('🔒 KEEPING CHAT BLOCKED - Waiting for question or ui_function');
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

    // Show sending notification
    showInfo('Message Sent', 'Your message is being processed by CYODA AI...');

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

        // Show success notification
        setTimeout(() => {
          showSuccess('Response Received', 'CYODA AI has processed your request and is generating a response.');
        }, 1000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      showError('Message Failed', 'Failed to send your message. Please try again.');
      setDisabled(false);
    }
  };

  const onApproveQuestion = async (data: any) => {
    if (!technicalId) return;
    setIsLoading(true);
    setDisabled(true); // Block the chat when approving
    try {
      await assistantStore.postApproveQuestion(technicalId, data);
    } catch (error) {
      console.error('Error approving question:', error);
      setIsLoading(false);
      setDisabled(false);
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
    // Exit fullscreen when closing canvas
    if (canvasVisible && isCanvasFullscreen) {
      setIsCanvasFullscreen(false);
    }
  };

  const onToggleCanvasFullscreen = () => {
    const newFullscreenState = !isCanvasFullscreen;
    setIsCanvasFullscreen(newFullscreenState);

    // Close chat history when entering fullscreen mode
    if (newFullscreenState) {
      setIsChatHistoryOpen(false);
    }
  };

  const onEntitiesDetails = () => {
    setIsEntityDataOpen(!isEntityDataOpen);
  };

  // Handle notification actions
  const handleMarkNotificationAsRead = (id: number) => {
    setHeaderNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setHeaderNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  // Load chat list for sidebar
  useEffect(() => {
    assistantStore.getChats();
  }, []);

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

  // Group chats by date similar to HomeView
  const groupChatsByDate = (chats: any[]) => {
    if (!chats || chats.length === 0) return [];

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const isSameDay = (date1: Date, date2: Date) =>
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();

    const todayChats: any[] = [];
    const yesterdayChats: any[] = [];
    const previousWeekChats: any[] = [];
    const olderChats: any[] = [];

    chats.forEach(chat => {
      const chatDate = new Date(chat.last_modified || chat.date);

      if (isSameDay(chatDate, today)) {
        todayChats.push(chat);
      } else if (isSameDay(chatDate, yesterday)) {
        yesterdayChats.push(chat);
      } else if (chatDate >= sevenDaysAgo) {
        previousWeekChats.push(chat);
      } else {
        olderChats.push(chat);
      }
    });

    return [
      { title: 'Today', chats: todayChats },
      { title: 'Yesterday', chats: yesterdayChats },
      { title: 'Previous week', chats: previousWeekChats },
      { title: 'Older', chats: olderChats }
    ].filter(group => group.chats.length > 0);
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const chatGroups = groupChatsByDate(assistantStore.chatList || []);
  const hasChats = chatGroups.length > 0;

  return (
    <div className="main-layout bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
      <Header
        showActions={true}
        onToggleCanvas={onToggleCanvas}
        onToggleChatHistory={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
        onToggleEntities={onEntitiesDetails}
        canvasVisible={canvasVisible}
        chatHistoryVisible={isChatHistoryOpen}
        entitiesVisible={isEntityDataOpen}
        notifications={headerNotifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
      />
      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Enhanced Left Sidebar - Resizable Chat History Panel */}
        {isChatHistoryOpen && (
          <div
            className={`bg-slate-800/90 backdrop-blur-sm border-r border-slate-700 flex flex-col relative resizable-panel ${chatHistoryResize.isResizing ? 'resizing' : ''}`}
            style={{ width: `${chatHistoryResize.width}px` }}
          >
          {/* Header with Close Button */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Chat History</h3>
              <button
                onClick={() => setIsChatHistoryOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                title="Close chat history"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col p-4 space-y-2 overflow-hidden">
            <div
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 text-slate-300 hover:text-white cursor-pointer p-3 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group"
            >
              <Home size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Home</span>
            </div>

            <div className="flex-1 flex flex-col space-y-1 overflow-hidden">
              <div className="flex items-center space-x-3 text-white cursor-pointer p-3 rounded-lg bg-teal-500/20 border border-teal-500/30 group">
                <History size={18} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Current Chat</span>
              </div>

              {/* Chat History */}
              <div className="px-3 space-y-3 flex-1 overflow-y-auto chat-container">
                {hasChats ? (
                  chatGroups.map((group) => (
                    <div key={group.title} className="space-y-1">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 py-1">
                        {group.title}
                      </div>
                      <div className="space-y-1">
                        {group.chats.map((chat) => (
                          <div
                            key={chat.technical_id}
                            onClick={() => navigate(`/chat/${chat.technical_id}`)}
                            className={`text-slate-400 hover:text-white cursor-pointer px-3 py-2 rounded-md hover:bg-slate-700/30 transition-all duration-200 text-sm ${
                              chat.technical_id === technicalId ? 'text-teal-400 hover:text-teal-300 bg-teal-500/10 border border-teal-500/20' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Clock size={14} className={chat.technical_id === technicalId ? 'text-teal-400' : 'text-slate-500'} />
                              <span className="truncate flex-1" title={chat.name || chat.description}>
                                {chat.name || chat.description || 'Untitled Chat'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-1 ml-5">
                              {formatRelativeTime(chat.last_modified || chat.date)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-4 text-center">
                    <div className="text-sm text-slate-500 mb-2">No chat history yet</div>
                    <div className="text-xs text-slate-600">Start a conversation to see your chats here</div>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-700 space-y-2">
            <a
              href="https://cyoda.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 text-slate-400 hover:text-white cursor-pointer p-3 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group"
            >
              <HelpCircle size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Help & Support</span>
            </a>
            <div className="flex items-center space-x-3 text-slate-400 hover:text-white cursor-pointer p-3 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group">
              <Settings size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Settings</span>
            </div>
          </div>

          {/* Resize Handle for Chat History Panel */}
          <ResizeHandle
            onMouseDown={chatHistoryResize.handleMouseDown}
            isResizing={chatHistoryResize.isResizing}
            position="right"
          />
          </div>
        )}



        {/* Canvas Sidebar Panel - Between chat history and main content */}
        {canvasVisible && (
          <div
            className={`bg-slate-800/95 backdrop-blur-sm border-r border-slate-600 flex flex-col relative resizable-panel ${canvasResize.isResizing ? 'resizing' : ''} ${
              isCanvasFullscreen ? 'fixed inset-0 z-50 w-full' : ''
            }`}
            style={isCanvasFullscreen ? {} : { width: `${canvasResize.width}px` }}
          >
            <ChatBotCanvas
              technicalId={technicalId}
              messages={messages}
              isLoading={isLoading}
              onAnswer={onAnswer}
              onApproveQuestion={onApproveQuestion}
              onUpdateNotification={onUpdateNotification}
              onToggleCanvas={onToggleCanvas}
              isFullscreen={isCanvasFullscreen}
              onToggleFullscreen={onToggleCanvasFullscreen}
            />

            {/* Resize Handle - Hide in fullscreen mode */}
            {!isCanvasFullscreen && (
              <ResizeHandle
                position="right"
                onMouseDown={canvasResize.handleMouseDown}
                isResizing={canvasResize.isResizing}
              />
            )}
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 main-content">
          <ChatBot
            technicalId={technicalId}
            onAnswer={onAnswer}
            onApproveQuestion={onApproveQuestion}
            onToggleCanvas={onToggleCanvas}
            onEntitiesDetails={onEntitiesDetails}
            onUpdateNotification={onUpdateNotification}
            disabled={disabled}
            isLoading={isLoading}
            messages={messages}
            chatData={chatData}
            canvasVisible={canvasVisible}
          />
        </div>

        {/* Entity Data Panel - Resizable */}
        <EntityDataPanel
          isOpen={isEntityDataOpen}
          onClose={() => setIsEntityDataOpen(false)}
          chatData={chatData}
          width={entityDataResize.width}
          onWidthChange={entityDataResize.setWidth}
          onRefresh={() => {
            // Refresh entity data by reloading chat history
            loadChatHistory();
          }}
          onRollbackChat={() => {
            // TODO: Implement rollback functionality
            console.log('Rolling back chat...');
          }}
        />
      </div>

      {/* Notification Manager */}
      <NotificationManager
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

export default ChatBotView;
