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
  Paperclip,
  Rocket,
  Search,
  Database,
  GitBranch,
  DollarSign
} from 'lucide-react';
import { useAssistantStore } from '@/stores/assistant';
import { useAuthStore, useSuperUserMode } from '@/stores/auth';
import Header from '@/components/Header/Header';

import ChatHistoryPanel from '@/components/ChatHistoryPanel/ChatHistoryPanel';
import EnvironmentsPanel from '@/components/EnvironmentsPanel/EnvironmentsPanel';

// Import people images
import ppl1 from '@/assets/images/people/ppl_1.png';
import ppl2 from '@/assets/images/people/ppl2.png';
import ppl3 from '@/assets/images/people/ppl3.png';
import ppl4 from '@/assets/images/people/ppl4.png';
import ppl5 from '@/assets/images/people/ppl5.png';
import ppl6 from '@/assets/images/people/ppl6.png';
import ppl7 from '@/assets/images/people/ppl7.png';
import ppl8 from '@/assets/images/people/ppl8.png';
import ppl9 from '@/assets/images/people/ppl9.png';
import ppl10 from '@/assets/images/people/ppl10.png';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST, SHOW_LOGIN_POPUP } from '@/helpers/HelperConstants';
import { groupChatsByDate } from '@/helpers/HelperChatGroups';
import CyodaLogo from '@/assets/images/cyoda_ai.png';
import LogoSmall from '@/assets/images/logo-small.svg';

