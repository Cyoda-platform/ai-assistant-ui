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

// Explicit workflow types
export interface Transition {
  next: string;
  condition?: unknown;
  criteria?: unknown;
  criterion?: unknown;
}

export type Transitions = Array<Transition> | Record<string, Transition>;

export interface WorkflowState {
  transitions?: Transitions;
}

export type WorkflowStates = Record<string, WorkflowState>;

const LAYOUT_CONFIG = {
  LEVEL_SPACING: 400, // Increased for better readability
  NODE_SPACING: 200,  // Increased spacing between nodes
  VERTICAL_SPREAD: 250, // More vertical space
  MIN_DISTANCE: 150,  // Minimum distance between nodes
  PREFERRED_DISTANCE: 220, // Preferred distance
  OPTIMIZATION_PASSES: 5, // More optimization passes
  CENTER_PULL_FORCE: 0.2, // Lower pull force to the center
  MAX_CENTER_DISTANCE: 400, // Larger allowed distance from the center
  RANDOM_OFFSET_RANGE: 80, // Increased for more randomness on each autoLayout
  SELF_LOOP_OFFSET: 40, // Larger offset for self-loops
  TERMINAL_MIN_LEVEL: 4,
  EDGE_SEPARATION: 80, // New parameter for edge separation

  // Parameters for vertical alignment
  NODE_WIDTH: 180, // Approximate node width
  NODE_HEIGHT: 80, // Approximate node height
  VERTICAL_NODE_SPACING: 120, // Spacing between nodes horizontally in vertical mode
  VERTICAL_LEVEL_SPACING: 300, // Spacing between levels in vertical mode
  VERTICAL_CENTER_ALIGNMENT: true, // Strict center alignment in vertical mode
};

export function calculateSmartPosition(
    stateName: string,
    states: WorkflowStates,
    initialState: string
): NodePosition {
  const graph = buildGraph(states);

  const levels = calculateLevels(graph, initialState);

  const nodesByLevel = groupNodesByLevel(levels, states);

  const nodeLevel = levels[stateName] || 0;
  const nodesInLevel = nodesByLevel[nodeLevel] || [];
  const nodeIndexInLevel = nodesInLevel.indexOf(stateName);

  let x = nodeLevel * LAYOUT_CONFIG.LEVEL_SPACING;

  if (stateName === initialState) {
    x = 0;
  } else if (stateName === 'state_terminal') {
    x = Math.max(
        nodeLevel * LAYOUT_CONFIG.LEVEL_SPACING,
        (Math.max(...Object.values(levels)) + 1) * LAYOUT_CONFIG.LEVEL_SPACING
    );
  }

  let y = 0;

  if (nodesInLevel.length === 1) {
    y = 0;
  } else {
    const totalHeight = (nodesInLevel.length - 1) * LAYOUT_CONFIG.NODE_SPACING;
    const startY = -totalHeight / 2;
    y = startY + nodeIndexInLevel * LAYOUT_CONFIG.NODE_SPACING;

    const randomOffset = (Math.random() - 0.5) * LAYOUT_CONFIG.RANDOM_OFFSET_RANGE;
    y += randomOffset;
  }

  // Add random offset to the X-coordinate for variety
  const randomXOffset = (Math.random() - 0.5) * (LAYOUT_CONFIG.RANDOM_OFFSET_RANGE * 0.6); // 60% of Y variation
  x += randomXOffset;

  const currentState = states[stateName];
  if (currentState?.transitions) {
    const transitions: Transition[] = Array.isArray(currentState.transitions)
        ? currentState.transitions
        : Object.values(currentState.transitions);

    const hasSelfLoop = transitions.some((t: Transition) => t.next === stateName);
    const hasBackwardTransition = transitions.some((t: Transition) => {
      const targetLevel = levels[t.next];
      return targetLevel !== undefined && targetLevel <= nodeLevel;
    });

    if (hasSelfLoop) {
      y += LAYOUT_CONFIG.SELF_LOOP_OFFSET;
    }

    if (hasBackwardTransition && stateName !== initialState) {
      y += nodeIndexInLevel % 2 === 0
          ? -LAYOUT_CONFIG.VERTICAL_SPREAD
          : LAYOUT_CONFIG.VERTICAL_SPREAD;
    }
  }

  return { x, y };
}

