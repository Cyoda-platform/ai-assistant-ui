import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Workflow, ExternalLink, GitBranch, Hash, Code, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { NodeJsonEditor } from './NodeJsonEditor';

interface WorkflowNodeProps {
  data: {
    label: string;
    metadata: {
      name: string;
      cyoda_url: string;
      github_url: string;
      stateCount: number;
      states: Record<string, any>;
    };
    onUpdate?: (updatedMetadata: any) => void;
    onSendToChat?: (nodeData: any, nodeType: string) => void;
  };
}

export const WorkflowNode: React.FC<WorkflowNodeProps> = ({ data }) => {
  const { metadata, onUpdate, onSendToChat } = data;
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get state names
  const stateNames = Object.keys(metadata.states);

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
      onSendToChat(metadata, 'workflow');
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg shadow-lg border-2 border-orange-400 w-[300px] relative">
        {/* Header */}
        <div className="px-3 py-2 border-b border-orange-400/30 bg-orange-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Workflow className="text-orange-200 flex-shrink-0" size={20} />
              <h3 className="text-base font-bold text-white truncate">{metadata.name}</h3>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                onClick={handleToggleExpand}
                className="p-1 hover:bg-orange-700 rounded transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronUp size={16} className="text-orange-200" />
                ) : (
                  <ChevronDown size={16} className="text-orange-200" />
                )}
              </button>
              {onSendToChat && (
                <button
                  onClick={handleSendToChat}
                  className="p-1 hover:bg-orange-700 rounded transition-colors"
                  title="Send workflow to chat"
                >
                  <ArrowRight size={16} className="text-orange-200" />
                </button>
              )}
              <button
                onClick={handleOpenEditor}
                className="p-1 hover:bg-orange-700 rounded transition-colors"
                title="Edit JSON"
              >
                <Code size={16} className="text-orange-200" />
              </button>
            </div>
          </div>
        </div>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="px-3 py-2 space-y-2">
          {/* State Count */}
          <div className="flex items-center space-x-2">
            <Hash className="text-orange-300 flex-shrink-0" size={14} />
            <div className="flex-1 min-w-0">
              <p className="text-orange-200 text-xs font-semibold">States</p>
              <p className="text-white text-sm">{metadata.stateCount} states</p>
            </div>
          </div>

          {/* State Names */}
          <div className="flex items-start space-x-2">
            <GitBranch className="text-orange-300 mt-0.5 flex-shrink-0" size={14} />
            <div className="flex-1 min-w-0">
              <p className="text-orange-200 text-xs font-semibold">State Flow</p>
              <div className="text-white text-sm space-y-0.5 max-h-32 overflow-y-auto">
                {stateNames.map((stateName, index) => {
                  const state = metadata.states[stateName];
                  const transitions = state.transitions || [];

                  return (
                    <div key={stateName} className="flex items-start space-x-1">
                      <span className="text-orange-300 flex-shrink-0">•</span>
                      <div className="flex-1 min-w-0">
                        <span className="truncate block">{stateName}</span>
                        {transitions.length > 0 && (
                          <span className="text-orange-300 text-xs truncate block">
                            → {transitions.map((t: any) => t.next).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="pt-1 border-t border-orange-400/20 space-y-1">
            <div className="flex items-center space-x-1">
              <ExternalLink className="text-orange-300 flex-shrink-0" size={12} />
              <a
                href={metadata.cyoda_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-200 text-xs hover:text-white truncate"
              >
                Cyoda
              </a>
            </div>
            <div className="flex items-center space-x-1">
              <ExternalLink className="text-orange-300 flex-shrink-0" size={12} />
              <a
                href={metadata.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-200 text-xs hover:text-white truncate"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      )}

        {/* Handles - 8 anchor points for maximum flexibility */}
        <Handle type="source" position={Position.Top} id="top" className="!bg-orange-400" />
        <Handle type="source" position={Position.Right} id="right" className="!bg-orange-400" />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-orange-400" />
        <Handle type="source" position={Position.Left} id="left" className="!bg-orange-400" />

        <Handle type="target" position={Position.Top} id="top-target" className="!bg-orange-400" />
        <Handle type="target" position={Position.Right} id="right-target" className="!bg-orange-400" />
        <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-orange-400" />
        <Handle type="target" position={Position.Left} id="left-target" className="!bg-orange-400" />
      </div>

      {/* JSON Editor Modal */}
      <NodeJsonEditor
        data={metadata}
        onSave={handleJsonSave}
        title={`Edit Workflow: ${metadata.name}`}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
    </>
  );
};

