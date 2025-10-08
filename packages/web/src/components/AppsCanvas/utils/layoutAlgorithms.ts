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
 * Hierarchical layout - organizes nodes in 6 levels
 * Level 0: Environments
 * Level 1: Apps
 * Level 2: Requirements (versioned)
 * Level 3: Entity-Versions
 * Level 4: Workflows
 * Level 5: Code
 */
export function hierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig = defaultConfig
): Node[] {
  // Group nodes by type
  const environmentNodes = nodes.filter(n => n.type === 'environmentNode');
  const appNodes = nodes.filter(n => n.type === 'appNode');
  const requirementNodes = nodes.filter(n => n.type === 'requirementNode');
  const entityVersionNodes = nodes.filter(n => n.type === 'entityVersionNode');
  const workflowNodes = nodes.filter(n => n.type === 'workflowNode');
  const codeNodes = nodes.filter(n => n.type === 'codeNode');

  const positioned: Node[] = [];
  let currentY = 100;

  // Level 0: Environments (top level)
  environmentNodes.forEach((node, index) => {
    positioned.push({
      ...node,
      position: {
        x: 100 + index * config.nodeSpacing.horizontal * 1.5,
        y: currentY
      }
    });
  });

  currentY += config.levelSpacing;

  // Level 1: Apps (grouped under environments)
  const appsByEnvironment = new Map<string, Node[]>();
  appNodes.forEach(node => {
    const environmentId = (node.data as any).environmentId || edges.find(e => e.target === node.id)?.source;
    if (environmentId) {
      if (!appsByEnvironment.has(environmentId)) {
        appsByEnvironment.set(environmentId, []);
      }
      appsByEnvironment.get(environmentId)!.push(node);
    }
  });

  appsByEnvironment.forEach((apps, environmentId) => {
    const envNode = positioned.find(n => n.id === environmentId);
    if (envNode) {
      const startX = envNode.position.x - ((apps.length - 1) * config.nodeSpacing.horizontal / 2);
      apps.forEach((node, index) => {
        positioned.push({
          ...node,
          position: {
            x: startX + index * config.nodeSpacing.horizontal,
            y: currentY
          }
        });
      });
    }
  });

  currentY += config.levelSpacing;

  // Level 2: Requirements (grouped under apps)
  const requirementsByApp = new Map<string, Node[]>();
  requirementNodes.forEach(node => {
    const appId = (node.data as any).appId || edges.find(e => e.target === node.id)?.source;
    if (appId) {
      if (!requirementsByApp.has(appId)) {
        requirementsByApp.set(appId, []);
      }
      requirementsByApp.get(appId)!.push(node);
    }
  });

  requirementsByApp.forEach((requirements, appId) => {
    const appNode = positioned.find(n => n.id === appId);
    if (appNode) {
      const startX = appNode.position.x - ((requirements.length - 1) * config.nodeSpacing.horizontal / 3);
      requirements.forEach((node, index) => {
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

  // Level 3: Entity-Versions (grouped under requirements)
  const entityVersionsByRequirement = new Map<string, Node[]>();
  entityVersionNodes.forEach(node => {
    const requirementId = (node.data as any).requirementId || edges.find(e => e.target === node.id)?.source;
    if (requirementId) {
      if (!entityVersionsByRequirement.has(requirementId)) {
        entityVersionsByRequirement.set(requirementId, []);
      }
      entityVersionsByRequirement.get(requirementId)!.push(node);
    }
  });

  entityVersionsByRequirement.forEach((entityVersions, requirementId) => {
    const reqNode = positioned.find(n => n.id === requirementId);
    if (reqNode) {
      const startX = reqNode.position.x - ((entityVersions.length - 1) * 150);
      entityVersions.forEach((node, index) => {
        positioned.push({
          ...node,
          position: {
            x: startX + index * 300,
            y: currentY
          }
        });
      });
    }
  });

  currentY += config.levelSpacing;

  // Level 4: Workflows (grouped under entity-versions)
  const workflowsByEntityVersion = new Map<string, Node[]>();
  workflowNodes.forEach(node => {
    const entityVersionId = (node.data as any).entityVersionId;
    if (entityVersionId) {
      if (!workflowsByEntityVersion.has(entityVersionId)) {
        workflowsByEntityVersion.set(entityVersionId, []);
      }
      workflowsByEntityVersion.get(entityVersionId)!.push(node);
    }
  });

  workflowsByEntityVersion.forEach((workflows, entityVersionId) => {
    const entityVersionNode = positioned.find(n => n.id === entityVersionId);
    if (entityVersionNode) {
      const startX = entityVersionNode.position.x - ((workflows.length - 1) * 100);
      workflows.forEach((node, index) => {
        positioned.push({
          ...node,
          position: {
            x: startX + index * 200,
            y: currentY
          }
        });
      });
    }
  });

  currentY += config.levelSpacing;

  // Level 5: Code (grouped under workflows)
  const codeByWorkflow = new Map<string, Node[]>();
  codeNodes.forEach(node => {
    const workflowId = (node.data as any).workflowId;
    if (workflowId) {
      if (!codeByWorkflow.has(workflowId)) {
        codeByWorkflow.set(workflowId, []);
      }
      codeByWorkflow.get(workflowId)!.push(node);
    }
  });

  codeByWorkflow.forEach((codeFiles, workflowId) => {
    const workflowNode = positioned.find(n => n.id === workflowId);
    if (workflowNode) {
      const startX = workflowNode.position.x - ((codeFiles.length - 1) * 75);
      codeFiles.forEach((node, index) => {
        positioned.push({
          ...node,
          position: {
            x: startX + index * 150,
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

