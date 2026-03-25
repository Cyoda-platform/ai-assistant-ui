import React, { useState, useEffect, useRef, useMemo } from 'react';

import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import ChatBot from '@/components/ChatBot/ChatBot';
import ChatBotCanvas from '@/components/ChatBot/ChatBotCanvas';
import Header from '@/components/Header/Header';
import { useAssistantStore } from '@/stores/assistant';
import { useSuperUserMode } from '@/stores/auth';
import { useAppsTabsStore } from '@/stores/appsTabs';
import { useRepositoryStore } from '@/stores/repository';
import EntityDataPanel from '@/components/EntityDataPanel/EntityDataPanel';
import ChatHistoryPanel from '@/components/ChatHistoryPanel/ChatHistoryPanel';
import EnvironmentsPanel from '@/components/EnvironmentsPanel/EnvironmentsPanel';
import TasksPanel, { TasksPanelHandle } from '@/components/TasksPanel/TasksPanel';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import Tinycon from 'tinycon';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST } from '@/helpers/HelperConstants';
import { groupChatsByDate } from '@/helpers/HelperChatGroups';
import { parseValidationReport } from '@/helpers/validationParser';
import { parseRepositoryIntegrityReport } from '@/helpers/repositoryIntegrityParser';
import { parseFRValidationReport } from '@/helpers/frValidationParser';
import { useWorkflowExampleDetection } from '@/hooks/useWorkflowExampleDetection';
import type { SSEChatEvent, StreamingState } from '@/types/streaming';
import StreamingMessage from '@/components/ChatBot/StreamingMessage';
import ChatLoader from '@/components/ChatBot/ChatLoader';
import StreamErrorNotification from '@/components/ChatBot/StreamErrorNotification';
import StreamingStatusBanner from '@/components/ChatBot/StreamingStatusBanner';
import type { GitHubRepositoryInfo } from '@/services/githubAppDataService';
import taskService, { type BackgroundTask } from '@/services/taskService';

interface Message {
  id: string;
  text: string;
  files?: File[];
  editable?: boolean;
  approve?: boolean;
  raw?: any;
  type: 'ai' | 'user' | 'notification' | 'ui_function';
  isCanvasQA?: boolean;
  hook_message?: string; // Separated hook message from agent response
}

interface HeaderNotification {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  messageId?: string; // ID of the related message for navigation
  taskId?: string; // ID of the related task for opening tasks panel
}

