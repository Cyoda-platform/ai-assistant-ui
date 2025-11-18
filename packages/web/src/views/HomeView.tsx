import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  History,
  Home,
  Settings,
  HelpCircle,
  Clock,
  Activity,
  Send,
  ChevronRight,
  CheckCircle2,
  Info,
  Zap,
  Bell,
  X,
  Maximize2,
  Minimize2,
  Paperclip,
  Rocket,
  Search,
  Database,
  GitBranch,
  BarChart3,
  Package
} from 'lucide-react';
import { useAssistantStore } from '@/stores/assistant';
import { useAuthStore, useSuperUserMode } from '@/stores/auth';
import Header from '@/components/Header/Header';

import ChatHistoryPanel from '@/components/ChatHistoryPanel/ChatHistoryPanel';
import EnvironmentsPanel from '@/components/EnvironmentsPanel/EnvironmentsPanel';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST, SHOW_LOGIN_POPUP } from '@/helpers/HelperConstants';
import { groupChatsByDate } from '@/helpers/HelperChatGroups';

const HomeView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(true);
  const [isEnvironmentsOpen, setIsEnvironmentsOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [pendingMessage, setPendingMessage] = useState<{ input: string; files: File[] } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(60);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialWidthRef = useRef<number>(0);
  const mainContentRef = useRef<HTMLDivElement>(null);



  // Check for 'name' URL parameter and populate chat input
  useEffect(() => {
    const nameParam = searchParams.get('name');
    if (nameParam) {
      // Decode the URL parameter and set it as chat input
      const decodedName = decodeURIComponent(nameParam);
      setChatInput(decodedName);

      // Focus the chat input after a short delay to ensure it's rendered
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);

      // Remove the parameter from URL to clean it up
      searchParams.delete('name');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    if (chatInputRef.current) {
      const textarea = chatInputRef.current;
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Calculate new height based on content
      const newHeight = Math.max(60, Math.min(300, textarea.scrollHeight));
      setTextareaHeight(newHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Auto-resize when content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [chatInput]);

  const assistantStore = useAssistantStore();
  const authStore = useAuthStore();
  const superUserMode = useSuperUserMode(); // Watch for super user mode changes
  const isLoadingChats = useAssistantStore((state) => state.isLoadingChats);
  const chatListReady = useAssistantStore((state) => state.chatListReady);
  const isTransferringChats = useAssistantStore((state) => state.isTransferringChats);

  // Resizable chat history panel - start at max width
  const chatHistoryResize = useResizablePanel({
    defaultWidth: 400, // Start at maximum width
    minWidth: 200,     // Minimum width for chat names
    maxWidth: 400,     // Maximum width to not overwhelm
    storageKey: 'home-chatHistory-width'
  });

  // Resizable environments panel
  const environmentsResize = useResizablePanel({
    defaultWidth: 500,  // Start at 500px
    minWidth: 350,      // Minimum width for environments
    maxWidth: 1200,     // Maximum width - very wide
    storageKey: 'home-environments-width'
  });

  // Check if returning from fullscreen and reopen environments panel
  useEffect(() => {
    const wasInFullscreen = localStorage.getItem('environments-width-before-fullscreen');
    if (wasInFullscreen) {
      // Reopen the environments panel
      setIsEnvironmentsOpen(true);
    }
  }, []);

  // Load chats on mount only if not already loaded
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
      assistantStore.getChats().catch(error => {
        console.error('Failed to refresh chat list after super user mode change:', error);
      });
    }
  }, [superUserMode]);

  // Detect main content area resize and hide feature cards when width decreased by 50%
  useEffect(() => {
    if (!mainContentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const currentWidth = entry.contentRect.width;

        // Initialize on first observation
        if (initialWidthRef.current === 0) {
          initialWidthRef.current = currentWidth;
          return;
        }

        const initialWidth = initialWidthRef.current;
        const widthDecrease = ((initialWidth - currentWidth) / initialWidth) * 100;


        // Hide cards if width decreased by 50% or more
        if (widthDecrease >= 50) {
          setIsResizing(true);
        } else {
          setIsResizing(false);
        }

        // Update initial width if content is getting larger (reset baseline)
        if (currentWidth > initialWidth) {
          initialWidthRef.current = currentWidth;
        }
      }
    });

    resizeObserver.observe(mainContentRef.current);

    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Check if user is a guest by parsing the token
  const isGuestUser = useMemo(() => {
    const token = authStore.token;
    if (!token) return false;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      const orgId = (parsed.caas_org_id || '').toLowerCase();
      // Check if orgId starts with 'guest' (e.g., "guest.d1b4456f5-07a3-4c92-b57e-64c4b4f09d6")
      return orgId.startsWith('guest');
    } catch (e) {
      return false;
    }
  }, [authStore.token]);

  // Function to actually submit the chat
  const submitChat = async (input: string, files: File[]) => {
    setIsLoading(true);

    // Store the full message to be sent after chat creation
    const initialMessage = input;

    // Generate temporary ID for optimistic navigation
    const tempId = `temp-${Date.now()}`;

    // Navigate immediately with temp ID - show preloader in chat view
    console.log('[HomeView] Navigating to temp chat:', tempId);
    navigate(`/chat/${tempId}?openCanvas=true&creating=true`);

    try {
      let response;

      // Create chat with proper name (first 50 chars of message)
      const chatName = input.substring(0, 50) + (input.length > 50 ? '...' : '');

      // If files are attached, use FormData
      if (files.length > 0) {
        const formData = new FormData();
        formData.append('name', chatName);
        formData.append('description', '');

        // Append all files
        files.forEach(file => {
          formData.append('files', file);
        });

        response = await assistantStore.postChats(formData);
      } else {
        // No files, use regular JSON
        response = await assistantStore.postChats({
          name: chatName,
          description: ''
        });
      }

      if (response?.data?.technical_id) {
        const realId = response.data.technical_id;

        // Refresh chat list in background
        assistantStore.getChats().catch(error => {
          console.error('Failed to refresh chat list:', error);
        });

        // Navigate to real chat ID with initial message in localStorage
        console.log('[HomeView] Navigating to real chat:', realId);
        console.log('[HomeView] Storing initial message in localStorage:', initialMessage);

        // Store initial message in localStorage so ChatBotView can pick it up
        localStorage.setItem(`initial-message-${realId}`, initialMessage);

        navigate(`/chat/${realId}?openCanvas=true`, { replace: true });
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      // On error, navigate back to home
      navigate('/', { replace: true });
    } finally {
      setIsLoading(false);
      setAttachedFiles([]);
      setChatInput('');
      setTextareaHeight(60); // Reset to default height
      setPendingMessage(null);
    }
  };

  // Watch for authentication changes - if user logs in and there's a pending message, send it
  useEffect(() => {
    if (!isGuestUser && pendingMessage && authStore.token && authStore.tokenType === 'private') {
      // User has logged in and there's a pending message
      submitChat(pendingMessage.input, pendingMessage.files);
    }
  }, [isGuestUser, authStore.token, authStore.tokenType, pendingMessage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        chatInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    // Check if user is a guest
    if (isGuestUser) {
      // Capture the current input and files in local variables
      const currentInput = chatInput.trim();
      const currentFiles = [...attachedFiles];

      // Store the pending message
      setPendingMessage({ input: currentInput, files: currentFiles });

      // Show login popup with guest user message
      eventBus.$emit(SHOW_LOGIN_POPUP, {
        isGuestUser: true,
        onProceedWithoutLogin: () => {
          // User chose to proceed without login - use the captured values
          submitChat(currentInput, currentFiles);
        }
      });
      return;
    }

    // Not a guest user, submit directly
    await submitChat(chatInput.trim(), attachedFiles);
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      // Validate each file
      const validFiles: File[] = [];
      newFiles.forEach(file => {
        // Basic validation - you can add more checks here
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          console.warn(`File ${file.name} is too large`);
        } else {
          validFiles.push(file);
        }
      });
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const quickActions = [
    {
      label: 'What is CYODA?',
      action: () => setChatInput('What is CYODA and how does it work?'),
      icon: <Info size={20} className="text-slate-300" />,
      description: 'Learn about the CYODA platform'
    },
    {
      label: 'What is my CYODA env?',
      action: () => setChatInput('Show me my current CYODA environment status and configuration'),
      icon: <Search size={20} className="text-slate-300" />,
      description: 'Check environment status'
    },
    {
      label: 'Build a REST API',
      action: () => setChatInput('Build a complete REST API with CRUD operations for customer management'),
      icon: <Zap size={20} className="text-slate-300" />,
      description: 'Create a full REST API application'
    },
    {
      label: 'Help with workflows',
      action: () => setChatInput('Create a workflow for Order entity with create, update, and cancel transitions'),
      icon: <GitBranch size={20} className="text-slate-300" />,
      description: 'Design entity workflows'
    },
    {
      label: 'Analyze my repository',
      action: () => setChatInput('Analyze my repository structure and show all entities, workflows, and files'),
      icon: <BarChart3 size={20} className="text-slate-300" />,
      description: 'Get repository insights'
    },
    {
      label: 'Add new entity',
      action: () => setChatInput('Add a Customer entity with id, name, email, and phone fields'),
      icon: <Database size={20} className="text-slate-300" />,
      description: 'Create data entities'
    }
  ];



  // Drag and drop handlers
  const [isDragging, setIsDragging] = useState(false);
  let dragCounter = 0;

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter = 0;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Dummy handlers for canvas (since we're on home page without active chat)
  const handleAnswer = (data: { answer: string; files?: File[] }) => {
  };

  const handleApproveQuestion = (data: any) => {
  };

  const handleUpdateNotification = (data: any) => {
  };

  // Handle delete chat
  const handleDeleteChat = async (chatId: string) => {
    try {
      await assistantStore.deleteChatById(chatId);
      // Refresh the chat list
      await assistantStore.getChats();
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Group chats by date using shared utility
  const chatGroups = groupChatsByDate(assistantStore.chatList);
  const hasChats = chatGroups.length > 0;

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

  const features = [
    {
      icon: <Rocket size={20} className="text-teal-400" />,
      title: 'Complete Application Generation',
      description: 'Generate full applications with entities, workflows, REST APIs, and database schemas in Python or Java.',
      color: 'teal'
    },
    {
      icon: <Database size={20} className="text-teal-400" />,
      title: 'Entity-Driven Architecture',
      description: 'Create data entities with validation, processors, and automatic CRUD operations using CYODA\'s EDBMS.',
      color: 'teal'
    },
    {
      icon: <GitBranch size={20} className="text-teal-400" />,
      title: 'Intelligent Workflows',
      description: 'Design state machines and business logic with visual workflow editors and automated transitions.',
      color: 'teal'
    }
  ];

  return (
    <div className="main-layout bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
      <Header
        showActions={true}
        onToggleChatHistory={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
        onToggleEnvironments={() => setIsEnvironmentsOpen(!isEnvironmentsOpen)}
        chatHistoryVisible={isChatHistoryOpen}
        environmentsVisible={isEnvironmentsOpen}
        showCanvasButton={false}
      />
      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Enhanced Left Sidebar - Resizable Chat History Panel */}
        {isChatHistoryOpen && (
          <div
            className={`h-full ${chatHistoryResize.isResizing ? 'resizing' : ''}`}
            style={{
              width: `${chatHistoryResize.width}px`,
              zIndex: chatHistoryResize.isResizing ? 30 : 10
            }}
          >
            <ChatHistoryPanel
              chatGroups={chatGroups}
              isLoading={isLoadingChats}
              onResizeMouseDown={chatHistoryResize.handleMouseDown}
              isResizing={chatHistoryResize.isResizing}
              showHomeAsActive={true}
              onClose={() => setIsChatHistoryOpen(false)}
              onDeleteChat={handleDeleteChat}
              hasMoreChats={assistantStore.hasMoreChats}
              isLoadingMore={assistantStore.isLoadingMoreChats}
              onLoadMore={() => assistantStore.loadMoreChats()}
            />
          </div>
        )}

        {/* Environments Panel */}
        {isEnvironmentsOpen && (
          <div
            className={`h-full ${environmentsResize.isResizing ? 'resizing' : ''}`}
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
                navigate('/environments', { state: { from: '/' } });
              }}
            />
          </div>
        )}

        {/* Enhanced Main Content */}
        <div ref={mainContentRef} className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
            <div className="p-3 sm:p-4 md:p-4 lg:p-5 xl:p-6 min-h-full flex flex-col min-w-0">
            <div className="w-full flex-1 flex flex-col min-w-0 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto">
              {/* Enhanced Header */}
              <div className="mb-6 animate-fade-in-up" style={{ marginTop: '32px' }}>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-teal-400 uppercase tracking-wider">Ready to Build</span>
                </div>
                <div className="flex items-center space-x-3 mb-2">
                  <img src="/favicon.svg" alt="CYODA" className="w-10 h-10" style={{ transform: 'translateY(-25%)', width: '42px', height: '42px' }} />
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    Welcome to CYODA AI Assistant
                  </h1>
                </div>
                <p className="text-slate-400 text-base leading-relaxed">
                  Create complete applications with entities, workflows, and REST APIs using intelligent code generation
                </p>
              </div>

              {/* Enhanced Feature Cards */}
              {!isResizing && (
                <div className="grid md:grid-cols-3 gap-4 mb-6 min-w-0">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 hover:border-slate-600 hover:bg-slate-800/70 transition-all duration-200 animate-fade-in-up hover:shadow-lg"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white mb-1.5 text-sm">{feature.title}</h3>
                          <p className="text-slate-300 text-xs leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Input - Lovable Style */}
              <div className="mb-4">
                <form onSubmit={handleChatSubmit}>
                  <div
                    className="relative"
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {isDragging && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-90 backdrop-blur-sm rounded-3xl z-10 border-2 border-dashed border-teal-500">
                        <div className="text-center">
                          <Paperclip size={48} className="text-teal-400 mx-auto mb-2" />
                          <span className="text-teal-400 font-medium text-lg">Drop files here</span>
                        </div>
                      </div>
                    )}

                    <textarea
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onPaste={() => {
                        // Allow the paste to happen first, then adjust height
                        setTimeout(() => {
                          adjustTextareaHeight();
                        }, 0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit(e);
                        }
                      }}
                      placeholder="What would you like to build together today?"
                      rows={1}
                      className="w-full bg-slate-800/60 backdrop-blur-sm border-2 border-slate-600/50 rounded-3xl px-6 pr-28 py-4 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500/80 focus:bg-slate-800/80 transition-all duration-200 text-lg shadow-2xl resize-none"
                      style={{
                        height: `${textareaHeight}px`,
                        minHeight: '60px',
                        maxHeight: '300px',
                        overflowY: textareaHeight >= 300 ? 'auto' : 'hidden',
                        lineHeight: '1.5'
                      }}
                      disabled={isLoading}
                    />

                    {/* Bottom Right Controls - Lovable Style */}
                    <div className="absolute right-4 bottom-4 flex items-center z-10">
                      {/* Attach File Button */}
                      <button
                        type="button"
                        onClick={handleFileAttach}
                        className="rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 flex items-center justify-center flex-shrink-0"
                        style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', maxWidth: '40px', maxHeight: '40px', transform: 'translateX(25%)' }}
                        title="Attach file"
                      >
                        <Paperclip size={18} />
                      </button>

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isLoading}
                        className="text-emerald-400 hover:text-emerald-500 hover:scale-110 transition-all duration-200 flex items-center justify-center flex-shrink-0 p-3"
                        style={{ transform: 'translateY(5%)' }}
                        title="Send Message (Enter)"
                      >
                        {isLoading ? (
                          <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-600 rounded-full animate-spin" />
                        ) : (
                          <Send size={24} className="text-emerald-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* File attachments display - Below input */}
                {attachedFiles.length > 0 && (
                  <div className="mt-2 sm:mt-3 md:mt-4 p-2 sm:p-3 md:p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-lg sm:rounded-xl md:rounded-2xl">
                    <div className="flex items-center justify-between mb-2 sm:mb-2.5 md:mb-3">
                      <span className="text-xs sm:text-sm font-medium text-slate-300">Attached Files ({attachedFiles.length})</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles([])}
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="bg-slate-700/50 text-slate-300 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm flex items-center space-x-1.5 sm:space-x-2 border border-slate-600">
                          <Paperclip size={12} className="sm:w-[13px] sm:h-[13px] md:w-[14px] md:h-[14px] text-teal-400 flex-shrink-0" />
                          <span className="max-w-[100px] sm:max-w-[150px] md:max-w-[200px] truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="hover:text-red-400 transition-colors ml-1 flex-shrink-0"
                          >
                            <X size={12} className="sm:w-[13px] sm:h-[13px] md:w-[14px] md:h-[14px]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.xlsx,.pptx,.xml,.json,text/*,image/*"
                />
              </div>

              {/* Quick Actions */}
              <div className="mb-4">
                <h2 className="text-base font-semibold mb-2 sm:mb-2.5 md:mb-2.5 flex items-center space-x-1.5 sm:space-x-2 text-white">
                  <Activity className="text-teal-400 w-5 h-5" />
                  <span>Conversation starters</span>
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-3 md:gap-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="text-left p-3 sm:p-4 md:p-4 lg:p-4 glass-light rounded-lg hover:border-teal-500/50 hover:bg-teal-500/10 transition-all duration-200 group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5 p-2 rounded-lg bg-slate-700/50 border border-slate-600 group-hover:bg-slate-600/50 group-hover:border-slate-500 transition-all duration-200">
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm sm:text-base font-medium text-slate-200 group-hover:text-white transition-colors mb-1">
                            {action.label}
                          </div>
                          <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors line-clamp-2">
                            {action.description}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacer to push footer to bottom */}
              <div className="flex-1"></div>

              {/* Footer */}
              <div className="mt-auto pt-4 pb-3">
                <p className="text-center text-slate-400 text-[10px] sm:text-xs md:text-xs leading-relaxed px-2">
                  By using this service, you confirm that you have read and agree to our{' '}
                  <a href="https://cyoda.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline transition-colors font-medium">Terms & Conditions</a>
                  {' '}and{' '}
                  <a href="https://cyoda.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline transition-colors font-medium">Privacy Policy</a>
                  {' • '}
                  Copyright © 2025 <a href="https://cyoda.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">CYODA Ltd</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
