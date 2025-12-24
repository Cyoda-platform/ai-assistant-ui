import React from 'react';
import { Plus, FileText, Github, Trash2 } from 'lucide-react';
import { message } from 'antd';
import type { Requirement, AppRoot } from '@/components/AppsCanvas/types/appSchema';
import CanvasEmptyState from '@/components/ChatBot/CanvasEmptyState';

interface RequirementsListProps {
  appId: string;
  appData: AppRoot; // AppRoot is the single source of truth
  onRequirementClick: (requirementId: string) => void;
  onRequirementCreated?: (requirementId: string) => void;
  onAppDataUpdate?: (updatedAppData: AppRoot) => void; // Callback to update AppRoot
}

export const RequirementsList: React.FC<RequirementsListProps> = ({
  appId,
  appData,
  onRequirementClick,
  onRequirementCreated,
  onAppDataUpdate,
}) => {


  // Get requirements directly from AppRoot (single source of truth)
  const requirements = appData.app.requirements || [];



  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-400';
      case 'medium': return 'bg-orange-400';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getGitHubUrl = (requirement: Requirement) => {
    if (!requirement.metadata?.filePath) return null;

    const owner = appData.app.metadata?.owner || 'Cyoda-platform';
    const repo = appData.app.metadata?.repository || 'mcp-cyoda-quart-app';
    const branch = appData.app.metadata?.branch || 'main';
    const filePath = requirement.metadata.filePath.replace(/^\.\//, '');

    return `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`;
  };

  const handleCreateRequirement = async () => {
    try {
      // Generate new requirement ID
      const requirementId = `req-${Date.now()}`;

      // Create new requirement with default template
      const newRequirement: Requirement = {
        id: requirementId,
        title: 'New Requirement',
        description: 'Define what your application should do',
        priority: 'medium',
        status: 'draft',
        content: `# New Requirement

## Overview
Define what your application should do. Be specific about the functionality, user interactions, and expected outcomes.

## Acceptance Criteria
- [ ] Criterion 1: Define the main functionality
- [ ] Criterion 2: Specify user interactions
- [ ] Criterion 3: Define success metrics

## Additional Notes
Add any additional context, constraints, or considerations here.`,
      };

      // Update AppRoot with new requirement
      const updatedAppData: AppRoot = {
        ...appData,
        app: {
          ...appData.app,
          requirements: [...requirements, newRequirement]
        }
      };

      // Call the update callback
      if (onAppDataUpdate) {
        onAppDataUpdate(updatedAppData);
      }

      // Call the created callback to navigate to editor
      if (onRequirementCreated) {
        onRequirementCreated(requirementId);
      }

      message.success('New requirement created! Edit it and send to chat when ready.');
    } catch (error: any) {
      console.error('Failed to create requirement:', error);
      message.error('Failed to create requirement');
    }
  };

  const handleDeleteRequirement = (requirementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedAppData: AppRoot = {
      ...appData,
      app: {
        ...appData.app,
        requirements: requirements.filter(req => req.id !== requirementId)
      }
    };
    if (onAppDataUpdate) {
      onAppDataUpdate(updatedAppData);
    }
    message.success('Requirement deleted');
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-6">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <FileText size={20} className="text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Requirements</h3>
            <p className="text-xs text-gray-400">
              {requirements.length === 0 ? 'No requirements yet' : `${requirements.length} ${requirements.length === 1 ? 'requirement' : 'requirements'}`}
            </p>
          </div>
          <button
            onClick={handleCreateRequirement}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200 shadow-lg hover:shadow-orange-500/25"
            title="Create new requirement and open editor"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 pt-4 w-full">
        {requirements.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <CanvasEmptyState type="requirements" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 h-full">
            {requirements.map((requirement, index) => {
              return (
                <div
                  key={requirement.id}
                  onClick={() => onRequirementClick(requirement.id)}
                  className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:border-orange-500/50 cursor-pointer group h-48 flex flex-col flex-shrink-0"
                  style={{ width: '220px' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                    <div className="flex items-start space-x-2 min-w-0 flex-1">
                      <div className="p-1 bg-orange-500/10 rounded group-hover:bg-orange-500/20 transition-colors flex-shrink-0 mt-0.5">
                        <FileText size={14} className="text-orange-400 group-hover:text-orange-300 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-white group-hover:text-orange-300 transition-colors text-sm break-words leading-tight min-w-0 overflow-hidden">
                        {requirement.title}
                      </h4>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${getPriorityBadge(requirement.priority)}`} />
                  </div>

                  <p className="text-xs text-gray-400 leading-tight flex-1 overflow-hidden break-words">
                    {requirement.description || 'No description provided'}
                  </p>

                  <div className="flex items-center justify-end text-xs text-gray-500 gap-1 mt-2">
                    {!getGitHubUrl(requirement) && (
                      <button
                        onClick={(e) => handleDeleteRequirement(requirement.id, e)}
                        className="p-1 bg-blue-500/20 hover:bg-blue-500/30 rounded transition-colors"
                        title="Delete requirement"
                      >
                        <Trash2 size={14} className="text-blue-400 hover:text-blue-300" />
                      </button>
                    )}
                    {getGitHubUrl(requirement) && (
                      <a
                        href={getGitHubUrl(requirement)!}
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
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
};
