import React, { useState } from 'react';
import { X, Activity } from 'lucide-react';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import TaskDashboard from '@/components/TaskDashboard/TaskDashboard';

interface EntityDataPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chatData?: any;
  width?: number;
  onWidthChange?: (width: number) => void;
  conversationId?: string; // For task dashboard
}

const EntityDataPanel: React.FC<EntityDataPanelProps> = ({
  isOpen,
  onClose,
  chatData,
  width: externalWidth,
  onWidthChange,
  conversationId
}) => {
  const [isExternalResizing, setIsExternalResizing] = useState(false);

  // Use external width if provided, otherwise use internal resize hook
  const internalResize = useResizablePanel({
    defaultWidth: 480, // 384 * 1.25 = 480px (25% increase)
    minWidth: 320,     // Minimum width for usability
    maxWidth: 750,     // Maximum width to not overwhelm the layout (also increased by 25%)
    storageKey: 'entityDataPanel-width'
  });

  const panelWidth = externalWidth ?? internalResize.width;
  const isResizing = onWidthChange ? isExternalResizing : internalResize.isResizing;

  // Custom resize handler for external width control
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (onWidthChange) {
      // Use external width control - implement custom resize logic
      e.preventDefault();
      setIsExternalResizing(true);
      const startX = e.clientX;
      const startWidth = panelWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = startX - moveEvent.clientX; // Reverse for left border
        const newWidth = Math.max(320, Math.min(600, startWidth + deltaX));
        onWidthChange(newWidth);
      };

      const handleMouseUp = () => {
        setIsExternalResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.classList.remove('resizing-active');
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.classList.add('resizing-active');
    } else {
      // Use internal resize hook
      internalResize.handleMouseDown(e);
    }
  }, [onWidthChange, panelWidth, internalResize.handleMouseDown]);

  if (!isOpen) return null;

  return (
    <div
      className={`bg-slate-800/95 backdrop-blur-sm border-l border-slate-600 flex flex-col relative resizable-panel ${isResizing ? 'resizing' : ''}`}
      style={{ width: `${panelWidth}px` }}
    >
      {/* Resize Handle */}
      <ResizeHandle
        onMouseDown={handleMouseDown}
        isResizing={isResizing}
        position="left"
      />
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <Activity size={18} className="text-teal-400" />
            <h3 className="font-semibold text-white translate-y-[20%]">
              Background Tasks
            </h3>
            <span className="bg-teal-500/20 text-teal-300 text-xs px-2 py-1 rounded-full font-medium">
              Live
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-slate-700 transition-colors"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Always show Task Dashboard */}
      {conversationId ? (
        <TaskDashboard
          conversationId={conversationId}
          backgroundTaskIds={chatData?.chat_body?.background_task_ids}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Activity size={48} className="text-teal-400/30 mx-auto mb-4" />
            <p className="text-slate-400">No conversation ID available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityDataPanel;
