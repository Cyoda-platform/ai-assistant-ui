import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from '../WorkflowCanvas/Canvas/WorkflowCanvas';
import { TransitionEditor } from '../WorkflowCanvas/Editors/TransitionEditor';
import { historyService } from '../WorkflowCanvas/services/historyService';
import { useKeyboardShortcuts } from '../WorkflowCanvas/hooks/useKeyboardShortcuts';
import { useTheme } from '../WorkflowCanvas/hooks/useTheme';
import { autoLayoutWorkflow } from '../WorkflowCanvas/utils/autoLayout';
import type {
  UIWorkflowData,
  WorkflowConfiguration,
  CanvasLayout,
  TransitionDefinition,
  EntityModelIdentifier
} from '../WorkflowCanvas/types/workflow';
import { parseTransitionId, getTransitionDefinition } from '../WorkflowCanvas/utils/transitionUtils';
import { Spin } from 'antd';
import { Activity, ArrowLeft, Send } from 'lucide-react';
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
  workflowData?: any; // Direct workflow data from /analyze
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

// Helper to transform /analyze workflow format to WorkflowConfiguration format
// /analyze returns: { states: [{name, type, description}], transitions: [{from, to, name, actions}] }
// WorkflowConfiguration expects: { states: { [stateId]: { transitions: [{next, name}] } } }
function transformAnalyzeWorkflowToConfig(analyzeContent: any): WorkflowConfiguration | null {
  if (!analyzeContent) return null;

  // Check if it's already in the correct format (has states as object with transitions)
  if (analyzeContent.states && typeof analyzeContent.states === 'object' && !Array.isArray(analyzeContent.states)) {
    // Already in correct format
    return analyzeContent as WorkflowConfiguration;
  }

  // Transform from /analyze format
  const statesArray = analyzeContent.states || [];
  const transitionsArray = analyzeContent.transitions || [];

  // Build states object
  const states: Record<string, { name?: string; transitions: TransitionDefinition[] }> = {};

  // First, create all states with empty transitions
  statesArray.forEach((state: any) => {
    const stateId = state.name?.toLowerCase() || state.id || `state_${Object.keys(states).length}`;
    states[stateId] = {
      name: state.name || state.description || stateId,
      transitions: []
    };
  });

  // Add a special "*" state for transitions from any state
  if (!states['*']) {
    states['*'] = { name: 'Any State', transitions: [] };
  }

  // Then, add transitions to their source states
  transitionsArray.forEach((transition: any) => {
    // Handle transition.from as either string or array
    const fromValues = Array.isArray(transition.from)
      ? transition.from
      : [transition.from || '*'];

    const toValue = transition.to || transition.next;
    const toState = typeof toValue === 'string'
      ? toValue.toLowerCase()
      : (Array.isArray(toValue) ? toValue[0]?.toLowerCase() : undefined);

    if (!toState) return;

    // Ensure the target state exists
    if (!states[toState]) {
      states[toState] = { name: toState, transitions: [] };
    }

    // Process each 'from' state
    fromValues.forEach((from: any) => {
      const fromState = typeof from === 'string'
        ? from.toLowerCase()
        : '*';

      // Ensure the source state exists
      if (!states[fromState]) {
        states[fromState] = { name: fromState, transitions: [] };
      }

      // Add transition to source state
      states[fromState].transitions.push({
        name: transition.name,
        next: toState,
        processors: transition.actions?.map((action: any) => ({
          name: action.type || 'processor',
          config: action
        })) || []
      });
    });
  });

  // Find initial state (first non-terminal state or first state)
  let initialState = Object.keys(states).find(s => s !== '*') || 'initial';

  // Try to find a state that is the target of a "*" transition
  const starTransitions = states['*']?.transitions || [];
  if (starTransitions.length > 0) {
    initialState = starTransitions[0].next;
  }

  return {
    version: String(analyzeContent.version || '1'),
    name: analyzeContent.name || 'Workflow',
    desc: analyzeContent.description,
    initialState,
    active: true,
    states
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
  workflowData,
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

  // Local fullscreen state - preserves workflow state when toggling
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        // First, try to use workflowData passed directly
        // Check for both 'config' (expected format) and 'content' (/analyze format)
        const rawConfig = workflowData?.config || workflowData?.content;
        if (rawConfig) {
          console.log('✅ Using workflow data passed directly:', workflowData.name);
          console.log('📦 Raw config structure:', {
            hasStatesObject: rawConfig.states && typeof rawConfig.states === 'object' && !Array.isArray(rawConfig.states),
            hasStatesArray: Array.isArray(rawConfig.states),
            hasTransitionsArray: Array.isArray(rawConfig.transitions),
            keys: Object.keys(rawConfig)
          });

          // Transform /analyze format to WorkflowConfiguration format if needed
          const config = transformAnalyzeWorkflowToConfig(rawConfig);
          if (!config) {
            console.error('❌ Failed to transform workflow config');
            setLoading(false);
            return;
          }

          console.log('✅ Transformed config:', {
            stateIds: Object.keys(config.states || {}),
            initialState: config.initialState
          });

          const stateIds = Object.keys(config.states || {});
          const layout: CanvasLayout = {
            states: stateIds.map((stateId, index) => ({
              id: stateId,
              position: { x: 100 + (index * 300), y: 200 }
            })),
            transitions: [],
            updatedAt: new Date().toISOString()
          };

          const entityModel: EntityModelIdentifier = {
            modelName: workflowData.entity_name || modelName,
            modelVersion: workflowData.entity_version || modelVersion
          };

          const uiWorkflow = combineWorkflowData(
            technicalId,
            entityModel,
            config,
            layout
          );

          const formattedWorkflow = autoLayoutWorkflow(uiWorkflow, { direction: 'TB' });
          setCurrentWorkflow(formattedWorkflow);
          setLoading(false);
          updateHistoryState();
          return;
        }

        // Fallback: Try to load from AppRoot if all parameters are provided
        if (workflowId && entityId && appData?.app?.entities) {
          console.log('🔍 Searching for entity:', entityId);
          const entity = appData.app.entities.find(
            e => `${e.name}-${e.version}` === entityId
          );

          if (entity?.workflows?.length > 0) {
            const searchName = workflowId.replace('workflow-', '').toLowerCase();
            const workflow = entity.workflows.find(
              w => w.name && w.name.toLowerCase() === searchName
            );

            if (workflow?.config) {
              console.log('✅ Loaded workflow from AppRoot:', workflow.name);

              const stateIds = Object.keys(workflow.config.states || {});
              const layout: CanvasLayout = {
                states: stateIds.map((stateId, index) => ({
                  id: stateId,
                  position: { x: 100 + (index * 300), y: 200 }
                })),
                transitions: [],
                updatedAt: new Date().toISOString()
              };

              const entityModel: EntityModelIdentifier = {
                modelName: entity.name,
                modelVersion: entity.version
              };

              const uiWorkflow = combineWorkflowData(
                technicalId,
                entityModel,
                workflow.config as WorkflowConfiguration,
                layout
              );

              const formattedWorkflow = autoLayoutWorkflow(uiWorkflow, { direction: 'TB' });
              setCurrentWorkflow(formattedWorkflow);
              setLoading(false);
              updateHistoryState();
              return;
            }
          }
        }

        console.log('⚠️ Could not load workflow, falling back to localStorage');

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

            // Apply auto-layout formatting when opening workflow from localStorage
            console.log('🎨 Applying auto-layout formatting to workflow from localStorage...');
            const formattedWorkflow = autoLayoutWorkflow(workflow, { direction: 'TB' });

            console.log('✅ Auto-layout applied to localStorage workflow:', {
              id: formattedWorkflow.id,
              layoutStatesCount: formattedWorkflow.layout.states.length
            });

            setCurrentWorkflow(formattedWorkflow);
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
  }, [technicalId, workflowId, entityId, appId, workflowData]);

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
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} flex flex-col bg-gray-900`}>
      {/* Workflow Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <ReactFlowProvider>
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <WorkflowCanvas
              key={currentWorkflow?.id}
              workflow={currentWorkflow}
              onWorkflowUpdate={handleWorkflowUpdate}
              onStateEdit={handleStateEdit}
              onTransitionEdit={handleTransitionEdit}
              onSendToChat={setTextareaContentCallback ? (data) => {
                setTextareaContentCallback(data);
              } : undefined}
              darkMode={true}
              technicalId={technicalId}
              modelName={modelName}
              modelVersion={modelVersion}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
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
      </div>
    </div>
  );
};

export default ChatBotEditorWorkflowNew;

