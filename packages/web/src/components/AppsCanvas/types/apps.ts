// Portal navigation types for React Flow-based navigation

// Top level: Environment
export interface EnvironmentNode {
  id: string;
  name: string;
  type: 'environment';
  environmentType: 'production' | 'staging' | 'development' | 'test';
  description?: string;
  appCount: number;
  status: 'active' | 'inactive' | 'maintenance';
}

// Level 2: Application
export interface AppNode {
  id: string;
  environmentId: string;
  name: string;
  type: 'app';
  description?: string;
  requirementCount: number;
  version?: string;
  status: 'running' | 'stopped' | 'deploying';
}

// Level 3: Requirement (versioned)
export interface RequirementNode {
  id: string;
  appId: string;
  title: string;
  version: string;
  type: 'requirement';
  description?: string;
  status: 'draft' | 'approved' | 'implemented' | 'verified';
  priority: 'low' | 'medium' | 'high' | 'critical';
  entityCount: number;
  createdAt: string;
  updatedAt: string;
}

// Level 4: Entity-Version
export interface EntityVersionNode {
  id: string;
  requirementId: string;
  entityName: string;
  version: string;
  description?: string;
  type: 'entityVersion';
  state: string; // ACTIVE, DRAFT, etc.
  workflowCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  // Data preview
  sampleData?: any;
  dataFormat?: 'json' | 'csv' | 'xml';
}

// Level 5: Workflow
export interface WorkflowNode {
  id: string;
  entityVersionId: string;
  name: string;
  type: 'workflow';
  stateCount: number;
  transitionCount: number;
  updatedAt: string;
}

// Level 6: Code
export interface CodeNode {
  id: string;
  workflowId?: string;
  entityVersionId?: string;
  name: string;
  type: 'code';
  language: 'typescript' | 'javascript' | 'python' | 'java';
  description?: string;
  linesOfCode?: number;
}

export type PortalNode = EnvironmentNode | AppNode | RequirementNode | EntityVersionNode | WorkflowNode | CodeNode;

export interface PortalEdge {
  id: string;
  source: string;
  target: string;
  type: 'entity-version' | 'version-workflow' | 'workflow-requirement' | 'entity-requirement';
  label?: string;
}

export interface PortalData {
  environments: EnvironmentNode[];
  apps: AppNode[];
  requirements: RequirementNode[];
  entityVersions: EntityVersionNode[];
  workflows: WorkflowNode[];
  code?: CodeNode[];
}

// Canvas tab types
export type CanvasTab = 'portal' | 'data' | 'workflow' | 'requirement' | 'code' | 'environments';

// View modes for the portal
export type PortalViewMode = 'overview' | 'environment-focus' | 'app-focus' | 'requirement-focus';

// Filter options
export interface PortalFilters {
  showEnvironments: boolean;
  showApps: boolean;
  showRequirements: boolean;
  showEntityVersions: boolean;
  showWorkflows: boolean;
  showCode: boolean;
  environmentIds?: string[];
  appIds?: string[];
}

// Layout algorithms
export type LayoutAlgorithm = 'hierarchical' | 'force' | 'circular' | 'grid';

// Navigation actions
export interface NavigationAction {
  tab: CanvasTab;
  targetId: string;
  targetType: 'environment' | 'app' | 'requirement' | 'entityVersion' | 'workflow' | 'code';
}

// JSON Editor state
export interface JsonEditorState {
  content: string;
  isValid: boolean;
  error?: string;
}

// Portal settings
export interface PortalSettings {
  autoLayout: boolean;
  showMinimap: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  theme: 'dark' | 'light';
}

