import { describe, it, expect } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import {
  hierarchicalLayout,
  hierarchicalLayoutLegacy,
  gridLayout,
  circularLayout,
  forceLayout,
  layoutAlgorithms,
} from './layoutAlgorithms';

describe('layoutAlgorithms', () => {
  const createNode = (id: string, type: string = 'default'): Node => ({
    id,
    type,
    position: { x: 0, y: 0 },
    data: {},
  });

  const createEdge = (source: string, target: string): Edge => ({
    id: `${source}-${target}`,
    source,
    target,
  });

  describe('hierarchicalLayout', () => {
    it('should return empty array for empty nodes', () => {
      const result = hierarchicalLayout([], []);

      expect(result).toEqual([]);
    });

    it('should layout single node', () => {
      const nodes = [createNode('node-1')];
      const result = hierarchicalLayout(nodes, []);

      expect(result).toHaveLength(1);
      expect(result[0].position.x).toBeGreaterThanOrEqual(0);
      expect(result[0].position.y).toBeGreaterThanOrEqual(0);
    });

    it('should layout parent-child relationship', () => {
      const nodes = [
        createNode('parent'),
        createNode('child'),
      ];
      const edges = [
        createEdge('parent', 'child'),
      ];

      const result = hierarchicalLayout(nodes, edges);

      expect(result).toHaveLength(2);

      const parent = result.find(n => n.id === 'parent');
      const child = result.find(n => n.id === 'child');

      // Parent should be above child
      expect(parent!.position.y).toBeLessThan(child!.position.y);
    });

    it('should center parent over single child', () => {
      const nodes = [
        createNode('parent'),
        createNode('child'),
      ];
      const edges = [
        createEdge('parent', 'child'),
      ];

      const result = hierarchicalLayout(nodes, edges);

      const parent = result.find(n => n.id === 'parent');
      const child = result.find(n => n.id === 'child');

      // Parent and child should be horizontally aligned
      expect(parent!.position.x).toBe(child!.position.x);
    });

    it('should space siblings horizontally', () => {
      const nodes = [
        createNode('parent'),
        createNode('child1'),
        createNode('child2'),
      ];
      const edges = [
        createEdge('parent', 'child1'),
        createEdge('parent', 'child2'),
      ];

      const result = hierarchicalLayout(nodes, edges);

      const child1 = result.find(n => n.id === 'child1');
      const child2 = result.find(n => n.id === 'child2');

      // Siblings should be at same Y level
      expect(child1!.position.y).toBe(child2!.position.y);
      // Siblings should be spaced horizontally
      expect(Math.abs(child1!.position.x - child2!.position.x)).toBeGreaterThan(0);
    });

    it('should handle multiple root nodes', () => {
      const nodes = [
        createNode('root1'),
        createNode('root2'),
        createNode('child1'),
        createNode('child2'),
      ];
      const edges = [
        createEdge('root1', 'child1'),
        createEdge('root2', 'child2'),
      ];

      const result = hierarchicalLayout(nodes, edges);

      expect(result).toHaveLength(4);

      const root1 = result.find(n => n.id === 'root1');
      const root2 = result.find(n => n.id === 'root2');

      // Multiple root trees should be separated
      expect(Math.abs(root1!.position.x - root2!.position.x)).toBeGreaterThan(400);
    });

    it('should handle deep hierarchies', () => {
      const nodes = [
        createNode('level0'),
        createNode('level1'),
        createNode('level2'),
        createNode('level3'),
      ];
      const edges = [
        createEdge('level0', 'level1'),
        createEdge('level1', 'level2'),
        createEdge('level2', 'level3'),
      ];

      const result = hierarchicalLayout(nodes, edges);

      expect(result).toHaveLength(4);

      // Each level should be below the previous
      for (let i = 0; i < 3; i++) {
        const current = result.find(n => n.id === `level${i}`);
        const next = result.find(n => n.id === `level${i + 1}`);
        expect(current!.position.y).toBeLessThan(next!.position.y);
      }
    });

    it('should fallback to grid layout for cyclic graphs', () => {
      const nodes = [
        createNode('node1'),
        createNode('node2'),
        createNode('node3'),
      ];
      const edges = [
        createEdge('node1', 'node2'),
        createEdge('node2', 'node3'),
        createEdge('node3', 'node1'), // Creates cycle
      ];

      const result = hierarchicalLayout(nodes, edges);

      // Should still produce a layout (grid fallback)
      expect(result).toHaveLength(3);
      result.forEach(node => {
        expect(node.position.x).toBeGreaterThanOrEqual(0);
        expect(node.position.y).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('hierarchicalLayoutLegacy', () => {
    it('should return empty array for empty nodes', () => {
      const result = hierarchicalLayoutLegacy([], []);

      expect(result).toEqual([]);
    });

    it('should layout environment nodes at top level', () => {
      const nodes = [
        createNode('env-1', 'environmentNode'),
        createNode('env-2', 'environmentNode'),
      ];

      const result = hierarchicalLayoutLegacy(nodes, []);

      expect(result).toHaveLength(2);

      const env1 = result.find(n => n.id === 'env-1');
      const env2 = result.find(n => n.id === 'env-2');

      // Environment nodes should be at same Y level
      expect(env1!.position.y).toBe(env2!.position.y);
      // Should be spaced horizontally
      expect(env2!.position.x).toBeGreaterThan(env1!.position.x);
    });

    it('should layout app nodes below environment nodes', () => {
      const nodes = [
        createNode('env-1', 'environmentNode'),
        createNode('app-1', 'appNode'),
      ];
      const edges = [
        createEdge('env-1', 'app-1'),
      ];

      const result = hierarchicalLayoutLegacy(nodes, edges);

      const env = result.find(n => n.id === 'env-1');
      const app = result.find(n => n.id === 'app-1');

      expect(app!.position.y).toBeGreaterThan(env!.position.y);
    });

    it('should layout all node types in correct hierarchy', () => {
      const nodes = [
        createNode('env-1', 'environmentNode'),
        createNode('app-1', 'appNode'),
        createNode('req-1', 'requirementNode'),
        createNode('entity-1', 'entityVersionNode'),
        createNode('workflow-1', 'workflowNode'),
        createNode('code-1', 'codeNode'),
      ];

      const edges = [
        createEdge('env-1', 'app-1'),
        createEdge('app-1', 'req-1'),
        createEdge('req-1', 'entity-1'),
      ];

      const result = hierarchicalLayoutLegacy(nodes, edges);

      expect(result).toHaveLength(6);

      // Verify hierarchy top to bottom
      const env = result.find(n => n.id === 'env-1');
      const app = result.find(n => n.id === 'app-1');
      const req = result.find(n => n.id === 'req-1');

      expect(env!.position.y).toBeLessThan(app!.position.y);
      expect(app!.position.y).toBeLessThan(req!.position.y);
    });

    it('should group child nodes under parents', () => {
      const nodes = [
        createNode('env-1', 'environmentNode'),
        createNode('app-1', 'appNode'),
        createNode('app-2', 'appNode'),
      ];

      // Both apps belong to env-1
      const edges = [
        createEdge('env-1', 'app-1'),
        createEdge('env-1', 'app-2'),
      ];

      const result = hierarchicalLayoutLegacy(nodes, edges);

      const app1 = result.find(n => n.id === 'app-1');
      const app2 = result.find(n => n.id === 'app-2');

      // Apps should be at same Y level
      expect(app1!.position.y).toBe(app2!.position.y);
      // Apps should be different X positions
      expect(app1!.position.x).not.toBe(app2!.position.x);
    });
  });

  describe('gridLayout', () => {
    it('should return empty array for empty nodes', () => {
      const result = gridLayout([], []);

      expect(result).toEqual([]);
    });

    it('should layout single node', () => {
      const nodes = [createNode('node-1')];
      const result = gridLayout(nodes, []);

      expect(result).toHaveLength(1);
      expect(result[0].position).toEqual({ x: 100, y: 100 });
    });

    it('should layout nodes in a grid pattern', () => {
      const nodes = [
        createNode('node-1'),
        createNode('node-2'),
        createNode('node-3'),
        createNode('node-4'),
      ];

      const result = gridLayout(nodes, []);

      expect(result).toHaveLength(4);

      // Check that nodes are in grid formation
      const positions = result.map(n => n.position);
      const uniqueXPositions = new Set(positions.map(p => p.x));
      const uniqueYPositions = new Set(positions.map(p => p.y));

      // For 4 nodes, should have at least 2 rows and 2 columns
      expect(uniqueXPositions.size).toBeGreaterThanOrEqual(2);
      expect(uniqueYPositions.size).toBeGreaterThanOrEqual(1);
    });

    it('should calculate correct number of columns', () => {
      const nodes = Array.from({ length: 9 }, (_, i) => createNode(`node-${i}`));
      const result = gridLayout(nodes, []);

      // 9 nodes should form a 3x3 grid
      const positions = result.map(n => n.position);
      const uniqueXPositions = new Set(positions.map(p => p.x));

      expect(uniqueXPositions.size).toBe(3);
    });

    it('should apply consistent spacing', () => {
      const nodes = [
        createNode('node-1'),
        createNode('node-2'),
        createNode('node-3'),
      ];

      const result = gridLayout(nodes, []);

      // Check horizontal spacing between first two nodes
      const spacing = result[1].position.x - result[0].position.x;
      expect(spacing).toBe(450); // Default horizontal spacing
    });
  });

  describe('circularLayout', () => {
    it('should return empty array for empty nodes', () => {
      const result = circularLayout([], []);

      expect(result).toEqual([]);
    });

    it('should layout single node at center plus radius', () => {
      const nodes = [createNode('node-1')];
      const result = circularLayout(nodes, []);

      expect(result).toHaveLength(1);
      // Single node should be on the circle
      expect(result[0].position.x).toBeCloseTo(900, 0); // 600 + 300
      expect(result[0].position.y).toBeCloseTo(400, 0);
    });

    it('should layout nodes in a circle', () => {
      const nodes = [
        createNode('node-1'),
        createNode('node-2'),
        createNode('node-3'),
        createNode('node-4'),
      ];

      const result = circularLayout(nodes, []);

      expect(result).toHaveLength(4);

      const centerX = 600;
      const centerY = 400;
      const radius = 300;

      // Verify each node is approximately at the expected radius from center
      result.forEach(node => {
        const distance = Math.sqrt(
          Math.pow(node.position.x - centerX, 2) +
          Math.pow(node.position.y - centerY, 2)
        );
        expect(distance).toBeCloseTo(radius, 0);
      });
    });

    it('should distribute nodes evenly around circle', () => {
      const nodes = [
        createNode('node-1'),
        createNode('node-2'),
        createNode('node-3'),
        createNode('node-4'),
      ];

      const result = circularLayout(nodes, []);

      // For 4 nodes, angular spacing should be 90 degrees (π/2 radians)
      const expectedAngleStep = (2 * Math.PI) / 4;

      for (let i = 0; i < result.length - 1; i++) {
        const centerX = 600;
        const centerY = 400;

        const angle1 = Math.atan2(
          result[i].position.y - centerY,
          result[i].position.x - centerX
        );
        const angle2 = Math.atan2(
          result[i + 1].position.y - centerY,
          result[i + 1].position.x - centerX
        );

        let angleDiff = angle2 - angle1;
        if (angleDiff < 0) angleDiff += 2 * Math.PI;

        expect(angleDiff).toBeCloseTo(expectedAngleStep, 1);
      }
    });
  });

  describe('forceLayout', () => {
    it('should return result (currently delegates to hierarchical)', () => {
      const nodes = [
        createNode('node-1'),
        createNode('node-2'),
      ];
      const edges = [
        createEdge('node-1', 'node-2'),
      ];

      const result = forceLayout(nodes, edges);

      expect(result).toHaveLength(2);
      result.forEach(node => {
        expect(node.position).toBeDefined();
        expect(node.position.x).toBeGreaterThanOrEqual(0);
        expect(node.position.y).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('layoutAlgorithms export', () => {
    it('should export all layout algorithms', () => {
      expect(layoutAlgorithms).toBeDefined();
      expect(layoutAlgorithms.hierarchical).toBe(hierarchicalLayout);
      expect(layoutAlgorithms.grid).toBe(gridLayout);
      expect(layoutAlgorithms.circular).toBe(circularLayout);
      expect(layoutAlgorithms.force).toBe(forceLayout);
    });

    it('should have all algorithm functions callable', () => {
      const nodes = [createNode('node-1')];
      const edges: Edge[] = [];

      expect(() => layoutAlgorithms.hierarchical(nodes, edges)).not.toThrow();
      expect(() => layoutAlgorithms.grid(nodes, edges)).not.toThrow();
      expect(() => layoutAlgorithms.circular(nodes, edges)).not.toThrow();
      expect(() => layoutAlgorithms.force(nodes, edges)).not.toThrow();
    });
  });

  describe('custom config', () => {
    it('should apply custom spacing in grid layout', () => {
      const nodes = [
        createNode('node-1'),
        createNode('node-2'),
      ];

      const customConfig = {
        nodeSpacing: {
          horizontal: 600,
          vertical: 300,
        },
        levelSpacing: 250,
      };

      const result = gridLayout(nodes, [], customConfig);

      const spacing = result[1].position.x - result[0].position.x;
      expect(spacing).toBe(600);
    });

    it('should apply custom spacing in hierarchical layout', () => {
      const nodes = [
        createNode('parent'),
        createNode('child'),
      ];
      const edges = [
        createEdge('parent', 'child'),
      ];

      const customConfig = {
        nodeSpacing: {
          horizontal: 600,
          vertical: 300,
        },
        levelSpacing: 300,
      };

      const result = hierarchicalLayout(nodes, edges, customConfig);

      const parent = result.find(n => n.id === 'parent');
      const child = result.find(n => n.id === 'child');

      // Vertical spacing should follow custom level spacing
      expect(child!.position.y - parent!.position.y).toBeCloseTo(300, -1);
    });
  });

  describe('edge cases', () => {
    it('should handle nodes without edges', () => {
      const nodes = [
        createNode('isolated-1'),
        createNode('isolated-2'),
        createNode('isolated-3'),
      ];

      const result = hierarchicalLayout(nodes, []);

      expect(result).toHaveLength(3);
      result.forEach(node => {
        expect(node.position).toBeDefined();
      });
    });

    it('should handle large number of nodes', () => {
      const nodes = Array.from({ length: 100 }, (_, i) => createNode(`node-${i}`));

      const result = gridLayout(nodes, []);

      expect(result).toHaveLength(100);
      result.forEach(node => {
        expect(node.position.x).toBeGreaterThanOrEqual(0);
        expect(node.position.y).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle complex hierarchies with multiple branches', () => {
      const nodes = [
        createNode('root'),
        createNode('branch1'),
        createNode('branch2'),
        createNode('leaf1-1'),
        createNode('leaf1-2'),
        createNode('leaf2-1'),
      ];
      const edges = [
        createEdge('root', 'branch1'),
        createEdge('root', 'branch2'),
        createEdge('branch1', 'leaf1-1'),
        createEdge('branch1', 'leaf1-2'),
        createEdge('branch2', 'leaf2-1'),
      ];

      const result = hierarchicalLayout(nodes, edges);

      expect(result).toHaveLength(6);

      const root = result.find(n => n.id === 'root');
      const branch1 = result.find(n => n.id === 'branch1');
      const branch2 = result.find(n => n.id === 'branch2');

      // Root should be above branches
      expect(root!.position.y).toBeLessThan(branch1!.position.y);
      expect(root!.position.y).toBeLessThan(branch2!.position.y);

      // Branches should be at same level
      expect(branch1!.position.y).toBe(branch2!.position.y);
    });
  });
});
