import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Splitter, Button, Tooltip, Spin, message, Modal, Drawer } from 'antd';
import { SendOutlined, UndoOutlined, RedoOutlined, ZoomInOutlined, ZoomOutOutlined,
         LockOutlined, UnlockOutlined, ExpandOutlined, PlusOutlined, SettingOutlined,
         QuestionCircleOutlined, SaveOutlined, CheckCircleOutlined, ClearOutlined, FileTextOutlined,
         CodeOutlined, BarChartOutlined } from '@ant-design/icons';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
  Panel,
  ControlButton
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Editor from '@/components/Editor/Editor';
import EditorViewMode from './EditorViewMode';
import WorkflowNode from './ChatBotEditorWorkflow/Node';
import CustomEdge from './ChatBotEditorWorkflow/CustomEdge';
import WorkflowStatsPanel from './ChatBotEditorWorkflow/WorkflowStatsPanel';
import EmptyState from './ChatBotEditorWorkflow/EmptyState';
import { useAssistantStore } from '@/stores/assistant';
import { useWorkflowEditor } from '@/hooks/useWorkflowEditor';
import HelperStorage from '@/helpers/HelperStorage';

interface ChatBotEditorWorkflowProps {
  technicalId: string;
  onAnswer: (data: { answer: string; file?: File }) => void;
  onUpdate: (data: { canvasData: string; workflowMetaData: any }) => void;
}

// Custom node types
const nodeTypes = {
  default: WorkflowNode,
};

// Custom edge types
const edgeTypes = {
  default: CustomEdge,
};

