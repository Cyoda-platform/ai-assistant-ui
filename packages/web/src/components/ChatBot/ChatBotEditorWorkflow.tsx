import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Splitter, Button, Tooltip, Spin } from 'antd';
import { SendOutlined } from '@ant-design/icons';
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
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Editor from '@/components/Editor/Editor';
import EditorViewMode from './EditorViewMode';
import { useAssistantStore } from '@/stores/assistant';
import HelperStorage from '@/helpers/HelperStorage';

interface ChatBotEditorWorkflowProps {
  technicalId: string;
  onAnswer: (data: { answer: string; file?: File }) => void;
  onUpdate: (data: { canvasData: string; workflowMetaData: any }) => void;
}

// Custom node types
const nodeTypes = {
  // We'll add custom node types here
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editorSize, setEditorSize] = useState<number>(50);
  const [editorMode, setEditorMode] = useState('editorPreview');
  const [canvasData, setCanvasData] = useState('');
  const [workflowMetaData, setWorkflowMetaData] = useState<any>({});
  const [isDraggable, setIsDraggable] = useState(true);
  const [layoutDirection, setLayoutDirection] = useState<'horizontal' | 'vertical'>('horizontal');

  const assistantStore = useAssistantStore();
  const helperStorage = new HelperStorage();
  const reactFlowInstance = useReactFlow();

  // Storage keys
  const EDITOR_WIDTH = 'chatBotEditorWorkflow:width';
  const EDITOR_MODE = 'chatBotEditorWorkflow:editorMode';
  const LAYOUT_DIRECTION = 'chatBotEditorWorkflow:layoutDirection';
  const workflowCanvasDataKey = `chatBotEditorWorkflow:canvasData:${technicalId}`;
  const workflowMetaDataKey = `chatBotEditorWorkflow:metaData:${technicalId}`;

  // Load initial values from storage
  useEffect(() => {
    const savedEditorSize = helperStorage.get(EDITOR_WIDTH, 50);
    const savedEditorMode = helperStorage.get(EDITOR_MODE, 'editorPreview');
    const savedLayoutDirection = helperStorage.get(LAYOUT_DIRECTION, 'horizontal');
    const savedCanvasData = helperStorage.get(workflowCanvasDataKey, '') || '';
    const savedWorkflowMetaData = helperStorage.get(workflowMetaDataKey, {}) || {};

    setEditorSize(typeof savedEditorSize === 'string' ? 50 : savedEditorSize);
    setEditorMode(savedEditorMode as string);
    setLayoutDirection(savedLayoutDirection as 'horizontal' | 'vertical');
    setCanvasData(savedCanvasData.toString());
    setWorkflowMetaData(savedWorkflowMetaData);
  }, [technicalId]);

  // Save to storage when values change
  useEffect(() => {
    helperStorage.set(EDITOR_WIDTH, editorSize);
  }, [editorSize]);

  useEffect(() => {
    helperStorage.set(EDITOR_MODE, editorMode);
  }, [editorMode]);

  useEffect(() => {
    helperStorage.set(LAYOUT_DIRECTION, layoutDirection);
  }, [layoutDirection]);

  useEffect(() => {
    helperStorage.set(workflowCanvasDataKey, canvasData);
  }, [canvasData, workflowCanvasDataKey]);

  useEffect(() => {
    helperStorage.set(workflowMetaDataKey, workflowMetaData);
  }, [workflowMetaData, workflowMetaDataKey]);

  // Emit updates to parent
  useEffect(() => {
    onUpdate({ canvasData, workflowMetaData });
  }, [canvasData, workflowMetaData, onUpdate]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onSubmitQuestion = async () => {
    try {
      setIsLoading(true);
      const dataRequest = {
        question: canvasData
      };
      const { data } = await assistantStore.postTextQuestions(technicalId, dataRequest);
      setCanvasData(prev => prev + `\n/*\n${data.message}\n*/`);
    } finally {
      setIsLoading(false);
    }
  };

  const onClear = () => {
    setCanvasData('');
    setWorkflowMetaData({});
  };

  const fitView = () => {
    reactFlowInstance.fitView();
  };

  const zoomIn = () => {
    reactFlowInstance.zoomIn();
  };

  const zoomOut = () => {
    reactFlowInstance.zoomOut();
  };

  const resetTransform = () => {
    reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
  };

  const addNewState = () => {
    // TODO: Implement add new state functionality
    console.log('Add new state');
  };

  const autoLayout = () => {
    setLayoutDirection(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
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
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
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
                      <Button size="small" onClick={zoomIn}>+</Button>
                    </Tooltip>
                    <Tooltip title="Zoom out" placement="top">
                      <Button size="small" onClick={zoomOut}>-</Button>
                    </Tooltip>
                    <Tooltip title={isDraggable ? "Lock interaction" : "Unlock interaction"} placement="top">
                      <Button size="small" onClick={() => setIsDraggable(!isDraggable)}>
                        {isDraggable ? '🔓' : '🔒'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Fit to view" placement="top">
                      <Button size="small" onClick={fitView}>⊡</Button>
                    </Tooltip>
                    <Tooltip title="Reset position" placement="top">
                      <Button size="small" onClick={resetTransform}>⌂</Button>
                    </Tooltip>
                    <Tooltip title={layoutDirection === 'horizontal' ? 'Switch to vertical layout' : 'Switch to horizontal layout'} placement="top">
                      <Button size="small" onClick={autoLayout}>
                        {layoutDirection === 'horizontal' ? '↕' : '↔'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Add new state" placement="top">
                      <Button size="small" onClick={addNewState}>+</Button>
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
