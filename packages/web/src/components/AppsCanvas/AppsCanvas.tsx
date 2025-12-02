import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { GitCompare } from 'lucide-react';
import type { UIWorkflowData } from '../WorkflowCanvas/types/workflow';
import type { PortalData, CanvasTab } from './types/apps';
import type { AppRoot } from './types/appSchema';
import { AppsJsonEditor } from './AppsJsonEditor';
import { AppsReactFlow } from './AppsReactFlow';
import { convertAppRootToWorkflow, convertAppRootToSimplifiedWorkflow, convertWorkflowToAppRoot } from './convertAppRootToWorkflow';
import { useRepositoryStore } from '@/stores/repository';
import githubAppDataService, { type GitHubRepositoryInfo, type RepositoryDiff } from '@/services/githubAppDataService';

interface AppsCanvasProps {
  // Support both PortalData and AppRoot (from app_schema.json)
  data?: PortalData;
  appData?: AppRoot;
  conversationId?: string; // Conversation ID for backend persistence
  githubRepository?: GitHubRepositoryInfo; // Load from GitHub instead of AppConfig
  onNavigate?: (tab: CanvasTab, targetId: string, data?: any) => void;
  onDataUpdate?: (data: PortalData) => void;
  onAppDataUpdate?: (appData: AppRoot) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  simplified?: boolean; // Show simplified view (only app name, environments group, entities group)
  onSendToChat?: (appJson: string) => void; // Send app JSON to chat
}

/**
 * AppsCanvas - Full-featured canvas with ALL WorkflowCanvas features enabled
 *
 * Features enabled:
 * ✅ JSON Editor with lint, navigation, and schema validation
 * ✅ Import/Export JSON to/from file
 * ✅ All settings (themes, layouts, edge types, etc.)
 * ✅ Question mark (Quick Help)
 * ✅ Undo/Redo with keyboard shortcuts
 * ✅ Drag and drop
 * ✅ Zoom and pan
 * ✅ Minimap
 * ✅ Auto-layout
 * ✅ And 50+ more features!
 */

/**
 * AppsCanvas - A wrapper around WorkflowCanvas that adapts Portal/Apps data
 *
 * This component converts Portal data (Environments → Apps → Requirements → Entities → Workflows → Code)
 * into Workflow data (States and Transitions) so we can reuse the existing WorkflowCanvas component.
 *
 * Benefits:
 * - Reuses all WorkflowCanvas features (drag-drop, zoom, pan, layouts, etc.)
 * - No risk of breaking WorkflowCanvas
 * - Changes to AppsCanvas don't affect WorkflowCanvas
 * - Much simpler implementation (adapter pattern)
 */

/**
 * Convert Portal data to Workflow data
 *
 * Strategy: Treat each node type as a "state" in the workflow
 * - Environment → State (green)
 * - App → State (teal)
 * - Requirement → State (orange)
 * - Entity → State (blue)
 * - Workflow → State (purple)
 * - Code → State (green)
 *
 * Edges become transitions between states
 */
