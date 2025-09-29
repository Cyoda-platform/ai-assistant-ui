/**
 * React hook for workflow editor functionality
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Node, Edge, useReactFlow } from '@xyflow/react';
import { useUndoRedo } from './useUndoRedo';
import { parseWorkflowData, WorkflowData } from '@/components/ChatBot/ChatBotEditorWorkflow/utils/workflowUtils';
import { applyAutoLayout } from '@/components/ChatBot/ChatBotEditorWorkflow/utils/smartLayout';

export interface WorkflowEditorProps {
  technicalId: string;
  initialCanvasData?: string;
  onUpdate?: (data: { canvasData: string; workflowMetaData: any }) => void;
}

export interface WorkflowTransition {
  name: string;
  next: string;
  manual?: boolean;
  processors?: Array<{
    name: string;
    config?: Record<string, any>;
  }>;
  criteria?: Array<{
    type: string;
    function?: {
      name: string;
    };
    name?: string;
    operator?: string;
    parameters?: Array<{
      jsonPath: string;
      operatorType: string;
      value: any;
      type: string;
    }>;
  }>;
}

export interface WorkflowState {
  transitions?: WorkflowTransition[];
  [key: string]: any;
}

export function useWorkflowEditor({ 
  technicalId, 
  initialCanvasData = '', 
  onUpdate 
}: WorkflowEditorProps) {
  const [canvasData, setCanvasData] = useState(initialCanvasData);
  const [workflowMetaData, setWorkflowMetaData] = useState<any>({});
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [layoutDirection, setLayoutDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isLoading, setIsLoading] = useState(false);

  const reactFlowInstance = useReactFlow();
  const { saveState, undo, redo, canUndo, canRedo, initialize } = useUndoRedo();

  // Parse workflow data from canvas JSON
  const workflowData = useMemo(() => {
    if (!canvasData) return null;
    return parseWorkflowData(canvasData);
  }, [canvasData]);

  // Convert workflow data to React Flow nodes and edges
  const convertWorkflowToFlow = useCallback(async (data: WorkflowData) => {
    if (!data.states || Object.keys(data.states).length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    try {
      setIsLoading(true);
      
      // Apply auto layout to get positions
      const { nodePositions } = await applyAutoLayout(
        data.states,
        data.initial_state,
        layoutDirection === 'vertical'
      );

      // Create nodes
      const newNodes: Node[] = Object.keys(data.states).map((stateId) => {
        const state = data.states[stateId];
        const position = nodePositions[stateId] || { x: 0, y: 0 };
        
        return {
          id: stateId,
          type: 'default',
          position,
          data: {
            label: stateId,
            nodeId: stateId,
            isInitial: stateId === data.initial_state,
            nodeType: stateId === data.initial_state ? 'initial' : 'normal',
            transitions: Array.isArray(state.transitions) ? state.transitions : []
          }
        };
      });

      // Create edges from transitions
      const newEdges: Edge[] = [];
      Object.keys(data.states).forEach((stateId) => {
        const state = data.states[stateId];
        if (state.transitions) {
          const transitions = Array.isArray(state.transitions) 
            ? state.transitions 
            : Object.values(state.transitions || {});
          
          transitions.forEach((transition: any, index: number) => {
            if (transition.next) {
              newEdges.push({
                id: `${stateId}-${transition.next}-${index}`,
                source: stateId,
                target: transition.next,
                label: transition.name || '',
                type: 'default',
                data: {
                  transition,
                  sourceState: stateId,
                  targetState: transition.next
                }
              });
            }
          });
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error('Error converting workflow to flow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [layoutDirection]);

  // Update flow when canvas data changes
  useEffect(() => {
    if (workflowData) {
      convertWorkflowToFlow(workflowData);
    }
  }, [workflowData, convertWorkflowToFlow]);

  // Initialize undo/redo with initial data
  useEffect(() => {
    if (initialCanvasData) {
      initialize(initialCanvasData);
    }
  }, [initialCanvasData, initialize]);

  // Save state when canvas data changes
  useEffect(() => {
    if (canvasData && canvasData !== initialCanvasData) {
      saveState(canvasData);
    }
  }, [canvasData, saveState, initialCanvasData]);

  // Emit updates to parent
  useEffect(() => {
    if (onUpdate) {
      onUpdate({ canvasData, workflowMetaData });
    }
  }, [canvasData, workflowMetaData, onUpdate]);

  // Workflow actions
  const undoAction = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setCanvasData(previousState);
    }
  }, [undo]);

  const redoAction = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setCanvasData(nextState);
    }
  }, [redo]);

  const fitView = useCallback(() => {
    reactFlowInstance.fitView();
  }, [reactFlowInstance]);

  const zoomIn = useCallback(() => {
    reactFlowInstance.zoomIn();
  }, [reactFlowInstance]);

  const zoomOut = useCallback(() => {
    reactFlowInstance.zoomOut();
  }, [reactFlowInstance]);

  const resetTransform = useCallback(() => {
    reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
  }, [reactFlowInstance]);

  const toggleLayoutDirection = useCallback(() => {
    setLayoutDirection(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  }, []);

  const addNewState = useCallback(() => {
    // TODO: Implement add new state functionality
    console.log('Add new state functionality not implemented yet');
  }, []);

  return {
    // State
    canvasData,
    setCanvasData,
    workflowMetaData,
    setWorkflowMetaData,
    nodes,
    edges,
    layoutDirection,
    isLoading,
    
    // Undo/Redo
    canUndo,
    canRedo,
    undoAction,
    redoAction,
    
    // Flow controls
    fitView,
    zoomIn,
    zoomOut,
    resetTransform,
    toggleLayoutDirection,
    addNewState,
    
    // Workflow data
    workflowData
  };
}
