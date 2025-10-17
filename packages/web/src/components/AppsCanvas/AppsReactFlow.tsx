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
import { Settings, HelpCircle, Download, Upload, Maximize2, Minimize2, FileJson, Network } from 'lucide-react';
import { hierarchicalLayout } from './utils/layoutAlgorithms';

import { AppNode } from './nodes/AppNode';
import { EnvironmentNode } from './nodes/EnvironmentNode';
import { EntityNode } from './nodes/EntityNode';
import { WorkflowNode } from './nodes/WorkflowNode';
import { GroupNode } from './nodes/GroupNode';
import type { UIWorkflowData } from '../WorkflowCanvas/types/workflow';
import { AppsSettings } from './AppsSettings';
import { AppsQuickHelp } from './AppsQuickHelp';

// Register custom node types
const nodeTypes = {
  appNode: AppNode,
  environmentNode: EnvironmentNode,
  entityNode: EntityNode,
  workflowNode: WorkflowNode,
  groupNode: GroupNode,
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
}) => {
  const { fitView } = useReactFlow();
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  // State for panels with localStorage persistence
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickHelp, setShowQuickHelp] = useState(false);

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
    return 'default';
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
    return workflowData.layout.states.map((state) => ({
      id: state.id,
      type: state.type || 'default',
      position: state.position,
      data: state.data || { label: state.id },
      draggable: true,
    }));
  }, [workflowData]);

  // Helper function to determine best anchor points based on node positions
  const getBestAnchorPoints = useCallback((sourceNode: Node, targetNode: Node) => {
    const sourceX = sourceNode.position.x;
    const sourceY = sourceNode.position.y;
    const targetX = targetNode.position.x;
    const targetY = targetNode.position.y;

    // If target is below source, use bottom → top
    if (targetY > sourceY + 50) {
      return { sourceHandle: 'bottom', targetHandle: 'top-target' };
    }
    // If target is above source, use top → bottom
    if (targetY < sourceY - 50) {
      return { sourceHandle: 'top', targetHandle: 'bottom-target' };
    }
    // If target is to the right, use right → left
    if (targetX > sourceX + 50) {
      return { sourceHandle: 'right', targetHandle: 'left-target' };
    }
    // If target is to the left, use left → right
    if (targetX < sourceX - 50) {
      return { sourceHandle: 'left', targetHandle: 'right-target' };
    }
    // Default: bottom → top
    return { sourceHandle: 'bottom', targetHandle: 'top-target' };
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
        animated: false,
        style: { stroke: '#64748b', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#64748b',
        },
      };
    });
  }, [workflowData, edgeType, initialNodes, getBestAnchorPoints]);

  // Use React Flow state hooks for drag-and-drop
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when workflowData changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when workflowData or edgeType changes
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

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

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({
        ...connection,
        type: edgeType,
        animated: false,
        style: { stroke: '#64748b', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#64748b',
        },
      }, eds));
    },
    [setEdges, edgeType]
  );

  // Track selected nodes for deletion
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Track selected nodes
      const selected = nodes.filter(n => n.selected).map(n => n.id);
      setSelectedNodes(selected);
    },
    [onNodesChange, nodes]
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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={handleNodeDoubleClick}
        onConnect={onConnect}
        onReconnect={onReconnect}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.05}
        maxZoom={4}
        defaultEdgeOptions={{
          type: edgeType,
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
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
      >
        {showGrid && <Background color="#475569" gap={16} variant={gridVariant} />}

        <Controls className="bg-slate-800 border-slate-700">
          {/* Auto Layout Button */}
          <ControlButton
            onClick={handleAutoLayout}
            title="Auto Layout"
            className="hover:bg-slate-700"
          >
            <Network size={16} />
          </ControlButton>

          {/* Settings Button */}
          <ControlButton
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
            className="hover:bg-slate-700"
          >
            <Settings size={16} />
          </ControlButton>

          {/* Quick Help Button */}
          <ControlButton
            onClick={() => setShowQuickHelp(!showQuickHelp)}
            title="Quick Help"
            className="hover:bg-slate-700"
          >
            <HelpCircle size={16} />
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

      {/* Settings Panel */}
      {showSettings && (
        <AppsSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          showMinimap={showMinimap}
          onToggleMinimap={() => setShowMinimap(!showMinimap)}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          gridVariant={gridVariant}
          onGridVariantChange={setGridVariant}
          edgeType={edgeType}
          onEdgeTypeChange={setEdgeType}
          layoutDirection={layoutDirection}
          onLayoutDirectionChange={setLayoutDirection}
          theme={theme}
          onThemeChange={setTheme}
        />
      )}

      {/* Quick Help Panel */}
      {showQuickHelp && (
        <AppsQuickHelp
          isOpen={showQuickHelp}
          onClose={() => setShowQuickHelp(false)}
        />
      )}
    </div>
  );
};

