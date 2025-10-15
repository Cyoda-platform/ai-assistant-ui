import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Folder, Hash, Plus, ArrowRight } from 'lucide-react';

interface GroupNodeProps {
  data: {
    label: string;
    metadata?: {
      groupType?: string;
      count?: number;
      onAddNew?: () => void;
      onSendToChat?: (nodeData: any, nodeType: string) => void;
    };
  };
}

export const GroupNode: React.FC<GroupNodeProps> = ({ data }) => {
  const { label, metadata } = data;
  const groupType = metadata?.groupType || 'group';
  const count = metadata?.count || 0;
  const onAddNew = metadata?.onAddNew;
  const onSendToChat = metadata?.onSendToChat;

  // Color based on group type
  const getColor = () => {
    switch (groupType) {
      case 'environments':
        return { bg: 'from-emerald-700 to-emerald-800', border: 'border-emerald-500', text: 'text-emerald-100', hover: 'hover:bg-emerald-600' };
      case 'entities':
        return { bg: 'from-blue-700 to-blue-800', border: 'border-blue-500', text: 'text-blue-100', hover: 'hover:bg-blue-600' };
      case 'workflows':
        return { bg: 'from-amber-700 to-amber-800', border: 'border-amber-500', text: 'text-amber-100', hover: 'hover:bg-amber-600' };
      default:
        return { bg: 'from-slate-700 to-slate-800', border: 'border-slate-500', text: 'text-slate-100', hover: 'hover:bg-slate-600' };
    }
  };

  const colors = getColor();

  const handleAddNew = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node selection
    onAddNew?.();
  };

  const handleSendToChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSendToChat) {
      const groupData = {
        label,
        groupType,
        count
      };
      onSendToChat(groupData, 'group');
    }
  };

  return (
    <div className={`px-6 py-4 shadow-xl rounded-lg border-2 ${colors.border} bg-gradient-to-br ${colors.bg} min-w-[200px]`}>
      {/* Header with Buttons */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Folder size={20} className={colors.text} />
          <h3 className={`font-bold text-lg ${colors.text}`}>{label}</h3>
        </div>

        <div className="flex items-center space-x-1">
          {/* Send to Chat Button */}
          {onSendToChat && (
            <button
              onClick={handleSendToChat}
              className={`p-1 rounded ${colors.hover} transition-colors ${colors.text}`}
              title={`Send ${groupType} group to chat`}
            >
              <ArrowRight size={18} />
            </button>
          )}

          {/* Add New Button */}
          {onAddNew && (
            <button
              onClick={handleAddNew}
              className={`p-1 rounded ${colors.hover} transition-colors ${colors.text}`}
              title={`Add new ${groupType === 'environments' ? 'environment' : groupType === 'entities' ? 'entity' : 'workflow'}`}
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center space-x-2 text-sm opacity-90">
        <Hash size={14} className={colors.text} />
        <span className={colors.text}>{count} item{count !== 1 ? 's' : ''}</span>
      </div>

      {/* Handles - 8 anchor points for maximum flexibility */}
      <Handle type="source" position={Position.Top} id="top" className="!bg-white !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-white !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-white !w-3 !h-3" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-white !w-3 !h-3" />

      <Handle type="target" position={Position.Top} id="top-target" className="!bg-white !w-3 !h-3" />
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-white !w-3 !h-3" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-white !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-white !w-3 !h-3" />
    </div>
  );
};

