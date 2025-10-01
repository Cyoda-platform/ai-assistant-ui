import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ControlButton,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  addEdge
} from '@xyflow/react';
import type { Node, Edge, Connection, OnConnect, OnReconnect } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, Download, Upload, FileJson, Info, X, Cloud, CloudDownload, CloudUpload } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { Modal } from 'antd';
import { useNotifications, NotificationManager } from '@/components/Notification/Notification';

// Helper function to detect bidirectional connections
function hasBidirectionalConnection(
  sourceId: string,
  targetId: string,
  transitions: UITransitionData[]
): boolean {
  // Check if there's a reverse transition
  return transitions.some(
    t => t.sourceStateId === targetId && t.targetStateId === sourceId
  );
}

// Helper function to calculate optimal handles based on node positions
function calculateOptimalHandles(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  isBidirectional: boolean = false,
  isReturnPath: boolean = false
): { sourceHandle: string; targetHandle: string } {
  const deltaX = targetPos.x - sourcePos.x;
  const deltaY = targetPos.y - sourcePos.y;
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);

  // For bidirectional connections, use offset handles to avoid overlap
  if (isBidirectional) {
    if (absDeltaY > absDeltaX * 0.6) {
      // Vertical bidirectional - use left/right offset handles
      if (isReturnPath) {
        return {
          sourceHandle: 'bottom-left-source',
          targetHandle: 'top-left-target'
        };
      } else {
        return {
          sourceHandle: 'bottom-right-source',
          targetHandle: 'top-right-target'
        };
      }
    } else {
      // Horizontal bidirectional - use top/bottom offset handles
      if (deltaX > 0) {
        // Target is to the right
        if (isReturnPath) {
          return {
            sourceHandle: 'right-center-source',
            targetHandle: 'left-center-target'
          };
        } else {
          return {
            sourceHandle: 'right-center-source',
            targetHandle: 'left-center-target'
          };
        }
      } else {
        // Target is to the left
        if (isReturnPath) {
          return {
            sourceHandle: 'right-center-source',
            targetHandle: 'left-center-target'
          };
        } else {
          return {
            sourceHandle: 'right-center-source',
            targetHandle: 'left-center-target'
          };
        }
      }
    }
  }

  // Standard single-direction routing
  if (absDeltaY > absDeltaX * 0.6) {
    // Vertical connection is dominant
    if (deltaY > 0) {
      // Target is below source
      return {
        sourceHandle: 'bottom-center-source',
        targetHandle: 'top-center-target'
      };
    } else {
      // Target is above source
      return {
        sourceHandle: 'bottom-center-source',
        targetHandle: 'top-center-target'
      };
    }
  } else {
    // Horizontal connection is dominant
    if (deltaX > 0) {
      // Target is to the right
      return {
        sourceHandle: 'right-center-source',
        targetHandle: 'left-center-target'
      };
    } else {
      // Target is to the left
      return {
        sourceHandle: 'left-center-source',
        targetHandle: 'right-center-target'
      };
    }
  }
}

import type { UIWorkflowData, UIStateData, UITransitionData, StateDefinition, TransitionDefinition } from '../types/workflow';
import { StateNode } from './StateNode';
import { TransitionEdge } from './TransitionEdge';
import { LoopbackEdge } from './LoopbackEdge';
import { WorkflowJsonEditor } from '../Editors/WorkflowJsonEditor';
import { generateTransitionId, generateLayoutTransitionId, migrateLayoutTransitionId, validateTransitionExists, parseLayoutTransitionId, parseTransitionId } from '../utils/transitionUtils';
import { autoLayoutWorkflow, canAutoLayout } from '../utils/autoLayout';

interface WorkflowCanvasProps {
  workflow: UIWorkflowData | null;
  onWorkflowUpdate: (workflow: UIWorkflowData, description?: string) => void;
  onStateEdit: (stateId: string) => void;
  onTransitionEdit: (transitionId: string) => void;
  darkMode: boolean;
  technicalId?: string;
  modelName?: string;
  modelVersion?: number;
}

const nodeTypes = {
  stateNode: StateNode,
};

const edgeTypes = {
  transitionEdge: TransitionEdge,
  loopbackEdge: LoopbackEdge,
};

// Helper function to ensure workflow layout and configuration are in sync
export function cleanupWorkflowState(workflow: UIWorkflowData): UIWorkflowData {
  try {
    if (!workflow || !workflow.configuration || !workflow.layout) {
      return workflow;
    }

    const configStateIds = new Set(Object.keys(workflow.configuration.states || {}));

    // Remove layout states that don't have corresponding configuration states
    const cleanedLayoutStates = (workflow.layout.states || []).filter(layoutState =>
      configStateIds.has(layoutState.id)
    );

    // Remove layout transitions that reference non-existent states
    const cleanedLayoutTransitions = (workflow.layout.transitions || []).filter(layoutTransition => {
      // Check if this is a layout transition ID (sourceState-to-targetState format)
      const layoutParsed = parseLayoutTransitionId(layoutTransition.id);
      if (layoutParsed) {
        // For layout transition IDs, check if both source and target states exist
        return configStateIds.has(layoutParsed.sourceStateId) && configStateIds.has(layoutParsed.targetStateId);
      }

      // For canonical transition IDs, use the transition validation
      return validateTransitionExists(layoutTransition.id, workflow.configuration.states);
    });

    return {
      ...workflow,
      layout: {
        ...workflow.layout,
        states: cleanedLayoutStates,
        transitions: cleanedLayoutTransitions
      }
    };
  } catch (error) {
    console.error('Error cleaning up workflow state:', error);
    return workflow; // Return original workflow if cleanup fails
  }
}

