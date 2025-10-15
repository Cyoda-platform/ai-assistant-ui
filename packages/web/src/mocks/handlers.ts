import { http, HttpResponse, delay } from 'msw';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const MOCK_DELAY_MS = 300;

// Storage keys
const STORAGE_KEYS = {
  APP_CONFIGS: 'mock_api_app_configs',
  ENVIRONMENTS: 'mock_api_environments',
  REQUIREMENTS: 'mock_api_requirements',
  ENTITIES: 'mock_api_entities',
  WORKFLOWS: 'mock_api_workflows',
};

// Helper to get data from localStorage
const getFromStorage = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : {};
};

// Helper to save data to localStorage
const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const handlers = [
  // ==================== CREATE FROM CHAT ====================
  http.post(`${API_BASE_URL}/chat/:chatId/create`, async ({ params, request }) => {
    await delay(MOCK_DELAY_MS);

    const { chatId } = params;
    const body = await request.json() as { type: string; app_id?: string };

    console.log('🌐 [MSW] POST /chat/:chatId/create', { chatId, body });

    // Get chat message from localStorage
    const chatMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    const chatMessage = chatMessages.find((msg: any) => msg.id === chatId);

    if (!chatMessage) {
      return HttpResponse.json(
        {
          error: {
            code: 'CHAT_MESSAGE_NOT_FOUND',
            message: `Chat message with ID '${chatId}' not found`,
          },
        },
        { status: 404 }
      );
    }

    // Extract JSON from chat message
    let extractedData: any;
    try {
      const content = typeof chatMessage.text === 'string' ? chatMessage.text : JSON.stringify(chatMessage.text);
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[1]);
      } else {
        extractedData = JSON.parse(content);
      }
    } catch (error) {
      return HttpResponse.json(
        {
          error: {
            code: 'INVALID_CHAT_MESSAGE',
            message: 'Could not extract valid JSON from chat message',
          },
        },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // Create based on type
    if (body.type === 'app') {
      // Use chat ID as app ID
      const appId = chatId as string;
      const appConfig = {
        ...extractedData,
        id: appId,
        created_at: timestamp,
        updated_at: timestamp,
        environments: extractedData.environments || [],
        entities: extractedData.entities || [],
        workflows: extractedData.workflows || [],
      };

      const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);
      appConfigs[appId] = appConfig;
      saveToStorage(STORAGE_KEYS.APP_CONFIGS, appConfigs);

      return HttpResponse.json({
        id: appId,
        type: 'app',
        data: appConfig,
      });
    } else if (body.type === 'entity') {
      if (!body.app_id) {
        return HttpResponse.json(
          {
            error: {
              code: 'INVALID_REQUEST',
              message: 'app_id is required for creating entities',
            },
          },
          { status: 400 }
        );
      }

      const entityId = `entity-${extractedData.name?.toLowerCase()}-${extractedData.version || '1'}`;
      const entity = {
        ...extractedData,
        id: entityId,
        app_id: body.app_id,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const entities = getFromStorage(STORAGE_KEYS.ENTITIES);
      entities[entityId] = entity;
      saveToStorage(STORAGE_KEYS.ENTITIES, entities);

      // Update app config
      const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);
      if (appConfigs[body.app_id]) {
        if (!appConfigs[body.app_id].entities) {
          appConfigs[body.app_id].entities = [];
        }
        const existingIndex = appConfigs[body.app_id].entities.findIndex((e: any) => e.id === entityId);
        const summary = {
          id: entityId,
          name: extractedData.name,
          version: extractedData.version,
          description: extractedData.description,
        };
        if (existingIndex >= 0) {
          appConfigs[body.app_id].entities[existingIndex] = summary;
        } else {
          appConfigs[body.app_id].entities.push(summary);
        }
        appConfigs[body.app_id].updated_at = timestamp;
        saveToStorage(STORAGE_KEYS.APP_CONFIGS, appConfigs);
      }

      return HttpResponse.json({
        id: entityId,
        type: 'entity',
        data: entity,
      });
    } else if (body.type === 'workflow') {
      if (!body.app_id) {
        return HttpResponse.json(
          {
            error: {
              code: 'INVALID_REQUEST',
              message: 'app_id is required for creating workflows',
            },
          },
          { status: 400 }
        );
      }

      const workflowId = `workflow-${extractedData.name?.toLowerCase().replace(/\s+/g, '-') || 'new'}`;
      const workflow = {
        ...extractedData,
        id: workflowId,
        app_id: body.app_id,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const workflows = getFromStorage(STORAGE_KEYS.WORKFLOWS);
      workflows[workflowId] = workflow;
      saveToStorage(STORAGE_KEYS.WORKFLOWS, workflows);

      // Update app config
      const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);
      if (appConfigs[body.app_id]) {
        if (!appConfigs[body.app_id].workflows) {
          appConfigs[body.app_id].workflows = [];
        }
        const existingIndex = appConfigs[body.app_id].workflows.findIndex((w: any) => w.id === workflowId);
        const summary = {
          id: workflowId,
          name: extractedData.name,
          entity_id: extractedData.entity_id,
          description: extractedData.description,
        };
        if (existingIndex >= 0) {
          appConfigs[body.app_id].workflows[existingIndex] = summary;
        } else {
          appConfigs[body.app_id].workflows.push(summary);
        }
        appConfigs[body.app_id].updated_at = timestamp;
        saveToStorage(STORAGE_KEYS.APP_CONFIGS, appConfigs);
      }

      return HttpResponse.json({
        id: workflowId,
        type: 'workflow',
        data: workflow,
      });
    } else if (body.type === 'environment') {
      if (!body.app_id) {
        return HttpResponse.json(
          {
            error: {
              code: 'INVALID_REQUEST',
              message: 'app_id is required for creating environments',
            },
          },
          { status: 400 }
        );
      }

      const envId = `env-${extractedData.name?.toLowerCase().replace(/\s+/g, '-') || 'new'}`;
      const environment = {
        ...extractedData,
        id: envId,
        app_id: body.app_id,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const environments = getFromStorage(STORAGE_KEYS.ENVIRONMENTS);
      environments[envId] = environment;
      saveToStorage(STORAGE_KEYS.ENVIRONMENTS, environments);

      // Update app config
      const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);
      if (appConfigs[body.app_id]) {
        if (!appConfigs[body.app_id].environments) {
          appConfigs[body.app_id].environments = [];
        }
        const existingIndex = appConfigs[body.app_id].environments.findIndex((e: any) => e.id === envId);
        const summary = {
          id: envId,
          name: extractedData.name,
          url: extractedData.url,
          status: extractedData.status,
        };
        if (existingIndex >= 0) {
          appConfigs[body.app_id].environments[existingIndex] = summary;
        } else {
          appConfigs[body.app_id].environments.push(summary);
        }
        appConfigs[body.app_id].updated_at = timestamp;
        saveToStorage(STORAGE_KEYS.APP_CONFIGS, appConfigs);
      }

      return HttpResponse.json({
        id: envId,
        type: 'environment',
        data: environment,
      });
    }

    return HttpResponse.json(
      {
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid type specified',
        },
      },
      { status: 400 }
    );
  }),

  // ==================== GET APP CONFIG ====================
  http.get(`${API_BASE_URL}/apps/:appId/config`, async ({ params }) => {
    await delay(MOCK_DELAY_MS);

    const { appId } = params;
    console.log('🌐 [MSW] GET /apps/:appId/config', { appId });

    const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);
    const appConfig = appConfigs[appId as string];

    if (!appConfig) {
      return HttpResponse.json(
        {
          error: {
            code: 'APP_NOT_FOUND',
            message: `Application with ID '${appId}' not found`,
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(appConfig);
  }),

  // ==================== GET ENTITY DETAIL ====================
  http.get(`${API_BASE_URL}/apps/:appId/entities/:entityId`, async ({ params }) => {
    await delay(MOCK_DELAY_MS);

    const { appId, entityId } = params;
    console.log('🌐 [MSW] GET /apps/:appId/entities/:entityId', { appId, entityId });

    const entities = getFromStorage(STORAGE_KEYS.ENTITIES);
    let entity = entities[entityId as string];

    // If entity doesn't exist in storage, try to find it in app config and create it
    if (!entity || entity.app_id !== appId) {
      console.log('⚠️ Entity not found in storage, checking app config...');

      const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);
      const appConfig = appConfigs[appId as string];

      if (appConfig && appConfig.entities) {
        // Try to find entity in app config
        const entitySummary = appConfig.entities.find((e: any) => e.id === entityId);

        if (entitySummary) {
          // Create full entity object from summary
          const timestamp = new Date().toISOString();
          entity = {
            id: entityId as string,
            app_id: appId as string,
            name: entitySummary.name,
            version: entitySummary.version || '1',
            description: entitySummary.description || '',
            model: {
              fields: [],
              relationships: [],
            },
            workflows: [],
            created_at: timestamp,
            updated_at: timestamp,
          };

          // Save to storage for future requests
          entities[entityId as string] = entity;
          saveToStorage(STORAGE_KEYS.ENTITIES, entities);

          console.log('✅ Created entity from app config:', entity);
        }
      }

      // If still not found, create a new empty entity
      if (!entity) {
        console.log('⚠️ Entity not found in app config, creating new empty entity...');

        const timestamp = new Date().toISOString();
        const entityName = (entityId as string).replace('entity-', '').replace(/-\d+$/, '').replace(/-/g, ' ');
        const version = (entityId as string).match(/-(\d+)$/)?.[1] || '1';

        entity = {
          id: entityId as string,
          app_id: appId as string,
          name: entityName.charAt(0).toUpperCase() + entityName.slice(1),
          version: version,
          description: '',
          model: {
            fields: [],
            relationships: [],
          },
          workflows: [],
          created_at: timestamp,
          updated_at: timestamp,
        };

        // Save to storage for future requests
        entities[entityId as string] = entity;
        saveToStorage(STORAGE_KEYS.ENTITIES, entities);

        console.log('✅ Created new empty entity:', entity);
      }
    }

    return HttpResponse.json(entity);
  }),

  // ==================== GET WORKFLOW DETAIL ====================
  http.get(`${API_BASE_URL}/apps/:appId/workflows/:workflowId`, async ({ params }) => {
    await delay(MOCK_DELAY_MS);

    const { appId, workflowId } = params;
    console.log('🌐 [MSW] GET /apps/:appId/workflows/:workflowId', { appId, workflowId });

    const workflows = getFromStorage(STORAGE_KEYS.WORKFLOWS);
    let workflow = workflows[workflowId as string];

    // If workflow doesn't exist in storage, try to find it in app config and create it
    if (!workflow || workflow.app_id !== appId) {
      console.log('⚠️ Workflow not found in storage, checking app config...');

      const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);
      const appConfig = appConfigs[appId as string];

      if (appConfig && appConfig.entities) {
        // Try to find workflow in entity workflows
        for (const entitySummary of appConfig.entities) {
          if (entitySummary.workflows) {
            const workflowSummary = entitySummary.workflows.find((w: any) => w.id === workflowId);
            if (workflowSummary) {
              // Create full workflow object from summary
              const timestamp = new Date().toISOString();
              workflow = {
                id: workflowId as string,
                app_id: appId as string,
                name: workflowSummary.name,
                entity_id: workflowSummary.entity_id || entitySummary.id,
                description: workflowSummary.description || '',
                states: [],
                transitions: [],
                created_at: timestamp,
                updated_at: timestamp,
              };

              // Save to storage for future requests
              workflows[workflowId as string] = workflow;
              saveToStorage(STORAGE_KEYS.WORKFLOWS, workflows);

              console.log('✅ Created workflow from app config:', workflow);
              break;
            }
          }
        }
      }

      // If still not found, create a new empty workflow
      if (!workflow) {
        console.log('⚠️ Workflow not found in app config, creating new empty workflow...');

        const timestamp = new Date().toISOString();
        const workflowName = (workflowId as string).replace('workflow-', '').replace(/-/g, ' ');

        workflow = {
          id: workflowId as string,
          app_id: appId as string,
          name: workflowName.charAt(0).toUpperCase() + workflowName.slice(1),
          entity_id: '',
          description: '',
          states: [],
          transitions: [],
          created_at: timestamp,
          updated_at: timestamp,
        };

        // Save to storage for future requests
        workflows[workflowId as string] = workflow;
        saveToStorage(STORAGE_KEYS.WORKFLOWS, workflows);

        console.log('✅ Created new empty workflow:', workflow);
      }
    }

    return HttpResponse.json(workflow);
  }),

  // ==================== GET ENVIRONMENT DETAIL ====================
  http.get(`${API_BASE_URL}/apps/:appId/environments/:environmentId`, async ({ params }) => {
    await delay(MOCK_DELAY_MS);

    const { appId, environmentId } = params;
    console.log('🌐 [MSW] GET /apps/:appId/environments/:environmentId', { appId, environmentId });

    const environments = getFromStorage(STORAGE_KEYS.ENVIRONMENTS);
    let environment = environments[environmentId as string];

    // If environment doesn't exist in storage, try to find it in app config and create it
    if (!environment || environment.app_id !== appId) {
      console.log('⚠️ Environment not found in storage, checking app config...');

      const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);
      const appConfig = appConfigs[appId as string];

      if (appConfig && appConfig.environments) {
        // Extract environment name from ID (e.g., "environment-development" -> "development")
        const envName = (environmentId as string).replace('environment-', '');
        const envSummary = appConfig.environments.find((e: any) =>
          e.name.toLowerCase().replace(/\s+/g, '-') === envName.toLowerCase()
        );

        if (envSummary) {
          // Create full environment object from summary
          const timestamp = new Date().toISOString();
          environment = {
            id: environmentId as string,
            app_id: appId as string,
            name: envSummary.name,
            url: envSummary.url || '',
            status: envSummary.status || 'inactive',
            created_at: timestamp,
            updated_at: timestamp,
          };

          // Save to storage for future requests
          environments[environmentId as string] = environment;
          saveToStorage(STORAGE_KEYS.ENVIRONMENTS, environments);

          console.log('✅ Created environment from app config:', environment);
        }
      }

      // If still not found, create a new empty environment
      if (!environment) {
        console.log('⚠️ Environment not found in app config, creating new empty environment...');

        const timestamp = new Date().toISOString();
        const envName = (environmentId as string).replace('environment-', '').replace(/-/g, ' ');

        environment = {
          id: environmentId as string,
          app_id: appId as string,
          name: envName.charAt(0).toUpperCase() + envName.slice(1), // Capitalize first letter
          url: '',
          status: 'inactive',
          created_at: timestamp,
          updated_at: timestamp,
        };

        // Save to storage for future requests
        environments[environmentId as string] = environment;
        saveToStorage(STORAGE_KEYS.ENVIRONMENTS, environments);

        console.log('✅ Created new empty environment:', environment);
      }
    }

    return HttpResponse.json(environment);
  }),

  // ==================== GET REQUIREMENT DETAIL ====================
  http.get(`${API_BASE_URL}/apps/:appId/requirements`, async ({ params }) => {
    await delay(MOCK_DELAY_MS);

    const { appId } = params;
    console.log('🌐 [MSW] GET /apps/:appId/requirements', { appId });

    const requirements = getFromStorage(STORAGE_KEYS.REQUIREMENTS);
    let requirement = requirements[appId as string];

    // If requirement doesn't exist, try to find it in app config and create it
    if (!requirement) {
      console.log('⚠️ Requirement not found in storage, checking app config...');

      const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);
      const appConfig = appConfigs[appId as string];

      if (appConfig && appConfig.requirement) {
        // Create requirement object from app config
        const timestamp = new Date().toISOString();
        requirement = {
          app_id: appId as string,
          content: appConfig.requirement,
          created_at: timestamp,
          updated_at: timestamp,
        };

        // Save to storage for future requests
        requirements[appId as string] = requirement;
        saveToStorage(STORAGE_KEYS.REQUIREMENTS, requirements);

        console.log('✅ Created requirement from app config:', requirement);
      }

      // If still not found, create a new empty requirement
      if (!requirement) {
        console.log('⚠️ Requirement not found in app config, creating new empty requirement...');

        const timestamp = new Date().toISOString();
        requirement = {
          app_id: appId as string,
          content: '',
          created_at: timestamp,
          updated_at: timestamp,
        };

        // Save to storage for future requests
        requirements[appId as string] = requirement;
        saveToStorage(STORAGE_KEYS.REQUIREMENTS, requirements);

        console.log('✅ Created new empty requirement:', requirement);
      }
    }

    return HttpResponse.json(requirement);
  }),

  // ==================== SAVE APP CONFIG ====================
  http.put(`${API_BASE_URL}/apps/:appId/config`, async ({ params, request }) => {
    await delay(MOCK_DELAY_MS);

    const { appId } = params;
    const body = await request.json();
    console.log('🌐 [MSW] PUT /apps/:appId/config', { appId, body });

    const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);

    if (!appConfigs[appId as string]) {
      return HttpResponse.json(
        {
          error: {
            code: 'APP_NOT_FOUND',
            message: `Application with ID '${appId}' not found`,
          },
        },
        { status: 404 }
      );
    }

    const updatedConfig = {
      ...appConfigs[appId as string],
      ...body,
      id: appId,
      updated_at: new Date().toISOString(),
    };

    appConfigs[appId as string] = updatedConfig;
    saveToStorage(STORAGE_KEYS.APP_CONFIGS, appConfigs);

    return HttpResponse.json(updatedConfig);
  }),

  // ==================== SAVE ENTITY DETAIL ====================
  http.put(`${API_BASE_URL}/apps/:appId/entities/:entityId`, async ({ params, request }) => {
    await delay(MOCK_DELAY_MS);

    const { appId, entityId } = params;
    const body = await request.json();
    console.log('🌐 [MSW] PUT /apps/:appId/entities/:entityId', { appId, entityId, body });

    const entities = getFromStorage(STORAGE_KEYS.ENTITIES);
    const existingEntity = entities[entityId as string];
    const timestamp = new Date().toISOString();

    // Create or update entity (auto-create if doesn't exist)
    const updatedEntity = {
      id: entityId as string,
      app_id: appId as string,
      name: body.name || existingEntity?.name || '',
      version: body.version || existingEntity?.version || '1',
      description: body.description || existingEntity?.description || '',
      cyoda_url: body.cyoda_url || existingEntity?.cyoda_url,
      github_url: body.github_url || existingEntity?.github_url,
      model: body.model || existingEntity?.model || {},
      created_at: existingEntity?.created_at || timestamp,
      updated_at: timestamp,
    };

    entities[entityId as string] = updatedEntity;
    saveToStorage(STORAGE_KEYS.ENTITIES, entities);

    // Update app config summary
    const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);
    if (appConfigs[appId as string]) {
      if (!appConfigs[appId as string].entities) {
        appConfigs[appId as string].entities = [];
      }
      const entityIndex = appConfigs[appId as string].entities.findIndex((e: any) => e.id === entityId);
      const summary = {
        id: entityId,
        name: updatedEntity.name,
        version: updatedEntity.version,
        description: updatedEntity.description,
      };
      if (entityIndex >= 0) {
        appConfigs[appId as string].entities[entityIndex] = summary;
      } else {
        appConfigs[appId as string].entities.push(summary);
      }
      appConfigs[appId as string].updated_at = timestamp;
      saveToStorage(STORAGE_KEYS.APP_CONFIGS, appConfigs);
    }

    console.log('✅ Entity saved:', updatedEntity);
    return HttpResponse.json(updatedEntity);
  }),

  // ==================== SAVE WORKFLOW DETAIL ====================
  http.put(`${API_BASE_URL}/apps/:appId/workflows/:workflowId`, async ({ params, request }) => {
    await delay(MOCK_DELAY_MS);

    const { appId, workflowId } = params;
    const body = await request.json();
    console.log('🌐 [MSW] PUT /apps/:appId/workflows/:workflowId', { appId, workflowId, body });

    const workflows = getFromStorage(STORAGE_KEYS.WORKFLOWS);
    const existingWorkflow = workflows[workflowId as string];
    const timestamp = new Date().toISOString();

    // Create or update workflow (auto-create if doesn't exist)
    const updatedWorkflow = {
      id: workflowId as string,
      app_id: appId as string,
      entity_id: body.entity_id || existingWorkflow?.entity_id || '',
      name: body.name || existingWorkflow?.name || '',
      description: body.description || existingWorkflow?.description || '',
      cyoda_url: body.cyoda_url || existingWorkflow?.cyoda_url,
      github_url: body.github_url || existingWorkflow?.github_url,
      states: body.states || existingWorkflow?.states || {},
      model_name: body.model_name || existingWorkflow?.model_name,
      model_version: body.model_version || existingWorkflow?.model_version,
      created_at: existingWorkflow?.created_at || timestamp,
      updated_at: timestamp,
    };

    workflows[workflowId as string] = updatedWorkflow;
    saveToStorage(STORAGE_KEYS.WORKFLOWS, workflows);

    // Update app config summary
    const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);
    if (appConfigs[appId as string]) {
      if (!appConfigs[appId as string].workflows) {
        appConfigs[appId as string].workflows = [];
      }
      const workflowIndex = appConfigs[appId as string].workflows.findIndex((w: any) => w.id === workflowId);
      const summary = {
        id: workflowId,
        name: updatedWorkflow.name,
        entity_id: updatedWorkflow.entity_id,
        description: updatedWorkflow.description,
      };
      if (workflowIndex >= 0) {
        appConfigs[appId as string].workflows[workflowIndex] = summary;
      } else {
        appConfigs[appId as string].workflows.push(summary);
      }
      appConfigs[appId as string].updated_at = timestamp;
      saveToStorage(STORAGE_KEYS.APP_CONFIGS, appConfigs);
    }

    console.log('✅ Workflow saved:', updatedWorkflow);
    return HttpResponse.json(updatedWorkflow);
  }),

  // ==================== SAVE ENVIRONMENT DETAIL ====================
  http.put(`${API_BASE_URL}/apps/:appId/environments/:environmentId`, async ({ params, request }) => {
    await delay(MOCK_DELAY_MS);

    const { appId, environmentId } = params;
    const body = await request.json();
    console.log('🌐 [MSW] PUT /apps/:appId/environments/:environmentId', { appId, environmentId, body });

    const environments = getFromStorage(STORAGE_KEYS.ENVIRONMENTS);
    const existingEnvironment = environments[environmentId as string];
    const timestamp = new Date().toISOString();

    // Create or update environment (auto-create if doesn't exist)
    const updatedEnvironment = {
      id: environmentId as string,
      app_id: appId as string,
      name: body.name || existingEnvironment?.name || '',
      url: body.url || existingEnvironment?.url || '',
      status: body.status || existingEnvironment?.status || 'inactive',
      description: body.description || existingEnvironment?.description,
      config: body.config || existingEnvironment?.config || {},
      created_at: existingEnvironment?.created_at || timestamp,
      updated_at: timestamp,
    };

    environments[environmentId as string] = updatedEnvironment;
    saveToStorage(STORAGE_KEYS.ENVIRONMENTS, environments);

    // Update app config summary
    const appConfigs = getFromStorage(STORAGE_KEYS.APP_CONFIGS);
    if (appConfigs[appId as string]) {
      if (!appConfigs[appId as string].environments) {
        appConfigs[appId as string].environments = [];
      }
      const envIndex = appConfigs[appId as string].environments.findIndex((e: any) => e.id === environmentId);
      const summary = {
        id: environmentId,
        name: updatedEnvironment.name,
        url: updatedEnvironment.url,
        status: updatedEnvironment.status,
      };
      if (envIndex >= 0) {
        appConfigs[appId as string].environments[envIndex] = summary;
      } else {
        appConfigs[appId as string].environments.push(summary);
      }
      appConfigs[appId as string].updated_at = timestamp;
      saveToStorage(STORAGE_KEYS.APP_CONFIGS, appConfigs);
    }

    console.log('✅ Environment saved:', updatedEnvironment);
    return HttpResponse.json(updatedEnvironment);
  }),

  // ==================== SAVE REQUIREMENT DETAIL ====================
  http.put(`${API_BASE_URL}/apps/:appId/requirements`, async ({ params, request }) => {
    await delay(MOCK_DELAY_MS);

    const { appId } = params;
    const body = await request.json();
    console.log('🌐 [MSW] PUT /apps/:appId/requirements', { appId, body });

    const requirements = getFromStorage(STORAGE_KEYS.REQUIREMENTS);
    const existingRequirement = requirements[appId as string];
    const timestamp = new Date().toISOString();

    // Create or update requirement (auto-create if doesn't exist)
    const updatedRequirement = {
      app_id: appId as string,
      content: body.content || existingRequirement?.content || '',
      format: body.format || existingRequirement?.format || 'markdown',
      created_at: existingRequirement?.created_at || timestamp,
      updated_at: timestamp,
    };

    requirements[appId as string] = updatedRequirement;
    saveToStorage(STORAGE_KEYS.REQUIREMENTS, requirements);

    console.log('✅ Requirement saved:', updatedRequirement);
    return HttpResponse.json(updatedRequirement);
  }),
];

