import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Send,
  ChevronRight,
  X,
  Paperclip,
  Activity,
  History,
  Server,
  Database,
  Github,
  Linkedin,
  ArrowRight,
  Zap,
  Clock,
  BookOpen,
  Bot,
  CheckCircle,
  GitBranch,
  Shield,
  Cpu,
  Globe,
  Code2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import LogoSmall from '@/assets/images/logo-small.svg';
import { useAssistantStore } from '@/stores/assistant';
import { useAuthStore, useIsLoggedIn, useSuperUserMode } from '@/stores/auth';
import HelperStorage from '@/helpers/HelperStorage';
import { LOGIN_REDIRECT_URL } from '@/helpers/HelperConstants';
import Header from '@/components/Header/Header';
import ChatHistoryPanel from '@/components/ChatHistoryPanel/ChatHistoryPanel';
import EnvironmentsPanel from '@/components/EnvironmentsPanel/EnvironmentsPanel';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST, SHOW_LOGIN_POPUP, PENDING_CHAT_INPUT } from '@/helpers/HelperConstants';
import { groupChatsByDate } from '@/helpers/HelperChatGroups';

// ---------------------------------------------------------------------------
// Workflow Editor Preview (placeholder until real canvas is embedded)
// ---------------------------------------------------------------------------
const WorkflowEditorPreviewPlaceholder: React.FC = () => {
  const states = [
    { id: 'received', label: 'RECEIVED', color: 'bg-slate-100 text-slate-600 border-slate-300' },
    { id: 'validated', label: 'VALIDATED', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'matched', label: 'MATCHED', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'settled', label: 'SETTLED', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];
  const historyEntries = [
    { ts: '09:00:01', state: 'RECEIVED', note: 'Trade submitted via API' },
    { ts: '09:00:03', state: 'VALIDATED', note: 'Counterparty verified' },
    { ts: '09:00:07', state: 'MATCHED', note: 'Matched against open order' },
    { ts: '09:00:11', state: 'SETTLED', note: 'Settlement confirmed' },
  ];
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden"
      role="img"
      aria-label="Trade settlement workflow — entity lifecycle states, transitions, and history log"
    >
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <span className="ml-1.5 text-[10px] text-slate-500 font-mono">trade-settlement · lifecycle</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Cyoda Cloud</span>
      </div>
      <div className="p-3.5">
        <div className="mb-2 flex items-baseline gap-2" style={{ lineHeight: 1 }}>
          <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wide shrink-0" style={{ lineHeight: 1 }}>entity model</span>
          <span className="text-xs font-semibold text-slate-800" style={{ lineHeight: 1 }}>TradeSettlement</span>
        </div>
        <div className="mb-2.5">
          <p className="text-[9px] text-slate-400 font-mono mb-1.5 uppercase tracking-wide">lifecycle states</p>
          <div className="flex flex-wrap items-center gap-1">
            {states.map((s, i) => (
              <React.Fragment key={s.id}>
                <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-medium ${s.color}`}>{s.label}</span>
                {i < states.length - 1 && <ArrowRight size={9} className="text-slate-300 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="mb-2.5 bg-slate-50 rounded-md p-2 border border-slate-100">
          <p className="text-[9px] text-slate-400 font-mono mb-1 uppercase tracking-wide">valid transitions</p>
          <div className="space-y-1 text-[9px] font-mono text-slate-600">
            {['RECEIVED → VALIDATED   (validate)', 'VALIDATED → MATCHED    (match)', 'MATCHED → SETTLED      (settle)', 'MATCHED → FAILED       (fail)'].map((t) => (
              <div key={t} className="flex items-center gap-1">
                <Zap size={8} className="text-blue-400 shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1.5" style={{ lineHeight: 1 }}>
            <Clock size={9} className="text-slate-400 shrink-0" />
            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wide" style={{ lineHeight: 1 }}>state history</span>
          </div>
          <div className="space-y-1">
            {historyEntries.map((e) => (
              <div key={e.ts} className="flex items-start gap-1.5 text-[9px]">
                <span className="font-mono text-slate-400 shrink-0 w-12">{e.ts}</span>
                <span className="font-mono text-slate-600 shrink-0 w-16">{e.state}</span>
                <span className="text-slate-500">{e.note}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-1.5 text-[9px] text-slate-400 border-t border-slate-100 pt-1.5" style={{ lineHeight: 1 }}>
          Every transition enforced and recorded by the Cyoda runtime.
        </p>
      </div>
    </div>
  );
};

const faqs = [
  { q: 'Is Cyoda Cloud production-ready?', a: 'Cyoda Cloud is in live beta. It is free to try and suitable for development and evaluation. It is not a production service: it does not include an SLA, guaranteed retention, or guaranteed backups.' },
  { q: 'Is Cyoda Cloud free?', a: 'Yes. Cyoda Cloud is free to try during live beta. There are no credit card or payment details required to sign up.' },
  { q: 'What are the free tier limits?', a: 'The free beta tier includes 20 models, 150 fields per model, 300 cumulative fields, 1 client node, 5 MB payload size, 2 GB disk usage, 300 API requests per minute, and 300 external calls per minute. Limits are subject to change. Your account\'s current limits are authoritative at /account and /account/subscriptions.' },
  { q: 'Is the free tier backed up?', a: 'No. The free beta tier does not include guaranteed backups or guaranteed data retention. Environments may be reset after an expiry period.' },
  { q: 'Where is Cyoda Cloud hosted?', a: 'Cyoda Cloud is hosted in Finland in a Hetzner ISO-certified data centre.' },
  { q: 'Is my data encrypted?', a: 'Data is encrypted in transit. Storage is protected with encrypted hard drives. The free beta does not provide a production SLA or guaranteed backup/retention commitments.' },
  { q: 'Is my data used to train AI models?', a: 'No. Customer data submitted to Cyoda Cloud is not used to train AI models.' },
  { q: 'Can Cyoda staff access my environment?', a: 'Access is restricted, logged, and monitored. Break-glass access may be used for operational support where required.' },
  { q: 'How does Cyoda Cloud authentication work?', a: 'Cyoda Cloud uses JWT-based authentication. Users and technical clients can authenticate through Cyoda-managed identity flows or trusted OIDC providers, depending on the environment. Access to platform features is bounded by the account subscription tier and entitlements.' },
  { q: 'Can I move from Cyoda Cloud to self-hosted or Enterprise Cyoda?', a: 'Yes. The same entity models, lifecycle definitions, and API work across Cyoda Cloud, the open-source runtime, and Enterprise Cyoda. You can move between deployment options without rewriting your application.' },
  { q: 'What is the difference between Cyoda Cloud, open-source Cyoda, and Enterprise Cyoda?', a: 'Cyoda Cloud is the hosted free-to-try runtime in live beta, suitable for development and evaluation. The open-source Cyoda runtime is available under Apache 2.0 for self-hosted use. Enterprise Cyoda adds production deployment options, SLA-backed support, and horizontal scalability.' },
  { q: 'What does the AI assistant do?', a: 'The AI assistant helps you draft entity models, generate workflow JSON, edit existing workflows, explain invalid transitions, and generate service code in Python or Java. It accelerates modelling and development. Direct import of generated workflows into the runtime is not currently supported.' },
  { q: 'Does the AI assistant replace the runtime?', a: 'No. The AI assistant accelerates modelling, but Cyoda remains the deterministic runtime that enforces valid state transitions and records history.' },
  { q: 'Which languages does the AI assistant support?', a: 'The AI assistant currently generates service code in Python and Java.' },
];

const FAQItem: React.FC<{ question: string; answer: string; index: number }> = ({ question, answer, index }) => {
  const [open, setOpen] = useState(false);
  const id = `faq-${index}`;
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-slate-900 hover:text-blue-700 transition-colors bg-transparent cursor-pointer"
      >
        <span>{question}</span>
        {open ? <ChevronUp size={16} className="shrink-0 text-slate-500" /> : <ChevronDown size={16} className="shrink-0 text-slate-500" />}
      </button>
      {open && (
        <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`} className="pb-5 text-sm text-slate-700 leading-7">
          {answer}
        </div>
      )}
    </div>
  );
};

