import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe, Link, CheckCircle, XCircle, Code } from 'lucide-react';
import { NodeJsonEditor } from './NodeJsonEditor';

interface EnvironmentNodeProps {
  data: {
    label: string;
    metadata: {
      name: string;
      url: string;
      status: string;
    };
    onUpdate?: (updatedMetadata: any) => void;
  };
}

export const EnvironmentNode: React.FC<EnvironmentNodeProps> = ({ data }) => {
  const { metadata, onUpdate } = data;
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const isActive = metadata.status === 'active';

  const handleJsonSave = (updatedData: any) => {
    if (onUpdate) {
      onUpdate(updatedData);
    }
  };

  const handleOpenEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditorOpen(true);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg shadow-lg border-2 border-green-400 min-w-[250px] relative">
        {/* Header */}
        <div className="px-3 py-2 border-b border-green-400/30 bg-green-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="text-green-200" size={20} />
              <h3 className="text-lg font-bold text-white">{metadata.name}</h3>
            </div>
            <div className="flex items-center space-x-2">
              {isActive ? (
                <CheckCircle className="text-green-300" size={18} />
              ) : (
                <XCircle className="text-red-300" size={18} />
              )}
              <button
                onClick={handleOpenEditor}
                className="p-1.5 hover:bg-green-700 rounded transition-colors"
                title="Edit JSON"
              >
                <Code size={16} className="text-green-200" />
              </button>
            </div>
          </div>
        </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-2">
        {/* URL */}
        <div className="flex items-start space-x-2">
          <Link className="text-green-300 mt-0.5" size={14} />
          <div className="flex-1">
            <p className="text-green-200 text-xs font-semibold">URL</p>
            <p className="text-white text-sm truncate">{metadata.url}</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between pt-1 border-t border-green-400/20">
          <span className="text-green-200 text-xs">Status:</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {metadata.status}
          </span>
        </div>
        </div>

        {/* Handles - 8 anchor points for maximum flexibility */}
        <Handle type="source" position={Position.Top} id="top" className="!bg-green-400" />
        <Handle type="source" position={Position.Right} id="right" className="!bg-green-400" />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-green-400" />
        <Handle type="source" position={Position.Left} id="left" className="!bg-green-400" />

        <Handle type="target" position={Position.Top} id="top-target" className="!bg-green-400" />
        <Handle type="target" position={Position.Right} id="right-target" className="!bg-green-400" />
        <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-green-400" />
        <Handle type="target" position={Position.Left} id="left-target" className="!bg-green-400" />
      </div>

      {/* JSON Editor Modal */}
      <NodeJsonEditor
        data={metadata}
        onSave={handleJsonSave}
        title={`Edit Environment: ${metadata.name}`}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
    </>
  );
};