const HomeView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isEnvironmentsOpen, setIsEnvironmentsOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [pendingMessage, setPendingMessage] = useState<{ input: string; files: File[] } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(60);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
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
      icon: <Info size={28} className="text-slate-300" />,
      description: 'Learn about the CYODA platform'
    },
    {
      label: 'What is my CYODA env?',
      action: () => setChatInput('Show me my current CYODA environment status and configuration'),
      icon: <Search size={28} className="text-slate-300" />,
      description: 'Check environment status'
    },
    {
      label: 'Deploy my environment',
      action: () => setChatInput('Deploy my environment to production with all configurations and dependencies'),
      icon: <Zap size={28} className="text-slate-300" />,
      description: 'Deploy to production environment'
    },
    {
      label: 'Help with workflows',
      action: () => setChatInput('Create a workflow for Order entity with create, update, and cancel transitions'),
      icon: <GitBranch size={28} className="text-slate-300" />,
      description: 'Design entity workflows'
    },
    {
      label: 'Build a REST API',
      action: () => setChatInput('Build a complete REST API with CRUD operations for customer management'),
      icon: <Search size={28} className="text-slate-300" />,
      description: 'Create a full REST API application'
    },
    {
      label: 'Add new entity',
      action: () => setChatInput('Add a Customer entity with id, name, email, and phone fields'),
      icon: <Database size={28} className="text-slate-300" />,
      description: 'Create data entities'
    }
  ];

  const promptExamples = [
    {
      title: "I need to sell products online",
      prompt: "I want to sell my products online with a shopping cart, payment processing, inventory tracking, and customer order management",
      icon: <img src={ppl1} alt="Person 1" />,
      category: "E-Commerce",
      gradient: "rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8)"
    },
    {
      title: "My team can't track work efficiently",
      prompt: "I need a way to organize projects, assign tasks to team members, set deadlines, track progress, and collaborate in real-time",
      icon: <img src={ppl2} alt="Person 2" />,
      category: "Productivity",
      gradient: "rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.8)"
    },
    {
      title: "I want to list and manage properties",
      prompt: "I need to showcase properties with photos, manage inquiries, schedule viewings, and connect buyers with agents",
      icon: <img src={ppl3} alt="Person 3" />,
      category: "Real Estate",
      gradient: "rgba(245, 158, 11, 0.8), rgba(217, 119, 6, 0.8)"
    },
    {
      title: "Patients need to access their records",
      prompt: "I want patients to book appointments, view medical records, get prescriptions, message doctors, and pay bills online",
      icon: <img src={ppl4} alt="Person 4" />,
      category: "Healthcare",
      gradient: "rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.8)"
    },
    {
      title: "I want to teach courses online",
      prompt: "I need to create courses, enroll students, deliver video lessons, give quizzes, track progress, and issue certificates",
      icon: <img src={ppl5} alt="Person 5" />,
      category: "Education",
      gradient: "rgba(147, 51, 234, 0.8), rgba(126, 34, 206, 0.8)"
    },
    {
      title: "Customers want to order food online",
      prompt: "I need online ordering, menu management, table reservations, delivery tracking, and a loyalty rewards program",
      icon: <img src={ppl6} alt="Person 6" />,
      category: "Restaurant",
      gradient: "rgba(249, 115, 22, 0.8), rgba(234, 88, 12, 0.8)"
    },
    {
      title: "I want to help people reach fitness goals",
      prompt: "I need to create workout plans, log exercises, track nutrition, show progress charts, and enable social sharing",
      icon: <img src={ppl7} alt="Person 7" />,
      category: "Fitness",
      gradient: "rgba(34, 197, 94, 0.8), rgba(22, 163, 74, 0.8)"
    },
    {
      title: "I need to organize events and sell tickets",
      prompt: "I want to create events, sell tickets online, register attendees, manage check-ins, and analyze event performance",
      icon: <img src={ppl8} alt="Person 8" />,
      category: "Events",
      gradient: "rgba(168, 85, 247, 0.8), rgba(147, 51, 234, 0.8)"
    },
    {
      title: "I'm losing track of inventory",
      prompt: "I need to track stock levels, manage suppliers, create purchase orders, organize warehouses, and get low-stock alerts",
      icon: <img src={ppl9} alt="Person 9" />,
      category: "Inventory",
      gradient: "rgba(6, 182, 212, 0.8), rgba(8, 145, 178, 0.8)"
    },
    {
      title: "I want to build a community platform",
      prompt: "I need user profiles, posts, comments, likes, friend connections, private messaging, and a personalized news feed",
      icon: <img src={ppl10} alt="Person 10" />,
      category: "Community",
      gradient: "rgba(236, 72, 153, 0.8), rgba(219, 39, 119, 0.8)"
    }
  ];

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % promptExamples.length);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, []);

  const handlePromptClick = (prompt: string) => {
    console.log('Prompt clicked:', prompt); // Debug log
    setChatInput(prompt);
    chatInputRef.current?.focus();
  };

  const nextPrompt = () => {
    setCurrentPromptIndex((prev) => (prev + 1) % promptExamples.length);
  };

  const prevPrompt = () => {
    setCurrentPromptIndex((prev) => (prev - 1 + promptExamples.length) % promptExamples.length);
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
      icon: <Database size={20} className="text-teal-400" />,
      title: 'Entity-Driven Architecture',
      description: 'Create data entities with validation, processors, and automatic CRUD operations.',
      color: 'teal'
    },
    {
      icon: <GitBranch size={20} className="text-teal-400" />,
      title: 'Intelligent Workflows',
      description: 'Design state machines and business logic with visual workflow editors.',
      color: 'teal'
    },
    {
      icon: <Zap size={20} className="text-teal-400" />,
      title: 'REST APIs',
      description: 'Generate complete REST APIs with authentication and documentation.',
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
      <div className="flex h-[calc(100vh-61px)] overflow-hidden">
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

              {/* Hero Section */}
              <div className="mb-12 animate-fade-in-up" style={{ marginTop: '48px', fontFamily: 'Roboto, sans-serif' }}>
                {/* Background gradient for depth */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center top, rgba(0,185,200,0.06), transparent 60%)',
                    top: '100px',
                    height: '500px'
                  }}
                />

                {/* Logo and Hero Text - Side by Side Layout */}
                <div className="relative flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 mb-12 max-w-6xl mx-auto px-6">
                  {/* Logo - Circular with night effect and hover SVG */}
                  <div
                    className="flex-shrink-0 transition-all duration-500 hover:scale-110 hover:-translate-y-2 group logo-container"
                    style={{
                      filter: 'drop-shadow(0 8px 25px rgba(30,41,59,0.6))'
                    }}
                  >
                    <div
                      className="relative overflow-hidden transition-all duration-500 logo-inner"
                      style={{
                        width: 'clamp(112px, 12vw, 160px)', // h-28 = 112px, h-36 = 144px, h-40 = 160px
                        height: 'clamp(112px, 12vw, 160px)',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
                        border: '3px solid rgba(148,163,184,0.4)',
                        boxShadow: '0 0 30px rgba(30,41,59,0.4), inset 0 0 20px rgba(148,163,184,0.1)'
                      }}
                    >
                      {/* Animated border glow effect */}
                      <div
                        className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 night-border-glow"
                        style={{
                          background: 'conic-gradient(from 0deg, rgba(59,130,246,0.6), rgba(147,51,234,0.6), rgba(59,130,246,0.6))',
                          animation: 'spin 3s linear infinite',
                          zIndex: -1
                        }}
                      />

                      {/* Inner glow ring */}
                      <div
                        className="absolute inset-1 rounded-full night-inner-glow"
                        style={{
                          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
                          zIndex: 1
                        }}
                      />

                      {/* Main PNG Logo */}
                      <img
                        src={CyodaLogo}
                        alt="CYODA AI"
                        className="w-full h-full object-cover transition-all duration-500 group-hover:opacity-0 group-hover:scale-105"
                        style={{
                          borderRadius: '50%',
                          zIndex: 2,
                          position: 'relative'
                        }}
                      />

                      {/* SVG Logo - appears on hover */}
                      <img
                        src={LogoSmall}
                        alt="CYODA AI Logo"
                        className="absolute inset-0 w-full h-full object-contain opacity-0 group-hover:opacity-100 transition-all duration-500"
                        style={{
                          zIndex: 3,
                          padding: '15%'
                        }}
                      />

                      {/* Subtle overlay for better contrast */}
                      <div
                        className="absolute inset-0 rounded-full opacity-10 group-hover:opacity-5 transition-opacity duration-500"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
                          zIndex: 4
                        }}
                      />
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col text-center md:text-left space-y-4">
                    {/* H1 - Display (48-72px) */}
                    <h2
                      className="animate-fade-in"
                      style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 700,
                        fontSize: 'clamp(48px, 6vw, 72px)',
                        color: '#007981',
                        letterSpacing: '2px',
                        lineHeight: 1.1,
                        animationDelay: '0.1s'
                      }}
                    >
                      Cyoda AI Studio
                    </h2>

                    {/* H2 - Heading 1 (36-52px) */}
                    <h1
                      className="animate-fade-in"
                      style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 600,
                        fontSize: 'clamp(36px, 4.5vw, 52px)',
                        color: '#007981',
                        letterSpacing: 'normal',
                        lineHeight: 1.1,
                        animationDelay: '0.2s'
                      }}
                    >
                      <span style={{ color: '#10b981' }}>Solve. Build. Deploy.</span>
                    </h1>

                    {/* H4 - Heading 4 (20-28px) */}
                    <p
                      className="animate-fade-in"
                      style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 400,
                        fontSize: 'clamp(20px, 2.5vw, 28px)',
                        color: 'rgba(255,255,255,0.75)',
                        lineHeight: 1.5,
                        animationDelay: '0.3s'
                      }}
                    >
                      For <span style={{ color: '#be123c' }}>anyone</span> who has a problem to solve
                    </p>


                  </div>
                </div>

              </div>

              {/* Prompt Examples Carousel */}
              <div className="mb-8" style={{ fontFamily: 'Roboto, sans-serif', marginTop: '-8vh' }}>
                <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
                  <div className="relative">
                    {/* Carousel Container with elegant shadow */}
                    <div
                      className="overflow-hidden rounded-3xl relative"
                      style={{
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(20,184,166,0.3)',
                        border: '1px solid rgba(20, 184, 166, 0.3)'
                      }}
                    >
                      {/* Subtle gradient overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0,185,200,0.05) 0%, transparent 50%, rgba(0,121,129,0.05) 100%)'
                        }}
                      />

                      <div
                        className="flex transition-all duration-700 ease-out"
                        style={{ transform: `translateX(-${currentPromptIndex * 100}%)` }}
                      >
                        {promptExamples.map((example, index) => (
                          <div
                            key={index}
                            className="min-w-full p-1"
                          >
                            <div
                              onClick={(e) => {
                                e.preventDefault();
                                console.log('Carousel item clicked, prompt:', example.prompt); // Debug log
                                handlePromptClick(example.prompt);
                              }}
                              className="w-full text-left p-4 transition-all duration-500 group relative overflow-hidden cursor-pointer"
                              style={{
                                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '24px 2px 24px 24px'
                              }}
                            >
                              {/* Hover gradient effect */}
                              <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                  background: 'radial-gradient(circle at top right, rgba(0,185,200,0.1), transparent 70%)',
                                  borderRadius: '24px 2px 24px 24px'
                                }}
                              />

                              <div className="relative z-10">
                                <div className="space-y-4">
                                  {/* Header Content aligned with picture position */}
                                  <div className="flex items-center space-x-3 mb-3" style={{ marginLeft: '3%' }}>
                                    {/* Tiny - 12-14px */}
                                    <span
                                      className="px-3 py-1 rounded-full font-semibold uppercase tracking-wider"
                                      style={{
                                        background: `linear-gradient(135deg, ${example.gradient})`,
                                        color: 'white',
                                        fontSize: 'clamp(11px, 0.8vw, 13px)'
                                      }}
                                    >
                                      {example.category}
                                    </span>
                                    <div className="flex items-center space-x-1 text-slate-400" style={{ fontSize: 'clamp(11px, 0.8vw, 13px)' }}>
                                      <Clock size={14} />
                                      <span>10-30 min setup</span>
                                    </div>
                                  </div>

                                  <div className="flex items-end space-x-4">
                                    {/* Person Image positioned on the left, aligned with bottom of text area */}
                                    <div className="flex-shrink-0" style={{ marginLeft: '3%' }}>
                                      <div
                                        className="w-16 h-32 p-2 rounded-lg overflow-hidden"
                                        style={{
                                          background: `linear-gradient(135deg, ${example.gradient})`
                                        }}
                                      >
                                        {React.cloneElement(example.icon, {
                                          className: "w-full h-full object-cover rounded-md"
                                        })}
                                      </div>
                                    </div>

                                    {/* Text Content on the Right */}
                                    <div className="flex-1 space-y-3">
                                      {/* H3 - Heading 3 (28-36px) */}
                                      <h3 className="font-bold text-white mb-3 group-hover:text-teal-300 transition-colors duration-300" style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}>
                                        {example.title}
                                      </h3>

                                      {/* Body - 16-20px */}
                                      <p className="text-slate-300 leading-relaxed mb-4 group-hover:text-slate-200 transition-colors duration-300" style={{ fontSize: 'clamp(16px, 1.5vw, 20px)' }}>
                                        {example.description}
                                      </p>

                                      {/* Prompt Text with Copy Button */}
                                      <div
                                        className="relative p-4 transition-all duration-300"
                                        style={{
                                          background: 'rgba(30, 41, 59, 0.6)',
                                          border: '1px solid rgba(20, 184, 166, 0.3)',
                                          backdropFilter: 'blur(10px)',
                                          WebkitBackdropFilter: 'blur(10px)',
                                          borderRadius: '24px 6px 24px 24px'
                                        }}
                                      >
                                        {/* Small - 12-14px */}
                                        <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300 font-mono pr-12" style={{ fontSize: 'clamp(12px, 1vw, 14px)' }}>
                                          {example.prompt}
                                        </p>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('Copy button clicked, setting prompt:', example.prompt); // Debug log
                                            navigator.clipboard.writeText(example.prompt);
                                            handlePromptClick(example.prompt);
                                          }}
                                          className="absolute top-4 right-4 text-teal-400 hover:text-teal-300 transition-all duration-200 hover:scale-110 flex items-center justify-center flex-shrink-0"
                                          style={{
                                            width: '40px',
                                            height: '40px',
                                            minWidth: '40px',
                                            minHeight: '40px'
                                          }}
                                          title="Copy prompt and set in input"
                                        >
                                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.820 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                                          </svg>
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

                    {/* Elegant Navigation Buttons */}
                    <button
                      onClick={prevPrompt}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-20 group"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,185,200,0.9), rgba(0,121,129,0.9))',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 24px rgba(0,185,200,0.4), 0 0 0 1px rgba(0,185,200,0.5)',
                      }}
                    >
                      <ChevronRight className="text-white rotate-180 group-hover:-translate-x-0.5 transition-transform" size={22} />
                    </button>

                    <button
                      onClick={nextPrompt}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-20 group"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,185,200,0.9), rgba(0,121,129,0.9))',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 24px rgba(0,185,200,0.4), 0 0 0 1px rgba(0,185,200,0.5)',
                      }}
                    >
                      <ChevronRight className="text-white group-hover:translate-x-0.5 transition-transform" size={22} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="my-8" style={{ marginTop: '3vh', marginBottom: '3vh' }}>
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
                      placeholder="What would you like to build today?"
                      rows={1}
                      className="w-full text-white placeholder-slate-300 focus:outline-none transition-all duration-300 text-lg resize-none peer"
                      style={{
                        height: `${textareaHeight}px`,
                        minHeight: '64px',
                        maxHeight: '300px',
                        overflowY: textareaHeight >= 300 ? 'auto' : 'hidden',
                        lineHeight: '1.5',
                        background: 'rgba(20,184,166,0.12)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        border: '2px solid rgba(20,184,166,0.8)',
                        borderRadius: '24px',
                        padding: '18px 24px 60px 24px',
                        boxShadow: '0 0 20px rgba(20,184,166,0.3), 0 8px 32px rgba(0,0,0,0.2)',
                        fontFamily: 'Roboto, sans-serif'
                      }}
                      disabled={isLoading}
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 30px rgba(20,184,166,0.6), 0 8px 32px rgba(0,0,0,0.3)';
                        e.currentTarget.style.borderColor = 'rgba(20,184,166,1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(20,184,166,0.3), 0 8px 32px rgba(0,0,0,0.2)';
                        e.currentTarget.style.borderColor = 'rgba(20,184,166,0.8)';
                      }}
                    />

                    {/* Bottom Right Controls - Lovable Style */}
                    <div className="absolute right-6 bottom-4 flex items-center gap-0 z-10">
                      {/* Attach File Button */}
                      <button
                        type="button"
                        onClick={handleFileAttach}
                        className="text-slate-400 hover:scale-110 transition-all duration-200 flex items-center justify-center flex-shrink-0"
                        style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
                        title="Attach file"
                      >
                        <Paperclip size={20} />
                      </button>

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isLoading}
                        className="hover:scale-110 transition-all duration-200 flex items-center justify-center flex-shrink-0"
                        style={{
                          width: '40px',
                          height: '40px',
                          minWidth: '40px',
                          minHeight: '40px',
                          color: '#be123c'
                        }}
                        title="Send Message (Enter)"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#be123c33', borderTopColor: '#be123c' }} />
                        ) : (
                          <Send size={20} style={{ color: '#be123c' }} />
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
              <div className="mb-8" style={{ marginTop: '1vh', fontFamily: 'Roboto, sans-serif' }}>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-3 md:gap-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="text-left p-3 sm:p-4 md:p-4 lg:p-4 transition-all duration-300 group relative overflow-hidden"
                      style={{
                        background: 'rgba(30, 41, 59, 0.6)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* Hover gradient effect */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle at top right, rgba(0,185,200,0.1), transparent 70%)'
                        }}
                      />

                      <div className="relative z-10">
                        <div className="flex items-center space-x-3">
                          <div
                            className="flex-shrink-0 rounded-lg transition-all duration-300 group-hover:scale-105 flex items-center justify-center"
                            style={{
                              background: 'linear-gradient(135deg, rgba(0,185,200,0.2), rgba(0,121,129,0.2))',
                              border: '1px solid rgba(0,185,200,0.3)',
                              width: '48px',
                              height: '48px'
                            }}
                          >
                            {action.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* H5 - Heading 5 (18-24px) */}
                            <div className="font-semibold text-white group-hover:text-teal-300 transition-colors duration-300 mb-1" style={{ fontSize: 'clamp(16px, 1.2vw, 20px)' }}>
                              {action.label}
                            </div>
                            {/* Tiny - 12-14px */}
                            <div className="text-slate-300 group-hover:text-slate-200 transition-colors duration-300 line-clamp-2" style={{ fontSize: 'clamp(12px, 0.9vw, 14px)' }}>
                              {action.description}
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Who Are We Section */}
              <div className="max-w-5xl mx-auto px-6 mb-20 mt-20" style={{ fontFamily: 'Roboto, sans-serif' }}>
                <div
                  className="rounded-2xl p-10 md:p-12"
                  style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(0,185,200,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* H3 - Heading 3 (28-36px) */}
                  <h2 className="font-bold mb-6 text-center" style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', color: '#00b9c8' }}>
                    Who Are We?
                  </h2>

                  {/* Body - 16-20px */}
                  <p className="text-slate-300 text-center mb-10 leading-relaxed max-w-3xl mx-auto" style={{ fontSize: 'clamp(16px, 1.5vw, 20px)' }}>
                    We are a team of developers who know what it takes to ship projects to production.
                    We're happy to collaborate, build solutions, and solve problems together.
                  </p>

                  {/* H4 - Heading 4 (20-28px) */}
                  <p className="font-semibold text-center mb-8" style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', color: '#ffffff' }}>
                    Let's shape the IT future together!
                  </p>

                  {/* Social Links */}
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {/* CYODA Website */}
                    <a
                      href="https://cyoda.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-6 py-3 font-semibold text-base transition-all duration-300 hover:scale-105 group"
                      style={{
                        background: 'linear-gradient(135deg, #00b9c8, #007981)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(0,185,200,0.3)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>cyoda.com</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Join Our Community Section */}
              <div className="max-w-5xl mx-auto px-6 mb-12 mt-8" style={{ fontFamily: 'Roboto, sans-serif' }}>
                {/* H3 - Heading 3 (28-36px) */}
                <h2 className="font-bold mb-6 text-center" style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', color: '#00b9c8' }}>
                  Join Our Community
                </h2>

                {/* Body - 16-20px */}
                <p className="text-slate-300 text-center mb-10 leading-relaxed max-w-3xl mx-auto" style={{ fontSize: 'clamp(16px, 1.5vw, 20px)' }}>
                  Connect with developers, designers, and problem solvers. Get help, share ideas, and build amazing apps together.
                </p>

                {/* Discord Button */}
                <div className="text-center">
                  <a
                    href="https://discord.com/invite/95rdAyBZr2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-3 px-10 py-4 font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group"
                    style={{
                      background: 'linear-gradient(135deg, #5865F2, #4752C4)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 40px rgba(88,101,242,0.4)',
                      color: '#ffffff',
                      border: '2px solid rgba(255,255,255,0.2)',
                      fontSize: 'clamp(16px, 1.2vw, 18px)'
                    }}
                  >
                    <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" viewBox="0 0 24 24" fill="white">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    <span style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Join Us on Discord</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="white" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>

                {/* Community Links */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                  {/* GitHub */}
                  <a
                    href="https://github.com/Cyoda-platform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-6 py-3 font-semibold text-base transition-all duration-300 hover:scale-105 group"
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span>GitHub</span>
                  </a>

                  {/* Devpost */}
                  <a
                    href="https://devpost.com/Ksenniya?ref_content=user-portfolio&ref_feature=portfolio&ref_medium=global-nav"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-6 py-3 font-semibold text-base transition-all duration-300 hover:scale-105 group"
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Devpost</span>
                  </a>
                </div>
              </div>

              {/* Collaborate with Us on Hackathons Section */}
              <div className="max-w-5xl mx-auto px-6 mb-16 mt-12" style={{ fontFamily: 'Roboto, sans-serif' }}>
                <div
                  className="rounded-2xl p-8 md:p-12 transition-all duration-300 hover:scale-[1.01] relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,185,200,0.1), rgba(0,121,129,0.1))',
                    backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(0,185,200,0.3)',
                    boxShadow: '0 8px 32px rgba(0,185,200,0.2)'
                  }}
                >
                  {/* Animated background gradient */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'radial-gradient(circle at top right, rgba(0,185,200,0.15), transparent 70%)'
                    }}
                  />

                  <div className="relative z-10 text-center">
                    <div className="inline-flex items-center space-x-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                        style={{
                          background: 'linear-gradient(135deg, #00b9c8, #007981)',
                          boxShadow: '0 4px 16px rgba(0,185,200,0.4)'
                        }}
                      >
                        <Zap className="text-white w-6 h-6" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold" style={{ color: '#00b9c8' }}>
                        Collaborate with Us on Hackathons
                      </h3>
                    </div>

                    <p className="text-slate-300 text-lg mb-6 max-w-3xl mx-auto leading-relaxed">
                      Join forces with our team to tackle exciting challenges and build innovative solutions.
                      Let's participate together and solve problems efficiently!
                    </p>

                    <a
                      href="https://devpost.com/Ksenniya?ref_content=user-portfolio&ref_feature=portfolio&ref_medium=global-nav"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-3 px-8 py-4 font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl group/btn"
                      style={{
                        background: 'linear-gradient(135deg, #00b9c8, #007981)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,185,200,0.4)',
                        color: '#ffffff',
                        border: '2px solid rgba(0,185,200,0.5)'
                      }}
                    >
                      <Rocket className="w-5 h-5 group-hover/btn:translate-y-[-2px] transition-transform duration-300" />
                      <span style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>View Our Hackathon Projects</span>
                      <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="white" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>

                    <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-slate-400">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        <span>Team Collaboration</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        <span>Innovative Solutions</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        <span>Real-World Impact</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacer to push footer to bottom */}
              <div className="flex-1"></div>

              {/* Beautiful Footer */}
              <footer
                className="mt-auto"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {/* Footer Content */}
                <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">

                  {/* Fintech Navigation */}
                  <div className="flex justify-center mb-12">
                    <button
                      onClick={() => navigate('/fintech')}
                      className="inline-flex items-center space-x-3 px-8 py-4 font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl group"
                      style={{
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        borderRadius: '16px',
                        boxShadow: '0 10px 40px rgba(34,197,94,0.4)',
                        color: '#ffffff',
                        border: '2px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      <DollarSign className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                      <span style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Explore Fintech Solutions</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>

                  {/* Divider */}
                  <div
                    className="h-px mb-8"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(0,185,200,0.3), transparent)'
                    }}
                  />

                  {/* Middle Section - Links Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* Column 1 - Company */}
                    <div>
                      <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
                      <ul className="space-y-2">
                        <li>
                          <a href="https://cyoda.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                            About CYODA
                          </a>
                        </li>
                        <li>
                          <a href="https://github.com/Cyoda-platform" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                            Open Source
                          </a>
                        </li>
                        <li>
                          <a href="https://devpost.com/Ksenniya?ref_content=user-portfolio&ref_feature=portfolio&ref_medium=global-nav" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
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
                          <a href="https://discord.com/invite/95rdAyBZr2" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                            Discord Server
                          </a>
                        </li>
                        <li>
                          <a href="https://github.com/Cyoda-platform" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                            GitHub
                          </a>
                        </li>
                        <li>
                          <a href="https://linkedin.com/company/cyoda" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
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
                          <a href="https://docs.cyoda.net/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                            Getting Started
                          </a>
                        </li>
                        <li>
                          <a href="https://docs.cyoda.net/api-reference/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
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

                  {/* Bottom Section - Copyright & Social */}
                  <div className="flex flex-col md:flex-row items-center justify-between pt-8">
                    {/* Copyright */}
                    <p className="text-slate-400 text-sm mb-4 md:mb-0">
                      © 2025 <a href="https://cyoda.com/" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">CYODA Ltd</a>. All rights reserved.
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center space-x-4">
                      <a
                        href="https://twitter.com/cyoda"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                        style={{
                          background: 'rgba(30, 41, 59, 0.5)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <svg className="w-5 h-5 text-slate-400 hover:text-teal-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>

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
                        <svg className="w-5 h-5 text-slate-400 hover:text-teal-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
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
                        <svg className="w-5 h-5 text-slate-400 hover:text-teal-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
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

export default HomeView;
