import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppsTabs } from './AppsTabs';
import { useAppsTabsStore } from '@/stores/appsTabs';
import { AppsCanvas, sampleAppData, emptyAppTemplate } from '../AppsCanvas';
import { NewAppDialog } from '../AppsCanvas/NewAppDialog';
import { Modal, Form, Input, InputNumber, Button } from 'antd';
import { FileCode2 } from 'lucide-react';
import type { AppRoot } from '../AppsCanvas/types/appSchema';
import type { CanvasTab } from '../AppsCanvas/types/apps';
import apiService from '@/services/apiService';

interface AppsTabsContainerProps {
  chatId?: string; // Chat ID to use as app ID
  onSendToChat?: (appJson: string) => void;
  onNavigate?: (tab: CanvasTab, targetId: string, data?: any) => void;
  shouldReload?: boolean; // Trigger to reload app data from API
  onReloadComplete?: () => void; // Callback when reload is complete
}

export const AppsTabsContainer: React.FC<AppsTabsContainerProps> = ({
  chatId,
  onSendToChat,
  onNavigate,
  shouldReload = false,
  onReloadComplete
}) => {
  const navigate = useNavigate();
  const { tabs, activeTabId, openTab, updateTab, getActiveTab } = useAppsTabsStore();

  const activeTab = getActiveTab();

  // Track app data for each tab
  const [tabAppData, setTabAppData] = useState<Record<string, AppRoot>>({});

  // State for new app dialog
  const [isNewAppDialogOpen, setIsNewAppDialogOpen] = useState(false);

  // Reload app data from API when requested
  useEffect(() => {
    if (!shouldReload || !activeTab) return;

    const reloadAppData = async () => {
      try {
        const appId = chatId || activeTab.technicalId;
        console.log('🔄 Reloading app data from localStorage for appId:', appId);

        // Get current app data from tabAppData or build default
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
            currentData = sampleAppData;
          }
        }

        // Reload environments from localStorage (mock API storage)
        const environmentsData = localStorage.getItem('mock_api_environments');
        const entitiesData = localStorage.getItem('mock_api_entities');
        const workflowsData = localStorage.getItem('mock_api_workflows');

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
                .map((wf: any) => ({
                  id: wf.id, // Include workflow ID for proper identification
                  name: wf.name,
                  cyoda_url: wf.cyoda_url || '',
                  github_url: wf.github_url || '',
                  config: {
                    states: wf.states || {}
                  }
                }));

              console.log(`  ✅ Found ${entityWorkflows.length} workflows for entity "${entity.name}:${entity.version}"`);


              return {
                name: entity.name,
                version: entity.version || '1',
                description: entity.description || '',
                cyoda_url: entity.cyoda_url || '',
                github_url: entity.github_url || '',
                model: entity.model || {},
                workflows: entityWorkflows
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

        setTabAppData(prev => ({
          ...prev,
          [activeTab.id]: updatedData
        }));

        console.log('✅ App data reloaded successfully:', {
          environments: appEnvironments.length,
          entities: appEntities.length,
          workflows: appEntities.reduce((sum, e) => sum + e.workflows.length, 0)
        });
      } catch (err: any) {
        console.error('❌ Failed to reload app data:', err);
      } finally {
        // Notify that reload is complete
        onReloadComplete?.();
      }
    };

    reloadAppData();
  }, [shouldReload, activeTab, chatId, onReloadComplete, tabAppData]);

  // Check URL parameters for new app creation
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newAppName = urlParams.get('newAppName');

    if (newAppName) {
      // Generate a unique model name using timestamp
      const timestamp = Date.now();
      const modelName = `new-app-${timestamp}`;
      const modelVersion = 1;
      const technicalId = `${modelName}_v${modelVersion}_${timestamp}`;

      // Create a new app tab with the specified name
      openTab({
        modelName,
        modelVersion,
        displayName: newAppName,
        isDirty: false,
        technicalId,
      });

      console.log('✅ New app tab created from URL:', { modelName, appName: newAppName });

      // Clean up URL parameters
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]newAppName=[^&]+/, '').replace(/^&/, '?');
      window.history.replaceState({}, '', newUrl);
    }
  }, [openTab]);

  // Determine which template to use for the current tab
  const appData = useMemo((): AppRoot => {
    if (!activeTab) return sampleAppData;

    // If we have custom data for this tab, use it
    if (tabAppData[activeTab.id]) {
      return tabAppData[activeTab.id];
    }

    // For new apps, check if there's app data in localStorage with this technical ID
    if (activeTab.modelName.startsWith('new-app-')) {
      // Try to load from localStorage first (created via "Add to Canvas")
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

    // Otherwise use sample data
    return sampleAppData;
  }, [activeTab, tabAppData]);

  // Check if the current app should use simplified view
  // Use simplified view only if it's a new app AND has no environments/entities
  const isSimplified = useMemo(() => {
    if (!activeTab || !activeTab.modelName.startsWith('new-app-')) {
      return false;
    }

    // Show simplified view if no environments or entities have been added
    return appData.app.environments.length === 0 && appData.app.entities.length === 0;
  }, [activeTab, appData]);

  // Auto-open sample app when canvas is first opened (no tabs exist)
  useEffect(() => {
    // Only auto-open if there are no tabs at all
    if (tabs.length === 0) {
      console.log('📱 Auto-opening sample app tab on canvas initialization');

      // Create a sample app tab
      const timestamp = Date.now();
      const modelName = 'pet-store';
      const modelVersion = 1;
      const technicalId = `${modelName}_v${modelVersion}_${timestamp}`;

      openTab({
        modelName,
        modelVersion,
        displayName: 'Pet Store (Sample)',
        isDirty: false,
        technicalId,
      });
    }
  }, [tabs.length, openTab]); // Run when tabs.length changes or openTab changes

  // Open new app dialog when user clicks + button
  const handleNewTab = useCallback(() => {
    setIsNewAppDialogOpen(true);
  }, []);

  // Handle successful app creation - navigate to chat with app name
  const handleAppCreated = useCallback((chatId: string, appName: string) => {
    console.log('✅ App creation initiated:', { chatId, appName });

    // Navigate to the chat view with canvas, history open, and app name in URL
    // The app tab will be created by the useEffect when the component loads in ChatBotView
    navigate(`/chat/${chatId}?openCanvas=true&openHistory=true&newAppName=${encodeURIComponent(appName)}`);
  }, [navigate]);

  const handleAppUpdate = useCallback((tabId: string, data: { canvasData: string; appMetaData: any }) => {
    // Mark tab as dirty when app is updated
    updateTab(tabId, { isDirty: true });
  }, [updateTab]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* New App Dialog */}
      <NewAppDialog
        isOpen={isNewAppDialogOpen}
        onClose={() => setIsNewAppDialogOpen(false)}
        onSuccess={handleAppCreated}
      />

      {/* Tab Bar */}
      <AppsTabs onNewTab={handleNewTab} />

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab ? (
          <div key={activeTab.id} className="h-full">
            <AppsCanvas
              appData={appData}
              simplified={isSimplified} // Use simplified view for new apps without items
              onNavigate={(tab, targetId) => {
                console.log('Navigate to:', tab, targetId);

                // Extract data from appData based on targetId
                let data = null;
                if (tab === 'requirement') {
                  // App root node - pass the entire app data
                  data = appData.app;
                } else if (tab === 'environments') {
                  // Find environment by ID
                  const envName = targetId.replace('environment-', '');
                  data = appData.app.environments.find(e => e.name === envName);
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
                console.log('App data updated:', updatedAppData);
                // Store the updated data for this tab
                setTabAppData(prev => ({
                  ...prev,
                  [activeTab.id]: updatedAppData
                }));
                updateTab(activeTab.id, { isDirty: true });

                // Also persist to localStorage (mock API storage) so data persists when switching tabs
                try {
                  const appId = chatId || activeTab.technicalId;

                  // Save environments to mock API storage (if they exist)
                  if (updatedAppData.app.environments && updatedAppData.app.environments.length > 0) {
                    const environmentsStorage = JSON.parse(localStorage.getItem('mock_api_environments') || '{}');
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
                    localStorage.setItem('mock_api_environments', JSON.stringify(environmentsStorage));
                  }

                  // Save entities to mock API storage
                  if (updatedAppData.app.entities && updatedAppData.app.entities.length > 0) {
                    const entitiesStorage = JSON.parse(localStorage.getItem('mock_api_entities') || '{}');
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
                    localStorage.setItem('mock_api_entities', JSON.stringify(entitiesStorage));
                  }

                  // Save workflows to mock API storage
                  if (updatedAppData.app.entities && updatedAppData.app.entities.length > 0) {
                    const workflowsStorage = JSON.parse(localStorage.getItem('mock_api_workflows') || '{}');
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
                    localStorage.setItem('mock_api_workflows', JSON.stringify(workflowsStorage));
                  }

                  console.log('✅ App data persisted to localStorage');
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
                Click the + button to create a new app
              </p>
              <Button
                type="primary"
                size="large"
                onClick={handleNewTab}
                className="bg-blue-600 hover:bg-blue-700"
              >
                New App
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

