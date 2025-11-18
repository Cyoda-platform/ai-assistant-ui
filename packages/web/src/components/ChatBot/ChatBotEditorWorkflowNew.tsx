import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from '../WorkflowCanvas/Canvas/WorkflowCanvas';
import { TransitionEditor } from '../WorkflowCanvas/Editors/TransitionEditor';
import { historyService } from '../WorkflowCanvas/services/historyService';
import { useKeyboardShortcuts } from '../WorkflowCanvas/hooks/useKeyboardShortcuts';
import { useTheme } from '../WorkflowCanvas/hooks/useTheme';
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
import apiService from '@/services/apiService';
import { useAppsTabsStore } from '@/stores/appsTabs';

interface ChatBotEditorWorkflowNewProps {
  technicalId: string;
  modelName?: string;
  modelVersion?: number;
  workflowId?: string; // ID from AppsCanvas navigation (e.g., "workflow-customer-onboarding")
  entityId?: string; // Entity ID from AppsCanvas navigation (e.g., "entity-pet-1")
  appId?: string; // App ID for API calls
  appData?: any; // AppRoot data from repository analysis
  onAnswer?: (data: { answer: string; file?: File }) => void;
  onUpdate?: (data: { canvasData: string; workflowMetaData: any }) => void;
  onBack?: () => void; // Callback to return to workflows list
  setTextareaContentCallback?: ((content: string) => void) | null; // Callback to set textarea content
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
  modelName,
  modelVersion,
  workflowId,
  entityId,
  appId,
  appData,
  onAnswer,
  onUpdate,
  onBack,
  setTextareaContentCallback
}) => {
  const helperStorage = useMemo(() => new HelperStorage(), []);
  const workflowCanvasDataKey = `workflow_canvas_data_${technicalId}`;
  const workflowMetaDataKey = `workflow_metadata_${technicalId}`;

  // Theme management
  const { palette } = useTheme();

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

  // Load workflow from AppRoot or storage on mount
  useEffect(() => {
    const loadWorkflow = async () => {
      setLoading(true);
      try {
        // If workflowId, entityId, and appData are provided, load from AppRoot (single source of truth)
        if (workflowId && entityId && appData) {
          console.log('📖 Loading workflow from AppRoot:', { workflowId, entityId, appId });

          try {
            if (appData) {
              console.log('📊 AppRoot data:', {
                entitiesCount: appData.app.entities.length,
                entities: appData.app.entities.map(e => ({
                  name: e.name,
                  version: e.version,
                  id: `${e.name}-${e.version}`,
                  workflowsCount: e.workflows.length,
                  workflows: e.workflows.map(w => w.name)
                }))
              });

              // Find the entity
              const entity = appData.app.entities.find(
                e => `${e.name}-${e.version}` === entityId
              );

              console.log('🔍 Looking for entity:', entityId, 'Found:', entity ? `${entity.name}-${entity.version}` : 'NOT FOUND');

              if (entity) {
                console.log('📋 Entity workflows:', entity.workflows.map(w => ({
                  name: w.name,
                  id: `workflow-${w.name}`,
                  hasConfig: !!w.config,
                  configStates: w.config?.states ? Object.keys(w.config.states) : []
                })));

                // Find the workflow (case-insensitive matching)
                const workflow = entity.workflows.find(
                  w => `workflow-${w.name.toLowerCase()}` === workflowId.toLowerCase()
                );

                console.log('🔍 Looking for workflow:', workflowId, 'Found:', workflow ? workflow.name : 'NOT FOUND');

                if (workflow && workflow.config) {
                  console.log('✅ Workflow found in AppRoot:', workflow);

                  // Convert AppRoot workflow to UIWorkflowData format
                  const entityModel: EntityModelIdentifier = {
                    modelName: entity.name,
                    modelVersion: entity.version
                  };

                  // Extract layout from config if it exists, otherwise create auto-positioned layout
                  const stateIds = Object.keys(workflow.config.states || {});
                  const stateCount = stateIds.length;

                  // Auto-positioning algorithm: arrange states in a grid or flow layout
                  const layout: CanvasLayout = {
                    states: stateIds.map((stateId, index) => {
                      // For small number of states (1-4), arrange horizontally
                      if (stateCount <= 4) {
                        return {
                          id: stateId,
                          position: { x: 100 + (index * 300), y: 200 }
                        };
                      }
                      // For medium number of states (5-9), arrange in 2 rows
                      else if (stateCount <= 9) {
                        const row = Math.floor(index / 3);
                        const col = index % 3;
                        return {
                          id: stateId,
                          position: { x: 100 + (col * 300), y: 150 + (row * 250) }
                        };
                      }
                      // For larger number of states, arrange in a grid (3 columns)
                      else {
                        const row = Math.floor(index / 3);
                        const col = index % 3;
                        return {
                          id: stateId,
                          position: { x: 100 + (col * 280), y: 100 + (row * 220) }
                        };
                      }
                    }),
                    transitions: [], // Will be populated from workflow config states
                    updatedAt: new Date().toISOString()
                  };

                  console.log('🎨 Auto-positioned states:', layout.states.map(s => ({ id: s.id, x: s.position.x, y: s.position.y })));
                  console.log('📊 Workflow config states:', workflow.config.states);

                  const uiWorkflow = combineWorkflowData(
                    technicalId,
                    entityModel,
                    workflow.config as WorkflowConfiguration,
                    layout
                  );

                  console.log('✅ Created UIWorkflow from AppRoot:', {
                    id: uiWorkflow.id,
                    statesCount: Object.keys(uiWorkflow.configuration.states).length,
                    layoutStatesCount: uiWorkflow.layout.states.length,
                    layoutStates: uiWorkflow.layout.states.map(s => ({ id: s.id, x: s.position.x, y: s.position.y }))
                  });

                  setCurrentWorkflow(uiWorkflow);
                  setLoading(false);
                  updateHistoryState();
                  return;
                }
              }
            }

            console.warn('⚠️ Workflow not found in AppRoot, falling back to localStorage');
          } catch (error) {
            console.error('❌ Error loading from AppRoot:', error);
          }
        }

        // Fall back to localStorage (legacy behavior or fullscreen mode)
        console.log('📖 Loading workflow from localStorage');
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
          // Create workflow with initial state
          const entityModel: EntityModelIdentifier = {
            modelName: technicalId,
            modelVersion: 1
          };

          const initialConfig: WorkflowConfiguration = {
            version: '1.0',
            name: 'New Workflow',
            description: 'A new workflow ready to be configured',
            initialState: 'INITIAL',
            active: true,
            states: {
              'INITIAL': {
                name: 'Initial State',
                transitions: []
              }
            }
          };

          const initialLayout: CanvasLayout = {
            states: [
              {
                id: 'INITIAL',
                position: { x: 250, y: 150 }
              }
            ],
            transitions: [],
            updatedAt: new Date().toISOString()
          };

          const workflow = combineWorkflowData(
            technicalId,
            entityModel,
            initialConfig,
            initialLayout
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technicalId, workflowId, entityId, appId]);

  // Get current app ID - use prop if provided, otherwise fallback to active app tab
  const getCurrentAppId = useCallback(() => {
    // Use appId prop if provided
    if (appId) {
      return appId;
    }

    // Fallback to active app tab
    const { getActiveTab } = useAppsTabsStore.getState();
    const activeTab = getActiveTab();
    if (activeTab) {
      return activeTab.technicalId; // Use technicalId which is the actual app ID
    }

    console.warn('⚠️ No appId provided and no active app tab found');
    return 'default-app';
  }, [appId]);

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

    // Skip API save when in repository analysis mode (appData is provided)
    // In repository analysis mode, we're viewing workflows from GitHub, not managing them via API
    if (!appData) {
      // Also save to mock API for persistence and reload mechanism
      try {
        const appId = getCurrentAppId();
        // Use workflowId from props if available, otherwise generate from modelName
        const apiWorkflowId = workflowId || `workflow-${modelName || technicalId}`;

        console.log('💾 Saving workflow to API:', { appId, workflowId: apiWorkflowId, workflow });
        console.log('🔑 Workflow identity:', {
          modelName: workflow.entityModel?.modelName,
          modelVersion: workflow.entityModel?.modelVersion,
          workflowName: workflow.configuration.name
        });

        // Use entity_id if provided (for association), otherwise use empty string
        // The workflow is identified by its own modelName and modelVersion
        const finalEntityId = entityId || '';

        // Convert workflow configuration to API format
        // Include model name and version from entity model to match parent entity
        const workflowData = {
          entity_id: finalEntityId,
          name: workflow.configuration.name,
          description: workflow.configuration.description || '',
          states: workflow.configuration.states,
          model_name: workflow.entityModel?.modelName || modelName,
          model_version: workflow.entityModel?.modelVersion || modelVersion,
        };

        console.log('📤 Sending workflow data to API:', workflowData);
        await apiService.saveWorkflowDetail(appId, apiWorkflowId, workflowData);
        console.log('✅ Workflow saved to API successfully');
      } catch (error) {
        console.error('❌ Failed to save workflow to API:', error);
        // Don't fail the whole operation if API save fails
      }
    } else {
      console.log('📖 Repository analysis mode - skipping API save');
    }

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
  }, [currentWorkflow, technicalId, modelName, workflowId, entityId, updateHistoryState, helperStorage, workflowCanvasDataKey, onUpdate, getCurrentAppId]);

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
          onSendToChat={setTextareaContentCallback ? (data) => {
            setTextareaContentCallback(data);
          } : undefined}
          onBack={onBack}
          darkMode={true}
          technicalId={technicalId}
          modelName={modelName}
          modelVersion={modelVersion}
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
            palette={palette}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
};

export default ChatBotEditorWorkflowNew;

