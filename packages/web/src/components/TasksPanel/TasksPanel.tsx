import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { X } from 'lucide-react';
import TaskDashboard, { TaskDashboardHandle } from '@/components/TaskDashboard/TaskDashboard';

interface TasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  chatData?: any;
  width?: number;
  onWidthChange?: (width: number) => void;
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
  onWidthChange
}, ref) => {
  const taskDashboardRef = useRef<TaskDashboardHandle>(null);

  // Expose refreshTasks method via ref
  useImperativeHandle(ref, () => ({
    refreshTasks: async () => {
      console.log('[TasksPanel] Refresh triggered from parent');
      await taskDashboardRef.current?.refreshTasks();
    }
  }), []);

  // Use external width if provided (parent manages resizing)
  const panelWidth = externalWidth ?? 500;

  if (!isOpen) return null;

  return (
    <div
      className={`bg-slate-800/95 backdrop-blur-sm border-l border-slate-600 flex flex-col relative resizable-panel h-full`}
      style={{ width: `${panelWidth}px` }}
    >

      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-semibold text-white !mb-0 leading-none">
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
          ref={taskDashboardRef}
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
});

TasksPanel.displayName = 'TasksPanel';

export default TasksPanel;

