/**
 * React hook for workflow editor functionality
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Node, Edge, useReactFlow } from '@xyflow/react';
import { useUndoRedo } from './useUndoRedo';
import {
  parseWorkflowData,
  WorkflowData,
  validateWorkflowSchema,
  ValidationResult,
  addState,
  createEmptyWorkflow
} from '@/components/ChatBot/ChatBotEditorWorkflow/utils/workflowUtils';
import { applyAutoLayout } from '@/components/ChatBot/ChatBotEditorWorkflow/utils/smartLayout';
import { message } from 'antd';
import HelperStorage from '@/helpers/HelperStorage';
import { workflowTheme } from '@/components/ChatBot/ChatBotEditorWorkflow/workflowTheme';

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
  const helperStorage = useMemo(() => new HelperStorage(), []);
  const [canvasData, setCanvasData] = useState(initialCanvasData);
  const [workflowMetaData, setWorkflowMetaData] = useState<any>({});
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [layoutDirection, setLayoutDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [skipAutoRender, setSkipAutoRender] = useState(false);

  const reactFlowInstance = useReactFlow();
  const { saveState, undo, redo, canUndo, canRedo, initialize } = useUndoRedo();

  // Storage keys
  const workflowCanvasDataKey = `chatBotEditorWorkflow:canvasData:${technicalId}`;
  const workflowMetaDataKey = `chatBotEditorWorkflow:metaData:${technicalId}`;

  // Load data from localStorage on mount or when technicalId changes
  useEffect(() => {
    const loadDataFromStorage = () => {
      const storedCanvasData = helperStorage.get(workflowCanvasDataKey, null);
      const storedMetaData = helperStorage.get(workflowMetaDataKey, null);

      if (storedCanvasData) {
        const canvasStr = typeof storedCanvasData === 'string'
          ? storedCanvasData
          : JSON.stringify(storedCanvasData, null, 2);
        setCanvasData(canvasStr);
        console.log('Loaded workflow from localStorage:', workflowCanvasDataKey);
      } else if (initialCanvasData) {
        setCanvasData(initialCanvasData);
      } else {
        // Set empty workflow
        const emptyWorkflow = createEmptyWorkflow('New Workflow');
        const emptyStr = JSON.stringify(emptyWorkflow, null, 2);
        setCanvasData(emptyStr);
      }

      if (storedMetaData) {
        setWorkflowMetaData(storedMetaData);
      }

      setIsDataLoaded(true);
    };

    loadDataFromStorage();
  }, [technicalId, initialCanvasData, helperStorage, workflowCanvasDataKey, workflowMetaDataKey]);

  // Parse workflow data from canvas JSON
  const workflowData = useMemo(() => {
    if (!canvasData) return null;
    const parsed = parseWorkflowData(canvasData);

    // Validate the parsed data
    if (parsed) {
      const validation = validateWorkflowSchema(parsed);
      setValidationResult(validation);

      // Show validation errors/warnings
      if (validation.errors.length > 0) {
        console.error('Workflow validation errors:', validation.errors);
      }
      if (validation.warnings.length > 0) {
        console.warn('Workflow validation warnings:', validation.warnings);
      }
    }

    return parsed;
  }, [canvasData]);

  // Convert workflow data to React Flow nodes and edges
  const convertWorkflowToFlow = useCallback(async (data: WorkflowData, preservePositions: boolean = false, currentNodes?: Node[]) => {
    if (!data.states || Object.keys(data.states).length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    try {
      setIsLoading(true);

      // Support both initialState and initial_state
      const initialState = data.initialState || data.initial_state || '';

      // Get current node positions if we want to preserve them
      const currentPositions: { [key: string]: { x: number; y: number } } = {};
      if (preservePositions && currentNodes) {
        currentNodes.forEach(node => {
          currentPositions[node.id] = { x: node.position.x, y: node.position.y };
        });
      }

      // Apply auto layout to get positions (only for new nodes)
      const { nodePositions } = await applyAutoLayout(
        data.states,
        initialState,
        layoutDirection === 'vertical'
      );

      // Create nodes with enhanced data
      const newNodes: Node[] = Object.keys(data.states).map((stateId) => {
        const state = data.states[stateId];
        // Use preserved position if available, otherwise use calculated position
        const position = preservePositions && currentPositions[stateId]
          ? currentPositions[stateId]
          : nodePositions[stateId] || { x: 0, y: 0 };
        const transitions = Array.isArray(state.transitions) ? state.transitions : [];
        const isTerminal = transitions.length === 0;

        return {
          id: stateId,
          type: 'default',
          position,
          data: {
            label: stateId,
            nodeId: stateId,
            isInitial: stateId === initialState,
            isTerminal,
            nodeType: stateId === initialState ? 'initial' : isTerminal ? 'final' : 'normal',
            transitions
          }
        };
      });

      // Create edges from transitions with full transition data
      const newEdges: Edge[] = [];
      Object.keys(data.states).forEach((stateId) => {
        const state = data.states[stateId];
        if (state.transitions && Array.isArray(state.transitions)) {
          state.transitions.forEach((transition: any, index: number) => {
            if (transition.next) {
              const isManual = transition.manual === true;
              newEdges.push({
                id: `${stateId}-${transition.next}-${index}`,
                source: stateId,
                target: transition.next,
                label: transition.name || '',
                type: 'default',
                animated: false, // No animation for cleaner look
                data: {
                  transition,
                  sourceState: stateId,
                  targetState: transition.next
                },
                style: {
                  strokeWidth: 2,
                  stroke: isManual ? workflowTheme.edges.manual : workflowTheme.edges.auto,
                  strokeDasharray: isManual ? '5, 5' : undefined, // Dashed for manual
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
      message.error('Failed to render workflow visualization');
    } finally {
      setIsLoading(false);
    }
  }, [layoutDirection]);

  // Update flow when canvas data changes (but not when using preserve layout)
  useEffect(() => {
    if (workflowData && !skipAutoRender) {
      convertWorkflowToFlow(workflowData);
    }
    if (skipAutoRender) {
      setSkipAutoRender(false);
    }
  }, [workflowData, convertWorkflowToFlow, skipAutoRender]);

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

  // Save to localStorage when data changes
  useEffect(() => {
    if (isDataLoaded && canvasData) {
      helperStorage.set(workflowCanvasDataKey, canvasData);
    }
  }, [canvasData, isDataLoaded, helperStorage, workflowCanvasDataKey]);

  useEffect(() => {
    if (isDataLoaded && workflowMetaData) {
      helperStorage.set(workflowMetaDataKey, workflowMetaData);
    }
  }, [workflowMetaData, isDataLoaded, helperStorage, workflowMetaDataKey]);

  // Emit updates to parent
  useEffect(() => {
    if (onUpdate && isDataLoaded) {
      onUpdate({ canvasData, workflowMetaData });
    }
  }, [canvasData, workflowMetaData, onUpdate, isDataLoaded]);

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
    if (!workflowData) {
      message.warning('No workflow data available');
      return;
    }

    // Generate a unique state name
    let stateCounter = 1;
    let newStateName = `new_state_${stateCounter}`;
    while (workflowData.states[newStateName]) {
      stateCounter++;
      newStateName = `new_state_${stateCounter}`;
    }

    try {
      // Add the new state to workflow data
      const updatedWorkflow = addState(workflowData, newStateName, []);

      // Update canvas data
      setCanvasData(JSON.stringify(updatedWorkflow, null, 2));

      message.success(`Added new state: ${newStateName}`);
    } catch (error) {
      console.error('Error adding new state:', error);
      message.error('Failed to add new state');
    }
  }, [workflowData]);

  // Update workflow data while preserving node positions
  const updateWorkflowPreserveLayout = useCallback(async (newCanvasData: string) => {
    try {
      const parsed = parseWorkflowData(newCanvasData);
      if (parsed) {
        // Set flag to skip auto-render
        setSkipAutoRender(true);
        // Pass current nodes to preserve their positions
        await convertWorkflowToFlow(parsed, true, nodes);
      }
      // Update canvas data after successful conversion
      setCanvasData(newCanvasData);
    } catch (error) {
      console.error('Error updating workflow:', error);
      message.error('Failed to update workflow');
    }
  }, [parseWorkflowData, convertWorkflowToFlow, nodes]);

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
    validationResult,

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
    updateWorkflowPreserveLayout,

    // Workflow data
    workflowData
  };
}
