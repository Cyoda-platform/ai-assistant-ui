import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowProvider,
  MarkerType
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  LayoutGrid,
  Network,
  Circle,
  GitBranch,
  Maximize2,
  Minimize2,
  Filter,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

import { EntityNode } from './Nodes/EntityNode';
import { VersionNode } from './Nodes/VersionNode';
import { WorkflowNode } from './Nodes/WorkflowNode';
import { RequirementNode } from './Nodes/RequirementNode';
import { layoutAlgorithms } from './utils/layoutAlgorithms';
import type { PortalData, LayoutAlgorithm, PortalFilters } from './types/portal';

const nodeTypes = {
  entityNode: EntityNode,
  versionNode: VersionNode,
  workflowNode: WorkflowNode,
  requirementNode: RequirementNode,
};

interface PortalCanvasProps {
  data: PortalData;
  onEntityClick?: (entityId: string) => void;
  onVersionClick?: (versionId: string) => void;
  onWorkflowClick?: (workflowId: string) => void;
  onWorkflowEdit?: (workflowId: string) => void;
  onRequirementClick?: (requirementId: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onBack?: () => void;
}

const PortalCanvasInner: React.FC<PortalCanvasProps> = ({
  data,
  onEntityClick,
  onVersionClick,
  onWorkflowClick,
  onWorkflowEdit,
  onRequirementClick,
  isFullscreen = false,
  onToggleFullscreen,
  onBack
}) => {
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<LayoutAlgorithm>('hierarchical');
  const [filters, setFilters] = useState<PortalFilters>({
    showEntities: true,
    showVersions: true,
    showWorkflows: true,
    showRequirements: true
  });

  // Convert portal data to React Flow nodes
  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];

    // Entity nodes
    if (filters.showEntities) {
      data.entities.forEach(entity => {
        nodes.push({
          id: entity.id,
          type: 'entityNode',
          position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
          data: {
            name: entity.name,
            description: entity.description,
            versionCount: entity.versionCount,
            workflowCount: entity.workflowCount,
            requirementCount: entity.requirementCount,
            onClick: () => onEntityClick?.(entity.id)
          }
        });
      });
    }

    // Version nodes
    if (filters.showVersions) {
      data.versions.forEach(version => {
        nodes.push({
          id: version.id,
          type: 'versionNode',
          position: { x: 0, y: 0 },
          data: {
            entityId: version.entityId,
            version: version.version,
            state: version.state,
            workflowCount: version.workflowCount,
            requirementCount: version.requirementCount,
            createdAt: version.createdAt,
            isActive: version.isActive,
            onClick: () => onVersionClick?.(version.id)
          }
        });
      });
    }

    // Workflow nodes
    if (filters.showWorkflows) {
      data.workflows.forEach(workflow => {
        nodes.push({
          id: workflow.id,
          type: 'workflowNode',
          position: { x: 0, y: 0 },
          data: {
            versionId: workflow.versionId,
            name: workflow.name,
            stateCount: workflow.stateCount,
            transitionCount: workflow.transitionCount,
            updatedAt: workflow.updatedAt,
            onClick: () => onWorkflowClick?.(workflow.id),
            onEdit: () => onWorkflowEdit?.(workflow.id)
          }
        });
      });
    }

    // Requirement nodes
    if (filters.showRequirements) {
      data.requirements.forEach(requirement => {
        nodes.push({
          id: requirement.id,
          type: 'requirementNode',
          position: { x: 0, y: 0 },
          data: {
            workflowId: requirement.workflowId,
            versionId: requirement.versionId,
            title: requirement.title,
            status: requirement.status,
            priority: requirement.priority,
            onClick: () => onRequirementClick?.(requirement.id)
          }
        });
      });
    }

