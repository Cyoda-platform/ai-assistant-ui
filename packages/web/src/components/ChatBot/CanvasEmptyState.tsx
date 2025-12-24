import React from 'react';
import { FileText, Database, Activity, Code } from 'lucide-react';

interface CanvasEmptyStateProps {
  type: 'requirements' | 'entities' | 'workflows' | 'code';
}

const CanvasEmptyState: React.FC<CanvasEmptyStateProps> = ({ type }) => {
  const renderContent = () => {
    switch (type) {
      case 'requirements':
        return (
          <>
            <h2 className="text-xl font-semibold text-white mb-3">Define Your Requirements</h2>
            <p className="text-gray-400 mb-2 leading-relaxed">Start by defining your application requirements.</p>
            <p className="text-gray-500 text-sm mb-8">
              Create <span className="text-orange-400 font-medium">Functional Requirements</span>, <span className="text-orange-400 font-medium">User Stories</span>, and <span className="text-orange-400 font-medium">Acceptance Criteria</span> to guide development.
            </p>
            <p className="text-gray-400 text-xs">💡 Tip: Use the "Add Requirement" button above to create your first requirement</p>
          </>
        );
      case 'entities':
        return (
          <>
            <h2 className="text-xl font-semibold text-white mb-3">Start Building Your Data Model</h2>
            <p className="text-gray-400 mb-2 leading-relaxed">Entities are the core data structures of your application.</p>
            <p className="text-gray-500 text-sm mb-8">
              Define entities like <span className="text-teal-400 font-medium">Customer</span>, <span className="text-teal-400 font-medium">Order</span>, or <span className="text-teal-400 font-medium">Product</span> to get started.
            </p>
            <p className="text-gray-400 text-xs">💡 Tip: Use the "Add Entity" button above to create your first entity</p>
          </>
        );
      case 'workflows':
        return (
          <>
            <h2 className="text-xl font-semibold text-white mb-3">Define Your Business Logic</h2>
            <p className="text-gray-400 mb-2 leading-relaxed">Workflows orchestrate how your entities move through different states.</p>
            <p className="text-gray-500 text-sm mb-8">
              Create workflows like <span className="text-purple-400 font-medium">Order Processing</span>, <span className="text-purple-400 font-medium">User Onboarding</span>, or <span className="text-purple-400 font-medium">Approval Flow</span>.
            </p>
            <p className="text-gray-400 text-xs">💡 Tip: Use the "Add Workflow" button above to create your first workflow</p>
          </>
        );
      case 'code':
        return (
          <>
            <h2 className="text-xl font-semibold text-white mb-3">Code Editor</h2>
            <p className="text-gray-400 mb-2 leading-relaxed">View and edit code files</p>
            <p className="text-gray-400 text-sm">Coming soon...</p>
          </>
        );
      default:
        return null;
    }
  };

  const getIcon = () => {
    const iconProps = { size: 64, className: 'mx-auto relative' };
    switch (type) {
      case 'requirements':
        return <FileText {...iconProps} className={`${iconProps.className} text-orange-400/80`} />;
      case 'entities':
        return <Database {...iconProps} className={`${iconProps.className} text-teal-400/80`} />;
      case 'workflows':
        return <Activity {...iconProps} className={`${iconProps.className} text-purple-400/80`} />;
      case 'code':
        return <Code {...iconProps} className={`${iconProps.className} text-gray-400/80`} />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'requirements': return 'bg-orange-500/10';
      case 'entities': return 'bg-teal-500/10';
      case 'workflows': return 'bg-purple-500/10';
      case 'code': return 'bg-gray-500/10';
      default: return 'bg-gray-500/10';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center pt-8">
      <div className="relative mb-6">
        <div className={`absolute inset-0 blur-3xl ${getBgColor()} animate-pulse`}></div>
        {getIcon()}
      </div>
      {renderContent()}
    </div>
  );
};

export default CanvasEmptyState;

