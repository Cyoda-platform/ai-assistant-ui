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
  Paperclip
} from 'lucide-react';
import { useAssistantStore } from '@/stores/assistant';
import { useAuthStore, useSuperUserMode } from '@/stores/auth';
import Header from '@/components/Header/Header';
import ChatBotCanvas from '@/components/ChatBot/ChatBotCanvas';
import ChatHistoryPanel from '@/components/ChatHistoryPanel/ChatHistoryPanel';
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
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [pendingMessage, setPendingMessage] = useState<{ input: string; files: File[] } | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Check if canvas should be opened from URL parameter
  useEffect(() => {
    const shouldOpenCanvas = searchParams.get('canvas') === 'true';
    if (shouldOpenCanvas) {
      setCanvasVisible(true);
      // Remove the parameter from URL to clean it up
      searchParams.delete('canvas');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const assistantStore = useAssistantStore();
  const authStore = useAuthStore();
  const superUserMode = useSuperUserMode(); // Watch for super user mode changes
  const isLoadingChats = useAssistantStore((state) => state.isLoadingChats);
  const chatListReady = useAssistantStore((state) => state.chatListReady);

  // Resizable chat history panel - start at max width
  const chatHistoryResize = useResizablePanel({
    defaultWidth: 400, // Start at maximum width
    minWidth: 200,     // Minimum width for chat names
    maxWidth: 400,     // Maximum width to not overwhelm
    storageKey: 'home-chatHistory-width'
  });

  // Resizable canvas panel
  const canvasResize = useResizablePanel({
    defaultWidth: 800,
    minWidth: 400,
    maxWidth: 1200,
    storageKey: 'home-canvas-width'
  });

  // Load chats on mount only if not already loaded
  useEffect(() => {
    const loadChats = async () => {
      // Skip if chat list is already loaded
      if (chatListReady) {
        console.log('Chat list already loaded, skipping getChats call');
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
  }, [chatListReady]);

  // Refresh chat list when super user mode changes
  useEffect(() => {
    if (chatListReady) {
      console.log('🔄 Super user mode changed, refreshing chat list');
      assistantStore.getChats().catch(error => {
        console.error('Failed to refresh chat list after super user mode change:', error);
      });
    }
  }, [superUserMode]);

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
    try {
      let response;

      // If files are attached, use FormData
      if (files.length > 0) {
        const formData = new FormData();
        formData.append('name', input);
        formData.append('description', '');

        // Append all files
        files.forEach(file => {
          formData.append('files', file);
        });

        response = await assistantStore.postChats(formData);
      } else {
        // No files, use regular JSON
        response = await assistantStore.postChats({
          name: input,
          description: ''
        });
      }

      if (response?.data?.technical_id) {
        // Refresh chat list in background (don't await - let it load while navigating)
        assistantStore.getChats().catch(error => {
          console.error('Failed to refresh chat list:', error);
        });

        // Navigate immediately to chat details page
        navigate(`/chat/${response.data.technical_id}`);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setIsLoading(false);
      setAttachedFiles([]);
      setChatInput('');
      setPendingMessage(null);
    }
  };

  // Watch for authentication changes - if user logs in and there's a pending message, send it
  useEffect(() => {
    if (!isGuestUser && pendingMessage && authStore.token && authStore.tokenType === 'private') {
      // User has logged in and there's a pending message
      console.log('User logged in, sending pending message:', pendingMessage);
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
    { label: 'Deploy my environment', action: () => setChatInput('Deploy my environment') },
    { label: 'What is my CYODA env?', action: () => setChatInput('What is my CYODA environment?') },
    { label: 'Build a REST API', action: () => setChatInput('Build a REST API application') },
    { label: 'Help with workflows', action: () => setChatInput('Help me understand CYODA workflows') }
  ];

  // Canvas handlers
  const handleToggleCanvas = () => {
    const newCanvasState = !canvasVisible;
    setCanvasVisible(newCanvasState);

    // When closing canvas, exit fullscreen mode
    if (!newCanvasState && isCanvasFullscreen) {
      setIsCanvasFullscreen(false);
    }
  };

  const handleToggleCanvasFullscreen = () => {
    const newFullscreenState = !isCanvasFullscreen;
    setIsCanvasFullscreen(newFullscreenState);

    // Close chat history when entering fullscreen mode
    if (newFullscreenState) {
      setIsChatHistoryOpen(false);
    }
  };

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
    console.log('Answer from canvas:', data);
  };

  const handleApproveQuestion = (data: any) => {
    console.log('Approve question:', data);
  };

  const handleUpdateNotification = (data: any) => {
    console.log('Update notification:', data);
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
      icon: <CheckCircle2 size={20} className="text-green-400" />,
      title: 'AI-Powered Development',
      description: 'Build applications with intelligent assistance and automated workflows.',
      color: 'green'
    },
    {
      icon: <Info size={20} className="text-blue-400" />,
      title: 'Entity-Driven Architecture',
      description: 'Leverage CYODA\'s entity database for scalable, event-driven applications.',
      color: 'blue'
    },
    {
      icon: <Zap size={20} className="text-purple-400" />,
      title: 'Rapid Prototyping',
      description: 'From concept to deployment in minutes with intelligent code generation.',
      color: 'purple'
    }
  ];

  return (
    <div className="main-layout bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
      <Header
        showActions={true}
        onToggleCanvas={handleToggleCanvas}
        onToggleChatHistory={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
        canvasVisible={canvasVisible}
        chatHistoryVisible={isChatHistoryOpen}
      />
      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Enhanced Left Sidebar - Resizable Chat History Panel */}
        {isChatHistoryOpen && (
          <div
            className={`h-full ${chatHistoryResize.isResizing ? 'resizing' : ''}`}
            style={{ width: `${chatHistoryResize.width}px` }}
          >
            <ChatHistoryPanel
              chatGroups={chatGroups}
              isLoading={isLoadingChats}
              onResizeMouseDown={chatHistoryResize.handleMouseDown}
              isResizing={chatHistoryResize.isResizing}
              showHomeAsActive={true}
              onClose={() => setIsChatHistoryOpen(false)}
            />
          </div>
        )}



        {/* Canvas Sidebar Panel */}
        {canvasVisible && (
          <div
            className={`bg-slate-800/95 backdrop-blur-sm border-r border-slate-600 flex flex-col relative resizable-panel ${canvasResize.isResizing ? 'resizing' : ''} ${
              isCanvasFullscreen ? 'fixed inset-0 z-[9000] w-full' : ''
            }`}
            style={isCanvasFullscreen ? {} : { width: `${canvasResize.width}px` }}
          >
            <ChatBotCanvas
              technicalId="home-canvas"
              messages={[]}
              isLoading={false}
              onAnswer={handleAnswer}
              onApproveQuestion={handleApproveQuestion}
              onUpdateNotification={handleUpdateNotification}
              onToggleCanvas={handleToggleCanvas}
              isFullscreen={isCanvasFullscreen}
              onToggleFullscreen={handleToggleCanvasFullscreen}
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

        {/* Enhanced Main Content - Hidden when canvas is fullscreen */}
        {!isCanvasFullscreen && (
          <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
            <div className="p-8 flex-1 overflow-y-auto scrollbar-thin">
            <div className="max-w-4xl mx-auto">
              {/* Enhanced Header */}
              <div className="mb-8 animate-fade-in-up">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-400 uppercase tracking-wider">Ready to Build</span>
                </div>
                <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Welcome to CYODA AI Assistant
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Build, deploy and scale data-intensive operational services with intelligent assistance
                </p>
              </div>

              {/* Enhanced Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-200 animate-fade-in-up hover:shadow-xl hover:shadow-slate-900/20"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-lg bg-${feature.color}-500 flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* File attachments display - Above input */}
              {attachedFiles.length > 0 && (
                <div className="mb-4 p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-300">Attached Files ({attachedFiles.length})</span>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles([])}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="bg-slate-700/50 text-slate-300 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 border border-slate-600">
                        <Paperclip size={14} className="text-teal-400" />
                        <span className="max-w-[200px] truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="hover:text-red-400 transition-colors ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input - Lovable Style */}
              <div className="mb-6">
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
                      ref={chatInputRef as any}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit(e);
                        }
                      }}
                      placeholder="What would you like to build together today?"
                      rows={1}
                      className="w-full bg-slate-800/60 backdrop-blur-sm border-2 border-slate-600/50 rounded-3xl pl-6 pr-6 pb-16 pt-6 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500/80 focus:bg-slate-800/80 transition-all duration-200 text-2xl shadow-2xl resize-none overflow-hidden"
                      style={{ minHeight: '135px', maxHeight: '300px' }}
                      disabled={isLoading}
                    />

                    {/* Bottom Right Controls - Lovable Style */}
                    <div className="absolute right-4 bottom-6 flex items-center gap-2">
                      {/* Attach File Button */}
                      <button
                        type="button"
                        onClick={handleFileAttach}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                        title="Attach file"
                      >
                        <Paperclip size={18} />
                      </button>

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isLoading}
                        className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 text-white p-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-teal-500/25 disabled:cursor-not-allowed"
                        title="Send Message (Enter)"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </form>

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
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3 flex items-center space-x-2">
                  <Zap className="text-teal-400" size={20} />
                  <span>Quick Start</span>
                </h2>

                <div className="grid md:grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="text-left p-4 glass-light rounded-lg hover:border-slate-600 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 group-hover:text-white transition-colors">
                          {action.label}
                        </span>
                        <ChevronRight size={16} className="text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8">
                <p className="text-center text-slate-600 text-xs leading-relaxed">
                  By using this service, you confirm that you have read and agree to our{' '}
                  <a href="https://cyoda.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline transition-colors">Terms & Conditions</a>
                  {' '}and{' '}
                  <a href="https://cyoda.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline transition-colors">Privacy Policy</a>
                </p>
                <p className="text-center text-slate-600 text-xs mt-2">
                  Copyright © 2025 <a href="https://cyoda.com/" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 transition-colors">CYODA Ltd</a>.
                </p>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeView;
