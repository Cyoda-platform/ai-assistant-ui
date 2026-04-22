import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { FileText, AlertCircle, CheckCircle2, Clock, Zap, Package } from 'lucide-react';

interface RequirementNodeData {
  title: string;
  version: string;
  description?: string;
  status: 'draft' | 'approved' | 'implemented' | 'verified';
  priority: 'low' | 'medium' | 'high' | 'critical';
  entityCount: number;
  updatedAt?: string;
  onClick?: () => void;
}

export const RequirementNode: React.FC<NodeProps<RequirementNodeData>> = ({ data, selected }) => {
  const { title, version, status, priority, entityCount, onClick } = data;

  const getStatusColor = () => {
    switch (status) {
      case 'verified': return 'from-green-600 to-green-700';
      case 'implemented': return 'from-blue-600 to-blue-700';
      case 'approved': return 'from-yellow-600 to-yellow-700';
      case 'draft': return 'from-gray-600 to-gray-700';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verified': return <CheckCircle2 size={12} className="text-white" />;
      case 'implemented': return <Zap size={12} className="text-white" />;
      case 'approved': return <Clock size={12} className="text-white" />;
      case 'draft': return <AlertCircle size={12} className="text-white" />;
      default: return <FileText size={12} className="text-white" />;
    }
  };

  const getPriorityBadge = () => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return colors[priority];
  };

  return (
    <div
      className={`
        bg-gradient-to-br ${getStatusColor()}
        rounded-lg shadow-lg border-2 transition-all duration-300
        min-w-[200px] max-w-[220px] cursor-pointer
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
        className="w-2 h-2 !bg-white !border-2 !border-current"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-2 h-2 !bg-white !border-2 !border-current"
      />

      {/* Header */}
      <div className="p-2.5 border-b border-white/20">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-7 h-7 bg-white/20 rounded flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h6 className="text-white font-semibold text-xs line-clamp-2 leading-tight mb-0.5">
              {title}
            </h6>
            <p className="text-white/60 text-[10px]">v{version}</p>
          </div>
        </div>
      </div>

      {/* Status, Priority & Entity Count */}
      <div className="p-2.5 space-y-1.5">
        <div className="flex items-center space-x-1.5 text-white/90 text-[10px]">
          {getStatusIcon()}
          <span className="capitalize">{status}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className={`w-2 h-2 rounded-full ${getPriorityBadge()}`} />
          <span className="text-white/80 text-[10px] capitalize">{priority}</span>
        </div>
        <div className="flex items-center space-x-1.5 pt-1 border-t border-white/10">
          <Package size={10} className="text-white/60" />
          <span className="text-white/70 text-[10px]">{entityCount} entities</span>
        </div>
      </div>
    </div>
  );
};

