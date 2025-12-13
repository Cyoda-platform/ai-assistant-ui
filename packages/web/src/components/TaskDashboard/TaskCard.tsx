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
  Edit
} from 'lucide-react';
import type { BackgroundTask } from '@/services/taskService';
import CLIOutputViewer from './CLIOutputViewer';

interface TaskCardProps {
  task: BackgroundTask;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

  const toggleMessageExpanded = (idx: number) => {
    const newSet = new Set(expandedMessages);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setExpandedMessages(newSet);
  };

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
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-teal-300 transition-colors ml-2 flex-shrink-0"
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
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
        <div className="flex items-center space-x-4">
          <span>Duration: {task.statistics.duration_formatted}</span>
          {task.statistics.time_remaining_formatted && (
            <span>Remaining: {task.statistics.time_remaining_formatted}</span>
          )}
        </div>
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
                        <div className="mt-2 ml-2 bg-slate-900/50 rounded p-2 space-y-1 max-h-48 overflow-y-auto">
                          {msg.metadata.diff?.added && msg.metadata.diff.added.length > 0 && (
                            <div>
                              <p className="text-green-400 text-xs font-medium mb-1">Added:</p>
                              <div className="space-y-0.5 ml-2">
                                {msg.metadata.diff.added.map((file: string, fileIdx: number) => (
                                  <div key={fileIdx} className="text-slate-300 font-mono text-xs truncate">+ {file}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {msg.metadata.diff?.modified && msg.metadata.diff.modified.length > 0 && (
                            <div>
                              <p className="text-blue-400 text-xs font-medium mb-1">Modified:</p>
                              <div className="space-y-0.5 ml-2">
                                {msg.metadata.diff.modified.map((file: string, fileIdx: number) => (
                                  <div key={fileIdx} className="text-slate-300 font-mono text-xs truncate">~ {file}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {msg.metadata.diff?.deleted && msg.metadata.diff.deleted.length > 0 && (
                            <div>
                              <p className="text-red-400 text-xs font-medium mb-1">Deleted:</p>
                              <div className="space-y-0.5 ml-2">
                                {msg.metadata.diff.deleted.map((file: string, fileIdx: number) => (
                                  <div key={fileIdx} className="text-slate-300 font-mono text-xs truncate">- {file}</div>
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
    </div>
  );
};

export default TaskCard;

