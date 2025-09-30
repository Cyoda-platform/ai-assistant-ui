import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuthStore } from '@/stores/auth';
import Header from '@/components/Header/Header';
import ChatBotCanvas from '@/components/ChatBot/ChatBotCanvas';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import ChatBotAttachFile, { ChatBotAttachFileRef } from '@/components/ChatBot/ChatBotAttachFile';

const HomeView: React.FC = () => {
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(true);
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const attachFileRef = useRef<ChatBotAttachFileRef>(null);
  const navigate = useNavigate();

  const assistantStore = useAssistantStore();
  const authStore = useAuthStore();

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

  // Load chats on mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        await assistantStore.getChats();
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setChatsLoading(false);
      }
    };

    loadChats();
  }, []);

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

    setIsLoading(true);
    try {
      const response = await assistantStore.postChats({
        name: chatInput.trim(),
        description: ''
      });

      if (response?.data?.technical_id) {
        navigate(`/chat/${response.data.technical_id}`);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setIsLoading(false);
      setAttachedFile(null);
    }
  };

  const handleFileAttach = () => {
    attachFileRef.current?.openDialog(attachedFile);
  };

  const handleFileChange = (file: File | null) => {
    setAttachedFile(file);
  };

  const quickActions = [
    { label: 'Deploy my environment', action: () => setChatInput('Deploy my environment') },
    { label: 'What is my CYODA env?', action: () => setChatInput('What is my CYODA environment?') },
    { label: 'Build a REST API', action: () => setChatInput('Build a REST API application') },
    { label: 'Help with workflows', action: () => setChatInput('Help me understand CYODA workflows') }
  ];

  // Canvas handlers
  const handleToggleCanvas = () => {
    setCanvasVisible(!canvasVisible);
  };

  const handleToggleCanvasFullscreen = () => {
    setIsCanvasFullscreen(!isCanvasFullscreen);
  };

  // Dummy handlers for canvas (since we're on home page without active chat)
  const handleAnswer = (data: { answer: string; file?: File }) => {
    console.log('Answer from canvas:', data);
  };

  const handleApproveQuestion = (data: any) => {
    console.log('Approve question:', data);
  };

  const handleUpdateNotification = (data: any) => {
    console.log('Update notification:', data);
  };

  // Load chats on mount
  useEffect(() => {
    assistantStore.getChats();
  }, []);

  // Group chats by date similar to Vue implementation
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

  const chatGroups = groupChatsByDate(assistantStore.chatList || []);
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
            <div className="flex items-center space-x-3 text-white cursor-pointer p-3 rounded-lg bg-teal-500/20 border border-teal-500/30 group">
              <Home size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Home</span>
            </div>

            <div className="flex-1 flex flex-col space-y-1 overflow-hidden">
              <div className="flex items-center space-x-3 text-slate-300 hover:text-white cursor-pointer p-3 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group">
                <History size={18} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">History</span>
                <ChevronRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Chat History */}
              <div className="px-3 space-y-3 flex-1 overflow-y-auto chat-container">
                {chatsLoading ? (
                  <div className="px-2 py-8 flex flex-col items-center justify-center space-y-4">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-slate-400">Loading chat history...</p>
                  </div>
                ) : hasChats ? (
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
                            className="text-slate-400 hover:text-white cursor-pointer px-3 py-2 rounded-md hover:bg-slate-700/30 transition-all duration-200 text-sm"
                          >
                            <div className="flex items-center space-x-2">
                              <Clock size={14} className="text-slate-500 flex-shrink-0" />
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



        {/* Canvas Sidebar Panel */}
        {canvasVisible && (
          <div
            className={`bg-slate-800/95 backdrop-blur-sm border-r border-slate-600 flex flex-col relative resizable-panel ${canvasResize.isResizing ? 'resizing' : ''} ${
              isCanvasFullscreen ? 'fixed inset-0 z-50 w-full' : ''
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

        {/* Enhanced Main Content */}
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

              {/* Chat Input - Lovable Style */}
              <div className="mb-6">
                <form onSubmit={handleChatSubmit}>
                  <div className="relative">
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

                    {/* File indicator - Top Left */}
                    {attachedFile && (
                      <div className="absolute left-6 top-6 bg-teal-500/20 text-teal-400 px-3 py-1 rounded-lg text-sm flex items-center space-x-2">
                        <Paperclip size={14} />
                        <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                      </div>
                    )}

                    {/* Bottom Right Controls - Lovable Style */}
                    <div className="absolute right-4 bottom-6 flex items-center space-x-2">
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

                {/* Attach File Component */}
                <ChatBotAttachFile ref={attachFileRef} onFile={handleFileChange} />
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
      </div>
    </div>
  );
};

export default HomeView;
