import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X,
  Settings,
  Activity,
  Grid3X3,
  Search,
  Zap,
  Send,
  PaperclipIcon,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Plus,
  Lock,
  Unlock,
  Eye,
  FileText,
  Columns2,
  Network,
  Database,
  Code,
  RefreshCw,
  GitPullRequest,
  ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import ChatBotEditorWorkflowSimple from './ChatBotEditorWorkflowSimple';
import ChatBotEditorWorkflowNew from './ChatBotEditorWorkflowNew';
import MermaidDiagram from '../MermaidDiagram/MermaidDiagram';

import { useAppsTabsStore } from '@/stores/appsTabs';
import { AppsTabsContainer } from '@/components/AppsTabs';
import { Modal, Form, Input, InputNumber } from 'antd';
import SettingsDialog from '@/components/SettingsDialog/SettingsDialog';
import { AppsCanvas, samplePortalData } from '@/components/AppsCanvas';
import { EnvironmentEditor } from '@/components/EnvironmentEditor';
import { EntityEditor } from '@/components/EntityEditor';
import { RequirementEditor } from '@/components/RequirementEditor';
import { RequirementsList } from '@/components/RequirementsList';
import { EntitiesList } from '@/components/EntitiesList';
import { WorkflowsList } from '@/components/WorkflowsList';
import { useRepositoryStore } from '@/stores/repository';
import type { AppRoot } from '@/components/AppsCanvas/types/appSchema';
import type { GitHubRepositoryInfo } from '@/services/githubAppDataService';

interface ChatBotCanvasProps {
  messages: any[];
  isLoading: boolean;
  technicalId: string;
  githubRepository?: GitHubRepositoryInfo; // GitHub repository info for loading from GitHub
  onAnswer: (data: { answer: string; files?: File[] }) => void;
  onApproveQuestion: (data: any) => void;
  onUpdateNotification: (data: any) => void;
  onToggleCanvas: () => void;
  activeTab?: 'data' | 'workflow' | 'requirement' | 'code';
  onActiveTabChange?: (tab: 'data' | 'workflow' | 'requirement' | 'code') => void;
  triggerCanvasReload?: boolean; // Trigger to reload canvas data
  setTextareaContentCallback?: ((content: string, options?: { collapse?: boolean }) => void) | null; // Callback to set textarea content
}

type MarkdownMode = 'preview' | 'split' | 'edit';

