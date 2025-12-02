/**
 * ResponseSeparator - Visual separator between agent response and tool/hook response
 * Helps users distinguish between the agent's message and interactive UI components
 */

import React from 'lucide-react';
import { Zap, MessageSquare } from 'lucide-react';

interface ResponseSeparatorProps {
  hookType?: string;
  label?: string;
}

const ResponseSeparator: React.FC<ResponseSeparatorProps> = ({
  hookType = 'tool_response',
  label = 'Interactive Response'
}) => {
  // Map hook types to user-friendly labels
  const hookLabels: Record<string, string> = {
    'repository_config_selection': '🔧 Repository Configuration',
    'option_selection': '📋 Options',
    'canvas_analysis_suggestion': '🎨 Canvas Suggestion',
    'canvas_open': '🎨 Canvas View',
    'canvas_tab': '🎨 Canvas Tab',
    'code_changes': '💾 Code Changes',
    'background_task': '⚙️ Background Task',
    'cloud_window': '☁️ Cloud Environment',
    'deployment_options': '🚀 Deployment Options',
    'entity_config': '📦 Entity Configuration',
    'workflow_config': '🔄 Workflow Configuration',
    'app_config': '🚀 Application Configuration',
    'environment_config': '🌍 Environment Configuration',
    'requirement_config': '📋 Requirements',
    'tool_response': '🔧 Tool Response'
  };

  const displayLabel = hookLabels[hookType] || label;

  return (
    <div className="mt-6 mb-4 flex items-center space-x-3">
      {/* Left line */}
      <div className="flex-1 h-px bg-gradient-to-r from-slate-700/0 to-slate-600/50" />

      {/* Center badge */}
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/60 border border-slate-600/50 rounded-full">
        <Zap size={14} className="text-amber-400" />
        <span className="text-xs font-medium text-slate-300 whitespace-nowrap">
          {displayLabel}
        </span>
      </div>

      {/* Right line */}
      <div className="flex-1 h-px bg-gradient-to-l from-slate-700/0 to-slate-600/50" />
    </div>
  );
};

export default ResponseSeparator;

