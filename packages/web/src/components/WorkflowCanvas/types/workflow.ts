// Core workflow and state machine types

export interface Entity {
  id: string;
  name: string;
  description?: string;
  workflowCount: number;
}

// Schema-compliant types based on JSON schemas

// Query condition type (from QueryCondition.json)
export interface QueryCondition {
  type: string;
  [key: string]: any; // Additional properties based on condition type
}

// Externalized function configuration (from ExternalizedFunctionConfig.json)
export interface ExternalizedFunctionConfig {
  attachEntity?: boolean;
  calculationNodesTags?: string;
  responseTimeoutMs?: number;
  retryPolicy?: string;
  context?: string;
  [key: string]: any; // Additional properties allowed
}

// Externalized processor definition (from ExternalizedProcessorDefinition.json)
export interface ExternalizedProcessorDefinition {
  name: string;
  executionMode?: 'SYNC' | 'ASYNC_SAME_TX' | 'ASYNC_NEW_TX';
  config?: ExternalizedFunctionConfig;
}

// Transition definition (from TransitionDefinition.json)
export interface TransitionDefinition {
  name?: string;
  next: string; // Target state code
  manual?: boolean;
  disabled?: boolean;
  processors?: ExternalizedProcessorDefinition[];
  criterion?: QueryCondition;
}

// State definition (from StateDefinition.json)
export interface StateDefinition {
  name?: string; // Optional display name for the state
  transitions: TransitionDefinition[];
}

// Workflow configuration (from WorkflowConfiguration.json)
export interface WorkflowConfiguration {
  version: string;
  name: string;
  desc?: string;
  initialState: string;
  active?: boolean;
  criterion?: QueryCondition;
  states: Record<string, StateDefinition>; // Map of state codes to state definitions
}

// Visual/positional data for canvas layout
export interface StateLayout {
  id: string;
  position: {
    x: number;
    y: number;
  };
  properties?: Record<string, any>; // colors, styling, etc.
}

// Visual/positional data for transition layout
export interface TransitionLayout {
  id: string;
  labelPosition?: {
    x: number;
    y: number;
  };
  sourceHandle?: string | null; // Handle ID for source anchor point
  targetHandle?: string | null; // Handle ID for target anchor point
}

// Canvas layout information (visual/positional data only)
export interface CanvasLayout {
  workflowId: string;
  states: StateLayout[];
  transitions: TransitionLayout[];
  version: number;
  updatedAt: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description?: string;
  stateCount: number;
  transitionCount: number;
  updatedAt: string;
}

// Composite identifier for entity model
export interface EntityModelIdentifier {
  modelName: string;
  modelVersion: number;
}

// Import metadata required when importing a WorkflowConfiguration
export interface WorkflowImportMetadata {
  modelName: string;
  modelVersion: number;
}

// Utility function to generate workflow ID from configuration and entity model
export function generateWorkflowId(workflowName: string, entityModel: EntityModelIdentifier): string {
  const sanitizedWorkflowName = workflowName.replace(/\s+/g, '-').toLowerCase();
  const sanitizedModelName = entityModel.modelName.replace(/\s+/g, '-').toLowerCase();
  return `${sanitizedWorkflowName}-${sanitizedModelName}-v${entityModel.modelVersion}`;
}

// Import metadata required when importing a WorkflowConfiguration
export interface WorkflowImportMetadata {
  modelName: string;
  modelVersion: number;
}

// Combined workflow data for UI rendering (merges schema config with layout)
export interface UIWorkflowData {
  id: string; // Generated from workflow name + model name + model version
  entityModel: EntityModelIdentifier;
  configuration: WorkflowConfiguration;
  layout: CanvasLayout;
  createdAt: string; // Only for export
  updatedAt: string; // Only for export
}

// UI-specific state representation (simplified for canvas - just references transitions)
export interface UIStateData {
  id: string; // state code from schema
  name: string;
  position: { x: number; y: number };
  properties?: Record<string, any>;
  isInitial: boolean;
  isFinal: boolean; // computed based on transitions
  transitionIds: string[]; // References to transition objects
}

// UI-specific transition representation (contains all the rich metadata)
export interface UITransitionData {
  id: string; // generated unique ID
  sourceStateId: string;
  targetStateId: string;
  definition: TransitionDefinition; // All the rich metadata (conditions, processors, etc.)
  labelPosition?: { x: number; y: number };
  sourceHandle?: string | null; // Handle ID for source anchor point
  targetHandle?: string | null; // Handle ID for target anchor point
}



// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface EntitiesResponse extends ApiResponse<Entity[]> {}
export interface WorkflowsResponse extends ApiResponse<WorkflowSummary[]> {}

// API response types for segregated structure
export interface WorkflowConfigurationResponse extends ApiResponse<WorkflowConfiguration> {}
export interface CanvasLayoutResponse extends ApiResponse<CanvasLayout> {}
export interface WorkflowWithLayoutResponse extends ApiResponse<{
  configuration: WorkflowConfiguration;
  layout: CanvasLayout;
}> {}

// Application Configuration types
export interface AppConfiguration {
  history: {
    maxDepth: number;
  };
  ui: {
    darkMode: boolean;
  };
}

// UI State types
export interface AppState {
  selectedEntityId: string | null;
  selectedWorkflowId: string | null;
  currentWorkflow: UIWorkflowData | null;
  entities: Entity[];
  workflows: WorkflowSummary[];
  isLoading: boolean;
  error: string | null;
  darkMode: boolean;
  configuration: AppConfiguration;
}

// React Flow specific types - combines state config with layout for rendering
export interface FlowNode {
  id: string;
  type: 'stateNode';
  position: { x: number; y: number };
  data: {
    label: string;
    state: UIStateData;
    onEdit: (stateId: string, definition: StateDefinition) => void;
  };
}

export interface FlowEdge {
  id: string;
  type: 'transitionEdge';
  source: string;
  target: string;
  data: {
    transition: UITransitionData;
    onEdit: (transitionId: string, definition: TransitionDefinition) => void;
  };
}


