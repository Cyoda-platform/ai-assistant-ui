import React from 'react';
import { X } from 'lucide-react';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import TaskDashboard from '@/components/TaskDashboard/TaskDashboard';

interface TasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  chatData?: any;
  width?: number;
  onWidthChange?: (width: number) => void;
}

const TasksPanel: React.FC<TasksPanelProps> = ({
  isOpen,
  onClose,
  conversationId,
  chatData,
  width: externalWidth,
  onWidthChange
}) => {
  const [isExternalResizing, setIsExternalResizing] = React.useState(false);

  // Use external width if provided, otherwise use internal resize hook
  const internalResize = useResizablePanel({
    defaultWidth: 500,
    minWidth: 350,
    maxWidth: 800,
    storageKey: 'tasksPanel-width'
  });

  const panelWidth = externalWidth ?? internalResize.width;
  const isResizing = onWidthChange ? isExternalResizing : internalResize.isResizing;

  // Custom resize handler for external width control
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (onWidthChange) {
      e.preventDefault();
      setIsExternalResizing(true);
      const startX = e.clientX;
      const startWidth = panelWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = startX - moveEvent.clientX;
        const newWidth = Math.max(350, Math.min(800, startWidth + deltaX));
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
      internalResize.handleMouseDown(e);
    }
  }, [onWidthChange, panelWidth, internalResize.handleMouseDown]);

  if (!isOpen) return null;

  return (
    <div
      className={`bg-slate-800/95 backdrop-blur-sm border-l border-slate-600 flex flex-col relative resizable-panel h-full ${isResizing ? 'resizing' : ''}`}
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
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-semibold text-white">
              Background Tasks
            </h3>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded-full font-medium">
              Live
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-700 transition-colors"
            title="Close Tasks Panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content Area - Task Dashboard */}
      {conversationId ? (
        <TaskDashboard
          conversationId={conversationId}
          backgroundTaskIds={chatData?.chat_body?.background_task_ids}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center h-full w-full">
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            </div>
            <p className="text-slate-400">No conversation ID available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPanel;

