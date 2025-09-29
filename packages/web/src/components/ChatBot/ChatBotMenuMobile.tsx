import React from 'react';
import { Dropdown, MenuProps } from 'antd';
import { DatabaseOutlined, CustomerServiceOutlined, MoreOutlined, HistoryOutlined } from '@ant-design/icons';
import ToggleCanvasIcon from '@/assets/images/icons/toggle-canvas.svg?react';

interface ChatBotMenuMobileProps {
  canvasVisible?: boolean;
  chatHistoryVisible?: boolean;
  onToggleCanvas: () => void;
  onEntitiesDetails: () => void;
  onToggleChatHistory: () => void;
  onSupport: () => void;
}

const ChatBotMenuMobile: React.FC<ChatBotMenuMobileProps> = ({
  canvasVisible = false,
  chatHistoryVisible = true,
  onToggleCanvas,
  onEntitiesDetails,
  onToggleChatHistory,
  onSupport
}) => {
  const toggleCanvasTitle = canvasVisible ? 'Close Canvas' : 'Open Canvas';

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'toggleChatHistory':
        onToggleChatHistory();
        break;
      case 'toggleCanvas':
        onToggleCanvas();
        break;
      case 'entitiesDetails':
        onEntitiesDetails();
        break;
      case 'support':
        onSupport();
        break;
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'toggleChatHistory',
      icon: <HistoryOutlined />,
      label: `${chatHistoryVisible ? 'Hide' : 'Show'} Chat History`,
    },
    {
      key: 'toggleCanvas',
      icon: <ToggleCanvasIcon />,
      label: toggleCanvasTitle,
    },
    {
      key: 'entitiesDetails',
      icon: <DatabaseOutlined />,
      label: 'Entities Data',
    },
    {
      key: 'support',
      icon: <CustomerServiceOutlined />,
      label: 'Join Discord',
    },
  ];

  return (
    <div className="chat-bot-mobile-menu">
      <Dropdown
        menu={{ items: menuItems, onClick: handleMenuClick }}
        placement="bottomRight"
        trigger={['click']}
      >
        <MoreOutlined className="chat-bot-mobile-menu__icon" />
      </Dropdown>
    </div>
  );
};

export default ChatBotMenuMobile;
