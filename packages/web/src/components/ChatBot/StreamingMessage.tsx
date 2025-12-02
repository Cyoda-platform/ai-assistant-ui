import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import LogoSmall from '@/assets/images/logo-small.svg';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import StreamingDebugPanel from './StreamingDebugPanel';
import type { SSEEventRecord } from '@/types/streaming';

interface StreamingMessageProps {
  content: string;
  agentName?: string;
  isComplete?: boolean;
  events?: SSEEventRecord[];
  error?: string;
  errorDetails?: {
    error_type?: string;
    context?: string;
    status_code?: number;
    error_code?: string;
    error_context?: {
      events_processed: boolean;
      response_length: number;
      event_count: number;
      session_id?: string;
    };
  };
  onRetry?: () => void;
  isRetrying?: boolean;
}

/**
 * StreamingMessage Component
 * Displays a message that is being streamed in real-time
 * Shows accumulated content with a blinking cursor while streaming
 */
const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  agentName,
  isComplete = false,
  events = [],
  error,
  errorDetails,
  onRetry,
  isRetrying = false
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const [displayedContent, setDisplayedContent] = useState('');
  const [displayIndex, setDisplayIndex] = useState(0);

  // Auto-scroll to bottom when content updates
  useEffect(() => {
    if (messageRef.current && !isComplete) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [content, isComplete]);

  // Typing animation effect for loading state
  useEffect(() => {
    if (displayIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.substring(0, displayIndex + 1));
        setDisplayIndex(displayIndex + 1);
      }, 10); // 10ms per character for smooth typing
      return () => clearTimeout(timer);
    }
  }, [displayIndex, content]);

  // Format agent name for display
  const displayAgentName = agentName
    ? agentName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'CYODA AI';

  return (
    <div
      ref={messageRef}
      className="flex justify-start mb-6 animate-fade-in-up"
    >
      <div className="flex items-start space-x-3 w-full max-w-[90%]">
        {/* AI Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
          <img src={LogoSmall} alt="CYODA" className="w-10 h-10" />
        </div>

        <div className="flex-1 min-w-0">
          {/* AI Badge */}
          <div className="flex items-center space-x-2 flex-wrap mb-2">
            <div className="flex items-center space-x-1.5 bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-600">
              <Sparkles size={12} className={isComplete ? "text-purple-400" : "text-purple-400 animate-pulse"} />
              <span className="text-xs font-medium text-slate-300">{displayAgentName}</span>
            </div>
            {!isComplete && (
              <span className="text-xs text-slate-500 italic">streaming...</span>
            )}
          </div>

          {/* Message Content */}
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl px-4 py-3 border border-slate-700/50 shadow-lg">
            <div className="prose prose-invert prose-sm max-w-none">
              {content ? (
                <div className="relative">
                  {/* Show typing animation while streaming, full content when complete */}
                  {!isComplete ? (
                    <div className="text-slate-300 font-mono leading-relaxed">
                      {displayedContent}
                      <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse"></span>
                    </div>
                  ) : (
                    <MarkdownRenderer content={content} />
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Loading indicator */}
                  <div className="flex items-center space-x-2 text-slate-400">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm">Waiting for response...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stream Error Retry Section */}
            {error && onRetry && (
              <div className="mt-4 p-4 bg-pink-900/20 border border-pink-700/50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle size={20} className="text-pink-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-pink-300 font-medium mb-2">
                      {errorDetails?.error_type === 'TimeoutError' ? 'Request Timeout' :
                       errorDetails?.error_type === 'NetworkError' ? 'Network Error' :
                       errorDetails?.context === 'ADK event processing loop' ? 'AI Processing Error' :
                       'Stream Connection Lost'}
                    </h4>

                    <p className="text-pink-200 text-sm mb-2">
                      {error}
                    </p>

                    {/* Show additional context if available */}
                    {errorDetails && (
                      <div className="text-pink-300 text-xs mb-3 space-y-1">
                        {errorDetails.error_type && (
                          <div>Error Type: <span className="text-pink-200">{errorDetails.error_type}</span></div>
                        )}
                        {errorDetails.context && (
                          <div>Context: <span className="text-pink-200">{errorDetails.context}</span></div>
                        )}
                        {errorDetails.status_code && (
                          <div>Status Code: <span className="text-pink-200">{errorDetails.status_code}</span></div>
                        )}
                        {errorDetails.error_context && (
                          <div className="mt-2 p-2 bg-pink-900/30 rounded text-xs">
                            <div>Events Processed: <span className="text-pink-200">{errorDetails.error_context.events_processed ? 'Yes' : 'No'}</span></div>
                            <div>Response Length: <span className="text-pink-200">{errorDetails.error_context.response_length} chars</span></div>
                            <div>Event Count: <span className="text-pink-200">{errorDetails.error_context.event_count}</span></div>
                            {errorDetails.error_context.session_id && (
                              <div>Session ID: <span className="text-pink-200 font-mono text-xs">{errorDetails.error_context.session_id}</span></div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-pink-200 text-sm mb-3">
                      {content ?
                        'A partial response was received. You can retry to get the complete answer.' :
                        'The connection was interrupted before receiving a response. You can retry to get the complete answer.'
                      }
                    </p>

                    <button
                      onClick={onRetry}
                      disabled={isRetrying}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 disabled:opacity-50 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-teal-500/25 disabled:shadow-none"
                    >
                      <RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />
                      <span>{isRetrying ? 'Retrying...' : 'Retry Message'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SSE Debug Panel - Show processing details in real-time */}
            {events.length > 0 && (
              <StreamingDebugPanel
                events={events}
                isComplete={isComplete}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingMessage;

