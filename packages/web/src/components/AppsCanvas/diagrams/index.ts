/**
 * Diagrams feature exports
 * Central export point for all diagram-related functionality
 */

// Types
export type {
  DiagramLibrary,
  MermaidDiagramType,
  BaseDiagramConfig,
  MermaidDiagramConfig,
  ReactFlowDiagramConfig,
  ChartJSDiagramConfig,
  CustomDiagramConfig,
  DiagramConfig,
  EnvironmentDiagramConfig,
  DiagramsConfiguration,
} from '../types/diagrams';

// Components
export { DiagramNode } from '../nodes/DiagramNode';
export { DiagramsCanvas } from '../DiagramsCanvas';

// Hooks
export { useDiagrams } from '../hooks/useDiagrams';
export type { UseDiagramsOptions } from '../hooks/useDiagrams';

// Utilities
export {
  diagramToNode,
  environmentDiagramsToNodes,
  diagramsConfigToNodes,
  getDiagramsForEnvironment,
  getDiagramNodesForEnvironment,
  addDiagramToEnvironment,
  removeDiagramFromEnvironment,
  updateDiagramInEnvironment,
} from '../utils/diagramConverter';

// Mock data
export { mockDiagramsConfig } from '../mockDiagrams';

