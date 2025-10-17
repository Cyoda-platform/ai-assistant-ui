import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cloud, Server, TestTube, Wrench } from 'lucide-react';

interface EnvironmentNodeData {
  name: string;
  environmentType: 'production' | 'staging' | 'development' | 'test';
  description?: string;
  appCount: number;
  status: 'active' | 'inactive' | 'maintenance';
  onClick?: () => void;
}

export const EnvironmentNode: React.FC<{ data: EnvironmentNodeData }> = ({ data }) => {
  const getEnvironmentIcon = () => {
    switch (data.environmentType) {
      case 'production':
        return <Cloud size={20} className="text-green-400" />;
      case 'staging':
        return <Server size={20} className="text-yellow-400" />;
      case 'development':
        return <Wrench size={20} className="text-blue-400" />;
      case 'test':
        return <TestTube size={20} className="text-purple-400" />;
    }
  };

  const getEnvironmentColor = () => {
    switch (data.environmentType) {
      case 'production':
        return 'from-green-600 to-green-700 border-green-500';
      case 'staging':
        return 'from-yellow-600 to-yellow-700 border-yellow-500';
      case 'development':
        return 'from-blue-600 to-blue-700 border-blue-500';
      case 'test':
        return 'from-purple-600 to-purple-700 border-purple-500';
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'maintenance':
        return 'bg-orange-500';
    }
  };

  return (
    <div
      onClick={data.onClick}
      className={`
        min-w-[280px] rounded-xl border-2 shadow-2xl
        bg-gradient-to-br ${getEnvironmentColor()}
        backdrop-blur-sm transition-all duration-300
        hover:scale-105 hover:shadow-3xl cursor-pointer
        relative overflow-hidden
      `}
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />

      {/* Status indicator */}
      <div className="absolute top-3 right-3">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
      </div>

      {/* Content */}
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            {getEnvironmentIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {data.name}
            </h3>
            <p className="text-xs text-white/70 uppercase tracking-wider">
              {data.environmentType}
            </p>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-sm text-white/80 mb-3 line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-white/20">
          <div className="flex items-center space-x-2">
            <div className="text-xs text-white/70">Apps</div>
            <div className="px-2 py-1 bg-white/20 rounded-md text-sm font-semibold text-white">
              {data.appCount}
            </div>
          </div>
          <div className="text-xs text-white/70 capitalize">
            {data.status}
          </div>
        </div>
      </div>

      {/* React Flow Handles - 8 anchor points for maximum flexibility */}
      <Handle type="source" position={Position.Top} id="top" className="!bg-white !w-3 !h-3 !border-2 !border-gray-700" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-white !w-3 !h-3 !border-2 !border-gray-700" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-white !w-3 !h-3 !border-2 !border-gray-700" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-white !w-3 !h-3 !border-2 !border-gray-700" />

      <Handle type="target" position={Position.Top} id="top-target" className="!bg-white !w-3 !h-3 !border-2 !border-gray-700" />
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-white !w-3 !h-3 !border-2 !border-gray-700" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-white !w-3 !h-3 !border-2 !border-gray-700" />
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-white !w-3 !h-3 !border-2 !border-gray-700" />
    </div>
  );
};

