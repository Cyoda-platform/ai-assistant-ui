import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
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
  addEdge,
  MarkerType,
  Position
} from '@xyflow/react';
import type { Node, Edge, Connection, OnConnect, OnReconnect } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, Download, Upload, FileJson, Info, X, Cloud, CloudDownload, CloudUpload, Maximize2, Minimize2, Settings, ArrowLeft, Lightbulb, Undo2, Redo2, Scan } from 'lucide-react';
import axios from 'axios';
import privateClient from '@/clients/private';
import { useAuthStore } from '@/stores/auth';
import { Modal } from 'antd';
import { useNotifications, NotificationManager } from '@/components/Notification/Notification';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUndoRedoWorkflow } from '@/hooks/useUndoRedoWorkflow';

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
    if (absDeltaY >= absDeltaX) {
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
            sourceHandle: 'right-bottom-source',
            targetHandle: 'left-bottom-target'
          };
        } else {
          return {
            sourceHandle: 'right-top-source',
            targetHandle: 'left-top-target'
          };
        }
      } else {
        // Target is to the left
        if (isReturnPath) {
          return {
            sourceHandle: 'left-bottom-source',
            targetHandle: 'right-bottom-target'
          };
        } else {
          return {
            sourceHandle: 'left-top-source',
            targetHandle: 'right-top-target'
          };
        }
      }
    }
  }

  // Standard single-direction routing
  if (absDeltaY >= absDeltaX) {
    // Vertical connection is dominant
    if (deltaY > 0) {
      // Target is below source: use bottom of source, top of target
      return {
        sourceHandle: 'bottom-center-source',
        targetHandle: 'top-center-target'
      };
    } else {
      // Target is above source: use top of source, bottom of target
      return {
        sourceHandle: 'top-center-source',
        targetHandle: 'bottom-center-target'
      };
    }
  } else {
    // Horizontal connection is dominant
    if (deltaX > 0) {
      // Target is to the right: use right of source, left of target
      return {
        sourceHandle: 'right-top-source',
        targetHandle: 'left-top-target'
      };
    } else {
      // Target is to the left: use left of source, right of target
      return {
        sourceHandle: 'left-top-source',
        targetHandle: 'right-top-target'
      };
    }
  }
}

import type { UIWorkflowData, UIStateData, UITransitionData, StateDefinition, TransitionDefinition, WorkflowConfiguration } from '../types/workflow';
import { StateNode } from './StateNode';
import { TransitionNode } from './TransitionNode';
import { TransitionEdge } from './TransitionEdge';
import { LoopbackEdge } from './LoopbackEdge';
import { WorkflowJsonEditor } from '../Editors/WorkflowJsonEditor';
import { generateTransitionId, generateLayoutTransitionId, migrateLayoutTransitionId, validateTransitionExists, parseLayoutTransitionId, parseTransitionId, migrateLayoutTransitions } from '../utils/transitionUtils';
import { autoLayoutWorkflow, canAutoLayout, recalculateHandlesForMovedState } from '../utils/autoLayout';
import { useTheme } from '../hooks/useTheme';
import { getAvailableThemes, COLOR_PALETTES } from '../themes/colorPalettes';

interface WorkflowCanvasProps {
  workflow: UIWorkflowData | null;
  onWorkflowUpdate: (workflow: UIWorkflowData, description?: string) => void;
  onStateEdit: (stateId: string) => void;
  onTransitionEdit: (transitionId: string) => void;
  onSendToChat?: (data: string) => void;
  onBack?: () => void;
  darkMode: boolean;
  technicalId?: string;
  modelName?: string;
  modelVersion?: number;
  // Optional fullscreen control - if provided, uses local state instead of navigation
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
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

    // First, migrate old layout transitions to ensure they have sourceStateId and targetStateId
    const migratedLayoutTransitions = migrateLayoutTransitions(
      workflow.layout.transitions || [],
      workflow
    );

    // Remove layout transitions that reference non-existent states
    const cleanedLayoutTransitions = migratedLayoutTransitions.filter(layoutTransition => {
      // Check if transition has explicit sourceStateId and targetStateId (from migration)
      if (layoutTransition.sourceStateId && layoutTransition.targetStateId) {
        return configStateIds.has(layoutTransition.sourceStateId) && configStateIds.has(layoutTransition.targetStateId);
      }

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
        position: layout?.position, // Include transition node position
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
  onSendToChat,
  onBack,
  darkMode,
  technicalId,
  modelName,
  modelVersion,
  isFullscreen: externalIsFullscreen,
  onToggleFullscreen: externalOnToggleFullscreen,
}) => {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [showQuickHelp, setShowQuickHelp] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(true); // Open by default
  const [showWorkflowInfo, setShowWorkflowInfo] = useState(true); // Show workflow info panel by default
  const [showSettings, setShowSettings] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);

  // Settings state with localStorage persistence
  const [edgeType, setEdgeTypeState] = useState<'default' | 'straight' | 'step' | 'smoothstep'>(() => {
    try {
      const stored = localStorage.getItem('workflow-canvas-edge-type');
      if (stored && ['default', 'straight', 'step', 'smoothstep'].includes(stored)) {
        return stored as 'default' | 'straight' | 'step' | 'smoothstep';
      }
    } catch (error) {
      console.warn('Failed to load edge type from localStorage:', error);
    }
    return 'smoothstep'; // Changed from 'default' to 'smoothstep' for cleaner routing
  });

  const [layoutDirection, setLayoutDirectionState] = useState<'TB' | 'LR'>(() => {
    // Always use global localStorage setting for direction
    try {
      const stored = localStorage.getItem('workflow-canvas-layout-direction');
      if (stored && ['TB', 'LR'].includes(stored)) {
        return stored as 'TB' | 'LR';
      }
    } catch (error) {
      console.warn('Failed to load layout direction from localStorage:', error);
    }
    return 'TB';
  });

  // Wrapper functions to persist settings to localStorage
  const setEdgeType = useCallback((value: 'default' | 'straight' | 'step' | 'smoothstep') => {
    setEdgeTypeState(value);
    try {
      localStorage.setItem('workflow-canvas-edge-type', value);
    } catch (error) {
      console.warn('Failed to save edge type to localStorage:', error);
    }
  }, []);

  const setLayoutDirection = useCallback((value: 'TB' | 'LR') => {
    setLayoutDirectionState(value);
    try {
      localStorage.setItem('workflow-canvas-layout-direction', value);
    } catch (error) {
      console.warn('Failed to save layout direction to localStorage:', error);
    }
  }, []);

  // Theme management
  const { theme, setTheme, palette } = useTheme();

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

  // Handle sending state data to chat
  const handleStateSendToChat = useCallback((stateData: UIStateData) => {
    if (!onSendToChat) return;

    const stateJson = JSON.stringify(stateData, null, 2);
    onSendToChat(stateJson);
    console.log('📤 Sent state to chat:', stateData);
  }, [onSendToChat]);

  const handleStateSendToChatRef = useRef(handleStateSendToChat);
  handleStateSendToChatRef.current = handleStateSendToChat;

  // Handle sending transition data to chat
  const handleTransitionSendToChat = useCallback((transitionData: UITransitionData) => {
    if (!onSendToChat) return;

    const transitionJson = JSON.stringify(transitionData, null, 2);
    onSendToChat(transitionJson);
    console.log('📤 Sent transition to chat:', transitionData);
  }, [onSendToChat]);

  const handleTransitionSendToChatRef = useRef(handleTransitionSendToChat);
  handleTransitionSendToChatRef.current = handleTransitionSendToChat;

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

