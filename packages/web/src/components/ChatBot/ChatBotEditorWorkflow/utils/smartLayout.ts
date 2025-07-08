/**
 * Smart node positioning algorithm inspired by Cytoscape.js
 * Handles automatic layout generation for workflow nodes
 */

export interface NodePosition {
  x: number;
  y: number;
}

export interface GraphNode {
  [key: string]: string[];
}

export interface NodesByLevel {
  [key: number]: string[];
}

export interface NodeLevels {
  [key: string]: number;
}

// Configuration constants
const LAYOUT_CONFIG = {
  LEVEL_SPACING: 300,
  NODE_SPACING: 150,
  VERTICAL_SPREAD: 200,
  MIN_DISTANCE: 120,
  PREFERRED_DISTANCE: 180,
  OPTIMIZATION_PASSES: 3,
  CENTER_PULL_FORCE: 0.3,
  MAX_CENTER_DISTANCE: 300,
  RANDOM_OFFSET_RANGE: 50,
  SELF_LOOP_OFFSET: 30,
  TERMINAL_MIN_LEVEL: 4,
};

export function calculateSmartPosition(
  stateName: string,
  states: any,
  initialState: string
): NodePosition {
  // Build graph structure
  const graph = buildGraph(states);

  // Calculate levels using BFS from initial state
  const levels = calculateLevels(graph, initialState);

  // Group nodes by level
  const nodesByLevel = groupNodesByLevel(levels, states);

  // Calculate position for this specific node
  const nodeLevel = levels[stateName] || 0;
  const nodesInLevel = nodesByLevel[nodeLevel] || [];
  const nodeIndexInLevel = nodesInLevel.indexOf(stateName);

  // Calculate X position (level-based)
  let x = nodeLevel * LAYOUT_CONFIG.LEVEL_SPACING;

  // Special handling for different node types
  if (stateName === initialState) {
    x = 0; // Initial state at origin
  } else if (stateName === 'state_terminal') {
    // Terminal states to the right
    x = Math.max(
      nodeLevel * LAYOUT_CONFIG.LEVEL_SPACING,
      (Math.max(...Object.values(levels)) + 1) * LAYOUT_CONFIG.LEVEL_SPACING
    );
  }

  // Calculate Y position with better distribution
  let y = 0;

  if (nodesInLevel.length === 1) {
    y = 0; // Single node centered
  } else {
    // Multiple nodes in level - spread them out
    const totalHeight = (nodesInLevel.length - 1) * LAYOUT_CONFIG.NODE_SPACING;
    const startY = -totalHeight / 2;
    y = startY + nodeIndexInLevel * LAYOUT_CONFIG.NODE_SPACING;

    // Add some randomness to avoid perfect lines
    const randomOffset = (Math.random() - 0.5) * LAYOUT_CONFIG.RANDOM_OFFSET_RANGE;
    y += randomOffset;
  }

  // Special positioning for self-loops and backward transitions
  const currentState = states[stateName];
  if (currentState?.transitions) {
    const transitions = Object.values(currentState.transitions);
    const hasSelfLoop = transitions.some((t: any) => t.next === stateName);
    const hasBackwardTransition = transitions.some((t: any) => {
      const targetLevel = levels[t.next];
      return targetLevel !== undefined && targetLevel <= nodeLevel;
    });

    if (hasSelfLoop) {
      // Self-loop nodes slightly offset
      y += LAYOUT_CONFIG.SELF_LOOP_OFFSET;
    }

    if (hasBackwardTransition && stateName !== initialState) {
      // Backward transition nodes get vertical offset
      y += nodeIndexInLevel % 2 === 0
        ? -LAYOUT_CONFIG.VERTICAL_SPREAD
        : LAYOUT_CONFIG.VERTICAL_SPREAD;
    }
  }

  return { x, y };
}

export function buildGraph(states: any): GraphNode {
  const graph: GraphNode = {};

  for (const [stateName, stateData] of Object.entries(states)) {
    const state = stateData as any;
    graph[stateName] = [];

    if (state.transitions) {
      for (const [, transitionData] of Object.entries(state.transitions)) {
        const transition = transitionData as any;
        if (transition.next && transition.next !== stateName) {
          graph[stateName].push(transition.next);
        }
      }
    }
  }

  return graph;
}

export function calculateLevels(graph: GraphNode, initialState: string): NodeLevels {
  const levels: NodeLevels = {};
  const visited = new Set<string>();
  const queue: { node: string; level: number }[] = [];

  // Start with initial state at level 0
  if (initialState && graph[initialState]) {
    queue.push({ node: initialState, level: 0 });
    levels[initialState] = 0;
  }

  // BFS to assign levels, but handle cycles better
  while (queue.length > 0) {
    const { node, level } = queue.shift()!;

    if (visited.has(node)) continue;
    visited.add(node);

    const neighbors = graph[node] || [];
    for (const neighbor of neighbors) {
      // Skip self-loops for level calculation
      if (neighbor === node) continue;

      if (!visited.has(neighbor)) {
        let newLevel = level + 1;

        // Special handling for terminal states
        if (neighbor.includes('terminal')) {
          newLevel = Math.max(newLevel, LAYOUT_CONFIG.TERMINAL_MIN_LEVEL);
        }

        // Special handling for backward transitions
        if (levels[neighbor] !== undefined && levels[neighbor] <= level) {
          // This is a backward transition, don't update level
          continue;
        }

        if (levels[neighbor] === undefined || levels[neighbor] > newLevel) {
          levels[neighbor] = newLevel;
          queue.push({ node: neighbor, level: newLevel });
        }
      }
    }
  }

  // Assign levels to remaining unvisited nodes
  let maxLevel = Math.max(...Object.values(levels));
  for (const nodeName of Object.keys(graph)) {
    if (levels[nodeName] === undefined) {
      maxLevel += 1;
      levels[nodeName] = maxLevel;
    }
  }

  return levels;
}

