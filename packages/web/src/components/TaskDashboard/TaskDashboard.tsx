/**
 * TaskDashboard - Main task dashboard component
 * Displays and polls background tasks for a conversation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Filter } from 'lucide-react';
import TaskCard from './TaskCard';
import taskService, { type BackgroundTask } from '@/services/taskService';

interface TaskDashboardProps {
  conversationId: string;
  backgroundTaskIds?: string[];
}

const TaskDashboard: React.FC<TaskDashboardProps> = ({
  conversationId,
  backgroundTaskIds = []
}) => {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load tasks
  const loadTasks = useCallback(async (showRefreshAnimation = false) => {
    try {
      if (showRefreshAnimation) {
        setIsRefreshing(true);
      }
      setError(null);
      const response = await taskService.listTasks({ conversation_id: conversationId });
      setTasks(response.tasks);

      // Keep the animation for a bit to show it's working
      if (showRefreshAnimation) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
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

      setIsRefreshing(false);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    const cleanup = taskService.pollConversationTasks(
      conversationId,
      (updatedTasks) => {
        setTasks(updatedTasks);
        setIsLoading(false);
      },
      (err) => {
        console.error('Polling error:', err);
      },
      30000 // Poll every 30 seconds
    );

    return cleanup;
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
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw size={32} className="text-slate-600 mx-auto mb-3 animate-spin" />
          <p className="text-slate-400 text-sm">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
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
      <div className="flex items-center justify-center p-8">
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
    <div className="flex flex-col h-full">
      {/* Header with filters */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
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

          {/* Refresh button */}
          <button
            onClick={() => loadTasks(true)}
            disabled={isRefreshing}
            className="p-1.5 rounded-md text-slate-400 hover:text-teal-300 hover:bg-slate-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh tasks"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No tasks match the current filter</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskCard key={task.technical_id} task={task} />
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
};

export default TaskDashboard;