function convertPortalDataToWorkflow(data: PortalData): UIWorkflowData {
  const states: Record<string, any> = {};
  const layoutStates: any[] = [];
  const layoutTransitions: any[] = [];

  let yOffset = 100;
  const xSpacing = 300;
  const ySpacing = 150;

  // Level 1: Environments
  data.environments.forEach((env, index) => {
    states[env.id] = {
      name: env.name,
      transitions: data.apps
        .filter(app => app.environmentId === env.id)
        .map(app => ({
          next: app.id,
          condition: 'true'
        }))
    };

    layoutStates.push({
      id: env.id,
      position: { x: 100, y: yOffset + index * ySpacing },
      properties: {
        color: '#10b981', // green
        type: 'environment',
        metadata: env
      }
    });
  });

  yOffset += data.environments.length * ySpacing;

  // Level 2: Apps
  data.apps.forEach((app, index) => {
    states[app.id] = {
      name: app.name,
      transitions: data.requirements
        .filter(req => req.appId === app.id)
        .map(req => ({
          next: req.id,
          condition: 'true'
        }))
    };

    layoutStates.push({
      id: app.id,
      position: { x: 100 + xSpacing, y: yOffset + index * ySpacing },
      properties: {
        color: '#14b8a6', // teal
        type: 'app',
        metadata: app
      }
    });
  });

  yOffset += data.apps.length * ySpacing;

  // Level 3: Requirements
  data.requirements.forEach((req, index) => {
    states[req.id] = {
      name: req.title,
      transitions: data.entityVersions
        .filter(ev => ev.requirementId === req.id)
        .map(ev => ({
          next: ev.id,
          condition: 'true'
        }))
    };

    layoutStates.push({
      id: req.id,
      position: { x: 100 + xSpacing * 2, y: yOffset + index * ySpacing },
      properties: {
        color: '#f59e0b', // orange
        type: 'requirement',
        metadata: req
      }
    });
  });

  yOffset += data.requirements.length * ySpacing;

  // Level 4: Entity Versions
  data.entityVersions.forEach((ev, index) => {
    states[ev.id] = {
      name: `${ev.entityName} v${ev.version}`,
      transitions: data.workflows
        .filter(w => w.entityVersionId === ev.id)
        .map(w => ({
          next: w.id,
          condition: 'true'
        }))
    };

    layoutStates.push({
      id: ev.id,
      position: { x: 100 + xSpacing * 3, y: yOffset + index * ySpacing },
      properties: {
        color: '#3b82f6', // blue
        type: 'entityVersion',
        metadata: ev
      }
    });
  });

  yOffset += data.entityVersions.length * ySpacing;

  // Level 5: Workflows
  data.workflows.forEach((workflow, index) => {
    const codeFiles = data.code?.filter(c => c.workflowId === workflow.id) || [];

    states[workflow.id] = {
      name: workflow.name,
      transitions: codeFiles.map(code => ({
        next: code.id,
        condition: 'true'
      }))
    };

    layoutStates.push({
      id: workflow.id,
      position: { x: 100 + xSpacing * 4, y: yOffset + index * ySpacing },
      properties: {
        color: '#a78bfa', // purple
        type: 'workflow',
        metadata: workflow
      }
    });
  });

  yOffset += data.workflows.length * ySpacing;

  // Level 6: Code
  if (data.code) {
    data.code.forEach((code, index) => {
      states[code.id] = {
        name: code.name,
        transitions: [] // Terminal nodes
      };

      layoutStates.push({
        id: code.id,
        position: { x: 100 + xSpacing * 5, y: yOffset + index * ySpacing },
        properties: {
          color: '#10b981', // green
          type: 'code',
          metadata: code
        }
      });
    });
  }

  // Create layout transitions (for positioning transition nodes)
  Object.entries(states).forEach(([stateId, stateDef]) => {
    stateDef.transitions.forEach((transition: any, index: number) => {
      layoutTransitions.push({
        id: `${stateId}-${index}`,
        position: { x: 0, y: 0 }, // Will be auto-calculated
        sourceHandle: null,
        targetHandle: null
      });
    });
  });

  // Set initial state to first environment (or first node)
  const initialState = data.environments[0]?.id || Object.keys(states)[0] || 'start';

  return {
    technicalId: 'apps-canvas',
    configuration: {
      name: 'Apps Canvas',
      initialState,
      states
    },
    layout: {
      version: 1,
      states: layoutStates,
      transitions: layoutTransitions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Convert Workflow data back to Portal data
 * This enables full editing capabilities - changes in WorkflowCanvas are reflected back to Portal data
 */
function convertWorkflowToPortalData(
  workflow: UIWorkflowData,
  originalData: PortalData
): PortalData {
  // Create a deep copy of original data
  const updatedData: PortalData = JSON.parse(JSON.stringify(originalData));

  // Update positions and metadata from workflow layout
  workflow.layout.states.forEach(state => {
    const type = state.properties?.type;
    const metadata = state.properties?.metadata;

    if (!type || !metadata) return;

    // Update the corresponding node in Portal data
    switch (type) {
      case 'environment':
        const env = updatedData.environments.find(e => e.id === state.id);
        if (env) {
          // Update metadata if it changed
          Object.assign(env, metadata);
        }
        break;

      case 'app':
        const app = updatedData.apps.find(a => a.id === state.id);
        if (app) {
          Object.assign(app, metadata);
        }
        break;

      case 'requirement':
        const req = updatedData.requirements.find(r => r.id === state.id);
        if (req) {
          Object.assign(req, metadata);
        }
        break;

      case 'entityVersion':
        const ev = updatedData.entityVersions.find(e => e.id === state.id);
        if (ev) {
          Object.assign(ev, metadata);
        }
        break;

      case 'workflow':
        const wf = updatedData.workflows.find(w => w.id === state.id);
        if (wf) {
          Object.assign(wf, metadata);
        }
        break;

      case 'code':
        if (updatedData.code) {
          const code = updatedData.code.find(c => c.id === state.id);
          if (code) {
            Object.assign(code, metadata);
          }
        }
        break;
    }
  });

  return updatedData;
}

export const AppsCanvas: React.FC<AppsCanvasProps> = ({
  data,
  appData,
  conversationId,
  githubRepository,
  onNavigate,
  onDataUpdate,
  onAppDataUpdate,
  isFullscreen,
  onToggleFullscreen,
  simplified = false,
  onSendToChat
}) => {
  // Repository store (replaces app-config)
  const repositoryStore = useRepositoryStore();

  // State for custom JSON editor
  const [showJsonEditor, setShowJsonEditor] = useState(true);
  const [currentAppData, setCurrentAppData] = useState<AppRoot | null>(appData || null);

  // State for view toggle
  const [isFinTechView, setIsFinTechView] = useState(false);
  const [jsonEditorNavigateToNode, setJsonEditorNavigateToNode] = useState<string | null>(null);
  const [nodesToDelete, setNodesToDelete] = useState<string[]>([]);
  const [isLoadingFromBackend, setIsLoadingFromBackend] = useState(false);
  const [isLoadingFromGitHub, setIsLoadingFromGitHub] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffData, setDiffData] = useState<RepositoryDiff | null>(null);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Ref to track if we're currently loading (prevents duplicate loads in StrictMode)
  const isLoadingRef = React.useRef(false);
  const loadedConversationIdRef = React.useRef<string | null>(null);
  const hasInitialLoadRef = React.useRef(false);
  const loadedGitHubRepoRef = React.useRef<string | null>(null);

  // Create a stable repository key to prevent unnecessary re-renders
  const repositoryKey = useMemo(() => {
    if (!githubRepository) return null;
    return `${githubRepository.owner}/${githubRepository.repositoryName}@${githubRepository.branch}`;
  }, [githubRepository?.owner, githubRepository?.repositoryName, githubRepository?.branch]);

  // Subscribe to repository store cache changes to detect when data is loaded externally (e.g., from SSE hooks)
  const repositoryData = useRepositoryStore((state) =>
    conversationId ? state.cache[conversationId]?.data : null
  );

  // Update currentAppData when repository store cache changes (e.g., from SSE hook refresh)
  useEffect(() => {
    if (repositoryData && conversationId) {
      console.log('📊 AppsCanvas: Repository store cache updated, syncing currentAppData:', {
        conversationId,
        entities: repositoryData.app?.entities?.length || 0,
        entityNames: repositoryData.app?.entities?.map(e => e.name) || []
      });
      setCurrentAppData(repositoryData);
      onAppDataUpdate?.(repositoryData);
    }
  }, [repositoryData, conversationId, onAppDataUpdate]);

  // Always reload fresh data from analyze endpoint when component mounts or data changes
  useEffect(() => {
    if (conversationId && githubRepository) {
      console.log('🔄 AppsCanvas: Loading fresh repository data:', {
        conversationId,
        repositoryName: githubRepository.repositoryName,
        currentAppDataEntities: currentAppData?.app?.entities?.length || 0
      });

      const loadFreshData = async () => {
        try {
          const freshData = await repositoryStore.loadRepository(conversationId, githubRepository);
          if (freshData) {
            console.log('✅ AppsCanvas: Fresh repository data loaded:', {
              entities: freshData.app.entities.length,
              workflows: freshData.app.entities.reduce((sum, e) => sum + e.workflows.length, 0),
              entityNames: freshData.app.entities.map(e => e.name),
              fullEntityData: freshData.app.entities.map(e => ({
                id: e.id,
                name: e.name,
                version: e.version,
                workflows: e.workflows?.length || 0
              }))
            });
            setCurrentAppData(freshData);
            onAppDataUpdate?.(freshData);
          } else {
            console.log('❌ AppsCanvas: No fresh data returned from loadRepository');
          }
        } catch (error) {
          console.error('❌ AppsCanvas: Failed to load fresh repository data:', error);
        }
      };

      loadFreshData();
    }
  }, [conversationId, githubRepository]);

  // Load from repository when GitHub repository info is provided
  useEffect(() => {
    console.log('🔍 AppsCanvas useEffect triggered:', {
      hasGithubRepository: !!githubRepository,
      hasConversationId: !!conversationId,
      repositoryKey,
      loadedGitHubRepoRef: loadedGitHubRepoRef.current
    });

    if (!githubRepository || !conversationId) {
      console.log('⏭️ Skipping: missing githubRepository or conversationId');
      return;
    }

    // Skip if we've already loaded this exact repository
    if (loadedGitHubRepoRef.current === repositoryKey) {
      console.log('⏭️ Already loaded this repository, skipping');
      return;
    }

    const loadFromRepository = async () => {
      setIsLoadingFromGitHub(true);
      try {
        console.log('🔄 Loading repository data via store:', githubRepository);
        // Use repository store which handles caching and deduplication
        const appRoot = await repositoryStore.loadRepository(conversationId, githubRepository);
        if (appRoot) {
          console.log('✅ Repository data loaded');
          setCurrentAppData(appRoot);
          onAppDataUpdate?.(appRoot);
          // Mark this repository as loaded
          loadedGitHubRepoRef.current = repositoryKey;
        }
      } catch (error) {
        console.error('❌ Failed to load repository:', error);
        setSaveError(error instanceof Error ? error.message : 'Failed to load repository');
      } finally {
        setIsLoadingFromGitHub(false);
      }
    };

    loadFromRepository();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, repositoryKey]); // Use stable repositoryKey instead of githubRepository object

  // Load app data from props when no GitHub repository is provided (legacy behavior)
  useEffect(() => {
    // Skip if loading from GitHub (handled by first useEffect)
    if (githubRepository) {
      return;
    }

    // If we have appData from props, use it
    if (appData && conversationId) {
      console.log('📦 Using app data from props (no GitHub repository)');
      setCurrentAppData(appData);
      loadedConversationIdRef.current = conversationId;
      hasInitialLoadRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, appData, githubRepository]);

  // Update current app data when prop changes
  useEffect(() => {
    if (appData) {
      setCurrentAppData(appData);
    }
  }, [appData]);

  // Use ref to track if we're currently processing an add operation
  const isAddingRef = React.useRef(false);

  // Handle adding new instance from group node
  const handleAddNewInstance = useCallback((groupType: string, entityId?: string) => {
    // Prevent multiple simultaneous adds
    if (isAddingRef.current) {
      console.warn('⚠️ Already adding an instance, ignoring duplicate call');
      return;
    }

    if (!currentAppData) return;

    isAddingRef.current = true;
    console.log('🔧 Adding new instance:', { groupType, entityId });

    const updatedData = JSON.parse(JSON.stringify(currentAppData)) as AppRoot;

    if (groupType === 'entities') {
      // Add new entity
      const newEntity = {
        name: `new-entity-${updatedData.app.entities.length + 1}`,
        version: '1',
        description: 'New entity',
        cyoda_url: '',
        github_url: '',
        model: {}, // Empty model - user can define structure in editor
        workflows: []
      };
      updatedData.app.entities.push(newEntity);
      console.log('✅ Entity added:', newEntity.name);
    } else if (groupType === 'workflows' && entityId) {
      // Add new workflow to specific entity
      console.log('🔧 Adding workflow to entity:', entityId);

      // Parse entity ID: format is "entity-{name}-{version}"
      // Example: "entity-pet-1" -> name="pet", version="1"
      const entityIdParts = entityId.replace('entity-', '').split('-');
      const version = entityIdParts[entityIdParts.length - 1]; // Last part is version
      const entityName = entityIdParts.slice(0, -1).join('-'); // Everything before version is name

      console.log('🔍 Looking for entity:', { entityName, version, allEntities: updatedData.app.entities });

      const entity = updatedData.app.entities.find(e => {
        const nameMatch = e.name.toLowerCase().replace(/\s+/g, '-') === entityName.toLowerCase();
        const versionMatch = e.version.toLowerCase().replace(/\s+/g, '-') === version.toLowerCase();
        return nameMatch && versionMatch;
      });

      if (entity) {
        console.log('✅ Found entity, adding workflow');
        const newWorkflow = {
          name: `new-workflow-${entity.workflows.length + 1}`,
          cyoda_url: 'https://example.com',
          github_url: 'https://github.com',
          config: {
            states: {
              initial: {
                transitions: []
              }
            }
          }
        };
        entity.workflows.push(newWorkflow);
        console.log('✅ Workflow added:', newWorkflow.name);
      } else {
        console.error('❌ Entity not found for ID:', entityId, { entityName, version });
      }
    }

    setCurrentAppData(updatedData);
    onAppDataUpdate?.(updatedData);

    // Update local cache (no backend persistence)
    if (conversationId) {
      repositoryStore.updateLocalData(conversationId, updatedData);
      setLastSavedAt(new Date());
      console.log('✅ Local data updated after adding instance');

      // DON'T reload fresh data after adding instance - it would overwrite local additions
      // The /analyze endpoint only returns original repository data, not locally added entities
      // if (githubRepository) {
      //   console.log('🔄 Reloading fresh data after adding instance');
      //   repositoryStore.loadRepository(conversationId, githubRepository)
      //     .then((freshData) => {
      //       if (freshData) {
      //         console.log('✅ Fresh data reloaded:', {
      //           entities: freshData.app.entities.length,
      //           workflows: freshData.app.entities.reduce((sum, e) => sum + e.workflows.length, 0)
      //         });
      //         setCurrentAppData(freshData);
      //       }
      //     })
      //     .catch((error) => {
      //       console.error('❌ Failed to reload fresh data:', error);
      //     });
      // }
      console.log('✅ Keeping local data after adding instance (not overwriting with API data)');
    }

    // Reset the flag after a short delay to allow the state update to complete
    setTimeout(() => {
      isAddingRef.current = false;
    }, 100);
  }, [currentAppData, conversationId, repositoryStore, onAppDataUpdate]);

  // Handle node data updates from inline JSON editors
  const handleNodeUpdate = useCallback((nodeId: string, nodeType: string, updatedMetadata: any) => {
    if (!currentAppData) return;

    const updatedData = JSON.parse(JSON.stringify(currentAppData)) as AppRoot;

    if (nodeType === 'app') {
      // Update app metadata
      Object.assign(updatedData.app, updatedMetadata);
    } else if (nodeType === 'entity') {
      // Update entity
      const parts = nodeId.replace('entity-', '').split('-');
      const entityName = parts.slice(0, -1).join(' ');
      const entity = updatedData.app.entities.find(e =>
        e.name.toLowerCase().replace(/\s+/g, '-') === entityName
      );
      if (entity) {
        Object.assign(entity, updatedMetadata);
      }
    } else if (nodeType === 'workflow') {
      // Update workflow
      const workflowName = nodeId.replace('workflow-', '').replace(/-/g, ' ');
      for (const entity of updatedData.app.entities) {
        const workflow = entity.workflows.find(w =>
          w.name.toLowerCase() === workflowName.toLowerCase()
        );
        if (workflow) {
          Object.assign(workflow, updatedMetadata);
          break;
        }
      }
    }

    setCurrentAppData(updatedData);
    onAppDataUpdate?.(updatedData);

    // Save to backend if conversation ID is provided
    if (conversationId) {
      repositoryStore.updateLocalData(conversationId, updatedData);
      setLastSavedAt(new Date());
      console.log('✅ Local data updated after node update');
    }
  }, [currentAppData, conversationId, repositoryStore, onAppDataUpdate]);

  // Handle sending node data to chat
  const handleNodeSendToChat = useCallback((nodeData: any, nodeType: string) => {
    if (!onSendToChat) return;

    const nodeJson = JSON.stringify(nodeData, null, 2);
    onSendToChat(nodeJson);

    console.log(`📤 Sent ${nodeType} to chat:`, nodeData);
  }, [onSendToChat]);

  // Use refs to store stable callback references
  const handleAddNewInstanceRef = React.useRef(handleAddNewInstance);
  const handleNodeUpdateRef = React.useRef(handleNodeUpdate);
  const handleNodeSendToChatRef = React.useRef(handleNodeSendToChat);

  // Update refs when callbacks change
  React.useEffect(() => {
    handleAddNewInstanceRef.current = handleAddNewInstance;
    handleNodeUpdateRef.current = handleNodeUpdate;
    handleNodeSendToChatRef.current = handleNodeSendToChat;
  }, [handleAddNewInstance, handleNodeUpdate, handleNodeSendToChat]);

  // Convert data to Workflow format for visualization
  const workflowData = useMemo(() => {
    console.log('🔄 AppsCanvas: Converting to workflow data:', {
      hasCurrentAppData: !!currentAppData,
      simplified,
      entities: currentAppData?.app?.entities?.length || 0,
      entityNames: currentAppData?.app?.entities?.map(e => e.name) || []
    });

    if (currentAppData) {
      // Use simplified view for new apps (only app name, environments group, entities group)
      if (simplified) {
        console.log('📊 AppsCanvas: Using simplified workflow view');
        return convertAppRootToSimplifiedWorkflow(
          currentAppData,
          (...args) => handleAddNewInstanceRef.current(...args),
          (...args) => handleNodeUpdateRef.current(...args),
          (...args) => handleNodeSendToChatRef.current(...args)
        );
      }
      // Use full view for existing apps
      console.log('📊 AppsCanvas: Using full workflow view');
      return convertAppRootToWorkflow(
        currentAppData,
        (...args) => handleAddNewInstanceRef.current(...args),
        (...args) => handleNodeUpdateRef.current(...args),
        (...args) => handleNodeSendToChatRef.current(...args)
      );
    }
    // Return empty workflow
    return {
      configuration: {
        version: '1.0',
        name: 'Empty',
        desc: 'No data',
        initialState: 'empty',
        active: true,
        states: {
          empty: { name: 'Empty', transitions: [] }
        }
      },
      layout: {
        states: [{
          id: 'empty',
          type: 'default',
          position: { x: 100, y: 100 },
          data: { label: 'No data' },
          properties: { color: '#gray', type: 'empty' }
        }],
        transitions: []
      }
    };
  }, [currentAppData, simplified]);

  // Handle JSON editor save
  const handleJsonEditorSave = useCallback(async (updatedAppData: AppRoot) => {
    console.log('✅ App data updated from JSON editor');
    setCurrentAppData(updatedAppData);
    onAppDataUpdate?.(updatedAppData);

    // Save to backend if conversation ID is provided
    if (conversationId) {
      setIsSaving(true);
      setSaveError(null);
      try {
        console.log('💾 Updating local data...');
        repositoryStore.updateLocalData(conversationId, updatedAppData);
        console.log('✅ Local data updated successfully');
        setLastSavedAt(new Date());
        setSaveError(null);
      } catch (error: any) {
        console.error('❌ Failed to update local data:', error);
        setSaveError(error.message || 'Failed to save from JSON editor');
      } finally {
        setIsSaving(false);
      }
    }
  }, [conversationId, repositoryStore, onAppDataUpdate]);

  // Handle direct save from canvas (without opening JSON editor)
  const handleDirectSave = useCallback(async () => {
    if (!currentAppData || !conversationId) {
      console.warn('⚠️ Cannot save: missing app data or conversation ID');
      setSaveError('Cannot save: missing app data or conversation ID');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      console.log('💾 Updating local data from canvas...');
      repositoryStore.updateLocalData(conversationId, currentAppData);
      console.log('✅ Local data updated successfully');
      setLastSavedAt(new Date());
      setSaveError(null);
    } catch (error: any) {
      console.error('❌ Failed to update local data:', error);
      setSaveError(error.message || 'Failed to save app config');
    } finally {
      setIsSaving(false);
    }
  }, [currentAppData, conversationId, repositoryStore]);

  // Handle send to chat
  const handleSendToChat = useCallback(() => {
    if (!currentAppData) {
      console.warn('⚠️ No app data to send to chat');
      return;
    }

    // Convert app data to formatted JSON string
    const appJson = JSON.stringify(currentAppData, null, 2);
    console.log('📤 Sending app JSON to chat:', appJson.substring(0, 100) + '...');

    onSendToChat?.(appJson);
  }, [currentAppData, onSendToChat]);

  // Handle node double-clicks - navigate to appropriate tab or GitHub
  const handleNodeDoubleClick = useCallback((nodeId: string, nodeType: string, nodeData?: any) => {
    console.log('🎯 Node double-clicked:', nodeId, nodeType, nodeData);

    // Check if we should redirect to GitHub
    if (githubRepository && nodeData?.github_url) {
      console.log('🔗 Redirecting to GitHub:', nodeData.github_url);
      window.open(nodeData.github_url, '_blank');
      return;
    }

    // Check for file path in metadata (for requirements)
    if (githubRepository && nodeData?.filePath) {
      const githubUrl = `https://github.com/${githubRepository.owner}/${githubRepository.repositoryName}/blob/${githubRepository.branch}/${nodeData.filePath}`;
      console.log('🔗 Redirecting to GitHub (from filePath):', githubUrl);
      window.open(githubUrl, '_blank');
      return;
    }

    // Determine if we should navigate to another tab
    let shouldNavigate = false;
    let targetTab: CanvasTab | null = null;

    switch (nodeType) {
      case 'appNode':
        // App root node - navigate to Requirement tab
        shouldNavigate = true;
        targetTab = 'requirement';
        break;
      case 'entityNode':
        shouldNavigate = true;
        targetTab = 'data';
        break;
      case 'workflowNode':
        shouldNavigate = true;
        targetTab = 'workflow';
        break;
      default:
        // Unknown node type, stay on apps tab
        shouldNavigate = false;
        break;
    }

    if (shouldNavigate && targetTab && onNavigate) {
      // Navigate to the appropriate tab, passing node data for workflows
      onNavigate(targetTab, nodeId, nodeData);
    } else {
      // Open JSON editor if not already open
      if (!showJsonEditor) {
        setShowJsonEditor(true);
      }

      // Set the node to navigate to in JSON editor
      setJsonEditorNavigateToNode(nodeId);
    }
  }, [showJsonEditor, onNavigate, githubRepository]);

  // Handle export to file
  const handleExport = useCallback(() => {
    if (currentAppData) {
      const dataStr = JSON.stringify(currentAppData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'app_config.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [currentAppData]);

  // Handle import from file
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const text = await file.text();
        try {
          const parsed = JSON.parse(text);
          setCurrentAppData(parsed as AppRoot);
          onAppDataUpdate?.(parsed as AppRoot);
        } catch (err: any) {
          alert('Invalid JSON file: ' + err.message);
        }
      }
    };
    input.click();
  }, [onAppDataUpdate]);

  // Handle deleting nodes with backspace
  const handleDeleteNodes = useCallback((nodeIds: string[]) => {
    if (!currentAppData || nodeIds.length === 0) return;

    const updatedData = JSON.parse(JSON.stringify(currentAppData)) as AppRoot;
    let modified = false;

    nodeIds.forEach(nodeId => {
      if (nodeId === 'app-root') {
        alert('Cannot delete the app node');
        return;
      }

      if (nodeId.startsWith('entity-')) {
        // Delete entity (and all its workflows)
        const parts = nodeId.replace('entity-', '').split('-');
        const entityName = parts.slice(0, -1).join(' ');
        const index = updatedData.app.entities.findIndex(e =>
          e.name.toLowerCase().replace(/\s+/g, '-') === entityName
        );
        if (index >= 0) {
          updatedData.app.entities.splice(index, 1);
          modified = true;
        }
      } else if (nodeId.startsWith('workflow-')) {
        // Delete workflow from its entity
        const workflowName = nodeId.replace('workflow-', '').replace(/-/g, ' ');
        for (const entity of updatedData.app.entities) {
          const index = entity.workflows.findIndex(w =>
            w.name.toLowerCase() === workflowName.toLowerCase()
          );
          if (index >= 0) {
            entity.workflows.splice(index, 1);
            modified = true;
            break;
          }
        }
      }
    });

    if (modified) {
      setCurrentAppData(updatedData);
      onAppDataUpdate?.(updatedData);
    }
  }, [currentAppData, onAppDataUpdate]);

  // Handle refresh from GitHub
  const handleRefreshFromGitHub = useCallback(async () => {
    if (!githubRepository) {
      console.warn('⚠️ No GitHub repository configured');
      return;
    }

    setIsRefreshing(true);
    try {
      console.log('🔄 Refreshing app data from GitHub:', githubRepository);
      const appRoot = await githubAppDataService.convertGitHubToAppRoot(githubRepository);
      console.log('✅ App data refreshed from GitHub');
      setCurrentAppData(appRoot);
      onAppDataUpdate?.(appRoot);
    } catch (error) {
      console.error('❌ Failed to refresh from GitHub:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to refresh from GitHub');
    } finally {
      setIsRefreshing(false);
    }
  }, [githubRepository, onAppDataUpdate]);

  // Handle pull changes from remote
  const handlePullChanges = useCallback(async () => {
    if (!conversationId) {
      console.warn('⚠️ No conversation ID available');
      return;
    }

    setIsPulling(true);
    setSaveError(null);
    try {
      console.log('🔄 Pulling changes from remote repository for conversation:', conversationId);
      const result = await githubAppDataService.pullRepositoryChanges(conversationId);
      console.log('✅ Pull result:', result);

      // After successful pull, refresh the canvas data
      if (githubRepository) {
        console.log('🔄 Refreshing canvas after pull...');
        const appRoot = await githubAppDataService.convertGitHubToAppRoot(githubRepository, conversationId);
        console.log('✅ Canvas refreshed after pull');
        setCurrentAppData(appRoot);
        onAppDataUpdate?.(appRoot);
      }
    } catch (error) {
      console.error('❌ Failed to pull changes:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to pull changes');
    } finally {
      setIsPulling(false);
    }
  }, [conversationId, githubRepository, onAppDataUpdate]);

  // Handle show diff
  const handleShowDiff = useCallback(async () => {
    if (!githubRepository) {
      console.warn('⚠️ No GitHub repository configured');
      return;
    }

    setDiffError(null);
    try {
      console.log('🔍 Fetching diff from repository:', githubRepository);
      const diff = await githubAppDataService.getRepositoryDiff(githubRepository);
      console.log('✅ Diff fetched successfully:', diff);
      setDiffData(diff);
      setShowDiffModal(true);
    } catch (error) {
      console.error('❌ Failed to fetch diff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch diff';
      setDiffError(errorMessage);
      setSaveError(errorMessage);
    }
  }, [githubRepository]);

  // Handle analyze app - reload from repository to get latest structure
  const handleAnalyze = useCallback(async () => {
    if (!githubRepository || !conversationId) {
      console.warn('⚠️ Cannot analyze: missing repository info or conversation ID');
      setSaveError('Repository not configured. Please set up a repository first.');
      return;
    }

    setIsAnalyzing(true);
    setSaveError(null);
    try {
      console.log('🔍 Analyzing repository...');
      // Clear cache to force fresh analysis
      repositoryStore.clearCache(conversationId);
      // Reload from repository (calls /api/v1/repository/analyze endpoint)
      const appRoot = await repositoryStore.loadRepository(conversationId, githubRepository);
      if (appRoot) {
        console.log('✅ Analysis complete - repository data refreshed');
        setCurrentAppData(appRoot);
        onAppDataUpdate?.(appRoot);
        setSaveError(null);
        setLastSavedAt(new Date()); // Show success indicator
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze repository. Please try again.';
      setSaveError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [githubRepository, conversationId, onAppDataUpdate]);

  // Debug logging for currentAppData changes
  React.useEffect(() => {
    console.log('🔍 AppsCanvas: currentAppData changed:', {
      hasCurrentAppData: !!currentAppData,
      entities: currentAppData?.app?.entities?.length || 0,
      entityNames: currentAppData?.app?.entities?.map(e => e.name) || [],
      workflows: currentAppData?.app?.entities?.reduce((sum, e) => sum + (e.workflows?.length || 0), 0) || 0,
      showJsonEditor,
      isLoadingFromGitHub,
      isLoadingFromBackend,
      isSaving,
      isRefreshing,
      isPulling
    });
  }, [currentAppData, showJsonEditor, isLoadingFromGitHub, isLoadingFromBackend, isSaving, isRefreshing, isPulling]);

  // Render custom React Flow with custom node types + JSON editor
  return (
    <ReactFlowProvider>
      <div className="relative w-full h-full overflow-hidden">
        {/* Loading from GitHub Indicator - Only show if actually loading and no data yet */}
        {isLoadingFromGitHub && !currentAppData && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-white font-medium">Loading from GitHub...</span>
              </div>
            </div>
          </div>
        )}
        {/* Custom React Flow Canvas */}
        <AppsReactFlow
          workflowData={workflowData}
          onNodeDoubleClick={handleNodeDoubleClick}
          onExport={handleExport}
          onImport={handleImport}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
          onOpenJsonEditor={() => {
            console.log('📝 Opening JSON editor');
            setShowJsonEditor(true);
          }}
          onDeleteNodes={handleDeleteNodes}
          onSave={handleDirectSave}
          isSaving={isSaving}
          onRefreshFromGitHub={githubRepository ? handleRefreshFromGitHub : undefined}
          isRefreshing={isRefreshing}
          onPullChanges={conversationId ? handlePullChanges : undefined}
          isPulling={isPulling}
          onShowDiff={githubRepository ? handleShowDiff : undefined}
          onAnalyze={githubRepository && conversationId ? handleAnalyze : undefined}
          isAnalyzing={isAnalyzing}
        />

        {/* Custom JSON Editor for App Config - positioned absolutely to overlay */}
        {currentAppData && showJsonEditor && (
          <AppsJsonEditor
            appData={currentAppData}
            isOpen={showJsonEditor}
            onClose={() => {
              console.log('❌ Closing JSON editor');
              setShowJsonEditor(false);
            }}
            onSave={handleJsonEditorSave}
            onSendToChat={onSendToChat ? handleSendToChat : undefined}
            navigateToNode={jsonEditorNavigateToNode}
            onNavigated={() => setJsonEditorNavigateToNode(null)}
            isSaving={isSaving}
            palette={{
              ui: {
                panelBorder: '#475569',
                panelGradientVia: '#1e293b',
                panelGradientTo: '#0f172a',
              }
            }}
          />
        )}

        {/* Diff Modal */}
        {showDiffModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <GitCompare className="text-orange-400" size={24} />
                  Uncommitted Changes
                </h2>
                <button
                  onClick={() => {
                    setShowDiffModal(false);
                    setDiffError(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {diffError && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
                  <p className="text-red-400 text-sm">{diffError}</p>
                </div>
              )}

              {diffData && (
                <div className="space-y-4">
                  {diffData.modified.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-400 mb-2">Modified Files ({diffData.modified.length})</h3>
                      <ul className="space-y-1">
                        {diffData.modified.map((file: string, idx: number) => (
                          <li key={idx} className="text-sm text-slate-300 font-mono bg-slate-900/50 px-3 py-1 rounded">
                            {file}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {diffData.added.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-green-400 mb-2">Added Files ({diffData.added.length})</h3>
                      <ul className="space-y-1">
                        {diffData.added.map((file: string, idx: number) => (
                          <li key={idx} className="text-sm text-slate-300 font-mono bg-slate-900/50 px-3 py-1 rounded">
                            {file}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {diffData.deleted.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-400 mb-2">Deleted Files ({diffData.deleted.length})</h3>
                      <ul className="space-y-1">
                        {diffData.deleted.map((file: string, idx: number) => (
                          <li key={idx} className="text-sm text-slate-300 font-mono bg-slate-900/50 px-3 py-1 rounded">
                            {file}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {diffData.untracked.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-blue-400 mb-2">Untracked Files ({diffData.untracked.length})</h3>
                      <ul className="space-y-1">
                        {diffData.untracked.map((file: string, idx: number) => (
                          <li key={idx} className="text-sm text-slate-300 font-mono bg-slate-900/50 px-3 py-1 rounded">
                            {file}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {diffData.modified.length === 0 && diffData.added.length === 0 &&
                   diffData.deleted.length === 0 && diffData.untracked.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-slate-400">No uncommitted changes</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
};

/**
 * 🎉 ALL FEATURES ARE NOW ENABLED! 🎉
 *
 * By passing technicalId, modelName, and modelVersion, we enable:
 *
 * ✅ JSON Editor with:
 *    - Syntax highlighting
 *    - Lint/validation
 *    - Navigation to selected nodes
 *    - Schema validation (uses WorkflowCanvas schema)
 *
 * ✅ Import/Export:
 *    - Export to JSON file (Download button)
 *    - Import from JSON file (Upload button)
 *    - Export to environment (Cloud upload)
 *    - Import from environment (Cloud download)
 *
 * ✅ All Settings:
 *    - 3 Themes (Bluey-Orange, Greeny-Pink, Cyberpunk)
 *    - Layout direction (Top-Bottom, Left-Right)
 *    - Edge types (Default, Straight, Step, Smoothstep)
 *    - Grid visibility
 *    - Snap to grid
 *    - Minimap visibility
 *    - All persist to localStorage
 *
 * ✅ Question Mark (Quick Help):
 *    - Shows keyboard shortcuts
 *    - Undo/Redo instructions
 *    - Navigation tips
 *
 * ✅ Fullscreen Mode:
 *    - Toggle fullscreen button
 *    - Maximize canvas area
 *
 * ✅ And 50+ more features from WorkflowCanvas!
 */

