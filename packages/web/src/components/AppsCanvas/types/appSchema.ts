/**
 * Types matching app_schema.json
 * This is the actual data structure for the Apps Canvas
 */

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
  description?: string;
  cyoda_url: string;
  github_url: string;
  config: WorkflowConfig;
}

// EntityModel can be any JSON structure - no fixed schema
export type EntityModel = any;

export interface Entity {
  name: string;
  version: string;
  description: string;
  cyoda_url: string;
  github_url: string;
  model: EntityModel; // Can be any JSON structure
  workflows: Workflow[];
}

export interface Environment {
  name: string;
  url: string;
  status: string;
}

export interface Requirement {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'approved' | 'implemented' | 'verified';
  content?: string; // Markdown content from GitHub
  metadata?: {
    filePath?: string;
    fileName?: string;
  };
}

export interface AppData {
  id?: string; // Optional app ID
  name: string;
  description: string;
  version: string;
  author?: string;
  license?: string;
  repository?: string;
  type?: string; // App type (python, java, etc.)
  requirement?: string; // Legacy: single requirement string
  requirements?: Requirement[]; // New: array of requirements from GitHub
  entities: Entity[];
  environments?: Environment[]; // Optional environments array
  metadata?: {
    source?: string; // 'github' | 'cyoda'
    owner?: string;
    repository?: string;
    branch?: string;
  };
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

  // Create app node (no environment needed)
  const apps = [{
    id: 'app-0',
    environmentId: 'env-0', // Placeholder for compatibility
    name: app.name,
    type: 'app' as const,
    description: app.description,
    requirementCount: (app.requirements?.length || 0) + (app.requirement ? 1 : 0),
    version: app.version,
    status: 'running' as const
  }];

  // Create requirement nodes - handle both legacy single requirement and new multiple requirements
  const requirements = [];

  // Handle new multiple requirements format
  if (app.requirements && app.requirements.length > 0) {
    app.requirements.forEach((req, index) => {
      requirements.push({
        id: req.id || generateId('req', index),
        appId: 'app-0',
        title: req.title,
        version: app.version,
        type: 'requirement' as const,
        description: req.description || '',
        status: req.status || 'draft',
        priority: req.priority || 'medium',
        entityCount: app.entities.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  }
  // Handle legacy single requirement format
  else if (app.requirement) {
    requirements.push({
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
    });
  }

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
    environments: [], // No environments in app config
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