const PROMPT_EXAMPLES = [
  'Model a trade settlement lifecycle',
  'Create a KYC onboarding workflow',
  'Add an entity with lifecycle states',
  'Connect a Java processor',
  'Explain this workflow',
  'Generate a Python service stub',
];

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
      const decodedName = decodeURIComponent(nameParam);
      setChatInput(decodedName);
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
      searchParams.delete('name');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    if (chatInputRef.current) {
      const textarea = chatInputRef.current;
      textarea.style.height = 'auto';
      const newHeight = Math.max(60, Math.min(300, textarea.scrollHeight));
      setTextareaHeight(newHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [chatInput]);

  const assistantStore = useAssistantStore();
  const authStore = useAuthStore();
  const superUserMode = useSuperUserMode();
  const isLoggedIn = useIsLoggedIn();
  const { loginWithRedirect, isLoading: auth0Loading } = useAuth0();
  const isLoadingChats = useAssistantStore((state) => state.isLoadingChats);
  const chatListReady = useAssistantStore((state) => state.chatListReady);
  const isTransferringChats = useAssistantStore((state) => state.isTransferringChats);
  const helperStorage = new HelperStorage();

  // Resizable chat history panel
  const chatHistoryResize = useResizablePanel({
    defaultWidth: 400,
    minWidth: 200,
    maxWidth: 400,
    storageKey: 'home-chatHistory-width'
  });

  // Resizable environments panel
  const environmentsResize = useResizablePanel({
    defaultWidth: 500,
    minWidth: 350,
    maxWidth: 1200,
    storageKey: 'home-environments-width'
  });

  // Check if returning from fullscreen and reopen environments panel
  useEffect(() => {
    const wasInFullscreen = localStorage.getItem('environments-width-before-fullscreen');
    if (wasInFullscreen) {
      setIsEnvironmentsOpen(true);
    }
  }, []);

  // Load chats on mount
  useEffect(() => {
    const loadChats = async () => {
      if (isTransferringChats) return;
      try {
        await assistantStore.getChats(true);
      } catch (error) {
        console.error('Failed to load chats:', error);
      }
    };
    loadChats();

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
      assistantStore.getChats(true).catch(error => {
        console.error('Failed to refresh chat list after super user mode change:', error);
      });
    }
  }, [superUserMode]);

  // Detect main content area resize to hide workspace cards when squished
  useEffect(() => {
    if (!mainContentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const currentWidth = entry.contentRect.width;
        if (initialWidthRef.current === 0) {
          initialWidthRef.current = currentWidth;
          return;
        }
        const initialWidth = initialWidthRef.current;
        const widthDecrease = ((initialWidth - currentWidth) / initialWidth) * 100;
        if (widthDecrease >= 50) {
          setIsResizing(true);
        } else {
          setIsResizing(false);
        }
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
      return orgId.startsWith('guest');
    } catch (e) {
      return false;
    }
  }, [authStore.token]);

  // Submit the chat
  const submitChat = async (input: string, files: File[]) => {
    setIsLoading(true);
    const initialMessage = input;
    const tempId = `temp-${Date.now()}`;
    console.log('[HomeView] Navigating to temp chat:', tempId);
    navigate(`/chat/${tempId}?openCanvas=true&creating=true`);

    try {
      let response;
      const chatName = input.substring(0, 50) + (input.length > 50 ? '...' : '');

      if (files.length > 0) {
        const formData = new FormData();
        formData.append('name', chatName);
        formData.append('description', '');
        files.forEach(file => {
          formData.append('files', file);
        });
        response = await assistantStore.postChats(formData as any);
      } else {
        response = await assistantStore.postChats({
          name: chatName,
          description: ''
        } as any);
      }

      if (response?.data?.technical_id || response?.data?.chat_id) {
        const realId = response.data.technical_id || response.data.chat_id;
        assistantStore.getChats(true).catch(error => {
          console.error('Failed to refresh chat list:', error);
        });
        console.log('[HomeView] Navigating to real chat:', realId);
        console.log('[HomeView] Storing initial message in localStorage:', initialMessage);
        localStorage.setItem(`initial-message-${realId}`, initialMessage);
        navigate(`/chat/${realId}?openCanvas=true`, { replace: true });
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      navigate('/', { replace: true });
    } finally {
      setIsLoading(false);
      setAttachedFiles([]);
      setChatInput('');
      setTextareaHeight(60);
      setPendingMessage(null);
    }
  };

  // Restore pending message from sessionStorage after Auth0 redirect
  useEffect(() => {
    const saved = sessionStorage.getItem(PENDING_CHAT_INPUT);
    if (saved) {
      sessionStorage.removeItem(PENDING_CHAT_INPUT);
      setPendingMessage({ input: saved, files: [] });
    }
  }, []);

  // Watch for auth changes to send pending message
  useEffect(() => {
    if (!isGuestUser && pendingMessage && authStore.token && authStore.tokenType === 'private') {
      submitChat(pendingMessage.input, pendingMessage.files);
    }
  }, [isGuestUser, authStore.token, authStore.tokenType, pendingMessage]);

  // Keyboard shortcut: Ctrl/Cmd+K focuses input
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

    // Unauthenticated user — save message and redirect to login/signup
    if (!isLoggedIn && !isGuestUser) {
      sessionStorage.setItem(PENDING_CHAT_INPUT, chatInput.trim());
      helperStorage.set(LOGIN_REDIRECT_URL, '/');
      loginWithRedirect({ authorizationParams: { prompt: 'login' } });
      return;
    }

    if (isGuestUser) {
      const currentInput = chatInput.trim();
      const currentFiles = [...attachedFiles];
      setPendingMessage({ input: currentInput, files: currentFiles });
      eventBus.$emit(SHOW_LOGIN_POPUP, {
        isGuestUser: true,
        onProceedWithoutLogin: () => {
          submitChat(currentInput, currentFiles);
        }
      });
      return;
    }

    await submitChat(chatInput.trim(), attachedFiles);
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const validFiles: File[] = [];
      newFiles.forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`File ${file.name} is too large`);
        } else {
          validFiles.push(file);
        }
      });
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePromptClick = (prompt: string) => {
    setChatInput(prompt);
    chatInputRef.current?.focus();
  };

  // Drag and drop
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
      setAttachedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  // Handle delete chat
  const handleDeleteChat = async (chatId: string) => {
    try {
      await assistantStore.deleteChatById(chatId);
      await assistantStore.getChats(true);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const chatGroups = groupChatsByDate(assistantStore.chatList);
  const hasChats = chatGroups.length > 0;

  const recentChats = chatGroups.flatMap(g => g.chats).slice(0, 5);

  return (
    <div className="main-layout text-slate-900 bg-white">
      <Header
        showActions={true}
        onToggleChatHistory={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
        onToggleEnvironments={() => setIsEnvironmentsOpen(!isEnvironmentsOpen)}
        chatHistoryVisible={isChatHistoryOpen}
        environmentsVisible={isEnvironmentsOpen}
        showCanvasButton={false}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Resizable Chat History Panel */}
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
              onRefresh={() => assistantStore.getChats(true)}
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
                localStorage.setItem('environments-width-before-fullscreen', environmentsResize.width.toString());
                navigate('/environments', { state: { from: '/' } });
              }}
            />
          </div>
        )}

        {/* Main Content */}
        <div
          ref={mainContentRef}
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin"
        >
          {/* ── Section 1: Hero + Input + Examples — bg-white ── */}
          <section className="bg-white border-b border-slate-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 min-w-0">

              {/* Hero */}
              <div style={{ marginTop: '40px', marginBottom: '32px' }} className="flex items-start gap-10">
                {/* Left: text */}
                <div className="flex-[13] min-w-0">
                  <p
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      color: 'hsl(220,90%,56%)',
                      marginBottom: '12px',
                    }}
                  >
                    LIVE BETA · FREE TO TRY
                  </p>
                  <h1
                    style={{
                      fontSize: 'clamp(2rem, 4vw, 3rem)',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                      marginBottom: '20px',
                      color: 'hsl(215,28%,14%)',
                    }}
                  >
                    Cyoda Cloud Workbench
                  </h1>
                  <p
                    style={{
                      fontSize: '1.125rem',
                      lineHeight: 1.6,
                      marginBottom: '8px',
                      color: 'hsl(215,18%,38%)',
                    }}
                  >
                    Model entity lifecycles, generate workflows, connect processors,<br />and inspect history on hosted Cyoda.
                  </p>
                  <p
                    style={{
                      fontSize: '1.125rem',
                      lineHeight: 1.6,
                      color: 'hsl(215,18%,38%)',
                    }}
                  >
                    Use the assistant to draft models and services, then refine them in Canvas<br />with Requirements, Entities, Workflows, and Code.
                  </p>
                  <button
                    onClick={() => {
                      if (auth0Loading) return;

                      if (isLoggedIn) {
                        chatInputRef.current?.focus();
                      } else {
                        // Unauthenticated: trigger login
                        helperStorage.set(LOGIN_REDIRECT_URL, '/');
                        loginWithRedirect({
                          authorizationParams: { prompt: 'login' }
                        });
                      }
                    }}
                    disabled={auth0Loading}
                    className="inline-flex items-center space-x-2 px-6 py-3 font-bold text-base transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      marginTop: '24px',
                      background: '#2563EB',
                      borderRadius: '8px',
                      color: '#ffffff',
                      border: 'none',
                      cursor: auth0Loading ? 'not-allowed' : 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!auth0Loading) {
                        (e.target as HTMLButtonElement).style.background = '#1D4ED8';
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.background = '#2563EB';
                    }}
                  >
                    Try Cyoda Cloud →
                  </button>
                </div>
                {/* Right: lifecycle preview card */}
                <div className="hidden lg:block flex-[7] min-w-0">
                  <WorkflowEditorPreviewPlaceholder />
                </div>
              </div>

              {/* Prompt Input */}
              <div className="mb-6">
                <form onSubmit={handleChatSubmit}>
                  <div
                    className="relative bg-white rounded-xl border border-slate-200 shadow-sm focus-within:border-blue-400 focus-within:shadow-md transition-shadow"
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {isDragging && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/95 rounded-xl z-10 border-2 border-dashed border-blue-400">
                        <div className="text-center">
                          <Paperclip size={32} className="text-blue-400 mx-auto mb-2" />
                          <span className="text-blue-600 font-medium text-sm">Drop files here</span>
                        </div>
                      </div>
                    )}

                    <textarea
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onPaste={() => {
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
                      placeholder="Ask the assistant to model a workflow, explain an entity lifecycle, or generate a service stub."
                      rows={1}
                      className="w-full text-slate-900 placeholder-slate-400 focus:outline-none text-base resize-none bg-transparent"
                      style={{
                        height: `${textareaHeight}px`,
                        minHeight: '60px',
                        maxHeight: '300px',
                        overflowY: textareaHeight >= 300 ? 'auto' : 'hidden',
                        lineHeight: '1.5',
                        padding: '14px 96px 14px 16px',
                      }}
                      disabled={isLoading}
                    />

                    <div className="absolute right-3 bottom-3 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleFileAttach}
                        disabled={!isLoggedIn}
                        className="p-2 rounded-lg transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={(e) => { if (isLoggedIn) e.currentTarget.style.color = '#2563eb'; }}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                        title={isLoggedIn ? 'Attach file' : 'Sign in to attach files'}
                      >
                        <Paperclip size={16} />
                      </button>
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isLoading}
                        className="p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center group hover:scale-110 disabled:cursor-not-allowed"
                        style={{ transform: 'translateY(5%)' }}
                        title="Send (Enter)"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                        ) : (
                          <Send
                            size={16}
                            strokeWidth={2}
                            className="transition-all duration-200"
                            style={{ color: !chatInput.trim() ? '#94a3b8' : '#2563eb' }}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* File attachments */}
                {attachedFiles.length > 0 && (
                  <div className="mt-2 p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600">Attached Files ({attachedFiles.length})</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles([])}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="bg-slate-50 text-slate-700 px-2 py-1.5 rounded-md text-xs flex items-center gap-1.5 border border-slate-200">
                          <Paperclip size={10} className="text-blue-500 flex-shrink-0" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="hover:text-red-500 transition-colors ml-0.5"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.xlsx,.pptx,.xml,.json,text/*,image/*"
                />
              </div>

              {/* Prompt Examples */}
              <div className="mb-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">Try an example</p>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_EXAMPLES.map((example) => (
                    <button
                      key={example}
                      onClick={() => handlePromptClick(example)}
                      className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 2: Get started — bg-slate-50 ── */}
          <section className="bg-slate-50 border-b border-slate-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
              <div className="mb-0">
                <p className="text-xs font-medium text-teal-600 uppercase tracking-widest mb-5">Get started</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Step 01 */}
                  <div className="flex flex-col p-5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-xs font-mono text-slate-500">01</span>
                    <h3 className="text-sm font-semibold text-slate-900 mt-1 mb-2">Create a free account</h3>
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">Sign up through Auth0. No credit card required. Your environment is provisioned automatically.</p>
                    <div className="mt-4">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (isLoggedIn) {
                          chatInputRef.current?.focus();
                        } else {
                          helperStorage.set(LOGIN_REDIRECT_URL, '/');
                          loginWithRedirect({ authorizationParams: { prompt: 'login' } });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Try Cyoda Cloud <ArrowRight size={13} />
                    </a>
                    </div>
                  </div>
                  {/* Step 02 */}
                  <div className="flex flex-col p-5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-xs font-mono text-slate-500">02</span>
                    <h3 className="text-sm font-semibold text-slate-900 mt-1 mb-2">Define entity models</h3>
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">Use the hosted UI or API to define entity models, lifecycle states, and valid transitions. The AI assistant can draft models from a description.</p>
                    <div className="mt-4">
                    <a
                      href="https://docs.cyoda.net/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Read the docs <ExternalLink size={13} />
                    </a>
                    </div>
                  </div>
                  {/* Step 03 */}
                  <div className="flex flex-col p-5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-xs font-mono text-slate-500">03</span>
                    <h3 className="text-sm font-semibold text-slate-900 mt-1 mb-2">Connect your compute</h3>
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">Attach Python or Java processors to handle transitions. Cyoda enforces valid state changes and records every transition with a full history trail.</p>
                    <div className="mt-4">
                    <a
                      href="https://github.com/Cyoda-platform/cyoda-go"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View on GitHub <ExternalLink size={13} />
                    </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 3: Platform overview — bg-white ── */}
          <section className="bg-white border-b border-slate-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12">
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                <div>
                  <p className="text-xs font-mono text-blue-600 uppercase tracking-widest mb-3">How it works</p>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Every state transition is enforced and recorded.</h2>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    Cyoda Cloud gives you a managed Cyoda environment without installing the runtime or operating a cluster. Define entity models, enforce lifecycle transitions, connect external compute, and inspect state history from the hosted UI and APIs.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-600">
                    {[
                      { icon: GitBranch, text: 'Define lifecycle states and valid transitions per entity type' },
                      { icon: Shield, text: 'Invalid transitions rejected at the runtime, not the application layer' },
                      { icon: Clock, text: 'Full state history queryable from the API' },
                      { icon: Database, text: 'Connect external compute as event-driven processors' },
                    ].map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-3">
                        <Icon size={16} className="text-blue-600 mt-0.5 shrink-0" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: Server, title: 'Hosted runtime', desc: 'Managed Cyoda environment without installing the runtime or operating a cluster.' },
                    { icon: Cpu, title: 'Lifecycle enforcement', desc: 'Entity model rules enforced at the runtime level on every state change.' },
                    { icon: Clock, title: 'Traceable history', desc: 'Every transition recorded with timestamps and context, queryable via API.' },
                    { icon: Globe, title: 'API-first', desc: 'Full platform surface accessible via the same Cyoda API across Cloud, self-hosted, and Enterprise.' },
                    { icon: Database, title: 'External compute', desc: 'Connect Python or Java processors to handle entity events and lifecycle transitions.' },
                    { icon: CheckCircle, title: 'Proven runtime', desc: 'Cyoda is proven in regulated markets and has been live since 2017.' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                      <Icon size={18} className="text-blue-600 mb-2" />
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 4: AI assistant — bg-slate-50 ── */}
          <section className="bg-slate-50 border-b border-slate-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12">
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                <div>
                  <p className="text-xs font-mono text-blue-600 uppercase tracking-widest mb-3">Built-in feature</p>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">AI assistant</h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    The built-in AI assistant helps you draft entity models, generate workflow JSON, edit existing workflows, explain invalid transitions, and work with Java or Python service patterns. The assistant accelerates modelling, but Cyoda remains the deterministic runtime that enforces valid state transitions and records history.
                  </p>
                  <p className="text-sm text-slate-600">
                    The assistant is a feature of Cyoda Cloud, not a replacement for the runtime or your application code.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-4">What the assistant can do</p>
                  <div className="space-y-3">
                    {[
                      'Draft entity models from a description',
                      'Generate workflow JSON for lifecycle definitions',
                      'Edit existing workflows and explain invalid transitions',
                      'Generate service processors in Python or Java',
                      'Run tests against generated code',
                    ].map((cap) => (
                      <div key={cap} className="flex items-start gap-3 text-sm text-slate-700">
                        <CheckCircle size={15} className="text-blue-600 mt-0.5 shrink-0" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 p-3 bg-white border border-slate-200 rounded-md text-xs text-slate-600">
                    <Code2 size={12} className="inline mr-1.5 text-slate-500" />
                    Currently supports Python and Java service generation. Direct import of generated workflows into the runtime is a planned feature.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 5: Free tier — bg-white ── */}
          <section className="bg-white border-b border-slate-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12">
              <div className="max-w-3xl">
                <p className="text-xs font-mono text-blue-600 uppercase tracking-widest mb-3">Free tier</p>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Free beta expectations</h2>
                <p className="text-slate-600 leading-relaxed mb-8">
                  Cyoda Cloud is free to try during live beta. The free tier is intended for evaluation, prototyping, and developer testing. It is not a production service and does not include an SLA, guaranteed retention, or guaranteed backups.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Reference limits</h3>
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      ['Models', '20'],
                      ['Fields per model', '150'],
                      ['Cumulative fields', '300'],
                      ['Client nodes', '1'],
                      ['Payload size', '5 MB'],
                      ['Disk usage', '2 GB'],
                      ['API requests', '300 / min'],
                      ['External calls', '300 / min'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                        <span className="text-slate-600">{label}</span>
                        <span className="font-mono text-slate-900">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 mt-4">
                    Free tier environments are automatically reset after an expiry period. Your account's current limits are authoritative in the Cyoda Cloud API at{' '}
                    <span className="font-mono">/account</span> and <span className="font-mono">/account/subscriptions</span>.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Free to try', 'Live beta', 'Best-efforts support', 'No production SLA', 'Not intended for production workloads'].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-white border border-slate-300 rounded-md font-medium text-slate-700">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 6: FAQ — bg-slate-50 ── */}
          <section className="bg-slate-50 border-b border-slate-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12">
              <div className="grid lg:grid-cols-3 gap-12">
                <div>
                  <p className="text-xs font-mono text-blue-600 uppercase tracking-widest mb-3">FAQ</p>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Common questions</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Questions about hosting, security, the free tier, and how the AI assistant fits into Cyoda.
                  </p>
                  <a
                    href="https://docs.cyoda.net/cyoda-cloud/identity-and-entitlements/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Identity and entitlements docs <ExternalLink size={13} />
                  </a>
                </div>
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg px-6 divide-y divide-slate-200">
                  {faqs.map((faq, i) => (
                    <FAQItem key={i} question={faq.q} answer={faq.a} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="bg-white border-t border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Logo + description */}
                <div className="md:col-span-2">
                  <div className="mb-4">
                    <img src={LogoSmall} alt="Cyoda" className="h-6" />
                  </div>
                  <p className="text-sm text-slate-500 mb-6 max-w-xs leading-relaxed">
                    Enterprise Cyoda, commercially supported EDBMS for stateful, auditable, workflow-driven systems. In production in European private-debt markets since 2017.
                  </p>
                  <div className="flex items-center gap-3">
                    <a href="https://www.linkedin.com/company/cyoda" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-slate-300 transition-all">
                      <Linkedin size={18} />
                    </a>
                    <a href="https://discord.com/invite/95rdAyBZr2" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-500 hover:border-slate-300 transition-all">
                      <svg viewBox="0 0 71 55" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/></svg>
                    </a>
                    <a href="https://www.youtube.com/@cyoda934" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-slate-300 transition-all">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </a>
                    <a href="https://github.com/Cyoda-platform/" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all">
                      <Github size={18} />
                    </a>
                  </div>
                </div>

                {/* Platform */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Platform</h3>
                  <nav className="space-y-3">
                    <a href="https://cyoda.com/use-cases" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-500 hover:text-teal-600 transition-colors">Use Cases</a>
                    <a href="https://docs.cyoda.net/" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-500 hover:text-teal-600 transition-colors">Docs</a>
                    <a href="https://cyoda.com/blog" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-500 hover:text-teal-600 transition-colors">Blog</a>
                  </nav>
                </div>

                {/* Company */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Company</h3>
                  <nav className="space-y-3">
                    <a href="https://cyoda.com/about" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-500 hover:text-teal-600 transition-colors">About</a>
                    <a href="https://cyoda.com/support" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-500 hover:text-teal-600 transition-colors">Support</a>
                    <a href="https://cyoda.com/contact" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-500 hover:text-teal-600 transition-colors">Contact</a>
                  </nav>
                </div>

                {/* Cyoda */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Cyoda</h3>
                  <nav className="space-y-3">
                    <a href="https://cyoda.com/" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-500 hover:text-teal-600 transition-colors">Enterprise Cyoda</a>
                    <a href="https://ai.cyoda.net/" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-500 hover:text-teal-600 transition-colors">Cyoda Cloud</a>
                    <a href="https://cyoda.org" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-500 hover:text-teal-600 transition-colors">Open Source</a>
                  </nav>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-slate-400">© {new Date().getFullYear()} Cyoda. All rights reserved.</p>
                <div className="flex items-center gap-6">
                  <a href="https://cyoda.com/cookie-policy" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-teal-600 transition-colors">Cookie Policy</a>
                  <a href="https://cyoda.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-teal-600 transition-colors">Privacy Policy</a>
                  <a href="https://cyoda.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-teal-600 transition-colors">Terms of Service</a>
                </div>
              </div>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
};

export default HomeView;