const ChatBotView: React.FC = () => {
  const { technicalId } = useParams<{ technicalId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const assistantStore = useAssistantStore();
  const chatList = useAssistantStore((state) => state.chatList); // Subscribe to chatList specifically
  const isLoadingChats = useAssistantStore((state) => state.isLoadingChats);
  const chatListReady = useAssistantStore((state) => state.chatListReady);
  const isTransferringChats = useAssistantStore((state) => state.isTransferringChats);
  const superUserMode = useSuperUserMode(); // Watch for super user mode changes
  const { getActiveTab: getActiveAppTab, updateTab: updateAppTab } = useAppsTabsStore();
  const [canvasVisible, setCanvasVisible] = useState(() => {
    // Load canvas visibility from per-chat localStorage
    if (technicalId) {
      try {
        const stored = localStorage.getItem(`canvas-visible-${technicalId}`);
        if (stored !== null) {
          const isVisible = stored === 'true';
          console.log('[Canvas State] Initializing canvasVisible from localStorage:', isVisible);
          return isVisible;
        }
      } catch (error) {
        console.warn('[Canvas State] Failed to load canvas visibility from localStorage:', error);
      }
    }
    console.log('[Canvas State] Initializing canvasVisible to false');
    return false;
  });
  const [canvasActiveTab, setCanvasActiveTab] = useState<'apps' | 'data' | 'workflow' | 'requirement' | 'code'>(() => {
    // Load canvas active tab from per-chat localStorage
    if (technicalId) {
      try {
        const stored = localStorage.getItem(`canvas-active-tab-${technicalId}`);
        if (stored && ['apps', 'data', 'workflow', 'requirement', 'code'].includes(stored)) {
          return stored as 'apps' | 'data' | 'workflow' | 'requirement' | 'code';
        }
      } catch (error) {
        console.warn('[Canvas State] Failed to load canvas active tab from localStorage:', error);
      }
    }
    return 'requirement';
  });
  const [triggerCanvasReload, setTriggerCanvasReload] = useState(false);
  const [isEntityDataOpen, setIsEntityDataOpen] = useState(false);
  const [isTasksPanelOpen, setIsTasksPanelOpen] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isEnvironmentsOpen, setIsEnvironmentsOpen] = useState(false);
  const [setTextareaContentCallback, setSetTextareaContentCallback] = useState<((content: string, options?: { collapse?: boolean }) => void) | null>(null);
  const [lastCanvasAIChange, setLastCanvasAIChange] = useState<{
    entities: Record<string, any>;
    workflows: Record<string, any>;
    messageId: string;
    appTabId?: string;
    oldAppName?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatData, setChatData] = useState<any>(null);
  const [headerNotifications, setHeaderNotifications] = useState<HeaderNotification[]>([]);
  const notificationIdCounter = useRef(1);
  const [countNewMessages, setCountNewMessages] = useState(0);
  const originalTitle = useRef('Cyoda AI Studio: Solve.Build. Deploy');
  const [isLoadingRollback, setIsLoadingRollback] = useState(false);
  const [showRepositoryConfigPrompt, setShowRepositoryConfigPrompt] = useState(false);
  const [isLoadingCanvasToggle, setIsLoadingCanvasToggle] = useState(false);
  const tasksPanelRef = useRef<TasksPanelHandle>(null);

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

  const environmentsResize = useResizablePanel({
    defaultWidth: 500,  // Start at 500px
    minWidth: 350,      // Minimum width for environments
    maxWidth: 1200,     // Maximum width - very wide
    storageKey: 'environments-width'
  });

  const tasksResize = useResizablePanel({
    defaultWidth: 500,  // Start at 500px
    minWidth: 350,      // Minimum width for tasks
    maxWidth: 1200,     // Maximum width
    storageKey: 'tasks-width',
    side: 'right'       // Panel is on the right side of the screen
  });

  // Check if returning from fullscreen and reopen environments panel
  useEffect(() => {
    const wasInFullscreen = localStorage.getItem('environments-width-before-fullscreen');
    if (wasInFullscreen) {
      // Reopen the environments panel
      setIsEnvironmentsOpen(true);
    }
  }, []);

  // Listen for openEnvironmentsPanel event from deployment options UI
  useEffect(() => {
    const handleOpenEnvironmentsPanel = (event: any) => {
      console.log('[ChatBotView] Opening environments panel from deployment options');
      setIsEnvironmentsOpen(true);
    };

    window.addEventListener('openEnvironmentsPanel', handleOpenEnvironmentsPanel);
    return () => {
      window.removeEventListener('openEnvironmentsPanel', handleOpenEnvironmentsPanel);
    };
  }, []);

  // Resizable canvas panel - no max width constraint
  // Use per-chat storage key to keep canvas settings separate for each chat
  const canvasResize = useResizablePanel({
    defaultWidth: 800,   // Start at maximum width for canvas
    minWidth: 400,       // Minimum width for canvas
    maxWidth: 999999,    // No real constraint - allow unlimited expansion
    storageKey: technicalId ? `canvas-width-${technicalId}` : 'canvas-width'
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const promiseIntervalRef = useRef<Promise<any> | null>(null);
  const isInitialLoadRef = useRef<boolean>(true); // Track if this is the initial load of the chat
  const notifiedMessagesRef = useRef<Set<string>>(new Set()); // Track which messages we've already notified about
  const hasAutoOpenedCanvasRef = useRef<boolean>(false); // Track if we've already auto-opened canvas for entities_data
  const isRequestInProgressRef = useRef<boolean>(false); // Track if a POST request is in progress
  const streamAbortControllerRef = useRef<AbortController | null>(null); // Track SSE stream abort controller
  const initialMessageSentRef = useRef<boolean>(false); // Track if we've sent the initial message from navigation state

  // Streaming state
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentAgent: undefined,
    currentTool: undefined,
    toolArgs: undefined,
    accumulatedContent: '',
    cloneRepositoryDetected: false,
    error: undefined,
    events: []
  });

  // Counter for event IDs
  const eventIdCounter = useRef(0);
  // Ref to track events (for synchronous access in done handler)
  const eventsRef = useRef<any[]>([]);
  const [useStreaming, setUseStreaming] = useState(true); // Feature flag for SSE streaming

  // Store the last message for retry functionality
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [showStreamErrorNotification, setShowStreamErrorNotification] = useState(false);
  const [showStreamingBanner, setShowStreamingBanner] = useState(false);

  // Client-side timeout to prevent infinite "thinking" state
  const streamTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Retry streaming function
  const retryStreaming = async () => {
    if (!lastUserMessage || !technicalId) return;

    setIsRetrying(true);
    setShowStreamErrorNotification(false);
    setStreamingState(prev => ({
      ...prev,
      error: undefined,
      isStreaming: true,
      accumulatedContent: '',
      events: []
    }));

    try {
      const abortController = await assistantStore.retryChatMessage(
        technicalId,
        lastUserMessage,
        handleStreamEvent,
        (error) => {
          console.error('[SSE] Retry stream error:', error);
          setStreamingState(prev => ({
            ...prev,
            isStreaming: false,
            error: error.message
          }));
          setIsRetrying(false);
        },
        () => {
          console.log('[SSE] Retry stream completed successfully');
          setIsRetrying(false);
        }
      );

      streamAbortControllerRef.current = abortController;
    } catch (error) {
      console.error('[SSE] Failed to retry stream:', error);
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        error: 'Failed to retry streaming'
      }));
      setIsRetrying(false);
    }
  };

  // Enable streaming function
  const enableStreaming = () => {
    setUseStreaming(true);
    setShowStreamingBanner(false);
    console.log('[SSE] Streaming re-enabled by user');
  };

  // Disable streaming function (with notification)
  const disableStreaming = () => {
    setUseStreaming(false);
    setShowStreamingBanner(true);
    console.log('[SSE] Streaming disabled, showing banner');
  };

  // Stop current request function
  const stopCurrentRequest = () => {
    console.log('[ChatBotView] Stopping current request');

    // Clear stream timeout
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }

    // Abort streaming request if active
    if (streamAbortControllerRef.current) {
      console.log('[ChatBotView] Aborting streaming request');
      streamAbortControllerRef.current.abort();
      streamAbortControllerRef.current = null;
    }

    // Abort regular polling request if active
    if (abortControllerRef.current) {
      console.log('[ChatBotView] Aborting polling request');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset all loading states
    setIsLoading(false);
    setDisabled(false);
    setIsRetrying(false);
    isRequestInProgressRef.current = false;

    // Reset streaming state
    setStreamingState(prev => ({
      ...prev,
      isStreaming: false,
      error: undefined,
      currentAgent: undefined,
      currentTool: undefined,
      toolArgs: undefined
    }));

    console.log('[ChatBotView] Request stopped and UI state reset');
  };

  // Debug: Track canvas visibility changes and save to per-chat localStorage
  useEffect(() => {
    console.log('[Canvas State] canvasVisible changed to:', canvasVisible);
    console.trace('[Canvas State] Stack trace for canvas visibility change');

    // Save canvas visibility to per-chat localStorage
    if (technicalId) {
      try {
        localStorage.setItem(`canvas-visible-${technicalId}`, canvasVisible.toString());
      } catch (error) {
        console.warn('[Canvas State] Failed to save canvas visibility to localStorage:', error);
      }
    }
  }, [canvasVisible, technicalId]);

  // Save canvas active tab to per-chat localStorage
  useEffect(() => {
    if (technicalId) {
      try {
        localStorage.setItem(`canvas-active-tab-${technicalId}`, canvasActiveTab);
      } catch (error) {
        console.warn('[Canvas State] Failed to save canvas active tab to localStorage:', error);
      }
    }
  }, [canvasActiveTab, technicalId]);

  // Trigger analyze when page loads with canvas already open (e.g., after refresh)
  // Only if there's no cached data
  useEffect(() => {
    if (canvasVisible && githubRepository && technicalId) {
      const { getRepositoryData } = useRepositoryStore.getState();
      const cachedData = getRepositoryData(technicalId);

      if (!cachedData) {
        console.log('[Canvas Analyze] Page loaded with canvas open and no cache, triggering analyze');
        // No cached data, so we need to trigger analyze
        // The AppsCanvas component will handle the actual loading
      } else {
        console.log('[Canvas Analyze] Page loaded with canvas open, using cached data');
      }
    }
    // Only run once on mount when canvas is already visible
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  // Handle openCanvas query parameter - disabled auto-opening
  useEffect(() => {
    const shouldOpenCanvas = searchParams.get('openCanvas') === 'true';
    if (shouldOpenCanvas) {
      // Just clean up the URL parameter without auto-opening canvas
      console.log('[Canvas Auto-Open] Ignoring openCanvas URL parameter - auto-opening disabled');
      searchParams.delete('openCanvas');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, technicalId]);

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

  // Helper function to extract background_task_ids from message text
  const extractBackgroundTaskIds = (text: string): string[] | null => {
    try {
      // Try to find JSON code block in the message
      const jsonMatch = text.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData.background_task_ids && Array.isArray(jsonData.background_task_ids)) {
          return jsonData.background_task_ids;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Helper function to extract UI functions from message text
  const extractUIFunctions = (text: string): any[] | null => {
    try {
      // Check for new text-based UI function format: [ui_function: issue_technical_user, env: https://..., withAdminRole: true/false] or [ui-function: ...]
      const textFunctionMatch = text.match(/\[ui[_-]function:\s*(\w+),\s*env:\s*(https?:\/\/[^\],]+)(?:,\s*withAdminRole:\s*(true|false))?\]/);
      if (textFunctionMatch) {
        const functionName = textFunctionMatch[1];
        const envUrl = textFunctionMatch[2];
        const withAdminRole = textFunctionMatch[3];

        // Convert to UI function format
        const uiFunction: any = {
          type: 'ui_function',
          function: functionName,
          method: 'POST',
          path: '/api/clients',
          response_format: 'json',
          env_url: envUrl.replace('https://', '')
        };

        // Add query params if withAdminRole is specified
        if (withAdminRole !== undefined) {
          uiFunction.query_params = { withAdminRole: withAdminRole };
        }

        return [uiFunction];
      }

      // Try to find JSON code block in the message (legacy format)
      const jsonMatch = text.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1]);

        // Check if it's a single UI function object
        if (jsonData.type === 'ui_function' && jsonData.function && jsonData.method && jsonData.path) {
          return [jsonData];
        }

        // Check if it's an array of UI functions
        if (Array.isArray(jsonData) && jsonData.length > 0 && jsonData[0].type === 'ui_function') {
          return jsonData;
        }

        // Check if it has a ui_functions property
        if (jsonData.ui_functions && Array.isArray(jsonData.ui_functions)) {
          return jsonData.ui_functions;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Helper function to remove JSON code block from message text
  const removeJsonCodeBlock = (text: string): string => {
    // Remove text-based UI function markers: [ui-function: ...] (with optional withAdminRole parameter)
    let cleanedText = text.replace(/\[ui[_-]function:\s*\w+,\s*env:\s*https?:\/\/[^\],]+(?:,\s*withAdminRole:\s*(?:true|false))?\]/g, '').trim();

    // Remove the JSON code block containing background_task_ids or UI functions
    cleanedText = cleanedText.replace(/```json\s*\n[\s\S]*?\n```/g, '').trim();

    return cleanedText;
  };

  // Fetch repository information from conversation (without loading messages)
  const fetchRepositoryInfo = async (): Promise<{ hasRepo: boolean; repoData?: any }> => {
    const currentTechnicalId = technicalId;

    if (!currentTechnicalId || currentTechnicalId.startsWith('temp-')) {
      console.log('[fetchRepositoryInfo] Invalid or temporary chat ID');
      return { hasRepo: false };
    }

    try {
      console.log('[fetchRepositoryInfo] Fetching repository info for chat:', currentTechnicalId);
      const { data } = await assistantStore.getChatById(currentTechnicalId);

      const chatBody = data?.chat_body;
      const hasRepo = !!(chatBody?.repository_name && chatBody?.repository_owner && chatBody?.repository_branch);

      if (hasRepo) {
        console.log('[fetchRepositoryInfo] Repository found:', {
          name: chatBody.repository_name,
          owner: chatBody.repository_owner,
          branch: chatBody.repository_branch
        });
        return {
          hasRepo: true,
          repoData: {
            name: chatBody.repository_name,
            owner: chatBody.repository_owner,
            branch: chatBody.repository_branch
          }
        };
      } else {
        console.log('[fetchRepositoryInfo] No repository configured');
        return { hasRepo: false };
      }
    } catch (error) {
      console.error('[fetchRepositoryInfo] Error fetching repository info:', error);
      return { hasRepo: false };
    }
  };

  // Load chat history
  const loadChatHistory = async (id?: string): Promise<boolean> => {
    // Use the component's technicalId prop (from URL params)
    const currentTechnicalId = technicalId;

    // If an id is provided, only proceed if it matches the current chat
    if (id && id !== currentTechnicalId) {
      console.log('[loadChatHistory] ID mismatch, skipping', { provided: id, current: currentTechnicalId });
      return false;
    }

    // Skip if this is a temporary chat ID (being created)
    if (currentTechnicalId?.startsWith('temp-')) {
      console.log('[loadChatHistory] Temporary chat ID, skipping load');
      return false;
    }

    // Don't load while a request is in progress
    if (promiseIntervalRef.current || !currentTechnicalId || isRequestInProgressRef.current) {
      return false;
    }

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
      if (currentTechnicalId !== technicalId) {
        console.log('[loadChatHistory] TechnicalId changed during request, discarding data', {
          requested: currentTechnicalId,
          current: technicalId
        });
        return false;
      }

      // Only update chatData if entities_data has changed or is not empty
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

        // Open canvas automatically when repository info is available for the FIRST TIME only
        // This prevents the canvas from reopening after the user manually closes it
        // Also check if chat is archived - don't auto-open canvas for archived chats
        const currentChat = chatList?.find(chat => chat.technical_id === currentTechnicalId);
        const isArchived = currentChat?.status === 'archived';

        // Extract repository info directly from the fetched data (not from state)
        // This is important because setChatData is async and githubRepository state won't be updated yet
        const chatBody = data?.chat_body;
        const hasRepositoryInfo = !!(chatBody?.repository_name && chatBody?.repository_owner && chatBody?.repository_branch);

        // Auto-open canvas disabled - users can manually open canvas when needed
        // if (hasRepositoryInfo && !hasAutoOpenedCanvasRef.current && !isArchived) {
        //   console.log('[Canvas Auto-Open] Conditions:', {
        //     hasRepositoryInfo: true,
        //     canvasVisible,
        //     hasAutoOpened: hasAutoOpenedCanvasRef.current,
        //     isArchived,
        //     willOpen: !canvasVisible,
        //     repositoryName: chatBody?.repository_name,
        //     repositoryOwner: chatBody?.repository_owner,
        //     repositoryBranch: chatBody?.repository_branch
        //   });

        //   if (!canvasVisible) {
        //     console.log('[Canvas Auto-Open] Opening canvas for the first time (GitHub mode)');
        //     setCanvasVisible(true);
        //   }
        //   hasAutoOpenedCanvasRef.current = true; // Mark that we've auto-opened the canvas
        // }
        // // Fallback: Auto-open for AppConfig mode when entities_data is available
        // else if (newEntitiesData && Object.keys(newEntitiesData).length > 0 && !hasAutoOpenedCanvasRef.current && !isArchived && !hasRepositoryInfo) {
        //   console.log('[Canvas Auto-Open] Conditions:', {
        //     hasEntitiesData: true,
        //     canvasVisible,
        //     hasAutoOpened: hasAutoOpenedCanvasRef.current,
        //     isArchived,
        //     willOpen: !canvasVisible
        //   });

        //   if (!canvasVisible) {
        //     console.log('[Canvas Auto-Open] Opening canvas for the first time (AppConfig mode)');
        //     setCanvasVisible(true);
        //   }
        //   hasAutoOpenedCanvasRef.current = true; // Mark that we've auto-opened the canvas
        // }
      }

      // Clean up messages without IDs (temporary optimistic messages) and process all new messages in a single update
      setMessages(prev => {
        // First, filter out temporary messages
        let currentMessages = prev.filter(msg => msg.id !== '');

        // Process all messages from dialogue
        data.chat_body.dialogue.forEach((el: any) => {
          // Ensure messageText is always a string
          let rawMessageText = el.message || el.answer || '';
          const messageText = typeof rawMessageText === 'string' ? rawMessageText : String(rawMessageText || '');

          const backgroundTaskIds = el.hook?.background_task_ids || extractBackgroundTaskIds(messageText);
          const uiFunctionsFromField = el.ui_functions || [];
          const uiFunctionsFromText = extractUIFunctions(messageText) || [];

          // Extract ui_function hook from metadata if it exists
          const uiFunctionFromMetadata = el.metadata?.hook?.type === 'ui_function' ? [el.metadata.hook] : [];

          const allUIFunctions = [...uiFunctionsFromField, ...uiFunctionFromMetadata, ...uiFunctionsFromText];

          // Check if message already exists by technical_id OR by adk_session_id
          // This handles the case where SSE stream adds a message with adk_session_id
          // and then loadChatHistory tries to add the same message with technical_id
          const existingMessage = currentMessages.find(m =>
            m.id === el.technical_id ||
            (el.adk_session_id && m.raw?.adk_session_id === el.adk_session_id) ||
            (el.adk_session_id && m.id === el.adk_session_id)  // Check if SSE ID matches
          );
          if (existingMessage) {
            console.log('[loadChatHistory] Skipping duplicate message:', {
              technical_id: el.technical_id,
              adk_session_id: el.adk_session_id,
              existingMessageId: existingMessage.id
            });
            newResults.push(false);
            return; // Skip this message
          }

          let type = 'user';
          if (el.type === 'ai') type = 'ai';
          else if (el.notification) type = 'notification';
          else if (el.type === 'ui_function') type = 'ui_function';

          // If message has background_task_ids, create a notification instead
          if (backgroundTaskIds && backgroundTaskIds.length > 0) {
            const taskNotification: Message = {
              id: el.technical_id,
              text: removeJsonCodeBlock(messageText),
              files: el.files,
              editable: false,
              approve: false,
              last_modified: el.last_modified,
              raw: {
                ...el,
                background_task_ids: backgroundTaskIds
              },
              type: 'notification',
              isCanvasQA: false
            };
            currentMessages.push(taskNotification);
            newResults.push(true);
            return;
          }

          // Determine the final message text
          const finalMessageText = uiFunctionsFromText.length > 0
            ? removeJsonCodeBlock(messageText)
            : messageText;

          // Normal message
          // Build raw object: spread el (excluding raw), then merge el.raw fields
          const rawObject: any = {
            ...el,
            ui_functions: allUIFunctions.length > 0 ? allUIFunctions : undefined,
            hook: el.metadata?.hook  // Restore hook from metadata
          };

          // Merge el.raw fields (including debug_history) into raw object
          if (el.raw) {
            Object.assign(rawObject, el.raw);
          }

          const newMessage: Message = {
            id: el.technical_id,
            text: finalMessageText,
            files: el.files,
            editable: !!el.editable,
            approve: !!el.approve,
            last_modified: el.last_modified,
            raw: rawObject,
            type: type as Message['type'],
            isCanvasQA: !!el.isCanvasQA
          };
          console.log('[loadChatHistory] Adding message:', {
            id: newMessage.id,
            adk_session_id: el.adk_session_id,
            type: newMessage.type,
            text: newMessage.text.substring(0, 50),
            hasDebugHistory: !!newMessage.raw?.debug_history
          });
          currentMessages.push(newMessage);

          // Add UI function messages if any
          if (allUIFunctions.length > 0) {
            allUIFunctions.forEach((uiFunc: any) => {
              const uiFuncMessage: Message = {
                id: `${el.technical_id}-ui-${uiFunc.id || Date.now()}`,
                text: '',
                editable: false,
                approve: false,
                last_modified: el.last_modified,
                raw: {
                  ui_function: uiFunc
                },
                type: 'ui_function',
                isCanvasQA: false
              };
              currentMessages.push(uiFuncMessage);
            });
          }

          newResults.push(true);
        });

        return currentMessages;
      });

      // Check if the last message in the dialogue is a question or ui_function
      // This indicates the AI has finished processing and the chat should be unblocked
      const dialogue = data.chat_body.dialogue;

      if (dialogue && dialogue.length > 0) {
        const lastMessage = dialogue[dialogue.length - 1];
        const messageType = lastMessage.type === 'ai' ? 'ai' :
          lastMessage.type === 'ui_function' ? 'ui_function' : 'user';

        if (['ai', 'ui_function'].includes(messageType)) {
          setIsLoading(false);
          setDisabled(false); // Unblock the chat when ai or ui_function arrives

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
      } else {
        // Empty chat (no messages yet) - set loading to false so chat is ready
        console.log('[loadChatHistory] Empty chat, setting isLoading to false');
        setIsLoading(false);
        setDisabled(false);
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



  // Handle SSE streaming events
  const handleStreamEvent = (event: SSEChatEvent) => {
    console.log('[SSE] Event received:', event.type, event);

    // Create event record for debug panel
    const eventRecord = {
      id: String(eventIdCounter.current++),
      type: event.type,
      data: event,
      timestamp: event.timestamp || new Date().toISOString()
    };

    console.log('[SSE] Created event record:', eventRecord);

    switch (event.type) {
      case 'start':
        console.log('[SSE] Setting isStreaming = true');
        eventsRef.current = [eventRecord]; // Reset events ref

        // Clear any existing timeout
        if (streamTimeoutRef.current) {
          clearTimeout(streamTimeoutRef.current);
        }

        // Set a 6-minute client-side timeout (slightly longer than backend's 5 minutes)
        streamTimeoutRef.current = setTimeout(() => {
          console.error('[SSE] Client-side timeout: Stream exceeded 6 minutes, clearing thinking state');
          setStreamingState(prev => ({
            ...prev,
            isStreaming: false,
            error: 'Stream timeout - please try again',
            errorDetails: {
              error_type: 'ClientTimeoutError',
              context: 'No response received within 6 minutes',
            }
          }));
          setShowStreamErrorNotification(true);
          setIsLoading(false);
          setDisabled(false);
          isRequestInProgressRef.current = false;
        }, 6 * 60 * 1000); // 6 minutes

        setStreamingState(prev => {
          const newState = {
            ...prev,
            isStreaming: true,
            accumulatedContent: '',
            cloneRepositoryDetected: false, // Reset clone_repository detection
            error: undefined,
            events: [eventRecord] // Start fresh with first event
          };
          console.log('[SSE] New streaming state after start:', newState);
          console.log('[SSE] Events array length:', newState.events?.length);
          return newState;
        });
        break;

      case 'agent':
        console.log('[SSE] Setting agent:', event.agent_name);
        eventsRef.current = [...eventsRef.current, eventRecord]; // Update ref
        setStreamingState(prev => {
          const newState = {
            ...prev,
            currentAgent: event.agent_name,
            events: [...(prev.events || []), eventRecord]
          };
          console.log('[SSE] New streaming state after agent:', newState);
          console.log('[SSE] Events array length:', newState.events?.length);
          return newState;
        });
        break;

      case 'tool':
        console.log('[SSE] Setting tool:', event.tool_name);
        eventsRef.current = [...eventsRef.current, eventRecord]; // Update ref
        setStreamingState(prev => {
          const newState = {
            ...prev,
            currentTool: event.tool_name,
            events: [...(prev.events || []), eventRecord]
          };
          console.log('[SSE] New streaming state after tool:', newState);
          return newState;
        });
        // Auto-hide tool after 2 seconds
        setTimeout(() => {
          setStreamingState(prev => ({
            ...prev,
            currentTool: undefined
          }));
        }, 2000);
        break;

      case 'tool_call':
        console.log('[SSE] Tool call:', event.tool_name, event.tool_args);
        eventsRef.current = [...eventsRef.current, eventRecord]; // Update ref

        // Detect clone_repository tool call
        const isCloneRepository = event.tool_name === 'clone_repository';
        if (isCloneRepository) {
          console.log('[SSE] clone_repository tool detected!');
        }

        setStreamingState(prev => ({
          ...prev,
          currentTool: event.tool_name,
          toolArgs: event.tool_args,
          cloneRepositoryDetected: prev.cloneRepositoryDetected || isCloneRepository,
          events: [...(prev.events || []), eventRecord]
        }));
        break;

      case 'tool_response':
        console.log('[SSE] Tool response:', event.tool_name, event.tool_response);
        eventsRef.current = [...eventsRef.current, eventRecord]; // Update ref

        // If tool response has a message, display it immediately
        if (event.tool_response) {
          const toolMessage: Message = {
            id: `tool-${event.tool_id || Date.now()}`,
            type: 'function',
            text: event.tool_response,
            last_modified: new Date().toISOString(),
            raw: {
              tool_name: event.tool_name,
              tool_id: event.tool_id,
              hook: event.hook,
              hooks: event.hooks, // Include hooks array for canvas_open and other hooks
              sse_events: [eventRecord]
            }
          };
          setMessages(prev => [...prev, toolMessage]);
        }

        setStreamingState(prev => ({
          ...prev,
          currentTool: undefined,
          toolArgs: undefined,
          events: [...(prev.events || []), eventRecord]
        }));
        break;

      case 'agent_transfer':
        console.log('[SSE] Agent transfer:', event.from_agent, '→', event.to_agent);
        eventsRef.current = [...eventsRef.current, eventRecord]; // Update ref
        setStreamingState(prev => ({
          ...prev,
          currentAgent: event.to_agent,
          events: [...(prev.events || []), eventRecord]
        }));
        break;

      case 'content':
        console.log('[SSE] Adding content chunk:', event.chunk);
        eventsRef.current = [...eventsRef.current, eventRecord]; // Update ref
        setStreamingState(prev => {
          const newState = {
            ...prev,
            accumulatedContent: prev.accumulatedContent + event.chunk,
            events: [...(prev.events || []), eventRecord]
          };
          console.log('[SSE] New streaming state after content. Total length:', newState.accumulatedContent.length);
          console.log('[SSE] Events array length:', newState.events?.length);
          return newState;
        });
        break;

      case 'done':
        console.log('[SSE] Stream completed. Response:', event.response);
        console.log('[SSE] Hook data:', event.hook);

        // Clear timeout on done event
        if (streamTimeoutRef.current) {
          clearTimeout(streamTimeoutRef.current);
          streamTimeoutRef.current = null;
        }

        // Check if the done event contains error information
        if (event.error) {
          console.error('[SSE] Stream completed with error:', event.error);
          console.error('[SSE] Error details:', {
            type: event.error_type,
            context: event.error_context
          });

          // Handle as error case
          setStreamingState(prev => ({
            ...prev,
            isStreaming: false,
            error: event.error,
            errorDetails: {
              error_type: event.error_type,
              error_context: event.error_context,
            },
            events: [...(prev.events || []), eventRecord]
          }));

          // Show notification for stream error
          setShowStreamErrorNotification(true);

          // Keep the input enabled so user can retry
          setIsLoading(false);
          setDisabled(false);
          isRequestInProgressRef.current = false;
          break;
        }

        // Get current events synchronously from ref (not state - avoids stale closure)
        const finalEvents = [...eventsRef.current, eventRecord];

        console.log('[SSE] Current eventsRef.current:', eventsRef.current);
        console.log('[SSE] Current events length:', eventsRef.current.length);
        console.log('[SSE] Final events array:', finalEvents);
        console.log('[SSE] Final events count:', finalEvents.length);

        // Check for hooks in the response
        const hook = event.hook;
        const backgroundTaskIds = hook?.background_task_ids || extractBackgroundTaskIds(event.response);

        // Check if there's a combined hook in the hooks array (for deployment scenarios)
        let combinedHook = hook?.type === 'combined' ? hook : null;
        if (!combinedHook && event.hooks && Array.isArray(event.hooks)) {
          combinedHook = event.hooks.find((h: any) => h?.type === 'combined');
        }

        // Handle combined hooks - check what type of hooks are inside
        if (combinedHook) {
          console.log('[SSE] Combined hook detected:', combinedHook);

          // Check if this is a build hook (has background_task + option_selection)
          const hasBackgroundTask = combinedHook.hooks?.some((h: any) => h?.type === 'background_task');
          const hasOptionSelection = combinedHook.hooks?.some((h: any) => h?.type === 'option_selection');
          const hasTasksPanel = combinedHook.hooks?.some((h: any) => h?.type === 'tasks_panel');

          if (hasBackgroundTask && (hasOptionSelection || hasTasksPanel)) {
            // This is a build/deployment hook - don't open canvas, let the message component handle it
            console.log('[SSE] Build/deployment hook detected (background_task + option_selection/tasks_panel), skipping canvas open');

            // Open tasks panel if it's in the combined hook
            if (hasTasksPanel) {
              console.log('[SSE] Tasks panel hook detected in combined hook');
              setIsTasksPanelOpen(true);
            }
          } else {
            // This is a code changes combined hook - open canvas
            console.log('[SSE] Code changes combined hook detected, opening canvas');

            // Determine which tab to open based on resource_type from hook
            let tabToOpen: 'apps' | 'data' | 'workflow' | 'requirement' | 'code' | 'environments' = 'data';
            const resourceType = combinedHook?.data?.resource_type;

            if (resourceType === 'entity') {
              tabToOpen = 'data';
              console.log('[SSE] Entity resource type, opening data tab');
            } else if (resourceType === 'workflow') {
              tabToOpen = 'workflow';
              console.log('[SSE] Workflow resource type, opening workflow tab');
            } else if (resourceType === 'requirement') {
              tabToOpen = 'requirement';
              console.log('[SSE] Requirement resource type, opening requirement tab');
            } else {
              // Fallback: detect from resources if resource_type not provided
              const resources = combinedHook?.data?.resources || {};
              if (resources.entities && resources.entities.length > 0) {
                tabToOpen = 'data';
                console.log('[SSE] Entities detected in resources, opening data tab');
              } else if (resources.workflows && resources.workflows.length > 0) {
                tabToOpen = 'workflow';
                console.log('[SSE] Workflows detected in resources, opening workflow tab');
              } else if (resources.requirements && resources.requirements.length > 0) {
                tabToOpen = 'requirement';
                console.log('[SSE] Requirements detected in resources, opening requirement tab');
              }
            }

            // Open canvas and set the appropriate tab
            setCanvasVisible(true);
            setCanvasActiveTab(tabToOpen);

            // Auto-refresh canvas - use hook data if githubRepository not available
            if (technicalId) {
              // Try to get repository info from hook data first, then fall back to githubRepository
              const hookRepoInfo = combinedHook?.data?.repository_owner && combinedHook?.data?.repository_name && combinedHook?.data?.branch_name
                ? {
                    repositoryName: combinedHook.data.repository_name,
                    owner: combinedHook.data.repository_owner,
                    branch: combinedHook.data.branch_name,
                  }
                : null;

              const repoInfoToUse = hookRepoInfo || githubRepository;

              if (repoInfoToUse) {
                console.log('[SSE] Auto-refreshing canvas due to code changes...', repoInfoToUse);
                const { clearCache, loadRepository } = useRepositoryStore.getState();
                clearCache(technicalId);
                // Trigger reload in background (don't await)
                loadRepository(technicalId, repoInfoToUse).catch(err => {
                  console.error('[SSE] Failed to auto-refresh canvas:', err);
                });
              } else {
                console.log('[SSE] Cannot refresh canvas - no repository info available');
              }
            }
          }
        }

        // Handle code changes hook (non-combined)
        if (hook?.type === 'code_changes') {
          console.log('[SSE] Code changes hook detected:', hook);

          // Determine which tab to open based on resource_type from hook
          let tabToOpen: 'apps' | 'data' | 'workflow' | 'requirement' | 'code' | 'environments' = 'data';
          const resourceType = hook?.data?.resource_type;

          if (resourceType === 'entity') {
            tabToOpen = 'data';
            console.log('[SSE] Entity resource type, opening data tab');
          } else if (resourceType === 'workflow') {
            tabToOpen = 'workflow';
            console.log('[SSE] Workflow resource type, opening workflow tab');
          } else if (resourceType === 'requirement') {
            tabToOpen = 'requirement';
            console.log('[SSE] Requirement resource type, opening requirement tab');
          } else {
            // Fallback: detect from resources if resource_type not provided
            const resources = hook?.data?.resources || {};
            if (resources.entities && resources.entities.length > 0) {
              tabToOpen = 'data';
              console.log('[SSE] Entities detected in resources, opening data tab');
            } else if (resources.workflows && resources.workflows.length > 0) {
              tabToOpen = 'workflow';
              console.log('[SSE] Workflows detected in resources, opening workflow tab');
            } else if (resources.requirements && resources.requirements.length > 0) {
              tabToOpen = 'requirement';
              console.log('[SSE] Requirements detected in resources, opening requirement tab');
            }
          }

          // Open canvas and set the appropriate tab
          setCanvasVisible(true);
          setCanvasActiveTab(tabToOpen);

          // Auto-refresh canvas - use hook data if githubRepository not available
          if (technicalId) {
            // Try to get repository info from hook data first, then fall back to githubRepository
            const hookRepoInfo = hook?.data?.repository_owner && hook?.data?.repository_name && hook?.data?.branch_name
              ? {
                  repositoryName: hook.data.repository_name,
                  owner: hook.data.repository_owner,
                  branch: hook.data.branch_name,
                }
              : null;

            const repoInfoToUse = hookRepoInfo || githubRepository;

            if (repoInfoToUse) {
              console.log('[SSE] Auto-refreshing canvas due to code changes...', repoInfoToUse);
              const { clearCache, loadRepository } = useRepositoryStore.getState();
              clearCache(technicalId);
              // Trigger reload in background (don't await)
              loadRepository(technicalId, repoInfoToUse).catch(err => {
                console.error('[SSE] Failed to auto-refresh canvas:', err);
              });
            } else {
              console.log('[SSE] Cannot refresh canvas - no repository info available');
            }
          }
        }

        // Handle cloud window hook - opens the Environments panel
        if (hook?.type === 'cloud_window') {
          console.log('[SSE] Cloud window hook detected:', hook);
          console.log('[SSE] Opening environments panel...');
          setIsEnvironmentsOpen(true);
        }

        // Handle canvas_tab hook - opens a specific canvas tab
        if (hook?.type === 'canvas_tab') {
          console.log('[SSE] Canvas tab hook detected:', hook);
          const tabName = hook?.data?.tab_name;
          console.log('[SSE] Opening canvas tab:', tabName);

          // Map tab names to canvas tab values
          const tabMap: Record<string, 'data' | 'workflow' | 'requirement' | 'code' | 'environments'> = {
            'entities': 'data',
            'workflows': 'workflow',
            'requirements': 'requirement',
            'cloud': 'environments'
          };

          const canvasTab = tabMap[tabName] || 'requirement';

          // Open canvas and switch to the specified tab
          setCanvasVisible(true);
          setCanvasActiveTab(canvasTab);

          // Call analyze endpoint to refresh repository data
          if (githubRepository && technicalId) {
            console.log('[SSE] Calling analyze endpoint to refresh repository data...');
            (async () => {
              try {
                const { clearCache, loadRepository } = useRepositoryStore.getState();
                // Clear cache to force fresh analysis
                clearCache(technicalId);
                // Reload from repository (calls /analyze endpoint)
                await loadRepository(technicalId, githubRepository);
                console.log('[SSE] ✅ Repository data refreshed from analyze endpoint');
              } catch (error) {
                console.error('[SSE] ❌ Failed to call analyze endpoint:', error);
              }
            })();
          }
        }

        // Handle hooks from the hooks array (for deployment scenarios with combined hooks)
        if (event.hooks && Array.isArray(event.hooks)) {
          const cloudWindowHooks = event.hooks.filter((h: any) => h?.type === 'cloud_window');
          const tasksPanelHooks = event.hooks.filter((h: any) => h?.type === 'tasks_panel');

          if (cloudWindowHooks.length > 0) {
            console.log('[SSE] Cloud window hook(s) detected in hooks array:', cloudWindowHooks);
            setIsEnvironmentsOpen(true);
          }

          if (tasksPanelHooks.length > 0) {
            console.log('[SSE] Tasks panel hook(s) detected in hooks array:', tasksPanelHooks);
            setIsTasksPanelOpen(true);
          }
        }

        // Handle tasks_panel hook directly (if not in combined hook)
        if (hook?.type === 'tasks_panel') {
          console.log('[SSE] Tasks panel hook detected:', hook);
          setIsTasksPanelOpen(true);
        }

        // If background task detected, show notification with actual message
        // and a redirect option to the task dashboard
        if (backgroundTaskIds && backgroundTaskIds.length > 0) {
          console.log('[SSE] Background tasks detected:', backgroundTaskIds);

          // Create a special notification message with the actual response text (without JSON block)
          const taskNotification: Message = {
            id: event.adk_session_id || `task-notification-${Date.now()}`,
            type: 'notification',
            text: removeJsonCodeBlock(event.response), // Remove JSON code block from display
            last_modified: new Date().toISOString(),
            raw: {
              adk_session_id: event.adk_session_id,
              hook: event.hook,
              hooks: event.hooks, // Include hooks array for canvas_open and other hooks
              background_task_ids: backgroundTaskIds,
              sse_events: finalEvents
            }
          };

          setMessages(prev => [...prev, taskNotification]);

          // Reset streaming state
          setStreamingState({
            isStreaming: false,
            currentAgent: undefined,
            currentTool: undefined,
            toolArgs: undefined,
            accumulatedContent: '',
            cloneRepositoryDetected: false,
            error: undefined,
            events: []
          });

          // Reset event counter and events ref
          eventIdCounter.current = 0;
          eventsRef.current = [];

          // Stop loading state - this is a valid response
          setIsLoading(false);
          setDisabled(false);
          isRequestInProgressRef.current = false;

          // Auto-open entity data panel to show the task
          setIsEntityDataOpen(true);

          break;
        }

        // Check for UI functions - first in the ui_functions field, then in hooks array, then in the response text
        const uiFunctionsFromField = event.ui_functions || [];

        // Extract ui_function hooks from the hooks array
        const uiFunctionsFromHooksArray = (event.hooks || [])
          .filter((h: any) => h?.type === 'ui_function')
          .map((h: any) => h);

        // Use agent_message if available (separated from hook message), otherwise use response
        const responseToCheck = event.response || '';
        const uiFunctionsFromText = extractUIFunctions(responseToCheck) || [];
        const allUIFunctions = [...uiFunctionsFromField, ...uiFunctionsFromHooksArray, ...uiFunctionsFromText];

        // Determine the message text (remove JSON code block if UI functions were extracted from text)
        const messageText = uiFunctionsFromText.length > 0
          ? removeJsonCodeBlock(responseToCheck)
          : responseToCheck;

        // Normal message (no background task hook)
        const aiMessage: Message = {
          id: event.adk_session_id || `msg-${Date.now()}`, // Use session ID from SSE
          type: 'ai',
          text: messageText,
          hook_message: event.hook_message, // Separated hook message if exists
          last_modified: new Date().toISOString(),
          raw: {
            adk_session_id: event.adk_session_id,
            ui_functions: allUIFunctions.length > 0 ? allUIFunctions : undefined,
            hook: event.hook,
            hooks: event.hooks, // Include hooks array for canvas_open and other hooks
            sse_events: finalEvents // Store events for debug panel
          }
        };

        console.log('[SSE] Created aiMessage:', aiMessage);
        console.log('[SSE] aiMessage.raw:', aiMessage.raw);
        console.log('[SSE] aiMessage.raw.sse_events:', aiMessage.raw.sse_events);
        console.log('[SSE] aiMessage.raw.sse_events length:', aiMessage.raw.sse_events?.length);

        // Parse validation report if present
        if (technicalId && messageText) {
          const validationResult = parseValidationReport(messageText);
          if (validationResult) {
            console.log('📊 Validation report detected in AI message, updating repository store');
            const { setValidation } = useRepositoryStore.getState();
            setValidation(technicalId, validationResult);
          }

          // Parse repository integrity report if present (after git pull)
          const integrityResult = parseRepositoryIntegrityReport(messageText);
          if (integrityResult) {
            console.log('🔍 Repository integrity report detected in AI message, updating repository store');
            const { setIntegrityResult } = useRepositoryStore.getState();
            setIntegrityResult(technicalId, integrityResult);
          }

          // Parse FR validation report if present (after FR consolidation)
          const frValidationResult = parseFRValidationReport(messageText);
          if (frValidationResult) {
            console.log('📋 FR validation report detected in AI message, updating repository store');
            const { setFRValidation } = useRepositoryStore.getState();
            setFRValidation(technicalId, frValidationResult);
          }
        }

        // Create UI function messages if ui_functions exist
        const uiFunctionMessages: Message[] = [];
        if (allUIFunctions.length > 0) {
          console.log('[SSE] UI functions detected:', allUIFunctions);

          allUIFunctions.forEach((uiFunc, index) => {
            const uiFuncMessage: Message = {
              id: `${event.adk_session_id || Date.now()}-uifunc-${index}`,
              type: 'ui_function',
              text: JSON.stringify(uiFunc),
              last_modified: new Date().toISOString(),
              raw: {
                adk_session_id: event.adk_session_id,
                hooks: event.hooks, // Include hooks array for canvas_open and other hooks
                ...uiFunc
              }
            };
            uiFunctionMessages.push(uiFuncMessage);
          });
        }

        setMessages(prev => {
          // Add the message directly - no deduplication needed
          // The SSE stream provides the real-time response
          const newMessages = [...prev, aiMessage, ...uiFunctionMessages];
          console.log('[SSE] Messages after adding:', newMessages);
          console.log('[SSE] Last message:', newMessages[newMessages.length - 1]);
          console.log('[SSE] Last message raw:', newMessages[newMessages.length - 1]?.raw);
          return newMessages;
        });

        // Update chatData with adk_session_id from SSE response for conversation continuity
        if (event.adk_session_id) {
          console.log('[SSE] Updating chatData with adk_session_id:', event.adk_session_id);
          setChatData((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              adk_session_id: event.adk_session_id
            };
          });
        }

        // Update chatData with repository info from SSE response if available
        // This ensures githubRepository state is updated for the Analyze button
        const repoInfo = event.repository_info;
        if (repoInfo?.repository_name && repoInfo?.repository_owner && repoInfo?.repository_branch) {
          console.log('[SSE] Updating chatData with repository info from SSE response:', repoInfo);
          setChatData((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              chat_body: {
                ...prev.chat_body,
                repository_name: repoInfo.repository_name,
                repository_owner: repoInfo.repository_owner,
                repository_branch: repoInfo.repository_branch,
                repository_url: repoInfo.repository_url,
                installation_id: repoInfo.installation_id,
              }
            };
          });
        }

        // Reset streaming state
        setStreamingState({
          isStreaming: false,
          currentAgent: undefined,
          currentTool: undefined,
          toolArgs: undefined,
          accumulatedContent: '',
          cloneRepositoryDetected: false,
          error: undefined,
          events: []
        });

        // Hide error notification on successful completion
        setShowStreamErrorNotification(false);

        // Reset event counter and events ref
        eventIdCounter.current = 0;
        eventsRef.current = [];

        setIsLoading(false);
        setDisabled(false);
        isRequestInProgressRef.current = false;

        // No need to poll - SSE already provided the complete message with ID
        break;

      case 'error':
        console.error('[SSE] Stream error:', event.error);
        console.error('[SSE] Error details:', {
          type: event.error_type,
          context: event.context,
          status_code: event.status_code,
          error_code: event.error_code
        });

        // Clear timeout on error event
        if (streamTimeoutRef.current) {
          clearTimeout(streamTimeoutRef.current);
          streamTimeoutRef.current = null;
        }

        setStreamingState(prev => ({
          ...prev,
          isStreaming: false,
          error: event.error,
          errorDetails: {
            error_type: event.error_type,
            context: event.context,
            status_code: event.status_code,
            error_code: event.error_code,
          },
          events: [...(prev.events || []), eventRecord]
        }));

        // Show notification for stream error
        setShowStreamErrorNotification(true);

        // Don't add error message to chat - let the retry component handle it
        // Keep the input enabled so user can retry
        setIsLoading(false);
        setDisabled(false);
        isRequestInProgressRef.current = false;
        break;
    }
  };

  const onAnswer = async (data: { answer: string; files?: File[]; mode?: 'workflow' | 'qa'; canvasOptions?: any }) => {
    if (!technicalId) return;

    // Block polling FIRST before any state updates
    isRequestInProgressRef.current = true;

    // Update UI state - React will batch these updates automatically
    setDisabled(true);

    // Display user question immediately (no ID)
    const userMessage: Message = {
      id: '', // No ID - will be replaced by polling
      type: 'user',
      text: data.answer,
      last_modified: new Date().toISOString(),
      isCanvasQA: data.mode === 'qa',
      files: data.files,
      raw: {}
    };
    setMessages(prev => [...prev, userMessage]);

    // Show preloader immediately after user message
    setIsLoading(true);

    try {
      let response;

      // Canvas QA mode - route to canvas-questions endpoint
      if (data.mode === 'qa') {
        // Map canvas tab to response_type
        const responseTypeMap: Record<string, string> = {
          'apps': 'app_config_json',
          'data': 'entity_json', // Data/Entities tab - entity config
          'workflow': 'workflow_json',
          'requirement': 'requirement_json', // Requirements tab - requirement config
          'code': 'text' // Code tab - plain text response
        };

        const response_type = responseTypeMap[canvasActiveTab] || 'text';

        // TODO: Collect canvas tab data to send in context
        // For now, just send active_tab
        const contextData: any = {
          active_tab: canvasActiveTab
        };

        // TODO: Get actual canvas data based on active tab
        // Examples:
        // - For 'data' tab: existing entities from the canvas
        // - For 'apps' tab: existing app config, entities, workflows
        // - For 'workflow' tab: existing workflow states and transitions
        // - For 'requirement' tab: existing requirements

        const canvasData = {
          chat_id: technicalId,
          question: data.answer,
          response_type: response_type, // Always include response_type (required by backend)
          context: contextData
        };
        const result = await assistantStore.postCanvasQuestion(canvasData);
        response = result.data;

        // Handle canvas response with hook
        if (response?.hook || response?.message) {
          // Display AI response immediately
          const aiMessage: Message = {
            id: response.id || `canvas-qa-${Date.now()}`,
            type: 'ai',
            text: response.message || 'Configuration generated',
            last_modified: new Date().toISOString(),
            isCanvasQA: true,
            raw: {
              hook: response.hook,
              hooks: response.hooks, // Include hooks array for canvas_open and other hooks
              canvasTab: canvasActiveTab // Store which tab this response is for
            }
          };
          setMessages(prev => [...prev, aiMessage]);

          setIsLoading(false);
          setDisabled(false);
          isRequestInProgressRef.current = false;
          return;
        }
      }
      // Message with files - use SSE streaming with file attachments
      else if (data.files && data.files.length > 0) {
        console.log('[SSE] Starting streaming for message with files:', data.answer, data.files.length);

        try {
          // Store the message for retry functionality
          setLastUserMessage(data.answer);

          // Abort any existing stream
          if (streamAbortControllerRef.current) {
            streamAbortControllerRef.current.abort();
          }

          // Start streaming with files
          const abortController = await assistantStore.streamChatMessage(
            technicalId,
            data.answer,
            handleStreamEvent,
            (error) => {
              console.error('[SSE] Stream error:', error);
              setStreamingState(prev => ({
                ...prev,
                isStreaming: false,
                error: error.message
              }));
              setShowStreamErrorNotification(true);
              setIsLoading(false);
              setDisabled(false);
              isRequestInProgressRef.current = false;
            },
            () => {
              console.log('[SSE] Stream completed successfully');
            },
            data.files,
            chatData?.adk_session_id
          );

          streamAbortControllerRef.current = abortController;
          return;
        } catch (error) {
          console.error('[SSE] Failed to start stream with files:', error);
          setUseStreaming(false);
        }
      }
      // Text-only message - use SSE streaming if enabled
      else if (useStreaming) {
        console.log('[SSE] Starting streaming for message:', data.answer);

        try {
          // Store the message for retry functionality
          setLastUserMessage(data.answer);

          // Abort any existing stream
          if (streamAbortControllerRef.current) {
            streamAbortControllerRef.current.abort();
          }

          // Start streaming
          const abortController = await assistantStore.streamChatMessage(
            technicalId,
            data.answer,
            handleStreamEvent,
            (error) => {
              console.error('[SSE] Stream error:', error);

              // Don't disable streaming immediately - let user retry
              console.log('[SSE] Stream error occurred, allowing retry');

              // Show error and re-enable input
              setStreamingState(prev => ({
                ...prev,
                isStreaming: false,
                error: error.message
              }));

              // Show notification for stream error
              setShowStreamErrorNotification(true);

              setIsLoading(false);
              setDisabled(false);
              isRequestInProgressRef.current = false;
            },
            () => {
              console.log('[SSE] Stream completed successfully');
            },
            undefined, // files parameter (not used in text-only mode)
            chatData?.adk_session_id
          );

          streamAbortControllerRef.current = abortController;

          // Don't continue with normal response handling - streaming will handle it
          return;
        } catch (error) {
          console.error('[SSE] Failed to start stream:', error);
          // Fall through to regular API call
          setUseStreaming(false);
        }

        // If streaming failed, fall back to regular API call
        const result = await assistantStore.postTextAnswers(technicalId, data);
        response = result.data;
      }
      else {
        // Streaming disabled - use regular API call
        const result = await assistantStore.postTextAnswers(technicalId, data);
        response = result.data;
      }

      // Handle synchronous response with message field (status 200)
      if (response?.message) {
        // Display AI response immediately
        const aiMessage: Message = {
          id: response.id || `msg-${Date.now()}`,
          type: 'ai',
          text: response.message,
          last_modified: new Date().toISOString(),
          raw: response
        };
        setMessages(prev => [...prev, aiMessage]);

        setIsLoading(false);
        setDisabled(false);
        isRequestInProgressRef.current = false;
        return;
      }

      // Handle asynchronous response with answer_technical_id
      // This means backend will process asynchronously - show loading state
      if (response?.answer_technical_id) {
        isRequestInProgressRef.current = false;

        // Show a placeholder message indicating processing
        const processingMessage: Message = {
          id: response.answer_technical_id,
          type: 'ai',
          text: 'Processing your request...',
          last_modified: new Date().toISOString(),
          raw: response
        };
        setMessages(prev => [...prev, processingMessage]);

        // Keep loading state - user can manually refresh to see result
        // Or we could implement a manual "Check for updates" button
        setIsLoading(false);
        setDisabled(false);
      } else {
        // No response - stop loading
        setIsLoading(false);
        setDisabled(false);
        isRequestInProgressRef.current = false;
      }
    } catch (error: any) {
      console.error('Error submitting answer:', error);

      // Remove the user message we just added (no ID)
      setMessages(prev => prev.filter(msg => msg.id !== ''));

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
      setIsLoading(false);
      setDisabled(false);
      isRequestInProgressRef.current = false;
    }
  };

  const onApproveQuestion = async (data: any) => {
    if (!technicalId) return;
    setIsLoading(true);
    setDisabled(true); // Block the chat when approving
    try {
      const response = await assistantStore.postApproveQuestion(technicalId, data);

      // Manually refresh to get updated state
      await loadChatHistory();

      setIsLoading(false);
      setDisabled(false);
    } catch (error) {
      console.error('Error approving question:', error);
      setIsLoading(false);
      setDisabled(false);
    }
  };

  const onUpdateNotification = async (data: any) => {
    if (!technicalId) return;
    setIsLoading(true);
    try {
      await assistantStore.putNotification(technicalId, data);

      // Manually refresh to get updated state
      await loadChatHistory();

      setIsLoading(false);
    } catch (error) {
      console.error('Error updating notification:', error);
      setIsLoading(false);
    }
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

  const onToggleCanvas = async () => {
    // Check if current chat is archived
    const currentChat = chatList?.find(chat => chat.technical_id === technicalId);
    const isArchived = currentChat?.status === 'archived';

    if (isArchived) {
      console.log('[Canvas Toggle] Cannot toggle canvas for archived chat');
      return;
    }

    // If repository is not configured and canvas is not visible, show the config prompt
    if (!canvasVisible && !githubRepository) {
      console.log('[Canvas Toggle] Repository not configured, checking for updates...');

      // Show loading state
      setIsLoadingCanvasToggle(true);

      try {
        // Fetch full conversation data to update chatData state
        const { data } = await assistantStore.getChatById(technicalId);

        // Update chatData so githubRepository gets extracted
        if (data) {
          setChatData(data);
        }

        // Check if repository is configured
        const chatBody = data?.chat_body;
        const hasRepo = !!(chatBody?.repository_name && chatBody?.repository_owner && chatBody?.repository_branch);

        if (hasRepo) {
          console.log('[Canvas Toggle] Repository now configured, opening canvas');
          setCanvasVisible(true);
        } else {
          console.log('[Canvas Toggle] Repository still not configured, showing prompt');
          setShowRepositoryConfigPrompt(true);
        }
      } catch (error) {
        console.error('[Canvas Toggle] Error checking repository:', error);
        // If check failed, still show the prompt
        setShowRepositoryConfigPrompt(true);
      } finally {
        // Hide loading state
        setIsLoadingCanvasToggle(false);
      }
      return;
    }

    // If opening canvas and repository is configured, check if we need to analyze
    if (!canvasVisible && githubRepository) {
      const { getRepositoryData } = useRepositoryStore.getState();
      const cachedData = getRepositoryData(technicalId);

      if (cachedData) {
        console.log('[Canvas Toggle] Opening canvas with repository, using cached data');
      } else {
        console.log('[Canvas Toggle] Opening canvas with repository, will trigger /analyze (no cache)');
        // AppsCanvas component will handle the loading automatically
      }
    }

    console.log('[Canvas Toggle] User toggled canvas:', { from: canvasVisible, to: !canvasVisible, hasRepo: !!githubRepository });
    setCanvasVisible(!canvasVisible);
  };

  // Handle configure new repository click
  const handleConfigureRepository = () => {
    setShowRepositoryConfigPrompt(false);
    onAnswer({ answer: 'please configure a github repository branch for me' });
  };

  // Handle use existing repository click
  const handleUseExistingRepository = () => {
    setShowRepositoryConfigPrompt(false);
    onAnswer({ answer: 'Please, clone my existing github repository branch...' });
  };

  // Handle close repository config prompt
  const handleCloseRepositoryConfigPrompt = () => {
    setShowRepositoryConfigPrompt(false);
  };

  // Handle setting textarea content from canvas "Send to Chat" buttons
  const handleSetTextareaContent = (callback: (content: string, options?: { collapse?: boolean }) => void) => {
    setSetTextareaContentCallback(() => callback);
  };

  const onEntitiesDetails = () => {
    setIsEntityDataOpen(!isEntityDataOpen);
  };

  const onRollbackCanvasAI = () => {
    if (!lastCanvasAIChange) {
      console.warn('⚠️ No Canvas AI changes to rollback');
      return;
    }

    try {
      // Restore previous entities and workflows to chat-specific storage
      const entitiesStorageKey = `mock_api_entities_chat_${technicalId}`;
      const workflowsStorageKey = `mock_api_workflows_chat_${technicalId}`;
      localStorage.setItem(entitiesStorageKey, JSON.stringify(lastCanvasAIChange.entities));
      localStorage.setItem(workflowsStorageKey, JSON.stringify(lastCanvasAIChange.workflows));

      // Restore app tab name if it was changed
      if (lastCanvasAIChange.appTabId && lastCanvasAIChange.oldAppName) {
        updateAppTab(lastCanvasAIChange.appTabId, {
          displayName: lastCanvasAIChange.oldAppName
        });
        console.log(`✅ Restored app tab name to: ${lastCanvasAIChange.oldAppName}`);
      }

      console.log('✅ Rolled back Canvas AI changes');

      // Show notification
      const notification: HeaderNotification = {
        id: notificationIdCounter.current++,
        type: 'info',
        title: 'Changes Rolled Back',
        message: 'Canvas AI changes have been undone',
        timestamp: 'Just now',
        isRead: true
      };
      setHeaderNotifications(prev => [notification, ...prev]);

      // Clear rollback state
      setLastCanvasAIChange(null);

      // Trigger canvas reload
      setTriggerCanvasReload(prev => !prev);
    } catch (error) {
      console.error('❌ Failed to rollback changes:', error);
    }
  };

  const onRetryCanvasAI = (messageId: string) => {
    // Find the Canvas AI message
    const canvasMessage = messages.find(m => m.id === messageId && m.isCanvasQA);
    if (!canvasMessage) {
      console.warn('⚠️ Canvas AI message not found');
      return;
    }

    // Find the user message that triggered this Canvas AI response
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      if (userMessage && userMessage.type === 'user') {
        // Re-send the question
        console.log('🔄 Retrying Canvas AI with question:', userMessage.text);
        onAnswer({ answer: userMessage.text as string, mode: 'qa' });
      }
    }
  };

  const onAddToCanvas = (result: { id: string; type: string; data: any }) => {
    console.log('[Canvas] Adding to canvas:', result);
    console.log('[Canvas] Result type:', result.type);
    console.log('[Canvas] Result data keys:', Object.keys(result.data || {}));
    console.log('[Canvas] Full result data:', JSON.stringify(result.data, null, 2));

    // Update canvas data based on type
    if (result.type === 'app_config' && result.data) {
      // Get current app ID (use chat ID)
      const appId = technicalId || 'app-default';

      try {
        // Parse the app config and extract entities
        // The data might be the app config directly, or wrapped in an 'app' property
        let appConfig = result.data;

        // Check if data has 'app' property or if it's the app config itself
        if (result.data.app) {
          appConfig = result.data;
          console.log('📦 App config received (wrapped):', appConfig);
        } else if (result.data.name && result.data.entities) {
          // Data is the app config directly, wrap it
          appConfig = { app: result.data };
          console.log('📦 App config received (unwrapped, now wrapping):', appConfig);
        } else {
          console.error('❌ Unexpected app config structure:', result.data);
          return;
        }

        // Extract entities from app config
        if (appConfig.app && appConfig.app.entities && Array.isArray(appConfig.app.entities)) {
          // Load existing entities from chat-specific mock API storage
          const entitiesStorageKey = `mock_api_entities_chat_${technicalId}`;
          const existingEntitiesData = localStorage.getItem(entitiesStorageKey);
          let allEntities: Record<string, any> = {};

          if (existingEntitiesData) {
            try {
              allEntities = JSON.parse(existingEntitiesData);
            } catch (e) {
              console.warn('Failed to parse existing entities, starting fresh');
            }
          }

          // Load existing workflows from chat-specific storage
          const workflowsStorageKey = `mock_api_workflows_chat_${technicalId}`;
          const existingWorkflowsData = localStorage.getItem(workflowsStorageKey);
          let allWorkflows: Record<string, any> = {};

          if (existingWorkflowsData) {
            try {
              allWorkflows = JSON.parse(existingWorkflowsData);
            } catch (e) {
              console.warn('Failed to parse existing workflows, starting fresh');
            }
          }

          // Add/update each entity from the app config
          appConfig.app.entities.forEach((entity: any) => {
            const entityId = `${appId}_${entity.name}_v${entity.version || 1}`;

            // Store entity
            allEntities[entityId] = {
              id: entityId,
              app_id: appId,
              name: entity.name,
              version: entity.version || '1',
              description: entity.description || '',
              cyoda_url: entity.cyoda_url || '',
              github_url: entity.github_url || '',
              model: entity.model || {}
            };

            console.log(`✅ Added/updated entity: ${entity.name} v${entity.version}`);

            // Store workflows for this entity
            if (entity.workflows && Array.isArray(entity.workflows)) {
              entity.workflows.forEach((workflow: any) => {
                const workflowId = `${appId}_${workflow.name || 'workflow'}_${entityId}`;

                allWorkflows[workflowId] = {
                  id: workflowId,
                  app_id: appId,
                  entity_id: entityId,
                  model_name: entity.name,
                  model_version: entity.version || '1',
                  name: workflow.name || 'workflow',
                  cyoda_url: workflow.cyoda_url || '',
                  github_url: workflow.github_url || '',
                  states: workflow.config?.states || workflow.states || {}
                };

                console.log(`✅ Added/updated workflow: ${workflow.name} for entity ${entity.name}`);
              });
            }
          });

          // Save previous state for rollback (before applying changes)
          const previousState = {
            entities: existingEntitiesData ? JSON.parse(existingEntitiesData) : {},
            workflows: existingWorkflowsData ? JSON.parse(existingWorkflowsData) : {},
            messageId: result.id,
            appTabId: undefined as string | undefined,
            oldAppName: undefined as string | undefined
          };

          // Update app tab name if app config has a name
          if (appConfig.app.name) {
            const activeAppTab = getActiveAppTab();
            if (activeAppTab) {
              previousState.appTabId = activeAppTab.id;
              previousState.oldAppName = activeAppTab.displayName;

              updateAppTab(activeAppTab.id, {
                displayName: appConfig.app.name
              });
              console.log(`✅ Updated app tab name to: ${appConfig.app.name}`);
            }
          }

          // Save updated entities and workflows back to chat-specific localStorage
          localStorage.setItem(entitiesStorageKey, JSON.stringify(allEntities));
          localStorage.setItem(workflowsStorageKey, JSON.stringify(allWorkflows));

          console.log(`✅ Saved ${Object.keys(allEntities).length} entities and ${Object.keys(allWorkflows).length} workflows to mock API storage`);

          // Store previous state for rollback
          setLastCanvasAIChange(previousState);

          // Trigger canvas reload
          setTriggerCanvasReload(prev => !prev);
        }
      } catch (error) {
        console.error('❌ Failed to process app config:', error);
      }
    } else if (result.type === 'entity_config' && result.data) {
      // Handle individual entity config
      const appId = technicalId || 'app-default';
      const entityId = `${appId}_${result.data.name}_v${result.data.version || 1}`;

      const entitiesStorageKey = `mock_api_entities_chat_${technicalId}`;
      const existingEntitiesData = localStorage.getItem(entitiesStorageKey);
      let allEntities: Record<string, any> = {};

      if (existingEntitiesData) {
        try {
          allEntities = JSON.parse(existingEntitiesData);
        } catch (e) {
          console.warn('Failed to parse existing entities');
        }
      }

      allEntities[entityId] = {
        id: entityId,
        app_id: appId,
        name: result.data.name,
        version: result.data.version || '1',
        description: result.data.description || '',
        model: result.data.model || {}
      };

      localStorage.setItem(entitiesStorageKey, JSON.stringify(allEntities));
      console.log(`✅ Saved entity config: ${result.data.name}`);
    } else if (result.type === 'workflow_config' && result.data) {
      // Handle individual workflow config
      const appId = technicalId || 'app-default';
      const workflowId = `${appId}_${result.data.name || 'workflow'}_${Date.now()}`;

      const workflowsStorageKey = `mock_api_workflows_chat_${technicalId}`;
      const existingWorkflowsData = localStorage.getItem(workflowsStorageKey);
      let allWorkflows: Record<string, any> = {};

      if (existingWorkflowsData) {
        try {
          allWorkflows = JSON.parse(existingWorkflowsData);
        } catch (e) {
          console.warn('Failed to parse existing workflows');
        }
      }

      allWorkflows[workflowId] = {
        id: workflowId,
        app_id: appId,
        entity_id: result.data.entity_id || '',
        name: result.data.name || 'workflow',
        states: result.data.states || {}
      };

      localStorage.setItem(workflowsStorageKey, JSON.stringify(allWorkflows));
      console.log(`✅ Saved workflow config: ${result.data.name}`);
    }

    // Show success message
    const notification: HeaderNotification = {
      id: notificationIdCounter.current++,
      type: 'success',
      title: 'Added to Canvas',
      message: `${result.type} configuration has been added to the canvas`,
      timestamp: 'Just now',
      isRead: true
    };
    setHeaderNotifications(prev => [notification, ...prev]);

    // Open canvas if not already open
    if (!canvasVisible) {
      setCanvasVisible(true);
    }

    // Switch to appropriate tab based on type
    if (result.type === 'entity_config') {
      setCanvasActiveTab('data');
    } else if (result.type === 'workflow_config') {
      setCanvasActiveTab('workflow');
    } else if (result.type === 'app_config') {
      setCanvasActiveTab('apps');
    } else if (result.type === 'requirement_config') {
      setCanvasActiveTab('requirement');
    }
  };

  // Workflow example detection hook
  useWorkflowExampleDetection({
    messages,
    canvasVisible,
    activeCanvasTab: canvasActiveTab,
    onOpenCanvas: () => {
      if (!canvasVisible) {
        console.log('[Canvas Auto-Open] Workflow example detection triggered canvas open');
        setCanvasVisible(true);
      }
    },
    onSwitchToWorkflowTab: () => {
      setCanvasActiveTab('workflow');
    },
    onSendMessage: (message: string) => {
      // Add the explanation as an AI answer message
      const aiMessage: Message = {
        id: `workflow-explanation-${Date.now()}`,
        type: 'answer',
        text: message,
        editable: false,
        approve: false,
        raw: {}
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    technicalId: technicalId || ''
  });

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

  const handleNotificationClick = (notificationId: number, messageId?: string, taskId?: string) => {
    // Mark notification as read
    handleMarkNotificationAsRead(notificationId);

    // Open tasks panel if taskId is provided
    if (taskId) {
      setIsTasksPanelOpen(true);
      // Trigger refresh of tasks when notification is clicked
      setTimeout(() => {
        tasksPanelRef.current?.refreshTasks().catch(err => {
          console.error('[ChatBotView] Failed to refresh tasks from notification:', err);
        });
      }, 100);
      return;
    }

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

  // Handle delete chat
  const handleDeleteChat = async (chatId: string) => {
    try {
      await assistantStore.deleteChatById(chatId);

      // Refresh the chat list
      await assistantStore.getChats(true);

      // If we're currently viewing the deleted chat, redirect to home
      if (chatId === technicalId) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Handle rename chat
  const handleRenameChat = async (chatId: string, newName: string) => {
    try {
      await assistantStore.renameChatById(chatId, { chat_name: newName });

      // Refresh the chat list
      await assistantStore.getChats(true);
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  // Load chat list for sidebar - always refresh to show new chats
  useEffect(() => {
    const loadChats = async () => {
      // Skip if currently transferring chats during login
      if (isTransferringChats) {
        return;
      }

      try {
        await assistantStore.getChats(true); // Always reset and reload
      } catch (error) {
        console.error('Failed to load chats:', error);
      }
    };

    loadChats();

    // Listen for chat list updates (e.g., when chat is deleted or renamed)
    const handleUpdateChatList = () => {
      assistantStore.getChats(true);
    };

    eventBus.$on(UPDATE_CHAT_LIST, handleUpdateChatList);

    return () => {
      eventBus.$off(UPDATE_CHAT_LIST, handleUpdateChatList);
    };
  }, [isTransferringChats]);

  // Refresh chat list when super user mode changes
  useEffect(() => {
    if (chatListReady) {
    }
  }, [superUserMode]);

  // Initialize chat and start polling
  useEffect(() => {
    if (!technicalId) return;

    // Clear any existing requests FIRST before setting new state
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

    // Close canvas and background tasks panels when switching chats
    console.log('[Chat Switch] Closing canvas and background tasks panels');
    setCanvasVisible(false);
    setIsTasksPanelOpen(false);

    // Load canvas active tab from chat-specific localStorage
    try {
      const stored = localStorage.getItem(`canvas-active-tab-${technicalId}`);
      if (stored && ['apps', 'data', 'workflow', 'requirement', 'code'].includes(stored)) {
        setCanvasActiveTab(stored as 'apps' | 'data' | 'workflow' | 'requirement' | 'code');
      } else {
        setCanvasActiveTab('requirement');
      }
    } catch (error) {
      console.warn('[Canvas State] Failed to load canvas active tab:', error);
      setCanvasActiveTab('requirement');
    }

    isInitialLoadRef.current = true; // Reset initial load flag for new chat
    notifiedMessagesRef.current.clear(); // Clear notified messages for new chat
    hasAutoOpenedCanvasRef.current = false; // Reset auto-open flag for new chat
    initialMessageSentRef.current = false; // Reset initial message sent flag for new chat

    // Load initial chat history (no continuous polling)
    loadChatHistory();

    return () => {
      // Cleanup on unmount or technicalId change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (streamAbortControllerRef.current) {
        streamAbortControllerRef.current.abort();
        streamAbortControllerRef.current = null;
      }
      if (promiseIntervalRef.current) {
        promiseIntervalRef.current = null;
      }
    };
  }, [technicalId]);

  // Check for initial message in localStorage when chat is ready
  useEffect(() => {
    console.log('[ChatBotView] Initial message check:', {
      technicalId,
      isLoading,
      hasChatData: !!chatData,
      isTempChat: technicalId?.startsWith('temp-'),
      alreadySent: initialMessageSentRef.current
    });

    if (!technicalId) return;

    // Skip temp chats
    if (technicalId.startsWith('temp-')) {
      console.log('[ChatBotView] Skipping initial message for temp chat');
      return;
    }

    // Check if already sent
    if (initialMessageSentRef.current) {
      console.log('[ChatBotView] Initial message already sent');
      return;
    }

    // Check for initial message when chat is loaded (not loading and chatData exists)
    if (!isLoading && chatData) {
      console.log('[ChatBotView] ✅ Chat ready, checking for initial message');

      // Check localStorage for initial message
      const storedMessage = localStorage.getItem(`initial-message-${technicalId}`);
      if (storedMessage) {
        console.log('[ChatBotView] ✅ Found initial message in localStorage:', storedMessage);

        // Remove from localStorage
        localStorage.removeItem(`initial-message-${technicalId}`);

        // Mark as sent BEFORE calling onAnswer to prevent race conditions
        initialMessageSentRef.current = true;

        // Send the initial message via streaming
        onAnswer({ answer: storedMessage });
      } else {
        console.log('[ChatBotView] No initial message found in localStorage');
      }
    } else {
      console.log('[ChatBotView] ⏳ Chat not ready yet');
    }
  }, [technicalId, isLoading, chatData]);

  // Update disabled state based on loading
  useEffect(() => {
    setDisabled(isLoading);
  }, [isLoading]);

  // Close canvas if navigating to an archived chat
  useEffect(() => {
    const currentChat = chatList?.find(chat => chat.technical_id === technicalId);
    const isArchived = currentChat?.status === 'archived';

    if (isArchived && canvasVisible) {
      console.log('[Canvas] Closing canvas for archived chat');
      setCanvasVisible(false);
    }
  }, [technicalId, chatList, canvasVisible]);

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

  // Track task completion and send notifications when tasks panel is closed
  // NOTE: Background polling is DISABLED - polling only happens when tasks panel is open via TaskDashboard
  const previousTaskStatusesRef = useRef<Map<string, string>>(new Map());
  const taskPollingCleanupRef = useRef<(() => void) | null>(null);

  // Disabled background task polling - only TaskDashboard polls when panel is open
  // useEffect(() => {
  //   if (!technicalId) return;
  //   const cleanup = taskService.pollConversationTasks(...);
  //   return () => cleanup();
  // }, [technicalId]);

  // Clear previous task statuses when switching chats
  useEffect(() => {
    return () => {
      previousTaskStatusesRef.current.clear();
    };
  }, [technicalId]);

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

  // Check if current chat is archived
  const currentChat = chatList?.find(chat => chat.technical_id === technicalId);
  const isArchivedChat = currentChat?.status === 'archived';

  // Extract GitHub repository info from chatData
  const githubRepository: GitHubRepositoryInfo | undefined = useMemo(() => {
    const chatBody = chatData?.chat_body;
    console.log('🔍 Extracting GitHub repository info from chatData:', {
      hasChatData: !!chatData,
      hasChatBody: !!chatBody,
      repository_name: chatBody?.repository_name,
      repository_owner: chatBody?.repository_owner,
      repository_branch: chatBody?.repository_branch,
      repository_url: chatBody?.repository_url,
      installation_id: chatBody?.installation_id
    });

    if (chatBody?.repository_name && chatBody?.repository_owner && chatBody?.repository_branch) {
      const repoInfo = {
        repositoryName: chatBody.repository_name,
        owner: chatBody.repository_owner,
        branch: chatBody.repository_branch,
        repositoryUrl: chatBody.repository_url,
        installationId: chatBody.installation_id ? parseInt(chatBody.installation_id, 10) : undefined
      };
      console.log('✅ GitHub repository info extracted:', repoInfo);
      return repoInfo;
    }
    console.log('⚠️ GitHub repository info not available in chatData');
    return undefined;
  }, [chatData]);

  return (
    <div className="main-layout bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
      <Header
        showActions={true}
        onToggleCanvas={onToggleCanvas}
        onToggleChatHistory={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
        onToggleEntities={onEntitiesDetails}
        onToggleEnvironments={() => setIsEnvironmentsOpen(!isEnvironmentsOpen)}
        onToggleTasks={() => setIsTasksPanelOpen(!isTasksPanelOpen)}
        canvasVisible={canvasVisible}
        chatHistoryVisible={isChatHistoryOpen}
        entitiesVisible={isEntityDataOpen}
        environmentsVisible={isEnvironmentsOpen}
        tasksVisible={isTasksPanelOpen}
        notifications={headerNotifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onNotificationClick={handleNotificationClick}
        isArchivedChat={isArchivedChat}
        showRepositoryConfigPrompt={showRepositoryConfigPrompt}
        onConfigureRepository={handleConfigureRepository}
        onUseExistingRepository={handleUseExistingRepository}
        onCloseRepositoryConfigPrompt={handleCloseRepositoryConfigPrompt}
        isLoadingCanvasToggle={isLoadingCanvasToggle}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Enhanced Left Sidebar - Resizable Chat History Panel */}
        {isChatHistoryOpen && (
          <div
            className={`resizable-panel h-full ${chatHistoryResize.isResizing ? 'resizing' : ''}`}
            style={{
              width: `${chatHistoryResize.width}px`,
              zIndex: chatHistoryResize.isResizing ? 30 : 10
            }}
          >
            <ChatHistoryPanel
              chatGroups={chatGroups}
              currentChatId={technicalId}
              isLoading={isLoadingChats}
              onResizeMouseDown={chatHistoryResize.handleMouseDown}
              isResizing={chatHistoryResize.isResizing}
              showHomeAsActive={false}
              onClose={() => setIsChatHistoryOpen(false)}
              onDeleteChat={handleDeleteChat}
              onRenameChat={handleRenameChat}
              hasMoreChats={assistantStore.hasMoreChats}
              isLoadingMore={assistantStore.isLoadingMoreChats}
              onLoadMore={() => assistantStore.loadMoreChats()}
              onRefresh={() => assistantStore.getChats(true)}
            />
          </div>
        )}

        {/* Environments Panel - Between history and canvas */}
        {isEnvironmentsOpen && (
          <div
            className={`resizable-panel h-full ${environmentsResize.isResizing ? 'resizing' : ''}`}
            style={{
              width: `${environmentsResize.width}px`,
              zIndex: environmentsResize.isResizing ? 30 : 10
            }}
          >
            <EnvironmentsPanel
              onResizeMouseDown={environmentsResize.handleMouseDown}
              isResizing={environmentsResize.isResizing}
              onClose={() => setIsEnvironmentsOpen(false)}
              isFullscreen={false}
              onToggleFullscreen={() => {
                // Save current width before going fullscreen
                localStorage.setItem('environments-width-before-fullscreen', environmentsResize.width.toString());
                navigate('/environments', { state: { from: `/chat/${technicalId}` } });
              }}
            />
          </div>
        )}

        {/* Canvas Sidebar Panel - Between chat history and main content */}
        {canvasVisible && (
          <div
            className={`bg-slate-800/95 backdrop-blur-sm border-r border-slate-600 flex flex-col relative resizable-panel h-full ${canvasResize.isResizing ? 'resizing' : ''} ${canvasResize.width < 600 ? 'canvas-narrow' : ''}`}
            style={{
              width: `${canvasResize.width}px`,
              zIndex: canvasResize.isResizing ? 30 : 11
            }}
          >
            <ChatBotCanvas
              technicalId={technicalId}
              githubRepository={githubRepository}
              messages={messages}
              isLoading={isLoading}
              onAnswer={onAnswer}
              onApproveQuestion={onApproveQuestion}
              onUpdateNotification={onUpdateNotification}
              onToggleCanvas={onToggleCanvas}
              activeTab={canvasActiveTab}
              onActiveTabChange={setCanvasActiveTab}
              triggerCanvasReload={triggerCanvasReload}
              setTextareaContentCallback={setTextareaContentCallback}
            />

            {/* Resize Handle */}
            <ResizeHandle
              position="right"
              onMouseDown={canvasResize.handleMouseDown}
              isResizing={canvasResize.isResizing}
            />
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 main-content">
          <ChatBot
            technicalId={technicalId}
            onAnswer={onAnswer}
            onApproveQuestion={onApproveQuestion}
            onToggleCanvas={onToggleCanvas}
            onEntitiesDetails={onEntitiesDetails}
            onUpdateNotification={onUpdateNotification}
            onScrollToBottom={handleScrollToBottom}
            onAddToCanvas={onAddToCanvas}
            onRollbackCanvasAI={onRollbackCanvasAI}
            onRetryCanvasAI={onRetryCanvasAI}
            hasCanvasAIRollback={!!lastCanvasAIChange}
            activeCanvasTab={canvasActiveTab}
            disabled={disabled}
            isLoading={isLoading}
            messages={messages}
            chatData={chatData}
            canvasVisible={canvasVisible}
            streamingState={streamingState}
            githubRepository={githubRepository}
            onOpenTaskPanel={() => {
              console.log('[ChatBotView] onOpenTaskPanel called, opening Tasks Panel');
              setIsTasksPanelOpen(true);
              // Trigger refresh of tasks when button is clicked
              setTimeout(() => {
                tasksPanelRef.current?.refreshTasks().catch(err => {
                  console.error('[ChatBotView] Failed to refresh tasks:', err);
                });
              }, 100);
            }}
            onOpenEnvironmentPanel={() => {
              console.log('[ChatBotView] onOpenEnvironmentPanel called, opening Environments Panel');
              setIsEnvironmentsOpen(true);
            }}
            onRetryStreaming={retryStreaming}
            isRetrying={isRetrying}
            onStopRequest={stopCurrentRequest}
            onSetTextareaContent={handleSetTextareaContent}
          />
        </div>

        {/* Tasks Panel - Resizable */}
        {isTasksPanelOpen && (
          <div
            className={`resizable-panel h-full relative ${tasksResize.isResizing ? 'resizing' : ''}`}
            style={{
              width: `${tasksResize.width}px`,
              zIndex: tasksResize.isResizing ? 30 : 10
            }}
          >
            <TasksPanel
              ref={tasksPanelRef}
              isOpen={isTasksPanelOpen}
              onClose={() => setIsTasksPanelOpen(false)}
              chatData={chatData}
              conversationId={technicalId}
              width={tasksResize.width}
              onWidthChange={tasksResize.setWidth}
              onRestartTask={(userRequest) => {
                // Send the original user request as a new message
                onAnswer({ answer: userRequest });
              }}
            />

            {/* Resize Handle */}
            <ResizeHandle
              position="left"
              onMouseDown={tasksResize.handleMouseDown}
              isResizing={tasksResize.isResizing}
            />
          </div>
        )}
      </div>

      {/* Stream Error Notification */}
      {showStreamErrorNotification && streamingState?.error && (
        <StreamErrorNotification
          error={streamingState.error}
          errorDetails={streamingState.errorDetails}
          onRetry={retryStreaming}
          onDismiss={() => setShowStreamErrorNotification(false)}
          isRetrying={isRetrying}
          visible={showStreamErrorNotification}
        />
      )}

      {/* Streaming Status Banner */}
      <StreamingStatusBanner
        isStreamingEnabled={useStreaming}
        onEnableStreaming={enableStreaming}
        onDismiss={() => setShowStreamingBanner(false)}
        visible={showStreamingBanner}
      />

    </div>
  );
};

export default ChatBotView;
