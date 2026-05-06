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
  cloneRepositoryDetected?: boolean;
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
  onOpenCanvas?: () => void;
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
  cloneRepositoryDetected = false,
  error,
  errorDetails,
  onRetry,
  isRetrying = false,
  onOpenCanvas
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
    : 'Assistant';

  return (
    <div
      ref={messageRef}
      className="w-full mb-6 animate-fade-in-up px-4 md:px-6 lg:px-8"
    >
      <div className="flex items-start gap-3 max-w-6xl">
          {/* AI Avatar */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src={LogoSmall} alt="CYODA" className="w-10 h-10" />
          </div>

          <div className="flex-1 min-w-0">
          {/* AI Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-slate-500">{displayAgentName}</span>
            {!isComplete && (
              <>
                <span className="text-xs text-blue-500 animate-pulse">●</span>
                <span className="text-xs text-slate-400 italic">streaming...</span>
              </>
            )}
          </div>

          {/* Message Content */}
          <div className="rounded-2xl bg-slate-800 px-4 py-3 border border-slate-700 shadow-sm">
            <div className="prose prose-invert prose-sm max-w-none">
              {content ? (
                <div className="relative">
                  {/* Show typing animation while streaming, full content when complete */}
                  {!isComplete ? (
                    <div className="text-slate-800 leading-relaxed">
                      {displayedContent}
                      <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>
                    </div>
                  ) : (
                    <MarkdownRenderer content={content} />
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Loading indicator */}
                  <div className="flex items-center space-x-2 text-slate-500">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm">Waiting for response...</span>
                  </div>
                </div>
              )}
            </div>


            {/* Stream Error Retry Section */}
            {error && onRetry && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-red-700 font-medium mb-2">
                      {errorDetails?.error_type === 'TimeoutError' ? 'Request Timeout' :
                       errorDetails?.error_type === 'NetworkError' ? 'Network Error' :
                       errorDetails?.context === 'ADK event processing loop' ? 'Processing Error' :
                       'Stream Connection Lost'}
                    </h4>

                    <p className="text-red-600 text-sm mb-2">
                      {error}
                    </p>

                    {/* Show additional context if available */}
                    {errorDetails && (
                      <div className="text-red-600 text-xs mb-3 space-y-1">
                        {errorDetails.error_type && (
                          <div>Error Type: <span className="text-red-700">{errorDetails.error_type}</span></div>
                        )}
                        {errorDetails.context && (
                          <div>Context: <span className="text-red-700">{errorDetails.context}</span></div>
                        )}
                        {errorDetails.status_code && (
                          <div>Status Code: <span className="text-red-700">{errorDetails.status_code}</span></div>
                        )}
                        {errorDetails.error_context && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                            <div>Events Processed: <span className="text-red-700">{errorDetails.error_context.events_processed ? 'Yes' : 'No'}</span></div>
                            <div>Response Length: <span className="text-red-700">{errorDetails.error_context.response_length} chars</span></div>
                            <div>Event Count: <span className="text-red-700">{errorDetails.error_context.event_count}</span></div>
                            {errorDetails.error_context.session_id && (
                              <div>Session ID: <span className="text-red-700 font-mono text-xs">{errorDetails.error_context.session_id}</span></div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-red-600 text-sm mb-3">
                      {content ?
                        'A partial response was received. You can retry to get the complete answer.' :
                        'The connection was interrupted before receiving a response. You can retry to get the complete answer.'
                      }
                    </p>

                    <button
                      onClick={onRetry}
                      disabled={isRetrying}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:opacity-50 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-sm disabled:shadow-none"
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

