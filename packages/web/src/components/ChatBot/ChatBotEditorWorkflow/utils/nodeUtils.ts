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
 * Storage helper for node positions - now uses workflow meta data instead of localStorage
 */
export class NodePositionStorage {
  private helperStorage: any;
  private storageKey: string;

  constructor(helperStorage: any, technicalId: string) {
    this.helperStorage = helperStorage;
    this.storageKey = `workflow-node-positions:${technicalId}`;
  }

  /**
   * Load saved node positions - returns empty object, use workflowMetaData instead
   * @deprecated Use workflowMetaData directly instead
   */
  loadPositions(): NodePositionsMap {
    // Возвращаем пустой объект, позиции теперь загружаются из workflowMetaData
    return {};
  }

  /**
   * Save node positions - no-op, use workflowMetaData instead
   * @deprecated Use workflowMetaData directly instead
   */
  savePositions(positions: NodePositionsMap): void {
    // Больше не сохраняем в localStorage
    console.log('📍 NodePositionStorage.savePositions() is deprecated, use workflowMetaData instead');
  }

  /**
   * Update positions from node drag event - no-op, use workflowMetaData instead
   * @deprecated Use workflowMetaData directly instead
   */
  updatePositionsFromDrag(event: any): void {
    // Больше не обновляем localStorage
    console.log('📍 NodePositionStorage.updatePositionsFromDrag() is deprecated, use workflowMetaData instead');
  }

  /**
   * Clear all saved positions - no-op, use workflowMetaData instead
   * @deprecated Use workflowMetaData directly instead
   */
  clearPositions(): void {
    // Больше не очищаем localStorage
    console.log('📍 NodePositionStorage.clearPositions() is deprecated, use workflowMetaData instead');
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

  for (const node of nodes) {
    positions[node.id] = calculatePosition(node.id, states, initialState);
  }

  optimizePositions(positions);

  const updatedNodes = nodes.map((node: WorkflowNode) => ({
    ...node,
    position: positions[node.id] || node.position
  }));

  return { nodes: updatedNodes, positions };
}

export function resetViewport(setViewport: (viewport: any) => void): void {
  setViewport({ x: 0, y: 0, zoom: 1 });
}

export function findNodeById(nodes: WorkflowNode[], nodeId: string): WorkflowNode | undefined {
  return nodes.find(node => node.id === nodeId);
}

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
