import React from 'react';
import { Tooltip } from 'antd';
import { Database, MessageCircle, History } from 'lucide-react';
import ToggleCanvasIcon from '@/assets/images/icons/toggle-canvas.svg?react';

interface ChatBotMenuDesktopProps {
  isLoadingDelete?: boolean;
  canvasVisible?: boolean;
  chatHistoryVisible?: boolean;
  onToggleCanvas: () => void;
  onEntitiesDetails: () => void;
  onToggleChatHistory: () => void;
  onSupport: () => void;
}

const ChatBotMenuDesktop: React.FC<ChatBotMenuDesktopProps> = ({
  isLoadingDelete = false,
  canvasVisible = false,
  chatHistoryVisible = true,
  onToggleCanvas,
  onEntitiesDetails,
  onToggleChatHistory,
  onSupport
}) => {
  const toggleCanvasTitle = canvasVisible ? 'Close Canvas' : 'Open Canvas';

  return (
    <div className="flex items-center space-x-3">
      {/* Chat History Toggle */}
      <Tooltip
        title={`${chatHistoryVisible ? 'Hide' : 'Show'} Chat History (Ctrl+H)`}
        placement="top"
        mouseEnterDelay={1000}
      >
        <button
          onClick={onToggleChatHistory}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 min-h-[36px] box-border ${
            chatHistoryVisible
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25 border border-orange-500'
              : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600'
          }`}
        >
          <History size={16} />
          <span className="hidden sm:inline">History</span>
        </button>
      </Tooltip>

      {/* Canvas Toggle */}
      <Tooltip
        title={`${toggleCanvasTitle} (Ctrl+B)`}
        placement="top"
        mouseEnterDelay={1000}
      >
        <button
          onClick={onToggleCanvas}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 min-h-[36px] box-border ${
            canvasVisible
              ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25 border border-teal-500'
              : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600'
          }`}
        >
          <ToggleCanvasIcon width={16} height={16} />
          <span className="hidden sm:inline">Canvas</span>
        </button>
      </Tooltip>

      {/* Entities Data */}
      <Tooltip
        title="Entities Data (Ctrl+D)"
        placement="top"
        mouseEnterDelay={1000}
      >
        <button
          onClick={onEntitiesDetails}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-slate-700/80 text-slate-300 hover:bg-blue-600 hover:text-white border border-slate-600 min-h-[36px] box-border"
        >
          <Database size={16} />
          <span className="hidden sm:inline">Entities</span>
        </button>
      </Tooltip>

      {/* Discord Support */}
      <Tooltip
        title="Join Discord Community"
        placement="top"
        mouseEnterDelay={1000}
      >
        <button
          onClick={onSupport}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-slate-700/80 text-slate-300 hover:bg-indigo-600 hover:text-white border border-slate-600 min-h-[36px] box-border"
        >
          <MessageCircle size={16} />
          <span className="hidden sm:inline">Discord</span>
        </button>
      </Tooltip>
    </div>
  );
};

export default ChatBotMenuDesktop;
