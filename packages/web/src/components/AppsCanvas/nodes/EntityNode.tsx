import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Tag, FileText, ExternalLink, Database, Code } from 'lucide-react';
import { NodeJsonEditor } from './NodeJsonEditor';

interface EntityNodeProps {
  data: {
    label: string;
    metadata: {
      name: string;
      version: string;
      description: string;
      cyoda_url: string;
      github_url: string;
      model: {
        name: string;
        age: number;
        breed: string;
      };
    };
    onUpdate?: (updatedMetadata: any) => void;
  };
}

export const EntityNode: React.FC<EntityNodeProps> = ({ data }) => {
  const { metadata, onUpdate } = data;
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg border-2 border-blue-400 min-w-[280px] relative">
        {/* Header */}
        <div className="px-3 py-2 border-b border-blue-400/30 bg-blue-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Box className="text-blue-200" size={20} />
              <div>
                <h3 className="text-lg font-bold text-white">{metadata.name}</h3>
                <p className="text-blue-200 text-xs">v{metadata.version}</p>
              </div>
            </div>
            <button
              onClick={handleOpenEditor}
              className="p-1.5 hover:bg-blue-700 rounded transition-colors"
              title="Edit JSON"
            >
              <Code size={16} className="text-blue-200" />
            </button>
          </div>
        </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-2">
        {/* Description */}
        <div className="flex items-start space-x-2">
          <FileText className="text-blue-300 mt-0.5" size={14} />
          <div className="flex-1">
            <p className="text-blue-200 text-xs font-semibold">Description</p>
            <p className="text-white text-sm">{metadata.description}</p>
          </div>
        </div>

        {/* Model Data */}
        <div className="flex items-start space-x-2">
          <Database className="text-blue-300 mt-0.5" size={14} />
          <div className="flex-1">
            <p className="text-blue-200 text-xs font-semibold">Model</p>
            <div className="text-white text-sm space-y-0.5">
              <p>Name: {metadata.model.name}</p>
              <p>Age: {metadata.model.age}</p>
              <p>Breed: {metadata.model.breed}</p>
            </div>
          </div>
        </div>

        {/* URLs */}
        <div className="pt-1 border-t border-blue-400/20 space-y-1">
          <div className="flex items-center space-x-1">
            <ExternalLink className="text-blue-300" size={12} />
            <a
              href={metadata.cyoda_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-200 text-xs hover:text-white truncate"
            >
              Cyoda
            </a>
          </div>
          <div className="flex items-center space-x-1">
            <ExternalLink className="text-blue-300" size={12} />
            <a
              href={metadata.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-200 text-xs hover:text-white truncate"
            >
              GitHub
            </a>
          </div>
        </div>
        </div>

        {/* Handles - 8 anchor points for maximum flexibility */}
        <Handle type="source" position={Position.Top} id="top" className="!bg-blue-400" />
        <Handle type="source" position={Position.Right} id="right" className="!bg-blue-400" />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-blue-400" />
        <Handle type="source" position={Position.Left} id="left" className="!bg-blue-400" />

        <Handle type="target" position={Position.Top} id="top-target" className="!bg-blue-400" />
        <Handle type="target" position={Position.Right} id="right-target" className="!bg-blue-400" />
        <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-blue-400" />
        <Handle type="target" position={Position.Left} id="left-target" className="!bg-blue-400" />
      </div>

      {/* JSON Editor Modal */}
      <NodeJsonEditor
        data={metadata}
        onSave={handleJsonSave}
        title={`Edit Entity: ${metadata.name}`}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
    </>
  );
};

