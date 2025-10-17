import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BarChart3, Maximize2, Minimize2, Copy, Download, Info } from 'lucide-react';
import MermaidDiagram from '../../MermaidDiagram/MermaidDiagram';
import type { DiagramConfig, MermaidDiagramConfig } from '../types/diagrams';

interface DiagramNodeData {
  diagram: DiagramConfig;
  onClick?: () => void;
}

export const DiagramNode: React.FC<{ data: DiagramNodeData }> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const { diagram } = data;

  const getDiagramIcon = () => {
    switch (diagram.library) {
      case 'mermaid':
        return <BarChart3 size={18} className="text-cyan-400" />;
      case 'reactflow':
        return <BarChart3 size={18} className="text-blue-400" />;
      case 'chartjs':
        return <BarChart3 size={18} className="text-green-400" />;
      default:
        return <BarChart3 size={18} className="text-gray-400" />;
    }
  };

  const getLibraryColor = () => {
    switch (diagram.library) {
      case 'mermaid':
        return 'from-cyan-600 to-cyan-700 border-cyan-500';
      case 'reactflow':
        return 'from-blue-600 to-blue-700 border-blue-500';
      case 'chartjs':
        return 'from-green-600 to-green-700 border-green-500';
      default:
        return 'from-gray-600 to-gray-700 border-gray-500';
    }
  };

  const handleCopyContent = () => {
    if (diagram.library === 'mermaid') {
      const mermaidDiagram = diagram as MermaidDiagramConfig;
      navigator.clipboard.writeText(mermaidDiagram.content);
    }
  };

  const handleDownload = () => {
    if (diagram.library === 'mermaid') {
      const mermaidDiagram = diagram as MermaidDiagramConfig;
      const blob = new Blob([mermaidDiagram.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${diagram.name.replace(/\s+/g, '-').toLowerCase()}.mmd`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderDiagramContent = () => {
    if (diagram.library === 'mermaid') {
      const mermaidDiagram = diagram as MermaidDiagramConfig;
      return (
        <div className="w-full h-full overflow-auto bg-slate-900/50 rounded-lg p-4">
          <MermaidDiagram
            chart={mermaidDiagram.content}
            id={`diagram-${diagram.id}`}
          />
        </div>
      );
    }

    // Placeholder for other diagram types
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900/50 rounded-lg p-4">
        <div className="text-center">
          <BarChart3 size={48} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-400">
            {diagram.library} diagram support coming soon
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`
        ${isExpanded ? 'min-w-[800px] min-h-[600px]' : 'min-w-[400px] min-h-[300px]'}
        rounded-xl border-2 shadow-2xl
        bg-gradient-to-br ${getLibraryColor()}
        backdrop-blur-sm transition-all duration-300
        hover:shadow-3xl
        relative overflow-hidden
      `}
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />

      {/* Header */}
      <div className="relative p-4 border-b border-white/20">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              {getDiagramIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate">
                {diagram.name}
              </h3>
              <p className="text-xs text-white/70 uppercase tracking-wider">
                {diagram.library} • {diagram.library === 'mermaid' ? (diagram as MermaidDiagramConfig).diagramType : 'diagram'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 ml-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Info"
            >
              <Info size={16} className="text-white" />
            </button>
            {diagram.library === 'mermaid' && (
              <>
                <button
                  onClick={handleCopyContent}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Copy diagram source"
                >
                  <Copy size={16} className="text-white" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Download diagram"
                >
                  <Download size={16} className="text-white" />
                </button>
              </>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <Minimize2 size={16} className="text-white" />
              ) : (
                <Maximize2 size={16} className="text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Description (shown when info is toggled) */}
        {showInfo && diagram.description && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-sm text-white/80">
              {diagram.description}
            </p>
          </div>
        )}
      </div>

      {/* Diagram Content */}
      <div className={`relative ${isExpanded ? 'h-[calc(100%-80px)]' : 'h-[calc(100%-80px)]'} p-4`}>
        {renderDiagramContent()}
      </div>

      {/* React Flow Handles - 8 anchor points */}
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

