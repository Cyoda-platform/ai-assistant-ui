import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  ControlButton,
  MiniMap,
  ConnectionMode,
  Panel,
  useReactFlow,
  useNodesState,
  useEdgesState,
  getNodesBounds,
  getViewportForBounds,
  reconnectEdge,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import type { Node, Edge, NodeChange, Connection, OnReconnect } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Download, Upload, Maximize2, Minimize2, FileJson, Network, Save, RefreshCw, GitCompare, GitPullRequest } from 'lucide-react';
import { hierarchicalLayout } from './utils/layoutAlgorithms';

import { AppNode } from './nodes/AppNode';
import { EnvironmentNode } from './nodes/EnvironmentNode';
import { EntityNode } from './nodes/EntityNode';
import { WorkflowNode } from './nodes/WorkflowNode';
import { GroupNode } from './nodes/GroupNode';
import { DiagramNode } from './nodes/DiagramNode';
import type { UIWorkflowData } from '../WorkflowCanvas/types/workflow';

// Register custom node types
const nodeTypes = {
  appNode: AppNode,
  environmentNode: EnvironmentNode,
  entityNode: EntityNode,
  workflowNode: WorkflowNode,
  groupNode: GroupNode,
  diagramNode: DiagramNode,
};

interface AppsReactFlowProps {
  workflowData: UIWorkflowData;
  onNodeDoubleClick?: (nodeId: string, nodeType: string, nodeData?: any) => void;
  onExport?: () => void;
  onImport?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onOpenJsonEditor?: () => void;
  onDeleteNodes?: (nodeIds: string[]) => void;
  onSave?: () => void;
  isSaving?: boolean;
  onRefreshFromGitHub?: () => void;
  isRefreshing?: boolean;
  onPullChanges?: () => void;
  isPulling?: boolean;
  onShowDiff?: () => void;
}

