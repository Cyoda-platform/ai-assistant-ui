import React from 'react';
import { Button, Tooltip } from 'antd';
import { DatabaseOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import ToggleCanvasIcon from '@/assets/images/icons/toggle-canvas.svg?react';

interface ChatBotMenuDesktopProps {
  isLoadingDelete?: boolean;
  canvasVisible?: boolean;
  onToggleCanvas: () => void;
  onEntitiesDetails: () => void;
  onSupport: () => void;
}

const ChatBotMenuDesktop: React.FC<ChatBotMenuDesktopProps> = ({
  isLoadingDelete = false,
  canvasVisible = false,
  onToggleCanvas,
  onEntitiesDetails,
  onSupport
}) => {
  const toggleCanvasTitle = canvasVisible ? 'Close Canvas' : 'Open Canvas';

  return (
    <div className="chat-bot-desktop-menu">
      <Tooltip
        title={toggleCanvasTitle}
        placement="top"
        mouseEnterDelay={1}
      >
        <Button
          onClick={onToggleCanvas}
          className={`btn btn-default btn-icon btn-icon--text btn-toggle-canvas ${
            canvasVisible ? 'btn--active' : ''
          }`}
          icon={<ToggleCanvasIcon />}
        >
          <span>{toggleCanvasTitle}</span>
        </Button>
      </Tooltip>

      <Tooltip
        title="Entities Data"
        placement="top"
        mouseEnterDelay={1}
      >
        <Button
          onClick={onEntitiesDetails}
          className="btn btn-default btn-icon btn-icon--text"
          icon={<DatabaseOutlined />}
        >
          <span>Entities</span>
        </Button>
      </Tooltip>

      <Tooltip
        title="Contact Support"
        placement="top"
        mouseEnterDelay={1}
      >
        <Button
          onClick={onSupport}
          className="btn btn-default btn-icon btn-icon--text"
          icon={<CustomerServiceOutlined />}
        >
          <span>Support</span>
        </Button>
      </Tooltip>
    </div>
  );
};

export default ChatBotMenuDesktop;
