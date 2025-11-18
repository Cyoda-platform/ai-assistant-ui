import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { GitBranch, Workflow, FileText, CheckCircle, Clock } from 'lucide-react';

interface VersionNodeData {
  version: string;
  state: string;
  workflowCount: number;
  requirementCount: number;
  createdAt: string;
  isActive: boolean;
  onClick?: () => void;
}

export const VersionNode: React.FC<NodeProps<VersionNodeData>> = ({ data, selected }) => {
  const { version, state, workflowCount, requirementCount, createdAt, isActive, onClick } = data;

  const getStateColor = () => {
    if (isActive) return 'from-green-600 to-green-700';
    return 'from-orange-600 to-orange-700';
  };

  const getStateIcon = () => {
    if (isActive) return <CheckCircle size={14} className="text-white" />;
    return <Clock size={14} className="text-white" />;
  };

  return (
    <div
      className={`
        bg-gradient-to-br ${getStateColor()}
        rounded-lg shadow-xl border-2 transition-all duration-300
        min-w-[160px] max-w-[200px] cursor-pointer
        ${selected 
          ? 'border-white ring-4 ring-white/50 scale-105' 
          : 'border-white/30 hover:border-white/60 hover:scale-102'
        }
      `}
      onClick={onClick}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-2.5 h-2.5 !bg-white !border-2 !border-current"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-2.5 h-2.5 !bg-white !border-2 !border-current"
      />

      {/* Header */}
      <div className="p-3 border-b border-white/20">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <GitBranch size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-sm">v{version}</h4>
            <div className="flex items-center space-x-1 text-white/80 text-[10px]">
              {getStateIcon()}
              <span>{state}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-2 space-y-1.5">
        <div className="flex items-center justify-between text-white/90 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <Workflow size={12} />
            <span>Workflows</span>
          </div>
          <span className="font-semibold bg-white/20 px-1.5 py-0.5 rounded-full">
            {workflowCount}
          </span>
        </div>
        <div className="flex items-center justify-between text-white/90 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <FileText size={12} />
            <span>Requirements</span>
          </div>
          <span className="font-semibold bg-white/20 px-1.5 py-0.5 rounded-full">
            {requirementCount}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-2 pb-2">
        <div className="text-white/70 text-[9px] text-center bg-white/10 rounded py-0.5">
          {new Date(createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