  // Handle workflow configuration updates from JSON editor
  const handleConfigurationUpdate = useCallback((updatedConfig: WorkflowConfiguration) => {
    if (!cleanedWorkflow) return;

    console.log('📝 Updating workflow configuration from JSON editor');

    // Get current state IDs and new state IDs
    const currentStateIds = Object.keys(cleanedWorkflow.configuration.states);
    const newStateIds = Object.keys(updatedConfig.states);

    // Check if there are new states that don't have layout positions
    const hasNewStates = newStateIds.some(id => !cleanedWorkflow.layout.states.find(s => s.id === id));

    // Preserve existing layout positions for states that still exist
    const existingLayoutStates = cleanedWorkflow.layout.states;
    const layoutStateMap = new Map(existingLayoutStates.map(s => [s.id, s]));

    // Create updated layout states
    const updatedLayoutStates = newStateIds.map((stateId, index) => {
      // If state already has a layout position, keep it
      if (layoutStateMap.has(stateId)) {
        return layoutStateMap.get(stateId)!;
      }

      // Otherwise, auto-position the new state
      const stateCount = newStateIds.length;
      let position;

      if (stateCount <= 4) {
        position = { x: 100 + (index * 220), y: 200 };
      } else if (stateCount <= 9) {
        const row = Math.floor(index / 3);
        const col = index % 3;
        position = { x: 100 + (col * 220), y: 150 + (row * 170) };
      } else {
        const row = Math.floor(index / 3);
        const col = index % 3;
        position = { x: 100 + (col * 210), y: 100 + (row * 160) };
      }

      return {
        id: stateId,
        position,
        properties: {}
      };
    });

    console.log('🎨 Updated layout states:', updatedLayoutStates.map(s => ({ id: s.id, x: s.position.x, y: s.position.y })));

    let updatedWorkflow: UIWorkflowData = {
      ...cleanedWorkflow,
      configuration: updatedConfig,
      layout: {
        ...cleanedWorkflow.layout,
        states: updatedLayoutStates,
        direction: layoutDirection, // Save current direction
        updatedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    // If there are new states OR workflow is not manually positioned, apply auto-layout
    if ((hasNewStates || !cleanedWorkflow.layout.manuallyPositioned) && canAutoLayout(updatedWorkflow)) {
      console.log('🎨 Applying auto-layout after JSON update (hasNewStates:', hasNewStates, ', manuallyPositioned:', cleanedWorkflow.layout.manuallyPositioned, ')');
      updatedWorkflow = autoLayoutWorkflow(updatedWorkflow, { direction: layoutDirection });

      // Keep manuallyPositioned as false since this is automatic layout
      updatedWorkflow = {
        ...updatedWorkflow,
        layout: {
          ...updatedWorkflow.layout,
          manuallyPositioned: false,
        }
      };

      // Set flag to trigger fitView after layout is applied
      shouldFitViewRef.current = true;
    }

    onWorkflowUpdate(updatedWorkflow, 'Updated workflow configuration from JSON editor', false);
  }, [cleanedWorkflow, onWorkflowUpdate, layoutDirection]);

  const [nodes, setNodes, defaultOnNodesChange] = useNodesState([]);
  const [edges, setEdges, defaultOnEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true);

  // Undo/Redo functionality - restore workflow from history
  const handleWorkflowRestore = useCallback((restoredWorkflow: UIWorkflowData) => {
    // Update the workflow without adding to history (undo/redo action)
    onWorkflowUpdate(restoredWorkflow, 'Undo/Redo');
  }, [onWorkflowUpdate]);

  const { canUndo, canRedo, undo, redo, saveStateImmediate } = useUndoRedoWorkflow(
    cleanedWorkflow,
    handleWorkflowRestore,
    {
      maxHistorySize: 50,
      debounceMs: 500,
      enableKeyboardShortcuts: true,
    }
  );

  // Custom onNodesChange handler that updates workflow configuration when nodes are deleted
  const onNodesChange = useCallback((changes: any[]) => {
    // First apply the changes to React Flow's internal state
    defaultOnNodesChange(changes);

    // Check if any nodes were removed
    const removedNodes = changes.filter(change => change.type === 'remove');

    if (removedNodes.length > 0 && cleanedWorkflow) {
      const removedNodeIds = removedNodes.map(change => change.id);

      // Separate state nodes and transition nodes
      const removedStateIds = removedNodeIds.filter(id => !id.startsWith('transition-'));
      const removedTransitionNodeIds = removedNodeIds.filter(id => id.startsWith('transition-'));
      const removedTransitionIds = removedTransitionNodeIds.map(id => id.replace('transition-', ''));

      const updatedStates = { ...cleanedWorkflow.configuration.states };
      const updatedLayoutTransitions = [...cleanedWorkflow.layout.transitions];

      // Handle state node deletions
      removedStateIds.forEach(nodeId => {
        delete updatedStates[nodeId];
      });

      // Remove transitions that reference deleted states
      Object.keys(updatedStates).forEach(sourceStateId => {
        const state = updatedStates[sourceStateId];
        state.transitions = state.transitions.filter(t => !removedStateIds.includes(t.next));
      });

      // Handle transition node deletions
      removedTransitionIds.forEach(transitionId => {
        // Parse transition ID to find source state and index
        const parsed = parseTransitionId(transitionId);
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
          }
        }

        // Remove from layout
        const layoutIndex = updatedLayoutTransitions.findIndex(t => t.id === transitionId);
        if (layoutIndex >= 0) {
          updatedLayoutTransitions.splice(layoutIndex, 1);
        }
      });

      // Handle initial state deletion
      let updatedInitialState = cleanedWorkflow.configuration.initialState;
      if (removedStateIds.includes(updatedInitialState)) {
        const remainingStates = Object.keys(updatedStates);
        updatedInitialState = remainingStates.length > 0 ? remainingStates[0] : '';
      }

      // Remove state nodes from layout
      const updatedLayoutStates = cleanedWorkflow.layout.states.filter(
        s => !removedStateIds.includes(s.id)
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
          transitions: updatedLayoutTransitions,
          direction: layoutDirection, // Save current direction
          updatedAt: new Date().toISOString()
        }
      };

      const description = removedStateIds.length > 0 && removedTransitionIds.length > 0
        ? `Deleted ${removedStateIds.length} states and ${removedTransitionIds.length} transitions`
        : removedStateIds.length > 0
          ? `Deleted ${removedStateIds.length} states`
          : `Deleted ${removedTransitionIds.length} transitions`;

      onWorkflowUpdate(updatedWorkflow, description);
    }
  }, [defaultOnNodesChange, cleanedWorkflow, onWorkflowUpdate]);

  // Custom onEdgesChange handler that handles transition deletion
  const onEdgesChange = useCallback((changes: any[]) => {
    console.log('📊 onEdgesChange called with changes:', changes);

    // First apply the changes to React Flow's internal state
    defaultOnEdgesChange(changes);

    // Check if any edges were removed (e.g., via backspace key)
    const removedEdges = changes.filter(change => change.type === 'remove');

    // Check for reconnect changes
    const reconnectChanges = changes.filter(change => change.type === 'reconnect');
    if (reconnectChanges.length > 0) {
      console.log('🔄 Reconnect changes detected:', reconnectChanges);
    }

    if (removedEdges.length > 0 && cleanedWorkflow) {
      // Save state before deleting edges
      saveStateImmediate();

      // Update workflow configuration to remove deleted transitions
      const removedEdgeIds = removedEdges.map(change => change.id);

      const updatedStates = { ...cleanedWorkflow.configuration.states };
      const updatedLayoutTransitions = [...cleanedWorkflow.layout.transitions];

      removedEdgeIds.forEach(edgeId => {
        // Remove 'edge-' prefix if present
        const transitionId = edgeId.startsWith('edge-') ? edgeId.substring(5) : edgeId;

        console.log('🗑️ Deleting edge:', { edgeId, transitionId });

        // Parse the transition ID to find the source state and transition index
        const parsed = parseTransitionId(transitionId);
        if (parsed) {
          const { sourceStateId, transitionIndex } = parsed;
          const sourceState = updatedStates[sourceStateId];

          console.log('🗑️ Parsed transition:', { sourceStateId, transitionIndex, sourceState: !!sourceState });

          if (sourceState && sourceState.transitions[transitionIndex]) {
            // Remove the transition from the source state
            const updatedTransitions = [...sourceState.transitions];
            updatedTransitions.splice(transitionIndex, 1);

            updatedStates[sourceStateId] = {
              ...sourceState,
              transitions: updatedTransitions
            };

            console.log('🗑️ Removed transition from state:', { sourceStateId, newTransitionCount: updatedTransitions.length });

            // Remove the corresponding layout transition
            const layoutIndex = updatedLayoutTransitions.findIndex(t => t.id === transitionId);
            if (layoutIndex >= 0) {
              updatedLayoutTransitions.splice(layoutIndex, 1);
              console.log('🗑️ Removed layout transition');
            }
          } else {
            console.log('❌ Could not find transition to delete:', { sourceStateId, transitionIndex });
          }
        } else {
          console.log('❌ Could not parse transition ID:', transitionId);
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
          direction: layoutDirection, // Save current direction
          updatedAt: new Date().toISOString()
        }
      };

      const description = removedEdgeIds.length === 1
        ? `Deleted transition: ${removedEdgeIds[0]}`
        : `Deleted ${removedEdgeIds.length} transitions`;

      onWorkflowUpdate(updatedWorkflow, description);
    }

    // Handle reconnect changes (when user drags edge endpoint to different node)
    if (reconnectChanges.length > 0 && cleanedWorkflow) {
      console.log('🔄 Processing reconnect changes...');
      reconnectChanges.forEach(change => {
        console.log('🔄 Reconnect change details:', {
          id: change.id,
          source: change.source,
          target: change.target,
          sourceHandle: change.sourceHandle,
          targetHandle: change.targetHandle
        });
      });
    }
  }, [defaultOnEdgesChange, cleanedWorkflow, onWorkflowUpdate, saveStateImmediate]);

  // Helper function to calculate default position for transition node
  const calculateTransitionNodePosition = useCallback((
    sourcePos: { x: number; y: number },
    targetPos: { x: number; y: number },
    isLoopback: boolean
  ): { x: number; y: number } => {
    if (isLoopback) {
      // For loopback, position further to the right and up to give more space
      return {
        x: sourcePos.x + 250, // Increased from 200 for more space
        y: sourcePos.y - 80   // Increased from 50 for more space
      };
    } else {
      // For regular transitions, position midway between source and target
      return {
        x: (sourcePos.x + targetPos.x) / 2,
        y: (sourcePos.y + targetPos.y) / 2
      };
    }
  }, []);

  // Helper function to calculate optimal anchor points based on relative positions
  // Logic: Select the nearest logical handles based on state positions
  // - If A is above B: use bottom handle of A, top handle of B
  // - If A is below B: use top handle of A, bottom handle of B
  // - If A is left of B: use right handle of A, left handle of B
  // - If A is right of B: use left handle of A, right handle of B
  const calculateOptimalAnchorPoints = useCallback((
    sourcePos: { x: number; y: number },
    targetPos: { x: number; y: number }
  ): { sourceHandle: string; targetHandle: string } => {
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Determine primary direction based on which delta is larger
    // Vertical if vertical distance >= horizontal distance
    const isVerticalDominant = absDy >= absDx;

    let sourceHandle = 'bottom-center-source';
    let targetHandle = 'top-center-target';

    if (isVerticalDominant) {
      // Vertical connection is dominant
      if (dy > 0) {
        // Target is below source: use bottom of source, top of target
        sourceHandle = 'bottom-center-source';
        targetHandle = 'top-center-target';
      } else {
        // Target is above source: use top of source, bottom of target
        sourceHandle = 'top-center-source';
        targetHandle = 'bottom-center-target';
      }
    } else {
      // Horizontal connection is dominant
      if (dx > 0) {
        // Target is to the right: use right of source, left of target
        sourceHandle = 'right-top-source';
        targetHandle = 'left-top-target';
      } else {
        // Target is to the left: use left of source, right of target
        sourceHandle = 'left-top-source';
        targetHandle = 'right-top-target';
      }
    }

    return { sourceHandle, targetHandle };
  }, []);

  // Update nodes and edges when workflow changes - use workflow ID as dependency to avoid infinite loops
  React.useEffect(() => {
    if (cleanedWorkflow) {
      // Create nodes and edges inside useEffect to avoid dependency issues
      const currentUiStates = uiStatesRef.current;
      const currentOnTransitionEdit = onTransitionEditRef.current;
      const currentHandleTransitionUpdate = handleTransitionUpdateRef.current;
      const currentHandleStateNameChange = handleStateNameChangeRef.current;
      const currentHandleStateSendToChat = handleStateSendToChatRef.current;
      const currentHandleTransitionSendToChat = handleTransitionSendToChatRef.current;

      // Create state nodes
      const stateNodes = currentUiStates.map((state) => ({
        id: state.id,
        type: 'stateNode' as const,
        position: state.position,
        data: {
          label: state.name,
          state: state,
          onNameChange: currentHandleStateNameChange,
          onSendToChat: onSendToChat ? currentHandleStateSendToChat : undefined,
          palette: palette,
        },
      }));

      const currentUiTransitions = uiTransitionsRef.current;

      // Get transition layout map for positions
      const transitionLayoutMap = new Map(cleanedWorkflow.layout.transitions.map(t => [t.id, t]));

      // Create direct edges: state -> state with transition data in edge
      const newEdges: any[] = [];

      currentUiTransitions.forEach((transition) => {
        const isLoopback = transition.sourceStateId === transition.targetStateId;

        // Get source and target state positions
        const sourceState = currentUiStates.find(s => s.id === transition.sourceStateId);
        const targetState = currentUiStates.find(s => s.id === transition.targetStateId);

        if (!sourceState || !targetState) return;

        // Get layout for this transition (may have manual anchor point selections)
        const layout = transitionLayoutMap.get(transition.id);

        // Determine if transition is manual or automated for styling
        const isManual = transition.definition.manual === true;
        const edgeColor = isManual ? palette.colors.transitionManual : palette.colors.transitionAutomated;
        const edgeWidth = 2;

        // Check if this is a bidirectional transition (there's a reverse transition)
        const isBidirectional = hasBidirectionalConnection(
          transition.sourceStateId,
          transition.targetStateId,
          currentUiTransitions
        );

        // Calculate optimal handles based on node positions
        let sourceHandle: string;
        let targetHandle: string;

        // For loopback transitions, use handles from layout (user selected when drawing)
        if (isLoopback) {
          // Use stored handles from layout, or fallback to defaults
          // Default: loopback creates a petal shape using adjacent handles (left to center)
          sourceHandle = layout?.sourceHandle || 'top-left-source';
          targetHandle = layout?.targetHandle || 'top-center-target';

          // console.log('📖 Reading LOOPBACK handles from layout:', {
          //   transitionId: transition.id,
          //   layout,
          //   sourceHandle,
          //   targetHandle,
          // });
        } else if (isBidirectional) {
          // For bidirectional transitions, use the special handles from autoLayout
          // These ensure the two transitions don't overlap
          sourceHandle = layout?.stateToTransitionSourceHandle || '';
          targetHandle = layout?.transitionToStateTargetHandle || '';

          // console.log('📖 Reading bidirectional handles from layout:', {
          //   transitionId: transition.id,
          //   sourceHandle,
          //   targetHandle,
          //   layout
          // });

          if (!sourceHandle || !targetHandle) {
            const anchors = calculateOptimalAnchorPoints(
              sourceState.position,
              targetState.position,
              true // isBidirectional
            );
            sourceHandle = sourceHandle || anchors.sourceHandle;
            targetHandle = targetHandle || anchors.targetHandle;
            // console.log('📖 Using calculated bidirectional anchors:', { sourceHandle, targetHandle });
          }
        } else {
          // For regular (non-bidirectional) transitions, use sourceHandle/targetHandle
          sourceHandle = layout?.sourceHandle || '';
          targetHandle = layout?.targetHandle || '';

          // console.log('📖 Reading regular handles from layout:', {
          //   transitionId: transition.id,
          //   transitionName: transition.definition.name,
          //   layout,
          //   sourceHandle,
          //   targetHandle
          // });

          if (!sourceHandle || !targetHandle) {
            const anchors = calculateOptimalAnchorPoints(
              sourceState.position,
              targetState.position
            );
            sourceHandle = sourceHandle || anchors.sourceHandle;
            targetHandle = targetHandle || anchors.targetHandle;
            // console.log('📖 Using calculated anchors:', { sourceHandle, targetHandle });
          }
        }

        // Determine if this is a "return path" in a bidirectional pair
        // Return path is when source > target alphabetically (to have consistent ordering)
        const isReturnPath = isBidirectional && transition.sourceStateId > transition.targetStateId;

        // Create single edge from source state to target state with transition data
        const edge = {
          id: `edge-${transition.id}`,
          type: isLoopback ? 'loopbackEdge' : 'transitionEdge',
          source: transition.sourceStateId,
          target: transition.targetStateId,
          sourceHandle,
          targetHandle,
          animated: !isManual, // Only animate automated transitions
          reconnectable: true, // Allow reconnecting both ends
          style: {
            stroke: edgeColor,
            strokeWidth: edgeWidth,
            strokeDasharray: isManual ? '8 4' : 'none'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: edgeColor,
          },
          data: {
            transition: transition,
            sourceHandle: sourceHandle,
            targetHandle: targetHandle,
            isBidirectional: isBidirectional,
            isReturnPath: isReturnPath,
            onEdit: currentOnTransitionEdit,
            onUpdate: (updatedTransition: UITransitionData) => {
              // Handle transition update
              console.log('Transition updated:', updatedTransition);
            },
            palette: palette,
            edgeType: edgeType, // Pass edge type to custom edge component
          },
        };
        newEdges.push(edge);
      });

      // Only use state nodes (transitions are now rendered as edges with labels)
      setNodes(stateNodes);
      setEdges(newEdges);
      if (stateNodes.length > 0) {
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
    palette, // Re-create nodes/edges when palette changes
    theme, // Re-create nodes/edges when theme changes
    edgeType, // Re-create edges when edge type changes
  ]);

  // Track when auto-layout is applied to trigger fitView
  const shouldFitViewRef = useRef(false);

  // Auto-center the workflow only when explicitly requested (e.g., after auto-layout)
  React.useEffect(() => {
    if (shouldFitViewRef.current && cleanedWorkflow && nodes.length > 0) {
      // Use a small delay to ensure nodes are rendered before fitting view
      const timer = setTimeout(() => {
        fitView({
          padding: 0.2, // 20% padding around the workflow
          duration: 300, // Smooth animation
          minZoom: 0.05, // Allow zooming out to 5% for very large workflows
          maxZoom: 1.5, // Don't zoom in too much for small workflows
        });
        shouldFitViewRef.current = false; // Reset flag
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [cleanedWorkflow?.layout?.updatedAt, nodes.length, fitView]);

  // Fit view on initial load
  const initialLoadRef = useRef(false);
  React.useEffect(() => {
    if (!initialLoadRef.current && isInitialized && nodes.length > 0) {
      initialLoadRef.current = true;
      // Use a small delay to ensure nodes are rendered before fitting view
      const timer = setTimeout(() => {
        fitView({
          padding: 0.2, // 20% padding around the workflow
          duration: 300, // Smooth animation
          minZoom: 0.05, // Allow zooming out to 5% for very large workflows
          maxZoom: 1.5, // Don't zoom in too much for small workflows
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, nodes.length, fitView]);

  // NOTE: We don't save initial state to undo/redo history anymore
  // This prevents the Undo button from being active when no changes have been made
  // History will start being saved only after the first user action
  const initialStateSavedRef = useRef(false);
  // React.useEffect(() => {
  //   if (isInitialized && nodes.length > 0 && edges.length >= 0 && cleanedWorkflow && !initialStateSavedRef.current) {
  //     const timer = setTimeout(() => {
  //       saveStateImmediate();
  //       initialStateSavedRef.current = true;
  //     }, 200);
  //     return () => clearTimeout(timer);
  //   }
  // }, [isInitialized]); // Only run when initialization completes

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('🔗🔗🔗 onConnect CALLED! 🔗🔗🔗', params);

      if (!cleanedWorkflow || !params.source || !params.target) {
        console.log('❌ Missing cleanedWorkflow or source/target');
        return;
      }

      // Save state before adding connection
      saveStateImmediate();

      // Determine node types
      const sourceIsTransition = params.source.startsWith('transition-');
      const targetIsTransition = params.target.startsWith('transition-');
      const sourceIsState = !sourceIsTransition;
      const targetIsState = !targetIsTransition;

      // Block transition-to-transition connections
      if (sourceIsTransition && targetIsTransition) {
        return;
      }

      // Handle different connection scenarios:

      // 1. State → State: Create new transition (normal case)
      if (sourceIsState && targetIsState) {
        // Continue with normal transition creation logic below
      }

      // 2. State → Transition: User is manually connecting a state to an existing transition
      //    This doesn't make sense in our model, so block it
      else if (sourceIsState && targetIsTransition) {
        return;
      }

      // 3. Transition → State: User is manually connecting a transition to a state
      //    This also doesn't make sense, so block it
      else if (sourceIsTransition && targetIsState) {
        return;
      }

      // At this point, we're only handling State → State connections
      // Validate handle IDs to prevent React Flow errors
      // Source handles should end with -source
      if (params.sourceHandle) {
        if (!params.sourceHandle.endsWith('-source')) {
          // User tried to drag from a target handle, silently ignore
          return;
        }
        // Check that source handle is from a valid position (any of the 10 positions)
        const sourcePosition = params.sourceHandle.replace('-source', '');
        const validPositions = ['top-left', 'top-center', 'top-right', 'left-top', 'left-bottom', 'right-top', 'right-bottom', 'bottom-left', 'bottom-center', 'bottom-right'];
        if (!validPositions.includes(sourcePosition)) {
          // Invalid position, silently ignore
          return;
        }
      }

      // Target handles should end with -target
      if (params.targetHandle) {
        if (!params.targetHandle.endsWith('-target')) {
          // Invalid target handle, silently ignore
          return;
        }
        // Check that target handle is from a valid position (any of the 10 positions)
        const targetPosition = params.targetHandle.replace('-target', '');
        const validPositions = ['top-left', 'top-center', 'top-right', 'left-top', 'left-bottom', 'right-top', 'right-bottom', 'bottom-left', 'bottom-center', 'bottom-right'];
        if (!validPositions.includes(targetPosition)) {
          // Invalid position, silently ignore
          return;
        }
      }

      // Determine if this is a loop-back connection
      const isLoopback = params.source === params.target;
      const connectionType = isLoopback ? 'Loop-back Transition' : 'New Transition';

      console.log('🔗 onConnect called:', {
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        isLoopback,
        connectionType
      });

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

      // Calculate position for the new transition node
      const transitionIndex = sourceState ? sourceState.transitions.length : 0;
      const transitionId = generateTransitionId(params.source, transitionIndex);

      // Get source and target state positions
      const sourceStateLayout = cleanedWorkflow.layout.states.find(s => s.id === params.source);
      const targetStateLayout = cleanedWorkflow.layout.states.find(s => s.id === params.target);

      let transitionNodePosition = { x: 0, y: 0 };
      if (sourceStateLayout && targetStateLayout) {
        transitionNodePosition = calculateTransitionNodePosition(
          sourceStateLayout.position,
          targetStateLayout.position,
          isLoopback
        );
      }

      // Update layout with transition node position
      const updatedLayoutTransitions = [...(cleanedWorkflow.layout.transitions || [])];
      const existingTransitionIndex = updatedLayoutTransitions.findIndex(t => t.id === transitionId);

      const transitionLayout = {
        id: transitionId,
        sourceStateId: params.source,
        targetStateId: params.target,
        position: transitionNodePosition,
        // For loopback, store the actual handles user selected
        // For regular transitions, these are null (handled by edge routing)
        sourceHandle: isLoopback ? params.sourceHandle : null,
        targetHandle: isLoopback ? params.targetHandle : null,
        labelPosition: isLoopback ? { x: 80, y: -80 } : { x: 0, y: 0 }
      };

      console.log('📍 Created transitionLayout:', transitionLayout);

      if (existingTransitionIndex >= 0) {
        updatedLayoutTransitions[existingTransitionIndex] = transitionLayout;
      } else {
        updatedLayoutTransitions.push(transitionLayout);
      }

      console.log('✅ Updated layout transitions:', updatedLayoutTransitions);

      const updatedWorkflow: UIWorkflowData = {
        ...cleanedWorkflow,
        configuration: {
          ...cleanedWorkflow.configuration,
          states: updatedStates
        },
        layout: {
          ...cleanedWorkflow.layout,
          transitions: updatedLayoutTransitions,
          direction: layoutDirection, // Save current direction
          updatedAt: new Date().toISOString()
        }
      };

      const description = isLoopback
        ? `Added loop-back transition to ${params.source}`
        : `Connected ${params.source} to ${params.target}`;

      onWorkflowUpdate(updatedWorkflow, description);
    },
    [cleanedWorkflow, onWorkflowUpdate, saveStateImmediate]
  );

  // Validate connections - only allow State → State connections
  const isValidConnection = useCallback((connection: Connection) => {
    // Only allow State → State connections (creating new transitions)
    // All nodes are states now (transitions are edges)

    // Validate handles
    // Check that source handle ends with -source (silently reject if not)
    if (connection.sourceHandle) {
      if (!connection.sourceHandle.endsWith('-source')) {
        // User is trying to drag from a target handle, silently reject
        return false;
      }
      // Allow all 10 positions for source handles
      const sourcePosition = connection.sourceHandle.replace('-source', '');
      const validPositions = ['top-left', 'top-center', 'top-right', 'left-top', 'left-bottom', 'right-top', 'right-bottom', 'bottom-left', 'bottom-center', 'bottom-right'];
      if (!validPositions.includes(sourcePosition)) {
        return false;
      }
    }

    // Check that target handle ends with -target
    if (connection.targetHandle) {
      if (!connection.targetHandle.endsWith('-target')) {
        // Invalid target handle, silently reject
        return false;
      }
      // Allow all 10 positions for target handles
      const targetPosition = connection.targetHandle.replace('-target', '');
      const validPositions = ['top-left', 'top-center', 'top-right', 'left-top', 'left-bottom', 'right-top', 'right-bottom', 'bottom-left', 'bottom-center', 'bottom-right'];
      if (!validPositions.includes(targetPosition)) {
        return false;
      }
    }

    return true;
  }, []);

  const onReconnect: OnReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      console.log('🔄🔄🔄 onReconnect CALLED! 🔄🔄🔄');

      if (!cleanedWorkflow) {
        console.log('❌ No cleanedWorkflow');
        return;
      }

      // Save state before reconnecting
      saveStateImmediate();

      // Extract transition ID from edge (format: edge-{transitionId})
      const transitionId = oldEdge.id.replace('edge-', '');

      // Parse to get source state and transition index
      const parsed = parseTransitionId(transitionId);
      if (!parsed) {
        console.log('❌ Could not parse transition ID:', transitionId);
        return;
      }

      const { sourceStateId: oldSourceStateId, transitionIndex } = parsed;

      // Check if source or target changed
      const sourceChanged = oldEdge.source !== newConnection.source;
      const targetChanged = oldEdge.target !== newConnection.target;

      console.log('🔄 onReconnect called:', {
        transitionId,
        oldEdge: { source: oldEdge.source, target: oldEdge.target, sourceHandle: oldEdge.sourceHandle, targetHandle: oldEdge.targetHandle },
        newConnection: { source: newConnection.source, target: newConnection.target, sourceHandle: newConnection.sourceHandle, targetHandle: newConnection.targetHandle },
        sourceChanged,
        targetChanged,
        parsed
      });

      const updatedStates = { ...cleanedWorkflow.configuration.states };
      const oldSourceState = updatedStates[oldSourceStateId];

      if (!oldSourceState || !oldSourceState.transitions[transitionIndex]) return;

      const transitionDef = oldSourceState.transitions[transitionIndex];

      if (sourceChanged) {
        // Moving transition to a different source state
        const newSourceStateId = newConnection.source!;

        // Remove from old source state
        updatedStates[oldSourceStateId] = {
          ...oldSourceState,
          transitions: oldSourceState.transitions.filter((_, idx) => idx !== transitionIndex)
        };

        // Add to new source state
        const newSourceState = updatedStates[newSourceStateId];
        if (newSourceState) {
          updatedStates[newSourceStateId] = {
            ...newSourceState,
            transitions: [...newSourceState.transitions, {
              ...transitionDef,
              next: newConnection.target! // Update target as well if changed
            }]
          };
        }
      } else if (targetChanged) {
        // Only changing target state
        const newTargetStateId = newConnection.target!;
        const updatedTransitions = [...oldSourceState.transitions];
        updatedTransitions[transitionIndex] = {
          ...updatedTransitions[transitionIndex],
          next: newTargetStateId
        };

        updatedStates[oldSourceStateId] = {
          ...oldSourceState,
          transitions: updatedTransitions
        };
      }

      // Save the anchor point selection
      const updatedLayoutTransitions = [...(cleanedWorkflow.layout.transitions || [])];
      const existingTransitionIndex = updatedLayoutTransitions.findIndex(t => t.id === transitionId);

      let transitionLayout = existingTransitionIndex >= 0
        ? { ...updatedLayoutTransitions[existingTransitionIndex] }
        : { id: transitionId };

      console.log('📍 Before saving handles:', {
        transitionLayout,
        newConnection: { sourceHandle: newConnection.sourceHandle, targetHandle: newConnection.targetHandle }
      });

      // Save handles if changed
      // Note: newConnection.sourceHandle is the handle on the SOURCE STATE
      // newConnection.targetHandle is the handle on the TARGET STATE
      if (newConnection.sourceHandle) {
        console.log('💾 Saving sourceHandle:', newConnection.sourceHandle);
        transitionLayout.sourceHandle = newConnection.sourceHandle;
      }
      if (newConnection.targetHandle) {
        console.log('💾 Saving targetHandle:', newConnection.targetHandle);
        transitionLayout.targetHandle = newConnection.targetHandle;
      }

      console.log('📍 After saving handles:', transitionLayout);

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
          direction: layoutDirection, // Save current direction
          updatedAt: new Date().toISOString()
        }
      };

      console.log('✅ Updated workflow transitions:', updatedLayoutTransitions);

      const message = sourceChanged
        ? `Reconnected transition source to ${newConnection.source}`
        : `Reconnected transition target to ${newConnection.target}`;
      onWorkflowUpdate(updatedWorkflow, message);
    },
    [cleanedWorkflow, onWorkflowUpdate, saveStateImmediate]
  );

  // Save state before drag starts
  const onNodeDragStart = useCallback(
    (_event: React.MouseEvent, _node: Node) => {
      // Save current state before any changes
      saveStateImmediate();
    },
    [saveStateImmediate]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!cleanedWorkflow) return;

      // Check if this is a transition node or state node
      if (node.id.startsWith('transition-')) {
        // Extract transition ID from node ID
        const transitionId = node.id.replace('transition-', '');

        // Update transition position in layout
        const updatedLayoutTransitions = cleanedWorkflow.layout.transitions.map((transition) =>
          transition.id === transitionId
            ? { ...transition, position: node.position }
            : transition
        );

        // If transition doesn't exist in layout, add it
        if (!updatedLayoutTransitions.find(t => t.id === transitionId)) {
          // Parse transition ID to get source state and find target state
          const parsed = parseTransitionId(transitionId);
          if (parsed && cleanedWorkflow.configuration.states[parsed.sourceStateId]) {
            const sourceState = cleanedWorkflow.configuration.states[parsed.sourceStateId];
            const transitionDef = sourceState.transitions[parsed.transitionIndex];

            updatedLayoutTransitions.push({
              id: transitionId,
              sourceStateId: parsed.sourceStateId,
              targetStateId: transitionDef?.next || '',
              position: node.position,
            });
          }
        }

        const updatedWorkflow: UIWorkflowData = {
          ...cleanedWorkflow,
          layout: {
            ...cleanedWorkflow.layout,
            transitions: updatedLayoutTransitions,
            direction: layoutDirection, // Save current direction
            manuallyPositioned: true, // User manually moved a transition node
            updatedAt: new Date().toISOString()
          }
        };

        onWorkflowUpdate(updatedWorkflow, `Moved transition label: ${transitionId}`);
      } else {
        // State node - update state position in layout
        const updatedLayoutStates = cleanedWorkflow.layout.states.map((state) =>
          state.id === node.id
            ? { ...state, position: node.position }
            : state
        );

        let updatedWorkflow: UIWorkflowData = {
          ...cleanedWorkflow,
          layout: {
            ...cleanedWorkflow.layout,
            states: updatedLayoutStates,
            direction: layoutDirection, // Save current direction
            manuallyPositioned: true, // User manually moved a state node
            updatedAt: new Date().toISOString()
          }
        };

        // Recalculate handles for transitions connected to the moved state
        updatedWorkflow = recalculateHandlesForMovedState(updatedWorkflow, node.id);

        onWorkflowUpdate(updatedWorkflow, `Moved state: ${node.id}`);
      }
    },
    [cleanedWorkflow, onWorkflowUpdate]
  );

  // Auto-layout handler with smooth animations
  const handleAutoLayout = useCallback(() => {
    if (!cleanedWorkflow || !canAutoLayout(cleanedWorkflow)) return;

    let layoutedWorkflow = autoLayoutWorkflow(cleanedWorkflow, { direction: layoutDirection });

    // Reset manuallyPositioned flag since we're applying auto-layout
    // This allows future global direction changes to affect this workflow
    layoutedWorkflow = {
      ...layoutedWorkflow,
      layout: {
        ...layoutedWorkflow.layout,
        manuallyPositioned: false,
      }
    };

    // Set flag to trigger fitView after layout is applied
    shouldFitViewRef.current = true;

    // Apply the layout with animation by updating the workflow
    // React Flow will automatically animate the position changes
    onWorkflowUpdate(layoutedWorkflow, 'Applied auto-layout');
  }, [cleanedWorkflow, onWorkflowUpdate, layoutDirection]);

  // Auto-apply layout when direction changes, but only for non-manually-positioned workflows
  const previousLayoutDirectionRef = useRef(layoutDirection);
  React.useEffect(() => {
    // Only auto-apply if:
    // 1. Direction actually changed (not on initial mount)
    // 2. Workflow exists and can be auto-laid out
    // 3. Workflow has NOT been manually positioned by user
    if (previousLayoutDirectionRef.current !== layoutDirection &&
        cleanedWorkflow &&
        canAutoLayout(cleanedWorkflow) &&
        !cleanedWorkflow.layout.manuallyPositioned) {

      let layoutedWorkflow = autoLayoutWorkflow(cleanedWorkflow, { direction: layoutDirection });

      // Keep manuallyPositioned as false since this is automatic layout
      layoutedWorkflow = {
        ...layoutedWorkflow,
        layout: {
          ...layoutedWorkflow.layout,
          manuallyPositioned: false,
        }
      };

      // Set flag to trigger fitView after layout is applied
      shouldFitViewRef.current = true;

      onWorkflowUpdate(layoutedWorkflow, `Changed layout direction to ${layoutDirection === 'TB' ? 'Top to Bottom' : 'Left to Right'}`);
    }
    previousLayoutDirectionRef.current = layoutDirection;
  }, [layoutDirection, cleanedWorkflow, onWorkflowUpdate]);

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

  // Settings toggle handler
  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  // Handle node click to navigate in JSON editor
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    // Only state nodes now (transitions are edges)
    setSelectedStateId(node.id);
    setSelectedTransitionId(null);
  }, []);

  // Handle edge click to navigate in JSON editor
  const handleEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    // Extract transition ID from edge (format: edge-{transitionId})
    const transitionId = edge.id.replace('edge-', '');
    setSelectedTransitionId(transitionId);
    setSelectedStateId(null);
  }, []);



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
        const parsed = JSON.parse(text);

        let config: WorkflowConfiguration;

        // Check if this is a wrapper format (has workflows array)
        if (parsed.workflows && Array.isArray(parsed.workflows)) {
          // Extract the first workflow from the array
          if (parsed.workflows.length === 0) {
            alert('Invalid workflow JSON: workflows array is empty');
            return;
          }

          config = parsed.workflows[0] as WorkflowConfiguration;

          // Show notification if there are multiple workflows
          if (parsed.workflows.length > 1) {
            showWarning(
              'Multiple Workflows Found',
              `This file contains ${parsed.workflows.length} workflows. Only the first workflow will be displayed in the canvas.`
            );
          }
        } else {
          // Individual workflow format
          config = parsed as WorkflowConfiguration;
        }

        // Validate required fields (version is optional)
        if (!config.name || typeof config.name !== 'string' || config.name.trim() === '' || !config.initialState || typeof config.initialState !== 'string' || config.initialState.trim() === '' || !config.states) {
          alert('Invalid workflow JSON: missing required fields (name, initialState, states)');
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
            x: 100 + (index % 3) * 210,
            y: 100 + Math.floor(index / 3) * 160
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
        shouldFitViewRef.current = true; // Trigger fitView after import
        onWorkflowUpdate(layoutedWorkflow, 'Imported workflow from JSON');
      } catch (error) {
        alert(`Error importing workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    input.click();
  }, [cleanedWorkflow, onWorkflowUpdate, showWarning]);

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

      // Use privateClient to benefit from refresh token interceptor
      const response = await privateClient({
        method: 'post',
        url: url,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      });


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

          // Use privateClient to benefit from refresh token interceptor
          const exportResponse = await privateClient({
            method: 'get',
            url: exportUrl,
          });


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

          // Validate required fields (version is optional)
          if (!config.name || !config.initialState || !config.states) {
            showError(
              'Invalid Workflow Data',
              'The workflow data from environment is missing required fields (name, initialState, states)'
            );
            return;
          }

          // Create layout states for all states in the configuration
          const stateIds = Object.keys(config.states);
          const layoutStates = stateIds.map((stateId, index) => ({
            id: stateId,
            position: {
              x: 100 + (index % 3) * 210,
              y: 100 + Math.floor(index / 3) * 160
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
          shouldFitViewRef.current = true; // Trigger fitView after import
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
          direction: layoutDirection, // Save current direction
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

  // Handle opening/closing fullscreen (dedicated page)
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're currently in fullscreen mode (on /workflows page)
  // Use external fullscreen state if provided, otherwise use navigation-based detection
  const isInFullscreenMode = externalIsFullscreen !== undefined ? externalIsFullscreen : location.pathname === '/workflows';

  const handleToggleFullscreen = useCallback(() => {
    // If external handler is provided, use it (local state-based fullscreen)
    if (externalOnToggleFullscreen) {
      externalOnToggleFullscreen();
      return;
    }

    // Otherwise, use navigation-based fullscreen (legacy behavior)
    if (!modelName || !modelVersion) {
      showWarning(
        'Cannot Open Fullscreen',
        'Model name and version are required to open in fullscreen mode'
      );
      return;
    }

    if (isInFullscreenMode) {
      // Exit fullscreen - check for returnUrl in query params first
      const searchParams = new URLSearchParams(location.search);
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        navigate(returnUrl);
      } else if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/?canvas=true');
      }
    } else {
      // Enter fullscreen - navigate to workflows page with query parameters
      // Include current URL as returnUrl so we can come back to the chat
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/workflows?model=${encodeURIComponent(modelName)}&version=${encodeURIComponent(modelVersion)}&returnUrl=${returnUrl}`);
    }
  }, [modelName, modelVersion, navigate, showWarning, isInFullscreenMode, location.pathname, location.search, externalOnToggleFullscreen]);

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
    <div className="h-full w-full flex" style={{ background: '#0b0f1a' }}>
      {/* Canvas Area */}
      <div className="flex-1 h-full" style={{ background: '#0b0f1a' }}>
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        isValidConnection={isValidConnection}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={onPaneClick}

        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        className="dark"
        colorMode="dark"

        // Disable default double-click zoom behavior
        zoomOnDoubleClick={false}

        // Enhanced zoom settings for very large workflows
        minZoom={0.05}  // Allow zooming out to 5% to see very large workflows
        maxZoom={4}     // Allow zooming in to 400% for detail work
        defaultViewport={{ zoom: 1, x: 0, y: 0 }}

        // Optimize rendering
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        edgesReconnectable={true}

        // Smooth animations
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 2 },
          type: edgeType
        }}
      >
        <Background />
        <Controls showZoom={false} showInteractive={false} showFitView={false}>
          {onBack && (
            <ControlButton
              onClick={onBack}
              title="Back to workflows list"
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 border-2"
              style={{
                borderColor: '#6b7280'
              }}
              data-testid="back-button"
            >
              <ArrowLeft size={16} className="text-white" />
            </ControlButton>
          )}

          {/* Undo/Redo buttons */}
          <ControlButton
            onClick={canUndo ? undo : undefined}
            title={`Undo (${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd' : 'Ctrl'}+Z)`}
            data-testid="undo-button"
            style={{
              opacity: canUndo ? 1 : 0.4,
              cursor: canUndo ? 'pointer' : 'not-allowed',
            }}
          >
            <Undo2 size={16} strokeWidth={2} />
          </ControlButton>

          <ControlButton
            onClick={canRedo ? redo : undefined}
            title={`Redo (${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd+Shift+Z' : 'Ctrl+Y'})`}
            data-testid="redo-button"
            style={{
              opacity: canRedo ? 1 : 0.4,
              cursor: canRedo ? 'pointer' : 'not-allowed',
            }}
          >
            <Redo2 size={16} strokeWidth={2} />
          </ControlButton>

          {/* Fit View button */}
          <ControlButton
            onClick={() => fitView({ padding: 0.2, duration: 300 })}
            title="Fit view"
            data-testid="fit-view-button"
          >
            <Scan size={16} strokeWidth={2} />
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
            onClick={handleToggleWorkflowInfo}
            title="Toggle workflow info"
            className={showWorkflowInfo ? 'border-2' : ''}
            style={showWorkflowInfo ? {
              background: `linear-gradient(to bottom right, ${palette.ui.panelGradientVia}, ${palette.ui.panelGradientTo})`,
              borderColor: palette.ui.accentColor
            } : {}}
            data-testid="workflow-info-button"
          >
            <Info size={16} />
          </ControlButton>
          <ControlButton
            onClick={handleToggleJsonEditor}
            title="Edit workflow JSON"
            className={showJsonEditor ? 'border-2' : ''}
            style={showJsonEditor ? {
              background: `linear-gradient(to bottom right, ${palette.ui.panelGradientVia}, ${palette.ui.panelGradientTo})`,
              borderColor: palette.ui.accentColor
            } : {}}
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
            onClick={handleToggleSettings}
            title="Canvas Settings"
            className={showSettings ? 'border-2' : ''}
            style={showSettings ? {
              background: `linear-gradient(to bottom right, ${palette.ui.panelGradientVia}, ${palette.ui.panelGradientTo})`,
              borderColor: palette.ui.accentColor
            } : {}}
            data-testid="settings-button"
          >
            <Settings size={16} />
          </ControlButton>
          <ControlButton
            onClick={handleToggleQuickHelp}
            title="Toggle Quick Help"
            className={showQuickHelp ? 'border-2' : ''}
            style={showQuickHelp ? {
              background: `linear-gradient(to bottom right, ${palette.ui.panelGradientVia}, ${palette.ui.panelGradientTo})`,
              borderColor: palette.ui.accentColor
            } : {}}
            data-testid="quick-help-button"
          >
            <Lightbulb size={16} />
          </ControlButton>
          {/* Only show fullscreen button if model name and version are available */}
          {modelName && modelVersion && (
            <ControlButton
              onClick={handleToggleFullscreen}
              title={isInFullscreenMode ? "Exit fullscreen" : "Open in fullscreen"}
              className={isInFullscreenMode ? 'border-2' : ''}
              style={isInFullscreenMode ? {
                background: `linear-gradient(to bottom right, ${palette.ui.panelGradientVia}, ${palette.ui.panelGradientTo})`,
                borderColor: palette.ui.accentColor
              } : {}}
              data-testid="fullscreen-button"
            >
              {isInFullscreenMode ? (
                <Minimize2 size={16} />
              ) : (
                <Maximize2 size={16} />
              )}
            </ControlButton>
          )}
        </Controls>

        <MiniMap
          nodeColor={(node) => {
            // Check if it's a state node or transition node
            const state = node.data?.state as UIStateData;
            const transition = node.data?.transition;

            if (state) {
              // State node colors from palette
              if (state.isInitial) return palette.colors.stateInitial;
              if (state.isFinal) return palette.colors.stateFinal;
              return palette.colors.stateNormal;
            } else if (transition) {
              // Transition node colors from palette
              const isManual = transition.definition?.manual === true;
              return isManual ? palette.colors.transitionManual : palette.colors.transitionAutomated;
            }

            // Fallback
            return palette.colors.stateNormal;
          }}
          className="dark"
          style={{
            width: 150,
            height: 120,
            backgroundColor: palette.ui.panelGradientFrom,
            borderColor: palette.ui.panelBorder
          }}
        />

        {showWorkflowInfo && (
          <Panel
            position="top-left"
            className="p-4 rounded-2xl shadow-2xl border-2 backdrop-blur-md"
            style={{
              background: `linear-gradient(to bottom right, ${palette.ui.panelGradientFrom}, ${palette.ui.panelGradientVia}, ${palette.ui.panelGradientTo})`,
              borderColor: palette.ui.panelBorder
            }}
          >
            <div className="text-sm">
              <h4
                className="font-semibold text-transparent bg-clip-text mb-3 text-base"
                style={{
                  backgroundImage: `linear-gradient(to right, ${palette.ui.panelTitleFrom}, ${palette.ui.panelTitleTo})`
                }}
              >
                {workflow.configuration.name}
              </h4>
              <div className="text-gray-300 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.colors.stateNormal }}></span>
                  <span>{Object.keys(workflow.configuration.states).length} states</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.colors.transitionManual }}></span>
                  <span>{uiTransitions.length} transitions</span>
                </div>
                <div
                  className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-2 border-t"
                  style={{ borderColor: palette.ui.panelBorder }}
                >
                  <span>Updated: {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                  <button
                    onClick={handleToggleWorkflowInfo}
                    className="p-1 rounded-lg transition-colors group"
                    style={{
                      ['--hover-bg' as any]: palette.ui.accentHover + '30'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = palette.ui.accentHover + '30'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Close workflow info"
                  >
                    <X
                      size={14}
                      className="text-gray-500 dark:text-gray-400 transition-colors"
                      style={{
                        ['--hover-color' as any]: palette.ui.accentColor
                      }}
                      onMouseEnter={(e) => (e.currentTarget as SVGElement).style.color = palette.ui.accentColor}
                      onMouseLeave={(e) => (e.currentTarget as SVGElement).style.color = ''}
                    />
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        )}

        {showSettings && (
          <Panel
            position="top-right"
            className="rounded-2xl shadow-2xl border-2 backdrop-blur-md w-80"
            style={{
              background: `linear-gradient(to bottom right, ${palette.ui.panelGradientFrom}, ${palette.ui.panelGradientVia}, ${palette.ui.panelGradientTo})`,
              borderColor: palette.ui.panelBorder
            }}
            data-testid="settings-panel"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3
                  style={{
                    margin: 0,
                    color: '#A78BFA',
                    fontSize: '16px',
                    fontWeight: 500
                  }}
                >
                  ⚙️ Canvas Settings
                </h3>
                <button
                  onClick={handleToggleSettings}
                  className="p-1 rounded-lg transition-colors group"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = palette.ui.accentHover + '30'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Close settings"
                >
                  <X
                    size={14}
                    className="text-gray-500 dark:text-gray-400 transition-colors"
                    onMouseEnter={(e) => (e.currentTarget as SVGElement).style.color = palette.ui.accentColor}
                    onMouseLeave={(e) => (e.currentTarget as SVGElement).style.color = ''}
                  />
                </button>
              </div>

              {/* Edge Type Setting */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">Edge Type</label>
                <select
                  value={edgeType}
                  onChange={(e) => setEdgeType(e.target.value as any)}
                  className="w-full px-3 py-2 pr-10 bg-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 appearance-none"
                  style={{
                    borderColor: palette.ui.panelBorder,
                    borderWidth: '1px',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23e5e7eb' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    paddingRight: '32px',
                    accentColor: palette.ui.accentColor
                  }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${palette.ui.accentColor}40`}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <option value="default">Bezier (Default)</option>
                  <option value="straight">Straight</option>
                  <option value="step">Step</option>
                  <option value="smoothstep">Smooth Step</option>
                </select>
                <p className="text-xs text-gray-400">Changes the style of connection lines between nodes</p>
              </div>

              {/* Layout Direction Setting */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">Auto-Layout Direction</label>
                <select
                  value={layoutDirection}
                  onChange={(e) => setLayoutDirection(e.target.value as any)}
                  className="w-full px-3 py-2 pr-10 bg-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 appearance-none"
                  style={{
                    borderColor: palette.ui.panelBorder,
                    borderWidth: '1px',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23e5e7eb' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    paddingRight: '32px',
                    accentColor: palette.ui.accentColor
                  }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${palette.ui.accentColor}40`}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <option value="TB">Top to Bottom</option>
                  <option value="LR">Left to Right</option>
                </select>
                <p className="text-xs text-gray-400">Direction for auto-layout algorithm</p>
              </div>

              {/* Color Theme Setting */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">Color Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="w-full px-3 py-2 pr-10 bg-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 appearance-none"
                  style={{
                    borderColor: palette.ui.panelBorder,
                    borderWidth: '1px',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23e5e7eb' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    paddingRight: '32px',
                    accentColor: palette.ui.accentColor
                  }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${palette.ui.accentColor}40`}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  {getAvailableThemes().map((themeName) => (
                    <option key={themeName} value={themeName}>
                      {COLOR_PALETTES[themeName].name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400">{COLOR_PALETTES[theme].description}</p>
              </div>

              {/* Workflow Stats */}
              <div className="pt-3 border-t space-y-2" style={{ borderColor: palette.ui.panelBorder }}>
                <div className="text-xs font-medium text-gray-300 uppercase tracking-wider">Workflow Stats</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div
                    className="bg-gray-800/50 rounded-lg p-2 border"
                    style={{ borderColor: palette.ui.panelBorder + '30' }}
                  >
                    <div className="text-gray-400">States</div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: palette.colors.stateNormal }}
                    >
                      {cleanedWorkflow ? Object.keys(cleanedWorkflow.configuration.states).length : 0}
                    </div>
                  </div>
                  <div
                    className="bg-gray-800/50 rounded-lg p-2 border"
                    style={{ borderColor: palette.ui.panelBorder + '30' }}
                  >
                    <div className="text-gray-400">Transitions</div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: palette.colors.transitionManual }}
                    >
                      {uiTransitions.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        )}

        {showQuickHelp && (
          <Panel
            position="top-right"
            className="rounded-2xl shadow-2xl border-2 backdrop-blur-md w-72 max-h-[50vh] overflow-hidden"
            style={{
              background: `linear-gradient(to bottom right, ${palette.ui.panelGradientFrom}, ${palette.ui.panelGradientVia}, ${palette.ui.panelGradientTo})`,
              borderColor: palette.ui.panelBorder
            }}
            data-testid="quick-help-panel"
          >
            <div
              className="p-4 pr-3 overflow-y-auto max-h-[50vh] text-xs text-gray-300 space-y-6"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${palette.ui.accentColor} transparent`,
              } as React.CSSProperties}
            >
              <style>{`
                [data-testid="quick-help-panel"] > div::-webkit-scrollbar {
                  width: 6px;
                }
                [data-testid="quick-help-panel"] > div::-webkit-scrollbar-track {
                  background: transparent;
                }
                [data-testid="quick-help-panel"] > div::-webkit-scrollbar-thumb {
                  background: ${palette.ui.accentColor}60 !important;
                  border-radius: 3px;
                }
                [data-testid="quick-help-panel"] > div::-webkit-scrollbar-thumb:hover {
                  background: ${palette.ui.accentColor}cc !important;
                }
              `}</style>
              <div
                style={{
                  color: '#A78BFA',
                  fontSize: '16px',
                  fontWeight: 500,
                  marginBottom: '16px'
                }}
              >
                ✨ Quick Help
              </div>

              {/* Canvas Interactions */}
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase text-gray-400 opacity-60 tracking-wide">Canvas Interactions</div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-lime-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Double-click canvas</span> Add new state</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-pink-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Drag states</span> Rearrange layout</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-lime-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Drag from handles</span> Connect states</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-pink-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Click state/transition</span> Jump to JSON</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-lime-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Double-click transition</span> Open editor</span>
                </div>
              </div>

              {/* Toolbar Buttons */}
              <div className="space-y-3 pt-4 border-t border-pink-200 dark:border-pink-800">
                <div className="text-xs font-semibold uppercase text-gray-400 opacity-60 tracking-wide">Toolbar Buttons</div>

                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-pink-500 mt-0.5 flex-shrink-0">↶</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Undo</span> Revert last change</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-lime-500 mt-0.5 flex-shrink-0">↷</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Redo</span> Restore undone change</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">⊡</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Fit View</span> Center and fit workflow</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-yellow-500 mt-0.5 flex-shrink-0">⚡</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Auto-arrange</span> Layout states hierarchically</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">ℹ️</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Info</span> Workflow information panel</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-lime-500 mt-0.5 flex-shrink-0">{'{}'}</span>
                  <span className="text-gray-300"><span className="text-white font-bold">JSON Editor</span> Edit workflow as JSON</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-pink-500 mt-0.5 flex-shrink-0">↓</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Download</span> Export to JSON file</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-lime-500 mt-0.5 flex-shrink-0">↑</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Upload</span> Import from JSON file</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-purple-500 mt-0.5 flex-shrink-0">⚙️</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Settings</span> Canvas preferences</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-yellow-500 mt-0.5 flex-shrink-0">💡</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Quick Help</span> Toggle this panel</span>
                </div>
                {modelName && modelVersion && (
                  <div className="flex items-start space-x-3 py-0.5">
                    <span className="text-purple-500 mt-0.5 flex-shrink-0">{isInFullscreenMode ? '⤓' : '⤢'}</span>
                    <span className="text-gray-300"><span className="text-white font-bold">Fullscreen</span> {isInFullscreenMode ? 'Exit fullscreen' : 'Enter fullscreen'}</span>
                  </div>
                )}
              </div>

              {/* Keyboard Shortcuts */}
              <div className="space-y-3 pt-4 border-t border-pink-200 dark:border-pink-800">
                <div className="text-xs font-semibold uppercase text-gray-400 opacity-60 tracking-wide">Keyboard Shortcuts</div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-pink-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300"><span className="text-white font-bold">{navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd' : 'Ctrl'} + Z</span> Undo last change</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-lime-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300"><span className="text-white font-bold">{navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd + Shift + Z' : 'Ctrl + Y'}</span> Redo change</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-pink-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Delete / Backspace</span> Delete selected item</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-lime-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300"><span className="text-white font-bold">Mouse Wheel</span> Zoom in/out</span>
                </div>
              </div>

              {/* Tips */}
              <div className="space-y-3 pt-4 border-t border-pink-200 dark:border-pink-800">
                <div className="text-xs font-semibold uppercase text-gray-400 opacity-60 tracking-wide">Tips</div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-lime-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300">Use JSON editor for bulk changes</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-pink-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300">Auto-arrange after pasting JSON</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-lime-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300">Right-click tabs to edit name/version</span>
                </div>
                <div className="flex items-start space-x-3 py-0.5">
                  <span className="text-pink-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300">All 8 handles on states are usable</span>
                </div>
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
          onUpdate={handleConfigurationUpdate}
          selectedStateId={selectedStateId}
          selectedTransitionId={selectedTransitionId}
          technicalId={technicalId}
          onSendToChat={onSendToChat}
          palette={palette}
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
