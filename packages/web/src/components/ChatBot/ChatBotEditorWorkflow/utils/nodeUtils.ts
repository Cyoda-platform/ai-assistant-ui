/**
 * Node position utilities for workflow editor
 */

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodePositionsMap {
  [nodeId: string]: NodePosition;
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    stateName: string;
    transitionCount: number;
    isInitial: boolean;
    isTerminal: boolean;
  };
  position: NodePosition;
}

/**
 * Storage helper for node positions
 */
export class NodePositionStorage {
  private helperStorage: any;
  private storageKey: string;

  constructor(helperStorage: any, technicalId: string) {
    this.helperStorage = helperStorage;
    this.storageKey = `workflow-node-positions:${technicalId}`;
  }

  /**
   * Load saved node positions
   */
  loadPositions(): NodePositionsMap {
    return this.helperStorage.get(this.storageKey, {});
  }

  /**
   * Save node positions
   */
  savePositions(positions: NodePositionsMap): void {
    this.helperStorage.set(this.storageKey, positions);
  }

  /**
   * Update positions from node drag event
   */
  updatePositionsFromDrag(event: any): void {
    const positions = this.loadPositions();

    event.nodes.forEach((node: WorkflowNode) => {
      positions[node.id] = node.position;
    });

    this.savePositions(positions);
  }

  /**
   * Clear all saved positions
   */
  clearPositions(): void {
    this.helperStorage.remove(this.storageKey);
  }
}

/**
 * Apply auto-layout to nodes using smart positioning
 */
export function applyAutoLayout(
  nodes: WorkflowNode[],
  workflowData: any,
  calculatePosition: (stateName: string, states: any, initialState: string) => NodePosition,
  optimizePositions: (positions: NodePositionsMap) => void
): { nodes: WorkflowNode[]; positions: NodePositionsMap } {
  const states = workflowData.states || {};
  const initialState = workflowData.initial_state;
  const positions: NodePositionsMap = {};
  
  // Apply smart positioning to all nodes
  for (const node of nodes) {
    positions[node.id] = calculatePosition(node.id, states, initialState);
  }

  // Apply force-directed adjustments for better spacing
  optimizePositions(positions);

  // Update node positions
  const updatedNodes = nodes.map((node: WorkflowNode) => ({
    ...node,
    position: positions[node.id] || node.position
  }));

  return { nodes: updatedNodes, positions };
}

/**
 * Reset viewport to default position
 */
export function resetViewport(setViewport: (viewport: any) => void): void {
  setViewport({ x: 0, y: 0, zoom: 1 });
}

/**
 * Get node by ID
 */
export function findNodeById(nodes: WorkflowNode[], nodeId: string): WorkflowNode | undefined {
  return nodes.find(node => node.id === nodeId);
}

/**
 * Get nodes by level (for layout purposes)
 */
export function getNodesByLevel(nodes: WorkflowNode[], levels: Record<string, number>): Record<number, WorkflowNode[]> {
  const nodesByLevel: Record<number, WorkflowNode[]> = {};
  
  for (const node of nodes) {
    const level = levels[node.id] || 0;
    if (!nodesByLevel[level]) {
      nodesByLevel[level] = [];
    }
    nodesByLevel[level].push(node);
  }
  
  return nodesByLevel;
}

/**
 * Calculate bounding box for a set of nodes
 */
export function calculateBoundingBox(nodes: WorkflowNode[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y);
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Center nodes around origin
 */
export function centerNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  const boundingBox = calculateBoundingBox(nodes);
  const centerX = (boundingBox.minX + boundingBox.maxX) / 2;
  const centerY = (boundingBox.minY + boundingBox.maxY) / 2;

  return nodes.map(node => ({
    ...node,
    position: {
      x: node.position.x - centerX,
      y: node.position.y - centerY,
    },
  }));
}
