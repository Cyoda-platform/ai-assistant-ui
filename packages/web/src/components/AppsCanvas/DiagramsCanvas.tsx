/**
 * DiagramsCanvas - A canvas view for displaying diagrams in environments
 * Can be used standalone or integrated into AppsCanvas
 */

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  ControlButton,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Download, Upload, BarChart3 } from 'lucide-react';
import { DiagramNode } from './nodes/DiagramNode';
import { useDiagrams } from './hooks/useDiagrams';
import type { DiagramsConfiguration } from './types/diagrams';

const nodeTypes = {
  diagramNode: DiagramNode,
};

interface DiagramsCanvasProps {
  diagramsConfig?: DiagramsConfiguration;
  onConfigChange?: (config: DiagramsConfiguration) => void;
  environmentFilter?: string; // Filter to show only diagrams for specific environment
}

export const DiagramsCanvas: React.FC<DiagramsCanvasProps> = ({
  diagramsConfig,
  onConfigChange,
  environmentFilter,
}) => {
  const {
    config,
    diagramNodes,
    getDiagramsForEnv,
    exportConfig,
    importConfig,
  } = useDiagrams({
    initialConfig: diagramsConfig,
    onConfigChange,
  });

  // Filter nodes by environment if specified
  const filteredNodes = useMemo(() => {
    if (!environmentFilter) return diagramNodes;
    return getDiagramsForEnv(environmentFilter);
  }, [diagramNodes, environmentFilter, getDiagramsForEnv]);

  // Generate a stable key for ReactFlow to force remount when data changes
  const flowKey = React.useMemo(() => {
    return `diagrams-${environmentFilter || 'all'}-${filteredNodes.length}`;
  }, [environmentFilter, filteredNodes.length]);

  const [nodes, setNodes, onNodesChange] = useNodesState(filteredNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const handleExport = useCallback(() => {
    const jsonString = exportConfig();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagrams-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportConfig]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const jsonString = event.target?.result as string;
          const result = importConfig(jsonString);
          if (!result.success) {
            alert(`Failed to import: ${result.error}`);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [importConfig]);

  return (
    <div className="w-full h-full bg-slate-900">
      <ReactFlow
        key={flowKey}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        colorMode="dark"
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.05}
        maxZoom={4}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#334155"
        />
        <Controls className="bg-slate-800/90 border border-slate-600 rounded-lg">
          <ControlButton onClick={handleExport} title="Export diagrams configuration">
            <Download size={16} />
          </ControlButton>
          <ControlButton onClick={handleImport} title="Import diagrams configuration">
            <Upload size={16} />
          </ControlButton>
        </Controls>
        <MiniMap
          className="bg-slate-800/90 border border-slate-600 rounded-lg"
          nodeColor={(node) => {
            if (node.type === 'diagramNode') {
              const diagram = node.data?.diagram;
              if (diagram?.library === 'mermaid') return '#06b6d4';
              if (diagram?.library === 'reactflow') return '#3b82f6';
              if (diagram?.library === 'chartjs') return '#10b981';
            }
            return '#64748b';
          }}
          maskColor="rgba(15, 23, 42, 0.8)"
        />

        {/* Info Panel */}
        <Panel position="top-left" className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 m-4">
          <div className="flex items-center space-x-3">
            <BarChart3 size={24} className="text-cyan-400" />
            <div>
              <h3 className="text-white font-semibold">Diagrams Canvas</h3>
              <p className="text-xs text-gray-400">
                {environmentFilter
                  ? `Showing diagrams for: ${environmentFilter}`
                  : `${nodes.length} diagram(s) across ${config.environments.length} environment(s)`
                }
              </p>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

