import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Bell, Clock, Sparkles, Activity, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import LogoSmall from '@/assets/images/logo-small.svg';
import { useRepositoryStore } from '@/stores/repository';

interface Message {
  id?: string;
  type?: string;
  text: string | object;
  last_modified?: string;
  editable?: boolean;
  raw?: {
    background_task_id?: string;
    background_task_ids?: string[];
    hook?: any;
    [key: string]: any;
  };
}

interface ChatBotMessageNotificationProps {
  message: Message;
  onUpdateNotification: (data: any) => void;
  onOpenTaskPanel?: () => void;
  onOpenCanvas?: () => void;
  technicalId?: string;
  githubRepository?: any;
}

const ChatBotMessageNotification: React.FC<ChatBotMessageNotificationProps> = ({
  message,
  onUpdateNotification,
  onOpenTaskPanel,
  onOpenCanvas,
  technicalId,
  githubRepository
}) => {
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

  // Check hook type
  const hook = message.raw?.hook;
  const isBackgroundTask = !!message.raw?.background_task_ids || hook?.type === 'background_task' || (hook?.type === 'combined' && hook?.hooks?.some((h: any) => h.type === 'background_task'));
  const isCodeChanges = hook?.type === 'code_changes' || (hook?.type === 'combined' && hook?.hooks?.some((h: any) => h.type === 'code_changes'));

  // Debug logging
  console.log('🔍 ChatBotMessageNotification render:', {
    messageType: message.type,
    hasBackgroundTaskIds: !!message.raw?.background_task_ids,
    backgroundTaskIds: message.raw?.background_task_ids,
    hookType: hook?.type,
    isBackgroundTask,
    hasOnOpenTaskPanel: !!onOpenTaskPanel,
    messageId: message.id
  });

  // Handle canvas refresh for code changes
  const handleRefreshCanvas = async () => {
    if (!technicalId || !githubRepository) {
      console.warn('⚠️ Cannot refresh canvas: missing repository info or conversation ID');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('🔍 Refreshing canvas due to code changes...');
      const { clearCache, loadRepository } = useRepositoryStore.getState();
      clearCache(technicalId);
      await loadRepository(technicalId, githubRepository);
      console.log('✅ Canvas refresh complete');

      // Open canvas if callback provided
      if (onOpenCanvas) {
        onOpenCanvas();
      }
    } catch (error) {
      console.error('❌ Canvas refresh failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex justify-start mb-6 animate-fade-in-up">
      <div className="flex items-start space-x-3 w-full max-w-[95%]">
        {/* Notification Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
          <img src={LogoSmall} alt="CYODA" className="w-10 h-10" />
        </div>

        <div className="flex-1">
          {/* Notification Badge */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center space-x-1.5 bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-600">
              {isCodeChanges ? (
                <>
                  <RefreshCw size={12} className="text-cyan-400" />
                  <span className="text-xs font-medium text-slate-300">CODE CHANGES</span>
                </>
              ) : isBackgroundTask ? (
                <>
                  <Activity size={12} className="text-teal-400" />
                  <span className="text-xs font-medium text-slate-300">BACKGROUND TASK</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} className="text-pink-400" />
                  <span className="text-xs font-medium text-slate-300">CYODA NOTIFICATION</span>
                </>
              )}
            </div>
            {date && (
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Clock size={12} />
                <span>{date}</span>
              </div>
            )}
          </div>

          {/* Message Bubble */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl rounded-sharp-tl px-6 py-4 shadow-lg hover:shadow-xl hover:border-slate-600 transition-all duration-200">
            <div className="space-y-4">
              {/* Display the actual message content */}
              <MarkdownRenderer>
                {messageText}
              </MarkdownRenderer>

              {/* Action buttons container */}
              <div className="flex flex-wrap gap-3">
                {/* Show "Refresh Canvas" button for code changes */}
                {isCodeChanges && (
                  <button
                    onClick={handleRefreshCanvas}
                    disabled={isAnalyzing}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 border border-cyan-500/50 hover:border-cyan-500 rounded-lg text-cyan-300 hover:text-cyan-200 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span className="font-medium">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        <span className="font-medium">Refresh & Open Canvas</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                )}

                {/* Show "View Task Progress" button for background tasks */}
                {isBackgroundTask && onOpenTaskPanel && (
                  <button
                    onClick={() => {
                      console.log('🎯 View Task Progress button clicked');
                      onOpenTaskPanel();
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500 rounded-lg text-emerald-300 hover:text-emerald-200 transition-all duration-200 group"
                  >
                    <Activity size={16} />
                    <span className="font-medium">View Task Progress</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBotMessageNotification;
