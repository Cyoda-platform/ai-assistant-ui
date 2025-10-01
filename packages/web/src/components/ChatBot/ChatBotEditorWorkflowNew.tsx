import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from '../WorkflowCanvas/Canvas/WorkflowCanvas';
import { TransitionEditor } from '../WorkflowCanvas/Editors/TransitionEditor';
import { historyService } from '../WorkflowCanvas/services/historyService';
import { useKeyboardShortcuts } from '../WorkflowCanvas/hooks/useKeyboardShortcuts';
import type {
  UIWorkflowData,
  WorkflowConfiguration,
  CanvasLayout,
  TransitionDefinition,
  EntityModelIdentifier
} from '../WorkflowCanvas/types/workflow';
import { parseTransitionId, getTransitionDefinition } from '../WorkflowCanvas/utils/transitionUtils';
import { Spin } from 'antd';
import HelperStorage from '@/helpers/HelperStorage';

interface ChatBotEditorWorkflowNewProps {
  technicalId: string;
  onAnswer?: (data: { answer: string; file?: File }) => void;
  onUpdate?: (data: { canvasData: string; workflowMetaData: any }) => void;
}

// Helper function to combine configuration and layout into UI workflow data
function combineWorkflowData(
  workflowId: string,
  entityModel: EntityModelIdentifier,
  config: WorkflowConfiguration,
  layout: CanvasLayout
): UIWorkflowData {
  return {
    id: workflowId,
    entityModel: entityModel,
    configuration: config,
    layout: layout,
    createdAt: new Date().toISOString(),
    updatedAt: layout.updatedAt
  };
}

// Helper to parse workflow JSON from storage
function parseWorkflowFromStorage(canvasData: string): { config: WorkflowConfiguration; layout: CanvasLayout } | null {
  try {
    const data = JSON.parse(canvasData);

    // Extract configuration
    const config: WorkflowConfiguration = {
      version: data.version || '1.0',
      name: data.name || 'Workflow',
      description: data.desc || data.description,
      initialState: data.initialState || data.initial_state || '',
      active: data.active !== false,
      states: data.states || {}
    };

    // Extract or create layout
    const layout: CanvasLayout = data.layout || {
      states: Object.keys(config.states).map((stateId, index) => ({
        id: stateId,
        position: { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 }
      })),
      transitions: [],
      updatedAt: new Date().toISOString()
    };

    return { config, layout };
  } catch (error) {
    console.error('Error parsing workflow:', error);
    return null;
  }
}

// Helper to convert UIWorkflowData back to storage format
function convertToStorageFormat(workflow: UIWorkflowData): string {
  const data = {
    version: workflow.configuration.version,
    name: workflow.configuration.name,
    desc: workflow.configuration.description,
    initialState: workflow.configuration.initialState,
    initial_state: workflow.configuration.initialState, // Legacy support
    active: workflow.configuration.active,
    states: workflow.configuration.states,
    layout: workflow.layout
  };
  return JSON.stringify(data, null, 2);
}

