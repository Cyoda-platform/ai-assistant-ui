/**
 * ResponseSeparator - Visual separator between agent response and tool/hook response
 * Helps users distinguish between the agent's message and interactive UI components
 */

import React from 'react';
import { Settings, ListChecks, Palette, Save, Cog, Cloud, Rocket, Package, RefreshCw, Globe, FileText, Wrench } from 'lucide-react';

interface ResponseSeparatorProps {
  hookType?: string;
  label?: string;
}

interface HookConfig {
  icon: React.ReactNode;
  label: string;
}

const ResponseSeparator: React.FC<ResponseSeparatorProps> = ({
  hookType = 'tool_response',
  label = 'Interactive Response'
}) => {
  // Map hook types to icons and labels
  const hookConfigs: Record<string, HookConfig> = {
    'repository_config_selection': { icon: <Settings size={12} />, label: 'Repository Configuration' },
    'option_selection': { icon: <ListChecks size={12} />, label: 'Options' },
    'canvas_analysis_suggestion': { icon: <Palette size={12} />, label: 'Canvas Suggestion' },
    'canvas_open': { icon: <Palette size={12} />, label: 'Canvas View' },
    'canvas_tab': { icon: <Palette size={12} />, label: 'Canvas Tab' },
    'code_changes': { icon: <Save size={12} />, label: 'Code Changes' },
    'background_task': { icon: <Cog size={12} />, label: 'Background Task' },
    'cloud_window': { icon: <Cloud size={12} />, label: 'Cloud Environment' },
    'deployment_options': { icon: <Rocket size={12} />, label: 'Deployment Options' },
    'entity_config': { icon: <Package size={12} />, label: 'Entity Configuration' },
    'workflow_config': { icon: <RefreshCw size={12} />, label: 'Workflow Configuration' },
    'app_config': { icon: <Rocket size={12} />, label: 'Application Configuration' },
    'environment_config': { icon: <Globe size={12} />, label: 'Environment Configuration' },
    'requirement_config': { icon: <FileText size={12} />, label: 'Requirements' },
    'tool_response': { icon: <Wrench size={12} />, label: 'Tool Response' }
  };

  const config = hookConfigs[hookType] || { icon: <Wrench size={12} />, label };

  return (
    <div className="mt-4 mb-3 flex items-center space-x-3">
      {/* Left line */}
      <div className="flex-1 h-px bg-gradient-to-r from-amber-400/0 to-amber-400/40" />

      {/* Center label - minimal design with icon */}
      <span className="text-xs font-medium text-slate-400 whitespace-nowrap flex items-center gap-1.5">
        {config.icon}
        {config.label}
      </span>

      {/* Right line */}
      <div className="flex-1 h-px bg-gradient-to-l from-amber-400/0 to-amber-400/40" />
    </div>
  );
};

export default ResponseSeparator;