export const AppsReactFlow: React.FC<AppsReactFlowProps> = ({
  workflowData,
  onNodeDoubleClick,
  onExport,
  onImport,
  isFullscreen,
  onToggleFullscreen,
  onOpenJsonEditor,
  onDeleteNodes,
  onSave,
  isSaving = false,
  onRefreshFromGitHub,
  isRefreshing = false,
  onPullChanges,
  isPulling = false,
  onShowDiff,
}) => {
  const { fitView } = useReactFlow();
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const [showMinimap, setShowMinimap] = useState(() => {
    try {
      const stored = localStorage.getItem('apps-canvas-show-minimap');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [showGrid, setShowGrid] = useState(() => {
    try {
      const stored = localStorage.getItem('apps-canvas-show-grid');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [gridVariant, setGridVariant] = useState<BackgroundVariant>(() => {
    try {
      const stored = localStorage.getItem('apps-canvas-grid-variant');
      if (stored && ['dots', 'lines', 'cross'].includes(stored)) {
        return stored as BackgroundVariant;
      }
    } catch {
      // ignore
    }
    return BackgroundVariant.Dots;
  });

  const [edgeType, setEdgeType] = useState<'default' | 'straight' | 'step' | 'smoothstep'>(() => {
    try {
      const stored = localStorage.getItem('apps-canvas-edge-type');
      if (stored && ['default', 'straight', 'step', 'smoothstep'].includes(stored)) {
        return stored as 'default' | 'straight' | 'step' | 'smoothstep';
      }
    } catch {
      // ignore
    }
    return 'smoothstep'; // Changed default to smoothstep for smoother appearance
  });

  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>(() => {
    try {
      const stored = localStorage.getItem('apps-canvas-layout-direction');
      if (stored && ['TB', 'LR'].includes(stored)) {
        return stored as 'TB' | 'LR';
      }
    } catch {
      // ignore
    }
    return 'TB';
  });

  const [theme, setTheme] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('apps-canvas-theme');
      return stored || 'bluey-orange';
    } catch {
      return 'bluey-orange';
    }
  });

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apps-canvas-show-minimap', showMinimap.toString());
    } catch (error) {
      console.warn('Failed to save minimap setting:', error);
    }
  }, [showMinimap]);

  useEffect(() => {
    try {
      localStorage.setItem('apps-canvas-show-grid', showGrid.toString());
    } catch (error) {
      console.warn('Failed to save grid setting:', error);
    }
  }, [showGrid]);

  useEffect(() => {
    try {
      localStorage.setItem('apps-canvas-grid-variant', gridVariant);
    } catch (error) {
      console.warn('Failed to save grid variant:', error);
    }
  }, [gridVariant]);

  useEffect(() => {
    try {
      localStorage.setItem('apps-canvas-edge-type', edgeType);
    } catch (error) {
      console.warn('Failed to save edge type:', error);
    }
  }, [edgeType]);

  useEffect(() => {
    try {
      localStorage.setItem('apps-canvas-layout-direction', layoutDirection);
    } catch (error) {
      console.warn('Failed to save layout direction:', error);
    }
  }, [layoutDirection]);

  useEffect(() => {
    try {
      localStorage.setItem('apps-canvas-theme', theme);
    } catch (error) {
      console.warn('Failed to save theme:', error);
    }
  }, [theme]);

  // Convert workflow data to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    console.log('🔄 Creating nodes from workflow data:', {
      layoutStatesCount: workflowData.layout.states.length,
      entityStates: workflowData.layout.states.filter(s => s.type === 'entityNode').map(s => ({
        id: s.id,
        type: s.type,
        position: s.position,
        entityName: s.data?.entityName
      }))
    });

    const nodes = workflowData.layout.states.map((state) => ({
      id: state.id,
      type: state.type || 'default',
      position: state.position,
      data: {
        label: state.type === 'entityNode' ? `Entity: ${state.data?.entityName || state.id}` : (state.data?.label || state.id),
        ...state.data
      },
      draggable: true,
    }));

    console.log('✅ Final nodes created:', {
      totalNodes: nodes.length,
      entityNodes: nodes.filter(n => n.type === 'entityNode').map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        entityName: n.data?.entityName
      }))
    });

    // Check for duplicate node IDs
    const nodeIds = nodes.map(n => n.id);
    const duplicates = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      console.error('❌ Duplicate node IDs found:', duplicates);
    }

    return nodes;
  }, [workflowData]);

  // Helper function to determine best anchor points based on node positions
  // Uses angle-based calculation for smooth, natural edge routing
  const getBestAnchorPoints = useCallback((sourceNode: Node, targetNode: Node) => {
    const dx = targetNode.position.x - sourceNode.position.x;
    const dy = targetNode.position.y - sourceNode.position.y;

    // Calculate angle from source to target (-180 to 180 degrees)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Determine best anchor points based on angle (8-directional)
    let sourceHandle = 'bottom';
    let targetHandle = 'top-target';

    if (angle >= -22.5 && angle < 22.5) {
      // Right (0°)
      sourceHandle = 'right';
      targetHandle = 'left-target';
    } else if (angle >= 22.5 && angle < 67.5) {
      // Bottom-right (45°)
      sourceHandle = 'bottom';
      targetHandle = 'left-target';
    } else if (angle >= 67.5 && angle < 112.5) {
      // Bottom (90°)
      sourceHandle = 'bottom';
      targetHandle = 'top-target';
    } else if (angle >= 112.5 && angle < 157.5) {
      // Bottom-left (135°)
      sourceHandle = 'bottom';
      targetHandle = 'right-target';
    } else if (angle >= 157.5 || angle < -157.5) {
      // Left (180°)
      sourceHandle = 'left';
      targetHandle = 'right-target';
    } else if (angle >= -157.5 && angle < -112.5) {
      // Top-left (-135°)
      sourceHandle = 'top';
      targetHandle = 'right-target';
    } else if (angle >= -112.5 && angle < -67.5) {
      // Top (-90°)
      sourceHandle = 'top';
      targetHandle = 'bottom-target';
    } else if (angle >= -67.5 && angle < -22.5) {
      // Top-right (-45°)
      sourceHandle = 'top';
      targetHandle = 'left-target';
    }

    return { sourceHandle, targetHandle };
  }, []);

  // Convert workflow data to React Flow edges with smart anchor points
  const initialEdges: Edge[] = useMemo(() => {
    return workflowData.layout.transitions.map((transition) => {
      const sourceNode = initialNodes.find(n => n.id === transition.source);
      const targetNode = initialNodes.find(n => n.id === transition.target);

      let sourceHandle = 'bottom';
      let targetHandle = 'top-target';

      if (sourceNode && targetNode) {
        const anchors = getBestAnchorPoints(sourceNode, targetNode);
        sourceHandle = anchors.sourceHandle;
        targetHandle = anchors.targetHandle;
      }

      return {
        id: transition.id,
        source: transition.source,
        target: transition.target,
        sourceHandle,
        targetHandle,
        label: transition.label,
        type: edgeType,
        animated: true, // Enable animation for visual feedback
        style: {
          stroke: '#64748b', // Slightly darker for better contrast
          strokeWidth: 2.5, // Slightly thicker for better visibility
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#64748b',
        },
      };
    });
  }, [workflowData, edgeType, initialNodes, getBestAnchorPoints]);

  // Generate a stable key for ReactFlow - only change when workflow name changes
  // Don't include node/edge counts to prevent remounting when adding entities
  const flowKey = useMemo(() => {
    return `flow-${workflowData.configuration.name}`;
  }, [workflowData.configuration.name]);

  // Use React Flow state hooks for drag-and-drop
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node click for navigation (single click)
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const nodeType = node.data?.metadata?.type || node.type || 'unknown';
      // Pass node metadata for workflows to include entity information
      const nodeData = node.data?.metadata;

      console.log('🖱️ AppsReactFlow: Node clicked:', {
        nodeId: node.id,
        nodeType,
        nodeData,
        hasEntityId: !!nodeData?.entity_id
      });

      onNodeDoubleClick?.(node.id, nodeType, nodeData);
    },
    [onNodeDoubleClick]
  );

  // Handle node double-click for navigation
  const handleNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const nodeType = node.data?.metadata?.type || node.type || 'unknown';
      // Pass node metadata for workflows to include entity information
      const nodeData = node.data?.metadata;

      console.log('🖱️ AppsReactFlow: Node double-clicked:', {
        nodeId: node.id,
        nodeType,
        nodeData,
        hasEntityId: !!nodeData?.entity_id
      });

      onNodeDoubleClick?.(node.id, nodeType, nodeData);
    },
    [onNodeDoubleClick]
  );

  // Auto-layout using hierarchical algorithm
  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = hierarchicalLayout(nodes, edges);
    setNodes(layoutedNodes);

    // Fit view after layout with a small delay to ensure nodes are positioned
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [nodes, edges, setNodes, fitView]);

  // Handle edge reconnection - allow users to manually move edges
  const onReconnect: OnReconnect = useCallback(
    (oldEdge, newConnection) => {
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges]
  );

  // Handle new connections with smart anchor points
  const onConnect = useCallback(
    (connection: Connection) => {
      // Calculate optimal anchor points for the new connection
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);

      let sourceHandle = connection.sourceHandle;
      let targetHandle = connection.targetHandle;

      if (sourceNode && targetNode && !sourceHandle && !targetHandle) {
        const anchors = getBestAnchorPoints(sourceNode, targetNode);
        sourceHandle = anchors.sourceHandle;
        targetHandle = anchors.targetHandle;
      }

      setEdges((eds) => addEdge({
        ...connection,
        sourceHandle,
        targetHandle,
        type: edgeType,
        animated: true,
        style: {
          stroke: '#64748b',
          strokeWidth: 2.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#64748b',
        },
      }, eds));
    },
    [setEdges, edgeType, nodes, getBestAnchorPoints]
  );

  // Track selected nodes for deletion and recalculate edges on node drag
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Track selected nodes
      const selected = nodes.filter(n => n.selected).map(n => n.id);
      setSelectedNodes(selected);

      // Recalculate edge anchor points when nodes are dragged
      const hasDragChanges = changes.some(change =>
        change.type === 'position' && change.dragging === false
      );

      if (hasDragChanges) {
        setEdges((currentEdges) => {
          return currentEdges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (sourceNode && targetNode) {
              const anchors = getBestAnchorPoints(sourceNode, targetNode);
              return {
                ...edge,
                sourceHandle: anchors.sourceHandle,
                targetHandle: anchors.targetHandle,
              };
            }

            return edge;
          });
        });
      }
    },
    [onNodesChange, nodes, setEdges, getBestAnchorPoints]
  );

  // Handle backspace key to delete selected nodes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        // Check if we're not in an input field
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }

        if (selectedNodes.length > 0) {
          event.preventDefault();

          // Collect all nodes to delete (including children)
          const nodesToDelete = new Set<string>();

          selectedNodes.forEach(nodeId => {
            nodesToDelete.add(nodeId);

            // Find all children recursively
            const findChildren = (parentId: string) => {
              edges.forEach(edge => {
                if (edge.source === parentId && !nodesToDelete.has(edge.target)) {
                  nodesToDelete.add(edge.target);
                  findChildren(edge.target);
                }
              });
            };

            findChildren(nodeId);
          });

          // Call delete handler
          onDeleteNodes?.(Array.from(nodesToDelete));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, edges, onDeleteNodes]);

  return (
    <div className="w-full h-full bg-slate-900">
      <style>{`
        .react-flow__node {
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }
        .react-flow__edge {
          transition: stroke 0.3s ease-out, stroke-width 0.3s ease-out;
        }
        .react-flow__edge:hover {
          stroke-width: 3.5px !important;
        }
        .react-flow__edge.selected {
          stroke: #06b6d4 !important;
          stroke-width: 3px !important;
        }
      `}</style>
      <ReactFlow
        key={flowKey}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onConnect={onConnect}
        onReconnect={onReconnect}
        connectionMode={ConnectionMode.Loose}
        colorMode="dark"
        fitView={false}
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 1.5
        }}
        onInit={(reactFlowInstance) => {
          console.log('🔄 ReactFlow initialized, fitting view to nodes');
          // Don't auto-fit view on init to prevent repositioning
          // setTimeout(() => {
          //   reactFlowInstance.fitView({ padding: 0.2 });
          // }, 100);
        }}
        minZoom={0.05}
        maxZoom={4}

        defaultEdgeOptions={{
          type: edgeType,
          animated: true,
          style: {
            stroke: '#64748b',
            strokeWidth: 2.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#64748b',
          },
        }}
        nodesDraggable={true}
        nodesConnectable={true}
        edgesReconnectable={true}
        elementsSelectable={true}
        nodeOrigin={[0.5, 0.5]}
        snapToGrid={true}
        snapGrid={[15, 15]}
        proOptions={{ hideAttribution: true }}
      >
        {showGrid && <Background color="#475569" gap={16} variant={gridVariant} />}

        <Controls className="bg-slate-800 border-slate-700">
          {/* Refresh from GitHub Button */}
          {onRefreshFromGitHub && (
            <ControlButton
              onClick={onRefreshFromGitHub}
              title={isRefreshing ? "Refreshing..." : "Refresh from GitHub"}
              className={`hover:bg-slate-700 ${isRefreshing ? 'opacity-50 cursor-wait' : ''}`}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw size={16} className="text-green-400" />
              )}
            </ControlButton>
          )}

          {/* Pull Changes Button */}
          {onPullChanges && (
            <ControlButton
              onClick={onPullChanges}
              title={isPulling ? "Pulling..." : "Pull Changes from Remote"}
              className={`hover:bg-slate-700 ${isPulling ? 'opacity-50 cursor-wait' : ''}`}
              disabled={isPulling}
            >
              {isPulling ? (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <GitPullRequest size={16} className="text-blue-400" />
              )}
            </ControlButton>
          )}

          {/* Show Diff Button */}
          {onShowDiff && (
            <ControlButton
              onClick={onShowDiff}
              title="Show Uncommitted Changes"
              className="hover:bg-slate-700"
            >
              <GitCompare size={16} className="text-orange-400" />
            </ControlButton>
          )}



          {/* Auto Layout Button */}
          <ControlButton
            onClick={handleAutoLayout}
            title="Auto Layout"
            className="hover:bg-slate-700"
          >
            <Network size={16} />
          </ControlButton>

          {/* JSON Editor Button */}
          {onOpenJsonEditor && (
            <ControlButton
              onClick={onOpenJsonEditor}
              title="Open JSON Editor"
              className="hover:bg-slate-700"
            >
              <FileJson size={16} />
            </ControlButton>
          )}

          {/* Export Button */}
          {onExport && (
            <ControlButton
              onClick={onExport}
              title="Export to File"
              className="hover:bg-slate-700"
            >
              <Download size={16} />
            </ControlButton>
          )}

          {/* Import Button */}
          {onImport && (
            <ControlButton
              onClick={onImport}
              title="Import from File"
              className="hover:bg-slate-700"
            >
              <Upload size={16} />
            </ControlButton>
          )}

          {/* Fullscreen Toggle */}
          {onToggleFullscreen && (
            <ControlButton
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="hover:bg-slate-700"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </ControlButton>
          )}

          {/* Separator */}
          <div className="w-px h-6 bg-slate-600 mx-1" />

          {/* Pull Changes Button */}
          {onPullChanges && (
            <ControlButton
              onClick={onPullChanges}
              title="Pull Changes from Repository - Sync the latest changes from your remote repository"
              disabled={isPulling}
              className={`canvas-action-button pull ${isPulling ? 'active cursor-not-allowed' : ''}`}
            >
              {isPulling ? (
                <div className="flex items-center space-x-2 px-2">
                  <div className="canvas-button-spinner" />
                  <span className="canvas-button-text">Pulling...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 px-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5c0-1.66 4-3 9-3s9 1.34 9 3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    <path d="M12 12L8 8m4 4l4-4m-4 4v8" />
                  </svg>
                  <span className="canvas-button-text">Pull</span>
                </div>
              )}
            </ControlButton>
          )}
        </Controls>

        {showMinimap && (
          <MiniMap
            className="bg-slate-800 border-slate-700"
            style={{
              backgroundColor: '#1e293b',
            }}
            maskColor="rgba(15, 23, 42, 0.8)"
            nodeColor={(node) => {
              if (node.type === 'appNode') return '#9333ea';
              if (node.type === 'environmentNode') return '#10b981';
              if (node.type === 'entityNode') return '#3b82f6';
              if (node.type === 'workflowNode') return '#f59e0b';
              return '#64748b';
            }}
          />
        )}

        {/* Info Panel */}
        <Panel position="top-left" className="bg-slate-800/90 rounded-lg p-3 border border-slate-700">
          <div className="text-white">
            <h3 className="font-bold text-lg">{workflowData.configuration.name}</h3>
            <p className="text-slate-300 text-sm">{workflowData.configuration.desc}</p>
            <div className="mt-2 text-xs text-slate-400">
              <p>{nodes.length} nodes • {edges.length} connections</p>
            </div>
          </div>
        </Panel>
      </ReactFlow>


    </div>
  );
};

