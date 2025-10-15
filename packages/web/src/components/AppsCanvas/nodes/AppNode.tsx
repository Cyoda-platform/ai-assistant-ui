import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Package, User, FileText, GitBranch, Code, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { NodeJsonEditor } from './NodeJsonEditor';

interface AppNodeProps {
  data: {
    label: string;
    metadata: {
      name: string;
      version: string;
      author: string;
      description: string;
      license: string;
      repository: string;
      requirement: string;
    };
    onUpdate?: (updatedMetadata: any) => void;
    onSendToChat?: (nodeData: any, nodeType: string) => void;
  };
}

export const AppNode: React.FC<AppNodeProps> = ({ data }) => {
  const { metadata, onUpdate, onSendToChat } = data;
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleJsonSave = (updatedData: any) => {
    if (onUpdate) {
      onUpdate(updatedData);
    }
  };

  const handleOpenEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditorOpen(true);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSendToChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSendToChat) {
      onSendToChat(metadata, 'app');
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg shadow-xl border-2 border-purple-400 w-[300px] relative">
        {/* Header */}
        <div className="px-3 py-2 border-b border-purple-400/30 bg-purple-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Package className="text-purple-200 flex-shrink-0" size={20} />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white truncate">{metadata.name}</h3>
                <p className="text-purple-200 text-xs">v{metadata.version}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                onClick={handleToggleExpand}
                className="p-1 hover:bg-purple-700 rounded transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronUp size={16} className="text-purple-200" />
                ) : (
                  <ChevronDown size={16} className="text-purple-200" />
                )}
              </button>
              {onSendToChat && (
                <button
                  onClick={handleSendToChat}
                  className="p-1 hover:bg-purple-700 rounded transition-colors"
                  title="Send app to chat"
                >
                  <ArrowRight size={16} className="text-purple-200" />
                </button>
              )}
              <button
                onClick={handleOpenEditor}
                className="p-1 hover:bg-purple-700 rounded transition-colors"
                title="Edit JSON"
              >
                <Code size={16} className="text-purple-200" />
              </button>
            </div>
          </div>
        </div>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="px-3 py-2 space-y-2">
          {/* Author */}
          <div className="flex items-start space-x-2">
            <User className="text-purple-300 mt-0.5 flex-shrink-0" size={14} />
            <div className="flex-1 min-w-0">
              <p className="text-purple-200 text-xs font-semibold">Author</p>
              <p className="text-white text-sm truncate">{metadata.author}</p>
            </div>
          </div>

          {/* Description */}
          <div className="flex items-start space-x-2">
            <FileText className="text-purple-300 mt-0.5 flex-shrink-0" size={14} />
            <div className="flex-1 min-w-0">
              <p className="text-purple-200 text-xs font-semibold">Description</p>
              <p className="text-white text-sm line-clamp-2">{metadata.description}</p>
            </div>
          </div>

          {/* Requirement */}
          <div className="flex items-start space-x-2">
            <FileText className="text-purple-300 mt-0.5 flex-shrink-0" size={14} />
            <div className="flex-1 min-w-0">
              <p className="text-purple-200 text-xs font-semibold">Requirement</p>
              <p className="text-white text-sm italic truncate">{metadata.requirement}</p>
            </div>
          </div>

          {/* Repository */}
          <div className="flex items-start space-x-2">
            <GitBranch className="text-purple-300 mt-0.5 flex-shrink-0" size={14} />
            <div className="flex-1 min-w-0">
              <p className="text-purple-200 text-xs font-semibold">Repository</p>
              <p className="text-white text-sm truncate">{metadata.repository}</p>
            </div>
          </div>

          {/* License */}
          <div className="flex items-center justify-between pt-2 border-t border-purple-400/20">
            <span className="text-purple-200 text-xs truncate">License: {metadata.license}</span>
          </div>
        </div>
      )}

        {/* Handles - 8 anchor points for maximum flexibility */}
        <Handle type="source" position={Position.Top} id="top" className="!bg-purple-400" />
        <Handle type="source" position={Position.Right} id="right" className="!bg-purple-400" />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-purple-400" />
        <Handle type="source" position={Position.Left} id="left" className="!bg-purple-400" />

        <Handle type="target" position={Position.Top} id="top-target" className="!bg-purple-400" />
        <Handle type="target" position={Position.Right} id="right-target" className="!bg-purple-400" />
        <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-purple-400" />
        <Handle type="target" position={Position.Left} id="left-target" className="!bg-purple-400" />
      </div>

      {/* JSON Editor Modal */}
      <NodeJsonEditor
        data={metadata}
        onSave={handleJsonSave}
        title={`Edit App: ${metadata.name}`}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
    </>
  );
};

