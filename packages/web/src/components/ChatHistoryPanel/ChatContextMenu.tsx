import React from 'react';
import { Dropdown, MenuProps } from 'antd';
import { Edit, Trash2, Info, Calendar, MessageSquare, MoreVertical } from 'lucide-react';
import { formatRelativeTime } from '@/utils/dateUtils';
import './ChatContextMenu.css';

interface ChatContextMenuProps {
  children: React.ReactNode;
  chatId: string;
  chatName: string;
  chatDescription?: string;
  chatDate?: string;
  onRename: (chatId: string, chatName: string) => void;
  onDelete: (chatId: string, chatName: string) => void;
  disabled?: boolean;
  showMenuButton?: boolean; // Whether to show the three-dots menu button
}

const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
  children,
  chatId,
  chatName,
  chatDescription,
  chatDate,
  onRename,
  onDelete,
  disabled = false,
  showMenuButton = true
}) => {
  const handleMenuClick = (e: React.MouseEvent, action: 'rename' | 'delete') => {
    e.preventDefault();
    e.stopPropagation();

    if (action === 'rename') {
      onRename(chatId, chatName);
    } else if (action === 'delete') {
      onDelete(chatId, chatName);
    }
  };

  // Create chat details header
  const chatDetailsHeader = {
    key: 'chat-details',
    type: 'group' as const,
    label: (
      <div className="px-2 py-3 border-b border-slate-600/50">
        <div className="flex items-start space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/20 to-blue-500/20 border border-teal-500/30">
            <MessageSquare size={16} className="text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-200 truncate text-sm" title={chatName}>
              {chatName || 'Untitled Chat'}
            </div>
            {chatDescription && chatDescription !== chatName && (
              <div className="text-xs text-slate-400 mt-1 line-clamp-2" title={chatDescription}>
                {chatDescription}
              </div>
            )}
            {chatDate && (
              <div className="flex items-center space-x-1 mt-2 text-xs text-slate-500">
                <Calendar size={12} />
                <span>{formatRelativeTime(chatDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    children: []
  };

  const menuItems: MenuProps['items'] = [
    chatDetailsHeader,
    {
      key: 'rename',
      label: (
        <div className="flex items-center space-x-2 py-1">
          <Edit size={14} />
          <span>Rename Chat</span>
        </div>
      ),
      onClick: (e) => handleMenuClick(e.domEvent, 'rename'),
      className: 'hover:bg-slate-700/50'
    },
    {
      key: 'delete',
      label: (
        <div className="flex items-center space-x-2 py-1">
          <Trash2 size={14} />
          <span>Delete Chat</span>
        </div>
      ),
      onClick: (e) => handleMenuClick(e.domEvent, 'delete'),
      danger: true,
      className: 'hover:bg-red-500/10'
    },
  ];

  if (disabled) {
    return <>{children}</>;
  }

  // Create menu button component
  const MenuButton = () => (
    <Dropdown
      menu={{
        items: menuItems,
        className: 'chat-context-menu'
      }}
      trigger={['click']}
      placement="bottomLeft"
      overlayClassName="chat-context-menu-overlay"
      overlayStyle={{
        minWidth: '280px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgb(71 85 105 / 0.5)',
        borderRadius: '12px',
        backgroundColor: 'rgb(30 41 59 / 0.95)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <button
        className="menu-button absolute top-2 right-2 p-1.5 rounded-md bg-slate-700/80 hover:bg-slate-600/80 transition-all duration-200 shadow-lg backdrop-blur-sm border border-slate-600/50 hover:border-slate-500/50"
        title="Chat options"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <MoreVertical size={14} className="text-slate-300 hover:text-white" />
      </button>
    </Dropdown>
  );

  return (
    <div className="relative group">
      {children}
      {showMenuButton && <MenuButton />}
    </div>
  );
};

export default ChatContextMenu;