const ChatBotEditorWorkflowInner = React.forwardRef<any, ChatBotEditorWorkflowProps>(({
  technicalId,
  onAnswer,
  onUpdate
}, ref) => {
  const [editorSize, setEditorSize] = useState<number>(50);
  const [editorMode, setEditorMode] = useState<string>('editorPreview');
  const [isDraggable, setIsDraggable] = useState(true);
  const [initialData, setInitialData] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const assistantStore = useAssistantStore();
  const helperStorage = new HelperStorage();
  const reactFlowInstance = useReactFlow();

  // Use the workflow editor hook
  const {
    canvasData,
    setCanvasData,
    workflowMetaData,
    setWorkflowMetaData,
    nodes,
    edges,
    layoutDirection,
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
    workflowData
  } = useWorkflowEditor({
    technicalId,
    initialCanvasData: initialData,
    onUpdate
  });

  // Expose methods to parent via ref
  React.useImperativeHandle(ref, () => ({
    setWorkflowData: (data: { workflowMetaData?: any; canvasData?: any }) => {
      if (data.canvasData) {
        const canvasStr = typeof data.canvasData === 'string'
          ? data.canvasData
          : JSON.stringify(data.canvasData, null, 2);
        setInitialData(canvasStr);
        setCanvasData(canvasStr);
      }
      if (data.workflowMetaData) {
        setWorkflowMetaData(data.workflowMetaData);
      }
    },
    getWorkflowData: () => ({
      canvasData,
      workflowMetaData
    })
  }), [canvasData, workflowMetaData]);

  // Storage keys
  const EDITOR_WIDTH = 'chatBotEditorWorkflow:width';
  const EDITOR_MODE = 'chatBotEditorWorkflow:editorMode';

  // Load initial values from storage
  useEffect(() => {
    const savedEditorSize = helperStorage.get(EDITOR_WIDTH, 50);
    let savedEditorMode = helperStorage.get(EDITOR_MODE, 'editorPreview');

    // Force editorPreview mode if it's set to 'preview' only
    if (savedEditorMode === 'preview') {
      savedEditorMode = 'editorPreview';
      helperStorage.set(EDITOR_MODE, 'editorPreview');
    }

    setEditorSize(typeof savedEditorSize === 'string' ? 50 : savedEditorSize);
    const mode = (savedEditorMode as string) || 'editorPreview';
    setEditorMode(mode);
    setIsInitialized(true);

    console.log('Editor mode loaded:', mode, 'Size:', savedEditorSize);
  }, [technicalId]);

  // Sync canvasData changes to initialData for proper re-initialization
  useEffect(() => {
    if (canvasData && canvasData !== initialData) {
      setInitialData(canvasData);
    }
  }, [canvasData]);

  // Save to storage when values change
  useEffect(() => {
    helperStorage.set(EDITOR_WIDTH, editorSize);
  }, [editorSize]);

  useEffect(() => {
    helperStorage.set(EDITOR_MODE, editorMode);
  }, [editorMode]);

  const onConnect = useCallback(
    (params: Connection) => {
      // TODO: Handle connection creation in workflow data
      console.log('Connection created:', params);
      message.info('Connection created. Edit JSON to configure transition.');
    },
    []
  );

  const onSubmitQuestion = async () => {
    try {
      // Validate before submitting
      if (validationResult && validationResult.errors.length > 0) {
        message.error('Please fix validation errors before submitting');
        return;
      }

      const dataRequest = {
        question: canvasData
      };
      const { data } = await assistantStore.postTextQuestions(technicalId, dataRequest);
      setCanvasData(prev => prev + `\n/*\n${data.message}\n*/`);
      message.success('Question submitted successfully');
    } catch (error) {
      console.error('Error submitting question:', error);
      message.error('Failed to submit question');
    }
  };

  const onClear = () => {
    const emptyWorkflow = {
      version: '1.0',
      name: 'New Workflow',
      initialState: 'initial_state',
      states: {
        initial_state: {
          transitions: []
        }
      }
    };
    setCanvasData(JSON.stringify(emptyWorkflow, null, 2));
    setWorkflowMetaData({});
    message.success('Workflow cleared - ready for new JSON');
  };

  const loadSampleWorkflow = () => {
    const sampleWorkflow = {
      "version": "1.0",
      "name": "Order Processing Workflow",
      "desc": "Sample workflow for order processing",
      "initialState": "initial_state",
      "active": true,
      "states": {
        "initial_state": {
          "transitions": [
            {
              "name": "start_validation",
              "next": "validate_order",
              "manual": false
            }
          ]
        },
        "validate_order": {
          "transitions": [
            {
              "name": "validation_passed",
              "next": "process_payment",
              "manual": false,
              "criterion": {
                "type": "simple",
                "jsonPath": "$.order.valid",
                "operation": "EQUALS",
                "value": true
              }
            },
            {
              "name": "validation_failed",
              "next": "rejected",
              "manual": false
            }
          ]
        },
        "process_payment": {
          "transitions": [
            {
              "name": "payment_success",
              "next": "completed",
              "manual": false
            }
          ]
        },
        "completed": {
          "transitions": []
        },
        "rejected": {
          "transitions": []
        }
      }
    };
    setCanvasData(JSON.stringify(sampleWorkflow, null, 2));
    message.success('Sample workflow loaded');
  };

  // Show validation feedback
  useEffect(() => {
    if (validationResult) {
      if (validationResult.errors.length > 0) {
        message.error({
          content: `${validationResult.errors.length} validation error(s) found`,
          duration: 3,
        });
      } else if (validationResult.warnings.length > 0) {
        message.warning({
          content: `${validationResult.warnings.length} warning(s) found`,
          duration: 2,
        });
      }
    }
  }, [validationResult]);

  // Ensure valid editor mode
  const validEditorMode = ['editor', 'preview', 'editorPreview'].includes(editorMode)
    ? editorMode
    : 'editorPreview';

  const isShowReactFlow = ['preview', 'editorPreview'].includes(validEditorMode);
  const isShowEditor = ['editor', 'editorPreview'].includes(validEditorMode);
  const hasWorkflowActions = !import.meta.env.VITE_IS_WORKFLOW_ELECTRON;

  console.log('Render state:', {
    editorMode: validEditorMode,
    isShowEditor,
    isShowReactFlow,
    editorSize,
    nodesCount: nodes.length,
    isInitialized
  });

  // Manual save handler
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

  return (
    <Spin spinning={isLoading}>
      <div className="chat-bot-editor-workflow" style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}>
        {/* Main Canvas - Full Screen */}
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {nodes.length === 0 ? (
            <EmptyState onLoadSample={loadSampleWorkflow} onClear={onClear} />
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionMode={ConnectionMode.Loose}
              fitView={false}
              nodesDraggable={isDraggable}
              edgesDraggable={isDraggable}
              zoomOnDoubleClick={false}
              panOnDrag={true}
              selectNodesOnDrag={false}
              defaultViewport={{ zoom: 1.5, x: 0, y: 0 }}
              minZoom={0.2}
              maxZoom={4}
            >
              <Background />
              <Controls position="top-left" showFitView={false}>
                <Tooltip title="Zoom in" placement="top">
                  <ControlButton onClick={zoomIn}>
                    <ZoomInOutlined />
                  </ControlButton>
                </Tooltip>
                <Tooltip title="Zoom out" placement="top">
                  <ControlButton onClick={zoomOut}>
                    <ZoomOutOutlined />
                  </ControlButton>
                </Tooltip>
                <Tooltip title={isDraggable ? "Lock interaction" : "Unlock interaction"} placement="top">
                  <ControlButton onClick={() => setIsDraggable(!isDraggable)}>
                    {isDraggable ? <UnlockOutlined /> : <LockOutlined />}
                  </ControlButton>
                </Tooltip>
                <Tooltip title="Fit to view" placement="top">
                  <ControlButton onClick={fitView}>
                    <ExpandOutlined />
                  </ControlButton>
                </Tooltip>
                <Tooltip title="Undo" placement="top">
                  <ControlButton onClick={undoAction} disabled={!canUndo}>
                    <UndoOutlined />
                  </ControlButton>
                </Tooltip>
                <Tooltip title="Redo" placement="top">
                  <ControlButton onClick={redoAction} disabled={!canRedo}>
                    <RedoOutlined />
                  </ControlButton>
                </Tooltip>
                <Tooltip title="Add State" placement="top">
                  <ControlButton onClick={addNewState}>
                    <PlusOutlined />
                  </ControlButton>
                </Tooltip>
                <Tooltip title="Toggle Layout" placement="top">
                  <ControlButton onClick={toggleLayoutDirection}>
                    <SettingOutlined />
                  </ControlButton>
                </Tooltip>
              </Controls>
              <MiniMap />
            </ReactFlow>
          )}

          {/* Workflow Actions - Positioned absolutely over the canvas */}
          {hasWorkflowActions && nodes.length > 0 && (
            <div className="chat-bot-editor-workflow__actions" style={{
              position: 'absolute',
              right: '15px',
              bottom: '20px',
              zIndex: 100,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-new-chat)',
              border: '1px solid var(--input-border)',
              padding: '9px 12px',
              borderRadius: '4px'
            }}>
              <Tooltip title="Save Workflow" placement="left">
                <Button
                  type="text"
                  icon={<SaveOutlined />}
                  onClick={handleManualSave}
                  className="btn-white btn-icon"
                  disabled={validationResult?.errors.length > 0}
                />
              </Tooltip>
              <Tooltip title="Send Answer" placement="left">
                <Button
                  type="text"
                  icon={<SendOutlined />}
                  onClick={onSubmitQuestion}
                  className="btn-white btn-icon"
                  disabled={validationResult?.errors.length > 0}
                />
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </Spin>
  );
});

ChatBotEditorWorkflowInner.displayName = 'ChatBotEditorWorkflowInner';

const ChatBotEditorWorkflow = React.forwardRef<any, ChatBotEditorWorkflowProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <ChatBotEditorWorkflowInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

ChatBotEditorWorkflow.displayName = 'ChatBotEditorWorkflow';

export default ChatBotEditorWorkflow;
