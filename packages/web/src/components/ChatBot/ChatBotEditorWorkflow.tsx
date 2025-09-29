import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Splitter, Button, Tooltip, Spin } from 'antd';
import { SendOutlined, UndoOutlined, RedoOutlined, ZoomInOutlined, ZoomOutOutlined,
         LockOutlined, UnlockOutlined, ExpandOutlined, PlusOutlined, SettingOutlined,
         QuestionCircleOutlined } from '@ant-design/icons';
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
  // We'll add custom edge types here
};

const ChatBotEditorWorkflowInner: React.FC<ChatBotEditorWorkflowProps> = ({
  technicalId,
  onAnswer,
  onUpdate
}) => {
  const [editorSize, setEditorSize] = useState<number>(50);
  const [editorMode, setEditorMode] = useState('editorPreview');
  const [isDraggable, setIsDraggable] = useState(true);

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
    canUndo,
    canRedo,
    undoAction,
    redoAction,
    fitView,
    zoomIn,
    zoomOut,
    resetTransform,
    toggleLayoutDirection,
    addNewState
  } = useWorkflowEditor({
    technicalId,
    onUpdate
  });

  // Storage keys
  const EDITOR_WIDTH = 'chatBotEditorWorkflow:width';
  const EDITOR_MODE = 'chatBotEditorWorkflow:editorMode';

  // Load initial values from storage
  useEffect(() => {
    const savedEditorSize = helperStorage.get(EDITOR_WIDTH, 50);
    const savedEditorMode = helperStorage.get(EDITOR_MODE, 'editorPreview');

    setEditorSize(typeof savedEditorSize === 'string' ? 50 : savedEditorSize);
    setEditorMode(savedEditorMode as string);
  }, [technicalId]);

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
    },
    []
  );

  const onSubmitQuestion = async () => {
    try {
      const dataRequest = {
        question: canvasData
      };
      const { data } = await assistantStore.postTextQuestions(technicalId, dataRequest);
      setCanvasData(prev => prev + `\n/*\n${data.message}\n*/`);
    } catch (error) {
      console.error('Error submitting question:', error);
    }
  };

  const onClear = () => {
    setCanvasData('');
    setWorkflowMetaData({});
  };

  const isShowReactFlow = ['preview', 'editorPreview'].includes(editorMode);
  const isShowEditor = ['editor', 'editorPreview'].includes(editorMode);
  const hasWorkflowActions = !import.meta.env.VITE_IS_WORKFLOW_ELECTRON;

  return (
    <Spin spinning={isLoading}>
      <div className="chat-bot-editor-workflow" style={{
        width: '100%',
        minHeight: 'calc(100vh - 137px)',
        height: 'calc(100% - 137px)'
      }}>
        <EditorViewMode
          value={editorMode}
          onChange={setEditorMode}
          onClear={onClear}
        />

        <Splitter
          onResize={(sizes) => {
            if (sizes && sizes[0]) {
              setEditorSize(sizes[0]);
            }
          }}
        >
          {isShowEditor && (
            <Splitter.Panel size={editorSize} style={{ paddingRight: '15px', position: 'relative' }}>
              <Editor
                value={canvasData}
                onChange={setCanvasData}
                language="json"
                style={{ minHeight: '100%' }}
                className="chat-bot-editor-workflow__editor-inner"
              />
              {hasWorkflowActions && (
                <div className="chat-bot-editor-workflow__actions" style={{
                  position: 'absolute',
                  right: '15px',
                  bottom: '20px',
                  zIndex: 100,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'var(--bg-new-chat)',
                  border: '1px solid var(--input-border)',
                  padding: '9px 12px',
                  borderRadius: '4px'
                }}>
                  <Tooltip title="Send Answer" placement="left">
                    <Button
                      type="text"
                      icon={<SendOutlined />}
                      onClick={onSubmitQuestion}
                      className="btn-white btn-icon"
                    />
                  </Tooltip>
                </div>
              )}
            </Splitter.Panel>
          )}

          {isShowReactFlow && (
            <Splitter.Panel style={{ paddingLeft: '15px' }}>
              <div style={{ height: '100%', marginTop: '60px' }}>
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
                    <Tooltip title="Reset position" placement="top">
                      <ControlButton onClick={resetTransform}>
                        ⌂
                      </ControlButton>
                    </Tooltip>
                    <Tooltip title={layoutDirection === 'horizontal' ? 'Switch to vertical layout' : 'Switch to horizontal layout'} placement="top">
                      <ControlButton onClick={toggleLayoutDirection}>
                        {layoutDirection === 'horizontal' ? '↕' : '↔'}
                      </ControlButton>
                    </Tooltip>
                    <Tooltip title="Add new state" placement="top">
                      <ControlButton onClick={addNewState}>
                        <PlusOutlined />
                      </ControlButton>
                    </Tooltip>
                  </Controls>
                </ReactFlow>
              </div>
            </Splitter.Panel>
          )}
        </Splitter>
      </div>
    </Spin>
  );
};

const ChatBotEditorWorkflow: React.FC<ChatBotEditorWorkflowProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ChatBotEditorWorkflowInner {...props} />
    </ReactFlowProvider>
  );
};

export default ChatBotEditorWorkflow;
