// Layout algorithms for portal canvas
import type { Node, Edge } from '@xyflow/react';

export interface LayoutConfig {
  nodeSpacing: {
    horizontal: number;
    vertical: number;
  };
  levelSpacing: number;
}

const defaultConfig: LayoutConfig = {
  nodeSpacing: {
    horizontal: 250,
    vertical: 150
  },
  levelSpacing: 200
};

/**
 * Hierarchical layout - organizes nodes in levels
 * Level 0: Entities
 * Level 1: Versions
 * Level 2: Workflows
 * Level 3: Requirements
 */
export function hierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig = defaultConfig
): Node[] {
  // Group nodes by type
  const entityNodes = nodes.filter(n => n.type === 'entityNode');
  const versionNodes = nodes.filter(n => n.type === 'versionNode');
  const workflowNodes = nodes.filter(n => n.type === 'workflowNode');
  const requirementNodes = nodes.filter(n => n.type === 'requirementNode');

  const positioned: Node[] = [];
  let currentY = 100;

  // Level 0: Entities (top level)
  entityNodes.forEach((node, index) => {
    positioned.push({
      ...node,
      position: {
        x: 100 + index * config.nodeSpacing.horizontal,
        y: currentY
      }
    });
  });

  currentY += config.levelSpacing;

  // Level 1: Versions (grouped under their entities)
  const versionsByEntity = new Map<string, Node[]>();
  versionNodes.forEach(node => {
    const entityId = (node.data as any).entityId;
    if (!versionsByEntity.has(entityId)) {
      versionsByEntity.set(entityId, []);
    }
    versionsByEntity.get(entityId)!.push(node);
  });

  versionsByEntity.forEach((versions, entityId) => {
    const entityNode = positioned.find(n => n.id === entityId);
    if (entityNode) {
      const startX = entityNode.position.x - ((versions.length - 1) * config.nodeSpacing.horizontal / 2);
      versions.forEach((node, index) => {
        positioned.push({
          ...node,
          position: {
            x: startX + index * (config.nodeSpacing.horizontal / 2),
            y: currentY
          }
        });
      });
    }
  });

  currentY += config.levelSpacing;

  // Level 2: Workflows (grouped under their versions)
  const workflowsByVersion = new Map<string, Node[]>();
  workflowNodes.forEach(node => {
    const versionId = (node.data as any).versionId;
    if (!workflowsByVersion.has(versionId)) {
      workflowsByVersion.set(versionId, []);
    }
    workflowsByVersion.get(versionId)!.push(node);
  });

  workflowsByVersion.forEach((workflows, versionId) => {
    const versionNode = positioned.find(n => n.id === versionId);
    if (versionNode) {
      const startX = versionNode.position.x - ((workflows.length - 1) * config.nodeSpacing.horizontal / 3);
      workflows.forEach((node, index) => {
        positioned.push({
          ...node,
          position: {
            x: startX + index * (config.nodeSpacing.horizontal / 3),
            y: currentY
          }
        });
      });
    }
  });

  currentY += config.levelSpacing;

  // Level 3: Requirements (grouped under workflows or versions)
  const requirementsByParent = new Map<string, Node[]>();
  requirementNodes.forEach(node => {
    const workflowId = (node.data as any).workflowId;
    const versionId = (node.data as any).versionId;
    const parentId = workflowId || versionId;
    if (parentId) {
      if (!requirementsByParent.has(parentId)) {
        requirementsByParent.set(parentId, []);
      }
      requirementsByParent.get(parentId)!.push(node);
    }
  });

  requirementsByParent.forEach((requirements, parentId) => {
    const parentNode = positioned.find(n => n.id === parentId);
    if (parentNode) {
      const startX = parentNode.position.x - ((requirements.length - 1) * 100);
      requirements.forEach((node, index) => {
        positioned.push({
          ...node,
          position: {
            x: startX + index * 100,
            y: currentY
          }
        });
      });
    }
  });

  return positioned;
}

/**
 * Grid layout - simple grid arrangement
 */
export function gridLayout(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig = defaultConfig
): Node[] {
  const columns = Math.ceil(Math.sqrt(nodes.length));
  
  return nodes.map((node, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    return {
      ...node,
      position: {
        x: 100 + col * config.nodeSpacing.horizontal,
        y: 100 + row * config.nodeSpacing.vertical
      }
    };
  });
}

/**
 * Circular layout - arrange nodes in a circle
 */
export function circularLayout(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig = defaultConfig
): Node[] {
  const centerX = 600;
  const centerY = 400;
  const radius = 300;
  
  return nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      }
    };
  });
}

/**
 * Force-directed layout (simplified version)
 * For a full implementation, consider using d3-force or similar
 */
export function forceLayout(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig = defaultConfig
): Node[] {
  // This is a placeholder - for production, use a proper force-directed algorithm
  // For now, fall back to hierarchical
  return hierarchicalLayout(nodes, edges, config);
}

export const layoutAlgorithms = {
  hierarchical: hierarchicalLayout,
  grid: gridLayout,
  circular: circularLayout,
  force: forceLayout
};