    return nodes;
  }, [data, filters, onEntityClick, onVersionClick, onWorkflowClick, onWorkflowEdit, onRequirementClick]);

  // Convert portal data to React Flow edges
  const initialEdges = useMemo(() => {
    const edges: Edge[] = [];

    // Entity -> Version edges
    if (filters.showEntities && filters.showVersions) {
      data.versions.forEach(version => {
        edges.push({
          id: `e-${version.entityId}-${version.id}`,
          source: version.entityId,
          target: version.id,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#60a5fa', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' }
        });
      });
    }

    // Version -> Workflow edges
    if (filters.showVersions && filters.showWorkflows) {
      data.workflows.forEach(workflow => {
        edges.push({
          id: `w-${workflow.versionId}-${workflow.id}`,
          source: workflow.versionId,
          target: workflow.id,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#a78bfa', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#a78bfa' }
        });
      });
    }

    // Workflow -> Requirement edges
    if (filters.showWorkflows && filters.showRequirements) {
      data.requirements.forEach(requirement => {
        if (requirement.workflowId) {
          edges.push({
            id: `r-${requirement.workflowId}-${requirement.id}`,
            source: requirement.workflowId,
            target: requirement.id,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#6b7280', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' }
          });
        }
      });
    }

    return edges;
  }, [data, filters]);

  // Apply layout algorithm
  const layoutedNodes = useMemo(() => {
    const layoutFn = layoutAlgorithms[layoutAlgorithm];
    return layoutFn(initialNodes, initialEdges);
  }, [initialNodes, initialEdges, layoutAlgorithm]);

  // Generate a stable key for ReactFlow to force remount when data changes
  const flowKey = React.useMemo(() => {
    return `portal-${layoutAlgorithm}-${layoutedNodes.length}-${initialEdges.length}`;
  }, [layoutAlgorithm, layoutedNodes.length, initialEdges.length]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleRelayout = useCallback(() => {
    const layoutFn = layoutAlgorithms[layoutAlgorithm];
    const newNodes = layoutFn(nodes, edges);
    setNodes(newNodes);
  }, [layoutAlgorithm, nodes, edges, setNodes]);

  return (
    <div className="h-full w-full" style={{ background: '#0f172a' }}>
      <ReactFlow
        key={flowKey}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        className="dark"
        colorMode="dark"
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#334155"
        />
        <Controls className="bg-slate-800/90 border border-slate-600 rounded-lg" />
        <MiniMap
          className="bg-slate-800/90 border border-slate-600 rounded-lg"
          nodeColor={(node) => {
            switch (node.type) {
              case 'entityNode': return '#2563eb';
              case 'versionNode': return '#f59e0b';
              case 'workflowNode': return '#9333ea';
              case 'requirementNode': return '#6b7280';
              default: return '#64748b';
            }
          }}
          maskColor="rgba(15, 23, 42, 0.8)"
        />

        {/* Control Panel */}
        <Panel position="top-right" className="bg-slate-800/95 border border-slate-600 rounded-lg p-3 space-y-2">
          {/* Layout selector */}
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-medium">Layout</label>
            <div className="flex space-x-1">
              <button
                onClick={() => setLayoutAlgorithm('hierarchical')}
                className={`p-1.5 rounded ${layoutAlgorithm === 'hierarchical' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                title="Hierarchical"
              >
                <Network size={16} className="text-white" />
              </button>
              <button
                onClick={() => setLayoutAlgorithm('grid')}
                className={`p-1.5 rounded ${layoutAlgorithm === 'grid' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                title="Grid"
              >
                <LayoutGrid size={16} className="text-white" />
              </button>
              <button
                onClick={() => setLayoutAlgorithm('circular')}
                className={`p-1.5 rounded ${layoutAlgorithm === 'circular' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                title="Circular"
              >
                <Circle size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* Relayout button */}
          <button
            onClick={handleRelayout}
            className="w-full px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs flex items-center justify-center space-x-1"
          >
            <RefreshCw size={12} />
            <span>Relayout</span>
          </button>

          {/* Fullscreen toggle */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="w-full px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs flex items-center justify-center space-x-1"
            >
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          )}

          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="w-full px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs flex items-center justify-center space-x-1"
            >
              <ArrowLeft size={12} />
              <span>Back</span>
            </button>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Wrapper with ReactFlowProvider
export const PortalCanvas: React.FC<PortalCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <PortalCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