export function calculateVerticalPosition(
    stateName: string,
    states: WorkflowStates,
    initialState: string
): NodePosition {
  const graph = buildGraph(states);
  const levels = calculateLevels(graph, initialState);
  const nodesByLevel = groupNodesByLevel(levels, states);

  const nodeLevel = levels[stateName] || 0;
  const nodesInLevel = nodesByLevel[nodeLevel] || [];
  const nodeIndexInLevel = nodesInLevel.indexOf(stateName);

  // In vertical mode Y becomes the main axis of progression - STRICT with no deviations
  let y = nodeLevel * LAYOUT_CONFIG.VERTICAL_LEVEL_SPACING;

  if (stateName === initialState) {
    y = 0;
  } else if (stateName === 'state_terminal') {
    y = Math.max(
        nodeLevel * LAYOUT_CONFIG.VERTICAL_LEVEL_SPACING,
        (Math.max(...Object.values(levels)) + 1) * LAYOUT_CONFIG.VERTICAL_LEVEL_SPACING
    );
  }

  // X is used for placing nodes of the same level - STRICT grid
  let x = 0;
  const spacing = Math.max(
      LAYOUT_CONFIG.VERTICAL_NODE_SPACING,
      Math.round(LAYOUT_CONFIG.NODE_WIDTH * 1.4 + 40)
  );
  if (nodesInLevel.length === 1) {
    x = 0;
  } else {
    const totalWidth = (nodesInLevel.length - 1) * spacing;
    const startX = -totalWidth / 2;
    x = startX + nodeIndexInLevel * spacing;
  }

  // COMPLETELY remove all random offsets for strict alignment
  // const minimalRandomYOffset = (Math.random() - 0.5) * 20; // DISABLED
  // y += minimalRandomYOffset; // DISABLED

  // Simplify transitions handling - only minimal offsets if needed
  const currentState = states[stateName];
  if (currentState?.transitions) {
    const transitions: Transition[] = Array.isArray(currentState.transitions)
        ? currentState.transitions
        : Object.values(currentState.transitions);

    const hasSelfLoop = transitions.some((t: Transition) => t.next === stateName);

    if (hasSelfLoop) {
      // Very small offset for self-loops to not break alignment
      x += 15; // Fixed offset instead of random
    }

    // Disabled handling of backward transitions to preserve alignment
    // const hasBackwardTransition = ... // DISABLED
  }

  return { x, y };
}