export function groupNodesByLevel(levels: NodeLevels, states: any): NodesByLevel {
  const nodesByLevel: NodesByLevel = {};

  for (const [stateName, level] of Object.entries(levels)) {
    if (!nodesByLevel[level]) {
      nodesByLevel[level] = [];
    }
    nodesByLevel[level].push(stateName);
  }

  // Sort nodes within each level for better visual organization
  for (const level of Object.keys(nodesByLevel)) {
    nodesByLevel[parseInt(level)].sort((a, b) => {
      const stateA = states[a] as any;
      const stateB = states[b] as any;

      // Prioritize nodes by their role in the workflow
      const getNodePriority = (stateName: string, state: any) => {
        // Terminal states get lowest priority (bottom)
        if (stateName.includes('terminal')) return 0;

        // Initial state gets highest priority (top)
        if (stateName.includes('initial')) return 100;

        // Nodes with conditions get medium-high priority
        if (state.transitions) {
          const hasCondition = Object.values(state.transitions).some((t: any) => t.condition);
          if (hasCondition) return 80;
        }

        // Nodes with self-loops get medium priority
        if (state.transitions) {
          const hasSelfLoop = Object.values(state.transitions).some((t: any) => t.next === stateName);
          if (hasSelfLoop) return 60;
        }

        // Regular nodes get base priority
        return 40;
      };

      const priorityA = getNodePriority(a, stateA);
      const priorityB = getNodePriority(b, stateB);

      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }

      // Sort by number of transitions (more connected nodes first)
      const transitionsA = Object.keys(stateA.transitions || {}).length;
      const transitionsB = Object.keys(stateB.transitions || {}).length;

      if (transitionsA !== transitionsB) {
        return transitionsB - transitionsA;
      }

      // Finally by name for consistency
      return a.localeCompare(b);
    });
  }

  return nodesByLevel;
}

export function optimizePositions(positions: { [key: string]: NodePosition }): void {
  const positionArray = Object.entries(positions);

  // Multiple passes for better distribution
  for (let pass = 0; pass < LAYOUT_CONFIG.OPTIMIZATION_PASSES; pass++) {
    for (let i = 0; i < positionArray.length; i++) {
      for (let j = i + 1; j < positionArray.length; j++) {
        const [, pos1] = positionArray[i];
        const [, pos2] = positionArray[j];

        const distance = Math.sqrt(
          Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
        );

        if (distance < LAYOUT_CONFIG.MIN_DISTANCE) {
          const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
          const moveDistance = (LAYOUT_CONFIG.MIN_DISTANCE - distance) / 2;

          pos1.x -= Math.cos(angle) * moveDistance;
          pos1.y -= Math.sin(angle) * moveDistance;
          pos2.x += Math.cos(angle) * moveDistance;
          pos2.y += Math.sin(angle) * moveDistance;
        } else if (distance < LAYOUT_CONFIG.PREFERRED_DISTANCE) {
          // Gentle adjustment for preferred spacing
          const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
          const moveDistance = (LAYOUT_CONFIG.PREFERRED_DISTANCE - distance) / 8;

          pos1.x -= Math.cos(angle) * moveDistance;
          pos1.y -= Math.sin(angle) * moveDistance;
          pos2.x += Math.cos(angle) * moveDistance;
          pos2.y += Math.sin(angle) * moveDistance;
        }
      }
    }
  }

  // Apply vertical clustering to reduce vertical spread
  const states = Object.keys(positions);
  const centerY = states.reduce((sum, state) => sum + positions[state].y, 0) / states.length;

  for (const state of states) {
    const currentY = positions[state].y;
    const distanceFromCenter = Math.abs(currentY - centerY);

    if (distanceFromCenter > LAYOUT_CONFIG.MAX_CENTER_DISTANCE) {
      // Gently pull extreme nodes towards center
      positions[state].y = currentY + (centerY - currentY) * LAYOUT_CONFIG.CENTER_PULL_FORCE;
    }
  }
}

export function applyAutoLayout(states: any, initialState: string): { [key: string]: NodePosition } {
  const positions: { [key: string]: NodePosition } = {};

  // Apply smart positioning to all nodes
  for (const stateName of Object.keys(states)) {
    positions[stateName] = calculateSmartPosition(stateName, states, initialState);
  }

  // Apply force-directed adjustments for better spacing
  optimizePositions(positions);

  return positions;
}
