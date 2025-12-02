import React, { useEffect, useMemo } from 'react';
import { Plus, Activity, ExternalLink, Database } from 'lucide-react';
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

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Activity size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Workflows</h3>
            <p className="text-xs text-gray-400">
              {workflows.length === 0 ? 'No workflows yet' : `${workflows.length} ${workflows.length === 1 ? 'workflow' : 'workflows'}`}
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateWorkflow}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 group"
          title="Create new workflow and open editor"
        >
          <Plus size={16} />
          <span>Add Workflow</span>
        </button>
      </div>

      {/* Workflows Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {workflows.length === 0 ? (
          <div className="w-full max-w-2xl mx-auto text-center pt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 blur-3xl bg-purple-400/10 animate-pulse"></div>
                <Activity size={80} className="mx-auto text-purple-400/80 relative" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Define Your Business Logic
              </h2>
              <p className="text-gray-400 mb-2 leading-relaxed">
                Workflows orchestrate how your entities move through different states.
              </p>
              <p className="text-gray-500 text-sm mb-8">
                Create workflows like <span className="text-purple-400 font-medium">Order Processing</span>, <span className="text-purple-400 font-medium">User Onboarding</span>, or <span className="text-purple-400 font-medium">Approval Flow</span>.
              </p>
              <p className="text-gray-600 text-xs mt-4">
                💡 Tip: Use the "Add Workflow" button above to create your first workflow
              </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow: any, index: number) => {
              return (
                <div
                  key={`${workflow.name}-${index}`}
                  onClick={() => onWorkflowClick(`workflow-${workflow.name.toLowerCase()}`, workflow)}
                  className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.5s ease-out forwards',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                        <Activity size={18} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors text-lg">
                        {workflow.name}
                      </h4>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                    {workflow.description || 'No description provided'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span>{getStateCount(workflow)} states</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                        <span>{getTransitionCount(workflow)} trans</span>
                      </div>
                    </div>
                    {(workflow.cyoda_url || workflow.github_url) && (
                      <div className="flex items-center space-x-2">
                        {workflow.cyoda_url && (
                          <div className="p-1 bg-purple-500/10 rounded" title="Cyoda URL">
                            <ExternalLink size={12} className="text-purple-400" />
                          </div>
                        )}
                        {workflow.github_url && (
                          <div className="p-1 bg-teal-500/10 rounded" title="GitHub URL">
                            <ExternalLink size={12} className="text-teal-400" />
                          </div>
                        )}
                      </div>
                    )}
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

