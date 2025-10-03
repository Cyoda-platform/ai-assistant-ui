import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, History, Clock, ChevronRight, X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';

interface Chat {
  technical_id: string;
  name?: string;
  description?: string;
  last_modified?: string;
  date?: string;
}

interface ChatGroup {
  title: string;
  chats: Chat[];
}

interface ChatHistoryPanelProps {
  chatGroups: ChatGroup[];
  currentChatId?: string;
  isLoading?: boolean;
  onResizeMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
  showHomeAsActive?: boolean; // true for home page, false for chat details
  onClose?: () => void; // Optional close callback
}

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  chatGroups,
  currentChatId,
  isLoading = false,
  onResizeMouseDown,
  isResizing,
  showHomeAsActive = false,
  onClose
}) => {
  const navigate = useNavigate();

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

  const hasChats = chatGroups.length > 0;

  return (
    <div className="h-full bg-slate-800/95 backdrop-blur-sm border-r border-slate-600 flex flex-col relative resizable-panel">
      {/* Header with Close Button */}
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <History size={18} className="text-teal-400" />
            <h3 className="font-semibold text-white translate-y-[20%]">Chat History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Close Panel"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 flex flex-col p-4 space-y-2 overflow-hidden ${onClose ? 'pt-4' : 'pt-6'}`}>
        {/* Home Button */}
        <a
          href="/"
          onClick={(e) => {
            // Allow default behavior for middle-click and Ctrl+click
            if (e.button === 1 || e.ctrlKey || e.metaKey) {
              return;
            }
            // Prevent default and use navigate for regular clicks
            e.preventDefault();
            navigate('/');
          }}
          onAuxClick={(e) => {
            // Handle middle-click
            if (e.button === 1) {
              e.preventDefault();
              window.open('/', '_blank');
            }
          }}
          className={`flex items-center space-x-3 cursor-pointer px-3 py-2.5 rounded-lg transition-all duration-200 group no-underline ${
            showHomeAsActive
              ? 'text-white bg-slate-700/60 border border-slate-600/50 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/40 border border-transparent'
          }`}
        >
          <Home size={19} className="group-hover:scale-110 transition-transform flex-shrink-0" />
          <span className="font-semibold text-sm">New Chat</span>
        </a>

        {/* Current Chat / History Header */}
        <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
          <div
            className={`flex items-center space-x-3 cursor-pointer px-3 py-2.5 rounded-lg group ${
              !showHomeAsActive
                ? 'text-white bg-slate-700/60 border border-slate-600/50 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/40 transition-all duration-200 border border-transparent'
            }`}
          >
            <History size={19} className="group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="font-semibold text-sm">{!showHomeAsActive ? 'Current Chat' : 'History'}</span>
            {showHomeAsActive && <ChevronRight size={16} className="ml-auto group-hover:translate-x-1 transition-transform" />}
          </div>

          {/* Chat History List */}
          <div className="space-y-4 flex-1 overflow-y-auto chat-container pr-2">
            {isLoading ? (
              <div className="px-2 py-8 flex flex-col items-center justify-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-slate-400">Loading chat history...</p>
              </div>
            ) : hasChats ? (
              chatGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.chats.map((chat) => (
                      <a
                        key={chat.technical_id}
                        href={`/chat/${chat.technical_id}`}
                        onClick={(e) => {
                          // Allow default behavior for middle-click and Ctrl/Cmd+click
                          if (e.button === 1 || e.ctrlKey || e.metaKey) {
                            return;
                          }
                          // Prevent default and use navigate for normal clicks
                          e.preventDefault();
                          navigate(`/chat/${chat.technical_id}`);
                        }}
                        onAuxClick={(e) => {
                          // Handle middle-click (button 1)
                          if (e.button === 1) {
                            e.preventDefault();
                            window.open(`/chat/${chat.technical_id}`, '_blank');
                          }
                        }}
                        className={`group block cursor-pointer px-3 py-2.5 rounded-lg transition-all duration-200 text-sm no-underline ${
                          chat.technical_id === currentChatId
                            ? 'bg-slate-700/70 border border-slate-600/60 text-slate-300 shadow-sm'
                            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/40 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start space-x-2.5">
                          <Clock
                            size={16}
                            className={`mt-0.5 flex-shrink-0 ${
                              chat.technical_id === currentChatId ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-400'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className={`truncate font-medium ${
                              chat.technical_id === currentChatId ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-300'
                            }`} title={chat.name || chat.description}>
                              {chat.name || chat.description || 'Untitled Chat'}
                            </div>
                            <div className={`text-xs mt-0.5 ${
                              chat.technical_id === currentChatId ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              {formatRelativeTime(chat.last_modified || chat.date || '')}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-2 py-8 text-center">
                <div className="text-sm text-slate-400 mb-1 font-medium">No chat history yet</div>
                <div className="text-xs text-slate-500">Start a conversation to see your chats here</div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Footer - Copyright */}
      <div className="p-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 text-center">
          Copyright © 2025{' '}
          <a
            href="https://cyoda.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            CYODA Ltd.
          </a>
        </p>
      </div>

      {/* Resize Handle */}
      <ResizeHandle onMouseDown={onResizeMouseDown} isResizing={isResizing} position="right" />
    </div>
  );
};

export default ChatHistoryPanel;

