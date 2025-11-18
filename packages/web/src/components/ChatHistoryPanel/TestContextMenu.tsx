import React, { useState } from 'react';
import { message } from 'antd';
import ChatContextMenu from './ChatContextMenu';
import ChatBotRenameDialog from '@/components/ChatBot/ChatBotRenameDialog';
import { Clock } from 'lucide-react';

// Simple test component to verify the context menu functionality
const TestContextMenu: React.FC = () => {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<{ id: string; name: string } | null>(null);

  const handleRename = (chatId: string, chatName: string) => {
    console.log('Rename clicked:', chatId, chatName);
    setChatToRename({ id: chatId, name: chatName });
    setRenameDialogOpen(true);
  };

  const handleDelete = (chatId: string, chatName: string) => {
    console.log('Delete clicked:', chatId, chatName);
    message.info(`Delete action for: ${chatName}`);
  };

  const handleRenameSuccess = (newName: string) => {
    console.log('Rename success:', newName);
    message.success(`Chat renamed to: ${newName}`);
    setRenameDialogOpen(false);
    setChatToRename(null);
  };

  const handleRenameCancel = () => {
    setRenameDialogOpen(false);
    setChatToRename(null);
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Context Menu Test</h1>
        
        <div className="space-y-3">
          <ChatContextMenu
            chatId="test-1"
            chatName="Test Chat with Long Name That Should Truncate"
            chatDescription="This is a test chat description that shows additional details about the conversation"
            chatDate={new Date().toISOString()}
            onRename={handleRename}
            onDelete={handleDelete}
            showMenuButton={true}
          >
            <div className="block cursor-pointer px-3 py-2.5 rounded-lg transition-all duration-200 text-sm border border-transparent hover:border-slate-600/30 hover:bg-slate-700/40 chat-item-hover relative">
              <div className="flex items-start space-x-2.5">
                <Clock
                  size={16}
                  className="mt-0.5 flex-shrink-0 text-slate-500"
                />
                <div className="flex-1 min-w-0 pr-10">
                  <div className="truncate font-medium text-slate-400">
                    Test Chat with Long Name That Should Truncate
                  </div>
                  <div className="text-xs mt-0.5 text-slate-500">
                    Just now
                  </div>
                </div>
              </div>
            </div>
          </ChatContextMenu>

          <ChatContextMenu
            chatId="test-2"
            chatName="Another Test Chat"
            chatDescription="Short description"
            chatDate={new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()}
            onRename={handleRename}
            onDelete={handleDelete}
            showMenuButton={true}
          >
            <div className="block cursor-pointer px-3 py-2.5 rounded-lg transition-all duration-200 text-sm border border-transparent hover:border-slate-600/30 hover:bg-slate-700/40 chat-item-hover relative">
              <div className="flex items-start space-x-2.5">
                <Clock
                  size={16}
                  className="mt-0.5 flex-shrink-0 text-slate-500"
                />
                <div className="flex-1 min-w-0 pr-10">
                  <div className="truncate font-medium text-slate-400">
                    Another Test Chat
                  </div>
                  <div className="text-xs mt-0.5 text-slate-500">
                    2 hours ago
                  </div>
                </div>
              </div>
            </div>
          </ChatContextMenu>
        </div>

        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Instructions:</h3>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• <strong>Hover</strong> over any part of the chat items to see the menu button (⋮)</li>
            <li>• <strong>Click the menu button</strong> to open context menu</li>
            <li>• <strong>Right-click</strong> anywhere on chat item also works</li>
            <li>• Check browser console for click events</li>
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

export default TestContextMenu;
