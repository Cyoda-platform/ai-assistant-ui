/**
 * Utility functions to convert diagram configurations to React Flow nodes
 */

import type { Node } from '@xyflow/react';
import type { DiagramConfig, DiagramsConfiguration, EnvironmentDiagramConfig } from '../types/diagrams';

/**
 * Convert a single diagram config to a React Flow node
 */
export function diagramToNode(diagram: DiagramConfig, environmentId: string): Node {
  const position = diagram.position || { x: 0, y: 0 };
  
  return {
    id: `diagram-${diagram.id}`,
    type: 'diagramNode',
    position,
    data: {
      diagram,
      environmentId,
    },
    draggable: true,
    selectable: true,
  };
}

/**
 * Convert all diagrams for an environment to React Flow nodes
 */
export function environmentDiagramsToNodes(
  envConfig: EnvironmentDiagramConfig,
  basePosition: { x: number; y: number } = { x: 0, y: 0 }
): Node[] {
  return envConfig.diagrams.map((diagram, index) => {
    // If diagram has no position, arrange them in a grid
    const position = diagram.position || {
      x: basePosition.x + (index % 3) * 450,
      y: basePosition.y + Math.floor(index / 3) * 400,
    };

    return diagramToNode({ ...diagram, position }, envConfig.environmentId);
  });
}

/**
 * Convert entire diagrams configuration to React Flow nodes
 */
export function diagramsConfigToNodes(config: DiagramsConfiguration): Node[] {
  const nodes: Node[] = [];
  
  config.environments.forEach((envConfig, envIndex) => {
    // Position diagrams for each environment in separate areas
    const basePosition = {
      x: 100,
      y: 100 + envIndex * 1000, // Separate environments vertically
    };
    
    const envNodes = environmentDiagramsToNodes(envConfig, basePosition);
    nodes.push(...envNodes);
  });
  
  return nodes;
}

/**
 * Get diagrams for a specific environment
 */
export function getDiagramsForEnvironment(
  config: DiagramsConfiguration,
  environmentId: string
): DiagramConfig[] {
  const envConfig = config.environments.find(
    env => env.environmentId === environmentId
  );
  
  return envConfig?.diagrams || [];
}

/**
 * Get all diagram nodes for a specific environment
 */
export function getDiagramNodesForEnvironment(
  config: DiagramsConfiguration,
  environmentId: string,
  basePosition?: { x: number; y: number }
): Node[] {
  const envConfig = config.environments.find(
    env => env.environmentId === environmentId
  );
  
  if (!envConfig) return [];
  
  return environmentDiagramsToNodes(envConfig, basePosition);
}

/**
 * Add a diagram to an environment
 */
export function addDiagramToEnvironment(
  config: DiagramsConfiguration,
  environmentId: string,
  diagram: DiagramConfig
): DiagramsConfiguration {
  const newConfig = { ...config, environments: [...config.environments] };
  const envIndex = newConfig.environments.findIndex(
    env => env.environmentId === environmentId
  );
  
  if (envIndex === -1) {
    // Environment doesn't exist, create it
    newConfig.environments.push({
      environmentId,
      environmentName: environmentId,
      diagrams: [diagram],
    });
  } else {
    // Add diagram to existing environment
    newConfig.environments[envIndex] = {
      ...newConfig.environments[envIndex],
      diagrams: [...newConfig.environments[envIndex].diagrams, diagram],
    };
  }
  
  return newConfig;
}

/**
 * Remove a diagram from an environment
 */
export function removeDiagramFromEnvironment(
  config: DiagramsConfiguration,
  environmentId: string,
  diagramId: string
): DiagramsConfiguration {
  const newConfig = { ...config, environments: [...config.environments] };
  const envIndex = newConfig.environments.findIndex(
    env => env.environmentId === environmentId
  );
  
  if (envIndex !== -1) {
    newConfig.environments[envIndex] = {
      ...newConfig.environments[envIndex],
      diagrams: newConfig.environments[envIndex].diagrams.filter(
        d => d.id !== diagramId
      ),
    };
  }
  
  return newConfig;
}

/**
 * Update a diagram in an environment
 */
export function updateDiagramInEnvironment(
  config: DiagramsConfiguration,
  environmentId: string,
  diagramId: string,
  updates: Partial<DiagramConfig>
): DiagramsConfiguration {
  const newConfig = { ...config, environments: [...config.environments] };
  const envIndex = newConfig.environments.findIndex(
    env => env.environmentId === environmentId
  );

  if (envIndex !== -1) {
    const diagrams = [...newConfig.environments[envIndex].diagrams];
    const diagramIndex = diagrams.findIndex(d => d.id === diagramId);

    if (diagramIndex !== -1) {
      diagrams[diagramIndex] = { ...diagrams[diagramIndex], ...updates };
      newConfig.environments[envIndex] = {
        ...newConfig.environments[envIndex],
        diagrams,
      };
    }
  }

  return newConfig;
}

