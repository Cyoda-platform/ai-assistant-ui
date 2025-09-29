import React, { useState, useCallback } from 'react';
import { Button, Tooltip, Spin, message, Drawer, Segmented } from 'antd';
import { SendOutlined, UndoOutlined, RedoOutlined, ZoomInOutlined, ZoomOutOutlined,
         LockOutlined, UnlockOutlined, ExpandOutlined, PlusOutlined,
         SaveOutlined, CodeOutlined, BarChartOutlined, FileTextOutlined, ClearOutlined,
         ColumnHeightOutlined, ColumnWidthOutlined, CompressOutlined, FullscreenOutlined } from '@ant-design/icons';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
  Panel,
  ControlButton,
  useNodesState,
  useEdgesState,
  addEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Editor from '@/components/Editor/Editor';
import WorkflowStatsPanel from './ChatBotEditorWorkflow/WorkflowStatsPanel';
import EmptyState from './ChatBotEditorWorkflow/EmptyState';
import InformativeNode from './ChatBotEditorWorkflow/InformativeNode';
import { useWorkflowEditor } from '@/hooks/useWorkflowEditor';
import { useAssistantStore } from '@/stores/assistant';
import HelperStorage from '@/helpers/HelperStorage';

interface ChatBotEditorWorkflowSimpleProps {
  technicalId: string;
  onAnswer?: (data: { answer: string; file?: File }) => void;
  onUpdate?: (data: { canvasData: string; workflowMetaData: any }) => void;
}

const nodeTypes = {
  default: InformativeNode
};

