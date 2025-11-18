import React, { useState } from 'react';
import { message } from 'antd';
import ChatContextMenu from './ChatContextMenu';
import ChatBotRenameDialog from '@/components/ChatBot/ChatBotRenameDialog';

// Demo component to showcase the enhanced context menu
const ChatContextMenuDemo: React.FC = () => {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<{ id: string; name: string } | null>(null);

  // Sample chat data for demonstration
  const sampleChats = [
    {
      id: '1',
      name: 'React Component Architecture',
      description: 'Discussion about best practices for organizing React components in large applications',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      id: '2',
      name: 'Database Optimization',
      description: 'Query performance tuning and indexing strategies for PostgreSQL',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      id: '3',
      name: 'API Design Patterns',
      description: 'RESTful API design principles and GraphQL implementation considerations',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    },
  ];

  const handleRename = (chatId: string, chatName: string) => {
    setChatToRename({ id: chatId, name: chatName });
    setRenameDialogOpen(true);
  };

  const handleDelete = (chatId: string, chatName: string) => {
    message.info(`Delete action triggered for: ${chatName}`);
    console.log('Delete chat:', chatId);
  };

  const handleRenameSuccess = (newName: string) => {
    message.success(`Chat renamed to: ${newName}`);
    setRenameDialogOpen(false);
    setChatToRename(null);
  };

  const handleRenameCancel = () => {
    setRenameDialogOpen(false);
    setChatToRename(null);
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-white mb-6">
          Enhanced Chat Context Menu Demo
        </h2>
        
        <div className="space-y-3">
          {sampleChats.map((chat) => (
            <ChatContextMenu
              key={chat.id}
              chatId={chat.id}
              chatName={chat.name}
              chatDescription={chat.description}
              chatDate={chat.date}
              onRename={handleRename}
              onDelete={handleDelete}
            >
              <div className="group block cursor-pointer px-3 py-2.5 rounded-lg transition-all duration-200 text-sm border border-transparent hover:border-slate-600/30 hover:bg-slate-700/40 chat-item-hover">
                <div className="flex items-start space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-teal-400 mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-slate-300 group-hover:text-slate-200" title={chat.name}>
                      {chat.name}
                    </div>
                    <div className="text-xs mt-0.5 text-slate-500 line-clamp-2" title={chat.description}>
                      {chat.description}
                    </div>
                  </div>
                </div>
              </div>
            </ChatContextMenu>
          ))}
        </div>

        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-2">How to use:</h3>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• <strong>Hover</strong> over any chat item to see the menu button (⋮)</li>
            <li>• <strong>Click the menu button</strong> or <strong>right-click</strong> on any chat item</li>
            <li>• View chat details in the context menu header</li>
            <li>• Select "Rename Chat" to change the name</li>
            <li>• Select "Delete Chat" to remove the chat</li>
          </ul>
        </div>
      </div>

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

export default ChatContextMenuDemo;
