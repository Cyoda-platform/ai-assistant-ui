import React, { useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

interface JsonGraphVisualizerProps {
  data: any;
  onNodeClick?: (path: string, value: any) => void;
}

// Custom node component for JSON values
const JsonNode: React.FC<{ data: any }> = ({ data }) => {
  const { label, value, type, isRoot } = data;

  const getNodeStyle = () => {
    const baseStyle = 'px-4 py-2 rounded-lg border-2 shadow-lg transition-all hover:shadow-xl';

    switch (type) {
      case 'object':
        return `${baseStyle} bg-blue-900/80 border-blue-500 text-blue-100`;
      case 'array':
        return `${baseStyle} bg-yellow-900/80 border-yellow-500 text-yellow-100`;
      case 'string':
        return `${baseStyle} bg-green-900/80 border-green-500 text-green-100`;
      case 'number':
        return `${baseStyle} bg-purple-900/80 border-purple-500 text-purple-100`;
      case 'boolean':
        return `${baseStyle} bg-pink-900/80 border-pink-500 text-pink-100`;
      case 'null':
        return `${baseStyle} bg-gray-900/80 border-gray-500 text-gray-100`;
      default:
        return `${baseStyle} bg-gray-900/80 border-gray-400 text-gray-100`;
    }
  };

  const getValueDisplay = () => {
    if (type === 'object') return `{ ${Object.keys(value || {}).length} keys }`;
    if (type === 'array') return `[ ${(value || []).length} items ]`;
    if (type === 'string') return `"${value}"`;
    if (type === 'boolean') return value ? 'true' : 'false';
    if (type === 'null') return 'null';
    return String(value);
  };

  return (
    <div className={getNodeStyle()}>
      <div className="font-semibold text-sm mb-1">{label}</div>
      <div className="text-xs opacity-80 font-mono">{getValueDisplay()}</div>
      {isRoot && (
        <div className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full">
          Root
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  jsonNode: JsonNode,
};

// Convert JSON to graph nodes and edges
const jsonToGraph = (obj: any, parentId: string = '', parentLabel: string = 'root'): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeId = 0;

  const traverse = (value: any, path: string, label: string, parentNodeId: string | null) => {
    const currentNodeId = `node-${nodeId++}`;
    const valueType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;

    // Create node
    nodes.push({
      id: currentNodeId,
      type: 'jsonNode',
      position: { x: 0, y: 0 }, // Will be calculated by dagre
      data: {
        label,
        value,
        type: valueType,
        path,
        isRoot: parentNodeId === null,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    // Create edge from parent
    if (parentNodeId !== null) {
      edges.push({
        id: `edge-${parentNodeId}-${currentNodeId}`,
        source: parentNodeId,
        target: currentNodeId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#60a5fa', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#60a5fa',
          width: 20,
          height: 20,
        },
      });
    }

    // Traverse children
    if (valueType === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        traverse(val, `${path}.${key}`, key, currentNodeId);
      });
    } else if (valueType === 'array') {
      value.forEach((item: any, index: number) => {
        traverse(item, `${path}[${index}]`, `[${index}]`, currentNodeId);
      });
    }
  };

  traverse(obj, parentLabel, parentLabel, null);
  return { nodes, edges };
};

// Layout nodes using dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 100,
        y: nodeWithPosition.y - 40,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const JsonGraphVisualizer: React.FC<JsonGraphVisualizerProps> = ({ data, onNodeClick }) => {
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR');

  // Generate graph from JSON
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    return jsonToGraph(data);
  }, [data]);

  // Apply layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, direction);
  }, [initialNodes, initialEdges, direction]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes and edges when data or direction changes
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.data.path, node.data.value);
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">No data to visualize</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-gray-900">
      {/* Direction Toggle */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-gray-800 rounded-lg p-2 border border-gray-700">
        <button
          onClick={() => setDirection('LR')}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            direction === 'LR'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Horizontal
        </button>
        <button
          onClick={() => setDirection('TB')}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            direction === 'TB'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Vertical
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-gray-800 rounded-lg p-3 border border-gray-700">
        <div className="text-xs font-semibold text-gray-300 mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-gray-300">Object</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-gray-300">Array</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-300">String</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="text-gray-300">Number</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-pink-500"></div>
            <span className="text-gray-300">Boolean</span>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#60a5fa', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#60a5fa',
          },
        }}
      >
        <Background color="#475569" gap={16} />
        <Controls className="bg-gray-800 border border-gray-700" />
        <MiniMap
          className="bg-gray-800 border border-gray-700"
          nodeColor={(node) => {
            switch (node.data.type) {
              case 'object': return '#3b82f6';
              case 'array': return '#eab308';
              case 'string': return '#22c55e';
              case 'number': return '#a855f7';
              case 'boolean': return '#ec4899';
              default: return '#6b7280';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};