const ChatBotEditorWorkflowNew: React.FC<ChatBotEditorWorkflowNewProps> = ({
  technicalId,
  onAnswer,
  onUpdate
}) => {
  const helperStorage = useMemo(() => new HelperStorage(), []);
  const workflowCanvasDataKey = `workflow_canvas_data_${technicalId}`;
  const workflowMetaDataKey = `workflow_metadata_${technicalId}`;

  const [currentWorkflow, setCurrentWorkflow] = useState<UIWorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  // Transition editor state
  const [editingTransitionId, setEditingTransitionId] = useState<string | null>(null);
  const [editingTransitionDefinition, setEditingTransitionDefinition] = useState<TransitionDefinition | null>(null);
  const [transitionEditorOpen, setTransitionEditorOpen] = useState(false);

  // Update history state
  const updateHistoryState = useCallback(() => {
    if (technicalId) {
      setCanUndo(historyService.canUndo(technicalId));
      setCanRedo(historyService.canRedo(technicalId));
      setUndoCount(historyService.getUndoCount(technicalId));
      setRedoCount(historyService.getRedoCount(technicalId));
    } else {
      setCanUndo(false);
      setCanRedo(false);
      setUndoCount(0);
      setRedoCount(0);
    }
  }, [technicalId]);

  // Load workflow from storage on mount
  useEffect(() => {
    const loadWorkflow = () => {
      setLoading(true);
      try {
        const storedCanvasData = helperStorage.get(workflowCanvasDataKey, null);

        if (storedCanvasData) {
          const canvasStr = typeof storedCanvasData === 'string'
            ? storedCanvasData
            : JSON.stringify(storedCanvasData, null, 2);

          const parsed = parseWorkflowFromStorage(canvasStr);

          if (parsed) {
            const entityModel: EntityModelIdentifier = {
              modelName: technicalId,
              modelVersion: 1
            };

            const workflow = combineWorkflowData(
              technicalId,
              entityModel,
              parsed.config,
              parsed.layout
            );

            setCurrentWorkflow(workflow);
          }
        } else {
          // Create empty workflow
          const entityModel: EntityModelIdentifier = {
            modelName: technicalId,
            modelVersion: 1
          };

          const emptyConfig: WorkflowConfiguration = {
            version: '1.0',
            name: 'New Workflow',
            description: '',
            initialState: '',
            active: true,
            states: {}
          };

          const emptyLayout: CanvasLayout = {
            states: [],
            transitions: [],
            updatedAt: new Date().toISOString()
          };

          const workflow = combineWorkflowData(
            technicalId,
            entityModel,
            emptyConfig,
            emptyLayout
          );

          setCurrentWorkflow(workflow);
        }
      } catch (error) {
        console.error('Error loading workflow:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflow();
    updateHistoryState();
  }, [technicalId, helperStorage, workflowCanvasDataKey, updateHistoryState]);

  // Handle workflow updates
  const handleWorkflowUpdate = useCallback(async (
    workflow: UIWorkflowData,
    description: string = 'Workflow updated',
    trackHistory: boolean = true
  ) => {
    // Track history before updating
    if (trackHistory && currentWorkflow && technicalId) {
      historyService.addEntry(technicalId, currentWorkflow, description);
    }

    setCurrentWorkflow(workflow);
    updateHistoryState();

    // Save to storage
    const storageFormat = convertToStorageFormat(workflow);
    helperStorage.set(workflowCanvasDataKey, storageFormat);

    // Notify parent component
    if (onUpdate) {
      onUpdate({
        canvasData: storageFormat,
        workflowMetaData: {
          name: workflow.configuration.name,
          version: workflow.configuration.version,
          updatedAt: workflow.updatedAt
        }
      });
    }
  }, [currentWorkflow, technicalId, updateHistoryState, helperStorage, workflowCanvasDataKey, onUpdate]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (technicalId && canUndo) {
      const previousWorkflow = historyService.undo(technicalId);
      if (previousWorkflow) {
        handleWorkflowUpdate(previousWorkflow, 'Undo operation', false);
      }
    }
  }, [technicalId, canUndo, handleWorkflowUpdate]);

  // Handle redo
  const handleRedo = useCallback(() => {
    if (technicalId && canRedo) {
      const nextWorkflow = historyService.redo(technicalId);
      if (nextWorkflow) {
        handleWorkflowUpdate(nextWorkflow, 'Redo operation', false);
      }
    }
  }, [technicalId, canRedo, handleWorkflowUpdate]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    canUndo,
    canRedo
  });

  // Handle state edit (inline editing is handled in WorkflowCanvas)
  const handleStateEdit = useCallback((stateId: string) => {
    console.log('State edit clicked for:', stateId);
  }, []);

  // Handle transition edit
  const handleTransitionEdit = useCallback((transitionId: string) => {
    if (!currentWorkflow) return;

    const transitionDef = getTransitionDefinition(transitionId, currentWorkflow.configuration.states);

    if (transitionDef) {
      setEditingTransitionId(transitionId);
      setEditingTransitionDefinition(transitionDef);
      setTransitionEditorOpen(true);
    }
  }, [currentWorkflow]);

  // Handle transition save
  const handleTransitionSave = useCallback((transitionId: string, definition: TransitionDefinition) => {
    if (!currentWorkflow) return;

    const parsed = parseTransitionId(transitionId);

    if (!parsed) {
      console.error('Invalid transition ID format:', transitionId);
      return;
    }

    const { sourceStateId, transitionIndex } = parsed;
    const sourceState = currentWorkflow.configuration.states[sourceStateId];

    if (sourceState) {
      const updatedTransitions = [...sourceState.transitions];
      updatedTransitions[transitionIndex] = definition;

      const updatedStates = {
        ...currentWorkflow.configuration.states,
        [sourceStateId]: {
          ...sourceState,
          transitions: updatedTransitions
        }
      };

      const updatedWorkflow: UIWorkflowData = {
        ...currentWorkflow,
        configuration: {
          ...currentWorkflow.configuration,
          states: updatedStates
        },
        updatedAt: new Date().toISOString()
      };

      handleWorkflowUpdate(updatedWorkflow, `Updated transition: ${definition.name}`);
      setTransitionEditorOpen(false);
    }
  }, [currentWorkflow, handleWorkflowUpdate]);

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <WorkflowCanvas
          workflow={currentWorkflow}
          onWorkflowUpdate={handleWorkflowUpdate}
          onStateEdit={handleStateEdit}
          onTransitionEdit={handleTransitionEdit}
          darkMode={true}
          technicalId={technicalId}
        />

        {/* Transition Editor Dialog */}
        {transitionEditorOpen && editingTransitionId && editingTransitionDefinition && (
          <TransitionEditor
            isOpen={transitionEditorOpen}
            onClose={() => setTransitionEditorOpen(false)}
            transitionDefinition={editingTransitionDefinition}
            transitionId={editingTransitionId}
            onSave={handleTransitionSave}
            workflowConfig={currentWorkflow?.configuration}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
};

export default ChatBotEditorWorkflowNew;