// Helper function to create UI transition data (rich objects with all metadata)
function createUITransitionData(workflow: UIWorkflowData): UITransitionData[] {
  const transitionLayoutMap = new Map(workflow.layout.transitions.map(t => [t.id, t]));
  const transitions: UITransitionData[] = [];

  Object.entries(workflow.configuration.states).forEach(([sourceStateId, stateDefinition]) => {
    stateDefinition.transitions.forEach((transitionDef, index) => {
      // Use centralized transition ID generation
      const transitionId = generateTransitionId(sourceStateId, index);

      // Try to find layout data using both new and old formats for backward compatibility
      const layoutId = generateLayoutTransitionId(sourceStateId, transitionDef.next);
      const layout = transitionLayoutMap.get(transitionId) || transitionLayoutMap.get(layoutId);

      const uiTransition = {
        id: transitionId,
        sourceStateId,
        targetStateId: transitionDef.next,
        definition: transitionDef,
        labelPosition: layout?.labelPosition,
        sourceHandle: layout?.sourceHandle || null,
        targetHandle: layout?.targetHandle || null
      };



      transitions.push(uiTransition);
    });
  });

  return transitions;
}

// Helper function to create UI state data (simple objects that reference transitions)
function createUIStateData(workflow: UIWorkflowData, transitions: UITransitionData[]): UIStateData[] {
  const stateLayoutMap = new Map(workflow.layout.states.map(s => [s.id, s]));

  return Object.entries(workflow.configuration.states).map(([stateId, definition]) => {
    const layout = stateLayoutMap.get(stateId);
    const isInitial = workflow.configuration.initialState === stateId;
    const isFinal = definition.transitions.length === 0;

    // Get transition IDs for this state
    const transitionIds = transitions
      .filter(t => t.sourceStateId === stateId)
      .map(t => t.id);

    return {
      id: stateId,
      name: definition.name || stateId, // Use state name from definition if available, otherwise use state ID
      position: layout?.position || { x: 100, y: 100 },
      properties: layout?.properties,
      isInitial,
      isFinal,
      transitionIds
    };
  });
}



