import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Zap, Wrench, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

interface SSEEvent {
  id?: string;
  type: string;
  data?: any;
  timestamp: string;
  chunk_length?: number;
  [key: string]: any;
}

interface StreamingDebugPanelProps {
  events: SSEEvent[];
  isComplete?: boolean;
}

/**
 * StreamingDebugPanel Component
 * Displays a collapsible panel showing all SSE events received during streaming
 * Similar to ChatGPT's debug/details view
 */
const StreamingDebugPanel: React.FC<StreamingDebugPanelProps> = ({
  events,
  isComplete = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (events.length === 0) {
    return null;
  }

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });
    } catch {
      return timestamp;
    }
  };

  // Get icon for event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Zap size={14} className="text-green-400" />;
      case 'agent':
        return <ArrowRight size={14} className="text-blue-400" />;
      case 'tool_call':
        return <Wrench size={14} className="text-yellow-400" />;
      case 'tool_response':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'agent_transfer':
        return <ArrowRight size={14} className="text-purple-400" />;
      case 'content':
        return <Zap size={14} className="text-teal-400" />;
      case 'done':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'error':
        return <XCircle size={14} className="text-red-400" />;
      default:
        return <Clock size={14} className="text-slate-400" />;
    }
  };

  // Get color for event type
  const getEventColor = (type: string) => {
    switch (type) {
      case 'start':
        return 'text-green-400';
      case 'agent':
        return 'text-blue-400';
      case 'tool_call':
        return 'text-yellow-400';
      case 'tool_response':
        return 'text-green-400';
      case 'agent_transfer':
        return 'text-purple-400';
      case 'content':
        return 'text-teal-400';
      case 'done':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  // Format event data for display
  const formatEventData = (event: SSEEvent) => {
    const { type, data } = event;

    switch (type) {
      case 'start':
        return `Processing started`;
      case 'agent':
        return `Agent: ${data?.agent_name || 'Unknown'}`;
      case 'tool_call':
        return `Tool: ${data?.tool_name} (${JSON.stringify(data?.tool_args)})`;
      case 'tool_response':
        const responsePreview = data?.tool_response?.substring(0, 60) || '';
        return `Tool response: ${data?.tool_name} - ${responsePreview}${data?.tool_response?.length > 60 ? '...' : ''}`;
      case 'agent_transfer':
        return `Transfer: ${data?.from_agent} → ${data?.to_agent}`;
      case 'content':
        // Handle both formats: data.chunk (SSE) and chunk_length (debug_history)
        const chunkLength = event.chunk_length || data?.chunk?.length || 0;
        return `Content received: ${chunkLength} characters`;
      case 'done':
        const doneResponsePreview = data?.response?.substring(0, 80) || '';
        return `Done: ${doneResponsePreview}${data?.response?.length > 80 ? '...' : ''}`;
      case 'error':
        return `Error: ${data?.error}`;
      default:
        return data?.message || 'Event received';
    }
  };

  return (
    <div className="mt-2 mb-4">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown size={14} />
        ) : (
          <ChevronRight size={14} />
        )}
        <Clock size={12} />
        <span>
          {isExpanded ? 'Hide' : 'Show'} processing details ({events.length} events)
        </span>
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="mt-2 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden">
          <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Processing Timeline</span>
              <span className="text-xs text-slate-500">{events.length} events</span>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {events.map((event, index) => {
              const eventKey = event.id || `event-${index}`;
              const eventData = event.data || {};
              return (
                <div
                  key={eventKey}
                  className="px-3 py-2 border-b border-slate-800/50 last:border-b-0 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start space-x-2">
                    {/* Event Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getEventIcon(event.type)}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium ${getEventColor(event.type)}`}>
                          {event.type}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 break-words">
                        {formatEventData(event)}
                      </div>
                    </div>

                    {/* Event ID - Only show if present */}
                    {event.id && (
                      <div className="flex-shrink-0">
                        <span className="text-xs text-slate-600 font-mono">#{event.id}</span>
                      </div>
                    )}
                  </div>

                  {/* Full Event Data (Collapsible) */}
                  {Object.keys(eventData).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                        View raw data
                      </summary>
                      <pre className="mt-1 text-xs text-slate-400 bg-slate-950/50 rounded p-2 overflow-x-auto">
                        {JSON.stringify(eventData, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Footer */}
          {isComplete && (
            <div className="px-3 py-2 bg-slate-800/50 border-t border-slate-700/50">
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Processing Complete</span>
                  <span className="text-green-400 flex items-center space-x-1">
                    <CheckCircle size={12} />
                    <span>Done</span>
                  </span>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Total Events */}
                  <div className="bg-slate-900/50 rounded px-2 py-1">
                    <div className="text-slate-500">Total Events</div>
                    <div className="text-slate-300 font-medium">{events.length}</div>
                  </div>

                  {/* Processing Time */}
                  {events.length > 1 && (() => {
                    const startTime = new Date(events[0].timestamp).getTime();
                    const endTime = new Date(events[events.length - 1].timestamp).getTime();
                    const duration = ((endTime - startTime) / 1000).toFixed(2);
                    return (
                      <div className="bg-slate-900/50 rounded px-2 py-1">
                        <div className="text-slate-500">Duration</div>
                        <div className="text-slate-300 font-medium">{duration}s</div>
                      </div>
                    );
                  })()}
                </div>

                {/* Event Type Breakdown */}
                <div className="bg-slate-900/50 rounded px-2 py-1.5">
                  <div className="text-slate-500 text-xs mb-1">Event Breakdown</div>
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      const eventCounts = events.reduce((acc, event) => {
                        acc[event.type] = (acc[event.type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      return Object.entries(eventCounts).map(([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center space-x-1 bg-slate-800/50 rounded px-1.5 py-0.5"
                        >
                          {getEventIcon(type)}
                          <span className={`text-xs ${getEventColor(type)}`}>{type}</span>
                          <span className="text-xs text-slate-500">×{count}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Agent & Tool Summary */}
                {(() => {
                  const agents = new Set<string>();
                  const tools = new Set<string>();

                  events.forEach(event => {
                    if (event.type === 'agent' && event.data?.agent_name) {
                      agents.add(event.data.agent_name);
                    }
                    if (event.type === 'tool_call' && event.data?.tool_name) {
                      tools.add(event.data.tool_name);
                    }
                  });

                  return (
                    <>
                      {agents.size > 0 && (
                        <div className="bg-slate-900/50 rounded px-2 py-1.5">
                          <div className="text-slate-500 text-xs mb-1">Agents Used</div>
                          <div className="flex flex-wrap gap-1">
                            {Array.from(agents).map(agent => (
                              <div
                                key={agent}
                                className="bg-blue-900/30 text-blue-300 rounded px-1.5 py-0.5 text-xs"
                              >
                                {agent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {tools.size > 0 && (
                        <div className="bg-slate-900/50 rounded px-2 py-1.5">
                          <div className="text-slate-500 text-xs mb-1">Tools Used</div>
                          <div className="flex flex-wrap gap-1">
                            {Array.from(tools).map(tool => (
                              <div
                                key={tool}
                                className="bg-yellow-900/30 text-yellow-300 rounded px-1.5 py-0.5 text-xs"
                              >
                                {tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StreamingDebugPanel;

