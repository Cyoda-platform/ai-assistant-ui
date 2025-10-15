/**
 * Mock API Service
 *
 * This service provides mock implementations of all API endpoints
 * until the backend is ready. It uses localStorage for persistence.
 */

// ============================================================================
// Types
// ============================================================================

export interface AppConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  programming_language: 'python' | 'java';
  created_at: string;
  updated_at: string;
  environments: EnvironmentSummary[];
  entities: EntitySummary[];
  workflows: WorkflowSummary[];
}

export interface EnvironmentSummary {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export interface EntitySummary {
  id: string;
  name: string;
  version: string;
  description: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  entity_id: string;
  description: string;
}

export interface Environment {
  id: string;
  app_id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive' | 'maintenance';
  description?: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Requirement {
  id: string;
  app_id: string;
  content: string;
  format: 'markdown';
  created_at: string;
  updated_at: string;
}

export interface Entity {
  id: string;
  app_id: string;
  name: string;
  version: string;
  description: string;
  cyoda_url?: string;
  github_url?: string;
  model: any; // JSON Schema
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  app_id: string;
  entity_id: string;
  name: string;
  description: string;
  cyoda_url?: string;
  github_url?: string;
  states: Record<string, WorkflowState>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowState {
  name: string;
  transitions: string[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

// ============================================================================
// Mock Data Storage
// ============================================================================

const STORAGE_KEYS = {
  APP_CONFIGS: 'mock_api_app_configs',
  ENVIRONMENTS: 'mock_api_environments',
  REQUIREMENTS: 'mock_api_requirements',
  ENTITIES: 'mock_api_entities',
  WORKFLOWS: 'mock_api_workflows',
};

// Helper to get data from localStorage
function getStorageData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

// Helper to set data in localStorage
function setStorageData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
}

// ============================================================================
// Mock API Delay
// ============================================================================

const MOCK_DELAY_MS = 300; // Simulate network delay

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// GET Endpoints
// ============================================================================

/**
 * GET /apps/{appId}/config
 * Fetch the basic application configuration
 */
export async function getAppConfig(appId: string): Promise<AppConfig> {
  await delay(MOCK_DELAY_MS);

  const configs = getStorageData<Record<string, AppConfig>>(STORAGE_KEYS.APP_CONFIGS, {});
  const config = configs[appId];

  if (!config) {
    throw {
      error: {
        code: 'APP_NOT_FOUND',
        message: `Application with ID '${appId}' not found`,
      },
    } as ApiError;
  }

  return config;
}

/**
 * GET /apps/{appId}/environments/{environmentId}
 * Fetch detailed information about a specific environment
 */
export async function getEnvironmentDetail(appId: string, environmentId: string): Promise<Environment> {
  await delay(MOCK_DELAY_MS);

  const environments = getStorageData<Record<string, Environment>>(STORAGE_KEYS.ENVIRONMENTS, {});
  const environment = environments[environmentId];

  if (!environment || environment.app_id !== appId) {
    throw {
      error: {
        code: 'ENVIRONMENT_NOT_FOUND',
        message: `Environment with ID '${environmentId}' not found`,
      },
    } as ApiError;
  }

  return environment;
}

/**
 * GET /apps/{appId}/requirements
 * Fetch detailed requirements for an application
 */
export async function getRequirementDetail(appId: string): Promise<Requirement> {
  await delay(MOCK_DELAY_MS);

  const requirements = getStorageData<Record<string, Requirement>>(STORAGE_KEYS.REQUIREMENTS, {});
  const requirement = requirements[appId];

  if (!requirement) {
    throw {
      error: {
        code: 'REQUIREMENTS_NOT_FOUND',
        message: `Requirements for app '${appId}' not found`,
      },
    } as ApiError;
  }

  return requirement;
}

/**
 * GET /apps/{appId}/entities/{entityId}
 * Fetch detailed information about a specific entity
 */
export async function getEntityDetail(appId: string, entityId: string): Promise<Entity> {
  await delay(MOCK_DELAY_MS);

  const entities = getStorageData<Record<string, Entity>>(STORAGE_KEYS.ENTITIES, {});
  const entity = entities[entityId];

  if (!entity || entity.app_id !== appId) {
    throw {
      error: {
        code: 'ENTITY_NOT_FOUND',
        message: `Entity with ID '${entityId}' not found`,
      },
    } as ApiError;
  }

  return entity;
}

/**
 * GET /apps/{appId}/workflows/{workflowId}
 * Fetch detailed information about a specific workflow
 */
export async function getWorkflowDetail(appId: string, workflowId: string): Promise<Workflow> {
  await delay(MOCK_DELAY_MS);

  const workflows = getStorageData<Record<string, Workflow>>(STORAGE_KEYS.WORKFLOWS, {});
  const workflow = workflows[workflowId];

  if (!workflow || workflow.app_id !== appId) {
    throw {
      error: {
        code: 'WORKFLOW_NOT_FOUND',
        message: `Workflow with ID '${workflowId}' not found`,
      },
    } as ApiError;
  }

  return workflow;
}

// ============================================================================
// PUT Endpoints
// ============================================================================

/**
 * PUT /apps/{appId}/config
 * Create or update the application configuration
 */
export async function saveAppConfig(
  appId: string,
  data: Partial<Omit<AppConfig, 'id' | 'created_at' | 'updated_at'>>
): Promise<AppConfig> {
  await delay(MOCK_DELAY_MS);

  const configs = getStorageData<Record<string, AppConfig>>(STORAGE_KEYS.APP_CONFIGS, {});
  const existingConfig = configs[appId];

  const now = new Date().toISOString();
  const updatedConfig: AppConfig = {
    id: appId,
    name: data.name || existingConfig?.name || '',
    description: data.description || existingConfig?.description || '',
    version: data.version || existingConfig?.version || '1.0.0',
    programming_language: data.programming_language || existingConfig?.programming_language || 'python',
    environments: data.environments || existingConfig?.environments || [],
    entities: data.entities || existingConfig?.entities || [],
    workflows: data.workflows || existingConfig?.workflows || [],
    created_at: existingConfig?.created_at || now,
    updated_at: now,
  };

  configs[appId] = updatedConfig;
  setStorageData(STORAGE_KEYS.APP_CONFIGS, configs);

  return updatedConfig;
}

/**
 * PUT /apps/{appId}/environments/{environmentId}
 * Create or update an environment
 */
export async function saveEnvironmentDetail(
  appId: string,
  environmentId: string,
  data: Partial<Omit<Environment, 'id' | 'app_id' | 'created_at' | 'updated_at'>>
): Promise<Environment> {
  await delay(MOCK_DELAY_MS);

  const environments = getStorageData<Record<string, Environment>>(STORAGE_KEYS.ENVIRONMENTS, {});
  const existingEnv = environments[environmentId];

  const now = new Date().toISOString();
  const updatedEnv: Environment = {
    id: environmentId,
    app_id: appId,
    name: data.name || existingEnv?.name || '',
    url: data.url || existingEnv?.url || '',
    status: data.status || existingEnv?.status || 'active',
    description: data.description || existingEnv?.description,
    config: data.config || existingEnv?.config || {},
    created_at: existingEnv?.created_at || now,
    updated_at: now,
  };

  environments[environmentId] = updatedEnv;
  setStorageData(STORAGE_KEYS.ENVIRONMENTS, environments);

  return updatedEnv;
}

/**
 * PUT /apps/{appId}/requirements
 * Create or update application requirements
 */
export async function saveRequirementDetail(
  appId: string,
  data: Partial<Omit<Requirement, 'id' | 'app_id' | 'created_at' | 'updated_at'>>
): Promise<Requirement> {
  await delay(MOCK_DELAY_MS);

  const requirements = getStorageData<Record<string, Requirement>>(STORAGE_KEYS.REQUIREMENTS, {});
  const existingReq = requirements[appId];

  const now = new Date().toISOString();
  const updatedReq: Requirement = {
    id: existingReq?.id || `req-${appId}`,
    app_id: appId,
    content: data.content || existingReq?.content || '',
    format: 'markdown',
    created_at: existingReq?.created_at || now,
    updated_at: now,
  };

  requirements[appId] = updatedReq;
  setStorageData(STORAGE_KEYS.REQUIREMENTS, requirements);

  return updatedReq;
}

/**
 * PUT /apps/{appId}/entities/{entityId}
 * Create or update an entity
 */
export async function saveEntityDetail(
  appId: string,
  entityId: string,
  data: Partial<Omit<Entity, 'id' | 'app_id' | 'created_at' | 'updated_at'>>
): Promise<Entity> {
  await delay(MOCK_DELAY_MS);

  const entities = getStorageData<Record<string, Entity>>(STORAGE_KEYS.ENTITIES, {});
  const existingEntity = entities[entityId];

  const now = new Date().toISOString();
  const updatedEntity: Entity = {
    id: entityId,
    app_id: appId,
    name: data.name || existingEntity?.name || '',
    version: data.version || existingEntity?.version || '1',
    description: data.description || existingEntity?.description || '',
    cyoda_url: data.cyoda_url || existingEntity?.cyoda_url,
    github_url: data.github_url || existingEntity?.github_url,
    model: data.model || existingEntity?.model || {},
    created_at: existingEntity?.created_at || now,
    updated_at: now,
  };

  entities[entityId] = updatedEntity;
  setStorageData(STORAGE_KEYS.ENTITIES, entities);

  return updatedEntity;
}

/**
 * PUT /apps/{appId}/workflows/{workflowId}
 * Create or update a workflow
 */
export async function saveWorkflowDetail(
  appId: string,
  workflowId: string,
  data: Partial<Omit<Workflow, 'id' | 'app_id' | 'created_at' | 'updated_at'>>
): Promise<Workflow> {
  await delay(MOCK_DELAY_MS);

  const workflows = getStorageData<Record<string, Workflow>>(STORAGE_KEYS.WORKFLOWS, {});
  const existingWorkflow = workflows[workflowId];

  const now = new Date().toISOString();
  const updatedWorkflow: Workflow = {
    id: workflowId,
    app_id: appId,
    entity_id: data.entity_id || existingWorkflow?.entity_id || '',
    name: data.name || existingWorkflow?.name || '',
    description: data.description || existingWorkflow?.description || '',
    cyoda_url: data.cyoda_url || existingWorkflow?.cyoda_url,
    github_url: data.github_url || existingWorkflow?.github_url,
    states: data.states || existingWorkflow?.states || {},
    created_at: existingWorkflow?.created_at || now,
    updated_at: now,
  };

  workflows[workflowId] = updatedWorkflow;
  setStorageData(STORAGE_KEYS.WORKFLOWS, workflows);

  return updatedWorkflow;
}

// ============================================================================
// Initialization Helper
// ============================================================================

/**
 * Initialize mock data from existing app data in localStorage
 * This should be called when the app loads to sync with existing data
 */
export function initializeMockDataFromAppData(appData: any): void {
  if (!appData || !appData.app) {
    console.warn('No app data provided for initialization');
    return;
  }

  const app = appData.app;
  const appId = app.id || 'app-1';

  // Initialize app config
  const appConfig: AppConfig = {
    id: appId,
    name: app.name || 'Untitled App',
    description: app.description || '',
    version: app.version || '1.0.0',
    programming_language: app.programming_language || 'python',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    environments: (app.environments || []).map((env: any) => ({
      id: env.id || `env-${env.name}`,
      name: env.name,
      url: env.url || '',
      status: env.status || 'active',
    })),
    entities: (app.entities || []).map((entity: any) => ({
      id: entity.id || `entity-${entity.name}-${entity.version}`,
      name: entity.name,
      version: entity.version,
      description: entity.description || '',
    })),
    workflows: [],
  };

  // Collect all workflows from entities
  (app.entities || []).forEach((entity: any) => {
    (entity.workflows || []).forEach((workflow: any) => {
      appConfig.workflows.push({
        id: workflow.id || `workflow-${workflow.name}`,
        name: workflow.name,
        entity_id: entity.id || `entity-${entity.name}-${entity.version}`,
        description: workflow.description || '',
      });
    });
  });

  // Save app config
  const configs = getStorageData<Record<string, AppConfig>>(STORAGE_KEYS.APP_CONFIGS, {});
  configs[appId] = appConfig;
  setStorageData(STORAGE_KEYS.APP_CONFIGS, configs);

  // Initialize environments
  const environments = getStorageData<Record<string, Environment>>(STORAGE_KEYS.ENVIRONMENTS, {});
  (app.environments || []).forEach((env: any) => {
    const envId = env.id || `env-${env.name}`;
    environments[envId] = {
      id: envId,
      app_id: appId,
      name: env.name,
      url: env.url || '',
      status: env.status || 'active',
      description: env.description || '',
      config: env.config || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
  setStorageData(STORAGE_KEYS.ENVIRONMENTS, environments);

  // Initialize requirements
  const requirements = getStorageData<Record<string, Requirement>>(STORAGE_KEYS.REQUIREMENTS, {});
  requirements[appId] = {
    id: `req-${appId}`,
    app_id: appId,
    content: app.requirements || '# Requirements\n\nNo requirements defined yet.',
    format: 'markdown',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  setStorageData(STORAGE_KEYS.REQUIREMENTS, requirements);

  // Initialize entities
  const entities = getStorageData<Record<string, Entity>>(STORAGE_KEYS.ENTITIES, {});
  (app.entities || []).forEach((entity: any) => {
    const entityId = entity.id || `entity-${entity.name}-${entity.version}`;
    entities[entityId] = {
      id: entityId,
      app_id: appId,
      name: entity.name,
      version: entity.version,
      description: entity.description || '',
      cyoda_url: entity.cyoda_url,
      github_url: entity.github_url,
      model: entity.model || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
  setStorageData(STORAGE_KEYS.ENTITIES, entities);

  // Initialize workflows
  const workflows = getStorageData<Record<string, Workflow>>(STORAGE_KEYS.WORKFLOWS, {});
  (app.entities || []).forEach((entity: any) => {
    const entityId = entity.id || `entity-${entity.name}-${entity.version}`;
    (entity.workflows || []).forEach((workflow: any) => {
      const workflowId = workflow.id || `workflow-${workflow.name}`;
      workflows[workflowId] = {
        id: workflowId,
        app_id: appId,
        entity_id: entityId,
        name: workflow.name,
        description: workflow.description || '',
        cyoda_url: workflow.cyoda_url,
        github_url: workflow.github_url,
        states: workflow.states || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
  });
  setStorageData(STORAGE_KEYS.WORKFLOWS, workflows);

  console.log('✅ Mock API data initialized from app data');
}

// ============================================================================
// Create from Chat Endpoint
// ============================================================================

/**
 * POST /chat/{chatId}/create
 * Create app/entity/workflow/environment from AI-generated chat message
 */
export async function createFromChat(
  chatId: string,
  type: 'app' | 'entity' | 'workflow' | 'environment',
  appId?: string
): Promise<{ id: string; type: string; data: any }> {
  await delay(MOCK_DELAY_MS);

  // Get chat message from localStorage
  const chatMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
  const chatMessage = chatMessages.find((msg: any) => msg.id === chatId);

  if (!chatMessage) {
    throw {
      error: {
        code: 'CHAT_MESSAGE_NOT_FOUND',
        message: `Chat message with ID '${chatId}' not found`,
      },
    } as ApiError;
  }

  // Extract JSON from chat message content
  let extractedData: any;
  try {
    // Try to find JSON in the message content
    const jsonMatch = chatMessage.content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      extractedData = JSON.parse(jsonMatch[1]);
    } else {
      // Try to parse the entire content as JSON
      extractedData = JSON.parse(chatMessage.content);
    }
  } catch (error) {
    throw {
      error: {
        code: 'INVALID_CHAT_MESSAGE',
        message: 'Could not extract valid JSON from chat message',
      },
    } as ApiError;
  }

  const now = new Date().toISOString();
  let createdId: string;
  let createdData: any;

  switch (type) {
    case 'app': {
      // Create new app
      createdId = extractedData.id || `app-${Date.now()}`;
      const appConfig: AppConfig = {
        id: createdId,
        name: extractedData.name || 'Untitled App',
        description: extractedData.description || '',
        version: extractedData.version || '1.0.0',
        programming_language: extractedData.programming_language || 'python',
        created_at: now,
        updated_at: now,
        environments: [],
        entities: [],
        workflows: [],
      };

      // Save app config
      const configs = getStorageData<Record<string, AppConfig>>(STORAGE_KEYS.APP_CONFIGS, {});
      configs[createdId] = appConfig;
      setStorageData(STORAGE_KEYS.APP_CONFIGS, configs);

      // Initialize empty requirements
      const requirements = getStorageData<Record<string, Requirement>>(STORAGE_KEYS.REQUIREMENTS, {});
      requirements[createdId] = {
        id: `req-${createdId}`,
        app_id: createdId,
        content: extractedData.requirements || '# Requirements\n\nNo requirements defined yet.',
        format: 'markdown',
        created_at: now,
        updated_at: now,
      };
      setStorageData(STORAGE_KEYS.REQUIREMENTS, requirements);

      createdData = appConfig;
      break;
    }

    case 'entity': {
      if (!appId) {
        throw {
          error: {
            code: 'INVALID_REQUEST',
            message: 'app_id is required for creating entities',
          },
        } as ApiError;
      }

      // Create new entity
      createdId = extractedData.id || `entity-${extractedData.name}-${extractedData.version}`;
      const entity: Entity = {
        id: createdId,
        app_id: appId,
        name: extractedData.name || 'Untitled Entity',
        version: extractedData.version || '1',
        description: extractedData.description || '',
        cyoda_url: extractedData.cyoda_url,
        github_url: extractedData.github_url,
        model: extractedData.model || {},
        created_at: now,
        updated_at: now,
      };

      // Save entity
      const entities = getStorageData<Record<string, Entity>>(STORAGE_KEYS.ENTITIES, {});
      entities[createdId] = entity;
      setStorageData(STORAGE_KEYS.ENTITIES, entities);

      // Update app config to include entity summary
      const configs = getStorageData<Record<string, AppConfig>>(STORAGE_KEYS.APP_CONFIGS, {});
      if (configs[appId]) {
        configs[appId].entities.push({
          id: createdId,
          name: entity.name,
          version: entity.version,
          description: entity.description,
        });
        configs[appId].updated_at = now;
        setStorageData(STORAGE_KEYS.APP_CONFIGS, configs);
      }

      createdData = entity;
      break;
    }

    case 'workflow': {
      if (!appId) {
        throw {
          error: {
            code: 'INVALID_REQUEST',
            message: 'app_id is required for creating workflows',
          },
        } as ApiError;
      }

      // Create new workflow
      createdId = extractedData.id || `workflow-${extractedData.name}`;
      const workflow: Workflow = {
        id: createdId,
        app_id: appId,
        entity_id: extractedData.entity_id || '',
        name: extractedData.name || 'Untitled Workflow',
        description: extractedData.description || '',
        cyoda_url: extractedData.cyoda_url,
        github_url: extractedData.github_url,
        states: extractedData.states || {},
        created_at: now,
        updated_at: now,
      };

      // Save workflow
      const workflows = getStorageData<Record<string, Workflow>>(STORAGE_KEYS.WORKFLOWS, {});
      workflows[createdId] = workflow;
      setStorageData(STORAGE_KEYS.WORKFLOWS, workflows);

      // Update app config to include workflow summary
      const configs = getStorageData<Record<string, AppConfig>>(STORAGE_KEYS.APP_CONFIGS, {});
      if (configs[appId]) {
        configs[appId].workflows.push({
          id: createdId,
          name: workflow.name,
          entity_id: workflow.entity_id,
          description: workflow.description,
        });
        configs[appId].updated_at = now;
        setStorageData(STORAGE_KEYS.APP_CONFIGS, configs);
      }

      createdData = workflow;
      break;
    }

    case 'environment': {
      if (!appId) {
        throw {
          error: {
            code: 'INVALID_REQUEST',
            message: 'app_id is required for creating environments',
          },
        } as ApiError;
      }

      // Create new environment
      createdId = extractedData.id || `env-${extractedData.name}`;
      const environment: Environment = {
        id: createdId,
        app_id: appId,
        name: extractedData.name || 'Untitled Environment',
        url: extractedData.url || '',
        status: extractedData.status || 'active',
        description: extractedData.description,
        config: extractedData.config || {},
        created_at: now,
        updated_at: now,
      };

      // Save environment
      const environments = getStorageData<Record<string, Environment>>(STORAGE_KEYS.ENVIRONMENTS, {});
      environments[createdId] = environment;
      setStorageData(STORAGE_KEYS.ENVIRONMENTS, environments);

      // Update app config to include environment summary
      const configs = getStorageData<Record<string, AppConfig>>(STORAGE_KEYS.APP_CONFIGS, {});
      if (configs[appId]) {
        configs[appId].environments.push({
          id: createdId,
          name: environment.name,
          url: environment.url,
          status: environment.status,
        });
        configs[appId].updated_at = now;
        setStorageData(STORAGE_KEYS.APP_CONFIGS, configs);
      }

      createdData = environment;
      break;
    }

    default:
      throw {
        error: {
          code: 'INVALID_REQUEST',
          message: `Invalid type: ${type}`,
        },
      } as ApiError;
  }

  console.log(`✅ Created ${type} from chat:`, createdId);

  return {
    id: createdId,
    type,
    data: createdData,
  };
}

// ============================================================================
// Export all functions
// ============================================================================

export const mockApiService = {
  // GET endpoints
  getAppConfig,
  getEnvironmentDetail,
  getRequirementDetail,
  getEntityDetail,
  getWorkflowDetail,

  // PUT endpoints
  saveAppConfig,
  saveEnvironmentDetail,
  saveRequirementDetail,
  saveEntityDetail,
  saveWorkflowDetail,

  // Create from chat
  createFromChat,

  // Helpers
  initializeMockDataFromAppData,
};

export default mockApiService;

