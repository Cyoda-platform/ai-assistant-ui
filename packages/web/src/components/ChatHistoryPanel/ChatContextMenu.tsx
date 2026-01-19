import React from 'react';
import { Dropdown, MenuProps } from 'antd';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import './ChatContextMenu.css';

interface ChatContextMenuProps {
  children: React.ReactNode;
  chatId: string;
  chatName: string;
  onRename: (chatId: string, chatName: string) => void;
  onDelete: (chatId: string, chatName: string) => void;
  disabled?: boolean;
  showMenuButton?: boolean; // Whether to show the three-dots menu button
}

const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
  children,
  chatId,
  chatName,
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

  const menuItems: MenuProps['items'] = [
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
