import React, { useState, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import { Bot, Clock, Sparkles, CheckCircle, Check, Plus, Loader2, Undo, RotateCcw, Search, Send } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import ResponseSeparator from './ResponseSeparator';
import DeploymentOptionsUI from './DeploymentOptionsUI';
import { useTextResponsiveContainer } from '@/hooks/useTextResponsiveContainer';
import LogoSmall from '@/assets/images/logo-small.svg';
import apiService from '@/services/apiService';
import StreamingDebugPanel from './StreamingDebugPanel';
import { useRepositoryStore } from '@/stores/repository';
import { useAssistantStore } from '@/stores/assistant';
interface Message {
  id?: string;
  text: string | object;
  last_modified?: string;
  raw?: any;
  approve?: boolean;
  isCanvasQA?: boolean; // Mark Canvas QA messages for pink styling
  hook_message?: string; // Separated hook message from agent response
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
  hasRepository?: boolean; // Whether a repository is configured (canvas is available)
  onAnswer?: (data: { answer: string; files?: File[]; mode?: 'workflow' | 'qa' }) => void; // Callback to send messages
  onOpenTaskPanel?: () => void; // Callback to open task panel
  setTextareaContent?: (content: string, options?: { collapse?: boolean }) => void; // Callback to set textarea content without sending
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
  onOpenCanvas,
  hasRepository = false,
  onAnswer,
  onOpenTaskPanel,
  setTextareaContent
}) => {
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [branchChoice, setBranchChoice] = useState<string>('new_branch');
  const [repositoryType, setRepositoryType] = useState<string>('public');
  const [language, setLanguage] = useState<string>('python');
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);

  const assistantStore = useAssistantStore();

  // Generic option selection state - for option_selection hook
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isSubmittingOptions, setIsSubmittingOptions] = useState(false);

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

  // Detect if message contains canvas open hook (for new repository setup)
  const canvasOpenHook = useMemo(() => {
    if (message.raw?.hook?.type === 'canvas_open') {
      return message.raw.hook;
    }
    return null;
  }, [message.raw]);

  // Helper function to extract hooks from combined hook
  const extractHooksFromCombined = (hook: any) => {
    if (hook?.type === 'combined' && Array.isArray(hook.hooks)) {
      return hook.hooks;
    }
    return [hook];
  };

  // Extract individual hooks from combined hook if present
  const allHooks = useMemo(() => {
    const hooks = extractHooksFromCombined(message.raw?.hook);
    if (message.raw?.hook) {
      console.log('🎣 All hooks detected:', hooks);
    }
    return hooks;
  }, [message.raw?.hook]);

  // Detect if message contains repository config selection hook
  const repoConfigHook = useMemo(() => {
    // Check top-level hook first
    if (message.raw?.hook?.type === 'repository_config_selection') {
      const hook = message.raw.hook;

      // WORKAROUND: Cyoda's JSON serialization converts the options object to an array
      // Handle both formats: object (correct) and array (from Cyoda)
      let normalizedHook = { ...hook };

      if (hook.data?.options && Array.isArray(hook.data.options) && hook.data.options.length > 0) {
        // Convert array back to object
        console.log('🎣 Fixing Cyoda serialization bug: converting options array to object');
        normalizedHook = {
          ...hook,
          data: {
            ...hook.data,
            options: hook.data.options[0] // Extract the first (and only) element
          }
        };
      }

      console.log('🎣 Repository config hook (normalized):', normalizedHook);
      return normalizedHook;
    }

    // Check in allHooks (for combined hooks)
    const hook = allHooks.find((h: any) => h?.type === 'repository_config_selection');
    if (hook) {
      console.log('🎣 Repository config hook found in allHooks:', hook);
      return hook;
    }

    return null;
  }, [message.raw, allHooks]);

  // Detect if message contains option selection hook (from combined or top-level)
  const optionSelectionHook = useMemo(() => {
    // First check if it's a top-level option_selection hook
    if (message.raw?.hook?.type === 'option_selection') {
      console.log('[ChatBotMessageQuestion] Option selection hook detected (top-level):', message.raw.hook);
      console.log('[ChatBotMessageQuestion] Options structure:', message.raw.hook.data?.options);
      return message.raw.hook;
    }
    // Otherwise, extract from allHooks (for combined hooks)
    const hook = allHooks.find((h: any) => h?.type === 'option_selection');
    if (hook) {
      console.log('[ChatBotMessageQuestion] Option selection hook detected (from allHooks):', hook);
      console.log('[ChatBotMessageQuestion] Options structure:', hook.data?.options);
    }
    return hook || null;
  }, [message.raw, allHooks]);

  // Detect if message contains deployment options hook
  const deploymentOptionsHook = useMemo(() => {
    if (message.raw?.hook?.type === 'deployment_options') {
      return message.raw.hook;
    }
    return null;
  }, [message.raw]);

  // DEPRECATED: canvas_with_proceed hook is no longer used
  // Agent should use open_canvas_tab hook dynamically instead

  // Detect if message contains canvas_tab hook
  const canvasTabHook = useMemo(() => {
    if (message.raw?.hook?.type === 'canvas_tab') {
      return message.raw.hook;
    }
    return null;
  }, [message.raw]);

  // Detect if message contains code_changes hook
  const codeChangesHook = useMemo(() => {
    if (message.raw?.hook?.type === 'code_changes') {
      console.log('[ChatBotMessageQuestion] Code changes hook detected:', message.raw.hook);
      return message.raw.hook;
    }
    return null;
  }, [message.raw]);

  // Find specific hook types from all hooks
  const backgroundTaskHook = useMemo(() => {
    const hook = allHooks.find((h: any) => h?.type === 'background_task');
    if (hook) {
      console.log('[ChatBotMessageQuestion] Background task hook detected:', hook);
    }
    return hook;
  }, [allHooks]);

  const deploymentHook = useMemo(() => {
    return allHooks.find((h: any) => h?.type === 'deployment_options');
  }, [allHooks]);

  // Initialize selected options when hook is detected
  useEffect(() => {
    if (optionSelectionHook) {
      const options = optionSelectionHook.data?.options || [];
      console.log('[ChatBotMessageQuestion] All options:', options);

      // Group options by position (assuming 6 options: 2 branch, 2 repo, 2 language)
      // Or by group property if available
      let branchOptions, repoOptions, langOptions;

      if (options.length > 0 && options[0].group) {
        // Group by 'group' property
        branchOptions = options.filter((opt: any) => opt.group === 'branch');
        repoOptions = options.filter((opt: any) => opt.group === 'repository');
        langOptions = options.filter((opt: any) => opt.group === 'language');
      } else {
        // Group by position (first 2, middle 2, last 2)
        branchOptions = options.slice(0, 2);
        repoOptions = options.slice(2, 4);
        langOptions = options.slice(4, 6);
      }

      console.log('[ChatBotMessageQuestion] Grouped options:', { branchOptions, repoOptions, langOptions });

      // Set defaults: look for specific values or use first option
      const defaultBranch = branchOptions.find((opt: any) =>
        opt.value === 'new_branch' || opt.label?.toLowerCase().includes('new branch')
      ) || branchOptions[0];

      const defaultRepo = repoOptions.find((opt: any) =>
        opt.value === 'public' || opt.label?.toLowerCase().includes('public')
      ) || repoOptions[0];

      const defaultLang = langOptions.find((opt: any) =>
        opt.value === 'python' || opt.label?.toLowerCase().includes('python')
      ) || langOptions[0];

      setSelectedBranch(defaultBranch?.value || null);
      setSelectedRepo(defaultRepo?.value || null);
      setSelectedLanguage(defaultLang?.value || null);

      console.log('[ChatBotMessageQuestion] Initialized option selection with defaults:', {
        branch: defaultBranch?.value,
        repo: defaultRepo?.value,
        language: defaultLang?.value
      });
    }
  }, [optionSelectionHook]);

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

  const handleOpenCanvas = () => {
    if (!canvasOpenHook || !onOpenCanvas) return;

    console.log('🎨 Opening Canvas from canvas_open hook');

    // Simply open the canvas panel
    onOpenCanvas();
  };

  const handleSubmitRepoConfig = async () => {
    if (!repoConfigHook) return;

    // Build the configuration message
    const configMessage = `Branch: ${branchChoice}, Repository type: ${repositoryType}, Language: ${language}`;

    // Put the message in the textarea instead of sending directly
    if (setTextareaContent) {
      setTextareaContent(configMessage, { collapse: false });
      console.log('✅ Repository configuration placed in textarea:', { branchChoice, repositoryType, language });
    } else {
      // Fallback: send directly if setTextareaContent is not available
      console.warn('⚠️ setTextareaContent not available, sending directly');
      if (onAnswer) {
        try {
          setIsSubmittingConfig(true);
          onAnswer({ answer: configMessage });
          console.log('✅ Repository configuration submitted:', { branchChoice, repositoryType, language });
        } catch (error) {
          console.error('Failed to submit repository configuration:', error);
        } finally {
          setIsSubmittingConfig(false);
        }
      }
    }
  };

  const handleSelectOption = (value: string, group: string) => {
    // Radio button logic: select one option per group
    if (group === 'branch') {
      setSelectedBranch(value);
    } else if (group === 'repository') {
      setSelectedRepo(value);
    } else if (group === 'language') {
      setSelectedLanguage(value);
    }
  };

  // Helper to get grouped options
  const getGroupedOptions = () => {
    const options = optionSelectionHook?.data?.options || [];

    if (options.length === 0) {
      return { branch: [], repository: [], language: [] };
    }

    // Check if options have 'group' property
    if (options[0].group) {
      return {
        branch: options.filter((opt: any) => opt.group === 'branch'),
        repository: options.filter((opt: any) => opt.group === 'repository'),
        language: options.filter((opt: any) => opt.group === 'language')
      };
    }

    // Otherwise group by position (assuming 6 options: 2+2+2)
    return {
      branch: options.slice(0, 2),
      repository: options.slice(2, 4),
      language: options.slice(4, 6)
    };
  };

  const handleSubmitOptions = async () => {
    if (!optionSelectionHook || !selectedBranch || !selectedRepo || !selectedLanguage) return;

    // Find the selected option labels
    const options = optionSelectionHook.data?.options || [];
    const branchLabel = options.find((opt: any) => opt.value === selectedBranch)?.label || selectedBranch;
    const repoLabel = options.find((opt: any) => opt.value === selectedRepo)?.label || selectedRepo;
    const langLabel = options.find((opt: any) => opt.value === selectedLanguage)?.label || selectedLanguage;

    // Build the selection message
    const selectionMessage = `Branch: ${branchLabel}, Repository: ${repoLabel}, Language: ${langLabel}`;

    // Put the message in the textarea instead of sending directly
    if (setTextareaContent) {
      setTextareaContent(selectionMessage, { collapse: false });
      console.log('✅ Options placed in textarea:', { selectedBranch, selectedRepo, selectedLanguage, selectionMessage });
    } else {
      // Fallback: send directly if setTextareaContent is not available
      console.warn('⚠️ setTextareaContent not available, sending directly');
      if (onAnswer) {
        try {
          setIsSubmittingOptions(true);
          await onAnswer({ answer: selectionMessage });
          console.log('✅ Options submitted:', { selectedBranch, selectedRepo, selectedLanguage });
        } catch (error) {
          console.error('Failed to submit options:', error);
        } finally {
          setIsSubmittingOptions(false);
        }
      }
    }
  };

  const handleSelectDeploymentOption = async (option: string) => {
    if (!deploymentHook) {
      console.error('[Deployment] Missing deploymentHook', { deploymentHook });
      return;
    }

    // Find the selected option label
    const options = deploymentHook.data?.options || [];
    const selectedOption = options.find((opt: any) => opt.value === option);
    const optionLabel = selectedOption?.label || option;

    // Build the deployment message
    const deploymentMessage = `I choose: ${optionLabel}`;

    console.log('[Deployment] Preparing deployment option:', { option, optionLabel, deploymentMessage });

    // Put the message in the textarea instead of sending directly
    if (setTextareaContent) {
      setTextareaContent(deploymentMessage, { collapse: false });
      console.log('✅ Deployment option placed in textarea:', { option, optionLabel });
    } else {
      // Fallback: send directly if setTextareaContent is not available
      console.warn('⚠️ setTextareaContent not available, sending directly');
      if (onAnswer) {
        try {
          setIsSubmittingOptions(true);
          await onAnswer({ answer: deploymentMessage });
          console.log('✅ Deployment option selected:', { option, optionLabel });
        } catch (error) {
          console.error('Failed to submit deployment option:', error);
        } finally {
          setIsSubmittingOptions(false);
        }
      }
    }
  };

  // DEPRECATED: canvas_with_proceed handler removed - use open_canvas_tab hook dynamically instead



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
          <div className={`${containerInfo.className} relative group ${message.approve || canvasData || canvasAnalysisHook || canvasOpenHook || repoConfigHook || optionSelectionHook || deploymentHook || backgroundTaskHook || canvasTabHook || codeChangesHook ? 'pb-12' : ''} ${
            message.isCanvasQA ? 'canvas-qa-question' : ''
          }`}>
            <MarkdownRenderer>
              {messageText}
            </MarkdownRenderer>

            {/* Generic Option Selection UI */}
            {optionSelectionHook && (() => {
              const grouped = getGroupedOptions();
              return (
                <>
                  <ResponseSeparator
                    hookType="option_selection"
                    label={optionSelectionHook.data?.question || 'Options'}
                  />
                  <div className="space-y-6 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                    {/* Question/Instructions from AI */}
                    {optionSelectionHook.data?.question && (
                      <div className="text-sm text-slate-300 font-medium">
                        {optionSelectionHook.data.question}
                      </div>
                    )}
                    {/* Context/Additional Info */}
                    {optionSelectionHook.data?.context && (
                      <div className="text-sm text-slate-400">
                        {optionSelectionHook.data.context}
                      </div>
                    )}

                    {/* Section 1: Branch Strategy */}
                    {grouped.branch.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                          Branch Strategy
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {grouped.branch.map((option: any) => (
                            <button
                              key={option.value}
                              onClick={() => handleSelectOption(option.value, 'branch')}
                              className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left group ${
                                selectedBranch === option.value
                                  ? 'border-teal-500 bg-teal-500/20 text-teal-300 shadow-lg shadow-teal-500/20'
                                  : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:bg-slate-800/70'
                              }`}
                            >
                              <div className="flex items-start space-x-2">
                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  selectedBranch === option.value
                                    ? 'border-teal-500 bg-teal-500'
                                    : 'border-slate-500 group-hover:border-slate-400'
                                }`}>
                                  {selectedBranch === option.value && (
                                    <Check size={14} className="text-white" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
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
                    )}

                    {/* Divider */}
                    {grouped.branch.length > 0 && grouped.repository.length > 0 && (
                      <div className="h-px bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700"></div>
                    )}

                    {/* Section 2: Repository Type */}
                    {grouped.repository.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                          Repository Type
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {grouped.repository.map((option: any) => (
                            <button
                              key={option.value}
                              onClick={() => handleSelectOption(option.value, 'repository')}
                              className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left group ${
                                selectedRepo === option.value
                                  ? 'border-teal-500 bg-teal-500/20 text-teal-300 shadow-lg shadow-teal-500/20'
                                  : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:bg-slate-800/70'
                              }`}
                            >
                              <div className="flex items-start space-x-2">
                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  selectedRepo === option.value
                                    ? 'border-teal-500 bg-teal-500'
                                    : 'border-slate-500 group-hover:border-slate-400'
                                }`}>
                                  {selectedRepo === option.value && (
                                    <Check size={14} className="text-white" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
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
                    )}

                    {/* Divider */}
                    {grouped.repository.length > 0 && grouped.language.length > 0 && (
                      <div className="h-px bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700"></div>
                    )}

                    {/* Section 3: Programming Language */}
                    {grouped.language.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                          Programming Language
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {grouped.language.map((option: any) => (
                            <button
                              key={option.value}
                              onClick={() => handleSelectOption(option.value, 'language')}
                              className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left group ${
                                selectedLanguage === option.value
                                  ? 'border-teal-500 bg-teal-500/20 text-teal-300 shadow-lg shadow-teal-500/20'
                                  : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:bg-slate-800/70'
                              }`}
                            >
                              <div className="flex items-start space-x-2">
                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  selectedLanguage === option.value
                                    ? 'border-teal-500 bg-teal-500'
                                    : 'border-slate-500 group-hover:border-slate-400'
                                }`}>
                                  {selectedLanguage === option.value && (
                                    <Check size={14} className="text-white" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
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
                    )}

                    {/* Select Button */}
                    <button
                      onClick={handleSubmitOptions}
                      disabled={isSubmittingOptions || !selectedBranch || !selectedRepo || !selectedLanguage}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-2"
                    >
                      <Send size={18} />
                      <span>Select</span>
                    </button>
                  </div>
                </>
              );
            })()}

            {/* Deployment Options UI */}
            {deploymentHook && (
              <>
                <ResponseSeparator
                  hookType="deployment_options"
                  label={deploymentHook.data?.question || 'Deployment Options'}
                />
                <DeploymentOptionsUI
                  hook={deploymentHook}
                  onSelectOption={handleSelectDeploymentOption}
                  isSubmitting={isSubmittingOptions}
                />
              </>
            )}

            {/* Background Task Hook - View Tasks Button */}
            {backgroundTaskHook && (
              <>
                {console.log('[ChatBotMessageQuestion] Rendering background task hook UI')}
                <ResponseSeparator
                  hookType="background_task"
                  label={backgroundTaskHook.data?.task_name || 'Background Task'}
                />
                <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-slate-300">
                        {backgroundTaskHook.data?.task_name}
                      </div>
                      {backgroundTaskHook.data?.task_description && (
                        <div className="text-xs text-slate-400 mt-1">
                          {backgroundTaskHook.data.task_description}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        console.log('[View Tasks Button] Clicked, calling onOpenTaskPanel');
                        console.log('[View Tasks Button] onOpenTaskPanel function:', onOpenTaskPanel);
                        onOpenTaskPanel?.();
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 text-sm font-medium transition-all duration-200"
                    >
                      📊 View Tasks
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* DEPRECATED: canvas_with_proceed hook is no longer used */}

            {/* Canvas Tab Hook - Display notification that canvas tab is opening */}
            {canvasTabHook && (
              <>
                <ResponseSeparator
                  hookType="canvas_tab"
                  label="Canvas Tab"
                />
                <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🎨</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-300">
                        Opening Canvas Tab
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {canvasTabHook.data?.message || `Opening ${canvasTabHook.data?.tab_name} tab...`}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Code Changes Hook - Display button to open canvas */}
            {codeChangesHook && (
              <>
                <ResponseSeparator
                  hookType="code_changes"
                  label="Code Changes"
                />
                <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">📝</div>
                      <div>
                        <div className="text-sm font-medium text-slate-300">
                          Changes Committed
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {codeChangesHook.data?.commit_message || 'View changes in Canvas'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onOpenCanvas}
                      type="button"
                      className="px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 text-sm font-medium transition-all duration-200 whitespace-nowrap ml-4"
                    >
                      🎨 Open Canvas
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Repository Configuration Selection UI */}
            {repoConfigHook && (
              <>
                <ResponseSeparator
                  hookType="repository_config_selection"
                  label={repoConfigHook.data?.question || 'Repository Configuration'}
                />
                <div className="space-y-6 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">

                {/* Section 1: Branch Strategy */}
                {repoConfigHook.data?.options?.branch_choice && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                        Branch Strategy
                      </h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-slate-600 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {repoConfigHook.data?.options?.branch_choice?.choices?.map((choice: any) => (
                        <button
                          key={choice.value}
                          onClick={() => setBranchChoice(choice.value)}
                          className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left group ${
                            branchChoice === choice.value
                              ? 'border-teal-500 bg-teal-500/20 text-teal-300 shadow-lg shadow-teal-500/20'
                              : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              branchChoice === choice.value
                                ? 'border-teal-500 bg-teal-500'
                                : 'border-slate-500 group-hover:border-slate-400'
                            }`}>
                              {branchChoice === choice.value && (
                                <Check size={14} className="text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{choice.label}</div>
                              <div className="text-xs opacity-75 mt-1">{choice.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700"></div>

                {/* Section 2: Repository Type */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                      Repository Type
                    </h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-600 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {repoConfigHook.data?.options?.repository_type?.choices?.map((choice: any) => (
                      <button
                        key={choice.value}
                        onClick={() => setRepositoryType(choice.value)}
                        className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left group ${
                          repositoryType === choice.value
                            ? 'border-teal-500 bg-teal-500/20 text-teal-300 shadow-lg shadow-teal-500/20'
                            : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            repositoryType === choice.value
                              ? 'border-teal-500 bg-teal-500'
                              : 'border-slate-500 group-hover:border-slate-400'
                          }`}>
                            {repositoryType === choice.value && (
                              <Check size={14} className="text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{choice.label}</div>
                            <div className="text-xs opacity-75 mt-1">{choice.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700"></div>

                {/* Section 3: Programming Language */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                      Programming Language
                    </h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-600 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {repoConfigHook.data?.options?.language?.choices?.map((choice: any) => (
                      <button
                        key={choice.value}
                        onClick={() => setLanguage(choice.value)}
                        className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left group ${
                          language === choice.value
                            ? 'border-teal-500 bg-teal-500/20 text-teal-300 shadow-lg shadow-teal-500/20'
                            : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            language === choice.value
                              ? 'border-teal-500 bg-teal-500'
                              : 'border-slate-500 group-hover:border-slate-400'
                          }`}>
                            {language === choice.value && (
                              <Check size={14} className="text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{choice.label}</div>
                            <div className="text-xs opacity-75 mt-1">{choice.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select Button - places message in textarea for user to review and send */}
                <button
                  onClick={handleSubmitRepoConfig}
                  disabled={isSubmittingConfig}
                  className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-2"
                >
                  <Send size={18} />
                  <span>Select</span>
                </button>
              </div>
              </>
            )}

            {/* Canvas Open Button - Bottom Left (for new repository setup) */}
            {canvasOpenHook && (
              <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                <button
                  onClick={handleOpenCanvas}
                  className="px-4 py-2 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                  title="Open Canvas to visually design your requirements, entities, and workflows"
                >
                  <Sparkles size={16} />
                  <span className="text-sm font-medium">Open Canvas</span>
                </button>
              </div>
            )}

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
            {/* Only show Rollback and Retry buttons for Canvas AI messages */}
            {message.isCanvasQA && (hasRollback || message.id) && (onRollbackCanvasAI || onRetryCanvasAI) && (
              <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                {/* Rollback Button - Only show for Canvas AI messages if there's something to rollback */}
                {hasRollback && onRollbackCanvasAI && (
                  <button
                    onClick={onRollbackCanvasAI}
                    className="p-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                    title="Undo Canvas AI changes"
                  >
                    <Undo size={16} />
                  </button>
                )}

                {/* Retry Button - Only show for Canvas AI messages */}
                {message.id && onRetryCanvasAI && (
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

          {/* SSE Debug Panel - Show processing details from SSE events or debug history */}
          {(() => {
            const sseEvents = message.raw?.sse_events;
            const debugEvents = message.raw?.debug_history?.events;
            const hasEvents = (sseEvents?.length > 0) || (debugEvents?.length > 0);

            if (hasEvents) {
              console.log('[ChatBotMessageQuestion] Rendering debug panel:', {
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

export default ChatBotMessageQuestion;
