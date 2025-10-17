import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Workflow, Circle, ArrowRight, Clock } from 'lucide-react';

interface WorkflowNodeData {
  name: string;
  stateCount: number;
  transitionCount: number;
  updatedAt: string;
  onClick?: () => void;
  onEdit?: () => void;
}

export const WorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  const { name, stateCount, transitionCount, updatedAt, onClick, onEdit } = data;

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <div
      className={`
        bg-gradient-to-br from-purple-600 to-purple-700
        rounded-lg shadow-lg border-2 transition-all duration-300
        min-w-[140px] max-w-[180px] cursor-pointer
        ${selected
          ? 'border-purple-300 ring-4 ring-purple-300/50 scale-105'
          : 'border-purple-400/50 hover:border-purple-300 hover:scale-102'
        }
      `}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit workflow"
    >
      {/* Handles - 8 anchor points for maximum flexibility */}
      <Handle type="source" position={Position.Top} id="top" className="w-2 h-2 !bg-purple-300 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 !bg-purple-300 !border-2 !border-white" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="w-2 h-2 !bg-purple-300 !border-2 !border-white" />
      <Handle type="source" position={Position.Left} id="left" className="w-2 h-2 !bg-purple-300 !border-2 !border-white" />

      <Handle type="target" position={Position.Top} id="top-target" className="w-2 h-2 !bg-purple-300 !border-2 !border-white" />
      <Handle type="target" position={Position.Right} id="right-target" className="w-2 h-2 !bg-purple-300 !border-2 !border-white" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="w-2 h-2 !bg-purple-300 !border-2 !border-white" />
      <Handle type="target" position={Position.Left} id="left-target" className="w-2 h-2 !bg-purple-300 !border-2 !border-white" />

      {/* Header */}
      <div className="p-2.5 border-b border-purple-400/30">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 w-7 h-7 bg-white/20 rounded flex items-center justify-center">
            <Workflow size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-white font-semibold text-xs truncate">{name}</h5>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between text-white/90 text-[10px]">
          <div className="flex items-center space-x-1">
            <Circle size={10} />
            <span>States</span>
          </div>
          <span className="font-semibold bg-white/20 px-1.5 py-0.5 rounded-full">
            {stateCount}
          </span>
        </div>
        <div className="flex items-center justify-between text-white/90 text-[10px]">
          <div className="flex items-center space-x-1">
            <ArrowRight size={10} />
            <span>Transitions</span>
          </div>
          <span className="font-semibold bg-white/20 px-1.5 py-0.5 rounded-full">
            {transitionCount}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-2 pb-2">
        <div className="flex items-center justify-center space-x-1 text-white/70 text-[9px] bg-white/10 rounded py-0.5">
          <Clock size={8} />
          <span>{new Date(updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

