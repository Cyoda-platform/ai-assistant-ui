import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppsTabsStore } from '@/stores/appsTabs';
import { AppsCanvas, sampleAppData, emptyAppTemplate } from '../AppsCanvas';
import { Modal, Form, Input, InputNumber } from 'antd';
import { FileCode2 } from 'lucide-react';
import type { AppRoot } from '../AppsCanvas/types/appSchema';
import type { CanvasTab } from '../AppsCanvas/types/apps';
import apiService from '@/services/apiService';
import { useRepositoryStore } from '@/stores/repository';
import type { GitHubRepositoryInfo } from '@/services/githubAppDataService';

interface AppsTabsContainerProps {
  chatId?: string; // Chat ID to use as app ID
  githubRepository?: GitHubRepositoryInfo; // GitHub repository info for loading from GitHub
  onSendToChat?: (appJson: string) => void;
  onNavigate?: (tab: CanvasTab, targetId: string, data?: any) => void;
  shouldReload?: boolean; // Trigger to reload app data from API
  onReloadComplete?: () => void; // Callback when reload is complete
  onAppDataChange?: (appData: AppRoot, updateFn: (appData: AppRoot) => void) => void; // Callback when app data changes (for sharing with other tabs)
}

export const AppsTabsContainer: React.FC<AppsTabsContainerProps> = ({
  chatId,
  githubRepository,
  onSendToChat,
  onNavigate,
  shouldReload = false,
  onReloadComplete,
  onAppDataChange
}) => {
  const navigate = useNavigate();
  const { tabs, activeTabId, openTab, updateTab, getActiveTab, setActiveTab, closeOtherTabs } = useAppsTabsStore();
  const { getRepositoryData, updateLocalData } = useRepositoryStore();

  const activeTab = getActiveTab();

  // DISABLED: Subscribe to repository store changes - let AppsCanvas handle fresh data loading
  // const repositoryData = useRepositoryStore((state) =>
  //   chatId ? state.getRepositoryData(chatId) : null
  // );

  // Track app data for each tab
  const [tabAppData, setTabAppData] = useState<Record<string, AppRoot>>({});

  // DISABLED: React to repository store changes - AppsCanvas handles fresh data loading
  // useEffect(() => {
  //   if (repositoryData && activeTab && chatId) {
  //     console.log('📦 Repository store updated, refreshing tab data:', {
  //       tabId: activeTab.id,
  //       entities: repositoryData.app.entities.length,
  //       workflows: repositoryData.app.entities.reduce((sum, e) => sum + e.workflows.length, 0)
  //     });

  //     setTabAppData(prev => ({
  //       ...prev,
  //       [activeTab.id]: repositoryData
  //     }));
  //   }
  // }, [repositoryData, activeTab, chatId]);

  // Track if we just updated data programmatically (to avoid reloading and wiping it out)
  const [justUpdatedData, setJustUpdatedData] = useState(false);

  // Track if we've loaded from backend for this chat
  const hasLoadedFromBackendRef = useRef(false);
  const lastLoadedChatIdRef = useRef<string | null>(null);

  // Load app data from cache when chatId is available
  // Note: AppsCanvas handles the actual loading from /analyze endpoint
  // This component just uses the cached data
  useEffect(() => {
    if (!chatId || !activeTab) return;

    // Reset ref if chatId changed
    if (lastLoadedChatIdRef.current !== chatId) {
      console.log('🔄 AppsTabsContainer: Chat ID changed, resetting load state');
      hasLoadedFromBackendRef.current = false;
      lastLoadedChatIdRef.current = chatId;
    }

    // Skip if already loaded for this chat
    if (hasLoadedFromBackendRef.current) {
      console.log('⏭️ AppsTabsContainer: Already loaded for chat:', chatId);
      return;
    }

    // DISABLED: Get cached repository data - always let AppsCanvas load fresh data
    // const cachedData = getRepositoryData(chatId);
    // if (cachedData) {
    //   console.log('📦 AppsTabsContainer: Using cached repository data');
    //   setTabAppData(prev => ({
    //     ...prev,
    //     [activeTab.id]: cachedData
    //   }));
    //   hasLoadedFromBackendRef.current = true;
    // } else {
    //   console.log('⏳ AppsTabsContainer: No cached data yet, waiting for AppsCanvas to load');
    // }
    console.log('🔄 AppsTabsContainer: Skipping cached data, letting AppsCanvas load fresh data');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, activeTab?.id]);

  // Reload app data from API when requested
  useEffect(() => {
    if (!shouldReload || !activeTab) return;

    // If we just updated data programmatically, skip the reload
    if (justUpdatedData) {
      console.log('⏭️ Skipping reload - data was just updated programmatically');
      setJustUpdatedData(false);
      onReloadComplete?.();
      return;
    }

    const reloadAppData = async () => {
      try {
        const appId = chatId || activeTab.technicalId;
        console.log('🔄 Reloading app data from repository store for appId:', appId);

        // First, try to get fresh data from repository store (after analyze operation)
        const repositoryData = getRepositoryData(appId);

        if (repositoryData) {
          console.log('✅ Using fresh repository data from analyze operation:', {
            entities: repositoryData.app.entities.length,
            workflows: repositoryData.app.entities.reduce((sum, e) => sum + e.workflows.length, 0),
            environments: repositoryData.app.environments?.length || 0
          });

          // Use the fresh repository data
          setTabAppData(prev => ({
            ...prev,
            [activeTab.id]: repositoryData
          }));

          onReloadComplete?.();
          return;
        }

        // Fallback: Get current app data from tabAppData or build default
        let currentData = tabAppData[activeTab.id];

        // If no custom data, build default data
        if (!currentData) {
          if (activeTab.modelName.startsWith('new-app-')) {
            currentData = {
              app: {
                ...emptyAppTemplate.app,
                id: appId,
                name: activeTab.displayName,
              }
            };
          } else {
            currentData = emptyAppTemplate;
          }
        }

        // Fallback: Load from localStorage (legacy behavior for non-repository apps)
        console.log('⚠️ No repository data found, falling back to localStorage');

        // Helper to get chat-specific storage key
        const getChatId = () => {
          const path = window.location.pathname || window.location.hash;
          const match = path.match(/\/chat\/([^\/\?#]+)/);
          return match ? match[1] : 'default';
        };

        const currentChatId = getChatId();

        // Reload environments from localStorage (mock API storage) using chat-specific keys
        const environmentsData = localStorage.getItem(`mock_api_environments_chat_${currentChatId}`);
        const entitiesData = localStorage.getItem(`mock_api_entities_chat_${currentChatId}`);
        const workflowsData = localStorage.getItem(`mock_api_workflows_chat_${currentChatId}`);

        let appEnvironments: any[] = [];
        let appEntities: any[] = [];

        // Parse and filter environments from localStorage
        let savedEnvironments: any[] = [];
        if (environmentsData) {
          try {
            const allEnvironments = JSON.parse(environmentsData);
            savedEnvironments = Object.values(allEnvironments)
              .filter((env: any) => env.app_id === appId)
              .map((env: any) => ({
                name: env.name,
                url: env.url,
                status: env.status,
                description: env.description || '',
                config: env.config || {}
              }));
          } catch (parseErr) {
            console.error('❌ Failed to parse environments data:', parseErr);
          }
        }

        // Merge current environments with saved environments
        const currentEnvironments = currentData.app.environments || [];
        const mergedEnvironments = [...currentEnvironments];

        // Update or add environments from localStorage
        savedEnvironments.forEach(savedEnv => {
          const existingIndex = mergedEnvironments.findIndex(
            e => e.name === savedEnv.name
          );

          if (existingIndex >= 0) {
            // Update existing environment with saved data
            mergedEnvironments[existingIndex] = savedEnv;
          } else {
            // Add new environment from localStorage
            mergedEnvironments.push(savedEnv);
          }
        });

        appEnvironments = mergedEnvironments;

        // Parse and filter entities from localStorage
        let savedEntities: any[] = [];
        if (entitiesData) {
          try {
            const allEntities = JSON.parse(entitiesData);
            const filteredEntities = Object.values(allEntities)
              .filter((entity: any) => entity.app_id === appId);

            // Parse workflows for each entity
            let allWorkflows: any[] = [];
            if (workflowsData) {
              try {
                const parsedWorkflows = JSON.parse(workflowsData);
                allWorkflows = Object.values(parsedWorkflows);
                console.log('📦 All workflows from storage:', allWorkflows);
              } catch (parseErr) {
                console.error('❌ Failed to parse workflows data:', parseErr);
              }
            }

            // Build entities with their workflows
            savedEntities = filteredEntities.map((entity: any) => {
              console.log('🔍 Processing entity:', entity.id, entity.name, 'version:', entity.version);

              // Find workflows for this entity - match by entity_id OR by model_name/model_version
              const entityWorkflows = allWorkflows
                .filter((wf: any) => {
                  // Match by entity_id
                  const matchesById = wf.entity_id === entity.id;

                  // Match by model_name and model_version (for workflows saved with these fields)
                  const matchesByModel = wf.model_name === entity.name &&
                                        wf.model_version?.toString() === entity.version?.toString();

                  const matches = matchesById || matchesByModel;

                  console.log(`  Workflow "${wf.name}" - entity_id: "${wf.entity_id}", model: ${wf.model_name}:${wf.model_version} -> matches entity "${entity.id}" (${entity.name}:${entity.version})? ${matches}`);
                  return matches;
                })
                .map((wf: any) => {
                  console.log('📥 Loading workflow from storage:', {
                    id: wf.id,
                    name: wf.name,
                    hasStates: !!wf.states,
                    states: wf.states,
                    fullWorkflow: wf
                  });
                  const loadedWorkflow = {
                    id: wf.id, // Include workflow ID for proper identification
                    name: wf.name,
                    description: wf.description || '',
                    cyoda_url: wf.cyoda_url || '',
                    github_url: wf.github_url || '',
                    config: {
                      states: wf.states || {}
                    }
                  };
                  console.log('📥 Loaded workflow:', loadedWorkflow);
                  return loadedWorkflow;
                });

              console.log(`  ✅ Found ${entityWorkflows.length} workflows for entity "${entity.name}:${entity.version}"`);

              // Copy ALL fields from entity EXCEPT API-specific ones
              // This preserves any custom fields the user added
              const { id, app_id, created_at, updated_at, ...entityForAppConfig } = entity;

              return {
                ...entityForAppConfig, // Spread all custom fields
                workflows: entityWorkflows // Override workflows with loaded ones
              };
            });
          } catch (parseErr) {
            console.error('❌ Failed to parse entities data:', parseErr);
          }
        }

        // Merge current entities with saved entities
        // Keep entities from current data that aren't in localStorage yet
        const currentEntities = currentData.app.entities || [];
        const mergedEntities = [...currentEntities];

        // Update or add entities from localStorage
        savedEntities.forEach(savedEntity => {
          const existingIndex = mergedEntities.findIndex(
            e => e.name === savedEntity.name && e.version === savedEntity.version
          );

          if (existingIndex >= 0) {
            // Merge workflows: keep workflows from current data and add/update from saved data
            const currentEntity = mergedEntities[existingIndex];
            const currentWorkflows = currentEntity.workflows || [];
            const savedWorkflows = savedEntity.workflows || [];

            // Create a map of current workflows by name
            const workflowMap = new Map();
            currentWorkflows.forEach(wf => workflowMap.set(wf.name, wf));

            // Update or add workflows from saved data
            savedWorkflows.forEach(savedWf => {
              workflowMap.set(savedWf.name, savedWf);
            });

            // Convert map back to array
            const mergedWorkflows = Array.from(workflowMap.values());

            console.log(`🔄 Merging entity "${savedEntity.name}":`, {
              currentWorkflows: currentWorkflows.length,
              savedWorkflows: savedWorkflows.length,
              mergedWorkflows: mergedWorkflows.length
            });

            // Update existing entity with merged data
            mergedEntities[existingIndex] = {
              ...savedEntity,
              workflows: mergedWorkflows
            };
          } else {
            // Add new entity from localStorage
            mergedEntities.push(savedEntity);
          }
        });

        appEntities = mergedEntities;

        // Update app data with reloaded data
        const updatedData = {
          ...currentData,
          app: {
            ...currentData.app,
            environments: appEnvironments,
            entities: appEntities
          }
        };

        console.log('✅ App data reloaded successfully:', {
          environments: appEnvironments.length,
          entities: appEntities.length,
          workflows: appEntities.reduce((sum, e) => sum + e.workflows.length, 0),
          fullData: updatedData
        });

        setTabAppData(prev => ({
          ...prev,
          [activeTab.id]: updatedData
        }));
      } catch (err: any) {
        console.error('❌ Failed to reload app data:', err);
      } finally {
        // Notify that reload is complete
        onReloadComplete?.();
      }
    };

    reloadAppData();
  }, [shouldReload, activeTab, chatId, onReloadComplete, tabAppData, justUpdatedData]);

  // URL parameter handling removed - app tabs are auto-created based on chatId

  // Determine which template to use for the current tab
  const appData = useMemo((): AppRoot => {
    if (!activeTab) return emptyAppTemplate;

    // If we have custom data for this tab, use it
    if (tabAppData[activeTab.id]) {
      console.log('📊 appData useMemo recalculated:', {
        tabId: activeTab.id,
        entities: tabAppData[activeTab.id].app.entities.length,
        workflows: tabAppData[activeTab.id].app.entities.reduce((sum, e) => sum + e.workflows.length, 0),
        data: tabAppData[activeTab.id]
      });
      return tabAppData[activeTab.id];
    }

    // For new apps, check if there's app data in localStorage with this technical ID
    if (activeTab.modelName.startsWith('new-app-')) {
      // Try to load from localStorage first (created via "View in Canvas")
      const storedAppData = localStorage.getItem('appData');
      if (storedAppData) {
        try {
          const parsed = JSON.parse(storedAppData);
          if (parsed.app && parsed.app.id) {
            // Use stored app data if it exists
            return parsed;
          }
        } catch (e) {
          console.error('Failed to parse stored app data:', e);
        }
      }

      // Use chat ID as app ID (if provided), otherwise use technical ID
      const appId = chatId || activeTab.technicalId;

      console.log('📱 Using app ID:', appId, { chatId, technicalId: activeTab.technicalId });

      return {
        app: {
          ...emptyAppTemplate.app,
          id: appId, // Use chat ID as app ID
          name: activeTab.displayName, // Use the tab's display name as the app name
        }
      };
    }

    // For chat-based tabs (modelName is chatId), check if we're loading repository data
    if (chatId && githubRepository) {
      // If we're loading repository data, return a placeholder with the chat ID
      // This will be replaced once the repository data loads
      const appId = chatId;

      return {
        app: {
          ...emptyAppTemplate.app,
          id: appId,
          name: activeTab.displayName || 'Loading...',
        }
      };
    }

    // Otherwise use empty template for new chats
    return emptyAppTemplate;
  }, [activeTab, tabAppData, chatId]);

  // Create update function for external components
  const handleExternalAppDataUpdate = useCallback((updatedAppData: AppRoot) => {
    if (!activeTab) return;

    console.log('🔧 handleExternalAppDataUpdate called:', {
      tabId: activeTab.id,
      entities: updatedAppData.app.entities.length,
      workflows: updatedAppData.app.entities.reduce((sum, e) => sum + e.workflows.length, 0),
      updatedAppData
    });

    // Mark that we just updated data programmatically
    setJustUpdatedData(true);

    // Update the tab app data
    setTabAppData(prev => {
      const newState = {
        ...prev,
        [activeTab.id]: updatedAppData
      };
      console.log('📝 Updated tabAppData via handleExternalAppDataUpdate:', {
        tabId: activeTab.id,
        newState
      });
      return newState;
    });
    updateTab(activeTab.id, { isDirty: true });
  }, [activeTab, updateTab]);

  // Use ref to store the latest update function to avoid triggering effect on every change
  const handleExternalAppDataUpdateRef = useRef(handleExternalAppDataUpdate);
  useEffect(() => {
    handleExternalAppDataUpdateRef.current = handleExternalAppDataUpdate;
  }, [handleExternalAppDataUpdate]);

  // Create a stable wrapper function that uses the ref
  const stableHandleExternalAppDataUpdate = useCallback((updatedAppData: AppRoot) => {
    handleExternalAppDataUpdateRef.current(updatedAppData);
  }, []);

  // Notify parent when app data changes
  // Use stable wrapper to prevent infinite loops
  useEffect(() => {
    if (onAppDataChange) {
      console.log('🔔 Calling onAppDataChange with updated appData:', {
        entities: appData.app.entities.length,
        workflows: appData.app.entities.reduce((sum, e) => sum + e.workflows.length, 0),
        appData
      });
      onAppDataChange(appData, stableHandleExternalAppDataUpdate);
    }
  }, [appData, onAppDataChange, stableHandleExternalAppDataUpdate]);

  // Check if the current app should use simplified view
  // Use simplified view only if it's a new app AND has no environments/entities
  const isSimplified = useMemo(() => {
    if (!activeTab) {
      return false;
    }

    // For chat-based tabs with GitHub repository, never use simplified view
    // These tabs load repository data and should show the full view
    if (chatId && githubRepository && activeTab.modelName === chatId) {
      return false;
    }

    // Only use simplified view for explicitly new apps
    if (!activeTab.modelName.startsWith('new-app-')) {
      return false;
    }

    // Show simplified view if no environments or entities have been added
    return (appData.app.environments?.length ?? 0) === 0 && (appData.app.entities?.length ?? 0) === 0;
  }, [activeTab, appData, tabAppData, chatId, githubRepository]);

  // Auto-create app tab for the current chat (one app per chat)
  useEffect(() => {
    // Only create tab if:
    // 1. We have a chatId (we're in a chat context)
    // 2. No tabs exist yet OR the existing tab doesn't match this chat
    if (!chatId) return;

    const existingTab = tabs.find(t => t.technicalId === chatId);

    if (!existingTab) {
      console.log('📱 Auto-creating app tab for chat:', chatId);

      // Use chat ID as the technical ID for the app
      // This ensures one app per chat
      openTab({
        modelName: chatId, // Use chat ID as model name
        modelVersion: 1,
        displayName: 'App', // Default name, will be updated by AI
        isDirty: false,
        technicalId: chatId, // Use chat ID as technical ID
      });
    } else if (activeTabId !== chatId) {
      // If tab exists but isn't active, close other tabs and activate this one
      // This ensures only one tab (for this chat) is open at a time
      console.log('📱 Switching to existing app tab for chat:', chatId);
      closeOtherTabs(chatId);
    }
  }, [chatId, tabs, activeTabId, openTab, setActiveTab, closeOtherTabs]); // Run when chatId or tabs change

  const handleAppUpdate = useCallback((tabId: string, data: { canvasData: string; appMetaData: any }) => {
    // Mark tab as dirty when app is updated
    updateTab(tabId, { isDirty: true });
  }, [updateTab]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Content Area - no tab bar needed (one app per chat) */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab ? (
          <div key={activeTab.id} className="h-full">
            <AppsCanvas
              appData={appData}
              conversationId={chatId} // Pass conversation ID for backend persistence
              githubRepository={githubRepository} // Pass GitHub repository info for loading from GitHub
              simplified={isSimplified} // Use simplified view for new apps without items
              onNavigate={(tab, targetId) => {
                console.log('Navigate to:', tab, targetId);

                // Extract data from appData based on targetId
                let data = null;
                if (tab === 'requirement') {
                  // App root node - pass the entire app data
                  data = appData.app;
                } else if (tab === 'data') {
                  // Find entity by ID
                  // Entity ID format: "entity-{name}-{version}"
                  // Example: "entity-pet-1" -> name="pet", version="1"
                  const entityIdParts = targetId.replace('entity-', '').split('-');
                  const version = entityIdParts[entityIdParts.length - 1]; // Last part is version
                  const entityName = entityIdParts.slice(0, -1).join('-'); // Everything before version is name

                  console.log('🔍 Looking for entity:', { entityName, version, targetId, allEntities: appData.app.entities });

                  data = appData.app.entities.find(e => {
                    const nameMatch = e.name.toLowerCase().replace(/\s+/g, '-') === entityName.toLowerCase();
                    const versionMatch = e.version.toLowerCase().replace(/\s+/g, '-') === version.toLowerCase();
                    console.log('  Checking entity:', e.name, e.version, { nameMatch, versionMatch });
                    return nameMatch && versionMatch;
                  });

                  console.log('✅ Found entity:', data);
                } else if (tab === 'workflow') {
                  // Find workflow by ID
                  const workflowName = targetId.replace('workflow-', '').replace(/-/g, ' ');
                  for (const entity of appData.app.entities) {
                    const workflow = entity.workflows.find(w => w.name === workflowName);
                    if (workflow) {
                      data = workflow;
                      break;
                    }
                  }
                }

                // Call parent navigation handler with app ID included in data
                const dataWithAppId = data ? { ...data, appId: appData.app.id } : { appId: appData.app.id };
                onNavigate?.(tab, targetId, dataWithAppId);
              }}
              onAppDataUpdate={async (updatedAppData) => {
                console.log('📥 AppsCanvas called onAppDataUpdate:', {
                  tabId: activeTab.id,
                  entities: updatedAppData.app.entities.length,
                  workflows: updatedAppData.app.entities.reduce((sum, e) => sum + e.workflows.length, 0),
                  updatedAppData
                });

                // Mark that we just updated data programmatically
                // This prevents the reload logic from wiping out our changes
                setJustUpdatedData(true);

                // Store the updated data for this tab
                setTabAppData(prev => {
                  const newState = {
                    ...prev,
                    [activeTab.id]: updatedAppData
                  };
                  console.log('📝 Updated tabAppData state:', {
                    tabId: activeTab.id,
                    newState
                  });
                  return newState;
                });
                updateTab(activeTab.id, { isDirty: true });
                console.log('✅ Updated tabAppData and marked tab as dirty');

                // Also persist to localStorage (mock API storage) so data persists when switching tabs
                try {
                  const appId = chatId || activeTab.technicalId;

                  // Helper to get chat-specific storage key
                  const getChatId = () => {
                    const path = window.location.pathname || window.location.hash;
                    const match = path.match(/\/chat\/([^\/\?#]+)/);
                    return match ? match[1] : 'default';
                  };

                  const currentChatId = getChatId();
                  const environmentsKey = `mock_api_environments_chat_${currentChatId}`;
                  const entitiesKey = `mock_api_entities_chat_${currentChatId}`;
                  const workflowsKey = `mock_api_workflows_chat_${currentChatId}`;

                  // Save environments to mock API storage (if they exist)
                  if (updatedAppData.app.environments && updatedAppData.app.environments.length > 0) {
                    const environmentsStorage = JSON.parse(localStorage.getItem(environmentsKey) || '{}');
                    updatedAppData.app.environments.forEach((env: any) => {
                      const envId = `environment-${env.name.toLowerCase().replace(/\s+/g, '-')}`;
                      environmentsStorage[envId] = {
                        id: envId,
                        app_id: appId,
                        name: env.name,
                        url: env.url || '',
                        status: env.status || 'inactive',
                        description: env.description || '',
                        config: env.config || {},
                        created_at: environmentsStorage[envId]?.created_at || new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      };
                    });
                    localStorage.setItem(environmentsKey, JSON.stringify(environmentsStorage));
                  }

                  // Save entities to mock API storage
                  if (updatedAppData.app.entities && updatedAppData.app.entities.length > 0) {
                    const entitiesStorage = JSON.parse(localStorage.getItem(entitiesKey) || '{}');
                    updatedAppData.app.entities.forEach((entity: any) => {
                      const entityId = `entity-${entity.name.toLowerCase()}-${entity.version || '1'}`;
                      entitiesStorage[entityId] = {
                        id: entityId,
                        app_id: appId,
                        name: entity.name,
                        version: entity.version || '1',
                        description: entity.description || '',
                        cyoda_url: entity.cyoda_url || '',
                        github_url: entity.github_url || '',
                        model: entity.model || {},
                        created_at: entitiesStorage[entityId]?.created_at || new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      };
                    });
                    localStorage.setItem(entitiesKey, JSON.stringify(entitiesStorage));
                  }

                  // Save workflows to mock API storage
                  if (updatedAppData.app.entities && updatedAppData.app.entities.length > 0) {
                    const workflowsStorage = JSON.parse(localStorage.getItem(workflowsKey) || '{}');
                    updatedAppData.app.entities.forEach((entity: any) => {
                      const entityId = `entity-${entity.name.toLowerCase()}-${entity.version || '1'}`;
                      entity.workflows?.forEach((workflow: any) => {
                        const workflowId = workflow.id || `workflow-${workflow.name.toLowerCase().replace(/\s+/g, '-')}`;
                        workflowsStorage[workflowId] = {
                          id: workflowId,
                          app_id: appId,
                          entity_id: entityId,
                          name: workflow.name,
                          description: workflow.description || '',
                          cyoda_url: workflow.cyoda_url || '',
                          github_url: workflow.github_url || '',
                          states: workflow.config?.states || {},
                          model_name: entity.name,
                          model_version: entity.version || '1',
                          created_at: workflowsStorage[workflowId]?.created_at || new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        };
                      });
                    });
                    localStorage.setItem(workflowsKey, JSON.stringify(workflowsStorage));
                  }

                  console.log('✅ App data persisted to chat-specific localStorage');
                } catch (err) {
                  console.error('❌ Failed to persist app data:', err);
                }
              }}
              onSendToChat={onSendToChat}
            />
          </div>
        ) : (
          // Empty state when no tabs are open
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileCode2 size={64} className="mx-auto mb-4 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-300 mb-2">
                No App Open
              </h2>
              <p className="text-gray-500 mb-6">
                Start a new chat to create an app
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

