import React, { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Bell, Clock, Sparkles, Activity, ArrowRight, RefreshCw, Loader2, Send } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import LogoSmall from '@/assets/images/logo-small.svg';
import { useRepositoryStore } from '@/stores/repository';
import StreamingDebugPanel from './StreamingDebugPanel';
import ResponseSeparator from './ResponseSeparator';
import { useAssistantStore } from '@/stores/assistant';
import { extractMarkdownOptions, MarkdownOptionsData } from '@/utils/markdownOptionsParser';

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
  onAnswer?: (data: any) => void;
  setTextareaContent?: (content: string) => void;
}

const ChatBotMessageNotification: React.FC<ChatBotMessageNotificationProps> = ({
  message,
  onUpdateNotification,
  onOpenTaskPanel,
  onOpenCanvas,
  technicalId,
  githubRepository,
  onAnswer,
  setTextareaContent
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [isSubmittingOptions, setIsSubmittingOptions] = useState<Record<string, boolean>>({});
  const assistantStore = useAssistantStore();

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

  // Parse markdown options from message text
  const markdownOptionsData = useMemo(() => {
    const extracted = extractMarkdownOptions(messageText);
    if (extracted.optionsData) {
      console.log('[ChatBotMessageNotification] Markdown options detected:', extracted.optionsData);
    }
    return extracted;
  }, [messageText]);

  // Clean message text without options formatting
  const cleanMessageText = useMemo(() => {
    return markdownOptionsData.cleanText || messageText;
  }, [markdownOptionsData, messageText]);

  // Check hook type
  const hook = message.raw?.hook;
  const isBackgroundTask = !!message.raw?.background_task_ids || hook?.type === 'background_task' || (hook?.type === 'combined' && hook?.hooks?.some((h: any) => h.type === 'background_task'));
  const isCodeChanges = hook?.type === 'code_changes' || (hook?.type === 'combined' && hook?.hooks?.some((h: any) => h.type === 'code_changes'));

  // Extract all option_selection hooks from combined hook or hooks array
  const optionSelectionHooks = useMemo(() => {
    const hooks: any[] = [];

    // First, check for markdown options and convert to hook format
    if (markdownOptionsData.optionsData) {
      hooks.push({
        data: {
          selection_type: markdownOptionsData.optionsData.type,
          options: markdownOptionsData.optionsData.options.map(opt => ({
            label: opt.label,
            value: opt.value
          })),
          question: 'Please select an option' // Default question
        },
        source: 'markdown'
      });
    }

    // Then check in main hook (for backwards compatibility)
    if (hook?.type === 'option_selection') {
      hooks.push({ ...hook, source: 'hook' });
    } else if (hook?.type === 'combined' && hook?.hooks) {
      hooks.push(...hook.hooks.filter((h: any) => h?.type === 'option_selection').map((h: any) => ({ ...h, source: 'hook' })));
    }

    // Also check in hooks array (plural)
    if (message.raw?.hooks) {
      message.raw.hooks.forEach((h: any) => {
        if (h?.type === 'option_selection') {
          hooks.push({ ...h, source: 'hook' });
        } else if (h?.type === 'combined' && h?.hooks) {
          hooks.push(...h.hooks.filter((subH: any) => subH?.type === 'option_selection').map((subH: any) => ({ ...subH, source: 'hook' })));
        }
      });
    }

    // Deduplicate hooks based on question + options signature
    const uniqueHooks: any[] = [];
    const seenSignatures = new Set<string>();

    hooks.forEach((h) => {
      // Create a signature based on question and option values
      const signature = JSON.stringify({
        question: h.data?.question,
        options: h.data?.options?.map((opt: any) => opt.value).sort(),
        selection_type: h.data?.selection_type
      });

      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        uniqueHooks.push(h);
      }
    });

    console.log('[ChatBotMessageNotification] Option selection hooks:', {
      total: hooks.length,
      unique: uniqueHooks.length,
      deduplicated: hooks.length - uniqueHooks.length,
      hasMarkdown: !!markdownOptionsData.optionsData
    });

    return uniqueHooks;
  }, [hook, message.raw?.hooks, markdownOptionsData.optionsData]);

  // Initialize selected options for each option selection hook
  useEffect(() => {
    optionSelectionHooks.forEach((optHook, index) => {
      const hookKey = `hook-${index}`;
      if (!selectedOptions[hookKey]) {
        // For single selection, initialize with first option
        if (optHook.data?.selection_type === 'single') {
          const firstOption = optHook.data?.options?.[0]?.value;
          if (firstOption) {
            setSelectedOptions(prev => ({ ...prev, [hookKey]: [firstOption] }));
          }
        } else {
          setSelectedOptions(prev => ({ ...prev, [hookKey]: [] }));
        }
      }
    });
  }, [optionSelectionHooks]);

  // Handle option toggle
  const handleToggleOption = (hookKey: string, optionValue: string, selectionType: string) => {
    setSelectedOptions(prev => {
      const currentSelections = prev[hookKey] || [];
      if (selectionType === 'single') {
        // Single selection - replace
        return { ...prev, [hookKey]: [optionValue] };
      } else {
        // Multiple selection - toggle
        if (currentSelections.includes(optionValue)) {
          return { ...prev, [hookKey]: currentSelections.filter(v => v !== optionValue) };
        } else {
          return { ...prev, [hookKey]: [...currentSelections, optionValue] };
        }
      }
    });
  };

  // Handle option submission
  const handleSubmitOptions = async (hookKey: string, optHook: any) => {
    if (!onAnswer || !setTextareaContent) return;

    const selected = selectedOptions[hookKey] || [];
    if (selected.length === 0) return;

    setIsSubmittingOptions(prev => ({ ...prev, [hookKey]: true }));

    try {
      // Build the message text from selected options
      const selectedLabels = selected
        .map(value => optHook.data?.options?.find((opt: any) => opt.value === value)?.label)
        .filter(Boolean);

      const messageText = selectedLabels.join(', ');

      // Place message in textarea for user to review and send
      setTextareaContent(messageText);

      console.log('✅ Option selected, placed in textarea:', messageText);
    } catch (error) {
      console.error('❌ Failed to submit options:', error);
    } finally {
      setIsSubmittingOptions(prev => ({ ...prev, [hookKey]: false }));
    }
  };

  // Debug logging
  console.log('🔍 ChatBotMessageNotification render:', {
    messageType: message.type,
    hasBackgroundTaskIds: !!message.raw?.background_task_ids,
    backgroundTaskIds: message.raw?.background_task_ids,
    hookType: hook?.type,
    isBackgroundTask,
    hasOnOpenTaskPanel: !!onOpenTaskPanel,
    messageId: message.id,
    optionSelectionHooksCount: optionSelectionHooks.length
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
    <div className="flex justify-start mb-6 animate-fade-in-up px-4 md:px-6 lg:px-8">
      <div className="flex items-start space-x-3 w-full max-w-6xl">
        {/* Notification Avatar */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
          <img src={LogoSmall} alt="CYODA" className="w-12 h-12" />
        </div>

        <div className="flex-1">
          {/* Notification Badge */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {isCodeChanges ? (
                <>
                  <RefreshCw size={12} className="text-blue-500" />
                  <span className="text-xs font-medium text-slate-600">Code Changes</span>
                </>
              ) : isBackgroundTask ? (
                <>
                  <Activity size={12} className="text-teal-600" />
                  <span className="text-xs font-medium text-slate-600">Background Task</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} className="text-blue-500" />
                  <span className="text-xs font-medium text-slate-600">Notification</span>
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
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md shadow-sm hover:shadow hover:border-slate-300 transition-all duration-200 px-4 py-3">
            <div className="space-y-4">
              {/* Display the actual message content */}
              <MarkdownRenderer>
                {cleanMessageText}
              </MarkdownRenderer>

              {/* Action buttons container */}
              <div className="flex flex-wrap gap-3">
                {/* Show "Refresh Canvas" button for code changes */}
                {isCodeChanges && (
                  <button
                    onClick={handleRefreshCanvas}
                    disabled={isAnalyzing}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg text-blue-700 hover:text-blue-800 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-lg text-emerald-700 hover:text-emerald-800 transition-all duration-200 group"
                  >
                    <Activity size={16} />
                    <span className="font-medium">View Task Progress</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Option Selection UI - Combine multiple hooks into a single element */}
          {optionSelectionHooks.length > 0 && (
            <div className="mt-4">
              <ResponseSeparator
                hookType="option_selection"
                label={optionSelectionHooks.length === 1 ? (optionSelectionHooks[0].data?.question || 'Options') : 'Options'}
              />
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
                {/* Render all hooks' options in a single container */}
                {optionSelectionHooks.map((optHook, index) => {
                  const hookKey = `hook-${index}`;
                  const currentSelected = selectedOptions[hookKey] || [];
                  const isSubmitting = isSubmittingOptions[hookKey] || false;

                  return (
                    <div key={hookKey} className="space-y-3">
                      {/* Question label for each hook (only if multiple hooks) */}
                      {optionSelectionHooks.length > 1 && (
                        <div className="text-sm font-medium text-slate-700">
                          {optHook.data?.question || `Question ${index + 1}`}
                        </div>
                      )}

                      {/* Context/Additional Info */}
                      {optHook.data?.context && (
                        <div className="text-sm text-slate-400 mb-3">
                          {optHook.data.context}
                        </div>
                      )}

                      {/* Options Grid */}
                      <div className="space-y-2">
                        <div className="grid gap-3">
                          {optHook.data?.options?.map((option: any) => (
                            <button
                              key={option.value}
                              onClick={() => handleToggleOption(hookKey, option.value, optHook.data?.selection_type || 'single')}
                              className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left ${
                                currentSelected.includes(option.value)
                                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                {/* Checkbox/Radio indicator */}
                                <div className={`mt-0.5 w-5 h-5 rounded-${optHook.data?.selection_type === 'single' ? 'full' : 'md'} border-2 flex items-center justify-center ${
                                  currentSelected.includes(option.value)
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-slate-300'
                                }`}>
                                  {currentSelected.includes(option.value) && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>

                                <div className="flex-1">
                                  <div className="text-sm font-medium">{option.label}</div>
                                  {option.description && (
                                    <div className="text-xs opacity-75 mt-1">{option.description}</div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Separator between hook sections (if multiple hooks) */}
                      {optionSelectionHooks.length > 1 && index < optionSelectionHooks.length - 1 && (
                        <div className="border-t border-slate-200 pt-3"></div>
                      )}
                    </div>
                  );
                })}

                {/* Single Select Button for all hooks */}
                <button
                  onClick={() => {
                    if (!setTextareaContent) return;

                    // Collect all selections from all hooks
                    const allSelections: string[] = [];

                    optionSelectionHooks.forEach((optHook, index) => {
                      const hookKey = `hook-${index}`;
                      const selected = selectedOptions[hookKey] || [];

                      // Get labels for selected values
                      const selectedLabels = selected
                        .map(value => optHook.data?.options?.find((opt: any) => opt.value === value)?.label)
                        .filter(Boolean) as string[];

                      allSelections.push(...selectedLabels);
                    });

                    // Combine all selections into a single message
                    const messageText = allSelections.join(', ');

                    // Place combined message in textarea
                    setTextareaContent(messageText);
                    console.log('✅ All options selected, placed in textarea:', messageText);
                  }}
                  disabled={Object.values(isSubmittingOptions).some(Boolean) || optionSelectionHooks.some((_, index) => (selectedOptions[`hook-${index}`] || []).length === 0)}
                  className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Send size={18} />
                  <span>Select</span>
                </button>
              </div>
            </div>
          )}

          {/* SSE Debug Panel - Show processing details from SSE events or debug history */}
          {(() => {
            const sseEvents = message.raw?.sse_events;
            const debugEvents = message.raw?.debug_history?.events;
            const hasEvents = (sseEvents?.length > 0) || (debugEvents?.length > 0);

            if (hasEvents) {
              console.log('[ChatBotMessageNotification] Rendering debug panel:', {
                hasSseEvents: !!sseEvents?.length,
                hasDebugEvents: !!debugEvents?.length,
                sseEventsCount: sseEvents?.length || 0,
                debugEventsCount: debugEvents?.length || 0
              });
            }

            return hasEvents && (
              <StreamingDebugPanel
                events={sseEvents || debugEvents || []}
                isComplete={true}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ChatBotMessageNotification;
