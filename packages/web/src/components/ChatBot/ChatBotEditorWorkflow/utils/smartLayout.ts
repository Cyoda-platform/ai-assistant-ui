/**
 * Layout utilities. Now powered by ELK for deterministic hierarchical layouts.
 */
// ELK in-browser bundle
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - elkjs has no bundled types for the default export path
import ELK from 'elkjs/lib/elk.bundled.js';

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
  LEVEL_SPACING: 400, // Original spacing for horizontal layout
  NODE_SPACING: 200,  // Original spacing between nodes for horizontal
  VERTICAL_SPREAD: 250, // Original vertical space for horizontal
  MIN_DISTANCE: 150,  // Original minimum distance between nodes
  PREFERRED_DISTANCE: 220, // Original preferred distance
  OPTIMIZATION_PASSES: 5, // More optimization passes
  CENTER_PULL_FORCE: 0.2, // Lower pull force to the center
  MAX_CENTER_DISTANCE: 400, // Original allowed distance from the center
  RANDOM_OFFSET_RANGE: 80, // Original randomness for autoLayout
  SELF_LOOP_OFFSET: 40, // Original offset for self-loops
  TERMINAL_MIN_LEVEL: 4,
  EDGE_SEPARATION: 80, // Original edge separation

  // Parameters for vertical alignment - more compact
  NODE_WIDTH: 180, // Approximate node width
  NODE_HEIGHT: 80, // Approximate node height
  VERTICAL_NODE_SPACING: 80, // Reduced spacing between nodes horizontally in vertical mode
  VERTICAL_LEVEL_SPACING: 200, // Reduced spacing between levels in vertical mode
  VERTICAL_CENTER_ALIGNMENT: true, // Strict center alignment in vertical mode
  // Node dimensions used for ELK (px)
  ELK_NODE_WIDTH: 220,
  ELK_NODE_HEIGHT: 100,
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


// Improved tree-like placement function

// Function for arranging a vertical tree with STRICT alignment
// ELK handles ordering/crossing and spacing.

export async function applyAutoLayout(states: WorkflowStates, initialState: string, isVertical: boolean = false): Promise<{ [key: string]: NodePosition }> {
  const positions: { [key: string]: NodePosition } = {};
  if (!states || typeof states !== 'object') return positions;

  const stateNames = Object.keys(states);
  if (stateNames.length === 0) return positions;

  // Build ELK graph
  const elk = new ELK();
  // Use `any` to avoid strict ELK types friction and allow port definitions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elkGraph: any = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': isVertical ? 'DOWN' : 'RIGHT',
  // Spacing & routing
  'elk.spacing.nodeNode': isVertical ? 80 : 100,
  'elk.spacing.componentComponent': 80,
  'elk.spacing.edgeEdge': 50,
  'elk.spacing.edgeNode': 40,
  'elk.layered.spacing.nodeNodeBetweenLayers': isVertical ? 180 : 200,
  'elk.layered.spacing.edgeEdgeBetweenLayers': 50,
  'elk.layered.spacing.edgeNodeBetweenLayers': 40,
  'elk.edgeRouting': 'ORTHOGONAL',

  // Layering & placement: favor readability and straight edges
  'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.nodePlacement.favorStraightEdges': true,
  'elk.layered.compaction.strategy': 'NONE',
  'elk.layered.mergeEdges': false,

  // Reduce crossings and respect model order (states + transitions)
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  'elk.layered.crossingMinimization.semiInteractive': true,

  // Keep ports on expected sides (top/bottom for vertical, left/right for horizontal)
      'elk.portConstraints': 'FIXED_SIDE',
      'elk.layered.nodePlacement.bk.fixedAlignment': 'CENTER',
      'elk.layered.thoroughness': 50,
      'elk.layered.layering.cycleBreaking.strategy': 'DEPTH_FIRST',
    },
    children: stateNames.map((id) => ({
      id,
      width: LAYOUT_CONFIG.ELK_NODE_WIDTH,
      height: LAYOUT_CONFIG.ELK_NODE_HEIGHT,
      ports: [
        { id: `${id}_IN`, properties: { 'org.eclipse.elk.port.side': isVertical ? 'NORTH' : 'WEST' } },
        { id: `${id}_OUT`, properties: { 'org.eclipse.elk.port.side': isVertical ? 'SOUTH' : 'EAST' } },
      ],
    })),
    edges: [] as Array<{ id: string; sources: string[]; targets: string[] }>,
  };

  // Add edges from transitions
  for (const [source, state] of Object.entries(states)) {
    const t = state.transitions;
    if (!t) continue;
    const list = Array.isArray(t) ? t : Object.values(t);
    for (const transition of list) {
      if (!transition?.next) continue;
      const target = transition.next as string;
      if (!stateNames.includes(target)) continue;
      elkGraph.edges.push({ id: `${source}->${target}`,
        sources: [`${source}_OUT`],
        targets: [`${target}_IN`],
      });
    }
  }

  const layout = await elk.layout(elkGraph);
  // Normalize positions so the minimum x/y is near 0
  const xs = (layout.children as Array<{ x?: number }> | undefined)?.map((n) => n.x ?? 0) || [0];
  const ys = (layout.children as Array<{ y?: number }> | undefined)?.map((n) => n.y ?? 0) || [0];
  const minX = Math.min(...xs, 0);
  const minY = Math.min(...ys, 0);

  for (const child of layout.children || []) {
    positions[child.id] = {
      x: Math.round(((child.x ?? 0) - minX)),
      y: Math.round(((child.y ?? 0) - minY)),
    };
  }

  // Post-process to enforce strict vertical/horizontal layers so rows/columns align neatly
  try {
    const graph = buildGraph(states);
    const levels = calculateLevels(graph, initialState);

    const levelMap: Record<number, string[]> = {};
    for (const [node, lvl] of Object.entries(levels)) {
      if (!levelMap[lvl]) levelMap[lvl] = [];
      levelMap[lvl].push(node);
    }

    const sortedLevels = Object.keys(levelMap)
      .map((l) => parseInt(l, 10))
      .sort((a, b) => a - b);

    if (isVertical) {
      const ySpacing = 220; // strict distance between layers
      const xSpacing = 260; // spacing between nodes within the same layer

      for (const lvl of sortedLevels) {
        const nodesInLevel = (levelMap[lvl] || []).filter((id) => positions[id] !== undefined);
        // Preserve ELK ordering by current x
        nodesInLevel.sort((a, b) => (positions[a].x - positions[b].x));

        const totalWidth = (nodesInLevel.length - 1) * xSpacing;
        const startX = -totalWidth / 2;
        nodesInLevel.forEach((id, idx) => {
          positions[id].y = lvl * ySpacing;
          positions[id].x = startX + idx * xSpacing;
        });
      }
    } else {
      const xSpacing = 280; // strict distance between layers
      const ySpacing = 240; // spacing between nodes within the same layer

      for (const lvl of sortedLevels) {
        const nodesInLevel = (levelMap[lvl] || []).filter((id) => positions[id] !== undefined);
        // Preserve ELK ordering by current y
        nodesInLevel.sort((a, b) => (positions[a].y - positions[b].y));

        const totalHeight = (nodesInLevel.length - 1) * ySpacing;
        const startY = -totalHeight / 2;
        nodesInLevel.forEach((id, idx) => {
          positions[id].x = lvl * xSpacing;
          positions[id].y = startY + idx * ySpacing;
        });
      }
    }
  } catch (e) {
    // Fallback to raw ELK positions if any post-processing fails
    console.warn('ELK post-alignment failed, using raw positions', e);
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
