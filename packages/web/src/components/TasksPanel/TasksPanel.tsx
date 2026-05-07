import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { X } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import TaskDashboard, { TaskDashboardHandle } from '@/components/TaskDashboard/TaskDashboard';

interface TasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  chatData?: any;
  width?: number;
  onWidthChange?: (width: number) => void;
  onRestartTask?: (userRequest: string) => void;
}

export interface TasksPanelHandle {
  refreshTasks: () => Promise<void>;
}

const TasksPanel = forwardRef<TasksPanelHandle, TasksPanelProps>(({
  isOpen,
  onClose,
  conversationId,
  chatData,
  width: externalWidth,
  onWidthChange,
  onRestartTask
}, ref) => {
  const taskDashboardRef = useRef<TaskDashboardHandle>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Expose refreshTasks method via ref
  useImperativeHandle(ref, () => ({
    refreshTasks: async () => {
      console.log('[TasksPanel] Refresh triggered from parent');
      await taskDashboardRef.current?.refreshTasks();
    }
  }), []);

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await taskDashboardRef.current?.refreshTasks();
      // Keep the animation for a bit to show it's working
      setTimeout(() => setIsRefreshing(false), 500);
    } catch (err) {
      console.error('[TasksPanel] Failed to refresh tasks:', err);
      setIsRefreshing(false);
    }
  };

  // Use external width if provided (parent manages resizing)
  const panelWidth = externalWidth ?? 500;

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`bg-white border-l border-slate-200 flex flex-col relative resizable-panel h-full`}
      style={{ width: `${panelWidth}px` }}
    >

      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-semibold text-slate-900 !mb-0 leading-none">
              Background Tasks
            </h3>
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
              Live
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh tasks"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Tasks Panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Task Dashboard */}
      {conversationId && isOpen ? (
        <TaskDashboard
          ref={taskDashboardRef}
          conversationId={conversationId}
          backgroundTaskIds={chatData?.chat_body?.background_task_ids}
          onRestartTask={onRestartTask}
        />
      ) : isOpen ? (
        <div className="flex-1 flex items-center justify-center h-full w-full">
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 rounded-full border-2 border-teal-200 border-t-teal-500 animate-spin" />
            </div>
            <p className="text-slate-500">No conversation ID available</p>
          </div>
        </div>
      ) : null}
    </div>
  );
});

TasksPanel.displayName = 'TasksPanel';

export default TasksPanel;

