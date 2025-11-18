import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Bot, Clock, Sparkles, CheckCircle, Check, Plus, Loader2, Undo, RotateCcw, Search } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import { useTextResponsiveContainer } from '@/hooks/useTextResponsiveContainer';
import LogoSmall from '@/assets/images/logo-small.svg';
import apiService from '@/services/apiService';
import StreamingDebugPanel from './StreamingDebugPanel';
import { useRepositoryStore } from '@/stores/repository';

interface Message {
  id?: string;
  text: string | object;
  last_modified?: string;
  raw?: any;
  approve?: boolean;
  isCanvasQA?: boolean; // Mark Canvas QA messages for pink styling
}

interface ChatBotMessageQuestionProps {
  message: Message;
  isLoading: boolean;
  onApproveQuestion: (data: any) => void;
  onAddToCanvas?: (result: { id: string; type: string; data: any }) => void;
  onRollbackCanvasAI?: () => void; // Callback to rollback Canvas AI changes
  onRetryCanvasAI?: (messageId: string) => void; // Callback to retry Canvas AI request
  hasRollback?: boolean; // Whether there are Canvas AI changes to rollback
  technicalId?: string; // Conversation ID for canvas analysis
  onOpenCanvas?: () => void; // Callback to open canvas
}

const ChatBotMessageQuestion: React.FC<ChatBotMessageQuestionProps> = ({
  message,
  isLoading,
  onApproveQuestion,
  onAddToCanvas,
  onRollbackCanvasAI,
  onRetryCanvasAI,
  hasRollback = false,
  technicalId,
  onOpenCanvas
}) => {
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);
  const [isAddingToCanvas, setIsAddingToCanvas] = useState(false);
  const [addedToCanvas, setAddedToCanvas] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const messageText = useMemo(() => {
    const text = message.text;
    if (typeof text === 'object' && text !== null) {
      return JSON.stringify(text, null, 2);
    }
    return text;
  }, [message.text]);

  const date = useMemo(() => {
    if (!message.last_modified) return '';
    return dayjs(message.last_modified).format('HH:mm');
  }, [message.last_modified]);

  // Detect if message contains canvas analysis suggestion hook
  const canvasAnalysisHook = useMemo(() => {
    if (message.raw?.hook?.type === 'canvas_analysis_suggestion') {
      return message.raw.hook;
    }
    return null;
  }, [message.raw]);

  // Detect if message contains JSON with app/entity/workflow/environment data
  const canvasData = useMemo(() => {
    try {
      // Check if message has a hook in raw data (Canvas QA response)
      if (message.raw?.hook) {
        const hook = message.raw.hook;
        // Map hook types to canvas types
        const typeMap: Record<string, string> = {
          'entity_config': 'entity',
          'workflow_config': 'workflow',
          'app_config': 'app',
          'environment_config': 'environment',
          'requirement_config': 'requirement'
        };
        const canvasType = typeMap[hook.type] || 'entity';
        return { type: canvasType, data: hook.data, isCanvasHook: true };
      }

      let jsonData: any = null;

      // Try to extract JSON from markdown code blocks
      if (typeof message.text === 'string') {
        const jsonMatch = message.text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[1]);
        }
      } else if (typeof message.text === 'object') {
        jsonData = message.text;
      }

      if (!jsonData) return null;

      // Detect type based on JSON structure
      if (jsonData.programming_language && (jsonData.entities || jsonData.workflows || jsonData.environments)) {
        return { type: 'app', data: jsonData };
      } else if (jsonData.model && jsonData.name && jsonData.version) {
        return { type: 'entity', data: jsonData };
      } else if (jsonData.states && jsonData.entity_id) {
        return { type: 'workflow', data: jsonData };
      } else if (jsonData.url && jsonData.status) {
        return { type: 'environment', data: jsonData };
      }

      return null;
    } catch (error) {
      return null;
    }
  }, [message.text, message.raw]);

  // Get responsive container class for bot message (left-aligned)
  const containerInfo = useTextResponsiveContainer(messageText, {
    baseClass: 'text-responsive-container bot-message'
  });

  const onClickApproveQuestion = () => {
    setIsLoadingApprove(true);
    onApproveQuestion(message.raw);
    setTimeout(() => {
      setIsLoadingApprove(false);
    }, 2000);
  };

  const handleAnalyzeAndOpenCanvas = async () => {
    if (!canvasAnalysisHook || !technicalId) return;

    try {
      setIsAnalyzing(true);

      // Get repository info from hook data
      const hookData = canvasAnalysisHook.data;
      const repositoryName = hookData?.repository_name;

      if (!repositoryName) {
        console.error('No repository name in canvas analysis hook');
        return;
      }

      // Clear cache and load repository (triggers analysis)
      const { clearCache, loadRepository } = useRepositoryStore.getState();
      clearCache(technicalId);
      await loadRepository(technicalId, repositoryName);

      // Open canvas
      if (onOpenCanvas) {
        onOpenCanvas();
      }

      console.log('✅ Canvas analysis complete and canvas opened');
    } catch (error) {
      console.error('❌ Failed to analyze and open canvas:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddToCanvas = async () => {
    if (!message.id || !canvasData) return;

    try {
      setIsAddingToCanvas(true);

      // For Canvas AI responses with hooks, use the hook data directly
      if (canvasData.isCanvasHook && message.raw?.hook) {
        const hook = message.raw.hook;
        console.log('🔍 Hook data from message:', hook);
        console.log('🔍 Hook type:', hook.type);
        console.log('🔍 Hook data keys:', Object.keys(hook.data || {}));
        console.log('🔍 Hook data:', JSON.stringify(hook.data, null, 2));

        const result = {
          id: message.id || `canvas-${Date.now()}`,
          type: hook.type,
          data: hook.data
        };

        console.log('✅ Added to canvas:', result);
        setAddedToCanvas(true);

        // Notify parent component
        if (onAddToCanvas) {
          onAddToCanvas(result);
        }

        // Show success for 2 seconds
        setTimeout(() => {
          setAddedToCanvas(false);
        }, 2000);
      } else {
        // Legacy flow: Call API to create from chat (for non-Canvas AI messages)
        // Get current app ID from localStorage if needed
        let appId: string | undefined;
        if (canvasData.type !== 'app') {
          const appData = JSON.parse(localStorage.getItem('appData') || '{}');
          appId = appData.app?.id;
        }

        const result = await apiService.createFromChat(
          message.id,
          canvasData.type as 'app' | 'entity' | 'workflow' | 'environment',
          appId
        );

        console.log('✅ Added to canvas:', result);
        setAddedToCanvas(true);

        // Notify parent component
        if (onAddToCanvas) {
          onAddToCanvas(result);
        }

        // Show success for 2 seconds
        setTimeout(() => {
          setAddedToCanvas(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to add to canvas:', error);
    } finally {
      setIsAddingToCanvas(false);
    }
  };

  return (
    <div className="flex justify-start mb-6 animate-fade-in-up">
      <div className="flex items-start space-x-3 w-full max-w-[95%]">
        {/* AI Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
          <img src={LogoSmall} alt="CYODA" className="w-10 h-10" />
        </div>

        <div className="flex-1">
          {/* AI Badge */}
          <div className="flex items-center space-x-2 mb-2">
            <div className={`flex items-center space-x-1.5 backdrop-blur-sm px-3 py-1 rounded-full border ${
              message.isCanvasQA
                ? 'bg-purple-900/30 border-purple-500/40'
                : 'bg-slate-800/50 border-slate-600'
            }`}>
              <Sparkles size={12} className={message.isCanvasQA ? 'text-purple-400' : 'text-teal-400'} />
              <span className="text-xs font-medium text-slate-300">
                {message.isCanvasQA ? 'CANVAS AI' : 'CYODA AI'}
              </span>
            </div>
            {date && (
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Clock size={12} />
                <span>{date}</span>
              </div>
            )}
          </div>

          {/* Message Bubble - Left aligned bot message */}
          <div className={`${containerInfo.className} relative group ${message.approve || canvasData || canvasAnalysisHook ? 'pb-12' : ''} !rounded-3xl ${
            message.isCanvasQA ? 'canvas-qa-question' : ''
          }`}>
            <MarkdownRenderer>
              {messageText}
            </MarkdownRenderer>

            {/* Canvas Analysis Suggestion Button - Bottom Left */}
            {canvasAnalysisHook && (
              <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                <button
                  onClick={handleAnalyzeAndOpenCanvas}
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-full transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center space-x-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                  title="Analyze repository and open canvas to visualize entities, workflows, and requirements"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm font-medium">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      <span className="text-sm font-medium">Analyze & Open Canvas</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Canvas AI Action Buttons Container - Bottom Left */}
            {canvasData && (
              <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                {/* Add to Canvas Button */}
                <button
                  onClick={handleAddToCanvas}
                  disabled={isAddingToCanvas || addedToCanvas}
                  className={`px-4 py-2 rounded-full transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center space-x-2 ${
                    addedToCanvas
                      ? 'bg-green-500 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
                  }`}
                  title={addedToCanvas ? 'Added to canvas' : `Add ${canvasData.type} to canvas`}
                >
                  {isAddingToCanvas ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm font-medium">Adding...</span>
                    </>
                  ) : addedToCanvas ? (
                    <>
                      <Check size={16} />
                      <span className="text-sm font-medium">Added!</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span className="text-sm font-medium">Add to Canvas</span>
                    </>
                  )}
                </button>

                {/* Rollback Button - Only show for Canvas AI messages if there's something to rollback */}
                {message.isCanvasQA && hasRollback && onRollbackCanvasAI && (
                  <button
                    onClick={onRollbackCanvasAI}
                    className="p-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                    title="Undo Canvas AI changes"
                  >
                    <Undo size={16} />
                  </button>
                )}

                {/* Retry Button - Only show for Canvas AI messages */}
                {message.isCanvasQA && message.id && onRetryCanvasAI && (
                  <button
                    onClick={() => onRetryCanvasAI(message.id!)}
                    className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                    title="Retry Canvas AI request"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Approve Button - Bottom Right Corner */}
            {message.approve && (
              <button
                onClick={onClickApproveQuestion}
                disabled={isLoading || isLoadingApprove}
                className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center"
                title="Approve this response"
              >
                {isLoadingApprove ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
              </button>
            )}
          </div>

          {/* SSE Debug Panel - Show processing details */}
          {message.raw?.sse_events && message.raw.sse_events.length > 0 && (
            <StreamingDebugPanel
              events={message.raw.sse_events}
              isComplete={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBotMessageQuestion;
