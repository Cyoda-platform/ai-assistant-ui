import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, History, Clock, ChevronRight, ChevronDown, X, AlertTriangle } from 'lucide-react';
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
  onLoadMore
}) => {
  const navigate = useNavigate();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<{ id: string; name: string } | null>(null);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, chatId: string, chatName?: string) => {
    e.preventDefault();
    e.stopPropagation();
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
              ? 'text-white hover:text-teal-400 bg-slate-700/60 border border-slate-600/50 shadow-sm'
              : 'text-slate-300 hover:text-teal-400 hover:bg-slate-700/40 border border-transparent'
          }`}
        >
          <Home size={19} className="group-hover:scale-110 transition-transform flex-shrink-0" />
          <span className="font-semibold text-sm">New Chat</span>
        </a>

        {/* Current Chat / History Header */}
        <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
          <div
            onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
            className={`flex items-center space-x-3 cursor-pointer px-3 py-2.5 rounded-lg group transition-all duration-200 ${
              !showHomeAsActive
                ? 'text-white hover:text-teal-400 bg-slate-700/60 border border-slate-600/50 shadow-sm'
                : 'text-slate-300 hover:text-teal-400 hover:bg-slate-700/40 border border-transparent'
            }`}
          >
            <History size={19} className="group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="font-semibold text-sm">{!showHomeAsActive ? 'Current Chat' : 'History'}</span>
            {showHomeAsActive && (
              <ChevronRight
                size={16}
                style={{
                  marginLeft: 'auto',
                  transform: isHistoryCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                  transition: 'transform 200ms ease-in-out'
                }}
                className="group-hover:translate-x-1"
              />
            )}
            {!showHomeAsActive && (
              <ChevronRight
                size={16}
                style={{
                  marginLeft: 'auto',
                  transform: isHistoryCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                  transition: 'transform 200ms ease-in-out'
                }}
              />
            )}
          </div>

          {/* Chat History List */}
          {!isHistoryCollapsed && (
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
                      <ChatContextMenu
                        key={chat.technical_id}
                        chatId={chat.technical_id}
                        chatName={chat.name || chat.description || 'Untitled Chat'}
                        chatDescription={chat.description}
                        chatDate={chat.last_modified || chat.date}
                        onRename={handleRenameClick}
                        onDelete={(chatId, chatName) => handleDeleteClick({} as React.MouseEvent, chatId, chatName)}
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
                          className={`group block cursor-pointer px-3 py-2.5 rounded-lg transition-all duration-200 text-sm no-underline relative chat-item-hover ${
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
                          <div className="flex-1 min-w-0 pr-10">
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
                      </ChatContextMenu>
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

            {/* Load More Button */}
            {hasMoreChats && !isLoading && (
              <div className="px-2 pb-4">
                <button
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 text-slate-300 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoadingMore ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="text-sm">Loading...</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium">Load More Chats</span>
                  )}
                </button>
              </div>
            )}
            </div>
          )}
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

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center space-x-3 p-6 border-b border-slate-700">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Chat</h3>
                <p className="text-sm text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-slate-300 mb-2">
                Are you sure you want to delete this chat?
              </p>
              {chatToDelete?.name && (
                <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-400 mb-1">Chat name:</p>
                  <p className="text-white font-medium truncate">{chatToDelete.name}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-700 bg-slate-900/30">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25"
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>
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

