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
    if (isActive) return 'from-blue-600 to-blue-700';
    return 'from-slate-600 to-slate-700';
  };

  const getStateIcon = () => {
    if (isActive) return <CheckCircle size={14} className="text-white" />;
    return <Clock size={14} className="text-white" />;
  };

  return (
    <div
      className={`
        bg-gradient-to-br ${getStateColor()}
        rounded-xl shadow-2xl border-2 transition-all duration-300
        min-w-[220px] max-w-[280px] cursor-pointer
        ${selected
          ? 'border-white ring-4 ring-white/50 scale-105'
          : 'border-white/30 hover:border-white/60 hover:scale-102'
        }
      `}
      onClick={onClick}
    >
      {/* Handles for connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 !bg-white !border-2 !border-current"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 !bg-white !border-2 !border-current"
      />

      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Database size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base truncate">{entityName}</h3>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-white/80 text-xs font-medium">v{version}</span>
              <div className="flex items-center space-x-1">
                {getStateIcon()}
                <span className="text-white/70 text-[10px]">{state}</span>
              </div>
            </div>
          </div>
        </div>
        {description && (
          <p className="text-white/80 text-xs mt-2 line-clamp-2">{description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-white/90 text-xs">
          <div className="flex items-center space-x-2">
            <Workflow size={14} />
            <span>Workflows</span>
          </div>
          <span className="font-semibold bg-white/20 px-2 py-0.5 rounded-full">
            {workflowCount}
          </span>
        </div>
        <div className="flex items-center justify-between text-white/90 text-xs">
          <div className="flex items-center space-x-2">
            <FileText size={14} />
            <span>Requirements</span>
          </div>
          <span className="font-semibold bg-white/20 px-2 py-0.5 rounded-full">
            {requirementCount}
          </span>
        </div>
        {codeCount !== undefined && codeCount > 0 && (
          <div className="flex items-center justify-between text-white/90 text-xs">
            <div className="flex items-center space-x-2">
              <Code size={14} />
              <span>Code</span>
            </div>
            <span className="font-semibold bg-white/20 px-2 py-0.5 rounded-full">
              {codeCount}
            </span>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 pb-3">
        <div className="text-white/70 text-[10px] text-center bg-white/10 rounded py-1">
          Click to view data • Updated {new Date(updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

