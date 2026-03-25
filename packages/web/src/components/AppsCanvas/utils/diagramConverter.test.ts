import { describe, it, expect } from 'vitest';
import {
  diagramToNode,
  environmentDiagramsToNodes,
  diagramsConfigToNodes,
  getDiagramsForEnvironment,
  getDiagramNodesForEnvironment,
  addDiagramToEnvironment,
  removeDiagramFromEnvironment,
  updateDiagramInEnvironment,
} from './diagramConverter';
import type { DiagramConfig, DiagramsConfiguration, EnvironmentDiagramConfig } from '../types/diagrams';

describe('diagramConverter', () => {
  const mockDiagram: DiagramConfig = {
    id: 'diagram-1',
    name: 'Test Diagram',
    library: 'recharts',
    chartType: 'line',
    data: [{ name: 'A', value: 10 }],
    xAxisKey: 'name',
    yAxisKeys: ['value'],
  };

  const mockDiagramWithPosition: DiagramConfig = {
    ...mockDiagram,
    position: { x: 100, y: 200 },
  };

  const mockEnvironmentConfig: EnvironmentDiagramConfig = {
    environmentId: 'env-1',
    environmentName: 'Test Environment',
    diagrams: [mockDiagram],
  };

  const mockDiagramsConfig: DiagramsConfiguration = {
    version: '1.0.0',
    environments: [mockEnvironmentConfig],
  };

  describe('diagramToNode', () => {
    it('should convert diagram to React Flow node', () => {
      const node = diagramToNode(mockDiagram, 'env-1');

      expect(node.id).toBe('diagram-diagram-1');
      expect(node.type).toBe('diagramNode');
      expect(node.data.diagram).toEqual(mockDiagram);
      expect(node.data.environmentId).toBe('env-1');
      expect(node.draggable).toBe(true);
      expect(node.selectable).toBe(true);
    });

    it('should use default position when diagram has no position', () => {
      const node = diagramToNode(mockDiagram, 'env-1');

      expect(node.position).toEqual({ x: 0, y: 0 });
    });

    it('should use diagram position when provided', () => {
      const node = diagramToNode(mockDiagramWithPosition, 'env-1');

      expect(node.position).toEqual({ x: 100, y: 200 });
    });
  });

  describe('environmentDiagramsToNodes', () => {
    it('should convert all diagrams in environment to nodes', () => {
      const nodes = environmentDiagramsToNodes(mockEnvironmentConfig);

      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('diagram-diagram-1');
      expect(nodes[0].data.environmentId).toBe('env-1');
    });

    it('should apply basePosition when provided', () => {
      const basePosition = { x: 500, y: 600 };
      const nodes = environmentDiagramsToNodes(mockEnvironmentConfig, basePosition);

      expect(nodes[0].position.x).toBeGreaterThanOrEqual(basePosition.x);
      expect(nodes[0].position.y).toBeGreaterThanOrEqual(basePosition.y);
    });

    it('should arrange diagrams in grid when they have no position', () => {
      const diagrams: DiagramConfig[] = [
        { ...mockDiagram, id: 'diagram-1' },
        { ...mockDiagram, id: 'diagram-2' },
        { ...mockDiagram, id: 'diagram-3' },
        { ...mockDiagram, id: 'diagram-4' },
      ];

      const envConfig: EnvironmentDiagramConfig = {
        ...mockEnvironmentConfig,
        diagrams,
      };

      const nodes = environmentDiagramsToNodes(envConfig);

      expect(nodes).toHaveLength(4);
      // First diagram at base position
      expect(nodes[0].position).toEqual({ x: 0, y: 0 });
      // Second diagram to the right
      expect(nodes[1].position).toEqual({ x: 450, y: 0 });
      // Third diagram to the right again
      expect(nodes[2].position).toEqual({ x: 900, y: 0 });
      // Fourth diagram on new row
      expect(nodes[3].position).toEqual({ x: 0, y: 400 });
    });

    it('should handle environment with no diagrams', () => {
      const emptyEnvConfig: EnvironmentDiagramConfig = {
        ...mockEnvironmentConfig,
        diagrams: [],
      };

      const nodes = environmentDiagramsToNodes(emptyEnvConfig);

      expect(nodes).toHaveLength(0);
    });

    it('should preserve existing diagram positions', () => {
      const diagramWithPosition: DiagramConfig = {
        ...mockDiagram,
        position: { x: 200, y: 300 },
      };

      const envConfig: EnvironmentDiagramConfig = {
        ...mockEnvironmentConfig,
        diagrams: [diagramWithPosition],
      };

      const nodes = environmentDiagramsToNodes(envConfig);

      expect(nodes[0].position).toEqual({ x: 200, y: 300 });
    });
  });

  describe('diagramsConfigToNodes', () => {
    it('should convert all diagrams from all environments to nodes', () => {
      const nodes = diagramsConfigToNodes(mockDiagramsConfig);

      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('diagram-diagram-1');
    });

    it('should handle multiple environments', () => {
      const multiEnvConfig: DiagramsConfiguration = {
        version: '1.0.0',
        environments: [
          {
            environmentId: 'env-1',
            environmentName: 'Environment 1',
            diagrams: [{ ...mockDiagram, id: 'diagram-1' }],
          },
          {
            environmentId: 'env-2',
            environmentName: 'Environment 2',
            diagrams: [{ ...mockDiagram, id: 'diagram-2' }],
          },
        ],
      };

      const nodes = diagramsConfigToNodes(multiEnvConfig);

      expect(nodes).toHaveLength(2);
      expect(nodes[0].id).toBe('diagram-diagram-1');
      expect(nodes[1].id).toBe('diagram-diagram-2');
    });

    it('should separate environments vertically', () => {
      const multiEnvConfig: DiagramsConfiguration = {
        version: '1.0.0',
        environments: [
          {
            environmentId: 'env-1',
            environmentName: 'Environment 1',
            diagrams: [{ ...mockDiagram, id: 'diagram-1' }],
          },
          {
            environmentId: 'env-2',
            environmentName: 'Environment 2',
            diagrams: [{ ...mockDiagram, id: 'diagram-2' }],
          },
        ],
      };

      const nodes = diagramsConfigToNodes(multiEnvConfig);

      // Second environment should be 1000 units below first
      expect(nodes[1].position.y).toBeGreaterThan(nodes[0].position.y);
    });

    it('should handle empty configuration', () => {
      const emptyConfig: DiagramsConfiguration = {
        version: '1.0.0',
        environments: [],
      };

      const nodes = diagramsConfigToNodes(emptyConfig);

      expect(nodes).toHaveLength(0);
    });
  });

  describe('getDiagramsForEnvironment', () => {
    it('should return diagrams for existing environment', () => {
      const diagrams = getDiagramsForEnvironment(mockDiagramsConfig, 'env-1');

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].id).toBe('diagram-1');
    });

    it('should return empty array for non-existent environment', () => {
      const diagrams = getDiagramsForEnvironment(mockDiagramsConfig, 'non-existent');

      expect(diagrams).toHaveLength(0);
    });

    it('should return empty array for environment with no diagrams', () => {
      const configWithEmptyEnv: DiagramsConfiguration = {
        version: '1.0.0',
        environments: [
          {
            environmentId: 'env-1',
            environmentName: 'Empty Environment',
            diagrams: [],
          },
        ],
      };

      const diagrams = getDiagramsForEnvironment(configWithEmptyEnv, 'env-1');

      expect(diagrams).toHaveLength(0);
    });
  });

  describe('getDiagramNodesForEnvironment', () => {
    it('should return nodes for existing environment', () => {
      const nodes = getDiagramNodesForEnvironment(mockDiagramsConfig, 'env-1');

      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('diagram-diagram-1');
    });

    it('should return empty array for non-existent environment', () => {
      const nodes = getDiagramNodesForEnvironment(mockDiagramsConfig, 'non-existent');

      expect(nodes).toHaveLength(0);
    });

    it('should apply basePosition when provided', () => {
      const basePosition = { x: 1000, y: 2000 };
      const nodes = getDiagramNodesForEnvironment(mockDiagramsConfig, 'env-1', basePosition);

      expect(nodes[0].position.x).toBeGreaterThanOrEqual(basePosition.x);
      expect(nodes[0].position.y).toBeGreaterThanOrEqual(basePosition.y);
    });
  });

  describe('addDiagramToEnvironment', () => {
    it('should add diagram to existing environment', () => {
      const newDiagram: DiagramConfig = {
        id: 'diagram-2',
        name: 'New Diagram',
        library: 'recharts',
        chartType: 'bar',
        data: [],
      };

      const result = addDiagramToEnvironment(mockDiagramsConfig, 'env-1', newDiagram);

      expect(result.environments[0].diagrams).toHaveLength(2);
      expect(result.environments[0].diagrams[1]).toEqual(newDiagram);
    });

    it('should create new environment when adding to non-existent environment', () => {
      const newDiagram: DiagramConfig = {
        id: 'diagram-2',
        name: 'New Diagram',
        library: 'recharts',
        chartType: 'bar',
        data: [],
      };

      const result = addDiagramToEnvironment(mockDiagramsConfig, 'env-2', newDiagram);

      expect(result.environments).toHaveLength(2);
      expect(result.environments[1].environmentId).toBe('env-2');
      expect(result.environments[1].diagrams[0]).toEqual(newDiagram);
    });

    it('should not mutate original config', () => {
      const originalConfig = JSON.parse(JSON.stringify(mockDiagramsConfig));
      const newDiagram: DiagramConfig = {
        id: 'diagram-2',
        name: 'New Diagram',
        library: 'recharts',
        chartType: 'bar',
        data: [],
      };

      addDiagramToEnvironment(mockDiagramsConfig, 'env-1', newDiagram);

      expect(mockDiagramsConfig).toEqual(originalConfig);
    });
  });

  describe('removeDiagramFromEnvironment', () => {
    it('should remove diagram from environment', () => {
      const result = removeDiagramFromEnvironment(mockDiagramsConfig, 'env-1', 'diagram-1');

      expect(result.environments[0].diagrams).toHaveLength(0);
    });

    it('should not modify config when environment does not exist', () => {
      const result = removeDiagramFromEnvironment(mockDiagramsConfig, 'non-existent', 'diagram-1');

      expect(result).toEqual(mockDiagramsConfig);
    });

    it('should not modify config when diagram does not exist', () => {
      const result = removeDiagramFromEnvironment(mockDiagramsConfig, 'env-1', 'non-existent');

      expect(result.environments[0].diagrams).toHaveLength(1);
    });

    it('should not mutate original config', () => {
      const originalConfig = JSON.parse(JSON.stringify(mockDiagramsConfig));

      removeDiagramFromEnvironment(mockDiagramsConfig, 'env-1', 'diagram-1');

      expect(mockDiagramsConfig).toEqual(originalConfig);
    });

    it('should handle removing from multiple diagrams', () => {
      const configWithMultipleDiagrams: DiagramsConfiguration = {
        version: '1.0.0',
        environments: [
          {
            environmentId: 'env-1',
            environmentName: 'Test',
            diagrams: [
              { ...mockDiagram, id: 'diagram-1' },
              { ...mockDiagram, id: 'diagram-2' },
              { ...mockDiagram, id: 'diagram-3' },
            ],
          },
        ],
      };

      const result = removeDiagramFromEnvironment(configWithMultipleDiagrams, 'env-1', 'diagram-2');

      expect(result.environments[0].diagrams).toHaveLength(2);
      expect(result.environments[0].diagrams[0].id).toBe('diagram-1');
      expect(result.environments[0].diagrams[1].id).toBe('diagram-3');
    });
  });

  describe('updateDiagramInEnvironment', () => {
    it('should update diagram in environment', () => {
      const updates = { name: 'Updated Diagram Name' };

      const result = updateDiagramInEnvironment(mockDiagramsConfig, 'env-1', 'diagram-1', updates);

      expect(result.environments[0].diagrams[0].name).toBe('Updated Diagram Name');
    });

    it('should not modify config when environment does not exist', () => {
      const updates = { name: 'Updated' };

      const result = updateDiagramInEnvironment(mockDiagramsConfig, 'non-existent', 'diagram-1', updates);

      expect(result).toEqual(mockDiagramsConfig);
    });

    it('should not modify config when diagram does not exist', () => {
      const updates = { name: 'Updated' };

      const result = updateDiagramInEnvironment(mockDiagramsConfig, 'env-1', 'non-existent', updates);

      expect(result.environments[0].diagrams[0].name).toBe('Test Diagram');
    });

    it('should not mutate original config', () => {
      const originalConfig = JSON.parse(JSON.stringify(mockDiagramsConfig));
      const updates = { name: 'Updated' };

      updateDiagramInEnvironment(mockDiagramsConfig, 'env-1', 'diagram-1', updates);

      expect(mockDiagramsConfig).toEqual(originalConfig);
    });

    it('should update multiple properties', () => {
      const updates = {
        name: 'New Name',
        description: 'New Description',
        chartType: 'bar' as const,
      };

      const result = updateDiagramInEnvironment(mockDiagramsConfig, 'env-1', 'diagram-1', updates);

      expect(result.environments[0].diagrams[0].name).toBe('New Name');
      expect(result.environments[0].diagrams[0].description).toBe('New Description');
      expect(result.environments[0].diagrams[0].chartType).toBe('bar');
    });

    it('should preserve unchanged properties', () => {
      const updates = { name: 'New Name' };

      const result = updateDiagramInEnvironment(mockDiagramsConfig, 'env-1', 'diagram-1', updates);

      expect(result.environments[0].diagrams[0].id).toBe('diagram-1');
      expect(result.environments[0].diagrams[0].library).toBe('recharts');
      expect(result.environments[0].diagrams[0].chartType).toBe('line');
    });
  });
});
