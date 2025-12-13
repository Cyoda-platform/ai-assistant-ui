import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  History,
  Home,
  Settings,
  HelpCircle,
  Clock,
  Send,
  ChevronRight,
  CheckCircle2,
  Info,
  Zap,
  Bell,
  X,
  Maximize2,
  Minimize2,
  Rocket,
  Search,
  Database,
  GitBranch,
  TrendingUp,
  Shield,
  CreditCard,
  BarChart3,
  DollarSign
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
import CyodaLogo from '@/assets/images/cyoda_ai.png';
import LogoSmall from '@/assets/images/logo-small.svg';

const FintechHomeView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isEnvironmentsOpen, setIsEnvironmentsOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<{ input: string } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(60);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialWidthRef = useRef<number>(0);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Set page title for fintech
  useEffect(() => {
    document.title = 'CYODA AI Studio - Fintech Solutions';
    return () => {
      document.title = 'CYODA AI Studio';
    };
  }, []);

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
    storageKey: 'fintech-chatHistory-width'
  });

  // Resizable environments panel
  const environmentsResize = useResizablePanel({
    defaultWidth: 500,  // Start at 500px
    minWidth: 350,      // Minimum width for environments
    maxWidth: 1200,     // Maximum width - very wide
    storageKey: 'fintech-environments-width'
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
  const submitChat = async (input: string) => {
    setIsLoading(true);

    // Store the full message to be sent after chat creation
    const initialMessage = input;

    // Generate temporary ID for optimistic navigation
    const tempId = `temp-${Date.now()}`;

    // Navigate immediately with temp ID - show preloader in chat view
    console.log('[FintechHomeView] Navigating to temp chat:', tempId);
    navigate(`/chat/${tempId}?openCanvas=true&creating=true`);

    try {
      // Create chat with proper name (first 50 chars of message)
      const chatName = input.substring(0, 50) + (input.length > 50 ? '...' : '');

      // Create chat without files (file attachment is only available in chat detail page)
      const response = await assistantStore.postChats({
        name: chatName,
        description: ''
      });

      if (response?.data?.technical_id) {
        const realId = response.data.technical_id;

        // Refresh chat list in background
        assistantStore.getChats().catch(error => {
          console.error('Failed to refresh chat list:', error);
        });

        // Navigate to real chat ID with initial message in localStorage
        console.log('[FintechHomeView] Navigating to real chat:', realId);
        console.log('[FintechHomeView] Storing initial message in localStorage:', initialMessage);

        // Store initial message in localStorage so ChatBotView can pick it up
        localStorage.setItem(`initial-message-${realId}`, initialMessage);

        navigate(`/chat/${realId}?openCanvas=true`, { replace: true });
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      // On error, navigate back to fintech home
      navigate('/fintech', { replace: true });
    } finally {
      setIsLoading(false);
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
      // Capture the current input in local variable
      const currentInput = chatInput.trim();

      // Store the pending message
      setPendingMessage({ input: currentInput });

      // Show login popup with guest user message
      eventBus.$emit(SHOW_LOGIN_POPUP, {
        isGuestUser: true,
        onProceedWithoutLogin: () => {
          // User chose to proceed without login - use the captured value
          submitChat(currentInput);
        }
      });
      return;
    }

    // Not a guest user, submit directly
    await submitChat(chatInput.trim());
  };

  // Fintech-specific quick actions
  const fintechQuickActions = [
    {
      label: 'What is CYODA?',
      action: () => setChatInput('What is CYODA and how does it work?'),
      icon: <Info size={20} className="text-slate-300" />,
      description: 'Learn about the CYODA platform'
    },
    {
      label: 'What is my CYODA env?',
      action: () => setChatInput('Please, list my Cyoda environments'),
      icon: <Search size={20} className="text-slate-300" />,
      description: 'Check environment status'
    },
    {
      label: 'Deploy my environment',
      action: () => setChatInput('Deploy dev environment, please'),
      icon: <Zap size={20} className="text-slate-300" />,
      description: 'Deploy to production environment'
    },
    {
      label: 'Help with workflows',
      action: () => setChatInput('Create a workflow for Order entity with create, update, and cancel transitions'),
      icon: <GitBranch size={20} className="text-slate-300" />,
      description: 'Design entity workflows'
    },
    {
      label: 'Build a REST API',
      action: () => setChatInput('Build a complete REST API with CRUD operations for customer management'),
      icon: <Search size={20} className="text-slate-300" />,
      description: 'Create a full REST API application'
    },
    {
      label: 'Add new entity',
      action: () => setChatInput('Add a Customer entity with id, name, email, and phone fields'),
      icon: <Database size={20} className="text-slate-300" />,
      description: 'Create data entities'
    }
  ];

  // Fintech-specific prompt examples
  const fintechPromptExamples = [
    {
      title: "I need a trading platform for my startup",
      prompt: "Build a real-time trading platform with market data feeds, order management, portfolio tracking, risk controls, and regulatory compliance for equities and derivatives",
      icon: <TrendingUp size={48} className="text-white" />,
      category: "Trading",
      gradient: "rgba(55, 65, 81, 0.8), rgba(31, 41, 55, 0.8)"
    },
    {
      title: "My customers need secure payments",
      prompt: "Create a payment gateway with multi-currency support, fraud detection, PCI compliance, recurring billing, and real-time transaction monitoring",
      icon: <CreditCard size={48} className="text-white" />,
      category: "Payments",
      gradient: "rgba(75, 85, 99, 0.8), rgba(55, 65, 81, 0.8)"
    },
    {
      title: "I want to launch a digital bank",
      prompt: "Build a complete digital banking platform with account management, card services, mobile payments, budgeting tools, and regulatory compliance",
      icon: <DollarSign size={48} className="text-white" />,
      category: "Banking",
      gradient: "rgba(55, 65, 81, 0.8), rgba(31, 41, 55, 0.8)"
    },
    {
      title: "I need advanced risk management",
      prompt: "Implement a comprehensive risk management system with credit scoring, fraud detection, AML compliance, stress testing, and real-time monitoring",
      icon: <Shield size={48} className="text-white" />,
      category: "Risk Management",
      gradient: "rgba(75, 85, 99, 0.8), rgba(55, 65, 81, 0.8)"
    },
    {
      title: "I want to build a crypto exchange",
      prompt: "Create a cryptocurrency exchange with order matching engine, multi-wallet support, security features, KYC/AML compliance, and liquidity management",
      icon: <BarChart3 size={48} className="text-white" />,
      category: "Crypto",
      gradient: "rgba(55, 65, 81, 0.8), rgba(31, 41, 55, 0.8)"
    }
  ];

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % fintechPromptExamples.length);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, []);

  const handlePromptClick = (prompt: string) => {
    console.log('Prompt clicked:', prompt); // Debug log
    setChatInput(prompt);
    chatInputRef.current?.focus();
  };

  const nextPrompt = () => {
    setCurrentPromptIndex((prev) => (prev + 1) % fintechPromptExamples.length);
  };

  const prevPrompt = () => {
    setCurrentPromptIndex((prev) => (prev - 1 + fintechPromptExamples.length) % fintechPromptExamples.length);
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
                navigate('/environments', { state: { from: '/fintech' } });
              }}
            />
          </div>
        )}

        {/* Enhanced Main Content */}
        <div ref={mainContentRef} className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
            <div className="p-3 sm:p-4 md:p-4 lg:p-5 xl:p-6 min-h-full flex flex-col min-w-0">
            <div className="w-full flex-1 flex flex-col min-w-0 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto">

              {/* Fintech Hero Section */}
              <div className="mb-12 animate-fade-in-up" style={{ marginTop: '32px', fontFamily: 'Montserrat, sans-serif' }}>
                {/* Background gradient for depth */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center top, rgba(34,197,94,0.12), transparent 60%)',
                    top: '80px',
                    height: '600px'
                  }}
                />

                {/* Hero Section - Professional Fintech */}
                <div className="relative max-w-6xl mx-auto px-6">
                  {/* Main Hero */}
                  <div className="mb-10">
                    {/* Badge */}
                    <div className="mb-6 inline-flex items-center space-x-2 px-4 py-2 rounded-full" style={{
                      background: 'rgba(34,197,94,0.15)',
                      border: '1px solid rgba(34,197,94,0.3)'
                    }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }}></div>
                      <span className="text-sm font-semibold text-emerald-300">Fintech Solutions</span>
                    </div>

                    <h1
                      className="animate-fade-in"
                      style={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontWeight: 800,
                        fontSize: 'clamp(42px, 7vw, 64px)',
                        background: 'linear-gradient(135deg, #22c55e 0%, #10b981 50%, #059669 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-1px',
                        lineHeight: 1.1,
                        animationDelay: '0.1s',
                        marginBottom: '16px'
                      }}
                    >
                      Enterprise Fintech Platform
                    </h1>

                    <p
                      className="animate-fade-in"
                      style={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontWeight: 500,
                        fontSize: 'clamp(18px, 2.2vw, 22px)',
                        color: 'rgba(255,255,255,0.8)',
                        lineHeight: 1.7,
                        animationDelay: '0.2s',
                        maxWidth: '800px',
                        marginBottom: '24px'
                      }}
                    >
                      Build, deploy, and scale enterprise-grade fintech applications with AI-powered development. From trading platforms to payment systems, we provide the infrastructure for modern financial innovation.
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                      {[
                        { icon: '⚡', label: 'Real-time Processing' },
                        { icon: '🔒', label: 'Enterprise Security' },
                        { icon: '📊', label: 'Advanced Analytics' },
                        { icon: '🚀', label: 'Rapid Deployment' }
                      ].map((feature, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                          style={{
                            background: 'rgba(34,197,94,0.1)',
                            border: '1px solid rgba(34,197,94,0.2)',
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <span className="text-sm font-medium text-slate-200">
                            <span className="mr-2">{feature.icon}</span>
                            {feature.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Fintech Prompt Examples Carousel */}
              <div
                className="mb-8 transition-all duration-500 ease-in-out"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  opacity: 1,
                  transform: 'translateY(0)'
                }}
              >
                <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
                  <div className="relative">
                    {/* Carousel Container with professional shadow */}
                    <div
                      className="overflow-hidden rounded-3xl relative"
                      style={{
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(107,114,128,0.2)'
                      }}
                    >
                      {/* Professional gradient overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          background: 'linear-gradient(135deg, rgba(107,114,128,0.05) 0%, transparent 50%, rgba(75,85,99,0.05) 100%)'
                        }}
                      />

                      <div
                        className="flex transition-all duration-700 ease-out"
                        style={{ transform: `translateX(-${currentPromptIndex * 100}%)` }}
                      >
                        {fintechPromptExamples.map((example, index) => (
                          <div
                            key={index}
                            className="min-w-full p-1"
                          >
                            <div
                              onClick={(e) => {
                                e.preventDefault();
                                console.log('Fintech carousel item clicked, prompt:', example.prompt);
                                handlePromptClick(example.prompt);
                              }}
                              className="w-full text-left p-4 transition-all duration-500 group relative overflow-hidden cursor-pointer"
                              style={{
                                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                                backdropFilter: 'blur(20px)'
                              }}
                            >
                              {/* Fintech hover gradient effect */}
                              <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                  background: 'radial-gradient(circle at top right, rgba(34,197,94,0.15), transparent 70%)'
                                }}
                              />

                              <div className="relative z-10">
                                <div className="space-y-4">
                                  {/* Header Content */}
                                  <div className="flex items-center space-x-3 mb-3" style={{ marginLeft: '3%' }}>
                                    <span
                                      className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                                      style={{
                                        background: `linear-gradient(135deg, ${example.gradient})`,
                                        color: 'white'
                                      }}
                                    >
                                      {example.category}
                                    </span>
                                    <div className="flex items-center space-x-1 text-slate-400">
                                      <Clock size={14} />
                                      <span className="text-xs">15-45 min setup</span>
                                    </div>
                                  </div>

                                  <div className="flex items-start space-x-6">
                                    {/* Icon Display */}
                                    <div className="flex-shrink-0" style={{ marginLeft: '3%' }}>
                                      <div
                                        className="w-24 h-24 p-4 rounded-xl overflow-hidden flex items-center justify-center shadow-lg"
                                        style={{
                                          background: `linear-gradient(135deg, ${example.gradient})`
                                        }}
                                      >
                                        {example.icon}
                                      </div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 space-y-3">
                                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors duration-300">
                                        {example.title}
                                      </h3>

                                      <p className="text-slate-300 text-lg leading-relaxed mb-4 group-hover:text-slate-200 transition-colors duration-300">
                                        {example.prompt.substring(0, 120)}...
                                      </p>

                                      {/* Prompt Text with Copy Button */}
                                      <div className="relative bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                        <p className="text-slate-400 text-base leading-relaxed group-hover:text-slate-300 transition-colors duration-300 font-mono pr-12">
                                          {example.prompt}
                                        </p>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('Copy button clicked, setting prompt:', example.prompt);
                                            navigator.clipboard.writeText(example.prompt);
                                            handlePromptClick(example.prompt);
                                          }}
                                          className="absolute top-3 right-3 p-3 text-slate-400 hover:text-emerald-400 transition-all duration-200 hover:scale-110 rounded-lg hover:bg-slate-700/50"
                                          title="Copy prompt and set in input"
                                        >
                                          <DollarSign className="w-6 h-6" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <button
                      onClick={prevPrompt}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-20 group"
                      style={{
                        background: 'linear-gradient(135deg, rgba(75,85,99,0.9), rgba(55,65,81,0.9))',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(107,114,128,0.5)',
                      }}
                    >
                      <ChevronRight className="text-white rotate-180 group-hover:-translate-x-0.5 transition-transform" size={22} />
                    </button>

                    <button
                      onClick={nextPrompt}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-20 group"
                      style={{
                        background: 'linear-gradient(135deg, rgba(75,85,99,0.9), rgba(55,65,81,0.9))',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(107,114,128,0.5)',
                      }}
                    >
                      <ChevronRight className="text-white group-hover:translate-x-0.5 transition-transform" size={22} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="mb-4" style={{ marginTop: '-1vh' }}>
                <form onSubmit={handleChatSubmit}>
                  <div className="relative">
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
                      placeholder="What fintech solution would you like to build today?"
                      rows={1}
                      className="w-full text-white placeholder-slate-400 focus:outline-none transition-all duration-200 text-lg resize-none"
                      style={{
                        height: `${textareaHeight}px`,
                        minHeight: '64px',
                        maxHeight: '300px',
                        overflowY: textareaHeight >= 300 ? 'auto' : 'hidden',
                        lineHeight: '1.5',
                        background: 'rgba(30, 41, 59, 0.6)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: '24px',
                        padding: '18px 120px 18px 24px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(34,197,94,0.1)',
                        fontFamily: 'Montserrat, sans-serif'
                      }}
                      disabled={isLoading}
                    />

                    {/* Bottom Right Controls - Fintech Style */}
                    <div className="absolute right-4 bottom-4 flex items-center z-10">
                      {/* Attach File Button */}
                      {/* Send Button - Fintech themed */}
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isLoading}
                        className="hover:scale-110 transition-all duration-200 flex items-center justify-center flex-shrink-0 p-3"
                        style={{
                          transform: 'translateY(5%)',
                          color: '#22c55e'
                        }}
                        title="Send Message (Enter)"
                      >
                        {isLoading ? (
                          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#22c55e33', borderTopColor: '#22c55e' }} />
                        ) : (
                          <Send size={24} style={{ color: '#22c55e' }} />
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Fintech Quick Actions */}
              <div
                className="mb-8 transition-all duration-500 ease-in-out"
                style={{
                  marginTop: '1vh',
                  fontFamily: 'Montserrat, sans-serif',
                  opacity: 1,
                  transform: 'translateY(0)'
                }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-3 md:gap-4">
                  {fintechQuickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="text-left p-3 sm:p-4 md:p-4 lg:p-4 transition-all duration-300 group relative overflow-hidden"
                      style={{
                        background: 'rgba(30, 41, 59, 0.6)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* Fintech hover gradient effect */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: 'radial-gradient(circle at top right, rgba(34,197,94,0.15), transparent 70%)'
                        }}
                      />

                      <div className="relative z-10">
                        <div className="flex items-start space-x-3">
                          <div
                            className="flex-shrink-0 mt-0.5 p-2 rounded-lg transition-all duration-300 group-hover:scale-105"
                            style={{
                              background: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.3))',
                              border: '1px solid rgba(34,197,94,0.4)'
                            }}
                          >
                            {action.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm sm:text-base font-semibold text-white group-hover:text-emerald-300 transition-colors duration-300 mb-1">
                              {action.label}
                            </div>
                            <div className="text-xs text-slate-300 group-hover:text-slate-200 transition-colors duration-300 line-clamp-2">
                              {action.description}
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Professional Fintech Information Block */}
              <div
                className="mb-12 p-8 md:p-10 rounded-2xl transition-all duration-500 ease-in-out group relative overflow-hidden"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(16,185,129,0.05) 100%)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(34,197,94,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
                  marginTop: '4vh'
                }}
              >
                {/* Animated background gradient */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'radial-gradient(circle at top right, rgba(34,197,94,0.15), transparent 70%)',
                    pointerEvents: 'none'
                  }}
                />

                <div className="relative z-10">
                  {/* Header */}
                  <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.3))',
                          border: '1px solid rgba(34,197,94,0.4)'
                        }}
                      >
                        <Rocket className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white">
                          Enterprise-Grade Fintech Solutions
                        </h3>
                        <p className="text-sm text-emerald-300 font-semibold mt-1">Accelerate Your Path to Production</p>
                      </div>
                    </div>
                  </div>

                  {/* Main Description */}
                  <p className="text-slate-200 text-base md:text-lg leading-relaxed mb-8">
                    CYODA AI Studio empowers fintech teams to build, deploy, and scale secure, compliant applications faster than ever. From concept to production, we provide the infrastructure and tools you need for modern financial innovation.
                  </p>

                  {/* Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        icon: '🔐',
                        title: 'Security & Compliance',
                        description: 'Built-in encryption, audit trails, and regulatory compliance frameworks for financial services'
                      },
                      {
                        icon: '⚡',
                        title: 'High Performance',
                        description: 'Real-time processing, low-latency APIs, and scalable infrastructure for mission-critical systems'
                      },
                      {
                        icon: '📊',
                        title: 'Advanced Analytics',
                        description: 'Real-time monitoring, risk analytics, and comprehensive reporting for data-driven decisions'
                      },
                      {
                        icon: '🚀',
                        title: 'Rapid Deployment',
                        description: 'From development to production in days, not months. Automated testing and deployment pipelines'
                      },
                      {
                        icon: '🔄',
                        title: 'Seamless Integration',
                        description: 'Connect with payment gateways, exchanges, and financial data providers effortlessly'
                      },
                      {
                        icon: '💼',
                        title: 'Enterprise Support',
                        description: '24/7 technical support, dedicated infrastructure, and SLA guarantees for your peace of mind'
                      }
                    ].map((feature, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg transition-all duration-300 hover:scale-105"
                        style={{
                          background: 'rgba(30, 41, 59, 0.4)',
                          border: '1px solid rgba(34,197,94,0.15)',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl flex-shrink-0">{feature.icon}</span>
                          <div>
                            <h4 className="font-bold text-white mb-1">{feature.title}</h4>
                            <p className="text-sm text-slate-300">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="mt-8 pt-8 border-t border-slate-700/50">
                    <p className="text-slate-300 text-sm mb-4">
                      Ready to build your next fintech solution? Start with a simple prompt and let our AI guide you through the entire development process.
                    </p>
                    <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                      <span>Try it now in the chat above</span>
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacer to push footer to bottom */}
              <div className="flex-1"></div>

              {/* Beautiful Footer */}
              <footer
                className="mt-auto relative overflow-hidden"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {/* Gradient Background */}
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(34,197,94,0.1) 100%)'
                  }}
                />

                {/* Footer Content */}
                <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-8">

                  {/* Divider */}
                  <div
                    className="h-px mb-8"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)'
                    }}
                  />

                  {/* Middle Section - Links Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* Column 1 - Company */}
                    <div>
                      <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
                      <ul className="space-y-2">
                        <li>
                          <a href="https://cyoda.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                            About CYODA
                          </a>
                        </li>
                        <li>
                          <a href="https://github.com/Cyoda-platform" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                            Open Source
                          </a>
                        </li>
                        <li>
                          <a href="https://devpost.com/Ksenniya?ref_content=user-portfolio&ref_feature=portfolio&ref_medium=global-nav" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                            Hackathons
                          </a>
                        </li>
                      </ul>
                    </div>

                    {/* Column 2 - Community */}
                    <div>
                      <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Community</h4>
                      <ul className="space-y-2">
                        <li>
                          <a href="https://discord.com/invite/95rdAyBZr2" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                            Discord Server
                          </a>
                        </li>
                        <li>
                          <a href="https://github.com/Cyoda-platform" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                            GitHub
                          </a>
                        </li>
                        <li>
                          <a href="https://linkedin.com/company/cyoda" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                            LinkedIn
                          </a>
                        </li>
                      </ul>
                    </div>

                    {/* Column 3 - Resources */}
                    <div>
                      <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Resources</h4>
                      <ul className="space-y-2">
                        <li>
                          <a href="https://docs.cyoda.net/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                            Getting Started
                          </a>
                        </li>
                        <li>
                          <a href="https://docs.cyoda.net/api-reference/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                            API Reference
                          </a>
                        </li>
                        <li>
                          <span className="text-slate-400 text-sm cursor-default">
                            Examples
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Section - Copyright, Terms & Social */}
                  <div className="flex flex-col space-y-4 pt-8 border-t border-slate-700/50">
                    {/* Terms & Privacy Notice */}
                    <p className="text-slate-400 text-xs leading-relaxed">
                      By using this service, you confirm that you have read and agree to our{' '}
                      <a href="https://cyoda.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium underline">
                        Terms & Conditions
                      </a>
                      {' '}and{' '}
                      <a href="https://cyoda.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium underline">
                        Privacy Policy
                      </a>
                    </p>

                    {/* Copyright & Social */}
                    <div className="flex flex-col md:flex-row items-center justify-between">
                      {/* Copyright */}
                      <p className="text-slate-400 text-sm mb-4 md:mb-0">
                        © 2025 <a href="https://cyoda.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">CYODA Ltd</a>. All rights reserved.
                      </p>

                      {/* Social Links */}
                      <div className="flex items-center space-x-4">

                      <a
                        href="https://github.com/Cyoda-platform"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                        style={{
                          background: 'rgba(30, 41, 59, 0.5)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <svg className="w-5 h-5 text-slate-400 hover:text-emerald-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>

                      <a
                        href="https://linkedin.com/company/cyoda"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                        style={{
                          background: 'rgba(30, 41, 59, 0.5)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <svg className="w-5 h-5 text-slate-400 hover:text-emerald-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    </div>
                    </div>
                  </div>
                </div>
              </footer>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FintechHomeView;
