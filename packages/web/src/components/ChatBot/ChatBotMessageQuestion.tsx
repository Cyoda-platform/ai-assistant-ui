import React, { useState, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import { Bot, Clock, Sparkles, CheckCircle, Check, Plus, Loader2, Undo, RotateCcw, Search, Send, Info, Activity, Palette, Cloud, ArrowRight, Zap } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import ResponseSeparator from './ResponseSeparator';
import DeploymentOptionsUI from './DeploymentOptionsUI';
import HierarchicalOptionSelection from './HierarchicalOptionSelection';
import WizardOptionSelection from './WizardOptionSelection';
import { useTextResponsiveContainer } from '@/hooks/useTextResponsiveContainer';
import LogoSmall from '@/assets/images/logo-small.svg';
import apiService from '@/services/apiService';
import StreamingDebugPanel from './StreamingDebugPanel';
import { useRepositoryStore } from '@/stores/repository';
import { useAssistantStore } from '@/stores/assistant';
import { extractMarkdownOptions, MarkdownOptionsData } from '@/utils/markdownOptionsParser';
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
  onOpenEnvironmentPanel?: () => void; // Callback to open environment/cloud panel
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
  onOpenEnvironmentPanel,
  setTextareaContent
}) => {
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [branchChoice, setBranchChoice] = useState<string>('new_branch');
  const [repositoryType, setRepositoryType] = useState<string>('private');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<string>('python');
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);

  const assistantStore = useAssistantStore();

  // Generic option selection state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
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

  // Parse markdown options from message text
  const markdownOptionsData = useMemo(() => {
    const extracted = extractMarkdownOptions(messageText);
    if (extracted.optionsData) {
      console.log('[ChatBotMessageQuestion] Markdown options detected:', extracted.optionsData);
    }
    return extracted;
  }, [messageText]);

  // Clean message text without options formatting
  const cleanMessageText = useMemo(() => {
    return markdownOptionsData.cleanText || messageText;
  }, [markdownOptionsData, messageText]);

  // Detect if message contains UI function marker
  const hasUIFunctionMarker = useMemo(() => {
    return /\[ui-function:\s*\w+,\s*env:\s*https?:\/\/[^\]]+\]/.test(messageText);
  }, [messageText]);

  // Helper function to extract hooks from combined hook
  const extractHooksFromCombined = (hook: any) => {
    if (hook?.type === 'combined' && Array.isArray(hook.hooks)) {
      return hook.hooks;
    }
    return [hook];
  };

  // Extract individual hooks from combined hook if present
  const allHooks = useMemo(() => {
    console.log('[ChatBotMessageQuestion] Processing hooks - message.raw:', message.raw);
    const hooksFromSingleHook = extractHooksFromCombined(message.raw?.hook);
    console.log('[ChatBotMessageQuestion] Hooks from single hook:', hooksFromSingleHook.map((h: any) => h?.type));

    // Also check for hooks array (plural) at the same level
    const hooksArray = message.raw?.hooks;
    console.log('[ChatBotMessageQuestion] Hooks array exists?', !!hooksArray, 'Length:', hooksArray?.length);

    let allHooksArray: any[] = [];
    if (Array.isArray(hooksArray) && hooksArray.length > 0) {
      console.log('[ChatBotMessageQuestion] Found hooks array with', hooksArray.length, 'hooks:', hooksArray.map((h: any) => h?.type));
      // Include ALL hooks from the hooks array
      console.log('[ChatBotMessageQuestion] Including all hooks from hooks array');
      allHooksArray = [...hooksFromSingleHook, ...hooksArray];
      console.log('[ChatBotMessageQuestion] Merged allHooks:', allHooksArray.map((h: any) => h?.type));
    } else {
      allHooksArray = hooksFromSingleHook;
      console.log('[ChatBotMessageQuestion] Final allHooks (no hooks array):', allHooksArray.map((h: any) => h?.type));
    }

    // Deduplicate hooks based on type and key data to avoid rendering duplicates
    const uniqueHooks: any[] = [];
    const seenSignatures = new Set<string>();

    allHooksArray.forEach((h) => {
      if (!h?.type) return;

      // Create a signature based on hook type and key data
      let signature = '';
      if (h.type === 'option_selection') {
        signature = JSON.stringify({
          type: h.type,
          question: h.data?.question,
          options: h.data?.options?.map((opt: any) => opt.value).sort(),
          selection_type: h.data?.selection_type
        });
      } else if (h.type === 'canvas_open') {
        signature = JSON.stringify({
          type: h.type,
          repository_name: h.data?.repository_name,
          branch_name: h.data?.branch_name
        });
      } else {
        // For other hook types, use a simple JSON stringify
        signature = JSON.stringify(h);
      }

      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        uniqueHooks.push(h);
      }
    });

    if (allHooksArray.length !== uniqueHooks.length) {
      console.log('[ChatBotMessageQuestion] Deduplicated hooks:', {
        total: allHooksArray.length,
        unique: uniqueHooks.length,
        removed: allHooksArray.length - uniqueHooks.length
      });
    }

    return uniqueHooks;
  }, [message.raw?.hook, message.raw?.hooks]);

  // Detect if message contains canvas analysis suggestion hook
  const canvasAnalysisHook = useMemo(() => {
    if (message.raw?.hook?.type === 'canvas_analysis_suggestion') {
      return message.raw.hook;
    }
    // Also check in hooks array (from allHooks)
    const hook = allHooks.find((h: any) => h?.type === 'canvas_analysis_suggestion');
    return hook || null;
  }, [message.raw, allHooks]);

  // Detect if message contains canvas open hook (for new repository setup)
  const canvasOpenHook = useMemo(() => {
    console.log('[ChatBotMessageQuestion] Detecting canvas open hook...');
    console.log('[ChatBotMessageQuestion] Main hook type:', message.raw?.hook?.type);
    console.log('[ChatBotMessageQuestion] allHooks types:', allHooks.map((h: any) => h?.type));

    if (message.raw?.hook?.type === 'canvas_open') {
      console.log('[ChatBotMessageQuestion] ✅ Canvas open hook found in main hook');
      return message.raw.hook;
    }
    // Also check in hooks array (from allHooks)
    const hook = allHooks.find((h: any) => h?.type === 'canvas_open');
    if (hook) {
      console.log('[ChatBotMessageQuestion] ✅ Canvas open hook detected in hooks array:', hook);
      return hook;
    }
    console.log('[ChatBotMessageQuestion] ❌ No canvas open hook found');
    return null;
  }, [message.raw, allHooks]);

  // Detect if message contains repository config selection hook
  const repoConfigHook = useMemo(() => {
    // Check top-level hook first
    let hook = message.raw?.hook?.type === 'repository_config_selection' ? message.raw.hook : null;

    // If not found, check in allHooks array
    if (!hook) {
      hook = allHooks.find((h: any) => h?.type === 'repository_config_selection');
    }

    if (!hook) return null;

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
  }, [message.raw, allHooks]);

  // Detect if message contains option selection hook (from combined or top-level)
  const optionSelectionHook = useMemo(() => {
    // First check if it's a top-level option_selection hook
    if (message.raw?.hook?.type === 'option_selection') {
      return message.raw.hook;
    }
    // Otherwise, extract from allHooks (for combined hooks)
    const hook = allHooks.find((h: any) => h?.type === 'option_selection');
    if (hook) {
      console.log('[ChatBotMessageQuestion] Option selection hook detected:', hook);
    }
    return hook || null;
  }, [message.raw, allHooks]);

  // Combined option selection: prioritize markdown options over hooks
  const optionSelection = useMemo(() => {
    // Prefer markdown options over hooks
    if (markdownOptionsData.optionsData) {
      return {
        data: {
          selection_type: markdownOptionsData.optionsData.type,
          options: markdownOptionsData.optionsData.options.map(opt => ({
            label: opt.label,
            value: opt.value
          })),
          question: 'Please select an option' // Default question
        },
        source: 'markdown'
      };
    }
    // Fallback to hook if present
    if (optionSelectionHook) {
      return {
        data: optionSelectionHook.data,
        source: 'hook'
      };
    }
    return null;
  }, [markdownOptionsData.optionsData, optionSelectionHook]);

  // Detect if message contains deployment options hook
  const deploymentOptionsHook = useMemo(() => {
    if (message.raw?.hook?.type === 'deployment_options') {
      return message.raw.hook;
    }
    // Also check in allHooks array
    const hook = allHooks.find((h: any) => h?.type === 'deployment_options');
    return hook || null;
  }, [message.raw, allHooks]);

  // DEPRECATED: canvas_with_proceed hook is no longer used
  // Agent should use open_canvas_tab hook dynamically instead

  // Detect if message contains canvas_tab hook
  const canvasTabHook = useMemo(() => {
    if (message.raw?.hook?.type === 'canvas_tab') {
      return message.raw.hook;
    }
    // Also check in allHooks array
    const hook = allHooks.find((h: any) => h?.type === 'canvas_tab');
    return hook || null;
  }, [message.raw, allHooks]);

  // Detect if message contains code_changes hook
  const codeChangesHook = useMemo(() => {
    if (message.raw?.hook?.type === 'code_changes') {
      console.log('[ChatBotMessageQuestion] Code changes hook detected:', message.raw.hook);
      return message.raw.hook;
    }
    // Also check in allHooks array
    const hook = allHooks.find((h: any) => h?.type === 'code_changes');
    if (hook) {
      console.log('[ChatBotMessageQuestion] Code changes hook detected in hooks array:', hook);
    }
    return hook || null;
  }, [message.raw, allHooks]);

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

  // Detect if save_file_to_repository, retrieve_and_save_conversation_files, or clone_repository tool was called in SSE events
  const hasSaveFileToRepository = useMemo(() => {
    const sseEvents = message.raw?.sse_events;
    if (!sseEvents || !Array.isArray(sseEvents)) return false;

    // Check if any event is a tool_call or tool_response for file saving tools
    return sseEvents.some((event: any) => {
      if (event.type === 'tool_call' || event.type === 'tool_response') {
        const toolName = event.data?.tool_name || event.tool_name;
        return toolName === 'save_file_to_repository' ||
               toolName === 'retrieve_and_save_conversation_files' ||
               toolName === 'clone_repository';
      }
      return false;
    });
  }, [message.raw?.sse_events]);

  // Detect if generate_code_with_cli or generate_application tools were called in SSE events
  const hasBackgroundCodeGeneration = useMemo(() => {
    const sseEvents = message.raw?.sse_events;
    if (!sseEvents || !Array.isArray(sseEvents)) return false;

    // Check if any event is a tool_call for generate_code_with_cli or generate_application
    return sseEvents.some((event: any) => {
      if (event.type === 'tool_call' || event.type === 'tool_response') {
        const toolName = event.data?.tool_name || event.tool_name;
        return toolName === 'generate_code_with_cli' || toolName === 'generate_application';
      }
      return false;
    });
  }, [message.raw?.sse_events]);

  // Detect if set_repository_config tool was called in SSE events
  const hasRepositoryConfig = useMemo(() => {
    const sseEvents = message.raw?.sse_events;
    if (!sseEvents || !Array.isArray(sseEvents)) return false;

    return sseEvents.some((event: any) => {
      if (event.type === 'tool_call' || event.type === 'tool_response') {
        const toolName = event.data?.tool_name || event.tool_name;
        return toolName === 'set_repository_config';
      }
      return false;
    });
  }, [message.raw?.sse_events]);

  // Detect if deployment tools were called (show tasks panel)
  const hasDeploymentTools = useMemo(() => {
    const sseEvents = message.raw?.sse_events;
    if (!sseEvents || !Array.isArray(sseEvents)) return false;

    const deploymentTools = [
      'deploy_cyoda_environment',
      'deploy_user_application'
    ];

    return sseEvents.some((event: any) => {
      if (event.type === 'tool_call' || event.type === 'tool_response') {
        const toolName = event.data?.tool_name || event.tool_name;
        return deploymentTools.includes(toolName);
      }
      return false;
    });
  }, [message.raw?.sse_events]);

  // Detect if any environment tools were called (show cloud panel, excluding deployment tools)
  const hasEnvironmentTools = useMemo(() => {
    const sseEvents = message.raw?.sse_events;
    if (!sseEvents || !Array.isArray(sseEvents)) return false;

    const envTools = [
      'check_environment_exists',
      'get_deployment_status',
      'get_build_logs',
      'issue_technical_user',
      'list_environments',
      'describe_environment',
      'get_environment_metrics',
      'get_environment_pods',
      'delete_environment',
      'list_user_apps',
      'get_user_app_details',
      'scale_user_app',
      'restart_user_app',
      'update_user_app_image',
      'get_user_app_status',
      'get_user_app_metrics',
      'get_user_app_pods',
      'delete_user_app',
      'search_logs'
    ];

    return sseEvents.some((event: any) => {
      if (event.type === 'tool_call' || event.type === 'tool_response') {
        const toolName = event.data?.tool_name || event.tool_name;
        return envTools.includes(toolName);
      }
      return false;
    });
  }, [message.raw?.sse_events]);

  // Initialize selected options when options are detected (from markdown or hook)
  useEffect(() => {
    if (optionSelection) {
      // For single selection, initialize with first option or empty
      if (optionSelection.data?.selection_type === 'single') {
        const firstOption = optionSelection.data?.options?.[0]?.value;
        setSelectedOptions(firstOption ? [firstOption] : []);
      } else {
        // For multiple selection, start with empty
        setSelectedOptions([]);
      }
    }
  }, [optionSelection]);

  // Check if content should show "Read more" button
  useEffect(() => {
    if (contentRef.current) {
      // Approximate height for 10 lines: line-height * 10
      // Default line-height is typically 1.5em, and with text-sm (14px), that's about 21px per line
      const maxHeight = 21 * 10; // ~210px for 10 lines
      const contentHeight = contentRef.current.scrollHeight;
      setShowReadMore(contentHeight > maxHeight);
    }
  }, [cleanMessageText]);

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

  // Shared handler to pull repository and open canvas
  const handleOpenCanvasWithPull = async () => {
    if (!onOpenCanvas) return;

    console.log('🎨 Opening Canvas...');

    // Pull latest changes before opening canvas
    if (technicalId) {
      const { getRepositoryInfo, clearCache, loadRepository } = useRepositoryStore.getState();
      const repoInfo = getRepositoryInfo(technicalId);

      if (repoInfo) {
        console.log('🔄 Pulling latest changes before opening canvas...');
        try {
          clearCache(technicalId);
          await loadRepository(technicalId, repoInfo);
          console.log('✅ Repository synced successfully');
        } catch (error) {
          console.error('❌ Failed to sync repository:', error);
          // Continue to open canvas even if pull fails
        }
      }
    }

    // Open the canvas panel
    onOpenCanvas();
  };

  const handleOpenCanvas = () => {
    if (!canvasOpenHook) return;
    handleOpenCanvasWithPull();
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

  const handleToggleOption = (value: string) => {
    if (!optionSelection) return;

    const selectionType = optionSelection.data?.selection_type || 'single';

    if (selectionType === 'single') {
      // For single selection, replace the selection
      setSelectedOptions([value]);
    } else {
      // For multiple selection, toggle the option
      setSelectedOptions(prev =>
        prev.includes(value)
          ? prev.filter(v => v !== value)
          : [...prev, value]
      );
    }
  };

  const handleSubmitOptions = async (formattedData?: string) => {
    if (!optionSelection || selectedOptions.length === 0) return;

    // Use formatted data from wizard if provided, otherwise build from labels
    let selectionMessage: string;

    if (formattedData) {
      // Wizard provided formatted data with labels and values
      selectionMessage = formattedData;
    } else {
      // Fallback: Find the selected option labels for flat selection
      const options = optionSelection.data?.options || [];
      const selectedLabels = selectedOptions.map(value => {
        const option = options.find((opt: any) => opt.value === value);
        return option?.label || value;
      });
      selectionMessage = selectedLabels.join(', ');
    }

    // Put the message in the textarea instead of sending directly
    if (setTextareaContent) {
      setTextareaContent(selectionMessage, { collapse: false });
      console.log('✅ Options placed in textarea:', { selectedOptions, selectionMessage });
    } else {
      // If setTextareaContent is not available, don't send - just warn
      console.warn('⚠️ setTextareaContent not available, cannot place options in textarea');
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
          <div className={`${containerInfo.className} relative group ${
            (message.approve || canvasAnalysisHook || (message.isCanvasQA && (hasRollback || message.id))) && !canvasOpenHook ? 'pb-12' : ''
          } !rounded-3xl ${
            message.isCanvasQA ? 'canvas-qa-question' : ''
          }`}>
            {/* Only show message content if no UI function marker is present */}
            {!hasUIFunctionMarker && (
              <>
                <div
                  ref={contentRef}
                  className={`transition-all duration-300 ${
                    !isExpanded && showReadMore ? 'max-h-[210px] overflow-hidden relative' : ''
                  }`}
                  style={!isExpanded && showReadMore ? {
                    maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
                  } : {}}
                >
                  <MarkdownRenderer>
                    {cleanMessageText}
                  </MarkdownRenderer>
                </div>

                {/* Read More Button */}
                {showReadMore && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="group px-6 py-2.5 rounded-full bg-gradient-to-r from-slate-700/50 to-slate-800/50 hover:from-slate-600/60 hover:to-slate-700/60 border border-slate-600/50 hover:border-slate-500/70 text-slate-300 hover:text-slate-100 font-medium text-sm transition-all duration-300 shadow-lg hover:shadow-slate-500/20 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center space-x-2.5"
                    >
                      <svg
                        className={`w-4 h-4 transition-all duration-300 ${isExpanded ? 'rotate-180' : ''} group-hover:scale-110`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span>
                        {isExpanded ? 'Show less' : 'Read more'}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-all duration-300 ${isExpanded ? 'rotate-180' : ''} group-hover:scale-110`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Generic Option Selection UI (from markdown or hooks) */}
            {!hasUIFunctionMarker && optionSelection && (
              <>
                <ResponseSeparator
                  hookType="option_selection"
                  label={optionSelection.data?.question || 'Options'}
                />
                <div className="space-y-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                {/* Context/Additional Info */}
                {optionSelection.data?.context && (
                  <div className="text-sm text-slate-400 mb-3">
                    {optionSelection.data.context}
                  </div>
                )}

                {/* Check if this is the repository configuration wizard (ONLY these exact 8 options) */}
                {(() => {
                  const options = optionSelection.data?.options || [];
                  if (options.length !== 8) return false;

                  // Exact repository configuration labels (what users see)
                  const repoConfigLabels = [
                    'Python — Public repo — New Branch',
                    'Python — Public repo — My Existing Branch',
                    'Python — Private repo — New Branch',
                    'Python — Private repo — My Existing Branch',
                    'Java — Public repo — New Branch',
                    'Java — Public repo — My Existing Branch',
                    'Java — Private repo — New Branch',
                    'Java — Private repo — My Existing Branch'
                  ];

                  // Check if all 8 option labels match the repository config pattern
                  return options.every((opt: any) => repoConfigLabels.includes(opt.label));
                })() ? (
                  <>
                    {/* Wizard Option Selection - Progressive disclosure */}
                    <WizardOptionSelection
                      options={optionSelection.data.options}
                      selectedOptions={selectedOptions}
                      onToggleOption={handleToggleOption}
                      onSubmit={handleSubmitOptions}
                      isSubmitting={isSubmittingOptions}
                      selectionType={optionSelection.data?.selection_type || 'single'}
                    />
                  </>
                ) : (
                  <>
                    {/* Flat Option Selection (fallback) */}
                    <div className="space-y-2">
                      <div className="grid gap-3">
                        {optionSelection.data?.options?.map((option: any) => (
                          <button
                            key={option.value}
                            onClick={() => handleToggleOption(option.value)}
                            className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left ${
                              selectedOptions.includes(option.value)
                                ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                                : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              {/* Checkbox/Radio indicator */}
                              <div className={`mt-0.5 w-5 h-5 rounded-${optionSelection.data?.selection_type === 'single' ? 'full' : 'md'} border-2 flex items-center justify-center ${
                                selectedOptions.includes(option.value)
                                  ? 'border-teal-500 bg-teal-500'
                                  : 'border-slate-500'
                              }`}>
                                {selectedOptions.includes(option.value) && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>

                              <div className="flex-1">
                                <div className="text-sm font-medium">{option.label}</div>
                                {option.description && (
                                  <div className="text-xs opacity-75 mt-1 break-all">{option.description}</div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Select Button - places message in textarea for user to review and send */}
                    <button
                      onClick={() => handleSubmitOptions()}
                      disabled={isSubmittingOptions || selectedOptions.length === 0}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Send size={18} />
                      <span>Select</span>
                    </button>
                  </>
                )}
              </div>
              </>
            )}

            {/* Deployment Options UI */}
            {!hasUIFunctionMarker && deploymentHook && (
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

            {/* Background Code Generation Detection - View Tasks Button */}
            {hasBackgroundCodeGeneration && !backgroundTaskHook && (
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="flex flex-col space-y-4">
                  {/* Info Card */}
                  <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Info size={20} className="text-emerald-400" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h4 className="text-sm font-semibold text-emerald-300">Background Task Running</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Code generation is running in the background. Open the Task Panel to:
                        </p>
                        <ul className="text-xs text-slate-400 space-y-2 ml-1">
                          <li className="flex items-start space-x-2">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">Track progress:</span> Monitor real-time generation status</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        console.log('[View Background Tasks Button] Clicked, calling onOpenTaskPanel');
                        onOpenTaskPanel?.();
                      }}
                      className="px-6 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium"
                    >
                      <Sparkles size={20} />
                      <span className="text-sm">View Background Tasks</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Deployment Tools Detection - View Tasks Button */}
            {hasDeploymentTools && onOpenTaskPanel && (
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="flex flex-col space-y-4">
                  {/* Info Card */}
                  <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Info size={20} className="text-emerald-400" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h4 className="text-sm font-semibold text-emerald-300">Deployment in Progress</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Your application is being deployed. Open the Task Panel to:
                        </p>
                        <ul className="text-xs text-slate-400 space-y-2 ml-1">
                          <li className="flex items-start space-x-2">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">Track progress:</span> Monitor real-time deployment status</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        console.log('[View Deployment Tasks Button] Clicked, calling onOpenTaskPanel');
                        onOpenTaskPanel?.();
                      }}
                      className="px-6 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium"
                    >
                      <Sparkles size={20} />
                      <span className="text-sm">View Deployment Tasks</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Environment Tools Detection - Open Cloud Panel Button */}
            {hasEnvironmentTools && onOpenEnvironmentPanel && (
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="flex flex-col space-y-4">
                  {/* Info Card */}
                  <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Info size={20} className="text-emerald-400" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h4 className="text-sm font-semibold text-emerald-300">Ready to Manage Your Environments?</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Your cloud environments are waiting. Jump into the Cloud Panel to:
                        </p>
                        <ul className="text-xs text-slate-400 space-y-2 ml-1">
                          <li className="flex items-start space-x-2">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">View deployments:</span> Monitor all active environments and applications</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-teal-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">Check status:</span> Track deployment health and metrics</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">Manage credentials:</span> Issue and view technical user credentials</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-teal-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">Configure settings:</span> Update environment configurations</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        console.log('[Open Cloud Panel Button] Clicked, calling onOpenEnvironmentPanel');
                        onOpenEnvironmentPanel?.();
                      }}
                      className="px-6 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium"
                    >
                      <Sparkles size={20} />
                      <span className="text-sm">Go to Cloud Panel</span>
                    </button>
                  </div>
                </div>
              </div>
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
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-[200px]">
                      <div className="text-2xl flex-shrink-0">📝</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-300">
                          Changes Committed
                        </div>
                        <div className="text-xs text-slate-400 mt-1 break-words">
                          {codeChangesHook.data?.commit_message || 'View changes in Canvas'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleOpenCanvasWithPull}
                      type="button"
                      className="px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0"
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
                <div className="space-y-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">

                {/* Branch Choice Selection */}
                {repoConfigHook.data?.options?.branch_choice && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      {repoConfigHook.data?.options?.branch_choice?.label || 'Branch'}
                    </label>
                    <div className="flex gap-3">
                      {repoConfigHook.data?.options?.branch_choice?.choices?.map((choice: any) => (
                        <button
                          key={choice.value}
                          onClick={() => setBranchChoice(choice.value)}
                          className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                            branchChoice === choice.value
                              ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                              : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <div className="text-sm font-medium">{choice.label}</div>
                          <div className="text-xs opacity-75 mt-1">{choice.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repository Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    {repoConfigHook.data?.options?.repository_type?.label || 'Repository Type'}
                  </label>
                  <div className="flex gap-3">
                    {repoConfigHook.data?.options?.repository_type?.choices?.map((choice: any) => (
                      <button
                        key={choice.value}
                        onClick={() => setRepositoryType(choice.value)}
                        className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          repositoryType === choice.value
                            ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                            : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <div className="text-sm font-medium">{choice.label}</div>
                        <div className="text-xs opacity-75 mt-1">{choice.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Programming Language Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    {repoConfigHook.data?.options?.language?.label || 'Programming Language'}
                  </label>
                  <div className="flex gap-3">
                    {repoConfigHook.data?.options?.language?.choices?.map((choice: any) => (
                      <button
                        key={choice.value}
                        onClick={() => setLanguage(choice.value)}
                        className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          language === choice.value
                            ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                            : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <div className="text-sm font-medium">{choice.label}</div>
                        <div className="text-xs opacity-75 mt-1">{choice.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select Button - places message in textarea for user to review and send */}
                <button
                  onClick={handleSubmitRepoConfig}
                  disabled={isSubmittingConfig}
                  className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Send size={18} />
                  <span>Select</span>
                </button>
              </div>
              </>
            )}

            {/* Canvas Open Button - Bottom Left (for new repository setup) */}
            {canvasOpenHook && (
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="flex flex-col space-y-4">
                  {/* Info Card */}
                  <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-2xl p-5 backdrop-blur-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Info size={20} className="text-teal-400" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h4 className="text-sm font-semibold text-teal-300">Canvas - Your Visual Design Studio</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Open Canvas to visually design and manage your application:
                        </p>
                        <ul className="text-xs text-slate-400 space-y-2 ml-1">
                          <li className="flex items-start space-x-2">
                            <span className="text-teal-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">Requirements:</span> Define project features and user stories</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">Data Models:</span> Create and edit entities with drag-and-drop</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-teal-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">Workflows:</span> Design business logic flows visually</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">Code Generation:</span> Generate production-ready code from your designs</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleOpenCanvas}
                      className="px-6 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium"
                    >
                      <Sparkles size={20} />
                      <span className="text-sm">Open Canvas</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save File to Repository - Open Canvas to View */}
            {hasSaveFileToRepository && !canvasOpenHook && (
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="flex flex-col space-y-4">
                  {/* Info Card */}
                  <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Info size={20} className="text-emerald-400" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h4 className="text-sm font-semibold text-emerald-300">Files Saved to Repository</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Your files have been saved to the repository. Open Canvas to:
                        </p>
                        <ul className="text-xs text-slate-400 space-y-2 ml-1">
                          <li className="flex items-start space-x-2">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">View saved files:</span> See all uploaded documents and resources</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-teal-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">Edit and refine:</span> Make changes to your files</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">Generate artifacts:</span> Create entities and workflows from your files</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-teal-400 mt-0.5">•</span>
                            <span><span className="font-medium text-slate-300">Visualize structure:</span> Explore your project architecture</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleOpenCanvasWithPull}
                      className="px-6 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium"
                    >
                      <Sparkles size={20} />
                      <span className="text-sm">Open Canvas</span>
                    </button>
                  </div>
                </div>
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
