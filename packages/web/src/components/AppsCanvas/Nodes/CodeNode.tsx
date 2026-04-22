import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Code, FileCode, Braces } from 'lucide-react';

interface CodeNodeData {
  name: string;
  language: 'typescript' | 'javascript' | 'python' | 'java';
  description?: string;
  linesOfCode?: number;
  onClick?: () => void;
}

export const CodeNode: React.FC<NodeProps<CodeNodeData>> = ({ data, selected }) => {
  const { name, language, description, linesOfCode, onClick } = data;

  const getLanguageColor = () => {
    switch (language) {
      case 'typescript': return 'from-blue-500 to-blue-600';
      case 'javascript': return 'from-yellow-500 to-yellow-600';
      case 'python': return 'from-green-500 to-green-600';
      case 'java': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getLanguageIcon = () => {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return <Braces size={12} className="text-white" />;
      case 'python':
      case 'java':
        return <FileCode size={12} className="text-white" />;
      default:
        return <Code size={12} className="text-white" />;
    }
  };

  return (
    <div
      className={`
        bg-gradient-to-br ${getLanguageColor()}
        rounded-lg shadow-lg border-2 transition-all duration-300
        min-w-[120px] max-w-[160px] cursor-pointer
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

      {/* Header */}
      <div className="p-2 border-b border-white/20">
        <div className="flex items-center space-x-1.5">
          <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded flex items-center justify-center">
            {getLanguageIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h6 className="text-white font-semibold text-[10px] line-clamp-2 leading-tight">
              {name}
            </h6>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between text-white/90 text-[9px]">
          <span className="capitalize">{language}</span>
          {linesOfCode && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded-full">
              {linesOfCode} LOC
            </span>
          )}
        </div>
        {description && (
          <p className="text-white/70 text-[9px] line-clamp-2">{description}</p>
        )}
      </div>
    </div>
  );
};