export function buildGraph(states: WorkflowStates): GraphNode {
  const graph: GraphNode = {};

  for (const [stateName, stateData] of Object.entries(states)) {
    const state = stateData as WorkflowState;
    graph[stateName] = [];

    if (state && state.transitions) {
      let transitionsArray: Transition[] = [];

      if (Array.isArray(state.transitions)) {
        transitionsArray = state.transitions;
      } else if (typeof state.transitions === 'object') {
        transitionsArray = Object.values(state.transitions);
      }

      for (const transition of transitionsArray) {
        if (transition && transition.next && transition.next !== stateName) {
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

  if (initialState && graph[initialState] !== undefined) {
    queue.push({ node: initialState, level: 0 });
    levels[initialState] = 0;
  } else {
    const firstNode = Object.keys(graph)[0];
    if (firstNode) {
      queue.push({ node: firstNode, level: 0 });
      levels[firstNode] = 0;
    }
  }

  while (queue.length > 0) {
    const { node, level } = queue.shift()!;

    if (visited.has(node)) {
      continue;
    }
    visited.add(node);

    const neighbors = graph[node] || [];

    for (const neighbor of neighbors) {
      if (neighbor === node) continue;

      if (!visited.has(neighbor)) {
        let newLevel = level + 1;

        if (neighbor.includes('terminal')) {
          newLevel = Math.max(newLevel, LAYOUT_CONFIG.TERMINAL_MIN_LEVEL);
        }

        if (levels[neighbor] !== undefined && levels[neighbor] <= level) {
          continue;
        }

        if (levels[neighbor] === undefined || levels[neighbor] > newLevel) {
          levels[neighbor] = newLevel;
          queue.push({ node: neighbor, level: newLevel });
        }
      }
    }
  }

  let maxLevel = Math.max(...Object.values(levels));

  for (const nodeName of Object.keys(graph)) {
    if (levels[nodeName] === undefined) {
      maxLevel += 1;
      levels[nodeName] = maxLevel;
    }
  }

  return levels;
}

export function groupNodesByLevel(levels: NodeLevels, states: WorkflowStates): NodesByLevel {
  const nodesByLevel: NodesByLevel = {};

  for (const [stateName, level] of Object.entries(levels)) {
    if (!nodesByLevel[level]) {
      nodesByLevel[level] = [];
    }
    nodesByLevel[level].push(stateName);
  }

  for (const level of Object.keys(nodesByLevel)) {
    if(!nodesByLevel[parseInt(level)]) continue;
    nodesByLevel[parseInt(level)].sort((a, b) => {
      const stateA = states && states[a] as WorkflowState | undefined;
      const stateB = states && states[b] as WorkflowState | undefined;

      const getNodePriority = (stateName: string, state?: WorkflowState) => {
        if (stateName.includes('terminal')) return 0;

        if (stateName.includes('initial')) return 100;

        // Add protection from null/undefined states
        if (!state) return 40;

        if (state.transitions) {
          const transitionsArray: Transition[] = Array.isArray(state.transitions)
              ? state.transitions
              : Object.values(state.transitions);

          const hasCondition = transitionsArray.some((t: Transition) => t.condition || t.criteria || t.criterion);
          if (hasCondition) return 80;
        }

        if (state.transitions) {
          const transitionsArray: Transition[] = Array.isArray(state.transitions)
              ? state.transitions
              : Object.values(state.transitions);

          const hasSelfLoop = transitionsArray.some((t: Transition) => t.next === stateName);
          if (hasSelfLoop) return 60;
        }

        return 40;
      };

      const priorityA = getNodePriority(a, stateA);
      const priorityB = getNodePriority(b, stateB);

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      const getTransitionsCount = (state?: WorkflowState) => {
        // Add protection from null/undefined states
        if (!state || !state.transitions) return 0;
        return Array.isArray(state.transitions)
            ? state.transitions.length
            : Object.keys(state.transitions).length;
      };

      const transitionsA = getTransitionsCount(stateA);
      const transitionsB = getTransitionsCount(stateB);

      if (transitionsA !== transitionsB) {
        return transitionsB - transitionsA;
      }

      return a.localeCompare(b);
    });
  }

  return nodesByLevel;
}

export function optimizePositions(positions: { [key: string]: NodePosition }): void {
  const positionArray = Object.entries(positions);

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

  const states = Object.keys(positions);
  const centerY = states.reduce((sum, state) => sum + positions[state].y, 0) / states.length;

  for (const state of states) {
    const currentY = positions[state].y;
    const distanceFromCenter = Math.abs(currentY - centerY);

    if (distanceFromCenter > LAYOUT_CONFIG.MAX_CENTER_DISTANCE) {
      positions[state].y = currentY + (centerY - currentY) * LAYOUT_CONFIG.CENTER_PULL_FORCE;
    }
  }
}

// Function to prevent edge crossings
function avoidEdgeCrossings(positions: { [key: string]: NodePosition }, graph: GraphNode): void {
  const stateNames = Object.keys(positions);

  // Iterate several times for optimization
  for (let pass = 0; pass < 3; pass++) {
    for (const stateName of stateNames) {
      const connections = graph[stateName] || [];

      // If the node has connections, try to place them to avoid crossings
      if (connections.length > 1) {
        // Sort target nodes by their Y coordinates
        const sortedConnections = connections
            .filter(target => positions[target])
            .sort((a, b) => positions[a].y - positions[b].y);

        // Distribute nodes evenly vertically
        const currentPos = positions[stateName];
        if (!currentPos) continue; // Protection against missing position

        const spread = LAYOUT_CONFIG.EDGE_SEPARATION * (sortedConnections.length - 1);

        sortedConnections.forEach((target, index) => {
          const targetPos = positions[target];
          if (!targetPos) return; // Protection against missing target position

          const desiredY = currentPos.y - spread/2 + index * LAYOUT_CONFIG.EDGE_SEPARATION;

          // Smooth shift towards the desired position
          positions[target].y = targetPos.y * 0.7 + desiredY * 0.3;
        });
      }
    }
  }
}

// Improved tree-like placement function
function arrangeAsTree(positions: { [key: string]: NodePosition }, graph: GraphNode, levels: NodeLevels): void {
  // Create local version of groupNodesByLevel without dependency on states
  const nodesByLevel: NodesByLevel = {};

  for (const [stateName, level] of Object.entries(levels)) {
    if (!nodesByLevel[level]) {
      nodesByLevel[level] = [];
    }
    nodesByLevel[level].push(stateName);
  }

  Object.keys(nodesByLevel).forEach(levelStr => {
    const level = parseInt(levelStr);
    const nodesInLevel = nodesByLevel[level];

    if (!nodesInLevel || nodesInLevel.length <= 1) return;

    // Sort nodes in level by number of connections (more connections - closer to center)
    const sortedNodes = nodesInLevel.sort((a, b) => {
      const connectionsA = (graph[a] || []).length;
      const connectionsB = (graph[b] || []).length;
      return connectionsB - connectionsA;
    });

    // Place nodes evenly vertically
    const totalHeight = (sortedNodes.length - 1) * LAYOUT_CONFIG.NODE_SPACING;
    const startY = -totalHeight / 2;

    sortedNodes.forEach((nodeName, index) => {
      if (positions[nodeName]) {
        positions[nodeName].y = startY + index * LAYOUT_CONFIG.NODE_SPACING;
      }
    });
  });
}

// Function for arranging a vertical tree with STRICT alignment
function arrangeAsVerticalTree(positions: { [key: string]: NodePosition }, graph: GraphNode, levels: NodeLevels): void {
  // Create local version of groupNodesByLevel without dependency on states
  const nodesByLevel: NodesByLevel = {};

  for (const [stateName, level] of Object.entries(levels)) {
    if (!nodesByLevel[level]) {
      nodesByLevel[level] = [];
    }
    nodesByLevel[level].push(stateName);
  }

  const levelKeys = Object.keys(nodesByLevel).map(k => parseInt(k)).sort((a,b)=>a-b);

  levelKeys.forEach(level => {
    const nodesInLevel = nodesByLevel[level];
    if (!nodesInLevel || nodesInLevel.length === 0) return;

    // Horizontal step of the row: take approximate node width into account so edges don’t overlap neighboring blocks
    const spacing = Math.max(
        LAYOUT_CONFIG.VERTICAL_NODE_SPACING,
        Math.round(LAYOUT_CONFIG.NODE_WIDTH * 1.4 + 40)
    );
    const taken = new Set<number>();
    const placed = new Set<string>();

    // Parent map of current level (including parents from previous levels)
    const parentsMap: Record<string, string[]> = {};
    const prevLevels = levelKeys.filter(l => l < level);
    const allPrevNodes = prevLevels.flatMap(l => nodesByLevel[l] || []);
    for (const parent of allPrevNodes) {
      const children = graph[parent] || [];
      for (const child of children) {
        if ((nodesInLevel as string[]).includes(child)) {
          if (!parentsMap[child]) parentsMap[child] = [];
          parentsMap[child].push(parent);
        }
      }
    }

    // Groups with one parent: place strictly under the parent
    const childrenByParent: Record<string, string[]> = {};
    for (const child of nodesInLevel) {
      const parents = parentsMap[child] || [];
      if (parents.length === 1) {
        const p = parents[0];
        if (!childrenByParent[p]) childrenByParent[p] = [];
        childrenByParent[p].push(child);
      }
    }

    // First place single chains and fan-out from one parent
    for (const [parent, childs] of Object.entries(childrenByParent)) {
      if (!positions[parent] || childs.length === 0) continue;
      const px = positions[parent].x;
      if (childs.length === 1) {
        // Single child — place strictly under the parent
        positions[childs[0]].x = px;
        positions[childs[0]].y = level * LAYOUT_CONFIG.VERTICAL_LEVEL_SPACING;
        taken.add(px);
        placed.add(childs[0]);
      } else {
        // Multiple children — place symmetrically around parent X
        const count = childs.length;
        const start = px - ((count - 1) / 2) * spacing;
        childs.sort((a,b)=>a.localeCompare(b)).forEach((c, idx) => {
          const cx = Math.round(start + idx * spacing);
          positions[c].x = cx;
          positions[c].y = level * LAYOUT_CONFIG.VERTICAL_LEVEL_SPACING;
          taken.add(cx);
          placed.add(c);
        });
      }
    }

    // Remaining nodes: use barycenter of parents and snap to nearest free grid
    const remaining = nodesInLevel.filter(n => !placed.has(n));
    if (remaining.length > 0) {
      const parentXSum: Record<string, number> = {};
      const parentCount: Record<string, number> = {};
      for (const n of remaining) {
        const parents = parentsMap[n] || [];
        for (const p of parents) {
          if (!positions[p]) continue;
          parentXSum[n] = (parentXSum[n] || 0) + positions[p].x;
          parentCount[n] = (parentCount[n] || 0) + 1;
        }
      }

      const desired = remaining.map(n => ({
        n,
        x: parentCount[n] ? parentXSum[n] / parentCount[n] : 0,
      })).sort((a,b)=> a.x - b.x || a.n.localeCompare(b.n));

      // Grid around 0: ..., -2s, -1s, 0, 1s, 2s, ...
      const snapToFree = (targetX: number): number => {
        // Index of cell relative to 0
        const baseIdx = Math.round(targetX / spacing);
        // Check nearest free positions
        for (let d = 0; d < 1000; d++) {
          const candidates = d === 0 ? [baseIdx] : [baseIdx - d, baseIdx + d];
          for (const idx of candidates) {
            const x = idx * spacing;
            if (!taken.has(x)) return x;
          }
        }
        return baseIdx * spacing;
      };

      desired.forEach(({n, x}) => {
        const snapped = snapToFree(x);
        positions[n].x = snapped;
        positions[n].y = level * LAYOUT_CONFIG.VERTICAL_LEVEL_SPACING;
        taken.add(snapped);
      });
    }
  });

  // Remove all additional optimization that might break alignment
  // Object.keys(positions).forEach(nodeName => { ... }); // DISABLED
}

export function applyAutoLayout(states: WorkflowStates, initialState: string, isVertical: boolean = false): { [key: string]: NodePosition } {
  const positions: { [key: string]: NodePosition } = {};

  // Protection against null/undefined states
  if (!states || typeof states !== 'object') {
    return positions;
  }

  const stateNames = Object.keys(states);

  // Protection against empty state list
  if (stateNames.length === 0) {
    return positions;
  }

  let actualInitialState = initialState;
  if (!actualInitialState || !states[actualInitialState]) {
    actualInitialState = stateNames[0];
  }

  const graph = buildGraph(states);
  const levels = calculateLevels(graph, actualInitialState);

  const hasValidLevels = Object.values(levels).some(level => level > 0);

  if (!hasValidLevels) {
    // Linear placement if no levels exist
    stateNames.forEach((stateName, index) => {
      if (isVertical) {
        positions[stateName] = {
          x: 0,
          y: index * LAYOUT_CONFIG.LEVEL_SPACING
        };
      } else {
        positions[stateName] = {
          x: index * LAYOUT_CONFIG.LEVEL_SPACING,
          y: 0
        };
      }
    });
  } else {
    // Placement based on levels
    for (const stateName of stateNames) {
      if (isVertical) {
        positions[stateName] = calculateVerticalPosition(stateName, states, actualInitialState);
      } else {
        positions[stateName] = calculateSmartPosition(stateName, states, actualInitialState);
      }
    }

    // Apply improvements for better readability
    if (isVertical) {
      arrangeAsVerticalTree(positions, graph, levels);
      // In vertical mode DO NOT apply optimizations that break alignment
      // avoidEdgeCrossings(positions, graph); // DISABLED for strict alignment
      // optimizePositions(positions); // DISABLED for strict alignment
    } else {
      arrangeAsTree(positions, graph, levels);
      avoidEdgeCrossings(positions, graph);
      optimizePositions(positions);
    }

    // Add final randomness only for horizontal layout
    if (!isVertical) {
      for (const stateName of stateNames) {
        const finalRandomX = (Math.random() - 0.5) * 40; // ±20px
        const finalRandomY = (Math.random() - 0.5) * 40; // ±20px

        positions[stateName].x += finalRandomX;
        positions[stateName].y += finalRandomY;
      }
    } else {
      // In vertical mode DO NOT apply even minimal offsets
      // for (const stateName of stateNames) {
      //   const minimalRandomX = (Math.random() - 0.5) * 10; // DISABLED
      //   const minimalRandomY = (Math.random() - 0.5) * 10; // DISABLED
      //
      //   positions[stateName].x += minimalRandomX;
      //   positions[stateName].y += minimalRandomY;
      // }
    }
  }

  return positions;
}

/**
 * Function for automatically separating transition label positions
 * to prevent them from overlapping each other
 */
export function generateSeparatedLabelPositions(
    edges: Array<{id: string, sourceX: number, sourceY: number, targetX: number, targetY: number}>,
    existingLabels: {[key: string]: {x: number, y: number}} = {}
): {[key: string]: {x: number, y: number}} {
  const labelPositions: {[key: string]: {x: number, y: number}} = {};

  console.log('🔍 Generating separated labels for edges:', edges.map(e => e.id));
  console.log('🔍 Existing labels:', Object.keys(existingLabels));

  // Group edges by connection coordinates to separate labels between identical connections
  const edgeGroups: {[key: string]: Array<{id: string, sourceX: number, sourceY: number, targetX: number, targetY: number}>} = {};

  for (const edge of edges) {
    // Use coarser grouping by coordinates (rounded to 50px)
    const sourceKey = `${Math.round(edge.sourceX / 50) * 50},${Math.round(edge.sourceY / 50) * 50}`;
    const targetKey = `${Math.round(edge.targetX / 50) * 50},${Math.round(edge.targetY / 50) * 50}`;
    const groupKey = `${sourceKey}-${targetKey}`;

    if (!edgeGroups[groupKey]) {
      edgeGroups[groupKey] = [];
    }
    edgeGroups[groupKey].push(edge);
  }

  console.log('🔍 Edge groups:', Object.keys(edgeGroups).map(key => `${key}: ${edgeGroups[key].length} edges`));

  // Place labels for each group
  for (const groupEdges of Object.values(edgeGroups)) {
    if (groupEdges.length === 1) {
      // Single edge - place at center
      const edge = groupEdges[0];

      // Check if a saved position already exists
      if (existingLabels[edge.id]) {
        labelPositions[edge.id] = existingLabels[edge.id];
      } else {
        labelPositions[edge.id] = {x: 0, y: 0}; // Relative offset from center
      }
    } else {
      // Multiple edges between nearby nodes - place them fan-shaped
      const radius = 120; // Further increased label placement radius
      const maxAngle = Math.PI * 0.75; // 135 degrees maximum spread
      const angleStep = groupEdges.length > 1 ? maxAngle / (groupEdges.length - 1) : 0;
      const startAngle = -maxAngle / 2;

      groupEdges.forEach((edge, index) => {
        if (existingLabels[edge.id]) {
          // Use existing position only if far enough from others
          labelPositions[edge.id] = existingLabels[edge.id];
        } else {
          // Create new fan-shaped position with increased spread
          const angle = startAngle + index * angleStep;
          const baseRadius = radius + (index * 30); // Increase radius for each next label
          const offsetX = Math.cos(angle) * baseRadius;
          const offsetY = Math.sin(angle) * baseRadius;

          labelPositions[edge.id] = {x: offsetX, y: offsetY};
        }
      });
    }
  }

  console.log('🔍 Generated label positions:', Object.keys(labelPositions).length);

  // Additional check and correction of all positions to prevent overlaps
  const MIN_DISTANCE = 80; // Increased minimum distance between any labels
  const labelKeys = Object.keys(labelPositions);

  for (let i = 0; i < labelKeys.length; i++) {
    const keyA = labelKeys[i];
    const edgeA = edges.find(e => e.id === keyA);
    if (!edgeA) continue;

    const posA = labelPositions[keyA];
    const absolutePosA = {
      x: (edgeA.sourceX + edgeA.targetX) / 2 + posA.x,
      y: (edgeA.sourceY + edgeA.targetY) / 2 + posA.y
    };

    for (let j = i + 1; j < labelKeys.length; j++) {
      const keyB = labelKeys[j];
      const edgeB = edges.find(e => e.id === keyB);
      if (!edgeB) continue;

      const posB = labelPositions[keyB];
      const absolutePosB = {
        x: (edgeB.sourceX + edgeB.targetX) / 2 + posB.x,
        y: (edgeB.sourceY + edgeB.targetY) / 2 + posB.y
      };

      const distance = Math.sqrt(
          Math.pow(absolutePosA.x - absolutePosB.x, 2) +
          Math.pow(absolutePosA.y - absolutePosB.y, 2)
      );

      if (distance < MIN_DISTANCE) {
        // Labels are too close — push them apart
        const angle = Math.atan2(absolutePosB.y - absolutePosA.y, absolutePosB.x - absolutePosA.x);
        const pushDistance = MIN_DISTANCE * 1.5; // Increase distance by 1.5 times

        const edgeCenterB = {
          x: (edgeB.sourceX + edgeB.targetX) / 2,
          y: (edgeB.sourceY + edgeB.targetY) / 2
        };

        // Push label B away from label A
        labelPositions[keyB] = {
          x: Math.cos(angle) * pushDistance - (edgeCenterB.x - absolutePosA.x),
          y: Math.sin(angle) * pushDistance - (edgeCenterB.y - absolutePosA.y)
        };
      }
    }
  }

  return labelPositions;
}
