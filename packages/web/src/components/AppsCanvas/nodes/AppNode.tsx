import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Package, Play, Square, Loader } from 'lucide-react';

interface AppNodeData {
  name: string;
  description?: string;
  requirementCount: number;
  version?: string;
  status: 'running' | 'stopped' | 'deploying';
  onClick?: () => void;
}

export const AppNode: React.FC<{ data: AppNodeData }> = ({ data }) => {
  const getStatusIcon = () => {
    switch (data.status) {
      case 'running':
        return <Play size={16} className="text-green-400" />;
      case 'stopped':
        return <Square size={16} className="text-red-400" />;
      case 'deploying':
        return <Loader size={16} className="text-yellow-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'running':
        return 'from-teal-600 to-teal-700 border-teal-500';
      case 'stopped':
        return 'from-gray-600 to-gray-700 border-gray-500';
      case 'deploying':
        return 'from-yellow-600 to-yellow-700 border-yellow-500';
    }
  };

  return (
    <div
      onClick={data.onClick}
      className={`
        min-w-[240px] rounded-lg border-2 shadow-xl
        bg-gradient-to-br ${getStatusColor()}
        backdrop-blur-sm transition-all duration-300
        hover:scale-105 hover:shadow-2xl cursor-pointer
        relative overflow-hidden
      `}
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative p-3">
        {/* Header */}
        <div className="flex items-start space-x-2 mb-2">
          <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
            <Package size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">
              {data.name}
            </h3>
            {data.version && (
              <p className="text-xs text-white/60">
                v{data.version}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon()}
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-xs text-white/70 mb-2 line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-white/20">
          <div className="flex items-center space-x-1.5">
            <div className="text-xs text-white/60">Requirements</div>
            <div className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-semibold text-white">
              {data.requirementCount}
            </div>
          </div>
          <div className="text-xs text-white/60 capitalize">
            {data.status}
          </div>
        </div>
      </div>

      {/* React Flow Handles - 8 anchor points for maximum flexibility */}
      <Handle type="source" position={Position.Top} id="top" className="!bg-white !w-2.5 !h-2.5 !border-2 !border-gray-700" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-white !w-2.5 !h-2.5 !border-2 !border-gray-700" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-white !w-2.5 !h-2.5 !border-2 !border-gray-700" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-white !w-2.5 !h-2.5 !border-2 !border-gray-700" />

      <Handle type="target" position={Position.Top} id="top-target" className="!bg-white !w-2.5 !h-2.5 !border-2 !border-gray-700" />
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-white !w-2.5 !h-2.5 !border-2 !border-gray-700" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-white !w-2.5 !h-2.5 !border-2 !border-gray-700" />
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-white !w-2.5 !h-2.5 !border-2 !border-gray-700" />
    </div>
  );
};

