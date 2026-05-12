// Layout algorithms for portal canvas
import type { Node, Edge } from '@xyflow/react';

export interface LayoutConfig {
  nodeSpacing: {
    horizontal: number;
    vertical: number;
  };
  levelSpacing: number;
}

// All nodes now have consistent width of 300px
const NODE_WIDTH = 300;

// Node height estimates (collapsed state)
const NODE_HEIGHTS: Record<string, number> = {
  environmentNode: 80,
  appNode: 80,
  requirementNode: 80,
  entityVersionNode: 80,
  workflowNode: 80,
  codeNode: 80,
  default: 80
};

const defaultConfig: LayoutConfig = {
  nodeSpacing: {
    horizontal: 450, // NODE_WIDTH (300) + gap (150) - more breathing room
    vertical: 180    // NODE_HEIGHT (80) + gap (100) - more vertical space
  },
  levelSpacing: 220  // Vertical spacing between hierarchy levels - slightly more space
};

interface TreeNode {
  id: string;
  node: Node;
  children: TreeNode[];
  x: number;
  y: number;
  mod: number; // Modifier for positioning
}

/**
 * Tree layout algorithm with proper spacing
 * Uses a modified Reingold-Tilford algorithm:
 * - Parent nodes are centered over their children
 * - Siblings are evenly spaced
 * - Subtrees don't overlap
 */
export function hierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig = defaultConfig
): Node[] {
  if (nodes.length === 0) return [];

  // Build adjacency map
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  const nodeMap = new Map<string, Node>();

  nodes.forEach(node => nodeMap.set(node.id, node));

  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
    parentMap.set(edge.target, edge.source);
  });

  // Find root nodes (nodes with no parents)
  const rootNodes = nodes.filter(n => !parentMap.has(n.id));

  if (rootNodes.length === 0) {
    // Fallback: simple grid layout if no clear hierarchy
    return gridLayout(nodes, edges, config);
  }

  // Build tree structure for each root
  const trees: TreeNode[] = [];
  rootNodes.forEach(rootNode => {
    const tree = buildTree(rootNode.id, nodeMap, childrenMap);
    if (tree) trees.push(tree);
  });

  // Calculate positions for each tree
  const positioned: Node[] = [];
  let currentTreeX = 100;

  trees.forEach((tree, treeIndex) => {
    // First pass: calculate relative positions
    calculateInitialX(tree, 0, 0, config);

    // Second pass: collect all nodes and find bounds
    const treeNodes: TreeNode[] = [];
    collectNodes(tree, treeNodes);

    // Find min X to normalize positions
    let minX = Infinity;
    let maxX = -Infinity;
    treeNodes.forEach(node => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
    });

    // Adjust positions to start from currentTreeX
    const offsetX = currentTreeX - minX;

    treeNodes.forEach(node => {
      const finalX = node.x + offsetX;
      positioned.push({
        ...node.node,
        position: {
          x: finalX,
          y: node.y
        }
      });
      maxX = Math.max(maxX, finalX);
    });

    // Update position for next tree
    currentTreeX = maxX + config.nodeSpacing.horizontal * 2;
  });

  return positioned;
}

/**
 * Build tree structure from nodes and edges
 */
function buildTree(
  nodeId: string,
  nodeMap: Map<string, Node>,
  childrenMap: Map<string, string[]>
): TreeNode | null {
  const node = nodeMap.get(nodeId);
  if (!node) return null;

  const childIds = childrenMap.get(nodeId) || [];
  const children: TreeNode[] = [];

  childIds.forEach(childId => {
    const childTree = buildTree(childId, nodeMap, childrenMap);
    if (childTree) children.push(childTree);
  });

  return {
    id: nodeId,
    node: node,
    children: children,
    x: 0,
    y: 0,
    mod: 0
  };
}

/**
 * Calculate positions recursively
 * Each node is positioned relative to its parent
 */
function calculateInitialX(tree: TreeNode, depth: number, parentX: number = 0, config: LayoutConfig = defaultConfig): void {
  tree.y = 100 + depth * config.levelSpacing;

  if (tree.children.length === 0) {
    // Leaf node - positioned at parent's X
    tree.x = parentX;
    tree.mod = 0;
    return;
  }

  // Recursively calculate positions for all children first
  const numChildren = tree.children.length;
  const spacing = defaultConfig.nodeSpacing.horizontal;

  if (numChildren === 1) {
    // Single child - parent directly above child
    const childX = parentX;
    calculateInitialX(tree.children[0], depth + 1, childX, config);
    tree.x = childX;
    tree.mod = 0;
    return;
  }

  // Position children evenly spaced around parent
  // Calculate total width needed
  const totalWidth = (numChildren - 1) * spacing;

  // Start from the left of parent
  let currentX = parentX - totalWidth / 2;

  tree.children.forEach((child) => {
    calculateInitialX(child, depth + 1, currentX, config);
    currentX += spacing;
  });

  // Parent is centered over children
  tree.x = parentX;
  tree.mod = 0;
}

/**
 * Collect all nodes from tree into a flat array
 */
function collectNodes(tree: TreeNode, result: TreeNode[]): void {
  result.push(tree);
  tree.children.forEach(child => collectNodes(child, result));
}

/**
 * Legacy hierarchical layout - organizes nodes in 6 levels
 * Level 0: Environments
 * Level 1: Apps
 * Level 2: Requirements (versioned)
 * Level 3: Entity-Versions
 * Level 4: Workflows
 * Level 5: Code
 */
export function hierarchicalLayoutLegacy(
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

  // Add any nodes that weren't placed (no parent data or edges) in a grid at the bottom
  const positionedIds = new Set(positioned.map(n => n.id));
  const orphanedNodes = nodes.filter(n => !positionedIds.has(n.id));
  if (orphanedNodes.length > 0) {
    currentY += config.levelSpacing;
    orphanedNodes.forEach((node, index) => {
      positioned.push({
        ...node,
        position: {
          x: 100 + index * config.nodeSpacing.horizontal,
          y: currentY,
        }
      });
    });
  }

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

