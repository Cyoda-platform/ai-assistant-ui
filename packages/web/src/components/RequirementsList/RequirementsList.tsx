import React from 'react';
import { Plus, FileText, ExternalLink, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
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
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <FileText size={20} className="text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Requirements</h3>
            <p className="text-xs text-gray-400">
              {requirements.length === 0 ? 'No requirements yet' : `${requirements.length} ${requirements.length === 1 ? 'requirement' : 'requirements'}`}
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateRequirement}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-orange-500/25"
          title="Create new requirement and open editor"
        >
          <Plus size={16} />
          <span>Add Requirement</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {requirements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-orange-500/10 rounded-full mb-6">
              <FileText size={48} className="text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">No Requirements Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Start by defining your application requirements. 
              Create functional requirements, user stories, and acceptance criteria to guide development.
            </p>
            <p className="text-gray-600 text-xs mt-4">
              💡 Tip: Use the "Add Requirement" button above to create your first requirement
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requirements.map((requirement, index) => {
              return (
                <div
                  key={requirement.id}
                  onClick={() => onRequirementClick(requirement.id)}
                  className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.5s ease-out forwards',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                        <FileText size={18} className="text-orange-400 group-hover:text-orange-300 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-white group-hover:text-orange-300 transition-colors text-lg">
                        {requirement.title}
                      </h4>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getPriorityBadge(requirement.priority)}`} />
                  </div>

                  <p className="text-sm text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                    {requirement.description || 'No description provided'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center space-x-1.5">
                      {getStatusIcon(requirement.status)}
                      <span className="capitalize">{requirement.status}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="capitalize">{requirement.priority}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>


    </div>
  );
};
