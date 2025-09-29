import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface WorkflowCanvasProps {
  onDataChange?: (data: string) => void;
  onSubmit?: () => void;
}

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start Request' },
    position: { x: 50, y: 50 },
    style: {
      background: '#14B8A6',
      color: 'white',
      border: '1px solid #0F766E',
      borderRadius: '8px',
      fontSize: '12px',
      padding: '8px 12px',
    },
  },
  {
    id: '2',
    data: { label: 'Process Entity' },
    position: { x: 50, y: 150 },
    style: {
      background: '#3B82F6',
      color: 'white',
      border: '1px solid #1E40AF',
      borderRadius: '8px',
      fontSize: '12px',
      padding: '8px 12px',
    },
  },
  {
    id: '3',
    data: { label: 'Validate Data' },
    position: { x: 200, y: 150 },
    style: {
      background: '#8B5CF6',
      color: 'white',
      border: '1px solid #6D28D9',
      borderRadius: '8px',
      fontSize: '12px',
      padding: '8px 12px',
    },
  },
  {
    id: '4',
    data: { label: 'Generate Response' },
    position: { x: 50, y: 250 },
    style: {
      background: '#F59E0B',
      color: 'white',
      border: '1px solid #D97706',
      borderRadius: '8px',
      fontSize: '12px',
      padding: '8px 12px',
    },
  },
  {
    id: '5',
    type: 'output',
    data: { label: 'Complete' },
    position: { x: 200, y: 250 },
    style: {
      background: '#10B981',
      color: 'white',
      border: '1px solid #047857',
      borderRadius: '8px',
      fontSize: '12px',
      padding: '8px 12px',
    },
  },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    style: { stroke: '#64748B', strokeWidth: 2 },
    animated: true,
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    style: { stroke: '#64748B', strokeWidth: 2 },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    style: { stroke: '#64748B', strokeWidth: 2 },
  },
  {
    id: 'e3-5',
    source: '3',
    target: '5',
    style: { stroke: '#64748B', strokeWidth: 2 },
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    style: { stroke: '#64748B', strokeWidth: 2 },
  },
];

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ onDataChange, onSubmit }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Update parent component when workflow data changes
  useEffect(() => {
    if (onDataChange) {
      const workflowData = JSON.stringify({ nodes, edges }, null, 2);
      onDataChange(workflowData);
    }
  }, [nodes, edges, onDataChange]);

  return (
    <div className="w-full h-full bg-slate-900 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="bg-slate-900"
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
      >
        <Controls
          className="bg-slate-800/90 border border-slate-600 rounded-lg shadow-lg"
          style={{
            button: {
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #475569',
              borderRadius: '6px',
            }
          }}
        />
        <MiniMap
          className="bg-slate-800/90 border border-slate-600 rounded-lg shadow-lg"
          nodeColor="#64748b"
          maskColor="rgba(15, 23, 42, 0.8)"
          style={{
            backgroundColor: '#1e293b',
          }}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#475569"
        />
      </ReactFlow>

      {/* Workflow Actions */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2">
        <button
          onClick={onSubmit}
          className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2 text-sm font-medium"
        >
          <span>Submit Workflow</span>
        </button>
      </div>
    </div>
  );
};

export default WorkflowCanvas;
