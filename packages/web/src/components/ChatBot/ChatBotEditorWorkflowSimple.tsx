import React, { useState, useCallback, useRef } from 'react';
import { Button, Tooltip, Spin, message, Drawer, Segmented, Dropdown } from 'antd';
import { SendOutlined, UndoOutlined, RedoOutlined, ZoomInOutlined, ZoomOutOutlined,
         LockOutlined, UnlockOutlined, ExpandOutlined, PlusOutlined,
         SaveOutlined, CodeOutlined, BarChartOutlined, FileTextOutlined, ClearOutlined,
         ColumnHeightOutlined, ColumnWidthOutlined, CompressOutlined, FullscreenOutlined, MoreOutlined,
         QuestionCircleOutlined } from '@ant-design/icons';
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

import MonacoJsonEditor from '@/components/MonacoJsonEditor/MonacoJsonEditor';
import WorkflowStatsPanel from './ChatBotEditorWorkflow/WorkflowStatsPanel';
import EmptyState from './ChatBotEditorWorkflow/EmptyState';
import InformativeNode from './ChatBotEditorWorkflow/InformativeNode';
import QuickHelpPanel from './ChatBotEditorWorkflow/QuickHelpPanel';
import { useWorkflowEditor } from '@/hooks/useWorkflowEditor';
import { useAssistantStore } from '@/stores/assistant';
import HelperStorage from '@/helpers/HelperStorage';
import { workflowTheme } from './ChatBotEditorWorkflow/workflowTheme';

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
  const [showQuickHelp, setShowQuickHelp] = useState(false);

  const assistantStore = useAssistantStore();
  const helperStorage = new HelperStorage();
  const reactFlowInstance = useReactFlow();

  // Double-click detection state
  const lastClickTimeRef = useRef<number>(0);
  const lastClickPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // Handle node label change (rename state)
  const handleNodeLabelChange = useCallback(async (oldLabel: string, newLabel: string) => {
    if (oldLabel === newLabel || !newLabel.trim()) return;

    try {
      const workflowObj = JSON.parse(canvasData);

      // Check if new label already exists
      if (workflowObj.states[newLabel]) {
        message.error(`State "${newLabel}" already exists`);
        return;
      }

      // Rename the state
      const stateData = workflowObj.states[oldLabel];
      delete workflowObj.states[oldLabel];
      workflowObj.states[newLabel] = stateData;

      // Update initial_state if it was the renamed state
      if (workflowObj.initial_state === oldLabel) {
        workflowObj.initial_state = newLabel;
      }

      // Update all transitions that reference the old state
      Object.keys(workflowObj.states).forEach(stateId => {
        const state = workflowObj.states[stateId];
        if (state.transitions && Array.isArray(state.transitions)) {
          state.transitions.forEach((transition: any) => {
            if (transition.next === oldLabel) {
              transition.next = newLabel;
            }
          });
        }
      });

      const updatedJson = JSON.stringify(workflowObj, null, 2);
      await updateWorkflowPreserveLayout(updatedJson);
      message.success(`State renamed from "${oldLabel}" to "${newLabel}"`);
    } catch (error) {
      console.error('Error renaming state:', error);
      message.error('Failed to rename state');
    }
  }, [canvasData, updateWorkflowPreserveLayout]);

  // Handle node name change (for inline editing)
  const handleNodeNameChange = useCallback(async (nodeId: string, newName: string) => {
    if (!newName.trim()) return;

    try {
      const workflowObj = JSON.parse(canvasData);

      // Check if new name already exists
      if (workflowObj.states[newName] && newName !== nodeId) {
        message.error(`State "${newName}" already exists`);
        return;
      }

      // If name is the same, no need to update
      if (nodeId === newName) return;

      // Rename the state
      const stateData = workflowObj.states[nodeId];
      delete workflowObj.states[nodeId];
      workflowObj.states[newName] = stateData;

      // Update initial_state if it was the renamed state
      if (workflowObj.initial_state === nodeId) {
        workflowObj.initial_state = newName;
      }

      // Update all transitions that reference the old state
      Object.keys(workflowObj.states).forEach(stateId => {
        const state = workflowObj.states[stateId];
        if (state.transitions && Array.isArray(state.transitions)) {
          state.transitions.forEach((transition: any) => {
            if (transition.next === nodeId) {
              transition.next = newName;
            }
          });
        }
      });

      const updatedJson = JSON.stringify(workflowObj, null, 2);
      await updateWorkflowPreserveLayout(updatedJson);
      message.success(`State renamed to "${newName}"`);
    } catch (error) {
      console.error('Error renaming state:', error);
      message.error('Failed to rename state');
    }
  }, [canvasData, updateWorkflowPreserveLayout]);

  // Update local state when workflow data changes - add onNameChange to node data
  React.useEffect(() => {
    const nodesWithCallback = nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onNameChange: handleNodeNameChange
      }
    }));
    setLocalNodes(nodesWithCallback);
  }, [nodes, setLocalNodes, handleNodeNameChange]);

  React.useEffect(() => {
    setLocalEdges(edges);
  }, [edges, setLocalEdges]);

  const onConnect = useCallback((params: any) => {
    setLocalEdges((eds) => addEdge(params, eds));
  }, [setLocalEdges]);

  // Double-click handler for canvas to add new state
  const handleCanvasDoubleClick = useCallback((event: React.MouseEvent) => {
    const now = Date.now();
    const pos = { x: event.clientX, y: event.clientY };

    // Check if this is a double-click (within 500ms and 5px tolerance)
    const timeDiff = now - lastClickTimeRef.current;
    const posDiff = Math.sqrt(
      Math.pow(pos.x - lastClickPosRef.current.x, 2) +
      Math.pow(pos.y - lastClickPosRef.current.y, 2)
    );

    if (timeDiff < 500 && posDiff < 5) {
      // This is a double-click - add new state at cursor position
      const bounds = (event.target as HTMLElement).getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      // Call addNewState with the position
      addNewState();

      // Reset click tracking
      lastClickTimeRef.current = 0;
    } else {
      // Track this click for potential double-click
      lastClickTimeRef.current = now;
      lastClickPosRef.current = pos;
    }
  }, [reactFlowInstance, addNewState]);

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
    <div className="w-full h-full" style={{
      position: 'relative',
      background: workflowTheme.background.canvas
    }}>
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

        /* Modern glassmorphism controls */
        .react-flow__controls {
          background: ${workflowTheme.background.glass} !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid ${workflowTheme.border.glass} !important;
          border-radius: 12px !important;
          box-shadow: ${workflowTheme.shadow.lg} !important;
        }

        .react-flow__controls-button {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid ${workflowTheme.border.glass} !important;
          color: ${workflowTheme.text.secondary} !important;
          transition: all 0.2s ease !important;
        }

        .react-flow__controls-button:last-child {
          border-bottom: none !important;
        }

        .react-flow__controls-button:hover {
          background: ${workflowTheme.background.hover} !important;
          color: ${workflowTheme.text.primary} !important;
          transform: scale(1.05);
        }

        .react-flow__controls-button:disabled {
          opacity: 0.3 !important;
        }

        /* Modern minimap */
        .react-flow__minimap {
          background: ${workflowTheme.background.glass} !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid ${workflowTheme.border.glass} !important;
          border-radius: 12px !important;
          box-shadow: ${workflowTheme.shadow.lg} !important;
        }

        /* Smooth edges */
        .react-flow__edge-path {
          stroke-width: 2 !important;
          transition: stroke 0.2s ease !important;
        }

        .react-flow__edge.selected .react-flow__edge-path {
          stroke: ${workflowTheme.edges.selected} !important;
          stroke-width: 3 !important;
          filter: drop-shadow(0 0 8px ${workflowTheme.edges.selected});
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
          background: workflowTheme.background.overlay,
          backdropFilter: 'blur(8px)',
          zIndex: 9999
        }}>
          <div style={{
            background: workflowTheme.background.glass,
            backdropFilter: 'blur(12px)',
            padding: '32px 48px',
            borderRadius: '16px',
            border: `1px solid ${workflowTheme.border.glass}`,
            boxShadow: workflowTheme.shadow.xl
          }}>
            <Spin size="large" />
            <div style={{
              marginTop: '16px',
              color: workflowTheme.text.secondary,
              fontSize: '14px'
            }}>
              Loading workflow...
            </div>
          </div>
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
          onPaneClick={handleCanvasDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-900"
          style={{ width: '100%', height: '100%' }}
        >
          <Controls
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          >
            <Tooltip title="Undo (Ctrl+Z)" placement="right">
              <ControlButton onClick={undoAction} disabled={!canUndo}>
                <UndoOutlined style={{ fontSize: '16px' }} />
              </ControlButton>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)" placement="right">
              <ControlButton onClick={redoAction} disabled={!canRedo}>
                <RedoOutlined style={{ fontSize: '16px' }} />
              </ControlButton>
            </Tooltip>
            <Tooltip title="Add New State" placement="right">
              <ControlButton onClick={addNewState}>
                <PlusOutlined style={{ fontSize: '16px' }} />
              </ControlButton>
            </Tooltip>
            <Tooltip title="Reset View" placement="right">
              <ControlButton onClick={resetTransform}>
                <CompressOutlined style={{ fontSize: '16px' }} />
              </ControlButton>
            </Tooltip>
            <Tooltip title={showQuickHelp ? "Hide Quick Help" : "Show Quick Help"} placement="right">
              <ControlButton
                onClick={() => setShowQuickHelp(!showQuickHelp)}
                style={{
                  background: showQuickHelp ? 'rgba(59, 130, 246, 0.2)' : undefined,
                  color: showQuickHelp ? '#60A5FA' : undefined
                }}
              >
                <QuestionCircleOutlined style={{ fontSize: '16px' }} />
              </ControlButton>
            </Tooltip>
          </Controls>

          {/* Quick Help Panel */}
          <QuickHelpPanel visible={showQuickHelp} />
          <MiniMap
            nodeColor={(node) => {
              if (node.data.isInitial) return workflowTheme.nodes.initial.color;
              if (node.data.isTerminal) return workflowTheme.nodes.terminal.color;
              return workflowTheme.nodes.normal.color;
            }}
            maskColor={workflowTheme.background.overlay}
            zoomable
            pannable
          />
          <Background
            variant="dots"
            gap={20}
            size={1.5}
            color={workflowTheme.border.default}
          />

          {/* Layout Direction Toggle - Modern Glass Panel */}
          <Panel position="top-left" style={{
            background: workflowTheme.background.glass,
            backdropFilter: 'blur(12px)',
            padding: '10px',
            borderRadius: '12px',
            border: `1px solid ${workflowTheme.border.glass}`,
            marginTop: '60px',
            boxShadow: workflowTheme.shadow.lg
          }}>
            <Tooltip title="Toggle Layout Direction">
              <Segmented
                value={layoutDirection}
                onChange={(value) => toggleLayoutDirection()}
                options={[
                  {
                    label: <ColumnWidthOutlined style={{ fontSize: '16px' }} />,
                    value: 'horizontal',
                  },
                  {
                    label: <ColumnHeightOutlined style={{ fontSize: '16px' }} />,
                    value: 'vertical',
                  },
                ]}
                style={{
                  background: workflowTheme.background.node,
                  borderRadius: '8px',
                }}
              />
            </Tooltip>
          </Panel>

          {/* Validation Status Badge - Modern Glass Panel */}
          <Panel position="top-right" style={{
            background: workflowTheme.background.glass,
            backdropFilter: 'blur(12px)',
            padding: '10px 16px',
            borderRadius: '12px',
            border: `1px solid ${workflowTheme.border.glass}`,
            boxShadow: workflowTheme.shadow.lg,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {validationResult?.isValid && (
              <span style={{
                color: workflowTheme.status.success,
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '16px' }}>✓</span> Valid Workflow
              </span>
            )}
            {validationResult?.errors.length > 0 && (
              <span style={{
                color: workflowTheme.status.error,
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: workflowTheme.validation.error.background,
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${workflowTheme.validation.error.border}`
              }}>
                <span style={{ fontSize: '16px' }}>⚠</span> {validationResult.errors.length} Error{validationResult.errors.length > 1 ? 's' : ''}
              </span>
            )}
          </Panel>
        </ReactFlow>
      )}

      {/* Floating Action Button with Dropdown - Modern Glass Design */}
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
          <Dropdown
            menu={{
              items: [
                {
                  key: 'editor',
                  label: 'JSON Editor',
                  icon: <CodeOutlined style={{ color: workflowTheme.nodes.initial.color }} />,
                  onClick: () => setShowEditorDrawer(true),
                },
                {
                  key: 'stats',
                  label: 'Statistics',
                  icon: <BarChartOutlined style={{ color: workflowTheme.nodes.normal.color }} />,
                  onClick: () => setShowStatsDrawer(true),
                },
                ...(hasWorkflowActions ? [
                  {
                    type: 'divider' as const,
                  },
                  {
                    key: 'save',
                    label: 'Save Workflow',
                    icon: <SaveOutlined style={{ color: workflowTheme.status.success }} />,
                    onClick: handleManualSave,
                    disabled: validationResult?.errors.length > 0,
                  },
                  {
                    key: 'submit',
                    label: 'Submit Workflow',
                    icon: <SendOutlined style={{ color: workflowTheme.status.info }} />,
                    onClick: onSubmitQuestion,
                    disabled: validationResult?.errors.length > 0,
                  },
                ] : []),
              ],
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Tooltip title="Workflow Actions" placement="left">
              <Button
                type="primary"
                icon={<MoreOutlined />}
                size="large"
                style={{
                  width: '140px',
                  height: '44px',
                  background: `linear-gradient(135deg, ${workflowTheme.nodes.terminal.color} 0%, ${workflowTheme.nodes.normal.color} 100%)`,
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: `0 0 20px rgba(13, 132, 132, 0.3)`,
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = workflowTheme.shadow.glowStrong;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = workflowTheme.shadow.glow;
                }}
              >
                Actions
              </Button>
            </Tooltip>
          </Dropdown>
        </div>

        {/* Editor Drawer - Modern Design */}
        <Drawer
          title={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '16px',
              fontWeight: 600
            }}>
              <CodeOutlined style={{
                fontSize: '20px',
                color: workflowTheme.nodes.initial.color
              }} />
              <span>Workflow JSON Editor</span>
            </div>
          }
          placement="right"
          width={720}
          onClose={handleCloseEditorDrawer}
          open={showEditorDrawer}
          styles={{
            header: {
              background: workflowTheme.background.glass,
              backdropFilter: 'blur(12px)',
              borderBottom: `1px solid ${workflowTheme.border.glass}`,
            },
            body: {
              background: workflowTheme.background.canvas,
              padding: '24px',
            }
          }}
          extra={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Tooltip title="Load Sample Workflow">
                <Button
                  icon={<FileTextOutlined />}
                  onClick={loadSampleWorkflow}
                  style={{
                    borderRadius: '8px',
                    background: workflowTheme.background.node,
                    border: `1px solid ${workflowTheme.border.light}`,
                    color: workflowTheme.text.secondary
                  }}
                >
                  Sample
                </Button>
              </Tooltip>
              <Tooltip title="Clear Workflow">
                <Button
                  icon={<ClearOutlined />}
                  onClick={onClear}
                  danger
                  style={{
                    borderRadius: '8px',
                  }}
                >
                  Clear
                </Button>
              </Tooltip>
            </div>
          }
        >
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: workflowTheme.background.glass,
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: `1px solid ${workflowTheme.border.glass}`,
            boxShadow: workflowTheme.shadow.md
          }}>
            <div style={{
              fontSize: '13px',
              color: workflowTheme.text.secondary,
              lineHeight: '1.6'
            }}>
              <span style={{ fontSize: '18px', marginRight: '8px' }}>💡</span>
              <strong style={{ color: workflowTheme.text.primary }}>Smart Editing:</strong> Node positions are automatically preserved when you edit the workflow.
              Changes will be applied seamlessly when you close this drawer.
            </div>
          </div>
          <MonacoJsonEditor
            value={canvasData}
            onChange={handleCanvasDataChange}
            height="calc(100vh - 280px)"
          />
        </Drawer>

        {/* Stats Drawer - Modern Design */}
        <Drawer
          title={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '16px',
              fontWeight: 600
            }}>
              <BarChartOutlined style={{
                fontSize: '20px',
                color: workflowTheme.nodes.normal.color
              }} />
              <span>Workflow Statistics</span>
            </div>
          }
          placement="right"
          width={480}
          onClose={() => setShowStatsDrawer(false)}
          open={showStatsDrawer}
          styles={{
            header: {
              background: workflowTheme.background.glass,
              backdropFilter: 'blur(12px)',
              borderBottom: `1px solid ${workflowTheme.border.glass}`,
            },
            body: {
              background: workflowTheme.background.canvas,
              padding: '24px',
            }
          }}
        >
          <WorkflowStatsPanel
            workflowData={workflowData}
            validationResult={validationResult}
          />
        </Drawer>

        {/* Node Details Drawer - Modern Design */}
        <Drawer
          title={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '16px',
              fontWeight: 600
            }}>
              <FileTextOutlined style={{
                fontSize: '20px',
                color: workflowTheme.nodes.normal.color
              }} />
              <span>State: {selectedNodeId}</span>
              {selectedNodeId && (
                <span style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  background: workflowTheme.background.glass,
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px',
                  border: `1px solid ${workflowTheme.border.glass}`,
                  color: workflowTheme.text.secondary,
                  fontWeight: 500
                }}>
                  {workflowData?.states?.[selectedNodeId]?.transitions?.length || 0} transitions
                </span>
              )}
            </div>
          }
          placement="right"
          width={720}
          onClose={() => setShowNodeDrawer(false)}
          open={showNodeDrawer}
          styles={{
            header: {
              background: workflowTheme.background.glass,
              backdropFilter: 'blur(12px)',
              borderBottom: `1px solid ${workflowTheme.border.glass}`,
            },
            body: {
              background: workflowTheme.background.canvas,
              padding: '24px',
            }
          }}
          extra={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                onClick={() => setShowNodeDrawer(false)}
                style={{
                  borderRadius: '8px',
                  background: workflowTheme.background.node,
                  border: `1px solid ${workflowTheme.border.light}`,
                  color: workflowTheme.text.secondary
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleSaveNodeChanges}
                style={{
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${workflowTheme.status.success} 0%, ${workflowTheme.nodes.terminal.color} 100%)`,
                  border: 'none',
                  fontWeight: 600
                }}
              >
                Save Changes
              </Button>
            </div>
          }
        >
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              padding: '16px',
              background: workflowTheme.background.glass,
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              border: `1px solid ${workflowTheme.border.glass}`,
              marginBottom: '20px',
              boxShadow: workflowTheme.shadow.md
            }}>
              <div style={{
                fontSize: '12px',
                color: workflowTheme.text.muted,
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 600
              }}>
                State ID
              </div>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: workflowTheme.text.primary,
                background: workflowTheme.background.node,
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${workflowTheme.border.default}`
              }}>
                {selectedNodeId}
              </div>
            </div>

            <div style={{
              marginBottom: '10px',
              fontSize: '15px',
              fontWeight: 600,
              color: workflowTheme.text.primary
            }}>
              State Configuration (JSON)
            </div>
            <div style={{
              fontSize: '13px',
              color: workflowTheme.text.muted,
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              Edit the state configuration below. Changes will update the workflow seamlessly.
            </div>
          </div>

          <MonacoJsonEditor
            value={nodeEditData}
            onChange={setNodeEditData}
            height="calc(100vh - 420px)"
          />

          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: workflowTheme.background.glass,
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: `1px solid ${workflowTheme.border.glass}`,
            fontSize: '13px',
            color: workflowTheme.text.secondary,
            boxShadow: workflowTheme.shadow.md
          }}>
            <div style={{
              fontWeight: 600,
              marginBottom: '12px',
              color: workflowTheme.text.primary,
              fontSize: '14px'
            }}>
              <span style={{ fontSize: '18px', marginRight: '8px' }}>💡</span>
              Quick Tips:
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '28px',
              lineHeight: '1.8'
            }}>
              <li>Add <code style={{
                background: workflowTheme.background.node,
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>transitions</code> to connect this state to others</li>
              <li>Set <code style={{
                background: workflowTheme.background.node,
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>manual: true</code> for user-triggered transitions</li>
              <li>Add <code style={{
                background: workflowTheme.background.node,
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>processors</code> to execute logic during transitions</li>
              <li>Use <code style={{
                background: workflowTheme.background.node,
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>criteria</code> to conditionally allow transitions</li>
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

