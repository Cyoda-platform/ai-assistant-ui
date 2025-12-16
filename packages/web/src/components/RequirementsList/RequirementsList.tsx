import React from 'react';
import { Plus, FileText, ExternalLink, AlertCircle, CheckCircle2, Clock, Zap, Github } from 'lucide-react';
import { message } from 'antd';
import type { Requirement, AppRoot } from '@/components/AppsCanvas/types/appSchema';

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle2 size={12} className="text-green-400" />;
      case 'implemented': return <CheckCircle2 size={12} className="text-blue-400" />;
      case 'approved': return <Clock size={12} className="text-yellow-400" />;
      case 'draft': return <AlertCircle size={12} className="text-gray-400" />;
      default: return <AlertCircle size={12} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'from-green-600 to-green-700';
      case 'implemented': return 'from-blue-600 to-blue-700';
      case 'approved': return 'from-yellow-600 to-yellow-700';
      case 'draft': return 'from-gray-600 to-gray-700';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
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
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 pt-12 w-full">
        {requirements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText size={64} className="text-orange-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              Define Your Requirements
            </h3>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Start by defining your application requirements.
              Create <span className="text-orange-400 font-medium">Functional Requirements</span>, <span className="text-orange-400 font-medium">User Stories</span>, and <span className="text-orange-400 font-medium">Acceptance Criteria</span> to guide development.
            </p>
            <p className="text-xs text-slate-500 mt-4">
              💡 Tip: Use the "Add Requirement" button above to create your first requirement
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 h-full">
            {requirements.map((requirement, index) => {
              return (
                <div
                  key={requirement.id}
                  onClick={() => onRequirementClick(requirement.id)}
                  className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/50 rounded-xl pt-4 px-2 pb-2 hover:border-orange-500/50 cursor-pointer group h-48 flex flex-col flex-shrink-0"
                  style={{ width: '220px' }}
                >
                  <div className="flex items-start justify-between mb-2 flex-shrink-0">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="p-1 bg-orange-500/10 rounded group-hover:bg-orange-500/20 transition-colors flex-shrink-0">
                        <FileText size={14} className="text-orange-400 group-hover:text-orange-300 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-white group-hover:text-orange-300 transition-colors text-sm truncate">
                        {requirement.title}
                      </h4>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ml-1 ${getPriorityBadge(requirement.priority)}`} />
                  </div>

                  <p className="text-xs text-gray-400 mb-2 line-clamp-2 leading-tight flex-shrink-0">
                    {requirement.description || 'No description provided'}
                  </p>

                  <div className="flex-1 min-h-0" />

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-slate-700/50 flex-shrink-0 gap-1">
                    <div className="flex items-center space-x-1 min-w-0 text-xs">
                      {getStatusIcon(requirement.status)}
                      <span className="capitalize truncate">{requirement.status}</span>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
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
                </div>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
};
