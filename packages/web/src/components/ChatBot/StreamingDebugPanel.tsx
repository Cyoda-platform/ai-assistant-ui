import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Zap, Wrench, ArrowRight, CheckCircle, XCircle, Play, Bot, FileText, Shuffle } from 'lucide-react';

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
  const getEventIcon = (type: string, size: number = 14) => {
    switch (type) {
      case 'start':
        return <Play size={size} />;
      case 'agent':
        return <Bot size={size} />;
      case 'tool_call':
        return <Wrench size={size} />;
      case 'tool_response':
        return <CheckCircle size={size} />;
      case 'agent_transfer':
        return <Shuffle size={size} />;
      case 'content':
        return <FileText size={size} />;
      case 'done':
        return <CheckCircle size={size} />;
      case 'error':
        return <XCircle size={size} />;
      default:
        return <Clock size={size} />;
    }
  };

  // Get color for event type
  const getEventColor = (type: string) => {
    switch (type) {
      case 'start':
        return 'text-slate-400';
      case 'agent':
        return 'text-teal-400';
      case 'tool_call':
        return 'text-slate-400';
      case 'tool_response':
        return 'text-teal-400';
      case 'agent_transfer':
        return 'text-cyan-400';
      case 'content':
        return 'text-slate-400';
      case 'done':
        return 'text-teal-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  // Get badge styles for event type
  const getEventBadgeStyles = (type: string) => {
    switch (type) {
      case 'start':
        return 'bg-slate-700/40 text-slate-400 border border-slate-600/40';
      case 'agent':
        return 'bg-teal-500/15 text-teal-400 border border-teal-500/25';
      case 'tool_call':
        return 'bg-slate-700/40 text-slate-400 border border-slate-600/40';
      case 'tool_response':
        return 'bg-teal-500/15 text-teal-400 border border-teal-500/25';
      case 'agent_transfer':
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25';
      case 'content':
        return 'bg-slate-700/40 text-slate-400 border border-slate-600/40';
      case 'done':
        return 'bg-teal-500/15 text-teal-400 border border-teal-500/25';
      case 'error':
        return 'bg-red-500/15 text-red-400 border border-red-500/25';
      default:
        return 'bg-slate-700/40 text-slate-400 border border-slate-600/40';
    }
  };

  // Get border color for timeline
  const getEventBorderColor = (type: string) => {
    switch (type) {
      case 'start':
        return 'border-l-slate-600/40';
      case 'agent':
        return 'border-l-teal-500/40';
      case 'tool_call':
        return 'border-l-slate-600/40';
      case 'tool_response':
        return 'border-l-teal-500/40';
      case 'agent_transfer':
        return 'border-l-cyan-500/40';
      case 'content':
        return 'border-l-slate-600/40';
      case 'done':
        return 'border-l-teal-500/40';
      case 'error':
        return 'border-l-red-500/40';
      default:
        return 'border-l-slate-600/40';
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

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    const eventCounts = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

    const startTime = events.length > 0 ? new Date(events[0].timestamp).getTime() : 0;
    const endTime = events.length > 0 ? new Date(events[events.length - 1].timestamp).getTime() : 0;
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    return {
      eventCounts,
      agents: Array.from(agents),
      tools: Array.from(tools),
      duration
    };
  }, [events]);

  return (
    <div className="mt-2 mb-4">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-xs text-slate-500 hover:text-slate-400 transition-colors group"
      >
        {isExpanded ? (
          <ChevronDown size={14} className="group-hover:text-slate-400" />
        ) : (
          <ChevronRight size={14} className="group-hover:text-slate-400" />
        )}
        <Clock size={12} className="group-hover:text-slate-400" />
        <span>
          {isExpanded ? 'Hide' : 'Show'} processing details ({events.length} events)
        </span>
        {isComplete && (
          <span className="flex items-center space-x-1 text-teal-400 ml-2">
            <CheckCircle size={12} />
            <span className="font-medium">Done</span>
          </span>
        )}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="mt-3 bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/30 overflow-hidden">
          {/* Header with Status */}
          <div className="px-4 py-3 bg-slate-800/30 border-b border-slate-700/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Processing Timeline</span>
              {isComplete ? (
                <span className="flex items-center space-x-1.5 text-xs font-medium text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full">
                  <CheckCircle size={14} />
                  <span>Processing Complete</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 bg-slate-700/30 px-2.5 py-1 rounded-full">
                  <Clock size={14} className="animate-pulse" />
                  <span>Processing...</span>
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid - Show when complete */}
          {isComplete && (
            <div className="px-4 py-3 bg-slate-800/20 border-b border-slate-700/30">
              <div className="grid grid-cols-4 gap-3">
                {/* Total Events */}
                <div className="bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-700/30">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Events</div>
                  <div className="text-lg font-semibold text-slate-300">{events.length}</div>
                </div>

                {/* Duration */}
                <div className="bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-700/30">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Duration</div>
                  <div className="text-lg font-semibold text-slate-300">{stats.duration}<span className="text-xs text-slate-500 ml-0.5">s</span></div>
                </div>

                {/* Agents */}
                <div className="bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-700/30">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Agents</div>
                  <div className="text-lg font-semibold text-teal-400">{stats.agents.length}</div>
                </div>

                {/* Tools */}
                <div className="bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-700/30">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Tools</div>
                  <div className="text-lg font-semibold text-slate-400">{stats.tools.length}</div>
                </div>
              </div>

              {/* Event Breakdown */}
              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Event Breakdown</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.eventCounts).map(([type, count]) => (
                    <div
                      key={type}
                      className={`flex items-center space-x-1.5 ${getEventBadgeStyles(type)} rounded-md px-2 py-1 text-xs font-medium`}
                    >
                      {getEventIcon(type, 12)}
                      <span className="uppercase tracking-wide text-[10px]">{type}</span>
                      <span className="bg-slate-900/60 rounded px-1.5 py-0.5 text-[10px] font-semibold">×{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Agents & Tools Section - Show when complete */}
          {isComplete && (stats.agents.length > 0 || stats.tools.length > 0) && (
            <div className="px-4 py-3 bg-slate-800/20 border-b border-slate-700/30">
              <div className="grid grid-cols-2 gap-3">
                {/* Agents Used */}
                {stats.agents.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Agents Used</div>
                    <div className="space-y-1.5">
                      {stats.agents.map(agent => (
                        <div
                          key={agent}
                          className="flex items-center space-x-2 bg-teal-500/10 border border-teal-500/20 rounded-lg px-2.5 py-1.5"
                        >
                          <div className="flex-shrink-0 w-6 h-6 bg-teal-500/20 rounded-md flex items-center justify-center border border-teal-500/30">
                            <Bot size={12} className="text-teal-400" />
                          </div>
                          <span className="text-xs font-medium text-teal-300">
                            {agent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tools Used */}
                {stats.tools.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Tools Used</div>
                    <div className="space-y-1.5">
                      {stats.tools.map(tool => (
                        <div
                          key={tool}
                          className="flex items-center space-x-2 bg-slate-700/30 border border-slate-600/30 rounded-lg px-2.5 py-1.5"
                        >
                          <div className="flex-shrink-0 w-6 h-6 bg-slate-700/40 rounded-md flex items-center justify-center border border-slate-600/40">
                            <Wrench size={12} className="text-slate-400" />
                          </div>
                          <span className="text-xs font-medium text-slate-400">
                            {tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Events */}
          <div className="relative px-4 py-3 max-h-80 overflow-y-auto">
            {/* Vertical Timeline Line */}
            <div className="absolute left-8 top-3 bottom-3 w-0.5 bg-gradient-to-b from-slate-600/40 via-teal-500/30 to-slate-600/40" />

            <div className="space-y-2">
              {events.map((event, index) => {
                const eventKey = event.id || `event-${index}`;
                const eventData = event.data || {};
                return (
                  <div
                    key={eventKey}
                    className={`relative pl-9 pr-4 py-3 bg-slate-800/30 hover:bg-slate-700/30 rounded-lg border-l-3 ${getEventBorderColor(event.type)} transition-all hover:translate-x-0.5 group`}
                  >
                    {/* Timeline Dot */}
                    <div className={`absolute left-[22px] top-4 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${getEventBadgeStyles(event.type)}`} />

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1.5">
                        <span className={`inline-flex items-center gap-1 ${getEventBadgeStyles(event.type)} rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider`}>
                          {getEventIcon(event.type, 10)}
                          <span>{event.type}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatTime(event.timestamp)}
                        </span>
                        {event.id && (
                          <span className="text-[10px] text-slate-600 font-mono">#{event.id}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 leading-relaxed break-words mb-2">
                        {formatEventData(event)}
                      </div>

                      {/* Full Event Data (Collapsible) */}
                      {Object.keys(eventData).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-400 uppercase tracking-wider font-medium select-none marker:text-slate-500">
                            View raw data
                          </summary>
                          <pre className="mt-2 text-[10px] text-teal-400 bg-slate-950/50 rounded-md p-2.5 overflow-x-auto border border-slate-800">
                            {JSON.stringify(eventData, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamingDebugPanel;

