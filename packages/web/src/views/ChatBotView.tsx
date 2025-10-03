import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatBot from '@/components/ChatBot/ChatBot';
import ChatBotCanvas from '@/components/ChatBot/ChatBotCanvas';
import Header from '@/components/Header/Header';
import { useAssistantStore } from '@/stores/assistant';
import { useSuperUserMode } from '@/stores/auth';
import EntityDataPanel from '@/components/EntityDataPanel/EntityDataPanel';
import ChatHistoryPanel from '@/components/ChatHistoryPanel/ChatHistoryPanel';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import Tinycon from 'tinycon';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST } from '@/helpers/HelperConstants';
import { groupChatsByDate } from '@/helpers/HelperChatGroups';

interface Message {
  id: string;
  text: string;
  files?: File[];
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
  messageId?: string; // ID of the related message for navigation
}

const ChatBotView: React.FC = () => {
  const { technicalId } = useParams<{ technicalId: string }>();
  const navigate = useNavigate();
  const assistantStore = useAssistantStore();
  const chatList = useAssistantStore((state) => state.chatList); // Subscribe to chatList specifically
  const isLoadingChats = useAssistantStore((state) => state.isLoadingChats);
  const chatListReady = useAssistantStore((state) => state.chatListReady);
  const isTransferringChats = useAssistantStore((state) => state.isTransferringChats);
  const superUserMode = useSuperUserMode(); // Watch for super user mode changes
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
  const [countNewMessages, setCountNewMessages] = useState(0);
  const originalTitle = useRef('Cyoda AI Assistant');
  const [isLoadingRollback, setIsLoadingRollback] = useState(false);

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
  const technicalIdRef = useRef<string | undefined>(technicalId); // Track current technicalId
  const isInitialLoadRef = useRef<boolean>(true); // Track if this is the initial load of the chat
  const notifiedMessagesRef = useRef<Set<string>>(new Set()); // Track which messages we've already notified about

  const BASE_INTERVAL = parseInt(import.meta.env.VITE_APP_QUESTION_POLLING_INTERVAL_MS) || 1000;
  const MAX_INTERVAL = parseInt(import.meta.env.VITE_APP_QUESTION_MAX_POLLING_INTERVAL) || 10000;
  const JITTER_PERCENT = 0.1;
  const currentIntervalRef = useRef(BASE_INTERVAL);

  // Keep technicalIdRef in sync with technicalId
  useEffect(() => {
    technicalIdRef.current = technicalId;
  }, [technicalId]);

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
    const timestamp = 'Just now';

    if (message.type === 'question' || message.type === 'ui_function') {
      // For questions and ui_function - ring the bell (increase count)
      const notification: HeaderNotification = {
        id: notificationIdCounter.current++,
        type: 'info',
        title: message.type === 'question' ? 'New Question' : 'Action Required',
        message: message.text.substring(0, 100) + (message.text.length > 100 ? '...' : ''),
        timestamp,
        isRead: false,
        messageId: message.id // Store message ID for navigation
      };
      setHeaderNotifications(prev => [notification, ...prev]);
      // Increment the count for bell and tab title
      setCountNewMessages(prev => prev + 1);
    } else if (message.type === 'notification') {
      // For notifications - just add info, don't increase count
      const notification: HeaderNotification = {
        id: notificationIdCounter.current++,
        type: 'warning',
        title: 'System Notification',
        message: message.text.substring(0, 100) + (message.text.length > 100 ? '...' : ''),
        timestamp,
        isRead: true, // Mark as read so it doesn't increase the count
        messageId: message.id // Store message ID for navigation
      };
      setHeaderNotifications(prev => [notification, ...prev]);
    }
  };

  // Add message to the messages array - returns true if message was added, false if it already existed
  const addMessage = (el: any): { wasAdded: boolean; message: Message | null } => {
    let type = 'answer';
    if (el.question) type = 'question';
    else if (el.notification) type = 'notification';
    else if (el.type === 'ui_function') type = 'ui_function';

    let wasAdded = false;
    let addedMessage: Message | null = null;

    // Use functional update to access current state
    setMessages(prevMessages => {
      // Check if message already exists in current state
      const existingMessage = prevMessages.find(m => m.id === el.technical_id);
      if (existingMessage) {
        return prevMessages; // No change
      }

      const newMessage: Message = {
        id: el.technical_id,
        text: el.message || el.answer,
        files: el.files,
        editable: !!el.editable,
        approve: !!el.approve,
        last_modified: el.last_modified,
        raw: el,
        type: type as Message['type']
      };

      wasAdded = true;
      addedMessage = newMessage;
      return [...prevMessages, newMessage];
    });

    return { wasAdded, message: addedMessage };
  };

  // Load chat history
  const loadChatHistory = async (id?: string): Promise<boolean> => {
    // Use the ref to get the current technicalId (not the closure value)
    const currentTechnicalId = technicalIdRef.current;

    // If an id is provided, only proceed if it matches the current chat
    if (id && id !== currentTechnicalId) {
      return false;
    }

    if (promiseIntervalRef.current || !currentTechnicalId) return false;

    abortControllerRef.current = new AbortController();
    const newResults: boolean[] = [];
    const isFirstRequest = isInitialLoadRef.current;

    try {
      promiseIntervalRef.current = assistantStore.getChatById(currentTechnicalId, {
        signal: abortControllerRef.current.signal
      });
      const { data } = await promiseIntervalRef.current;

      // Double-check that technicalId hasn't changed during the async operation
      // If it did, discard this data as it's stale
      if (currentTechnicalId !== technicalIdRef.current) {
        return false;
      }

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

      // Process all messages
      data.chat_body.dialogue.forEach((el: any) => {
        // Add message and check if it was actually added (not already in state)
        const result = addMessage(el);
        newResults.push(result.wasAdded);
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
          setDisabled(false); // Unblock the chat when question or ui_function arrives

          // If this is not the initial load, add notification for the new question/ui_function
          // BUT only if we haven't already notified about this message
          const messageId = lastMessage.technical_id;
          const alreadyNotified = notifiedMessagesRef.current.has(messageId);

          if (!isFirstRequest && !alreadyNotified) {
            const notificationMessage: Message = {
              id: lastMessage.technical_id,
              text: lastMessage.message || lastMessage.answer,
              files: lastMessage.files,
              editable: !!lastMessage.editable,
              approve: !!lastMessage.approve,
              last_modified: lastMessage.last_modified,
              raw: lastMessage,
              type: messageType as Message['type']
            };

            // Mark this message as notified
            notifiedMessagesRef.current.add(messageId);
            addHeaderNotification(notificationMessage);
          }
        }
      }
    } catch (error: any) {
      // Only log errors that aren't abort errors
      if (error?.name !== 'AbortError' && error?.name !== 'CanceledError') {
        console.error('Error loading chat history:', error);
      }
    } finally {
      promiseIntervalRef.current = null;
      // After the first successful load, mark as no longer initial
      if (isFirstRequest) {
        isInitialLoadRef.current = false;
      }
    }

    return newResults.some(el => el);
  };

  // Poll for new messages - only for the current chat from URL
  const pollChat = async () => {
    // CRITICAL: Get technicalId from URL params, not from state or ref
    // This ensures we only poll for the chat that's actually open in the browser
    const urlParams = new URLSearchParams(window.location.search);
    const urlPath = window.location.pathname;
    const urlTechnicalId = urlPath.split('/chat/')[1]?.split('/')[0] || urlPath.split('/chat/')[1];

    // Don't continue polling if there's no technicalId in URL
    if (!urlTechnicalId) {
      return;
    }

    // Don't poll if the URL technicalId doesn't match our component's technicalId
    if (urlTechnicalId !== technicalIdRef.current) {
      return;
    }

    const pollStartTime = Date.now();

    try {
      // Pass the URL technicalId to loadChatHistory for validation
      const gotNew = await loadChatHistory(urlTechnicalId);

      // Exponential backoff logic:
      // - If new messages arrived: reset to BASE_INTERVAL to check frequently for follow-up messages
      // - If no new messages: increase interval exponentially up to MAX_INTERVAL to reduce server load
      const previousInterval = currentIntervalRef.current;
      if (gotNew) {
        currentIntervalRef.current = BASE_INTERVAL;
      } else {
        currentIntervalRef.current = Math.min(currentIntervalRef.current * 2, MAX_INTERVAL);
      }
    } catch (err) {
      // On error, back off exponentially to avoid hammering a failing server
      const previousInterval = currentIntervalRef.current;
      currentIntervalRef.current = Math.min(currentIntervalRef.current * 2, MAX_INTERVAL);
    }

    // Only schedule next poll if:
    // 1. The URL still has the same technicalId
    // 2. The component's technicalId hasn't changed
    const currentUrlPath = window.location.pathname;
    const currentUrlTechnicalId = currentUrlPath.split('/chat/')[1]?.split('/')[0] || currentUrlPath.split('/chat/')[1];

    if (currentUrlTechnicalId === urlTechnicalId && urlTechnicalId === technicalIdRef.current) {
      const jitterFactor = 1 + (Math.random() * 2 - 1) * JITTER_PERCENT;
      const nextDelay = Math.round(currentIntervalRef.current * jitterFactor);
      const pollDuration = Date.now() - pollStartTime;
      pollTimeoutRef.current = setTimeout(pollChat, nextDelay);
    } else {
    }
  };

  const onAnswer = async (data: { answer: string; files?: File[] }) => {
    if (!technicalId) return;

    setDisabled(true);

    try {
      let response;
      if (data.files && data.files.length > 0) {
        const formData = new FormData();
        data.files.forEach(file => {
          formData.append('files', file);
        });
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
          files: data.files
        };
        addMessage(answerMessage);
        setIsLoading(true);
        loadChatHistory();
      }
    } catch (error: any) {
      console.error('Error submitting answer:', error);

      // Extract error message from response
      let errorMessage = 'An error occurred while processing your request.';

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Add error message to chat
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        type: 'error',
        text: errorMessage,
        last_modified: new Date().toISOString(),
        raw: error?.response?.data
      };

      setMessages(prev => [...prev, errorMsg]);
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

  const onRollbackChat = async () => {
    if (!technicalId) return;
    setIsLoadingRollback(true);
    try {
      await assistantStore.postRollback(technicalId);
      // Reload chat history after successful rollback
      await loadChatHistory();
    } catch (error) {
      console.error('Error rolling back chat:', error);
    } finally {
      setIsLoadingRollback(false);
    }
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


    setHeaderNotifications(prev => {
      const notification = prev.find(n => n.id === id);

      // If marking an unread notification as read, decrease the count
      if (notification && !notification.isRead) {
        setCountNewMessages(count => {
          const newCount = Math.max(0, count - 1);
          return newCount;
        });
      }

      const updated = prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      );
      return updated;
    });
  };

  const handleNotificationClick = (notificationId: number, messageId?: string) => {
    // Mark notification as read
    handleMarkNotificationAsRead(notificationId);

    // Navigate to the message if messageId is provided
    if (messageId) {
      // Find the message element and scroll to it
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleMarkAllNotificationsAsRead = () => {

    // Clear all notifications - use functional update to ensure we get latest state
    setHeaderNotifications(() => {
      return [];
    });

    // Reset the count - use functional update
    setCountNewMessages(() => {
      return 0;
    });

    // Reset favicon
    Tinycon.setBubble(0);
    document.title = originalTitle.current;

  };

  // Handle scroll to bottom - clear all notifications
  const handleScrollToBottom = () => {

    // Clear all notifications when user scrolls to bottom
    if (headerNotifications.length > 0) {
      handleMarkAllNotificationsAsRead();
    }
  };

  // Load chat list for sidebar only if not already loaded
  useEffect(() => {
    const loadChats = async () => {
      // Skip if chat list is already loaded
      if (chatListReady) {
        return;
      }

      // Skip if currently transferring chats during login
      if (isTransferringChats) {
        return;
      }

      try {
        await assistantStore.getChats();
      } catch (error) {
        console.error('Failed to load chats:', error);
      }
    };

    loadChats();

    // Listen for chat list updates (e.g., when chat is deleted or renamed)
    const handleUpdateChatList = () => {
      assistantStore.getChats();
    };

    eventBus.$on(UPDATE_CHAT_LIST, handleUpdateChatList);

    return () => {
      eventBus.$off(UPDATE_CHAT_LIST, handleUpdateChatList);
    };
  }, [chatListReady, isTransferringChats]);

  // Refresh chat list when super user mode changes
  useEffect(() => {
    if (chatListReady) {
    }
  }, [superUserMode]);

  // Initialize chat and start polling
  useEffect(() => {
    if (!technicalId) return;

    // Clear any existing polling and requests FIRST before setting new state
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (promiseIntervalRef.current) {
      promiseIntervalRef.current = null;
    }

    // Reset state for new chat
    setIsLoading(true);
    setMessages([]);
    setChatData(null);
    setCanvasVisible(false);
    currentIntervalRef.current = BASE_INTERVAL;
    isInitialLoadRef.current = true; // Reset initial load flag for new chat
    notifiedMessagesRef.current.clear(); // Clear notified messages for new chat

    // Start polling for the new chat
    pollChat();

    return () => {
      // Cleanup on unmount or technicalId change
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (promiseIntervalRef.current) {
        promiseIntervalRef.current = null;
      }
    };
  }, [technicalId]);

  // Update disabled state based on loading
  useEffect(() => {
    setDisabled(isLoading);
  }, [isLoading]);

  // Handle document focus to reset notification count and clear notifications
  useEffect(() => {
    const handleFocus = () => {
      // Use functional updates to avoid stale closure
      setHeaderNotifications(prev => {
        if (prev.length > 0) {
          return [];
        }
        return prev;
      });
      setCountNewMessages(prev => {
        if (prev > 0) {
          return 0;
        }
        return prev;
      });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []); // Empty dependency array - set up once and use functional updates to access latest state

  // Clear notifications when user scrolls on the chat page
  useEffect(() => {
    const handleScroll = () => {
      // Clear all notifications for this chat when user scrolls
      // Use functional updates to avoid stale closure
      setHeaderNotifications(prev => {
        if (prev.length > 0) {
          return [];
        }
        return prev;
      });
      setCountNewMessages(prev => {
        if (prev > 0) {
          return 0;
        }
        return prev;
      });
    };

    // Find the chat messages container
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, []); // Empty dependency array - set up once and use functional updates to access latest state

  // Debug: Log when headerNotifications changes
  useEffect(() => {

  }, [headerNotifications]);

  // Update document title and favicon based on new message count
  useEffect(() => {
    if (countNewMessages > 0) {
      // Update tab title with count
      const newTitle = `(${countNewMessages}) New question${countNewMessages > 1 ? 's' : ''}`;
      document.title = newTitle;
      // Update favicon with bubble
      Tinycon.setBubble(countNewMessages);
    } else {
      // Reset to original title
      document.title = originalTitle.current;
      Tinycon.setBubble(0);
    }
  }, [countNewMessages]);

  if (!technicalId) {
    return <div>No chat ID provided</div>;
  }

  // Group chats by date using shared utility - memoized to react to chatList changes
  const chatGroups = useMemo(() => groupChatsByDate(chatList), [chatList]);

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
        onNotificationClick={handleNotificationClick}
      />
      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Enhanced Left Sidebar - Resizable Chat History Panel */}
        {isChatHistoryOpen && (
          <div
            className={`resizable-panel ${chatHistoryResize.isResizing ? 'resizing' : ''}`}
            style={{ width: `${chatHistoryResize.width}px` }}
          >
            <ChatHistoryPanel
              chatGroups={chatGroups}
              currentChatId={technicalId}
              isLoading={isLoadingChats}
              onResizeMouseDown={chatHistoryResize.handleMouseDown}
              isResizing={chatHistoryResize.isResizing}
              showHomeAsActive={false}
              onClose={() => setIsChatHistoryOpen(false)}
            />
          </div>
        )}



        {/* Canvas Sidebar Panel - Between chat history and main content */}
        {canvasVisible && (
          <div
            className={`bg-slate-800/95 backdrop-blur-sm border-r border-slate-600 flex flex-col relative resizable-panel ${canvasResize.isResizing ? 'resizing' : ''} ${
              isCanvasFullscreen ? 'fixed inset-0 z-[9000] w-full' : ''
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
            onScrollToBottom={handleScrollToBottom}
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
          onRollbackChat={onRollbackChat}
          isLoadingRollback={isLoadingRollback}
        />
      </div>

    </div>
  );
};

export default ChatBotView;