// Inner component that uses useReactFlow hook
const WorkflowCanvasInner: React.FC<WorkflowCanvasProps> = ({
  workflow,
  onWorkflowUpdate,
  onStateEdit,
  onTransitionEdit,
  darkMode,
  technicalId,
  modelName,
  modelVersion
}) => {
  const { screenToFlowPosition } = useReactFlow();
  const [showQuickHelp, setShowQuickHelp] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(true); // Open by default
  const [showWorkflowInfo, setShowWorkflowInfo] = useState(true); // Show workflow info panel by default
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);

  // Notifications
  const { notifications, removeNotification, showSuccess, showError, showInfo, showWarning } = useNotifications();

  // Auth and environment URL building
  const token = useAuthStore((state) => state.token);

  // Parse token once and extract org ID
  const orgId = useMemo(() => {
    if (!token) return '';
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      return (parsed.caas_org_id || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }, [token]);

  // Build environment URL (same logic as ChatBotMessageFunction)
  const buildEnvironmentUrl = useCallback((path: string) => {
    if (!orgId) return '';
    const envPrefix = import.meta.env.VITE_APP_CYODA_CLIENT_ENV_PREFIX || '';
    const host = import.meta.env.VITE_APP_CYODA_CLIENT_HOST || '';
    // Remove trailing dash from envPrefix if it exists to avoid double dash
    const cleanPrefix = envPrefix.endsWith('-') ? envPrefix.slice(0, -1) : envPrefix;
    return `https://${cleanPrefix}-${orgId}.${host}/api${path}`;
  }, [orgId]);

  // Use ref to always get current workflow value (fixes closure issue)
  // Re-enable cleanup now that the white screen issue is resolved
  const cleanedWorkflow = workflow ? cleanupWorkflowState(workflow) : null;
  const workflowRef = useRef(cleanedWorkflow);
  workflowRef.current = cleanedWorkflow;


  // Convert schema workflow to UI data
  const uiTransitions = useMemo(() => {
    return cleanedWorkflow ? createUITransitionData(cleanedWorkflow) : [];
  }, [cleanedWorkflow, cleanedWorkflow?.updatedAt]);

  const uiStates = useMemo(() => {
    return cleanedWorkflow ? createUIStateData(cleanedWorkflow, uiTransitions) : [];
  }, [cleanedWorkflow, cleanedWorkflow?.updatedAt, uiTransitions]);

  // Use refs to access current values in useEffect without causing dependency issues
  const uiStatesRef = useRef(uiStates);
  const uiTransitionsRef = useRef(uiTransitions);
  const onTransitionEditRef = useRef(onTransitionEdit);

  uiStatesRef.current = uiStates;
  uiTransitionsRef.current = uiTransitions;
  onTransitionEditRef.current = onTransitionEdit;

  // Handle state name changes directly without modal
  const handleStateNameChange = useCallback((stateId: string, newName: string) => {
    if (!cleanedWorkflow) return;

    const updatedWorkflow = {
      ...cleanedWorkflow,
      configuration: {
        ...cleanedWorkflow.configuration,
        states: {
          ...cleanedWorkflow.configuration.states,
          [stateId]: {
            ...cleanedWorkflow.configuration.states[stateId],
            name: newName.trim() || stateId
          }
        }
      },
      updatedAt: new Date().toISOString()
    };

    onWorkflowUpdate(updatedWorkflow);
  }, [cleanedWorkflow, onWorkflowUpdate]);

  const handleStateNameChangeRef = useRef(handleStateNameChange);
  handleStateNameChangeRef.current = handleStateNameChange;



  const handleTransitionUpdate = useCallback((updatedTransition: UITransitionData) => {
    if (!cleanedWorkflow) return;

    // Find existing layout transition or create new one
    const existingLayoutTransitions = cleanedWorkflow.layout.transitions;
    const existingIndex = existingLayoutTransitions.findIndex(t => t.id === updatedTransition.id);

    let updatedLayoutTransitions;
    if (existingIndex >= 0) {
      // Update existing layout transition
      updatedLayoutTransitions = existingLayoutTransitions.map(t =>
        t.id === updatedTransition.id
          ? {
              ...t,
              labelPosition: updatedTransition.labelPosition,
              sourceHandle: updatedTransition.sourceHandle,
              targetHandle: updatedTransition.targetHandle
            }
          : t
      );
    } else {
      // Create new layout transition
      const newLayoutTransition = {
        id: updatedTransition.id,
        labelPosition: updatedTransition.labelPosition,
        sourceHandle: updatedTransition.sourceHandle,
        targetHandle: updatedTransition.targetHandle
      };
      updatedLayoutTransitions = [...existingLayoutTransitions, newLayoutTransition];
    }

    const updatedWorkflow: UIWorkflowData = {
      ...cleanedWorkflow,
      layout: {
        ...cleanedWorkflow.layout,
        transitions: updatedLayoutTransitions,
        updatedAt: new Date().toISOString()
      }
    };

    // Only trigger undo for meaningful user changes (like dragging labels)
    onWorkflowUpdate(updatedWorkflow, 'Updated transition layout');
  }, [cleanedWorkflow, onWorkflowUpdate]);

  // Create ref for handleTransitionUpdate to avoid dependency issues
  const handleTransitionUpdateRef = useRef(handleTransitionUpdate);
  handleTransitionUpdateRef.current = handleTransitionUpdate;



  const [nodes, setNodes, defaultOnNodesChange] = useNodesState([]);
  const [edges, setEdges, defaultOnEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true);

  // Custom onNodesChange handler that updates workflow configuration when nodes are deleted
  const onNodesChange = useCallback((changes: any[]) => {
    // First apply the changes to React Flow's internal state
    defaultOnNodesChange(changes);

    // Check if any nodes were removed
    const removedNodes = changes.filter(change => change.type === 'remove');

    if (removedNodes.length > 0 && cleanedWorkflow) {
      // Update workflow configuration to remove deleted states
      const removedNodeIds = removedNodes.map(change => change.id);
      console.log('Nodes removed via keyboard:', removedNodeIds);

      const updatedStates = { ...cleanedWorkflow.configuration.states };
      removedNodeIds.forEach(nodeId => {
        delete updatedStates[nodeId];
      });

      // Remove transitions that reference deleted states
      Object.keys(updatedStates).forEach(sourceStateId => {
        const state = updatedStates[sourceStateId];
        state.transitions = state.transitions.filter(t => !removedNodeIds.includes(t.next));
      });

      // Handle initial state deletion
      let updatedInitialState = cleanedWorkflow.configuration.initialState;
      if (removedNodeIds.includes(updatedInitialState)) {
        const remainingStates = Object.keys(updatedStates);
        updatedInitialState = remainingStates.length > 0 ? remainingStates[0] : '';
      }

      // Remove from layout
      const updatedLayoutStates = cleanedWorkflow.layout.states.filter(
        s => !removedNodeIds.includes(s.id)
      );

      const updatedWorkflow: UIWorkflowData = {
        ...cleanedWorkflow,
        configuration: {
          ...cleanedWorkflow.configuration,
          initialState: updatedInitialState,
          states: updatedStates
        },
        layout: {
          ...cleanedWorkflow.layout,
          states: updatedLayoutStates,
          transitions: cleanedWorkflow.layout.transitions, // Explicitly preserve transitions
          updatedAt: new Date().toISOString()
        }
      };

      onWorkflowUpdate(updatedWorkflow, 'Deleted states');
    }
  }, [defaultOnNodesChange, cleanedWorkflow, onWorkflowUpdate]);

  // Custom onEdgesChange handler that handles transition deletion
  const onEdgesChange = useCallback((changes: any[]) => {
    // First apply the changes to React Flow's internal state
    defaultOnEdgesChange(changes);

    // Check if any edges were removed (e.g., via backspace key)
    const removedEdges = changes.filter(change => change.type === 'remove');

    if (removedEdges.length > 0 && cleanedWorkflow) {
      // Update workflow configuration to remove deleted transitions
      const removedEdgeIds = removedEdges.map(change => change.id);
      console.log('Transitions removed via keyboard:', removedEdgeIds);

      const updatedStates = { ...cleanedWorkflow.configuration.states };
      const updatedLayoutTransitions = [...cleanedWorkflow.layout.transitions];

      removedEdgeIds.forEach(edgeId => {
        // Parse the transition ID to find the source state and transition index
        const parsed = parseTransitionId(edgeId);
        if (parsed) {
          const { sourceStateId, transitionIndex } = parsed;
          const sourceState = updatedStates[sourceStateId];

          if (sourceState && sourceState.transitions[transitionIndex]) {
            // Remove the transition from the source state
            const updatedTransitions = [...sourceState.transitions];
            updatedTransitions.splice(transitionIndex, 1);

            updatedStates[sourceStateId] = {
              ...sourceState,
              transitions: updatedTransitions
            };

            // Remove the corresponding layout transition
            const layoutIndex = updatedLayoutTransitions.findIndex(t => t.id === edgeId);
            if (layoutIndex >= 0) {
              updatedLayoutTransitions.splice(layoutIndex, 1);
            }
          }
        }
      });

      // Create updated workflow
      const updatedWorkflow = {
        ...cleanedWorkflow,
        configuration: {
          ...cleanedWorkflow.configuration,
          states: updatedStates
        },
        layout: {
          ...cleanedWorkflow.layout,
          transitions: updatedLayoutTransitions,
          updatedAt: new Date().toISOString()
        }
      };

      const description = removedEdgeIds.length === 1
        ? `Deleted transition: ${removedEdgeIds[0]}`
        : `Deleted ${removedEdgeIds.length} transitions`;

      onWorkflowUpdate(updatedWorkflow, description);
    }
  }, [defaultOnEdgesChange, cleanedWorkflow, onWorkflowUpdate]);

  // Update nodes and edges when workflow changes - use workflow ID as dependency to avoid infinite loops
  React.useEffect(() => {
    if (cleanedWorkflow) {
      // Create nodes and edges inside useEffect to avoid dependency issues
      const currentUiStates = uiStatesRef.current;
      const currentOnTransitionEdit = onTransitionEditRef.current;
      const currentHandleTransitionUpdate = handleTransitionUpdateRef.current;
      const currentHandleStateNameChange = handleStateNameChangeRef.current;



      const newNodes = currentUiStates.map((state) => ({
        id: state.id,
        type: 'stateNode',
        position: state.position,
        data: {
          label: state.name,
          state: state,
          onNameChange: currentHandleStateNameChange,
        },
      }));

      const currentUiTransitions = uiTransitionsRef.current;

      const newEdges = currentUiTransitions.map((transition) => {
        // Check if this is a loop-back transition (same source and target)
        const isLoopback = transition.sourceStateId === transition.targetStateId;

        // Calculate optimal handles if not explicitly set
        let sourceHandle = transition.sourceHandle;
        let targetHandle = transition.targetHandle;

        if (!isLoopback && (!sourceHandle || !targetHandle)) {
          // Find source and target node positions
          const sourceNode = newNodes.find(n => n.id === transition.sourceStateId);
          const targetNode = newNodes.find(n => n.id === transition.targetStateId);

          if (sourceNode && targetNode) {
            // Check if this is a bidirectional connection
            const isBidirectional = hasBidirectionalConnection(
              transition.sourceStateId,
              transition.targetStateId,
              currentUiTransitions
            );

            // Determine if this is the return path (for offset routing)
            // We consider it a return path if the source comes alphabetically after target
            const isReturnPath = isBidirectional &&
              transition.sourceStateId > transition.targetStateId;

            const optimal = calculateOptimalHandles(
              sourceNode.position,
              targetNode.position,
              isBidirectional,
              isReturnPath
            );
            sourceHandle = sourceHandle || optimal.sourceHandle;
            targetHandle = targetHandle || optimal.targetHandle;
          }
        }

        return {
          id: transition.id,
          type: isLoopback ? 'loopbackEdge' : 'transitionEdge',
          source: transition.sourceStateId,
          target: transition.targetStateId,
          sourceHandle: sourceHandle || undefined,
          targetHandle: targetHandle || undefined,
          data: {
            transition: transition,
            onEdit: currentOnTransitionEdit,
            onUpdate: currentHandleTransitionUpdate,
            isLoopback,
          },
          label: transition.definition.name || '',
          animated: true,
        };
      });



      setNodes(newNodes);
      setEdges(newEdges);
      if (newNodes.length > 0) {
        setIsInitialized(true);
      }
    } else {
      setNodes([]);
      setEdges([]);
      setIsInitialized(false);
    }
  }, [
    cleanedWorkflow?.id,
    cleanedWorkflow?.layout?.updatedAt,
    Object.keys(cleanedWorkflow?.configuration?.states || {}).length,
    cleanedWorkflow?.layout?.states?.length,
    // Add dependencies to detect changes in state and transition content
    JSON.stringify(cleanedWorkflow?.configuration?.states || {}),
    cleanedWorkflow?.updatedAt, // This changes when the workflow is updated
  ]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!cleanedWorkflow || !params.source || !params.target) return;

      // Validate handle IDs to prevent React Flow errors
      // Source handles should end with -source
      if (params.sourceHandle) {
        if (!params.sourceHandle.endsWith('-source')) {
          console.error('Invalid source handle ID:', params.sourceHandle, 'should end with -source');
          return;
        }
        // Check that source handle is from a valid position (any of the 8 positions)
        const sourcePosition = params.sourceHandle.replace('-source', '');
        const validPositions = ['top-left', 'top-center', 'top-right', 'left-center', 'right-center', 'bottom-left', 'bottom-center', 'bottom-right'];
        if (!validPositions.includes(sourcePosition)) {
          console.error('Invalid source handle position:', params.sourceHandle);
          return;
        }
      }

      // Target handles should end with -target
      if (params.targetHandle) {
        if (!params.targetHandle.endsWith('-target')) {
          console.error('Invalid target handle ID:', params.targetHandle, 'should end with -target');
          return;
        }
        // Check that target handle is from a valid position (any of the 8 positions)
        const targetPosition = params.targetHandle.replace('-target', '');
        const validPositions = ['top-left', 'top-center', 'top-right', 'left-center', 'right-center', 'bottom-left', 'bottom-center', 'bottom-right'];
        if (!validPositions.includes(targetPosition)) {
          console.error('Invalid target handle position:', params.targetHandle);
          return;
        }
      }

      // Determine if this is a loop-back connection
      const isLoopback = params.source === params.target;
      const connectionType = isLoopback ? 'Loop-back Transition' : 'New Transition';



      // Create new transition definition
      const newTransitionDef: TransitionDefinition = {
        name: connectionType,
        next: params.target,
        manual: false,
        disabled: false
      };

      // Add transition to source state
      const updatedStates = { ...cleanedWorkflow.configuration.states };
      const sourceState = updatedStates[params.source];
      if (sourceState) {
        updatedStates[params.source] = {
          ...sourceState,
          transitions: [...sourceState.transitions, newTransitionDef]
        };
      }

      // Store handle information in layout for precise edge routing
      const transitionIndex = sourceState ? sourceState.transitions.length : 0;
      const transitionId = generateTransitionId(params.source, transitionIndex);

      // Update layout with handle information
      const updatedLayoutTransitions = [...(cleanedWorkflow.layout.transitions || [])];
      const existingTransitionIndex = updatedLayoutTransitions.findIndex(t => t.id === transitionId);

      const transitionLayout = {
        id: transitionId,
        sourceHandle: params.sourceHandle || null,
        targetHandle: params.targetHandle || null,
        labelPosition: isLoopback ? { x: 30, y: -30 } : { x: 0, y: 0 }
      };



      if (existingTransitionIndex >= 0) {
        updatedLayoutTransitions[existingTransitionIndex] = transitionLayout;
      } else {
        updatedLayoutTransitions.push(transitionLayout);
      }

      const updatedWorkflow: UIWorkflowData = {
        ...cleanedWorkflow,
        configuration: {
          ...cleanedWorkflow.configuration,
          states: updatedStates
        },
        layout: {
          ...cleanedWorkflow.layout,
          transitions: updatedLayoutTransitions,
          updatedAt: new Date().toISOString()
        }
      };

      const description = isLoopback
        ? `Added loop-back transition to ${params.source}`
        : `Connected ${params.source} to ${params.target}`;

      onWorkflowUpdate(updatedWorkflow, description);
    },
    [cleanedWorkflow, onWorkflowUpdate]
  );

  // Validate connections to prevent invalid handle combinations
  const isValidConnection = useCallback((connection: Connection) => {
    // Check that source handle ends with -source
    if (connection.sourceHandle) {
      if (!connection.sourceHandle.endsWith('-source')) {
        console.error('Invalid source handle:', connection.sourceHandle);
        return false;
      }
      // Allow all 8 positions for source handles
      const sourcePosition = connection.sourceHandle.replace('-source', '');
      const validPositions = ['top-left', 'top-center', 'top-right', 'left-center', 'right-center', 'bottom-left', 'bottom-center', 'bottom-right'];
      if (!validPositions.includes(sourcePosition)) {
        console.error('Invalid source handle position:', connection.sourceHandle);
        return false;
      }
    }

    // Check that target handle ends with -target
    if (connection.targetHandle) {
      if (!connection.targetHandle.endsWith('-target')) {
        console.error('Invalid target handle:', connection.targetHandle);
        return false;
      }
      // Allow all 8 positions for target handles
      const targetPosition = connection.targetHandle.replace('-target', '');
      const validPositions = ['top-left', 'top-center', 'top-right', 'left-center', 'right-center', 'bottom-left', 'bottom-center', 'bottom-right'];
      if (!validPositions.includes(targetPosition)) {
        console.error('Invalid target handle position:', connection.targetHandle);
        return false;
      }
    }

    return true;
  }, []);

  const onReconnect: OnReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (!cleanedWorkflow) return;

      // Find the transition that corresponds to the old edge
      const oldTransition = uiTransitions.find(t => t.id === oldEdge.id);
      if (!oldTransition) return;

      // Parse the old transition ID to get source state and transition index
      const parsed = parseTransitionId(oldEdge.id);
      if (!parsed) return;

      const { sourceStateId, transitionIndex } = parsed;

      // Get the source state
      const sourceState = cleanedWorkflow.configuration.states[sourceStateId];
      if (!sourceState || transitionIndex >= sourceState.transitions.length) return;

      // Get the current transition definition
      const currentTransitionDef = sourceState.transitions[transitionIndex];
      if (!currentTransitionDef) return;

      // Determine if this is a loop-back connection
      const isLoopback = newConnection.source === newConnection.target;
      const connectionType = isLoopback ? 'Loop-back Transition' : currentTransitionDef.name;

      // Update the transition definition with new target
      const updatedTransitionDef: TransitionDefinition = {
        ...currentTransitionDef,
        next: newConnection.target!,
        name: currentTransitionDef.name === 'New Transition' || currentTransitionDef.name === 'Loop-back Transition'
          ? connectionType
          : currentTransitionDef.name
      };

      // Update the source state's transitions
      const updatedStates = { ...cleanedWorkflow.configuration.states };
      const updatedSourceState = { ...sourceState };
      updatedSourceState.transitions = [...sourceState.transitions];
      updatedSourceState.transitions[transitionIndex] = updatedTransitionDef;
      updatedStates[sourceStateId] = updatedSourceState;

      // Update layout with new handle information
      const updatedLayoutTransitions = [...(cleanedWorkflow.layout.transitions || [])];
      const existingTransitionIndex = updatedLayoutTransitions.findIndex(t => t.id === oldEdge.id);

      const transitionLayout = {
        id: oldEdge.id,
        sourceHandle: newConnection.sourceHandle || null,
        targetHandle: newConnection.targetHandle || null,
        labelPosition: oldTransition.labelPosition || { x: 0, y: 0 }
      };

      if (existingTransitionIndex >= 0) {
        updatedLayoutTransitions[existingTransitionIndex] = transitionLayout;
      } else {
        updatedLayoutTransitions.push(transitionLayout);
      }

      const updatedWorkflow: UIWorkflowData = {
        ...cleanedWorkflow,
        configuration: {
          ...cleanedWorkflow.configuration,
          states: updatedStates
        },
        layout: {
          ...cleanedWorkflow.layout,
          transitions: updatedLayoutTransitions,
          updatedAt: new Date().toISOString()
        }
      };

      const description = isLoopback
        ? `Reconnected transition to loop back to ${newConnection.source}`
        : `Reconnected transition from ${sourceStateId} to ${newConnection.target}`;

      onWorkflowUpdate(updatedWorkflow, description);
    },
    [cleanedWorkflow, uiTransitions, onWorkflowUpdate]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!cleanedWorkflow) return;

      // Update state position in layout
      const updatedLayoutStates = cleanedWorkflow.layout.states.map((state) =>
        state.id === node.id
          ? { ...state, position: node.position }
          : state
      );

      const updatedWorkflow: UIWorkflowData = {
        ...cleanedWorkflow,
        layout: {
          ...cleanedWorkflow.layout,
          states: updatedLayoutStates,
          transitions: cleanedWorkflow.layout.transitions, // Explicitly preserve transitions
          updatedAt: new Date().toISOString()
        }
      };

      onWorkflowUpdate(updatedWorkflow, `Moved state: ${node.id}`);
    },
    [cleanedWorkflow, onWorkflowUpdate]
  );

  // Auto-layout handler with smooth animations
  const handleAutoLayout = useCallback(() => {
    if (!cleanedWorkflow || !canAutoLayout(cleanedWorkflow)) return;

    const layoutedWorkflow = autoLayoutWorkflow(cleanedWorkflow);

    // Apply the layout with animation by updating the workflow
    // React Flow will automatically animate the position changes
    onWorkflowUpdate(layoutedWorkflow, 'Applied auto-layout');
  }, [cleanedWorkflow, onWorkflowUpdate]);

  // Quick Help toggle handler
  const handleToggleQuickHelp = useCallback(() => {
    setShowQuickHelp(prev => !prev);
  }, []);

  // JSON Editor toggle handler
  const handleToggleJsonEditor = useCallback(() => {
    setShowJsonEditor(prev => !prev);
  }, []);

  // Workflow Info toggle handler
  const handleToggleWorkflowInfo = useCallback(() => {
    setShowWorkflowInfo(prev => !prev);
  }, []);

  // Handle node click to navigate in JSON editor
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedStateId(node.id);
    setSelectedTransitionId(null);
  }, []);

  // Handle edge click to navigate in JSON editor
  // Navigate to the source state of the transition
  const handleEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    // Extract source state from edge
    const sourceStateId = edge.source;
    setSelectedStateId(sourceStateId);
    setSelectedTransitionId(null);
  }, []);

  // Handle workflow JSON save
  const handleWorkflowJsonSave = useCallback((config: WorkflowConfiguration) => {
    if (!cleanedWorkflow) return;

    // Create layout states for any new states
    const existingStateIds = cleanedWorkflow.layout.states.map(s => s.id);
    const newStateIds = Object.keys(config.states).filter(id => !existingStateIds.includes(id));

    const newLayoutStates = newStateIds.map((stateId, index) => ({
      id: stateId,
      position: {
        x: 100 + (index % 3) * 250,
        y: 100 + Math.floor(index / 3) * 150
      },
      properties: {}
    }));

    // Keep existing layout states that still exist in the new config
    const updatedLayoutStates = cleanedWorkflow.layout.states
      .filter(s => config.states[s.id])
      .concat(newLayoutStates);

    const now = new Date().toISOString();
    const updatedWorkflow: UIWorkflowData = {
      ...cleanedWorkflow,
      configuration: config,
      layout: {
        ...cleanedWorkflow.layout,
        states: updatedLayoutStates,
        transitions: [], // Clear transitions, they'll be recreated
        version: cleanedWorkflow.layout.version + 1,
        updatedAt: now
      },
      updatedAt: now
    };

    // Apply auto-layout to make it look nice
    const layoutedWorkflow = autoLayoutWorkflow(updatedWorkflow);
    onWorkflowUpdate(layoutedWorkflow, 'Updated workflow JSON with auto-layout');
  }, [cleanedWorkflow, onWorkflowUpdate]);

  // Export workflow JSON
  const handleExportJSON = useCallback(() => {
    if (!cleanedWorkflow) return;

    try {
      const jsonString = JSON.stringify(cleanedWorkflow.configuration, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Use modelName-version for filename, fallback to workflow name
      let filename: string;
      if (modelName && modelVersion) {
        filename = `${modelName}_v${modelVersion}.json`;
      } else {
        // Fallback: sanitize workflow name
        const safeName = (cleanedWorkflow.configuration.name || 'workflow')
          .replace(/[^a-z0-9_-]/gi, '_')
          .toLowerCase();
        filename = `${safeName}.json`;
      }

      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [cleanedWorkflow, modelName, modelVersion]);

  // Import workflow JSON
  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const config = JSON.parse(text) as WorkflowConfiguration;

        // Validate required fields
        if (!config.version || !config.name || !config.initialState || !config.states) {
          alert('Invalid workflow JSON: missing required fields (version, name, initialState, states)');
          return;
        }

        if (Object.keys(config.states).length === 0) {
          alert('Invalid workflow JSON: states object cannot be empty');
          return;
        }

        // Create layout states for all states in the configuration
        const stateIds = Object.keys(config.states);
        const layoutStates = stateIds.map((stateId, index) => ({
          id: stateId,
          position: {
            x: 100 + (index % 3) * 250,
            y: 100 + Math.floor(index / 3) * 150
          },
          properties: {}
        }));

        // Create new workflow with imported configuration
        const now = new Date().toISOString();
        const newWorkflow: UIWorkflowData = {
          ...cleanedWorkflow!,
          configuration: config,
          layout: {
            workflowId: cleanedWorkflow!.id,
            states: layoutStates,
            transitions: [],
            version: cleanedWorkflow!.layout.version + 1,
            updatedAt: now
          },
          updatedAt: now
        };

        // Apply auto-layout to imported workflow
        const layoutedWorkflow = autoLayoutWorkflow(newWorkflow);
        onWorkflowUpdate(layoutedWorkflow, 'Imported workflow from JSON');
      } catch (error) {
        alert(`Error importing workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    input.click();
  }, [cleanedWorkflow, onWorkflowUpdate]);

  // Export workflow to environment (POST to import endpoint)
  const handleExportToEnvironment = useCallback(async () => {
    if (!cleanedWorkflow || !token) {
      showWarning(
        'Authentication Required',
        'Please log in to export workflows to the environment'
      );
      return;
    }

    // Check if modelName and modelVersion are provided
    if (!modelName || !modelVersion) {
      showError(
        'Missing Model Information',
        'Model name and version are required for API export. Please ensure the workflow tab has this information.'
      );
      return;
    }

    try {
      const url = buildEnvironmentUrl(`/model/${modelName}/${modelVersion}/workflow/import`);

      // Prepare the payload
      const payload = {
        workflows: [cleanedWorkflow.configuration],
        importMode: 'REPLACE'
      };

      console.log('=== Export to Environment Debug ===');
      console.log('URL:', url);
      console.log('Model Name:', modelName);
      console.log('Model Version:', modelVersion);
      console.log('Token:', token.substring(0, 20) + '...');
      console.log('Payload:', payload);
      console.log('===================================');

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Export response:', response.data);

      showSuccess(
        'Workflow Exported Successfully',
        `Workflow "${cleanedWorkflow.configuration.name}" has been exported to ${modelName} (v${modelVersion})`
      );
    } catch (error: any) {
      console.error('Export to environment failed:', error);
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Unknown error';

      showError(
        'Export Failed',
        errorMsg
      );
    }
  }, [cleanedWorkflow, token, modelName, modelVersion, buildEnvironmentUrl, showSuccess, showError, showWarning]);

  // Import workflow from environment
  const handleImportFromEnvironment = useCallback(async () => {
    if (!cleanedWorkflow || !token) {
      showWarning(
        'Authentication Required',
        'Please log in to import workflows from the environment'
      );
      return;
    }

    // Check if modelName and modelVersion are provided
    if (!modelName || !modelVersion) {
      showError(
        'Missing Model Information',
        'Model name and version are required for API import. Please ensure the workflow tab has this information.'
      );
      return;
    }

    Modal.confirm({
      title: 'Import Workflow from Environment',
      content: 'This will replace your current workflow with data from the environment. Continue?',
      okText: 'Import',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        try {
          // First, export to get the current workflow from environment
          const exportUrl = buildEnvironmentUrl(`/model/${modelName}/${modelVersion}/workflow/export`);

          console.log('=== Import from Environment Debug ===');
          console.log('Export URL:', exportUrl);
          console.log('Model Name:', modelName);
          console.log('Model Version:', modelVersion);
          console.log('Token:', token.substring(0, 20) + '...');
          console.log('=====================================');

          const exportResponse = await axios.get(exportUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          console.log('Export response:', exportResponse.data);

          // Extract workflows from response
          const workflows = exportResponse.data.workflows;
          if (!workflows || workflows.length === 0) {
            showWarning(
              'No Workflows Found',
              'No workflows found in the environment'
            );
            return;
          }

          // Use the first workflow
          const config = workflows[0] as WorkflowConfiguration;

          // Validate required fields
          if (!config.version || !config.name || !config.initialState || !config.states) {
            showError(
              'Invalid Workflow Data',
              'The workflow data from environment is missing required fields'
            );
            return;
          }

          // Create layout states for all states in the configuration
          const stateIds = Object.keys(config.states);
          const layoutStates = stateIds.map((stateId, index) => ({
            id: stateId,
            position: {
              x: 100 + (index % 3) * 250,
              y: 100 + Math.floor(index / 3) * 150
            },
            properties: {}
          }));

          // Create new workflow with imported configuration
          const now = new Date().toISOString();
          const newWorkflow: UIWorkflowData = {
            ...cleanedWorkflow,
            configuration: config,
            layout: {
              workflowId: cleanedWorkflow.id,
              states: layoutStates,
              transitions: [],
              version: cleanedWorkflow.layout.version + 1,
              updatedAt: now
            },
            updatedAt: now
          };

          // Apply auto-layout to imported workflow
          const layoutedWorkflow = autoLayoutWorkflow(newWorkflow);
          onWorkflowUpdate(layoutedWorkflow, 'Imported workflow from environment');

          showSuccess(
            'Workflow Imported Successfully',
            `Workflow "${config.name}" has been imported from ${modelName} (v${modelVersion})`
          );
        } catch (error: any) {
          console.error('Import from environment failed:', error);
          const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Unknown error';

          showError(
            'Import Failed',
            errorMsg
          );
        }
      }
    });
  }, [cleanedWorkflow, token, modelName, modelVersion, buildEnvironmentUrl, onWorkflowUpdate, showSuccess, showError, showWarning]);

  // Handle double-click detection on pane
  const lastClickTimeRef = useRef<number>(0);
  const lastClickPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      const now = Date.now();
      const timeDiff = now - lastClickTimeRef.current;
      const positionDiff = Math.abs(event.clientX - lastClickPositionRef.current.x) +
                          Math.abs(event.clientY - lastClickPositionRef.current.y);

      // Double-click detection: within 500ms and within 5px of previous click
      if (timeDiff < 500 && positionDiff < 5) {
        const currentWorkflow = workflowRef.current;
        if (!currentWorkflow) return;

        // Convert screen coordinates to flow coordinates (accounts for zoom/pan)
        const screenPosition = { x: event.clientX, y: event.clientY };
        const flowPosition = screenToFlowPosition(screenPosition);

        // Center the node (typical state node is ~150x50px)
        const position = {
          x: flowPosition.x - 75, // Center horizontally
          y: flowPosition.y - 25  // Center vertically
        };



      // Generate a unique state ID
      const existingStateIds = Object.keys(currentWorkflow.configuration.states);

      // Also check layout states to ensure we don't have any orphaned layout entries
      const existingLayoutIds = currentWorkflow.layout.states.map(s => s.id);
      const allExistingIds = new Set([...existingStateIds, ...existingLayoutIds]);

      let newStateId = 'new-state';
      let counter = 1;
      while (allExistingIds.has(newStateId)) {
        newStateId = `new-state-${counter}`;
        counter++;
      }



      // Create new state definition
      const newStateDefinition: StateDefinition = {
        transitions: []
      };

      // First, clean up layout states to remove any orphaned entries
      // (states that exist in layout but not in current configuration)
      const currentConfigStateIds = Object.keys(currentWorkflow.configuration.states);
      const cleanLayoutStates = currentWorkflow.layout.states.filter(layoutState =>
        currentConfigStateIds.includes(layoutState.id)
      );

      // Add to configuration
      const updatedStates = {
        ...currentWorkflow.configuration.states,
        [newStateId]: newStateDefinition
      };

      // Add to layout
      const newLayoutState = {
        id: newStateId,
        position,
        properties: {}
      };

      const updatedLayoutStates = [...cleanLayoutStates, newLayoutState];

      const updatedWorkflow: UIWorkflowData = {
        ...currentWorkflow,
        configuration: {
          ...currentWorkflow.configuration,
          states: updatedStates
        },
        layout: {
          ...currentWorkflow.layout,
          states: updatedLayoutStates,
          transitions: currentWorkflow.layout.transitions, // Explicitly preserve transitions
          updatedAt: new Date().toISOString()
        }
      };


        onWorkflowUpdate(updatedWorkflow, `Added new state: ${newStateId}`);

        // Reset click tracking after successful double-click
        lastClickTimeRef.current = 0;
      } else {
        // Single click - update tracking
        lastClickTimeRef.current = now;
        lastClickPositionRef.current = { x: event.clientX, y: event.clientY };
      }
    },
    [onWorkflowUpdate]
  );



  if (!cleanedWorkflow) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="text-xl font-medium mb-2">No Workflow Selected</h3>
          <p>Select an entity and workflow from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  // Don't render ReactFlow until we have the workflow data loaded and initialized
  if (cleanedWorkflow && uiStates.length > 0 && !isInitialized) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex">
      {/* Canvas Area */}
      <div className="flex-1 h-full">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        isValidConnection={isValidConnection}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={onPaneClick}

        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className={darkMode ? 'dark' : ''}
        colorMode={darkMode ? 'dark' : 'light'}

        // Disable default double-click zoom behavior
        zoomOnDoubleClick={false}

        // Optimize rendering
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}

        // Smooth animations
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 2 }
        }}
      >
        <Background />
        <Controls>
          <ControlButton
            onClick={handleToggleWorkflowInfo}
            title="Toggle workflow info"
            className={showWorkflowInfo ? 'bg-gradient-to-br from-lime-100 to-emerald-100 dark:from-lime-900 dark:to-emerald-900 border-2 border-lime-400' : ''}
            data-testid="workflow-info-button"
          >
            <Info size={16} />
          </ControlButton>
          <ControlButton
            onClick={handleToggleJsonEditor}
            title="Edit workflow JSON"
            className={showJsonEditor ? 'bg-gradient-to-br from-lime-100 to-emerald-100 dark:from-lime-900 dark:to-emerald-900 border-2 border-lime-400' : ''}
            data-testid="json-editor-button"
          >
            <FileJson size={16} />
          </ControlButton>
          <ControlButton
            onClick={handleExportJSON}
            title="Export workflow to file"
            data-testid="export-json-button"
          >
            <Download size={16} />
          </ControlButton>
          <ControlButton
            onClick={handleImportJSON}
            title="Import workflow from file"
            data-testid="import-json-button"
          >
            <Upload size={16} />
          </ControlButton>
          <ControlButton
            onClick={handleExportToEnvironment}
            title="Export workflow to environment (entity1/v1)"
            data-testid="export-env-button"
            className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30"
          >
            <CloudUpload size={16} className="text-blue-600 dark:text-blue-400" />
          </ControlButton>
          <ControlButton
            onClick={handleImportFromEnvironment}
            title="Import workflow from environment (entity1/v1)"
            data-testid="import-env-button"
            className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30"
          >
            <CloudDownload size={16} className="text-blue-600 dark:text-blue-400" />
          </ControlButton>
          <ControlButton
            onClick={handleAutoLayout}
            disabled={!canAutoLayout(cleanedWorkflow)}
            title="Auto-arrange states using hierarchical layout"
            data-testid="auto-layout-button"
          >
            <Network size={16} />
          </ControlButton>
          <ControlButton
            onClick={handleToggleQuickHelp}
            title="Toggle Quick Help"
            className={showQuickHelp ? 'bg-gradient-to-br from-pink-100 to-fuchsia-100 dark:from-pink-900 dark:to-fuchsia-900 border-2 border-pink-400' : ''}
            data-testid="quick-help-button"
          >
            <span className="text-sm font-bold">?</span>
          </ControlButton>
        </Controls>

        <MiniMap
          nodeColor={(node) => {
            const state = node.data?.state as UIStateData;
            if (state?.isInitial) return '#84cc16'; // lime
            if (state?.isFinal) return '#ec4899'; // pink
            return '#10b981'; // emerald
          }}
          className={darkMode ? 'dark' : ''}
        />

        {showWorkflowInfo && (
          <Panel position="top-left" className="bg-gradient-to-br from-white via-lime-50 to-emerald-50 dark:from-gray-900 dark:via-lime-950/30 dark:to-emerald-950/30 p-4 rounded-2xl shadow-2xl border-2 border-lime-200 dark:border-lime-800 backdrop-blur-md">
            <div className="text-sm">
              <h4 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-lime-600 to-emerald-600 dark:from-lime-400 dark:to-emerald-400 mb-3 text-base">
                {workflow.configuration.name}
              </h4>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{Object.keys(workflow.configuration.states).length} states</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  <span>{uiTransitions.length} transitions</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-lime-200 dark:border-lime-800">
                  <span>Updated: {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                  <button
                    onClick={handleToggleWorkflowInfo}
                    className="p-1 rounded-lg hover:bg-lime-100 dark:hover:bg-lime-900/30 transition-colors group"
                    title="Close workflow info"
                  >
                    <X size={14} className="text-gray-500 dark:text-gray-400 group-hover:text-lime-600 dark:group-hover:text-lime-400" />
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        )}

        {showQuickHelp && (
          <Panel position="top-right" className="bg-gradient-to-br from-white via-pink-50 to-fuchsia-50 dark:from-gray-900 dark:via-pink-950/30 dark:to-fuchsia-950/30 p-4 rounded-2xl shadow-2xl border-2 border-pink-200 dark:border-pink-800 backdrop-blur-md" data-testid="quick-help-panel">
            <div className="text-xs text-gray-700 dark:text-gray-300 space-y-2">
              <div className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-fuchsia-600 dark:from-pink-400 dark:to-fuchsia-400 mb-3 text-sm">✨ Quick Help</div>
              <div className="flex items-start space-x-2">
                <span className="text-lime-500 mt-0.5">•</span>
                <span>Double-click canvas to add state</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-pink-500 mt-0.5">•</span>
                <span>Click state/transition → jump to JSON</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-lime-500 mt-0.5">•</span>
                <span>Double-click transition → open editor</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-pink-500 mt-0.5">•</span>
                <span>Drag from state handles to connect</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-lime-500 mt-0.5">•</span>
                <span>Drag states to rearrange</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-pink-500 mt-0.5">•</span>
                <span>Use layout button to auto-arrange</span>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
      </div>

      {/* Workflow JSON Editor Side Panel */}
      {cleanedWorkflow && showJsonEditor && (
        <WorkflowJsonEditor
          workflow={cleanedWorkflow.configuration}
          isOpen={showJsonEditor}
          onClose={() => setShowJsonEditor(false)}
          onSave={handleWorkflowJsonSave}
          selectedStateId={selectedStateId}
          selectedTransitionId={selectedTransitionId}
          technicalId={technicalId}
        />
      )}

      {/* Notification Manager */}
      <NotificationManager
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

// Outer component that provides ReactFlow context
export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
};
