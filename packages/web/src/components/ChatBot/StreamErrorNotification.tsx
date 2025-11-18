import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, ChevronDown, ChevronUp, X } from 'lucide-react';

interface StreamErrorNotificationProps {
  error: string;
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
  onRetry: () => void;
  onDismiss: () => void;
  isRetrying?: boolean;
  visible?: boolean;
}

/**
 * StreamErrorNotification Component
 * Shows a user-friendly notification when streaming fails
 * Provides clear options to retry or dismiss
 */
const StreamErrorNotification: React.FC<StreamErrorNotificationProps> = ({
  error,
  errorDetails,
  onRetry,
  onDismiss,
  isRetrying = false,
  visible = true
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!visible) return null;

  const isConnectionError = error.toLowerCase().includes('connection') ||
                           error.toLowerCase().includes('network') ||
                           error.toLowerCase().includes('timeout') ||
                           errorDetails?.error_type === 'TimeoutError' ||
                           errorDetails?.error_type === 'NetworkError';

  const isADKError = errorDetails?.context === 'ADK event processing loop' ||
                     errorDetails?.context === 'ADK streaming loop';

  const getErrorIcon = () => {
    if (isConnectionError) {
      return <WifiOff size={20} className="text-orange-400" />;
    }
    if (isADKError) {
      return <AlertTriangle size={20} className="text-purple-400" />;
    }
    return <AlertTriangle size={20} className="text-pink-400" />;
  };

  const getErrorTitle = () => {
    if (errorDetails?.error_type === 'TimeoutError') {
      return 'Request Timeout';
    }
    if (errorDetails?.error_type === 'NetworkError') {
      return 'Network Error';
    }
    if (isADKError) {
      return 'AI Processing Error';
    }
    if (isConnectionError) {
      return 'Connection Interrupted';
    }
    return 'Stream Error';
  };

  const getErrorMessage = () => {
    if (errorDetails?.error_type === 'TimeoutError') {
      return 'The request took too long to complete. This can happen with complex queries or during high server load.';
    }
    if (errorDetails?.error_type === 'NetworkError') {
      return 'A network error occurred while communicating with CYODA AI. Please check your connection and try again.';
    }
    if (isADKError) {
      return 'An error occurred while processing your request with the AI agent. The system encountered an issue during execution.';
    }
    if (isConnectionError) {
      return 'Your connection to CYODA AI was interrupted. This can happen due to network issues or server timeouts.';
    }
    return 'An error occurred while streaming your response from CYODA AI.';
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-md sm:max-w-lg animate-slideInRight">
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-lg shadow-xl p-4 mx-4 sm:mx-0">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getErrorIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-white font-medium text-sm">
                    {getErrorTitle()}
                  </h4>
                  <button
                    onClick={onDismiss}
                    className="flex-shrink-0 ml-2 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                    title="Dismiss notification"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Retry button at the top */}
                <div className="mb-4">
                  <button
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 disabled:opacity-50 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-teal-500/25 disabled:shadow-none w-full justify-center"
                  >
                    <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                    <span>{isRetrying ? 'Retrying...' : 'Retry Message'}</span>
                  </button>
                </div>

                <p className="text-slate-300 text-sm mb-2 leading-relaxed">
                  {getErrorMessage()}
                </p>

                <p className="text-slate-400 text-xs mb-4">
                  {error}
                </p>

                {/* Error details toggle - always show if we have any error info */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="inline-flex items-center space-x-1 text-slate-400 hover:text-slate-300 text-sm transition-colors p-2 -ml-2 rounded-md hover:bg-slate-700/30 font-medium"
                  >
                    {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
                  </button>
                </div>

                {/* Collapsible error details */}
                {showDetails && (
                  <div className="mb-4 p-3 bg-slate-900/50 rounded-lg text-xs space-y-2 border border-slate-700/50">
                    {/* Always show the raw error message */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                      <span className="text-slate-400 font-medium min-w-0 sm:min-w-[80px]">Error:</span>
                      <span className="text-slate-300 break-all">{error}</span>
                    </div>

                    {/* Show error details if available */}
                    {errorDetails?.error_type && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="text-slate-400 font-medium min-w-0 sm:min-w-[80px]">Type:</span>
                        <span className="text-slate-300 break-all">{errorDetails.error_type}</span>
                      </div>
                    )}
                    {errorDetails?.context && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="text-slate-400 font-medium min-w-0 sm:min-w-[80px]">Context:</span>
                        <span className="text-slate-300 break-all">{errorDetails.context}</span>
                      </div>
                    )}
                    {errorDetails?.status_code && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="text-slate-400 font-medium min-w-0 sm:min-w-[80px]">Status:</span>
                        <span className="text-slate-300">{errorDetails.status_code}</span>
                      </div>
                    )}
                    {errorDetails?.error_code && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="text-slate-400 font-medium min-w-0 sm:min-w-[80px]">Code:</span>
                        <span className="text-slate-300">{errorDetails.error_code}</span>
                      </div>
                    )}

                    {/* Show processing state if available */}
                    {errorDetails?.error_context && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <div className="text-slate-400 font-medium mb-2">Processing State:</div>
                        <div className="space-y-1 ml-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span className="text-slate-400 min-w-0 sm:min-w-[120px]">Events Processed:</span>
                            <span className="text-slate-300">{errorDetails.error_context.events_processed ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span className="text-slate-400 min-w-0 sm:min-w-[120px]">Response Length:</span>
                            <span className="text-slate-300">{errorDetails.error_context.response_length} chars</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span className="text-slate-400 min-w-0 sm:min-w-[120px]">Event Count:</span>
                            <span className="text-slate-300">{errorDetails.error_context.event_count}</span>
                          </div>
                          {errorDetails.error_context.session_id && (
                            <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                              <span className="text-slate-400 min-w-0 sm:min-w-[120px]">Session:</span>
                              <span className="text-slate-300 font-mono text-xs break-all">{errorDetails.error_context.session_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Show timestamp */}
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="text-slate-400 font-medium min-w-0 sm:min-w-[80px]">Time:</span>
                        <span className="text-slate-300">{new Date().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>



        {/* Connection status indicator */}
        {isConnectionError && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Wifi size={12} />
              <span>Check your internet connection and try again</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamErrorNotification;
