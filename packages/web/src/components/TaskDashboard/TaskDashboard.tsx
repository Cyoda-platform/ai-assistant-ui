/**
 * TaskDashboard - Main task dashboard component
 * Displays and polls background tasks for a conversation
 */

import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Activity, Filter, RefreshCw } from 'lucide-react';
import TaskCard from './TaskCard';
import taskService, { type BackgroundTask } from '@/services/taskService';

interface TaskDashboardProps {
  conversationId: string;
  backgroundTaskIds?: string[];
  onRestartTask?: (userRequest: string) => void;
}

export interface TaskDashboardHandle {
  refreshTasks: () => Promise<void>;
}

const TaskDashboard = forwardRef<TaskDashboardHandle, TaskDashboardProps>(({
  conversationId,
  backgroundTaskIds = [],
  onRestartTask
}, ref) => {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const response = await taskService.listTasks({ conversation_id: conversationId });
      setTasks(response.tasks);
    } catch (err: any) {
      console.error('Error loading tasks:', err);

      // Handle different error types gracefully
      const status = err?.response?.status;
      if (status === 404) {
        setError('Chat not found or not fully initialized');
      } else if (status === 403) {
        setError('Access denied');
      } else if (err?.message === 'Network Error' || err?.code === 'ERR_NETWORK') {
        setError('Unable to connect to server');
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to load tasks');
      }
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Expose refreshTasks method via ref
  useImperativeHandle(ref, () => ({
    refreshTasks: async () => {
      console.log('[TaskDashboard] Manual refresh triggered');
      await loadTasks(true);
    }
  }), [loadTasks]);

  // Poll for updates every 20 seconds for real-time CLI output
  // This also does an initial load, so no need for a separate initial load
  useEffect(() => {
    console.log(`[TaskDashboard] Starting polling for conversation: ${conversationId}`);
    const cleanup = taskService.pollConversationTasks(
      conversationId,
      (updatedTasks) => {
        setTasks(updatedTasks);
        setIsLoading(false);
      },
      (err) => {
        console.error('Polling error:', err);
      },
      20000 // Poll every 20 seconds
    );

    return () => {
      console.log(`[TaskDashboard] Stopping polling for conversation: ${conversationId}`);
      cleanup();
    };
  }, [conversationId]);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return ['pending', 'running'].includes(task.status);
    return task.status === filterStatus;
  });

  // Count by status
  const statusCounts = {
    all: tasks.length,
    active: tasks.filter(t => ['pending', 'running'].includes(t.status)).length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <RefreshCw size={32} className="text-slate-600 mx-auto mb-3 animate-spin" />
          <p className="text-slate-400 text-sm">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center space-y-4">
          <Activity size={48} className="text-slate-600 mx-auto" />
          <div>
            <p className="text-slate-300 font-medium mb-1">No tasks found</p>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
          <button
            onClick={() => loadTasks()}
            className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 hover:border-teal-500 text-teal-300 hover:text-teal-200 rounded-lg text-sm transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <Activity size={48} className="text-teal-400/30 mx-auto mb-4" />
          <p className="text-slate-400">No background tasks</p>
          <p className="text-slate-500 text-sm mt-2">
            Tasks will appear here when you start builds or deployments
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header with filters */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        {/* Filter buttons */}
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: 'All', count: statusCounts.all },
            { key: 'active', label: 'Active', count: statusCounts.active },
            { key: 'completed', label: 'Completed', count: statusCounts.completed },
            { key: 'failed', label: 'Failed', count: statusCounts.failed },
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setFilterStatus(filter.key)}
              className={`group relative px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                filterStatus === filter.key
                  ? 'bg-teal-500/20 text-teal-200 border-teal-500/40'
                  : 'text-slate-400 hover:text-teal-300 hover:bg-slate-700/50 border-transparent'
              }`}
            >
              <span>{filter.label}</span>
              <span className={`ml-1.5 ${
                filterStatus === filter.key ? 'text-teal-300' : 'text-slate-500'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No tasks match the current filter</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskCard
              key={task.technical_id}
              task={task}
              onTaskUpdate={(updatedTask) => {
                // Update task in the list
                setTasks(prevTasks =>
                  prevTasks.map(t =>
                    t.technical_id === updatedTask.technical_id ? updatedTask : t
                  )
                );
              }}
              onRestartTask={onRestartTask}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      {tasks.length > 0 && (
        <div className="p-3 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total: {tasks.length} tasks</span>
            <span>
              {statusCounts.active > 0 && `${statusCounts.active} running`}
              {statusCounts.active > 0 && statusCounts.completed > 0 && ' • '}
              {statusCounts.completed > 0 && `${statusCounts.completed} completed`}
              {(statusCounts.active > 0 || statusCounts.completed > 0) && statusCounts.failed > 0 && ' • '}
              {statusCounts.failed > 0 && `${statusCounts.failed} failed`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

TaskDashboard.displayName = 'TaskDashboard';

export default TaskDashboard;

