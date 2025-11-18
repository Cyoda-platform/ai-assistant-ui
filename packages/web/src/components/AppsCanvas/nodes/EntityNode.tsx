import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Database, GitBranch, Workflow, FileText, CheckCircle, Clock, Code } from 'lucide-react';

interface EntityVersionNodeData {
  entityName: string;
  version: string;
  description?: string;
  state: string;
  workflowCount: number;
  requirementCount: number;
  codeCount?: number;
  isActive: boolean;
  updatedAt: string;
  onClick?: () => void;
}

export const EntityNode: React.FC<NodeProps<EntityVersionNodeData>> = ({ data, selected }) => {
  const { entityName, version, description, state, workflowCount, requirementCount, codeCount, isActive, updatedAt, onClick } = data;

  const getStateColor = () => {
    if (isActive) return 'from-teal-600 via-teal-500 to-teal-600';
    return 'from-slate-700 via-slate-600 to-slate-700';
  };

  const getStateIcon = () => {
    if (isActive) return <CheckCircle size={14} className="text-white" />;
    return <Clock size={14} className="text-white" />;
  };

  return (
    <div
      className={`
        bg-gradient-to-br ${getStateColor()}
        rounded-xl shadow-xl border-2 transition-all duration-300
        min-w-[200px] max-w-[240px] cursor-pointer
        ${selected
          ? 'border-white ring-4 ring-teal-400/50 scale-105 shadow-2xl shadow-teal-500/30'
          : 'border-white/30 hover:border-white/60 hover:scale-102 hover:shadow-2xl'
        }
      `}
      onClick={onClick}
    >
      {/* Handles for connections - 8 anchor points for maximum flexibility */}
      <Handle type="source" position={Position.Top} id="top" className="w-3 h-3 !bg-white !border-2 !border-current" />
      <Handle type="source" position={Position.Right} id="right" className="w-3 h-3 !bg-white !border-2 !border-current" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="w-3 h-3 !bg-white !border-2 !border-current" />
      <Handle type="source" position={Position.Left} id="left" className="w-3 h-3 !bg-white !border-2 !border-current" />

      <Handle type="target" position={Position.Top} id="top-target" className="w-3 h-3 !bg-white !border-2 !border-current" />
      <Handle type="target" position={Position.Right} id="right-target" className="w-3 h-3 !bg-white !border-2 !border-current" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="w-3 h-3 !bg-white !border-2 !border-current" />
      <Handle type="target" position={Position.Left} id="left-target" className="w-3 h-3 !bg-white !border-2 !border-current" />

      {/* Header */}
      <div className="p-2.5 border-b border-white/20">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 w-7 h-7 bg-white/20 rounded flex items-center justify-center">
            <Database size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm truncate">{entityName}</h3>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-white/80 text-[10px] font-medium">v{version}</span>
              <div className="flex items-center space-x-0.5">
                {getStateIcon()}
                <span className="text-white/70 text-[9px]">{state}</span>
              </div>
            </div>
          </div>
        </div>
        {description && (
          <p className="text-white/80 text-[10px] mt-1.5 line-clamp-1">{description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between text-white/90 text-[10px]">
          <div className="flex items-center space-x-1">
            <Workflow size={11} />
            <span>Workflows</span>
          </div>
          <span className="font-semibold bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">
            {workflowCount}
          </span>
        </div>
        <div className="flex items-center justify-between text-white/90 text-[10px]">
          <div className="flex items-center space-x-1">
            <FileText size={11} />
            <span>Reqs</span>
          </div>
          <span className="font-semibold bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">
            {requirementCount}
          </span>
        </div>
        {codeCount !== undefined && codeCount > 0 && (
          <div className="flex items-center justify-between text-white/90 text-[10px]">
            <div className="flex items-center space-x-1">
              <Code size={11} />
              <span>Code</span>
            </div>
            <span className="font-semibold bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">
              {codeCount}
            </span>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-2 pb-2">
        <div className="text-white/70 text-[8px] text-center bg-white/10 rounded py-0.5">
          {new Date(updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

