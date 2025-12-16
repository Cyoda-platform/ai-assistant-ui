import React, { useEffect, useMemo } from 'react';
import { Plus, Activity, ExternalLink, Database, Github } from 'lucide-react';
import { message } from 'antd';
import type { Entity, Workflow, AppRoot } from '@/components/AppsCanvas/types/appSchema';

interface WorkflowWithEntity extends Workflow {
  entity_name: string;
  entity_version: string;
}

interface WorkflowsListProps {
  appId: string;
  appData: AppRoot; // AppRoot is the single source of truth
  onWorkflowClick: (workflowId: string, workflowData: any) => void;
  onWorkflowCreated?: (workflowId: string) => void;
  onAppDataUpdate?: (updatedAppData: AppRoot) => void; // Callback to update AppRoot
}

export const WorkflowsList: React.FC<WorkflowsListProps> = ({
  appId,
  appData,
  onWorkflowClick,
  onWorkflowCreated,
  onAppDataUpdate,
}) => {


  // Get workflows from entities (workflows are now nested in entity.workflows)
  const workflows = useMemo(() => {
    const allWorkflows: any[] = [];

    // Collect workflows from all entities
    if (appData.app.entities && Array.isArray(appData.app.entities)) {
      appData.app.entities.forEach((entity: any) => {
        if (entity.workflows && Array.isArray(entity.workflows)) {
          entity.workflows.forEach((workflow: any) => {
            allWorkflows.push({
              ...workflow,
              entity_name: entity.name,
              entity_version: entity.version
            });
          });
        }
      });
    }

    // Also check metadata workflows as fallback (for backward compatibility)
    const metadataWorkflows = (appData.app.metadata as any)?.workflows || [];
    if (metadataWorkflows.length > 0) {
      console.log('📋 WorkflowsList - Found workflows in metadata (legacy):', metadataWorkflows.length);
      allWorkflows.push(...metadataWorkflows);
    }

    console.log('📋 WorkflowsList - Total workflows from entities:', allWorkflows.length, allWorkflows.map((w: any) => w.name));
    return allWorkflows;
  }, [appData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + W to create new workflow
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        handleCreateWorkflow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateWorkflow = () => {
    try {
      let updatedAppData = { ...appData };

      // Create new workflow with default configuration
      const newWorkflow = {
        id: `workflow-new-${Date.now()}`,
        name: 'New Workflow',
        description: 'New workflow',
        cyoda_url: '',
        github_url: '',
        config: {
          states: {
            initial: {
              transitions: [
                {
                  target: 'processing',
                  trigger: 'start',
                  type: 'manual'
                }
              ]
            },
            processing: {
              transitions: [
                {
                  target: 'completed',
                  trigger: 'finish',
                  type: 'automated'
                }
              ]
            },
            completed: {
              transitions: []
            }
          }
        }
      };

      // Add workflow to metadata
      if (!updatedAppData.app.metadata) {
        updatedAppData.app.metadata = {};
      }
      if (!(updatedAppData.app.metadata as any).workflows) {
        (updatedAppData.app.metadata as any).workflows = [];
      }
      (updatedAppData.app.metadata as any).workflows.push(newWorkflow);

      console.log('✅ Workflow created:', newWorkflow);

      // Update AppRoot
      onAppDataUpdate?.(updatedAppData);

      message.success('New workflow created! Edit it and send to chat when ready.');

      // Generate workflow ID for navigation
      const workflowId = `workflow-${newWorkflow.name.toLowerCase().replace(/\s+/g, '-')}`;

      // Notify parent to navigate to editor
      if (onWorkflowCreated) {
        onWorkflowCreated(workflowId);
      }
    } catch (error: any) {
      console.error('Failed to create workflow:', error);
      const errorMessage = error?.message || 'Failed to create workflow. Please try again.';
      message.error({
        content: errorMessage,
        duration: 5,
      });
    }
  };

  const getStateCount = (workflow: WorkflowWithEntity) => {
    return workflow.config?.states ? Object.keys(workflow.config.states).length : 0;
  };

  const getTransitionCount = (workflow: WorkflowWithEntity) => {
    if (!workflow.config?.states) return 0;
    return Object.values(workflow.config.states).reduce((sum, state: any) => {
      return sum + (state.transitions?.length || 0);
    }, 0);
  };

  const getGitHubUrl = (workflow: WorkflowWithEntity) => {
    if (!workflow.github_url) return null;

    const owner = appData.app.metadata?.owner || 'Cyoda-platform';
    const repo = appData.app.metadata?.repository || 'mcp-cyoda-quart-app';
    const branch = appData.app.metadata?.branch || 'main';
    const filePath = workflow.github_url.replace(/^\.\//, '');

    return `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-6">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Activity size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Workflows</h3>
            <p className="text-xs text-gray-400">
              {workflows.length === 0 ? 'No workflows yet' : `${workflows.length} ${workflows.length === 1 ? 'workflow' : 'workflows'}`}
            </p>
          </div>
          <button
            onClick={handleCreateWorkflow}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-600 text-white transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
            title="Create new workflow and open editor"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Activity size={64} className="text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              Define Your Business Logic
            </h3>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Workflows orchestrate how your entities move through different states.
              Create workflows like <span className="text-purple-400 font-medium">Order Processing</span>, <span className="text-purple-400 font-medium">User Onboarding</span>, or <span className="text-purple-400 font-medium">Approval Flow</span>.
            </p>
            <p className="text-xs text-slate-500 mt-4">
              💡 Tip: Use the "Add Workflow" button above to create your first workflow
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 h-full">
            {workflows.map((workflow: any, index: number) => {
              return (
                <div
                  key={`${workflow.name}-${index}`}
                  onClick={() => onWorkflowClick(`workflow-${workflow.name.toLowerCase()}`, workflow)}
                  className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/50 rounded-xl pt-4 px-2 pb-2 hover:border-purple-500/50 cursor-pointer group h-48 flex flex-col flex-shrink-0"
                  style={{ width: '220px' }}
                >
                  <div className="flex items-start justify-between mb-2 flex-shrink-0">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="p-1 bg-purple-500/10 rounded group-hover:bg-purple-500/20 transition-colors flex-shrink-0">
                        <Activity size={14} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors text-sm truncate">
                        {workflow.name}
                      </h4>
                    </div>
                    <div className="w-2 h-2 rounded-full flex-shrink-0 ml-1 bg-purple-400" />
                  </div>

                  <p className="text-xs text-gray-400 mb-2 line-clamp-2 leading-tight flex-shrink-0">
                    {workflow.description || 'No description provided'}
                  </p>

                  <div className="flex-1 min-h-0" />

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-slate-700/50 flex-shrink-0 gap-1">
                    <div className="flex items-center space-x-1 min-w-0 text-xs">
                      <Activity size={10} className="text-gray-500 flex-shrink-0" />
                      <span className="truncate">{getStateCount(workflow)}s</span>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {getGitHubUrl(workflow) && (
                        <a
                          href={getGitHubUrl(workflow)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 bg-green-500/20 hover:bg-green-500/30 rounded transition-colors"
                          title="View on GitHub"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Github size={14} className="text-green-400 hover:text-green-300" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>



    </div>
  );
};