const ChatBotEditorWorkflowSimpleInner: React.FC<ChatBotEditorWorkflowSimpleProps> = ({
  technicalId,
  onAnswer,
  onUpdate
}) => {
  const [showEditorDrawer, setShowEditorDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const [showNodeDrawer, setShowNodeDrawer] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeEditData, setNodeEditData] = useState<string>('');

  const assistantStore = useAssistantStore();
  const helperStorage = new HelperStorage();
  const reactFlowInstance = useReactFlow();

  // Use the workflow editor hook
  const {
    canvasData,
    setCanvasData,
    workflowMetaData,
    nodes,
    edges,
    isLoading,
    validationResult,
    canUndo,
    canRedo,
    undoAction,
    redoAction,
    fitView,
    zoomIn,
    zoomOut,
    resetTransform,
    toggleLayoutDirection,
    addNewState,
    updateWorkflowPreserveLayout,
    workflowData,
    layoutDirection
  } = useWorkflowEditor({
    technicalId,
    onUpdate
  });

  // Use nodes and edges state from ReactFlow
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState(nodes);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState(edges);

  // Update local state when workflow data changes
  React.useEffect(() => {
    setLocalNodes(nodes);
  }, [nodes, setLocalNodes]);

  React.useEffect(() => {
    setLocalEdges(edges);
  }, [edges, setLocalEdges]);

  const onConnect = useCallback((params: any) => {
    setLocalEdges((eds) => addEdge(params, eds));
  }, [setLocalEdges]);

  // Wrapper for canvas data changes that preserves layout
  const handleCanvasDataChange = useCallback((newData: string) => {
    // For real-time editing in the drawer, we use setCanvasData
    // The actual re-render with preserved positions happens on save/close
    setCanvasData(newData);
  }, [setCanvasData]);

  // Handle closing editor drawer - apply changes with preserved layout
  const handleCloseEditorDrawer = useCallback(async () => {
    if (canvasData) {
      await updateWorkflowPreserveLayout(canvasData);
    }
    setShowEditorDrawer(false);
  }, [canvasData, updateWorkflowPreserveLayout]);

  // Handle node click to show details
  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedNodeId(node.id);

    // Get the state data from the workflow
    try {
      const workflowObj = JSON.parse(canvasData);
      const stateData = workflowObj.states?.[node.id];
      if (stateData) {
        setNodeEditData(JSON.stringify(stateData, null, 2));
        setShowNodeDrawer(true);
      }
    } catch (error) {
      console.error('Error parsing workflow data:', error);
      message.error('Failed to load node data');
    }
  }, [canvasData]);

  // Save node changes
  const handleSaveNodeChanges = useCallback(async () => {
    if (!selectedNodeId) return;

    try {
      const workflowObj = JSON.parse(canvasData);
      const updatedStateData = JSON.parse(nodeEditData);

      // Update the state in the workflow
      if (workflowObj.states) {
        workflowObj.states[selectedNodeId] = updatedStateData;
        const updatedJson = JSON.stringify(workflowObj, null, 2);

        // Update workflow while preserving node positions
        await updateWorkflowPreserveLayout(updatedJson);

        message.success('Node updated successfully');
        setShowNodeDrawer(false);
      }
    } catch (error) {
      console.error('Error saving node changes:', error);
      message.error('Invalid JSON format');
    }
  }, [selectedNodeId, nodeEditData, canvasData, updateWorkflowPreserveLayout]);

  const loadSampleWorkflow = useCallback(() => {
    const sampleWorkflow = {
      "name": "Order Processing",
      "initial_state": "pending",
      "states": {
        "pending": {
          "transitions": [
            { "name": "approve", "next": "approved", "manual": true },
            { "name": "reject", "next": "rejected", "manual": true }
          ]
        },
        "approved": {
          "transitions": [
            { "name": "process", "next": "completed", "manual": false }
          ]
        },
        "rejected": { "transitions": [] },
        "completed": { "transitions": [] }
      }
    };
    setCanvasData(JSON.stringify(sampleWorkflow, null, 2));
    message.success('Sample workflow loaded');
  }, [setCanvasData]);

  const onClear = useCallback(() => {
    const emptyWorkflow = {
      "name": "New Workflow",
      "initial_state": "initial",
      "states": {
        "initial": {
          "transitions": []
        }
      }
    };
    setCanvasData(JSON.stringify(emptyWorkflow, null, 2));
    message.info('Workflow cleared');
  }, [setCanvasData]);

  const handleManualSave = useCallback(() => {
    if (validationResult && validationResult.errors.length > 0) {
      message.error('Cannot save workflow with validation errors');
      return;
    }

    if (onUpdate) {
      onUpdate({ canvasData, workflowMetaData });
      message.success('Workflow saved successfully');
    }
  }, [canvasData, workflowMetaData, validationResult, onUpdate]);

  const onSubmitQuestion = useCallback(async () => {
    if (validationResult && validationResult.errors.length > 0) {
      message.error('Cannot submit workflow with validation errors');
      return;
    }

    if (onAnswer) {
      onAnswer({ answer: canvasData });
      message.success('Workflow submitted');
    }
  }, [canvasData, validationResult, onAnswer]);

  const hasWorkflowActions = !import.meta.env.VITE_IS_WORKFLOW_ELECTRON;

  return (
    <div className="w-full h-full bg-slate-900" style={{ position: 'relative' }}>
      <style>{`
        .react-flow__node-default {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
          width: auto !important;
          height: auto !important;
        }
        .react-flow__node-default.selected {
          box-shadow: none !important;
        }
      `}</style>

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.8)',
          zIndex: 9999
        }}>
          <Spin size="large" />
        </div>
      )}

      {/* Main Canvas - Full Screen */}
      {localNodes.length === 0 ? (
        <EmptyState onLoadSample={loadSampleWorkflow} onClear={onClear} />
      ) : (
        <ReactFlow
          nodes={localNodes}
          edges={localEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-900"
          style={{ width: '100%', height: '100%' }}
        >
          <Controls
            className="bg-slate-800 border border-slate-600"
            style={{
              button: {
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #475569',
              }
            }}
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          >
            <Tooltip title="Undo" placement="right">
              <ControlButton onClick={undoAction} disabled={!canUndo}>
                <UndoOutlined />
              </ControlButton>
            </Tooltip>
            <Tooltip title="Redo" placement="right">
              <ControlButton onClick={redoAction} disabled={!canRedo}>
                <RedoOutlined />
              </ControlButton>
            </Tooltip>
            <Tooltip title="Add State" placement="right">
              <ControlButton onClick={addNewState}>
                <PlusOutlined />
              </ControlButton>
            </Tooltip>
            <Tooltip title="Reset View" placement="right">
              <ControlButton onClick={resetTransform}>
                <CompressOutlined />
              </ControlButton>
            </Tooltip>
          </Controls>
          <MiniMap
            className="bg-slate-800 border border-slate-600"
            nodeColor="#64748b"
            maskColor="rgba(15, 23, 42, 0.8)"
            zoomable
            pannable
          />
          <Background
            variant="dots"
            gap={20}
            size={1}
            color="#475569"
          />

          {/* Layout Direction Toggle */}
          <Panel position="top-left" style={{
            background: '#1E293B',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #475569',
            marginTop: '60px'
          }}>
            <Tooltip title="Layout Direction">
              <Segmented
                value={layoutDirection}
                onChange={(value) => toggleLayoutDirection()}
                options={[
                  {
                    label: <ColumnWidthOutlined />,
                    value: 'horizontal',
                  },
                  {
                    label: <ColumnHeightOutlined />,
                    value: 'vertical',
                  },
                ]}
                style={{
                  background: '#0F172A',
                }}
              />
            </Tooltip>
          </Panel>

          {/* Validation Status Badge */}
          <Panel position="top-right" style={{
            background: '#1E293B',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #475569'
          }}>
            {validationResult?.isValid && <span style={{ color: '#10B981' }}>✓ Valid</span>}
            {validationResult?.errors.length > 0 && (
              <span style={{ color: '#DC2626' }}>{validationResult.errors.length} Errors</span>
            )}
          </Panel>
        </ReactFlow>
      )}

      {/* Floating Action Buttons */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}>
          <Tooltip title="Edit JSON" placement="left">
            <Button
              type="primary"
              icon={<CodeOutlined />}
              onClick={() => setShowEditorDrawer(true)}
              size="large"
              style={{ width: '120px' }}
            >
              Editor
            </Button>
          </Tooltip>
          <Tooltip title="View Statistics" placement="left">
            <Button
              icon={<BarChartOutlined />}
              onClick={() => setShowStatsDrawer(true)}
              size="large"
              style={{ width: '120px' }}
            >
              Stats
            </Button>
          </Tooltip>
          {hasWorkflowActions && (
            <>
              <Tooltip title="Save Workflow" placement="left">
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleManualSave}
                  disabled={validationResult?.errors.length > 0}
                  size="large"
                  style={{ width: '120px' }}
                >
                  Save
                </Button>
              </Tooltip>
              <Tooltip title="Submit Workflow" placement="left">
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={onSubmitQuestion}
                  disabled={validationResult?.errors.length > 0}
                  size="large"
                  style={{ width: '120px' }}
                >
                  Submit
                </Button>
              </Tooltip>
            </>
          )}
        </div>

        {/* Editor Drawer */}
        <Drawer
          title="Workflow JSON Editor"
          placement="right"
          width={600}
          onClose={handleCloseEditorDrawer}
          open={showEditorDrawer}
          extra={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button icon={<FileTextOutlined />} onClick={loadSampleWorkflow} size="small">
                Sample
              </Button>
              <Button icon={<ClearOutlined />} onClick={onClear} size="small">
                Clear
              </Button>
            </div>
          }
        >
          <div style={{ marginBottom: '12px', padding: '12px', background: '#1E293B', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
              💡 <strong>Tip:</strong> Node positions are preserved when you edit the workflow.
              Changes will be applied seamlessly when you close this drawer.
            </div>
          </div>
          <Editor
            value={canvasData}
            onChange={handleCanvasDataChange}
            language="json"
            style={{ height: 'calc(100vh - 200px)' }}
          />
        </Drawer>

        {/* Stats Drawer */}
        <Drawer
          title="Workflow Statistics"
          placement="right"
          width={400}
          onClose={() => setShowStatsDrawer(false)}
          open={showStatsDrawer}
        >
          <WorkflowStatsPanel
            workflowData={workflowData}
            validationResult={validationResult}
          />
        </Drawer>

        {/* Node Details Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>State: {selectedNodeId}</span>
              {selectedNodeId && (
                <span style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  background: '#1E293B',
                  borderRadius: '4px',
                  color: '#94A3B8'
                }}>
                  {workflowData?.states?.[selectedNodeId]?.transitions?.length || 0} transitions
                </span>
              )}
            </div>
          }
          placement="right"
          width={600}
          onClose={() => setShowNodeDrawer(false)}
          open={showNodeDrawer}
          extra={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button onClick={() => setShowNodeDrawer(false)}>
                Cancel
              </Button>
              <Button type="primary" onClick={handleSaveNodeChanges}>
                Save Changes
              </Button>
            </div>
          }
        >
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              padding: '12px',
              background: '#1E293B',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                State ID
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>
                {selectedNodeId}
              </div>
            </div>

            <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              State Configuration (JSON)
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '12px' }}>
              Edit the state configuration below. Changes will update the workflow.
            </div>
          </div>

          <Editor
            value={nodeEditData}
            onChange={setNodeEditData}
            language="json"
            style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}
          />

          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#1E293B',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#94A3B8'
          }}>
            <div style={{ fontWeight: 500, marginBottom: '8px', color: '#E2E8F0' }}>
              💡 Tips:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Add transitions to connect this state to others</li>
              <li>Set <code>manual: true</code> for user-triggered transitions</li>
              <li>Add processors to execute logic during transitions</li>
              <li>Use criteria to conditionally allow transitions</li>
            </ul>
          </div>
        </Drawer>
    </div>
  );
};

const ChatBotEditorWorkflowSimple: React.FC<ChatBotEditorWorkflowSimpleProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ChatBotEditorWorkflowSimpleInner {...props} />
    </ReactFlowProvider>
  );
};

export default ChatBotEditorWorkflowSimple;

