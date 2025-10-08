// Portal navigation types for React Flow-based navigation

export interface EntityNode {
  id: string;
  name: string;
  description?: string;
  type: 'entity';
  versionCount: number;
  workflowCount: number;
  requirementCount: number;
}

export interface VersionNode {
  id: string;
  entityId: string;
  version: string;
  type: 'version';
  state: string;
  workflowCount: number;
  requirementCount: number;
  createdAt: string;
  isActive: boolean;
}

export interface WorkflowNode {
  id: string;
  entityId: string;
  versionId: string;
  name: string;
  type: 'workflow';
  stateCount: number;
  transitionCount: number;
  updatedAt: string;
}

export interface RequirementNode {
  id: string;
  entityId: string;
  versionId?: string;
  workflowId?: string;
  title: string;
  type: 'requirement';
  status: 'draft' | 'approved' | 'implemented' | 'verified';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export type PortalNode = EntityNode | VersionNode | WorkflowNode | RequirementNode;

export interface PortalEdge {
  id: string;
  source: string;
  target: string;
  type: 'entity-version' | 'version-workflow' | 'workflow-requirement' | 'entity-requirement';
  label?: string;
}

export interface PortalData {
  entities: EntityNode[];
  versions: VersionNode[];
  workflows: WorkflowNode[];
  requirements: RequirementNode[];
}

// View modes for the portal
export type PortalViewMode = 'overview' | 'entity-focus' | 'workflow-focus' | 'requirement-focus';

// Filter options
export interface PortalFilters {
  showEntities: boolean;
  showVersions: boolean;
  showWorkflows: boolean;
  showRequirements: boolean;
  entityIds?: string[];
  versionIds?: string[];
}

// Layout algorithms
export type LayoutAlgorithm = 'hierarchical' | 'force' | 'circular' | 'grid';

