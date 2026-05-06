import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send,
  ChevronRight,
  X,
  Paperclip,
  Activity,
  History,
  Server,
  Database,
} from 'lucide-react';
import { useAssistantStore } from '@/stores/assistant';
import { useAuthStore, useSuperUserMode } from '@/stores/auth';
import Header from '@/components/Header/Header';
import ChatHistoryPanel from '@/components/ChatHistoryPanel/ChatHistoryPanel';
import EnvironmentsPanel from '@/components/EnvironmentsPanel/EnvironmentsPanel';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST, SHOW_LOGIN_POPUP } from '@/helpers/HelperConstants';
import { groupChatsByDate } from '@/helpers/HelperChatGroups';

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
  const isLoadingChats = useAssistantStore((state) => state.isLoadingChats);
  const chatListReady = useAssistantStore((state) => state.chatListReady);
  const isTransferringChats = useAssistantStore((state) => state.isTransferringChats);

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
    <div className="main-layout bg-slate-50 text-slate-900">
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
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin bg-slate-50"
        >
          <div className="p-4 sm:p-6 md:p-8 min-h-full flex flex-col min-w-0">
            <div className="w-full flex-1 flex flex-col min-w-0 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">

              {/* Hero */}
              <div className="mt-10 mb-8">
                <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-3 tracking-tight">
                  Cyoda Cloud Workbench
                </h1>
                <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
                  Model entity lifecycles, generate workflows, connect processors, and inspect history on hosted Cyoda.
                </p>
                <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                  Use the assistant to draft models and services, then refine them in Canvas with Requirements, Entities, Workflows, and Code.
                </p>
              </div>

              {/* Prompt Input */}
              <div className="mb-6">
                <form onSubmit={handleChatSubmit}>
                  <div
                    className="relative bg-white rounded-xl border border-slate-200 shadow-sm focus-within:border-blue-300 focus-within:shadow-md transition-shadow"
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
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Attach file"
                      >
                        <Paperclip size={16} />
                      </button>
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isLoading}
                        className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Send (Enter)"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send size={16} />
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
              <div className="mb-8">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Try an example</p>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_EXAMPLES.map((example) => (
                    <button
                      key={example}
                      onClick={() => handlePromptClick(example)}
                      className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workspace Shortcuts */}
              {!isResizing && (
                <div className="mb-8">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Workspace</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => navigate('/new-chat')}
                      className="flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/40 transition-colors text-left group"
                    >
                      <Activity size={18} className="text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                      <span className="text-sm font-medium text-slate-900">Canvas</span>
                      <span className="text-xs text-slate-500 mt-0.5 leading-tight">Model requirements, entities, workflows, and code.</span>
                    </button>

                    <button
                      onClick={() => setIsEnvironmentsOpen(!isEnvironmentsOpen)}
                      className="flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/40 transition-colors text-left group"
                    >
                      <Server size={18} className="text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                      <span className="text-sm font-medium text-slate-900">Cloud</span>
                      <span className="text-xs text-slate-500 mt-0.5 leading-tight">View environments, runtime status, and deployed applications.</span>
                    </button>

                    <button
                      onClick={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
                      className="flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/40 transition-colors text-left group"
                    >
                      <History size={18} className="text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                      <span className="text-sm font-medium text-slate-900">History</span>
                      <span className="text-xs text-slate-500 mt-0.5 leading-tight">Resume recent conversations and modelling sessions.</span>
                    </button>

                    <button
                      onClick={() => navigate('/workflows')}
                      className="flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/40 transition-colors text-left group"
                    >
                      <Database size={18} className="text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                      <span className="text-sm font-medium text-slate-900">Tasks</span>
                      <span className="text-xs text-slate-500 mt-0.5 leading-tight">Track background jobs and long-running operations.</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Sessions */}
              {hasChats && !isResizing && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recent Sessions</p>
                    <button
                      onClick={() => setIsChatHistoryOpen(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {recentChats.map((chat: any) => (
                      <button
                        key={chat.technical_id}
                        onClick={() => navigate(`/chat/${chat.technical_id}`)}
                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors text-left group"
                      >
                        <span className="text-sm text-slate-700 truncate group-hover:text-slate-900">{chat.name}</span>
                        <ChevronRight size={14} className="text-slate-400 flex-shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex-1" />
              <footer className="mt-auto pt-6 pb-4 border-t border-slate-200">
                <p className="text-xs text-slate-400">
                  © {new Date().getFullYear()}{' '}
                  <a href="https://cyoda.com/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">
                    CYODA Ltd
                  </a>
                </p>
              </footer>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
