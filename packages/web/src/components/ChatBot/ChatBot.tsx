import React, { useEffect, useRef, useState } from 'react';
import { Row, Col } from 'antd';
import { Github, X } from 'lucide-react';
import ChatBotSubmitForm from './ChatBotSubmitForm';
import ChatLoader from './ChatLoader';
import ChatBotMessageQuestion from './ChatBotMessageQuestion';
import ChatBotMessageNotification from './ChatBotMessageNotification';
import ChatBotMessageAnswer from './ChatBotMessageAnswer';
import ChatBotName from './ChatBotName';
import ChatBotMessageFunction from './ChatBotMessageFunction';
import ChatBotMessageError from './ChatBotMessageError';
import StreamingMessage from './StreamingMessage';
import type { StreamingState } from '@/types/streaming';

interface Message {
  id?: string;
  type: 'ai' | 'user' | 'notification' | 'ui_function' | 'error';
  text: string;
  raw?: any;
  last_modified?: string;
  file?: File;
  files?: File[];
  approve?: boolean;
  editable?: boolean;
  isCanvasQA?: boolean; // Mark Canvas QA messages for pink styling
  hook_message?: string; // Separated hook message from agent response
}

interface CanvasOptions {
  returnWorkflowJSON?: boolean;
  returnAppJSON?: boolean;
  returnEntityJSON?: boolean;
  returnRequirementJSON?: boolean;
  returnEnvironmentJSON?: boolean;
}

interface ChatBotProps {
  isLoading: boolean;
  isLoadingHistory?: boolean;
  disabled: boolean;
  messages: Message[];
  technicalId: string;
  chatData?: any;
  canvasVisible?: boolean;
  chatHistoryVisible?: boolean;
  streamingState?: StreamingState; // SSE streaming state
  githubRepository?: any; // GitHub repository info for canvas refresh
  onAnswer: (data: { answer: string; files?: File[]; mode?: 'workflow' | 'qa'; canvasOptions?: CanvasOptions }) => void;
  onApproveQuestion: (data: any) => void;
  onUpdateNotification: (data: any) => void;
  onToggleCanvas: () => void;
  onEntitiesDetails?: () => void;
  onToggleChatHistory?: () => void;
  onScrollToBottom?: () => void; // Callback when user scrolls to bottom
  onAddToCanvas?: (result: { id: string; type: string; data: any }) => void;
  onStopRequest?: () => void; // Callback to stop current request
  onRollbackCanvasAI?: () => void; // Callback to rollback Canvas AI changes
  onRetryCanvasAI?: (messageId: string) => void; // Callback to retry Canvas AI request
  activeCanvasTab?: 'apps' | 'data' | 'workflow' | 'requirement' | 'code'; // Active tab in canvas
  hasCanvasAIRollback?: boolean; // Whether there are Canvas AI changes to rollback
  onOpenTaskPanel?: () => void; // Callback to open task panel
  onRetryStreaming?: () => void; // Callback to retry streaming
  isRetrying?: boolean; // Whether streaming retry is in progress
  onSetTextareaContent?: (callback: (content: string, options?: { collapse?: boolean }) => void) => void; // Expose method to set textarea content
}

