import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Database, GitBranch, Workflow, FileText } from 'lucide-react';

interface EntityNodeData {
  name: string;
  description?: string;
  versionCount: number;
  workflowCount: number;
  requirementCount: number;
  onClick?: () => void;
}

export const EntityNode: React.FC<NodeProps<EntityNodeData>> = ({ data, selected }) => {
  const { name, description, versionCount, workflowCount, requirementCount, onClick } = data;

  return (
    <div
      className={`
        bg-gradient-to-br from-blue-600 to-blue-700
        rounded-xl shadow-2xl border-2 transition-all duration-300
        min-w-[200px] max-w-[280px] cursor-pointer
        ${selected 
          ? 'border-blue-300 ring-4 ring-blue-300/50 scale-105' 
          : 'border-blue-400/50 hover:border-blue-300 hover:scale-102'
        }
      `}
      onClick={onClick}
    >
      {/* Handles for connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 !bg-blue-400 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 !bg-blue-400 !border-2 !border-white"
      />

      {/* Header */}
      <div className="p-4 border-b border-blue-400/30">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Database size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base truncate">{name}</h3>
            <p className="text-blue-100 text-xs">Entity Model</p>
          </div>
        </div>
        {description && (
          <p className="text-blue-100 text-xs mt-2 line-clamp-2">{description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-white/90 text-xs">
          <div className="flex items-center space-x-2">
            <GitBranch size={14} />
            <span>Versions</span>
          </div>
          <span className="font-semibold bg-white/20 px-2 py-0.5 rounded-full">
            {versionCount}
          </span>
        </div>
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
      </div>

      {/* Footer hint */}
      <div className="px-3 pb-3">
        <div className="text-blue-100 text-[10px] text-center bg-white/10 rounded py-1">
          Click to expand versions
        </div>
      </div>
    </div>
  );
};