const ChatBotCanvas: React.FC<ChatBotCanvasProps> = ({
  messages,
  isLoading,
  technicalId,
  githubRepository,
  onAnswer,
  onApproveQuestion,
  onUpdateNotification,
  onToggleCanvas,
  activeTab: externalActiveTab,
  onActiveTabChange,
  triggerCanvasReload = false,
  setTextareaContentCallback
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'data' | 'workflow' | 'requirement' | 'code'>('requirement');
  const [isPulling, setIsPulling] = useState(false);
  const [isLoadingAppData, setIsLoadingAppData] = useState(false);

  // Use external activeTab if provided, otherwise use internal state
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;

  // Handle tab change - call external handler if provided, otherwise use internal state
  const handleTabChange = useCallback((tab: 'data' | 'workflow' | 'requirement' | 'code') => {
    // Clear navigation context when switching tabs to avoid stale data
    setNavigationContext(null);
    if (onActiveTabChange) {
      onActiveTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  }, [onActiveTabChange]);

  // Handle Pull button click
  const handlePull = useCallback(async () => {
    if (!technicalId) {
      console.warn('⚠️ Cannot pull: missing conversation ID');
      return;
    }

    setIsPulling(true);
    try {
      console.log('🔄 Pulling changes from repository...');

      // Call the /pull endpoint
      const response = await fetch('/api/v1/repository/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: technicalId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to pull repository');
      }

      const result = await response.json();
      console.log('✅ Pull complete:', result.message);

      // Clear cache and reload repository data after successful pull
      const { clearCache, loadRepository } = useRepositoryStore.getState();
      clearCache(technicalId);

      if (githubRepository) {
        await loadRepository(technicalId, githubRepository);
      }

      // Trigger reload of app data
      setShouldReloadAppData(true);
    } catch (error) {
      console.error('❌ Pull failed:', error);
      // TODO: Show error notification to user
    } finally {
      setIsPulling(false);
    }
  }, [githubRepository, technicalId]);

  // Get active app tab to extract app ID
  const { getActiveTab: getActiveAppTab } = useAppsTabsStore();

  // State for navigation context (what entity/environment/workflow to show)
  const [navigationContext, setNavigationContext] = useState<{
    targetId: string;
    targetType: string;
    data?: any;
  } | null>(null);

  // Load repository data when canvas opens (for any tab, not just apps)
  useEffect(() => {
    if (!technicalId || !githubRepository) return;

    const { getRepositoryData, loadRepository, updateLocalData } = useRepositoryStore.getState();
    const cachedData = getRepositoryData(technicalId);

    // Set up default updateAppData function if not already set
    if (!hasSetupUpdateFnRef.current) {
      console.log('📝 ChatBotCanvas: Setting up default updateAppData function');
      setUpdateAppData(() => (newData: any) => {
        console.log('📝 ChatBotCanvas: Default updateAppData called');
        setCurrentAppData(newData);
        updateLocalData(technicalId, newData);
      });
      hasSetupUpdateFnRef.current = true;
    }

    if (cachedData) {
      const workflowCount = cachedData.app?.entities?.reduce((sum: number, e: any) => sum + (e.workflows?.length || 0), 0) || 0;
      console.log('📦 ChatBotCanvas: Using cached repository data', {
        entities: cachedData.app?.entities?.length || 0,
        workflows: workflowCount,
        requirements: cachedData.app?.requirements?.length || 0
      });
      setCurrentAppData(cachedData);
      setIsLoadingAppData(false);
    } else {
      console.log('🔄 ChatBotCanvas: Loading repository data');
      setIsLoadingAppData(true);
      // Load repository data (will be cached automatically)
      loadRepository(technicalId, githubRepository).then((data) => {
        const workflowCount = data?.app?.entities?.reduce((sum: number, e: any) => sum + (e.workflows?.length || 0), 0) || 0;
        console.log('✅ Repository data loaded:', {
          entities: data?.app?.entities?.length || 0,
          workflows: workflowCount,
          requirements: data?.app?.requirements?.length || 0
        });
        if (data) {
          setCurrentAppData(data);
        }
        setIsLoadingAppData(false);
      }).catch((error) => {
        console.error('❌ Error loading repository data:', error);
        setIsLoadingAppData(false);
      });
    }
  }, [technicalId, githubRepository]);

  // State to trigger app data reload when returning to apps tab
  const [shouldReloadAppData, setShouldReloadAppData] = useState(false);

  // State to hold current app data from AppsTabsContainer
  const [currentAppData, setCurrentAppData] = useState<any>(null);
  const [updateAppData, setUpdateAppData] = useState<((appData: any) => void) | null>(null);
  const hasSetupUpdateFnRef = useRef(false);

  // Subscribe to repository store cache changes to detect when data is loaded externally (e.g., from SSE hooks)
  const repositoryData = useRepositoryStore((state) =>
    technicalId ? state.cache[technicalId]?.data : null
  );

  // Update currentAppData when repository store cache changes (e.g., from SSE hook refresh)
  useEffect(() => {
    if (repositoryData && technicalId) {
      console.log('📊 ChatBotCanvas: Repository store cache updated, syncing currentAppData:', {
        technicalId,
        entities: repositoryData.app?.entities?.length || 0,
        entityNames: repositoryData.app?.entities?.map((e: any) => e.name) || []
      });
      setCurrentAppData(repositoryData);
    }
  }, [repositoryData, technicalId]);

  // Debug: log when currentAppData changes
  useEffect(() => {
    console.log('📊 currentAppData updated:', {
      hasData: !!currentAppData,
      entities: currentAppData?.app?.entities?.length || 0,
      workflows: currentAppData?.app?.workflows?.length || 0,
      requirements: currentAppData?.app?.requirements?.length || 0
    });
  }, [currentAppData]);

  // Watch for external trigger to reload canvas
  useEffect(() => {
    if (triggerCanvasReload) {
      console.log('🔄 External canvas reload triggered');
      setShouldReloadAppData(true);
    }
  }, [triggerCanvasReload]);

  // Watch for external activeTab changes (e.g., from canvas_tab hook) and clear navigation context
  useEffect(() => {
    if (externalActiveTab !== undefined) {
      console.log('🔄 External activeTab changed to:', externalActiveTab);
      // Clear navigation context to show the list view instead of detail view
      setNavigationContext(null);
    }
  }, [externalActiveTab]);

  // Handle shouldReloadAppData - reload from repository store when analyze/pull completes
  useEffect(() => {
    if (!shouldReloadAppData || !technicalId) return;

    console.log('🔄 Reloading app data after analyze/pull...');
    const { getRepositoryData } = useRepositoryStore.getState();
    const freshData = getRepositoryData(technicalId);

    if (!freshData) {
      console.warn('⏳ Fresh data not yet available, retrying in 500ms...');
      const timeout = setTimeout(() => {
        setShouldReloadAppData(true); // Retry
      }, 500);
      return () => clearTimeout(timeout);
    }

    console.log('✅ Refreshed app data:', {
      entities: freshData.app?.entities?.length || 0,
      workflows: freshData.app?.entities?.reduce((sum: number, e: any) => sum + (e.workflows?.length || 0), 0) || 0,
      requirements: freshData.app?.requirements?.length || 0
    });
    setCurrentAppData(freshData);

    // If viewing an entity detail, update the navigation context with fresh data
    if (navigationContext?.targetType === 'data' && navigationContext?.targetId) {
      const foundEntity = freshData.app?.entities?.find((e: any) => {
        const entityId = `entity-${e.name.toLowerCase()}-${e.version}`;
        return entityId === navigationContext.targetId;
      });
      if (foundEntity) {
        console.log('✅ Updated entity in navigation context:', foundEntity.name);
        console.log('✅ Updated entity model:', foundEntity.model);
        setNavigationContext({
          ...navigationContext,
          data: foundEntity
        });
      } else {
        console.warn('⚠️ Entity not found in fresh data:', navigationContext.targetId);
      }
    }

    // If viewing a workflow, clear navigation context to force reload
    // This is similar to closing/opening the canvas - it forces the workflow editor to remount
    if (navigationContext?.targetType === 'workflow' && navigationContext?.targetId) {
      console.log('🔄 Clearing navigation context to force workflow reload after analyze/pull');

      // Capture the current workflow ID before clearing
      const currentWorkflowId = navigationContext.targetId;
      const searchWorkflowName = currentWorkflowId.replace('workflow-', '').toLowerCase();

      // Clear navigation context to unmount the component
      setNavigationContext(null);

      // Re-open the workflow after a brief delay to allow the component to unmount
      setTimeout(() => {
        let foundWorkflow = null;

        // Search for the workflow in all entities
        for (const entity of freshData.app?.entities || []) {
          const workflow = entity.workflows?.find((w: any) => w.name && w.name.toLowerCase() === searchWorkflowName);
          if (workflow) {
            foundWorkflow = workflow;
            break;
          }
        }

        if (foundWorkflow) {
          console.log('✅ Re-opening workflow with fresh data:', foundWorkflow.name);
          setNavigationContext({
            targetId: currentWorkflowId,
            targetType: 'workflow',
            data: foundWorkflow
          });
        } else {
          console.warn('⚠️ Workflow not found in fresh data:', currentWorkflowId);
        }
      }, 100);
    }

    setShouldReloadAppData(false);
  }, [shouldReloadAppData, technicalId]);

  const [markdownContent, setMarkdownContent] = useState(`# Welcome to Canvas Markdown Editor

This editor supports **GitHub Flavored Markdown** with real-time preview and Mermaid diagrams!

## Example Workflow Diagram

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
\`\`\`

## Features

- ✅ **Real-time preview** in split mode
- ✅ **Mermaid diagrams** for flowcharts, sequence diagrams, and more
- ✅ **Syntax highlighting** for code blocks
- ✅ **Three viewing modes**: Edit, Split, Preview
- ✅ **Fullscreen support** (Ctrl+Shift+F)

## Code Example

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
};
\`\`\`

## More Mermaid Examples

### Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant User
    participant App
    participant API
    User->>App: Click button
    App->>API: Send request
    API-->>App: Return data
    App-->>User: Display result
\`\`\`

### Gantt Chart

\`\`\`mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements    :a1, 2024-01-01, 7d
    Design         :a2, after a1, 5d
    section Development
    Implementation :a3, after a2, 14d
    Testing       :a4, after a3, 7d
\`\`\`

> **Tip**: Switch between Edit, Split, and Preview modes using the buttons in the header!
`);
  const [workflowData, setWorkflowData] = useState('');
  const [markdownMode, setMarkdownMode] = useState<MarkdownMode>('split');
  const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Repository store (replaces app-config)
  const repositoryStore = useRepositoryStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to update local data (no backend persistence)
  const updateLocalData = useCallback((updatedAppData: AppRoot) => {
    try {
      console.log('💾 Updating local data for conversation:', technicalId);
      repositoryStore.updateLocalData(technicalId, updatedAppData);
      console.log('✅ Local data updated successfully');
    } catch (error) {
      console.error('❌ Failed to update local data:', error);
    }
  }, [technicalId, repositoryStore]);

  const handleSubmit = useCallback((content: string, files?: File[]) => {
    onAnswer({ answer: content, files });
  }, [onAnswer]);

  const handleMarkdownSubmit = useCallback(() => {
    if (markdownContent.trim()) {
      handleSubmit(markdownContent, attachedFiles);
      setAttachedFiles([]); // Clear files after submit
    }
  }, [markdownContent, attachedFiles, handleSubmit]);

  const handleFileAttach = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setAttachedFiles(Array.from(files));
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleWorkflowSubmit = useCallback(() => {
    if (workflowData.trim()) {
      handleSubmit(workflowData);
    }
  }, [workflowData, handleSubmit]);

  // Store workflow ID and entity ID for saving
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [currentWorkflowEntityId, setCurrentWorkflowEntityId] = useState<string | null>(null);

  const getMarkdownModeIcon = (mode: MarkdownMode) => {
    switch (mode) {
      case 'preview':
        return <Eye size={14} />;
      case 'split':
        return <Columns2 size={14} />;
      case 'edit':
        return <FileText size={14} />;
    }
  };

  const getMarkdownModeLabel = (mode: MarkdownMode) => {
    switch (mode) {
      case 'preview':
        return 'Preview';
      case 'split':
        return 'Split';
      case 'edit':
        return 'Edit';
    }
  };

  // Helper to get current app ID from navigation context or active app tab
  const getCurrentAppId = () => {
    // The technicalId prop is the chat ID, which is what we need for API calls
    // This is the most reliable source
    if (technicalId) {
      return technicalId;
    }

    // Fallback: try to get from navigation context data
    if (navigationContext?.data?.appId) {
      return navigationContext.data.appId;
    }

    // Last resort: try active app tab
    const activeAppTab = getActiveAppTab();
    if (activeAppTab) {
      return activeAppTab.technicalId;
    }

    console.warn('⚠️ No technicalId, navigation context, or active app tab found');
    return 'app-default'; // Fallback
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/95 backdrop-blur-sm overflow-hidden">
      {/* Canvas Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center space-x-2">
          <Activity size={18} className="text-teal-400" />
          <h3 className="font-semibold text-white translate-y-[20%]">Canvas</h3>
          <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full">Active</span>

          {/* GitHub Repository Link */}
          {githubRepository && (
            <a
              href={`https://github.com/${githubRepository.owner}/${githubRepository.repositoryName}/tree/${githubRepository.branch}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-purple-900/60 backdrop-blur-sm px-2 py-1 rounded-md border border-purple-700/50 hover:bg-purple-800/60 hover:border-purple-600/50 transition-all duration-200 group text-xs"
              title={`Open ${githubRepository.owner}/${githubRepository.repositoryName} (${githubRepository.branch}) on GitHub`}
            >
              <svg className="w-3 h-3 text-purple-300 group-hover:text-purple-200 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              <span className="text-purple-200 group-hover:text-purple-100 transition-colors font-medium">
                {githubRepository.owner}/{githubRepository.repositoryName}
              </span>
              <span className="text-purple-400 group-hover:text-purple-300 transition-colors">({githubRepository.branch})</span>
              <svg className="w-2.5 h-2.5 text-purple-400 group-hover:text-purple-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleCanvas}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Close Canvas"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Tabs - Single tier (no Application wrapper) */}
      <div className="border-b border-slate-700 bg-slate-800/30">
        {/* Resource Tabs - Reordered: App, Requirements, Entities, Workflows, Code */}
        <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {/* Spacer to push action buttons to the right */}
          <div className="flex-1" />

          {/* Pull button - always visible when canvas is open */}
          <button
            onClick={handlePull}
            disabled={isPulling || !technicalId}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title={!technicalId ? "Conversation not available" : "Pull latest changes from repository"}
          >
            {isPulling ? (
              <>
                <GitPullRequest size={12} className="animate-spin" />
                <span>Pulling...</span>
              </>
            ) : (
              <>
                <GitPullRequest size={12} />
                <span>Pull</span>
              </>
            )}
          </button>
          <button
            onClick={() => handleTabChange('requirement')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === 'requirement'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
            }`}
          >
            <FileText size={13} />
            <span>Requirements</span>
          </button>
          <button
            onClick={() => handleTabChange('data')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === 'data'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
            }`}
          >
            <Database size={13} />
            <span>Entities</span>
          </button>
          <button
            onClick={() => handleTabChange('workflow')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === 'workflow'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
            }`}
          >
            <Activity size={13} />
            <span>Workflows</span>
          </button>
          <button
            onClick={() => handleTabChange('code')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === 'code'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
            }`}
          >
            <Code size={13} />
            <span>Code</span>
          </button>
        </div>
      </div>

      {/* Canvas Content */}
      <div className="flex-1 relative overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        <div className="flex flex-col h-full w-full" style={{ minWidth: '800px' }}>
          {activeTab === 'data' ? (
          navigationContext?.targetId ? (
            // Show entity editor when an entity is selected
            <EntityEditor
              appId={getCurrentAppId()}
              entityId={navigationContext.targetId}
              entityData={(() => {
                // First, check if entity data was passed directly in navigation context (from hooks)
                if (navigationContext.data) {
                  console.log('📦 Using entity data from navigation context:', navigationContext.data);
                  return navigationContext.data;
                }
                // Otherwise, look up entity from currentAppData
                const foundEntity = currentAppData?.app?.entities?.find(e => {
                  const entityId = `entity-${e.name.toLowerCase()}-${e.version}`;
                  console.log('🔍 Comparing:', { entityId, targetId: navigationContext.targetId, match: entityId === navigationContext.targetId });
                  return entityId === navigationContext.targetId;
                });
                console.log('📦 Found entity:', foundEntity);
                console.log('📦 All entities:', currentAppData?.app?.entities);
                return foundEntity;
              })()}
              appData={currentAppData}
              onSendToChat={(message) => {
                // Copy entity content to chat textarea
                if (setTextareaContentCallback) {
                  setTextareaContentCallback(message);
                }
              }}
              onBack={() => {
                // Clear navigation context to return to entities list
                setNavigationContext(null);
              }}

            />
          ) : (
            // Show entities list when no entity is selected
            currentAppData ? (
              <EntitiesList
                appId={getCurrentAppId()}
                appData={currentAppData}
                onAppDataUpdate={async (updatedAppData) => {
                  console.log('📥 EntitiesList called onAppDataUpdate:', {
                    entities: updatedAppData.app.entities.length,
                    updatedAppData
                  });
                  // Update app data in AppsTabsContainer
                  if (updateAppData) {
                    updateAppData(updatedAppData);
                  } else {
                    console.warn('⚠️ updateAppData function is not available');
                  }
                  setCurrentAppData(updatedAppData);
                  console.log('✅ Updated currentAppData in ChatBotCanvas');

                  // Update local data
                  updateLocalData(updatedAppData);
                }}
                onEntityClick={(entityId) => {
                  // Find entity data and navigate to entity editor
                  const entity = currentAppData?.app?.entities?.find(e => {
                    const id = `entity-${e.name.toLowerCase()}-${e.version}`;
                    return id === entityId;
                  });
                  setNavigationContext({ targetId: entityId, targetType: 'data', data: entity });
                }}
                onEntityCreated={(entityId) => {
                  // Find entity data and navigate to the new entity
                  const entity = currentAppData?.app?.entities?.find(e => {
                    const id = `entity-${e.name.toLowerCase()}-${e.version}`;
                    return id === entityId;
                  });
                  setNavigationContext({ targetId: entityId, targetType: 'data', data: entity });
                }}
              />
            ) : !githubRepository ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">No repository configured</div>
                  <div className="text-xs text-gray-500">Configure a GitHub repository to view entities</div>
                </div>
              </div>
            ) : isLoadingAppData ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin mb-3">
                    <RefreshCw size={24} className="text-blue-400" />
                  </div>
                  <div className="text-gray-400">Loading entities...</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Database size={64} className="mx-auto mb-4 text-cyan-400" />
                  <h2 className="text-xl font-semibold text-slate-300 mb-2">
                    No entities found
                  </h2>
                  <p className="text-sm text-slate-400">
                    Create an entity to get started
                  </p>
                </div>
              </div>
            )
          )
        ) : activeTab === 'workflow' ? (
          // Show workflow editor when a workflow is selected, otherwise show list
          navigationContext?.targetId && navigationContext?.targetType === 'workflow' ? (
            <ChatBotEditorWorkflowNew
              key={`${navigationContext.targetId}-${JSON.stringify(navigationContext.data)}`}
              technicalId={`workflow_${navigationContext.targetId}`}
              modelName={navigationContext.data?.name || navigationContext.targetId.replace('workflow-', '')}
              modelVersion={navigationContext.data?.version || 1}
              workflowId={navigationContext.targetId}
              entityId={navigationContext.data?.entity_name && navigationContext.data?.entity_version
                ? `${navigationContext.data.entity_name}-${navigationContext.data.entity_version}`
                : undefined}
              appId={getCurrentAppId()}
              appData={currentAppData}
              workflowData={navigationContext.data}
              onAnswer={onAnswer}
              setTextareaContentCallback={setTextareaContentCallback}
              onBack={() => {
                // Clear navigation context to return to workflows list
                setNavigationContext(null);
                setCurrentWorkflowId(null);
                setCurrentWorkflowEntityId(null);
              }}
              onUpdate={async (data) => {
                console.log('🔄 Workflow updated:', data);

                // Update the workflow in AppRoot
                const workflowEntityId = navigationContext.data?.entity_name && navigationContext.data?.entity_version
                  ? `${navigationContext.data.entity_name}-${navigationContext.data.entity_version}`
                  : null;

                if (currentAppData && updateAppData && navigationContext.targetId && workflowEntityId) {
                  try {
                    // Parse the workflow data
                    const workflowData = JSON.parse(data.canvasData);

                    // Find the entity and workflow in AppRoot
                    const updatedAppData = { ...currentAppData };
                    const entity = updatedAppData.app.entities.find(
                      e => `${e.name}-${e.version}` === workflowEntityId
                    );

                    if (entity) {
                      // Find the workflow in the entity
                      const workflowIndex = entity.workflows.findIndex(
                        w => `workflow-${w.name}` === navigationContext.targetId
                      );

                      if (workflowIndex !== -1) {
                        // Update the workflow config
                        entity.workflows[workflowIndex] = {
                          ...entity.workflows[workflowIndex],
                          config: workflowData.configuration || workflowData.config || workflowData
                        };

                        // Update AppRoot
                        updateAppData(updatedAppData);
                        setCurrentAppData(updatedAppData);
                        console.log('✅ Workflow updated in AppRoot');

                        // Update local data
                        updateLocalData(updatedAppData);
                      }
                    }
                  } catch (error) {
                    console.error('❌ Failed to update workflow in AppRoot:', error);
                  }
                }
              }}
            />
          ) : (
            // Show workflows list when no workflow is selected
            currentAppData ? (
              <WorkflowsList
                appId={getCurrentAppId()}
                appData={currentAppData}
                onWorkflowClick={(workflowId, workflowData) => {
                  console.log('🧭 Navigating to workflow:', { workflowId, workflowData });
                  setCurrentWorkflowId(workflowId);

                  // Extract entity ID from workflow data
                  const entityId = workflowData?.entity_name && workflowData?.entity_version
                    ? `${workflowData.entity_name}-${workflowData.entity_version}`
                    : null;
                  setCurrentWorkflowEntityId(entityId);

                  // Set navigation context to show workflow editor
                  setNavigationContext({
                    targetId: workflowId,
                    targetType: 'workflow',
                    data: workflowData,
                  });
                }}
                onAppDataUpdate={async (updatedAppData) => {
                  console.log('📥 WorkflowsList called onAppDataUpdate');
                  if (updateAppData) {
                    updateAppData(updatedAppData);
                  }
                  setCurrentAppData(updatedAppData);
                  updateLocalData(updatedAppData);
                }}
              />
            ) : !githubRepository ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">No repository configured</div>
                  <div className="text-xs text-gray-500">Configure a GitHub repository to view workflows</div>
                </div>
              </div>
            ) : isLoadingAppData ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin mb-3">
                    <RefreshCw size={24} className="text-blue-400" />
                  </div>
                  <div className="text-gray-400">Loading workflows...</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Network size={64} className="mx-auto mb-4 text-blue-400" />
                  <h2 className="text-xl font-semibold text-slate-300 mb-2">
                    No workflows found
                  </h2>
                  <p className="text-sm text-slate-400">
                    Create a workflow to get started
                  </p>
                </div>
              </div>
            )
          )
        ) : activeTab === 'requirement' ? (
          navigationContext?.targetId ? (
            // Show requirement editor when a requirement is selected
            <RequirementEditor
              appId={getCurrentAppId()}
              requirementId={navigationContext.targetId}
              requirementData={currentAppData?.app.requirements?.find(r => r.id === navigationContext.targetId)}
              appData={currentAppData}
              onSendToChat={(message) => {
                // Copy requirement content to chat textarea
                if (setTextareaContentCallback) {
                  setTextareaContentCallback(message);
                }
              }}
              onBack={() => {
                // Clear navigation context to return to requirements list
                setNavigationContext(null);
              }}
            />
          ) : (
            // Show requirements list when no requirement is selected
            currentAppData ? (
              <RequirementsList
                appId={getCurrentAppId()}
                appData={currentAppData}
                onRequirementClick={(requirementId) => {
                  console.log('🧭 Navigating to requirement:', requirementId);
                  // Find requirement data by id
                  const requirement = currentAppData?.app?.requirements?.find(r => r.id === requirementId);
                  console.log('📦 Found requirement:', requirement);
                  setNavigationContext({ targetId: requirementId, targetType: 'requirement', data: requirement });
                }}
                onAppDataUpdate={async (updatedAppData) => {
                  console.log('📥 RequirementsList called onAppDataUpdate:', {
                    requirements: updatedAppData.app.requirements?.length || 0,
                    updatedAppData
                  });
                  // Update app data in AppsTabsContainer
                  if (updateAppData) {
                    updateAppData(updatedAppData);
                  } else {
                    console.warn('⚠️ updateAppData function is not available');
                  }
                  setCurrentAppData(updatedAppData);
                  console.log('✅ Updated currentAppData in ChatBotCanvas');

                  // Update local data
                  updateLocalData(updatedAppData);
                }}
                onRequirementCreated={(requirementId) => {
                  // No need to trigger reload - data is already updated
                }}
              />
            ) : !githubRepository ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">No repository configured</div>
                  <div className="text-xs text-gray-500">Configure a GitHub repository to view requirements</div>
                </div>
              </div>
            ) : isLoadingAppData ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin mb-3">
                    <RefreshCw size={24} className="text-blue-400" />
                  </div>
                  <div className="text-gray-400">Loading requirements...</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText size={64} className="mx-auto mb-4 text-teal-400" />
                  <h2 className="text-xl font-semibold text-slate-300 mb-2">
                    No requirements found
                  </h2>
                  <p className="text-sm text-slate-400">
                    Create a requirement to get started
                  </p>
                </div>
              </div>
            )
          )
        ) : activeTab === 'code' ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Code size={64} className="mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-slate-300 mb-2">
                Code Editor
              </h2>
              <p className="text-sm text-slate-400">
                Coming soon...
              </p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-slate-900/50 p-4">
            <div className="h-full flex flex-col">
              {/* Markdown Content Area */}
              <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Editor Panel - Show in edit and split modes */}
                {(markdownMode === 'edit' || markdownMode === 'split') && (
                  <div className={`flex flex-col ${markdownMode === 'split' ? 'flex-1' : 'w-full'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                        <FileText size={16} className="text-teal-400" />
                        <span>Editor</span>
                      </h4>
                    </div>
                    <div className="flex-1 bg-slate-800/80 rounded-lg border border-slate-600 p-4 backdrop-blur-sm flex flex-col">
                      <textarea
                        ref={textareaRef}
                        value={markdownContent}
                        onChange={(e) => setMarkdownContent(e.target.value)}
                        className="flex-1 w-full bg-transparent text-slate-300 placeholder-slate-500 resize-none focus:outline-none font-mono text-sm leading-relaxed scrollbar-thin"
                        placeholder="# Start writing your markdown here...

## Features
- Real-time preview
- Syntax highlighting
- Mermaid diagrams
- Export options

**Bold text** and *italic text* supported.

> Blockquotes for important notes

```javascript
// Code blocks with syntax highlighting
const example = 'Hello World';
```

```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```"
                      />
                    </div>
                  </div>
                )}

                {/* Preview Panel - Show in preview and split modes */}
                {(markdownMode === 'preview' || markdownMode === 'split') && (
                  <div className={`flex flex-col ${markdownMode === 'split' ? 'flex-1' : 'w-full'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                        <Eye size={16} className="text-teal-400" />
                        <span>Preview</span>
                      </h4>
                    </div>
                    <div className="flex-1 bg-slate-800/80 rounded-lg border border-slate-600 p-4 backdrop-blur-sm overflow-y-auto scrollbar-thin">
                      {markdownContent ? (
                        <div className="prose prose-invert prose-slate max-w-none prose-sm">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              // Custom code block renderer to handle Mermaid diagrams
                              code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const language = match ? match[1] : '';
                                const codeContent = String(children).replace(/\n$/, '');

                                // Handle Mermaid diagrams
                                if (language === 'mermaid' && !inline) {
                                  return (
                                    <div className="my-6">
                                      <MermaidDiagram chart={codeContent} />
                                    </div>
                                  );
                                }

                                // Handle other code blocks
                                if (!inline && match) {
                                  return (
                                    <div className="relative group">
                                      <pre className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 overflow-x-auto">
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    </div>
                                  );
                                }

                                // Inline code
                                return (
                                  <code className="bg-slate-900/50 px-1 py-0.5 rounded text-sm" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {markdownContent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-sm italic">
                          Start typing in the editor to see the preview...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-600 mt-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleFileAttach}
                    className="p-1.5 rounded-md hover:bg-slate-700 transition-colors text-slate-400 hover:text-white relative"
                    title="Attach File"
                  >
                    <PaperclipIcon size={14} />
                    {attachedFiles.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {attachedFiles.length}
                      </span>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {attachedFiles.length > 0 && (
                    <div className="flex items-center space-x-1">
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="flex items-center space-x-1 bg-slate-700 px-2 py-1 rounded text-xs">
                          <span className="text-slate-300">{file.name}</span>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="text-slate-400 hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-slate-500">
                    {markdownContent.length} characters
                  </span>
                </div>
                <button
                  onClick={handleMarkdownSubmit}
                  disabled={!markdownContent.trim()}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        visible={settingsDialogVisible}
        onClose={() => setSettingsDialogVisible(false)}
      />
    </div>
  );
};

export default ChatBotCanvas;
