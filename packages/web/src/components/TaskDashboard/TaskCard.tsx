/**
 * TaskCard - Individual task display component
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Code,
  ExternalLink,
  FileText,
  Plus,
  Minus,
  Edit,
  Server,
  Link as LinkIcon,
  Copy,
  StopCircle,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { message } from 'antd';
import type { BackgroundTask } from '@/services/taskService';
import taskService from '@/services/taskService';
import CLIOutputViewer from './CLIOutputViewer';

interface TaskCardProps {
  task: BackgroundTask;
  onTaskUpdate?: (task: BackgroundTask) => void;
  onRestartTask?: (userRequest: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdate, onRestartTask }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const toggleMessageExpanded = (idx: number) => {
    const newSet = new Set(expandedMessages);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setExpandedMessages(newSet);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCancelTask = async () => {
    setShowCancelModal(false);
    setIsCancelling(true);

    try {
      const response = await taskService.cancelTask(task.technical_id);

      // Notify parent of update if callback provided
      if (onTaskUpdate && response.task) {
        onTaskUpdate(response.task);
      }

      // Show success feedback
      message.success('Task cancelled successfully');
    } catch (error: any) {
      console.error('Failed to cancel task:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to cancel task';
      message.error(`Error: ${errorMsg}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRestartTask = () => {
    if (!onRestartTask) {
      message.error('Restart functionality not available');
      return;
    }

    if (!task.user_request) {
      message.error('Cannot restart: original request not found');
      return;
    }

    onRestartTask(task.user_request);
    message.success('Restarting task with original request...');
  };

  // Check if task can be cancelled
  const canCancel = task.status === 'running' || task.status === 'pending';

  // Check if task can be restarted (failed, cancelled, or completed)
  const canRestart = ['failed', 'cancelled', 'completed'].includes(task.status) && task.user_request;

  // Status icon and color
  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 size={20} className="text-green-400" />;
      case 'failed':
        return <XCircle size={20} className="text-red-400" />;
      case 'running':
        return <Loader2 size={20} className="text-teal-400 animate-spin" />;
      case 'pending':
        return <Clock size={20} className="text-amber-400" />;
      case 'cancelled':
        return <XCircle size={20} className="text-slate-400" />;
      default:
        return <Clock size={20} className="text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return 'border-green-500/30 bg-green-500/5';
      case 'failed':
        return 'border-red-500/30 bg-red-500/5';
      case 'running':
        return 'border-teal-500/30 bg-teal-500/5';
      case 'pending':
        return 'border-amber-500/30 bg-amber-500/5';
      case 'cancelled':
        return 'border-slate-500/30 bg-slate-500/5';
      default:
        return 'border-slate-600/30 bg-slate-700/5';
    }
  };

  const getProgressBarColor = () => {
    switch (task.status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'running':
        return 'bg-teal-500';
      case 'pending':
        return 'bg-amber-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3 min-w-0">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="mt-0.5 flex-shrink-0">{getStatusIcon()}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium text-sm truncate">{task.name}</h4>
            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{task.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
          {/* Restart button - only show for failed/cancelled/completed tasks */}
          {canRestart && (
            <button
              onClick={handleRestartTask}
              className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 p-1.5 rounded transition-colors"
              title="Restart task with same request"
            >
              <RotateCcw size={16} />
            </button>
          )}
          {/* Cancel button - only show for running/pending tasks */}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={isCancelling}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancel task"
            >
              {isCancelling ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <StopCircle size={16} />
              )}
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-teal-300 transition-colors"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>{task.progress}%</span>
          <span>{task.statistics.status_message}</span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressBarColor()} ${
              task.status === 'running' ? 'animate-pulse' : ''
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        {task.language && (
          <div className="flex items-center space-x-1">
            <Code size={12} />
            <span className="capitalize">{task.language}</span>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-600/30 space-y-3 min-w-0">
          {/* Branch Info */}
          {task.branch_name && (
            <div className="flex items-center space-x-2 text-xs min-w-0">
              <GitBranch size={14} className="text-teal-400/70 flex-shrink-0" />
              <span className="text-slate-300 truncate">{task.branch_name}</span>
              {task.repository_url && task.repository_url.startsWith('http') && (
                <a
                  href={task.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 flex items-center space-x-1"
                  title="Open on GitHub"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}

          {/* Build Job ID */}
          {task.build_job_id && (
            <div className="text-xs">
              <span className="text-slate-400">Job ID: </span>
              <span className="text-slate-300 font-mono">{task.build_job_id}</span>
            </div>
          )}

          {/* Process PID */}
          {task.process_pid && (
            <div className="text-xs">
              <span className="text-slate-400">PID: </span>
              <span className="text-slate-300 font-mono">{task.process_pid}</span>
            </div>
          )}

          {/* Deployment Information */}
          {(task.build_id || task.namespace || task.env_url) && (
            <div className="bg-slate-700/30 border border-slate-600/30 rounded p-3 space-y-2">
              <p className="text-slate-400 text-xs font-medium flex items-center space-x-1">
                <Server size={12} />
                <span>Deployment Info</span>
              </p>

              {task.build_id && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-500 text-xs">Build ID:</span>
                    <div className="text-slate-300 font-mono text-xs truncate">{task.build_id}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(task.build_id!, 'build_id')}
                    className="text-slate-400 hover:text-teal-300 transition-colors flex-shrink-0"
                    title="Copy Build ID"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              )}

              {task.namespace && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-500 text-xs">Namespace:</span>
                    <div className="text-slate-300 font-mono text-xs truncate">{task.namespace}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(task.namespace!, 'namespace')}
                    className="text-slate-400 hover:text-teal-300 transition-colors flex-shrink-0"
                    title="Copy Namespace"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              )}

              {task.env_url && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-500 text-xs">Environment URL:</span>
                    <a
                      href={task.env_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-400 hover:text-teal-300 font-mono text-xs truncate flex items-center space-x-1"
                      title="Open environment"
                    >
                      <LinkIcon size={12} />
                      <span className="truncate">{task.env_url}</span>
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(task.env_url!, 'env_url')}
                    className="text-slate-400 hover:text-teal-300 transition-colors flex-shrink-0"
                    title="Copy URL"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {task.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
              <p className="text-red-400 text-xs font-medium mb-1">Error:</p>
              <p className="text-red-300 text-xs font-mono">{task.error}</p>
            </div>
          )}

          {/* CLI Output */}
          {task.metadata?.output && (
            <div className="space-y-2">
              <p className="text-slate-400 text-xs font-medium">CLI Output:</p>
              <CLIOutputViewer
                output={task.metadata.output}
                isRunning={task.status === 'running'}
                taskId={task.technical_id}
              />
            </div>
          )}

          {/* Progress Messages */}
          {task.progress_messages.length > 0 && (
            <div className="space-y-2">
              <p className="text-slate-400 text-xs font-medium">Progress Log:</p>
              <div className="bg-slate-800/50 rounded p-2 max-h-96 overflow-y-auto space-y-2">
                {task.progress_messages.slice().reverse().map((msg, idx) => {
                  const reversedIdx = task.progress_messages.length - 1 - idx;
                  const isExpanded = expandedMessages.has(reversedIdx);
                  const hasDiff = msg.metadata?.diff && (msg.metadata.diff.added?.length > 0 || msg.metadata.diff.modified?.length > 0 || msg.metadata.diff.deleted?.length > 0);

                  return (
                    <div key={idx} className="text-xs border-b border-slate-700/30 pb-2 last:border-b-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-slate-500">{msg.timestamp}</span>
                          <span className="text-slate-300 ml-2">{msg.message}</span>
                        </div>
                        {hasDiff && (
                          <button
                            onClick={() => toggleMessageExpanded(reversedIdx)}
                            className="text-slate-400 hover:text-teal-300 transition-colors flex-shrink-0 mt-0.5"
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        )}
                      </div>

                      {/* Show per-message diff summary */}
                      {msg.metadata?.diff && (
                        <div className="mt-1 ml-2 text-slate-400 space-y-0.5">
                          {msg.metadata.diff?.added && msg.metadata.diff.added.length > 0 && (
                            <div><span className="text-green-400">+ {msg.metadata.diff.added.length} added</span></div>
                          )}
                          {msg.metadata.diff?.modified && msg.metadata.diff.modified.length > 0 && (
                            <div><span className="text-blue-400">~ {msg.metadata.diff.modified.length} modified</span></div>
                          )}
                          {msg.metadata.diff?.deleted && msg.metadata.diff.deleted.length > 0 && (
                            <div><span className="text-red-400">- {msg.metadata.diff.deleted.length} deleted</span></div>
                          )}
                        </div>
                      )}

                      {/* Expanded file list */}
                      {isExpanded && hasDiff && (
                        <div className="mt-2 ml-2 bg-slate-900/50 rounded p-2 space-y-1 max-h-48 overflow-y-auto overflow-x-auto">
                          {msg.metadata.diff?.added && msg.metadata.diff.added.length > 0 && (
                            <div>
                              <p className="text-green-400 text-xs font-medium mb-1">Added:</p>
                              <div className="space-y-0.5 ml-2">
                                {msg.metadata.diff.added.map((file: string, fileIdx: number) => (
                                  <div key={fileIdx} className="text-slate-300 font-mono text-xs whitespace-nowrap">+ {file}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {msg.metadata.diff?.modified && msg.metadata.diff.modified.length > 0 && (
                            <div>
                              <p className="text-blue-400 text-xs font-medium mb-1">Modified:</p>
                              <div className="space-y-0.5 ml-2">
                                {msg.metadata.diff.modified.map((file: string, fileIdx: number) => (
                                  <div key={fileIdx} className="text-slate-300 font-mono text-xs whitespace-nowrap">~ {file}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {msg.metadata.diff?.deleted && msg.metadata.diff.deleted.length > 0 && (
                            <div>
                              <p className="text-red-400 text-xs font-medium mb-1">Deleted:</p>
                              <div className="space-y-0.5 ml-2">
                                {msg.metadata.diff.deleted.map((file: string, fileIdx: number) => (
                                  <div key={fileIdx} className="text-slate-300 font-mono text-xs whitespace-nowrap">- {file}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Result */}
          {task.result && (
            <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
              <p className="text-green-400 text-xs font-medium mb-1">Result:</p>
              <pre className="text-green-300 text-xs font-mono overflow-x-auto">
                {typeof task.result === 'string' ? task.result : JSON.stringify(task.result, null, 2)}
              </pre>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-slate-500 space-y-1">
            <div>Created: {new Date(task.date).toLocaleString()}</div>
            {task.started_at && <div>Started: {new Date(task.started_at).toLocaleString()}</div>}
            {task.completed_at && <div>Completed: {new Date(task.completed_at).toLocaleString()}</div>}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center space-x-3 p-6 border-b border-slate-700">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Cancel Task</h3>
                <p className="text-sm text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            {/* Body */}
            <div className="p-6">
              <p className="text-slate-300 mb-2">
                Are you sure you want to cancel this task?
              </p>
              <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Task name:</p>
                <p className="text-white font-medium truncate">{task.name}</p>
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-700 bg-slate-900/30">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Running
              </button>
              <button
                onClick={handleCancelTask}
                disabled={isCancelling}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Cancel Task</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;

