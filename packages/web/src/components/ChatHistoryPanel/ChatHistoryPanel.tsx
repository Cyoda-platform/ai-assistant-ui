import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Home, History, Clock, ChevronRight, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { Modal } from 'antd';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';
import { formatRelativeTime } from '@/utils/dateUtils';
import ChatContextMenu from './ChatContextMenu';
import ChatBotRenameDialog from '@/components/ChatBot/ChatBotRenameDialog';
import './ChatContextMenu.css';

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
  onDeleteChat?: (chatId: string) => void; // Optional delete callback
  onRenameChat?: (chatId: string, newName: string) => void; // Optional rename callback
  hasMoreChats?: boolean; // Whether there are more chats to load
  isLoadingMore?: boolean; // Whether more chats are being loaded
  onLoadMore?: () => void; // Callback to load more chats
  onRefresh?: () => void; // Optional refresh callback
}

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  chatGroups,
  currentChatId,
  isLoading = false,
  onResizeMouseDown,
  isResizing,
  showHomeAsActive = false,
  onClose,
  onDeleteChat,
  onRenameChat,
  hasMoreChats = false,
  isLoadingMore = false,
  onLoadMore,
  onRefresh
}) => {
  const navigate = useNavigate();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<{ id: string; name: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent | null, chatId: string, chatName?: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setChatToDelete({ id: chatId, name: chatName });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (chatToDelete && onDeleteChat) {
      onDeleteChat(chatToDelete.id);
    }
    setDeleteModalOpen(false);
    setChatToDelete(null);
  };

  const handleRenameClick = (chatId: string, chatName: string) => {
    setChatToRename({ id: chatId, name: chatName });
    setRenameDialogOpen(true);
  };

  const handleRenameSuccess = (newName: string) => {
    if (chatToRename && onRenameChat) {
      onRenameChat(chatToRename.id, newName);
    }
    setRenameDialogOpen(false);
    setChatToRename(null);
  };

  const handleRenameCancel = () => {
    setRenameDialogOpen(false);
    setChatToRename(null);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setChatToDelete(null);
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const hasChats = chatGroups.length > 0;

  return (
    <div className="h-full bg-white border-r border-slate-200 flex flex-col relative resizable-panel">
      {/* Header with Refresh and Close Buttons */}
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center space-x-2">
            <History size={18} className="text-blue-600" />
            <h3 className="font-semibold text-slate-900 translate-y-[20%]">Chat History</h3>
          </div>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh chat history"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 flex flex-col pl-4 pr-2 py-4 space-y-2 overflow-hidden ${onClose ? 'pt-4' : 'pt-6'}`}>
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
          className="flex items-center justify-center gap-2 cursor-pointer px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors no-underline"
          style={{ color: '#ffffff' }}
        >
          <Home size={19} className="flex-shrink-0" style={{ color: '#ffffff' }} />
          <span style={{ color: '#ffffff' }}>New Chat</span>
        </a>

        {/* Chat History List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={`space-y-4 flex-1 chat-container ${isLoading ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3 py-8">
                <LoadingSpinner size="md" />
                <div className="text-sm text-slate-600 font-medium">Loading chats...</div>
              </div>
            ) : hasChats ? (
              chatGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.chats.map((chat) => (
                      <ChatContextMenu
                        key={chat.technical_id}
                        chatId={chat.technical_id}
                        chatName={chat.name || chat.description || 'Untitled Chat'}
                        chatDescription={chat.description}
                        chatDate={chat.last_modified || chat.date}
                        onRename={handleRenameClick}
                        onDelete={(chatId, chatName) => handleDeleteClick(null, chatId, chatName)}
                        showMenuButton={true}
                      >
                        <a
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
                          className={`group block cursor-pointer px-3 py-2.5 rounded-lg transition-all duration-200 text-sm no-underline relative ${
                            chat.technical_id === currentChatId
                              ? 'bg-blue-50 text-slate-900 border border-blue-200'
                              : 'text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                          }`}
                        >
                        <div className="flex items-start space-x-2.5">
                          <Clock
                            size={16}
                            className={`mt-0.5 flex-shrink-0 ${
                              chat.technical_id === currentChatId ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'
                            }`}
                          />
                          <div className="flex-1 min-w-0 pr-10">
                            <div className={`truncate font-medium ${
                              chat.technical_id === currentChatId ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'
                            }`} title={chat.name || chat.description}>
                              {chat.name || chat.description || 'Untitled Chat'}
                            </div>
                            <div className={`text-xs mt-0.5 ${
                              chat.technical_id === currentChatId ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              {formatRelativeTime(chat.last_modified || chat.date || '')}
                            </div>
                          </div>
                        </div>
                        </a>
                      </ChatContextMenu>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-2 py-8 text-center">
                <div className="text-sm text-slate-600 mb-1 font-medium">No chat history yet</div>
                <div className="text-xs text-slate-400">Start a conversation to see your chats here</div>
              </div>
            )}



            {/* Load More Button - Show only when there are more chats to load */}
            {!isLoading && onLoadMore && hasMoreChats && (
              <div className="px-2 pb-4">
                {isLoadingMore ? (
                  <div className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  <button
                    onClick={onLoadMore}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-all duration-200 text-sm font-medium"
                  >
                    Load More Chats
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Footer - Copyright */}
      <div className="p-4 border-t border-slate-200">
        <p className="text-xs text-slate-400 text-center">
          © 2026{' '}
          <a
            href="https://cyoda.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            CYODA Ltd.
          </a>
        </p>
      </div>

      {/* Resize Handle */}
      <ResizeHandle onMouseDown={onResizeMouseDown} isResizing={isResizing} position="right" />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center space-x-2.5 px-5 py-4 border-b border-slate-200">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50">
                <AlertTriangle size={16} className="text-red-500" />
              </div>
              <h3 className="font-semibold text-slate-900">Delete Chat</h3>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-slate-700">
                Are you sure you want to delete this chat? This action cannot be undone.
              </p>
              {chatToDelete?.name && (
                <div className="text-center py-2">
                  <p className="text-base text-slate-900 font-medium italic">"{chatToDelete.name}"</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={handleCancelDelete}
                className="px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Rename Dialog */}
      <ChatBotRenameDialog
        visible={renameDialogOpen}
        chatId={chatToRename?.id || null}
        currentName={chatToRename?.name || ''}
        onClose={handleRenameCancel}
        onSuccess={handleRenameSuccess}
      />
    </div>
  );
};

export default ChatHistoryPanel;