const ChatBot: React.FC<ChatBotProps> = ({
  isLoading,
  isLoadingHistory = false,
  disabled,
  messages,
  technicalId,
  chatData,
  canvasVisible = false,
  streamingState,
  githubRepository,
  onAnswer,
  onApproveQuestion,
  onUpdateNotification,
  onToggleCanvas,
  onEntitiesDetails,
  onScrollToBottom,
  onAddToCanvas,
  onRollbackCanvasAI,
  onRetryCanvasAI,
  activeCanvasTab,
  hasCanvasAIRollback = false,
  onOpenTaskPanel,
  onRetryStreaming,
  isRetrying = false,
  onStopRequest,
  onSetTextareaContent
}) => {
  const chatBotPlaceholderRef = useRef<HTMLDivElement>(null);
  const [chatBotPlaceholderHeight, setChatBotPlaceholderHeight] = useState(0);
  const [textareaContentCallback, setTextareaContentCallback] = useState<((content: string, options?: { collapse?: boolean }) => void) | null>(null);
  const [showRepositoryConfigModal, setShowRepositoryConfigModal] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserNearBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const hasCalledScrollToBottomRef = useRef(false); // Track if we've already called the callback

  // Handler to store the textarea content callback from ChatBotSubmitForm
  const handleSetTextareaContent = (callback: (content: string, options?: { collapse?: boolean }) => void) => {
    setTextareaContentCallback(() => callback);
    // Also propagate to parent (ChatBotView) so canvas can use it
    onSetTextareaContent?.(callback);
  };

  const scrollDownMessages = (smooth = false) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        if (smooth) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  };

  // Check if user is near bottom of chat
  const checkIfNearBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const threshold = 50; // pixels from bottom - reduced for more precise detection
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = distanceFromBottom < threshold;

      // Debug logging


      isUserNearBottomRef.current = isNearBottom;

      // If user scrolled to bottom and we haven't called the callback yet, call it
      if (isNearBottom && !hasCalledScrollToBottomRef.current && onScrollToBottom) {
        hasCalledScrollToBottomRef.current = true;
        onScrollToBottom();
      }
    }
  };

  const getOffset = (type: string) => {
    if (type === 'answer') return 9;
    return ['question', 'notification', 'ui_function'].includes(type) ? 1 : 8;
  };

  const getSpan = (type: string) => {
    return ['question', 'notification', 'ui_function'].includes(type) ? 22 : 14;
  };

  // Add scroll listener to track user position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkIfNearBottom();
    };

    // Check immediately on mount in case user is already at bottom
    checkIfNearBottom();

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScrollToBottom]); // Re-attach listener if callback changes

  // Only auto-scroll when new messages arrive AND user is near bottom
  useEffect(() => {
    const newMessageCount = messages.length;
    const hadNewMessages = newMessageCount > previousMessageCountRef.current;
    previousMessageCountRef.current = newMessageCount;

    // Reset the scroll-to-bottom callback flag when new messages arrive
    if (hadNewMessages) {
      hasCalledScrollToBottomRef.current = false;
    }

    if (hadNewMessages && isUserNearBottomRef.current) {
      // Small delay to let DOM settle before scrolling
      const timeoutId = setTimeout(() => {
        scrollDownMessages(false);
        // Check if at bottom after scrolling
        setTimeout(() => checkIfNearBottom(), 100);
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  // Debug streaming state
  useEffect(() => {
    console.log('[ChatBot] Streaming state changed:', streamingState);
  }, [streamingState]);

  // Auto-scroll when loading starts (Cyoda starts typing)
  useEffect(() => {
    if (isLoading) {
      // Small delay to let the loader appear before scrolling
      const timeoutId = setTimeout(() => {
        scrollDownMessages(true);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);

  const renderMessage = (message: Message, index: number) => {
    switch (message.type) {
      case 'ai':
        return (
          <ChatBotMessageQuestion
            key={index}
            message={message}
            isLoading={isLoading}
            onApproveQuestion={onApproveQuestion}
            onAddToCanvas={onAddToCanvas}
            onRollbackCanvasAI={onRollbackCanvasAI}
            onRetryCanvasAI={onRetryCanvasAI}
            hasRollback={hasCanvasAIRollback}
            technicalId={technicalId}
            onOpenCanvas={onToggleCanvas}
            hasRepository={!!githubRepository}
            onAnswer={onAnswer}
            onOpenTaskPanel={onOpenTaskPanel}
            setTextareaContent={textareaContentCallback || undefined}
          />
        );
      case 'notification':
        return (
          <ChatBotMessageNotification
            key={index}
            message={message}
            onUpdateNotification={onUpdateNotification}
            onOpenTaskPanel={onOpenTaskPanel}
            onOpenCanvas={onToggleCanvas}
            technicalId={technicalId}
            githubRepository={githubRepository}
          />
        );
      case 'user':
        return (
          <ChatBotMessageAnswer
            key={index}
            message={message}
          />
        );
      case 'ui_function':
        return (
          <ChatBotMessageFunction
            key={index}
            message={message}
            onApproveQuestion={onApproveQuestion}
          />
        );
      case 'error':
        return (
          <ChatBotMessageError
            key={index}
            message={message}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 h-full">
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto chat-container min-h-0"
      >
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400 text-sm">Loading chat history...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-[90%] mx-auto p-6 w-full">
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  id={`message-${message.id}`}
                  className="w-full transition-colors duration-500"
                >
                  {renderMessage(message, index)}
                </div>
              ))}
              {/* Show streaming message if streaming is active */}
              {streamingState?.isStreaming && (
                <div className="w-full">
                  <StreamingMessage
                    content={streamingState.accumulatedContent}
                    agentName={streamingState.currentAgent}
                    isComplete={false}
                    events={streamingState.events}
                    error={streamingState.error}
                    errorDetails={streamingState.errorDetails}
                    onRetry={onRetryStreaming}
                    isRetrying={isRetrying}
                  />
                </div>
              )}
              {/* Show streaming error with retry option if not streaming but has error */}
              {!streamingState?.isStreaming && streamingState?.error && (
                <div className="w-full">
                  <StreamingMessage
                    content={streamingState.accumulatedContent}
                    agentName={streamingState.currentAgent}
                    isComplete={false}
                    events={streamingState.events}
                    error={streamingState.error}
                    errorDetails={streamingState.errorDetails}
                    onRetry={onRetryStreaming}
                    isRetrying={isRetrying}
                  />
                </div>
              )}
              {/* Show loader if loading but not streaming */}
              {isLoading && !streamingState?.isStreaming && (
                <div className="w-full">
                  <ChatLoader
                    agentName={streamingState?.currentAgent}
                    toolName={streamingState?.currentTool}
                    toolArgs={streamingState?.toolArgs}
                  />
                </div>
              )}
              <div
                ref={chatBotPlaceholderRef}
                className="h-4"
              />
            </div>
          </div>
        )}
      </div>

      {/* Input Area at Bottom */}
      <div className="border-t border-slate-700 glass p-4 flex-shrink-0">
        <div className="max-w-[90%] mx-auto w-full">
          <ChatBotSubmitForm
            disabled={disabled}
            onAnswer={onAnswer}
            showCanvasButton={canvasVisible}
            activeCanvasTab={activeCanvasTab}
            isAIThinking={isLoading || streamingState?.isStreaming}
            onStopRequest={onStopRequest}
            onSetTextareaContent={handleSetTextareaContent}
            hasRepository={!!githubRepository}
            onShowRepositoryConfigModal={() => setShowRepositoryConfigModal(true)}
          />
        </div>
      </div>

      {/* Repository Configuration Modal - Centered on page */}
      {showRepositoryConfigModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="w-80 bg-gradient-to-br from-slate-800 to-slate-900 border border-teal-500/30 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none"></div>

            {/* Close button */}
            <button
              onClick={() => setShowRepositoryConfigModal(false)}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-700/50 hover:bg-slate-600 flex items-center justify-center transition-colors z-10"
              title="Close"
            >
              <X size={14} className="text-slate-300" />
            </button>

            <div className="relative p-4">
              {/* Icon and Title */}
              <div className="flex items-start space-x-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Github size={20} className="text-teal-400" />
                </div>
                <div className="flex-1 pr-6">
                  <h3 className="text-sm font-semibold text-slate-100 mb-1">
                    Repository Not Configured
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    File attachment requires a GitHub repository branch to be configured for this conversation.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-3">
                <button
                  onClick={() => {
                    setShowRepositoryConfigModal(false);
                    onAnswer({ answer: 'please configure a github repository branch for me' });
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 flex items-center space-x-1.5"
                >
                  <Github size={12} />
                  <span>New Branch</span>
                </button>

                <button
                  onClick={() => {
                    setShowRepositoryConfigModal(false);
                    onAnswer({ answer: 'Please, clone my existing github repository branch...' });
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 flex items-center space-x-1.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8z" />
                  </svg>
                  <span>Existing Branch</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
