/**
 * Types matching app_schema.json
 * This is the actual data structure for the Apps Canvas
 */

export interface AppEnvironment {
  name: string;
  url: string;
  status: string;
}

export interface WorkflowTransition {
  name: string;
  next: string;
}

export interface WorkflowState {
  transitions: WorkflowTransition[];
}

export interface WorkflowConfig {
  states: {
    [stateName: string]: WorkflowState;
  };
}

export interface Workflow {
  name: string;
  cyoda_url: string;
  github_url: string;
  config: WorkflowConfig;
}

export interface EntityModel {
  name: string;
  age: number;
  breed: string;
}

export interface Entity {
  name: string;
  version: string;
  description: string;
  cyoda_url: string;
  github_url: string;
  model: EntityModel;
  workflows: Workflow[];
}

export interface AppData {
  id?: string; // Optional app ID
  name: string;
  description: string;
  version: string;
  author: string;
  license: string;
  repository: string;
  requirement: string;
  environments: AppEnvironment[];
  entities: Entity[];
}

export interface AppRoot {
  app: AppData;
}

/**
 * Convert AppRoot to PortalData for visualization
 */
export function convertAppRootToPortalData(appRoot: AppRoot): any {
  const { app } = appRoot;

  // Generate IDs
  const generateId = (prefix: string, index: number) => `${prefix}-${index}`;

  // Create environment nodes
  const environments = app.environments.map((env, i) => ({
    id: generateId('env', i),
    name: env.name,
    type: 'environment' as const,
    environmentType: env.status === 'active' ? 'production' as const : 'development' as const,
    description: env.url,
    appCount: 1,
    status: env.status as 'active' | 'inactive' | 'maintenance'
  }));

  // Create app node
  const apps = [{
    id: 'app-0',
    environmentId: environments[0]?.id || 'env-0',
    name: app.name,
    type: 'app' as const,
    description: app.description,
    requirementCount: 1,
    version: app.version,
    status: 'running' as const
  }];

  // Create requirement node
  const requirements = [{
    id: 'req-0',
    appId: 'app-0',
    title: app.requirement,
    version: app.version,
    type: 'requirement' as const,
    description: app.description,
    status: 'approved' as const,
    priority: 'high' as const,
    entityCount: app.entities.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];

  // Create entity version nodes
  const entityVersions = app.entities.map((entity, i) => ({
    id: generateId('entity', i),
    requirementId: 'req-0',
    entityName: entity.name,
    version: entity.version,
    description: entity.description,
    type: 'entityVersion' as const,
    state: 'ACTIVE',
    workflowCount: entity.workflows.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    sampleData: entity.model,
    dataFormat: 'json' as const
  }));

  // Create workflow nodes
  const workflows: any[] = [];
  app.entities.forEach((entity, entityIndex) => {
    entity.workflows.forEach((workflow, workflowIndex) => {
      workflows.push({
        id: generateId(`entity-${entityIndex}-workflow`, workflowIndex),
        entityVersionId: generateId('entity', entityIndex),
        name: workflow.name,
        type: 'workflow' as const,
        stateCount: Object.keys(workflow.config.states).length,
        transitionCount: Object.values(workflow.config.states).reduce(
          (sum, state) => sum + state.transitions.length,
          0
        ),
        updatedAt: new Date().toISOString()
      });
    });
  });

  return {
    environments,
    apps,
    requirements,
    entityVersions,
    workflows,
    code: []
  };
}

/**
 * Convert PortalData back to AppRoot
 */
export function convertPortalDataToAppRoot(portalData: any, originalAppRoot: AppRoot): AppRoot {
  // This is a simplified reverse conversion
  // In a real implementation, you'd need to track which nodes map to which parts of the schema

  return {
    app: {
      ...originalAppRoot.app,
      // Update fields that might have changed
      // This is where you'd implement the actual reverse mapping
    }
  };
}

