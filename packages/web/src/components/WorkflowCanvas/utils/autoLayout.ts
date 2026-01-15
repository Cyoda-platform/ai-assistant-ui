// ABOUTME: This file provides automatic layout functionality using a custom hierarchical layout algorithm
// to arrange workflow states in a hierarchical, visually organized manner.

import dagre from '@dagrejs/dagre';
import type { UIWorkflowData, UIStateData, UITransitionData } from '../types/workflow';

/**
 * Assigns rank (level) to each state based on topological distance from initial state.
 * Handles cycles by allowing back-edges.
 */
function assignRanks(workflow: UIWorkflowData): Map<string, number> {
  const ranks = new Map<string, number>();
  const stateIds = Object.keys(workflow.configuration.states);
  const initialState = workflow.configuration.initialState;

  // Initialize all ranks to -1 (unvisited)
  stateIds.forEach(id => ranks.set(id, -1));

  // BFS from initial state
  const queue: string[] = [initialState];
  ranks.set(initialState, 0);

  while (queue.length > 0) {
    const currentStateId = queue.shift()!;
    const currentRank = ranks.get(currentStateId)!;
    const stateDefinition = workflow.configuration.states[currentStateId];

    if (stateDefinition) {
      stateDefinition.transitions.forEach(transition => {
        const nextStateId = transition.next;
        const nextRank = ranks.get(nextStateId) ?? -1;

        // Only update if we haven't visited this state yet, or if we found a shorter path
        if (nextRank === -1) {
          ranks.set(nextStateId, currentRank + 1);
          queue.push(nextStateId);
        } else if (nextRank <= currentRank) {
          // This is a back-edge or self-loop, keep the existing rank
          // (don't increase rank for cycles)
        }
      });
    }
  }

  // Handle any unvisited states (disconnected components)
  let maxRank = Math.max(...Array.from(ranks.values()), 0);
  stateIds.forEach(stateId => {
    if (ranks.get(stateId) === -1) {
      ranks.set(stateId, maxRank + 1);
      maxRank++;
    }
  });

  return ranks;
}

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  rankSeparation?: number;
  nodeSeparation?: number;
  edgeSeparation?: number;
  minTransitionLength?: number; // Minimum vertical distance for transition nodes
  minTransitionWidth?: number; // Minimum horizontal distance for transition nodes
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
}

export interface LayoutResult {
  states: Array<{
    id: string;
    position: { x: number; y: number };
  }>;
  transitions?: Array<{
    id: string;
    sourceStateId?: string;
    targetStateId?: string;
    position: { x: number; y: number };
    // Handle information for bidirectional transitions
    stateToTransitionSourceHandle?: string;
    stateToTransitionTargetHandle?: string;
    transitionToStateSourceHandle?: string;
    transitionToStateTargetHandle?: string;
    // Handle information for regular transitions
    sourceHandle?: string;
    targetHandle?: string;
  }>;
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  nodeWidth: 200,      // State node width (actual visual width ~180px)
  nodeHeight: 100,     // State node height (actual visual height ~80px)
  rankSeparation: 350, // Vertical spacing between ranks (TB/BT layout)
  nodeSeparation: 400, // Horizontal spacing between nodes in same rank
  edgeSeparation: 100, // Spacing between parallel edges
  minTransitionLength: 150, // Minimum vertical distance for transition nodes
  minTransitionWidth: 100, // Minimum horizontal distance for transition nodes
  direction: 'TB', // Top to Bottom
};

/**
 * Estimate text width based on character count and font size.
 * For text-xl (20px) font-semibold, average character width is ~9px (accounting for Cyrillic).
 * This matches the implementation in dagreLayout.ts.
 */
function estimateTextWidth(text: string | undefined | null, fontSize: number = 20, isBold: boolean = true): number {
  if (!text) return 0;
  // Average character width (9px works well for both Latin and Cyrillic)
  const avgCharWidth = 9;
  const scaleFactor = fontSize / 20; // Scale based on font size
  return text.length * avgCharWidth * scaleFactor;
}

/**
 * Estimate the total width of a state node including icon, text, button, and padding.
 * StateNode has: icon (14px) + space (4px) + text + space (4px) + button (14px) + padding (40px)
 */
function estimateStateNodeWidth(stateName: string | undefined | null): number {
  const iconWidth = 14;
  const buttonWidth = 14;
  const spacing = 4 * 2; // space-x-1 between elements
  const padding = 40; // px-5 on both sides
  const textWidth = estimateTextWidth(stateName, 20, true);

  const totalWidth = iconWidth + spacing + textWidth + buttonWidth + padding;
  const minWidth = 180; // min-w-[180px] from StateNode

  return Math.max(minWidth, totalWidth);
}

/**
 * Estimate the width of a transition label.
 * Transition labels are simpler, just text with some padding.
 */
function estimateTransitionLabelWidth(transitionName: string | undefined | null): number {
  const textWidth = estimateTextWidth(transitionName, 20, false);
  const padding = 20; // Approximate padding around transition labels
  const minWidth = 50; // Minimum width for transition labels
  return Math.max(minWidth, textWidth + padding);
}

/**
 * Calculate dynamic spacing per rank based on transitions between consecutive ranks.
 * Returns a map of rank -> spacing to next rank.
 */
function calculatePerRankSpacing(
  workflow: UIWorkflowData,
  ranks: Map<string, number>,
  statesByRank: Map<number, string[]>,
  direction: 'TB' | 'BT' | 'LR' | 'RL',
  baseRankSeparation: number
): Map<number, number> {
  const nodeWidth = 200;
  const rankSpacing = new Map<number, number>();

  // Get sorted ranks
  const sortedRanks = Array.from(statesByRank.keys()).sort((a, b) => a - b);

  // For each rank, calculate spacing to the next rank
  sortedRanks.forEach((rank, index) => {
    if (index === sortedRanks.length - 1) {
      // Last rank - use base spacing
      rankSpacing.set(rank, baseRankSeparation);
      return;
    }

    const nextRank = sortedRanks[index + 1];
    const statesInRank = statesByRank.get(rank) || [];
    const statesInNextRank = statesByRank.get(nextRank) || [];

    // Find max state node width in current and next rank
    let maxStateNodeWidth = 0;
    [...statesInRank, ...statesInNextRank].forEach(stateId => {
      const state = workflow.configuration.states[stateId];
      if (state) {
        const width = estimateStateNodeWidth(state.name);
        maxStateNodeWidth = Math.max(maxStateNodeWidth, width);
      }
    });

    // Find max transition label width between this rank and next rank
    let maxTransitionLabelWidth = 0;
    statesInRank.forEach(stateId => {
      const state = workflow.configuration.states[stateId];
      if (!state) return;

      state.transitions.forEach(transition => {
        const targetRank = ranks.get(transition.next);
        // Only consider transitions going to the next rank
        if (targetRank === nextRank) {
          const width = estimateTransitionLabelWidth(transition.name);
          maxTransitionLabelWidth = Math.max(maxTransitionLabelWidth, width);
        }
      });
    });

    // Calculate spacing based on direction
    let spacing = baseRankSeparation;

    if (direction === 'TB' || direction === 'BT') {
      // For TB/BT: rankSeparation is vertical
      // Adjust based on transition label width (transitions appear vertically between ranks)
      if (maxTransitionLabelWidth > 100) {
        const extraSpace = (maxTransitionLabelWidth - 100) * 0.5;
        spacing = Math.max(spacing, baseRankSeparation + extraSpace);
      }
    } else {
      // For LR/RL: rankSeparation is horizontal
      // Adjust based on both state node width and transition label width
      let horizontalAdjustment = 0;

      // Account for wide state nodes
      if (maxStateNodeWidth > nodeWidth) {
        const overflow = maxStateNodeWidth - nodeWidth;
        horizontalAdjustment = Math.max(horizontalAdjustment, overflow);
      }

      // Account for long transition labels (critical for LR layout!)
      if (maxTransitionLabelWidth > 100) {
        const transitionOverflow = maxTransitionLabelWidth - 100;
        horizontalAdjustment = Math.max(horizontalAdjustment, transitionOverflow + 100);
      }

      spacing = Math.max(spacing, baseRankSeparation + horizontalAdjustment);
    }

    // Apply reasonable limits
    const maxSpacing = direction === 'TB' || direction === 'BT' ? 600 : 1000;
    rankSpacing.set(rank, Math.min(spacing, maxSpacing));
  });

  return rankSpacing;
}

/**
 * Calculate dynamic spacing based on the longest state/transition names in the workflow.
 * Returns adjusted rankSeparation and nodeSeparation values.
 * This is used for nodeSeparation (cross-axis spacing).
 */
function calculateDynamicSpacing(
  workflow: UIWorkflowData,
  statesByRank: Map<number, string[]>,
  direction: 'TB' | 'BT' | 'LR' | 'RL',
  baseRankSeparation: number,
  baseNodeSeparation: number
): { rankSeparation: number; nodeSeparation: number } {
  const nodeWidth = 200;
  const nodeHeight = 100;

  // Find the longest state node width (including icon, button, padding)
  let maxStateNodeWidth = 0;
  let longestStateName = '';
  Object.values(workflow.configuration.states).forEach(state => {
    const width = estimateStateNodeWidth(state.name);
    if (width > maxStateNodeWidth) {
      maxStateNodeWidth = width;
      longestStateName = state.name;
    }
  });

  // Find the longest transition label width
  let maxTransitionLabelWidth = 0;
  let longestTransitionName = '';
  Object.values(workflow.configuration.states).forEach(state => {
    state.transitions.forEach(transition => {
      const width = estimateTransitionLabelWidth(transition.name);
      if (width > maxTransitionLabelWidth) {
        maxTransitionLabelWidth = width;
        longestTransitionName = transition.name;
      }
    });
  });



  let adjustedRankSeparation = baseRankSeparation;
  let adjustedNodeSeparation = baseNodeSeparation;

  if (direction === 'TB' || direction === 'BT') {
    // For TB/BT: rankSeparation is vertical, nodeSeparation is horizontal

    // Adjust horizontal spacing (nodeSeparation) if state nodes are wide
    if (maxStateNodeWidth > nodeWidth) {
      const overflow = maxStateNodeWidth - nodeWidth;
      adjustedNodeSeparation = Math.max(
        baseNodeSeparation,
        baseNodeSeparation + overflow + 50 // Add overflow + 50px clearance
      );
    }

    // Adjust vertical spacing (rankSeparation) if transition labels are long
    // Transitions are positioned between states vertically
    if (maxTransitionLabelWidth > 100) {
      const extraSpace = Math.max(0, (maxTransitionLabelWidth - 100) * 0.5);
      adjustedRankSeparation = Math.max(
        baseRankSeparation,
        baseRankSeparation + extraSpace
      );
    }
  } else {
    // For LR/RL: rankSeparation is horizontal, nodeSeparation is vertical

    // Adjust horizontal spacing (rankSeparation) based on both state nodes and transition labels
    let horizontalAdjustment = 0;

    // Account for wide state nodes
    if (maxStateNodeWidth > nodeWidth) {
      const overflow = maxStateNodeWidth - nodeWidth;
      horizontalAdjustment = Math.max(horizontalAdjustment, overflow);
    }

    // Account for long transition labels (they appear between states horizontally)
    // This is critical for LR layout!
    if (maxTransitionLabelWidth > 100) {
      const transitionOverflow = maxTransitionLabelWidth - 100;
      // Use full overflow + extra clearance for transitions
      horizontalAdjustment = Math.max(horizontalAdjustment, transitionOverflow + 100);
    }

    adjustedRankSeparation = Math.max(
      baseRankSeparation,
      baseRankSeparation + horizontalAdjustment
    );

    // Adjust vertical spacing (nodeSeparation) if state nodes are tall
    // For LR/RL, states are stacked vertically in the same rank
    if (maxStateNodeWidth > nodeWidth) {
      // If nodes are wide, they might need more vertical space too
      const extraSpace = Math.max(0, (maxStateNodeWidth - nodeWidth) * 0.1);
      adjustedNodeSeparation = Math.max(
        baseNodeSeparation,
        baseNodeSeparation + extraSpace
      );
    }
  }

  // Apply reasonable limits
  const maxRankSeparation = direction === 'TB' || direction === 'BT' ? 600 : 1000;
  const maxNodeSeparation = 700;

  return {
    rankSeparation: Math.min(adjustedRankSeparation, maxRankSeparation),
    nodeSeparation: Math.min(adjustedNodeSeparation, maxNodeSeparation),
  };
}

/**
 * Extracts the position (without -source/-target suffix) from a handle name.
 * E.g., "left-top-source" -> "left-top", "top-center-target" -> "top-center"
 * This allows us to check if the exact same position is used by opposite handle type.
 */
function getHandlePosition(handle: string): string {
  // Remove -source or -target suffix
  return handle.replace(/-source$/, '').replace(/-target$/, '');
}

/**
 * Find an available handle on a state, preferring handles in the given direction.
 * First tries preferred handles, then searches all available handles.
 * Only reuses a handle if ALL handles are taken.
 *
 * Checks both source and target handles to avoid collisions on the same side.
 * For example, if "left-top-target" is used, we should avoid "left-top-source".
 */
function findAvailableHandle(
  stateId: string,
  usedSourceHandles: Map<string, Set<string>>,
  usedTargetHandles: Map<string, Set<string>>,
  preferredHandles: string[],
  isSourceHandle: boolean
): string {
  const usedSame = (isSourceHandle ? usedSourceHandles : usedTargetHandles).get(stateId) || new Set<string>();
  const usedOpposite = (isSourceHandle ? usedTargetHandles : usedSourceHandles).get(stateId) || new Set<string>();

  // All available handles for states (10 positions × 2 types = 20 total)
  const allAvailableHandles = [
    // Top handles
    'top-left-source', 'top-left-target',
    'top-center-source', 'top-center-target',
    'top-right-source', 'top-right-target',
    // Left handles
    'left-top-source', 'left-top-target',
    'left-bottom-source', 'left-bottom-target',
    // Right handles
    'right-top-source', 'right-top-target',
    'right-bottom-source', 'right-bottom-target',
    // Bottom handles
    'bottom-left-source', 'bottom-left-target',
    'bottom-center-source', 'bottom-center-target',
    'bottom-right-source', 'bottom-right-target',
  ];

  // Filter to only handles of the correct type (source or target)
  const handleType = isSourceHandle ? 'source' : 'target';
  const availableHandlesOfType = allAvailableHandles.filter(h => h.endsWith(`-${handleType}`));

  // First, try to find an unused handle from preferred list
  for (const handle of preferredHandles) {
    // Check if this handle is already used
    if (usedSame.has(handle)) {
      continue;
    }

    // Check if the opposite type handle at the EXACT SAME POSITION is used
    // E.g., if "left-top-target" is used, block "left-top-source", but allow "left-bottom-source"
    const handlePosition = getHandlePosition(handle);
    let positionBlocked = false;

    const oppositeHandlesArray = Array.from(usedOpposite);
    for (let i = 0; i < oppositeHandlesArray.length; i++) {
      const oppositeHandle = oppositeHandlesArray[i];
      if (getHandlePosition(oppositeHandle) === handlePosition) {
        positionBlocked = true;
        break;
      }
    }

    if (!positionBlocked) {
      return handle;
    }
  }

  // If all preferred handles are used, search for any available handle
  for (const handle of availableHandlesOfType) {
    // Skip if already in preferred list (we already tried those)
    if (preferredHandles.includes(handle)) {
      continue;
    }

    // Check if this handle is already used
    if (usedSame.has(handle)) {
      continue;
    }

    // Check if the opposite type handle at the EXACT SAME POSITION is used
    const handlePosition = getHandlePosition(handle);
    let positionBlocked = false;

    for (const oppositeHandle of usedOpposite) {
      if (getHandlePosition(oppositeHandle) === handlePosition) {
        positionBlocked = true;
        break;
      }
    }

    if (!positionBlocked) {
      return handle;
    }
  }

  // All handles are taken, reuse the first preferred handle
  return preferredHandles[0];
}

/**
 * Get all available handles for a given side of a state.
 * Returns handles in order: center, then left/top, then right/bottom
 */
function getAllHandlesForSide(side: 'top' | 'bottom' | 'left' | 'right'): string[] {
  switch (side) {
    case 'top':
      return ['top-center-source', 'top-left-source', 'top-right-source'];
    case 'bottom':
      return ['bottom-center-source', 'bottom-left-source', 'bottom-right-source'];
    case 'left':
      return ['left-top-source', 'left-bottom-source'];
    case 'right':
      return ['right-top-source', 'right-bottom-source'];
    default:
      return [];
  }
}

/**
 * Get fallback handles when primary side is full.
 * Returns handles from adjacent sides in priority order.
 * NOTE: Does NOT include primary handles (they're already in the primary list)
 */
function getFallbackHandlesForSide(side: 'top' | 'bottom' | 'left' | 'right'): string[] {
  switch (side) {
    case 'top':
      // Top is full → try corners from adjacent sides
      return ['top-right-source', 'top-left-source', 'right-top-source', 'left-top-source'];
    case 'bottom':
      // Bottom is full → try corners from adjacent sides
      return ['bottom-right-source', 'bottom-left-source', 'right-bottom-source', 'left-bottom-source'];
    case 'left':
      // Left is full → try corners from adjacent sides
      return ['top-left-source', 'bottom-left-source', 'left-top-source', 'left-bottom-source'];
    case 'right':
      // Right is full → try corners from adjacent sides
      return ['top-right-source', 'bottom-right-source', 'right-top-source', 'right-bottom-source'];
    default:
      return [];
  }
}

/**
 * Calculate approximate distance from a handle to target position.
 * Lower distance = better match.
 */
function getHandleDistanceToTarget(
  handle: string,
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  nodeWidth: number,
  nodeHeight: number
): number {
  // Map handle to offset from state center
  const handleOffsets: Record<string, { x: number; y: number }> = {
    'top-left-source': { x: -nodeWidth * 0.3, y: -nodeHeight / 2 },
    'top-center-source': { x: 0, y: -nodeHeight / 2 },
    'top-right-source': { x: nodeWidth * 0.3, y: -nodeHeight / 2 },
    'bottom-left-source': { x: -nodeWidth * 0.3, y: nodeHeight / 2 },
    'bottom-center-source': { x: 0, y: nodeHeight / 2 },
    'bottom-right-source': { x: nodeWidth * 0.3, y: nodeHeight / 2 },
    'left-top-source': { x: -nodeWidth / 2, y: -nodeHeight * 0.25 },
    'left-bottom-source': { x: -nodeWidth / 2, y: nodeHeight * 0.25 },
    'right-top-source': { x: nodeWidth / 2, y: -nodeHeight * 0.25 },
    'right-bottom-source': { x: nodeWidth / 2, y: nodeHeight * 0.25 },
  };

  const offset = handleOffsets[handle];
  if (!offset) return Infinity;

  // Calculate handle position in world coordinates
  const handleX = sourcePos.x + offset.x;
  const handleY = sourcePos.y + offset.y;

  // Calculate distance to target
  const dx = targetPos.x - handleX;
  const dy = targetPos.y - handleY;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get all available target handles for a given side of a state.
 */
function getAllTargetHandlesForSide(side: 'top' | 'bottom' | 'left' | 'right'): string[] {
  switch (side) {
    case 'top':
      return ['top-center-target', 'top-left-target', 'top-right-target'];
    case 'bottom':
      return ['bottom-center-target', 'bottom-left-target', 'bottom-right-target'];
    case 'left':
      return ['left-top-target', 'left-bottom-target'];
    case 'right':
      return ['right-top-target', 'right-bottom-target'];
    default:
      return [];
  }
}

/**
 * Convert a source handle to its corresponding target handle on the same position.
 * This is used to reserve target handles when source handles are used.
 */
function sourceHandleToTargetHandle(sourceHandle: string): string {
  return sourceHandle.replace('-source', '-target');
}

/**
 * Convert a target handle to its corresponding source handle on the same position.
 * This is used to reserve source handles when target handles are used (e.g., for bidirectional transitions).
 */
function targetHandleToSourceHandle(targetHandle: string): string {
  return targetHandle.replace('-target', '-source');
}

/**
 * Calculates optimal positions for workflow states using hierarchical layout.
 * States are arranged in ranks (levels) based on topological distance from initial state.
 *
 * @param workflow - The workflow data containing states and transitions
 * @param options - Layout configuration options
 * @returns Layout result with new positions for each state
 */
export function calculateAutoLayout(
  workflow: UIWorkflowData,
  options: LayoutOptions = {}
): LayoutResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Adjust spacing based on layout direction
  // For TB/BT: rankSeparation controls vertical spacing between ranks
  // For LR/RL: rankSeparation controls horizontal spacing between ranks (needs to be larger)
  if (!options.rankSeparation) {
    if (opts.direction === 'LR' || opts.direction === 'RL') {
      opts.rankSeparation = 500; // Larger horizontal spacing for LR/RL
    } else {
      opts.rankSeparation = 350; // Vertical spacing for TB/BT
    }
  }
  if (!options.nodeSeparation) opts.nodeSeparation = 400; // Spacing between nodes in same rank (cross axis)
  const stateIds = Object.keys(workflow.configuration.states);

  // Assign ranks to each state
  const ranks = assignRanks(workflow);

  // Group states by rank
  const statesByRank = new Map<number, string[]>();
  stateIds.forEach(stateId => {
    const rank = ranks.get(stateId) || 0;
    if (!statesByRank.has(rank)) {
      statesByRank.set(rank, []);
    }
    statesByRank.get(rank)!.push(stateId);
  });

  // Calculate per-rank spacing (spacing between each rank and the next)
  const perRankSpacing = calculatePerRankSpacing(
    workflow,
    ranks,
    statesByRank,
    opts.direction,
    opts.rankSeparation
  );

  // Calculate dynamic spacing for nodeSeparation (cross-axis)
  const dynamicSpacing = calculateDynamicSpacing(
    workflow,
    statesByRank,
    opts.direction,
    opts.rankSeparation,
    opts.nodeSeparation
  );

  // console.log('[AutoLayout] Dynamic spacing:', {
  //   direction: opts.direction,
  //   baseRankSeparation: opts.rankSeparation,
  //   baseNodeSeparation: opts.nodeSeparation,
  //   perRankSpacing: Object.fromEntries(perRankSpacing),
  //   adjustedNodeSeparation: dynamicSpacing.nodeSeparation,
  // });

  // Use dynamic nodeSeparation
  opts.nodeSeparation = dynamicSpacing.nodeSeparation;

  // Calculate positions based on ranks
  const states: Array<{ id: string; position: { x: number; y: number } }> = [];
  const statePositions = new Map<string, { x: number; y: number }>();

  // Sort ranks
  const sortedRanks = Array.from(statesByRank.keys()).sort((a, b) => a - b);

  // Calculate cumulative positions for each rank
  const rankPositions = new Map<number, number>();
  let cumulativePosition = 100; // Starting position
  sortedRanks.forEach((rank, index) => {
    rankPositions.set(rank, cumulativePosition);
    if (index < sortedRanks.length - 1) {
      // Add spacing to next rank
      const spacing = perRankSpacing.get(rank) || opts.rankSeparation;
      cumulativePosition += spacing;
    }
  });

  sortedRanks.forEach(rank => {
    const statesInRank = statesByRank.get(rank) || [];

    let x: number;
    let y: number;

    if (opts.direction === 'TB' || opts.direction === 'BT') {
      // Top-to-Bottom or Bottom-to-Top: ranks go vertically
      const rankY = rankPositions.get(rank) || 100;
      const totalWidth = statesInRank.length * opts.nodeSeparation;
      const startX = 400 - totalWidth / 2; // Center around x=400

      statesInRank.forEach((stateId, index) => {
        x = startX + index * opts.nodeSeparation;
        y = rankY;

        statePositions.set(stateId, { x, y });
        states.push({
          id: stateId,
          position: { x, y },
        });
      });
    } else {
      // Left-to-Right or Right-to-Left: ranks go horizontally
      const rankX = rankPositions.get(rank) || 100;
      const totalHeight = statesInRank.length * opts.nodeSeparation;
      const startY = 300 - totalHeight / 2; // Center around y=300

      statesInRank.forEach((stateId, index) => {
        x = rankX;
        y = startY + index * opts.nodeSeparation;

        statePositions.set(stateId, { x, y });
        states.push({
          id: stateId,
          position: { x, y },
        });
      });
    }
  });

  // Calculate transition node positions
  const transitions: LayoutResult['transitions'] = [];
  const transitionWidth = 45; // Average actual width of transition nodes (~40-48px)
  const transitionHeight = 14; // Actual height (~13.66px)

  // Track transitions between each pair of states
  const transitionsByPair = new Map<string, Array<{ sourceStateId: string; index: number }>>();

  // Detect bidirectional pairs (A->B and B->A)
  const bidirectionalPairs = new Set<string>();

  // Track used handles for each state to avoid collisions
  // Separate tracking for source and target handles to prevent same-side collisions
  const usedSourceHandles = new Map<string, Set<string>>();
  const usedTargetHandles = new Map<string, Set<string>>();
  stateIds.forEach(stateId => {
    usedSourceHandles.set(stateId, new Set<string>());
    usedTargetHandles.set(stateId, new Set<string>());
  });

  // Group transitions by source state and target state for handle distribution
  const outgoingTransitionsByState = new Map<string, Array<{ targetStateId: string; index: number; transitionName: string; targetPos?: { x: number; y: number } }>>();
  const incomingTransitionsByState = new Map<string, Array<{ sourceStateId: string; index: number; sourcePos?: { x: number; y: number } }>>();

  Object.entries(workflow.configuration.states).forEach(([sourceStateId, stateDefinition]) => {
    stateDefinition.transitions.forEach((transition, index) => {
      const key = `${sourceStateId}-${transition.next}`;
      const reverseKey = `${transition.next}-${sourceStateId}`;

      if (!transitionsByPair.has(key)) {
        transitionsByPair.set(key, []);
      }
      transitionsByPair.get(key)!.push({ sourceStateId, index });

      // Track outgoing transitions from source state
      if (!outgoingTransitionsByState.has(sourceStateId)) {
        outgoingTransitionsByState.set(sourceStateId, []);
      }
      outgoingTransitionsByState.get(sourceStateId)!.push({
        targetStateId: transition.next,
        index,
        transitionName: transition.name,
        targetPos: statePositions.get(transition.next),
      });

      // Track incoming transitions to target state
      if (!incomingTransitionsByState.has(transition.next)) {
        incomingTransitionsByState.set(transition.next, []);
      }
      incomingTransitionsByState.get(transition.next)!.push({
        sourceStateId,
        index,
        sourcePos: statePositions.get(sourceStateId),
      });

      // Check if reverse transition exists (but exclude loopback transitions)
      // Loopback transitions should not be treated as bidirectional
      const isLoopback = sourceStateId === transition.next;
      if (!isLoopback) {
        const reverseStateDefinition = workflow.configuration.states[transition.next];
        if (reverseStateDefinition?.transitions.some(t => t.next === sourceStateId)) {
          const canonicalKey = [sourceStateId, transition.next].sort().join('-');
          bidirectionalPairs.add(canonicalKey);
        }
      }
    });
  });

  // Pre-assign handles for outgoing transitions from each state
  // This ensures that multiple transitions from the same state use different handles
  const transitionHandleAssignments = new Map<string, { sourceHandle: string; targetHandle: string }>();

  // STEP 1: Reserve handles for loopback transitions FIRST (highest priority)
  // Loopback transitions need adjacent handles (e.g., top-right-source and top-left-target)
  stateIds.forEach(stateId => {
    const state = workflow.configuration.states[stateId];
    if (!state) return;

    state.transitions.forEach((transition, index) => {
      const isLoopback = stateId === transition.next;
      if (isLoopback) {
        // Reserve handles for loopback - create a petal shape (left to center)
        // Loopback exits from top-left, curves above, enters at top-center
        // This creates a clean petal/loop without crossing, using adjacent handles
        const sourceHandle = 'top-left-source';
        const targetHandle = 'top-center-target';

        // Mark these handles as used
        const sourceUsed = usedSourceHandles.get(stateId) || new Set<string>();
        const targetUsed = usedTargetHandles.get(stateId) || new Set<string>();

        // Reserve source handle (for outgoing transitions)
        sourceUsed.add(sourceHandle);

        // Reserve target handle (for incoming transitions)
        targetUsed.add(targetHandle);

        // IMPORTANT: Also reserve the source handle as a target handle
        // This prevents incoming transitions from using the same handle as loopback exit
        targetUsed.add('top-left-target'); // Reserve left side for loopback

        usedSourceHandles.set(stateId, sourceUsed);
        usedTargetHandles.set(stateId, targetUsed);

        // Store assignment
        const transitionKey = `${stateId}-${index}`;
        transitionHandleAssignments.set(transitionKey, {
          sourceHandle,
          targetHandle,
        });

        // console.log('[AutoLayout] Reserved loopback handles:', {
        //   stateId,
        //   transitionKey,
        //   transitionName: transition.name,
        //   sourceHandle,
        //   targetHandle,
        // });
      }
    });
  });

  // STEP 1.5: Reserve handles for bidirectional transitions BEFORE regular transitions
  // This ensures bidirectional transitions get their preferred handles

  Object.entries(workflow.configuration.states).forEach(([sourceStateId, stateDefinition]) => {
    const sourcePos = statePositions.get(sourceStateId);
    if (!sourcePos) return;

    stateDefinition.transitions.forEach((transition, index) => {
      const targetPos = statePositions.get(transition.next);
      if (!targetPos) return;

      // Skip loopback transitions (already handled)
      if (sourceStateId === transition.next) return;

      // Only process bidirectional transitions
      const canonicalKey = [sourceStateId, transition.next].sort().join('-');
      const isBidirectional = bidirectionalPairs.has(canonicalKey);

      if (!isBidirectional) return;

      // Calculate direction
      const sourceCenterX = sourcePos.x + opts.nodeWidth / 2;
      const sourceCenterY = sourcePos.y + opts.nodeHeight / 2;
      const targetCenterX = targetPos.x + opts.nodeWidth / 2;
      const targetCenterY = targetPos.y + opts.nodeHeight / 2;
      const dx = targetCenterX - sourceCenterX;
      const dy = targetCenterY - sourceCenterY;

      // Determine if this is the first or second transition in the pair
      const isFirstInPair = sourceStateId < transition.next;

      // Check actual geometry to determine handle placement
      const isHorizontal = Math.abs(dx) > Math.abs(dy);

      let sourceHandle: string;
      let targetHandle: string;

      if (isHorizontal) {
        // States are side-by-side horizontally
        if (dx > 0) {
          // Target is to the right
          if (isFirstInPair) {
            sourceHandle = 'right-top-source';
            targetHandle = 'left-top-target';
          } else {
            sourceHandle = 'right-bottom-source';
            targetHandle = 'left-bottom-target';
          }
        } else {
          // Target is to the left
          if (isFirstInPair) {
            sourceHandle = 'left-top-source';
            targetHandle = 'right-top-target';
          } else {
            sourceHandle = 'left-bottom-source';
            targetHandle = 'right-bottom-target';
          }
        }
      } else {
        // States are arranged vertically
        if (dy > 0) {
          // Target is below
          if (isFirstInPair) {
            sourceHandle = 'bottom-right-source';
            targetHandle = 'top-right-target';
          } else {
            sourceHandle = 'bottom-left-source';
            targetHandle = 'top-left-target';
          }
        } else {
          // Target is above
          if (isFirstInPair) {
            sourceHandle = 'top-right-source';
            targetHandle = 'bottom-right-target';
          } else {
            sourceHandle = 'top-left-source';
            targetHandle = 'bottom-left-target';
          }
        }
      }

      // Mark handles as used
      const sourceSet = usedSourceHandles.get(sourceStateId) || new Set<string>();
      sourceSet.add(sourceHandle);
      usedSourceHandles.set(sourceStateId, sourceSet);

      const targetSet = usedTargetHandles.get(transition.next) || new Set<string>();
      targetSet.add(targetHandle);
      usedTargetHandles.set(transition.next, targetSet);

      // CRITICAL: Also block the corresponding source handle on the target node
      // to prevent outgoing transitions from using the same position
      const correspondingSourceHandle = targetHandleToSourceHandle(targetHandle);
      const targetSourceSet = usedSourceHandles.get(transition.next) || new Set<string>();
      targetSourceSet.add(correspondingSourceHandle);
      usedSourceHandles.set(transition.next, targetSourceSet);

      // Store assignment
      const transitionKey = `${sourceStateId}-${index}`;
      transitionHandleAssignments.set(transitionKey, {
        sourceHandle,
        targetHandle,
      });
    });
  });

  // STEP 2: Assign handles for regular (non-loopback, non-bidirectional) transitions

  outgoingTransitionsByState.forEach((outgoingTransitions, sourceStateId) => {
    const sourcePos = statePositions.get(sourceStateId);
    if (!sourcePos) return;

    // Get already used handles (including loopback and bidirectional reservations)
    let stateUsedHandles = usedSourceHandles.get(sourceStateId) || new Set<string>();

    // Group transitions by direction to assign handles intelligently
    const transitionsByDirection = new Map<string, typeof outgoingTransitions>();

    outgoingTransitions.forEach(trans => {
      if (!trans.targetPos) return;

      // Skip loopback transitions (already handled)
      const isLoopback = sourceStateId === trans.targetStateId;
      if (isLoopback) return;

      // Skip bidirectional transitions (already handled)
      const canonicalKey = [sourceStateId, trans.targetStateId].sort().join('-');
      if (bidirectionalPairs.has(canonicalKey)) return;

      const dx = trans.targetPos.x - sourcePos.x;
      const dy = trans.targetPos.y - sourcePos.y;

      // Determine primary direction
      let direction: string;
      if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical movement is primary
        direction = dy > 0 ? 'bottom' : 'top';
      } else {
        // Horizontal movement is primary
        direction = dx > 0 ? 'right' : 'left';
      }

      if (!transitionsByDirection.has(direction)) {
        transitionsByDirection.set(direction, []);
      }
      transitionsByDirection.get(direction)!.push(trans);
    });

    // console.log('[AutoLayout] Grouped transitions by direction for source handles:', {
    //   sourceStateId,
    //   groups: Array.from(transitionsByDirection.entries()).map(([dir, trans]) => ({
    //     direction: dir,
    //     transitions: trans.map(t => ({
    //       index: t.index,
    //       targetStateId: t.targetStateId,
    //       dx: t.targetPos ? t.targetPos.x - sourcePos.x : 0,
    //       dy: t.targetPos ? t.targetPos.y - sourcePos.y : 0,
    //     })),
    //   })),
    // });

    // Assign handles for each direction group
    transitionsByDirection.forEach((transitionsInDirection, direction) => {
      const primaryHandles = getAllHandlesForSide(direction as 'top' | 'bottom' | 'left' | 'right');
      const fallbackHandles = getFallbackHandlesForSide(direction as 'top' | 'bottom' | 'left' | 'right');

      // Combine primary and fallback handles
      const allHandlesInOrder = [...primaryHandles, ...fallbackHandles];

      // Sort transitions by their vertical position (for horizontal directions) or horizontal position (for vertical directions)
      // This ensures that handles are assigned based on spatial layout, not configuration order
      const sortedTransitions = transitionsInDirection.sort((a, b) => {
        if (!a.targetPos || !b.targetPos) return 0;

        // For horizontal directions (left/right), sort by vertical position (dy)
        if (direction === 'left' || direction === 'right') {
          const dyA = a.targetPos.y - sourcePos.y;
          const dyB = b.targetPos.y - sourcePos.y;
          return dyA - dyB; // Top to bottom
        }

        // For vertical directions (top/bottom), sort by horizontal position (dx)
        if (direction === 'top' || direction === 'bottom') {
          const dxA = a.targetPos.x - sourcePos.x;
          const dxB = b.targetPos.x - sourcePos.x;
          return dxA - dxB; // Left to right
        }

        return 0;
      });

      // Assign handles to transitions in this direction
      sortedTransitions.forEach((trans, i) => {
        let assignedHandle: string | null = null;

        // First, try primary handles
        if (i < primaryHandles.length) {
          const primaryHandle = primaryHandles[i];
          if (!stateUsedHandles.has(primaryHandle)) {
            assignedHandle = primaryHandle;
          }
        }

        // If primary handle is taken or we ran out of primary handles, use fallback
        if (!assignedHandle) {
          // Sort fallback handles by distance to target (shortest path wins)
          const sortedFallbacks = [...fallbackHandles].sort((a, b) => {
            const distA = getHandleDistanceToTarget(a, sourcePos, trans.targetPos!, opts.nodeWidth, opts.nodeHeight);
            const distB = getHandleDistanceToTarget(b, sourcePos, trans.targetPos!, opts.nodeWidth, opts.nodeHeight);
            return distA - distB; // Lower distance = better match
          });

          // Find first available fallback handle
          for (const handle of sortedFallbacks) {
            if (!stateUsedHandles.has(handle)) {
              assignedHandle = handle;
              break;
            }
          }
        }

        // If all handles are taken, reuse the last primary handle (ultimate fallback)
        if (!assignedHandle) {
          assignedHandle = primaryHandles[primaryHandles.length - 1];
        }

        stateUsedHandles.add(assignedHandle);

        // IMPORTANT: Also reserve the corresponding target handle on the same position
        // This prevents incoming transitions from using the same handle position
        const correspondingTargetHandle = sourceHandleToTargetHandle(assignedHandle);
        const stateTargetHandles = usedTargetHandles.get(sourceStateId) || new Set<string>();
        stateTargetHandles.add(correspondingTargetHandle);
        usedTargetHandles.set(sourceStateId, stateTargetHandles);

        const transitionKey = `${sourceStateId}-${trans.index}`;
        // Only set if not already set (loopback transitions already have assignments)
        if (!transitionHandleAssignments.has(transitionKey)) {
          transitionHandleAssignments.set(transitionKey, {
            sourceHandle: assignedHandle,
            targetHandle: '', // Will be assigned later
          });

          const isPrimaryHandle = primaryHandles.includes(assignedHandle);
          const isFallbackHandle = fallbackHandles.includes(assignedHandle);

          // Calculate distance for the assigned handle
          const assignedDistance = getHandleDistanceToTarget(
            assignedHandle,
            sourcePos,
            trans.targetPos!,
            opts.nodeWidth,
            opts.nodeHeight
          );


        }
      });
    });

    // Update the map with the modified set
    usedSourceHandles.set(sourceStateId, stateUsedHandles);
  });

  // Position transition nodes
  Object.entries(workflow.configuration.states).forEach(([sourceStateId, stateDefinition]) => {
    stateDefinition.transitions.forEach((transition, index) => {
      const sourcePos = statePositions.get(sourceStateId);
      const targetPos = statePositions.get(transition.next);

      if (sourcePos && targetPos) {
        const isLoopback = sourceStateId === transition.next;
        const transitionId = `${sourceStateId}-${index}`;

        if (isLoopback) {
          // Position loopback transition to the right and above the state
          // Use pre-assigned handles (reserved in STEP 1)
          const preAssignedHandles = transitionHandleAssignments.get(transitionId);
          const sourceHandle = preAssignedHandles?.sourceHandle || 'top-right-source';
          const targetHandle = preAssignedHandles?.targetHandle || 'top-left-target';

          const loopbackTransition = {
            id: transitionId,
            sourceStateId: sourceStateId,
            targetStateId: transition.next,
            position: {
              x: sourcePos.x + 150,
              y: sourcePos.y - 100,
            },
            // Use pre-assigned handles for loopback transitions
            sourceHandle,
            targetHandle,
            stateToTransitionSourceHandle: sourceHandle,
            stateToTransitionTargetHandle: 'top-center-target',
            transitionToStateSourceHandle: 'bottom-center-source',
            transitionToStateTargetHandle: targetHandle,
          };

          // console.log('🔄 Creating LOOPBACK transition:', {
          //   transitionId,
          //   transitionName: transition.name,
          //   loopbackTransition,
          // });

          transitions.push(loopbackTransition);
        } else {
          // Get all transitions between these two states
          const key = `${sourceStateId}-${transition.next}`;
          const transitionsForPair = transitionsByPair.get(key) || [];
          const transitionIndex = transitionsForPair.findIndex(t => t.index === index);
          const totalTransitions = transitionsForPair.length;

          // Convert positions to centers (position is top-left corner of node)
          const sourceCenterX = sourcePos.x + opts.nodeWidth / 2;
          const sourceCenterY = sourcePos.y + opts.nodeHeight / 2;
          const targetCenterX = targetPos.x + opts.nodeWidth / 2;
          const targetCenterY = targetPos.y + opts.nodeHeight / 2;

          const verticalDistance = Math.abs(targetCenterY - sourceCenterY);
          const horizontalDistance = Math.abs(targetCenterX - sourceCenterX);

          // Calculate offsets for parallel transitions based on direction
          // Larger offset to prevent overlapping (100px per transition)
          const parallelOffset = (transitionIndex - (totalTransitions - 1) / 2) * 100;
          // Vertical spacing between parallel transitions (80px per transition)
          const verticalSpacing = (transitionIndex - (totalTransitions - 1) / 2) * 80;

          // Check if this is a bidirectional transition
          const canonicalKey = [sourceStateId, transition.next].sort().join('-');
          const isBidirectional = bidirectionalPairs.has(canonicalKey);

          // Calculate deltas for later use (center-based)
          const dxCenter = targetCenterX - sourceCenterX;
          const dyCenter = targetCenterY - sourceCenterY;

          // Position transition nodes at 40% horizontally (closer to source), 50% vertically (centered)
          // For bidirectional transitions, use 50% to center them between states
          // For horizontal transitions (dy ≈ 0), use 50% to center them between states
          const isHorizontalTransition = Math.abs(dyCenter) < 50;
          const ratioX = (isBidirectional || isHorizontalTransition) ? 0.5 : 0.4;
          const ratioY = 0.5;
          let midX = sourceCenterX + (targetCenterX - sourceCenterX) * ratioX;
          let midY = sourceCenterY + (targetCenterY - sourceCenterY) * ratioY;

          // Add offset to "expand" the diagram (only for non-bidirectional)
          if (!isBidirectional) {
            const oldMidX = midX;
            const oldMidY = midY;

            if (opts.direction === 'LR' || opts.direction === 'RL') {
              // For Left-Right layout: calculate offset based on transition label width
              const transitionLabelWidth = estimateTransitionLabelWidth(transition.name);
              const minOffset = 80;
              const extraOffset = Math.max(0, (transitionLabelWidth - 100) * 0.3);
              const horizontalOffset = minOffset + extraOffset;

              const sourceRank = ranks.get(sourceStateId) || 0;
              if (sourceRank === 0) {
                // Rank 0 (leftmost states like 'created') → push transitions further left
                midX -= horizontalOffset;
              } else if (sourceRank === 1) {
                // Rank 1 (middle states like 'active'/'inactive') → push transitions further right
                midX += horizontalOffset;
              }
            } else if (opts.direction === 'TB' || opts.direction === 'BT') {
              // For Top-Bottom layout: push transitions horizontally based on source and target positions
              const horizontalOffset = 80;
              const diagramCenterX = 400; // Center of diagram (from startX calculation)

              // Check if transition is strictly vertical (dx ≈ 0)
              const isVerticalTransition = Math.abs(dxCenter) < 50;

              let shouldOffsetRight = false;
              let shouldOffsetLeft = false;

              if (targetCenterX > sourceCenterX && targetCenterX > diagramCenterX) {
                // Target right of source AND right of center → push right
                shouldOffsetRight = true;
              } else if (targetCenterX < sourceCenterX && targetCenterX < diagramCenterX) {
                // Target left of source AND left of center → push left
                shouldOffsetLeft = true;
              } else {
                // Otherwise, use source position relative to center
                if (sourceCenterX < diagramCenterX) {
                  shouldOffsetLeft = true;
                } else if (sourceCenterX > diagramCenterX) {
                  shouldOffsetRight = true;
                }
              }

              // For horizontal transitions (states on same level) OR vertical transitions (dx ≈ 0),
              // DON'T apply horizontal offset - keep label on the line between states
              if (!isHorizontalTransition && !isVerticalTransition) {
                if (shouldOffsetLeft) {
                  midX -= horizontalOffset;
                } else if (shouldOffsetRight) {
                  midX += horizontalOffset;
                }
              }
            }
          }

          if (isBidirectional) {
            // For bidirectional transitions, use simple offset from the midpoint
            const distance = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);

            if (distance > 0) {
              // Determine if the line is more horizontal or vertical
              const isHorizontal = Math.abs(dxCenter) > Math.abs(dyCenter);

              // Offset magnitude for bidirectional separation
              const offsetMagnitude = 60;

              // Determine direction: which transition comes first alphabetically?
              // This ensures consistent positioning for each pair
              const isFirstInPair = sourceStateId < transition.next;

              // For vertical arrangement: first uses RIGHT handles, second uses LEFT handles
              // So first should offset RIGHT (+), second should offset LEFT (-)
              // For horizontal arrangement: first uses TOP handles, second uses BOTTOM handles
              // So first should offset UP (-), second should offset DOWN (+)
              // Note: Y axis grows downward, so UP is negative
              let offsetDirection: number;

              if (isHorizontal) {
                // Horizontal arrangement: invert the direction for Y offset
                offsetDirection = isFirstInPair ? -1 : 1;
              } else {
                // Vertical arrangement: normal direction for X offset
                offsetDirection = isFirstInPair ? 1 : -1;
              }


              if (isHorizontal) {
                // States are side-by-side horizontally
                // Offset vertically (up/down) to separate the two transitions
                midY += offsetDirection * offsetMagnitude;
              } else {
                // States are arranged vertically (one above the other)
                // Offset horizontally (left/right) to separate the two transitions
                midX += offsetDirection * offsetMagnitude;

                // Also shift left to match non-bidirectional transitions visual alignment
                // This moves both bidirectional transitions left by a fixed amount
                midX -= 40;
              }
            }
          } else {
            // For non-bidirectional transitions, apply the standard positioning logic
            if (opts.direction === 'TB' || opts.direction === 'BT') {
              // Top-to-Bottom or Bottom-to-Top: offset horizontally for parallel edges
              // But NOT for vertical transitions (dx ≈ 0) - keep them on the straight line
              const isVerticalTransition = Math.abs(dxCenter) < 50;
              if (!isVerticalTransition) {
                midX += parallelOffset;
              } else {
              }
              midY += verticalSpacing;

              // Ensure minimum vertical distance
              // But NOT for horizontal transitions (states on same level)
              const isHorizontalTransition = Math.abs(dyCenter) < 50;
              if (verticalDistance < opts.minTransitionLength && !isHorizontalTransition) {
                midY = sourcePos.y - opts.minTransitionLength + (transitionIndex - (totalTransitions - 1) / 2) * opts.edgeSeparation;
              } else if (isHorizontalTransition) {

                // For horizontal transitions, check if label is too close to target state
                // If so, offset it vertically to avoid overlap with target state label
                const distanceToTarget = Math.abs(midX - targetCenterX);
                const minDistanceToTarget = 150; // Minimum horizontal distance from target center


                if (distanceToTarget < minDistanceToTarget) {
                  // Offset label vertically based on transition index
                  const verticalOffset = (transitionIndex - (totalTransitions - 1) / 2) * 80;
                  midY += verticalOffset;
                }
              }

              // Ensure minimum horizontal distance
              // But NOT for vertical transitions (dx ≈ 0) - keep them on the straight line
              if (horizontalDistance < opts.minTransitionWidth && !isVerticalTransition) {
                const direction = targetPos.x > sourcePos.x ? 1 : -1;
                midX = sourcePos.x + (direction * opts.minTransitionWidth) + parallelOffset;
              } else if (isVerticalTransition) {
              }
            } else {
              // Left-to-Right or Right-to-Left: offset vertically for parallel edges
              midY += parallelOffset;
              midX += verticalSpacing;

              // For LR layout: keep transition node between source and target
              // Don't apply minimum distance constraints that would push it outside this range
              // The midpoint calculation already ensures good positioning
            }
          }

          // Determine handles for all transitions
          let handles: {
            stateToTransitionSourceHandle?: string;
            stateToTransitionTargetHandle?: string;
            transitionToStateSourceHandle?: string;
            transitionToStateTargetHandle?: string;
          } = {};

          // Use center-based deltas (already calculated above) instead of position-based
          // This ensures handles match the actual visual layout after all offsets are applied
          const dx = dxCenter;
          const dy = dyCenter;

          if (isBidirectional) {
            // Determine if this is the first or second transition in the pair
            const isFirstInPair = sourceStateId < transition.next;

            // Check actual geometry to determine handle placement
            // This works for both TB and LR layouts
            const isHorizontal = Math.abs(dx) > Math.abs(dy);

            if (isHorizontal) {
              // States are side-by-side horizontally
              // Use top/bottom handles for separation
              if (dx > 0) {
                // Target is to the right
                if (isFirstInPair) {
                  handles.stateToTransitionSourceHandle = 'right-top-source';
                  handles.stateToTransitionTargetHandle = 'left-top-target';
                  handles.transitionToStateSourceHandle = 'right-top-source';
                  handles.transitionToStateTargetHandle = 'left-top-target';
                } else {
                  handles.stateToTransitionSourceHandle = 'right-bottom-source';
                  handles.stateToTransitionTargetHandle = 'left-bottom-target';
                  handles.transitionToStateSourceHandle = 'right-bottom-source';
                  handles.transitionToStateTargetHandle = 'left-bottom-target';
                }
              } else {
                // Target is to the left
                if (isFirstInPair) {
                  handles.stateToTransitionSourceHandle = 'left-top-source';
                  handles.stateToTransitionTargetHandle = 'right-top-target';
                  handles.transitionToStateSourceHandle = 'left-top-source';
                  handles.transitionToStateTargetHandle = 'right-top-target';
                } else {
                  handles.stateToTransitionSourceHandle = 'left-bottom-source';
                  handles.stateToTransitionTargetHandle = 'right-bottom-target';
                  handles.transitionToStateSourceHandle = 'left-bottom-source';
                  handles.transitionToStateTargetHandle = 'right-bottom-target';
                }
              }
            } else {
              // States are arranged vertically (one above the other)
              // For top-to-bottom layout: use bottom/top center handles for straight vertical flow
              if (dy > 0) {
                // Target is below
                if (isFirstInPair) {
                  // First transition: use right side
                  handles.stateToTransitionSourceHandle = 'bottom-right-source';
                  handles.stateToTransitionTargetHandle = 'top-right-target';
                  handles.transitionToStateSourceHandle = 'bottom-right-source';
                  handles.transitionToStateTargetHandle = 'top-right-target';
                } else {
                  // Second transition: use left side
                  handles.stateToTransitionSourceHandle = 'bottom-left-source';
                  handles.stateToTransitionTargetHandle = 'top-left-target';
                  handles.transitionToStateSourceHandle = 'bottom-left-source';
                  handles.transitionToStateTargetHandle = 'top-left-target';
                }
              } else {
                // Target is above
                if (isFirstInPair) {
                  handles.stateToTransitionSourceHandle = 'top-right-source';
                  handles.stateToTransitionTargetHandle = 'bottom-right-target';
                  handles.transitionToStateSourceHandle = 'top-right-source';
                  handles.transitionToStateTargetHandle = 'bottom-right-target';
                } else {
                  handles.stateToTransitionSourceHandle = 'top-left-source';
                  handles.stateToTransitionTargetHandle = 'bottom-left-target';
                  handles.transitionToStateSourceHandle = 'top-left-source';
                  handles.transitionToStateTargetHandle = 'bottom-left-target';
                }
              }
            }

            // Mark bidirectional handles as used
            if (handles.stateToTransitionSourceHandle) {
              const sourceSet = usedSourceHandles.get(sourceStateId) || new Set<string>();
              sourceSet.add(handles.stateToTransitionSourceHandle);
              usedSourceHandles.set(sourceStateId, sourceSet);
            }
            if (handles.transitionToStateTargetHandle) {
              const targetSet = usedTargetHandles.get(transition.next) || new Set<string>();
              targetSet.add(handles.transitionToStateTargetHandle);
              usedTargetHandles.set(transition.next, targetSet);
            }
          } else {
            // Non-bidirectional transition
            const transitionKey = `${sourceStateId}-${index}`;
            const preAssignedHandles = transitionHandleAssignments.get(transitionKey);

            // Check if this is a loopback transition
            const isLoopbackTransition = sourceStateId === transition.next;

            if (isLoopbackTransition) {
              // Loopback transitions already have handles assigned in STEP 1
              // Use the pre-assigned handles directly
              handles.stateToTransitionSourceHandle = preAssignedHandles?.sourceHandle || 'top-right-source';
              handles.stateToTransitionTargetHandle = 'top-center-target';
              handles.transitionToStateSourceHandle = 'bottom-center-source';
              handles.transitionToStateTargetHandle = preAssignedHandles?.targetHandle || 'top-left-target';

              // console.log('[AutoLayout] Using loopback handles:', {
              //   transitionKey,
              //   transitionName: transition.name,
              //   handles,
              // });
            } else {
              // Regular non-bidirectional transition
              // Use pre-assigned source handle from the grouping logic
              let stateSourceHandle = preAssignedHandles?.sourceHandle || 'bottom-center-source';

            // Now assign target handle based on target state's incoming transitions
            const incomingTransitions = incomingTransitionsByState.get(transition.next) || [];
            const incomingIndex = incomingTransitions.findIndex(t => t.sourceStateId === sourceStateId && t.index === index);

            // Group incoming transitions by direction
            const incomingByDirection = new Map<string, typeof incomingTransitions>();
            incomingTransitions.forEach(trans => {
              if (!trans.sourcePos) return;

              const dx = targetPos.x - trans.sourcePos.x;
              const dy = targetPos.y - trans.sourcePos.y;

              let direction: string;

              // For TB/BT layouts, prioritize vertical direction
              // Use a lower threshold to prefer top/bottom over left/right
              if (opts.direction === 'TB' || opts.direction === 'BT') {
                // If there's any significant vertical movement, use vertical direction
                if (Math.abs(dy) > Math.abs(dx) * 0.3) {
                  direction = dy > 0 ? 'top' : 'bottom';
                } else {
                  direction = dx > 0 ? 'left' : 'right';
                }
              } else {
                // For LR/RL layouts, use standard logic
                if (Math.abs(dy) > Math.abs(dx)) {
                  direction = dy > 0 ? 'top' : 'bottom';
                } else {
                  direction = dx > 0 ? 'left' : 'right';
                }
              }

              if (!incomingByDirection.has(direction)) {
                incomingByDirection.set(direction, []);
              }
              incomingByDirection.get(direction)!.push(trans);
            });

            // Find which direction group this transition belongs to
            let targetDirection = 'top';
            let indexInDirection = 0;

            const directionEntries = Array.from(incomingByDirection.entries());
            for (let i = 0; i < directionEntries.length; i++) {
              const [dir, trans] = directionEntries[i];
              const idx = trans.findIndex(t => t.sourceStateId === sourceStateId && t.index === index);
              if (idx >= 0) {
                targetDirection = dir;
                indexInDirection = idx;
                break;
              }
            }

            // Get available target handles for this direction
            const allTargetHandles = getAllTargetHandlesForSide(targetDirection as 'top' | 'bottom' | 'left' | 'right');
            let usedTargets = usedTargetHandles.get(transition.next) || new Set<string>();
            const availableTargetHandles = allTargetHandles.filter(h => !usedTargets.has(h));

            // console.log('[AutoLayout] Assigning target handle:', {
            //   transitionKey: `${sourceStateId}-${index}`,
            //   transitionName: transition.name,
            //   targetStateId: transition.next,
            //   targetDirection,
            //   allTargetHandles,
            //   usedTargets: Array.from(usedTargets),
            //   availableTargetHandles,
            // });

            // For TB/BT layouts with top/bottom direction, always prefer center handle first
            let stateTargetHandle: string;
            if ((opts.direction === 'TB' || opts.direction === 'BT') &&
                (targetDirection === 'top' || targetDirection === 'bottom')) {
              // Always try center first, then left/right
              stateTargetHandle = availableTargetHandles.length > 0
                ? availableTargetHandles[0]  // Always use first available (which is center)
                : allTargetHandles[0];
            } else {
              // For other directions, use index-based selection
              stateTargetHandle = availableTargetHandles.length > 0
                ? availableTargetHandles[Math.min(indexInDirection, availableTargetHandles.length - 1)]
                : allTargetHandles[0];
            }

              // For transition node, use center handles
              const transitionTargetHandle = 'top-center-target';
              const transitionSourceHandle = 'bottom-center-source';

              handles.stateToTransitionSourceHandle = stateSourceHandle;
              handles.stateToTransitionTargetHandle = transitionTargetHandle;
              handles.transitionToStateSourceHandle = transitionSourceHandle;
              handles.transitionToStateTargetHandle = stateTargetHandle;

              // Mark handles as used
              const sourceSet = usedSourceHandles.get(sourceStateId) || new Set<string>();
              sourceSet.add(stateSourceHandle);
              usedSourceHandles.set(sourceStateId, sourceSet);

              usedTargets.add(stateTargetHandle);
              usedTargetHandles.set(transition.next, usedTargets);
            }
          }

          const transitionPosition = {
            x: midX - transitionWidth / 2,
            y: midY - transitionHeight / 2,
          };

          // For non-bidirectional transitions, also add sourceHandle and targetHandle
          // These are used by WorkflowCanvas to create edges directly from source state to target state
          const regularHandles = isBidirectional ? {} : {
            sourceHandle: handles.stateToTransitionSourceHandle,
            targetHandle: handles.transitionToStateTargetHandle,
          };

          // console.log('🔧 Creating transition in autoLayout:', {
          //   transitionId,
          //   isBidirectional,
          //   handles,
          //   regularHandles,
          // });

          transitions.push({
            id: transitionId,
            sourceStateId: sourceStateId,
            targetStateId: transition.next,
            position: transitionPosition,
            ...handles,
            ...regularHandles,
          });
        }
      }
    });
  });

  // Resolve label overlaps: if a transition label is too close to a state label, adjust transition label position
  const stateWidth = opts.nodeWidth;
  const stateHeight = opts.nodeHeight;
  const transitionLabelWidth = 45; // Approximate width of transition label
  const transitionLabelHeight = 14; // Approximate height of transition label
  const stateLabelWidth = 80; // Approximate width of state label
  const stateLabelHeight = 20; // Approximate height of state label
  const labelPadding = 15; // Padding around labels


  transitions.forEach(transition => {
    let transitionLabelX = transition.position.x;
    let transitionLabelY = transition.position.y;

    // AABB for transition label
    let transLeft = transitionLabelX - transitionLabelWidth / 2 - labelPadding;
    let transRight = transitionLabelX + transitionLabelWidth / 2 + labelPadding;
    let transTop = transitionLabelY - transitionLabelHeight / 2 - labelPadding;
    let transBottom = transitionLabelY + transitionLabelHeight / 2 + labelPadding;


    states.forEach(state => {
      const stateLabelX = state.position.x + stateWidth / 2;
      const stateLabelY = state.position.y + stateHeight / 2;

      // AABB for state label
      const stateLeft = stateLabelX - stateLabelWidth / 2 - labelPadding;
      const stateRight = stateLabelX + stateLabelWidth / 2 + labelPadding;
      const stateTop = stateLabelY - stateLabelHeight / 2 - labelPadding;
      const stateBottom = stateLabelY + stateLabelHeight / 2 + labelPadding;

      // Check AABB overlap
      const overlaps = !(transRight < stateLeft || transLeft > stateRight ||
                         transBottom < stateTop || transTop > stateBottom);

      if (overlaps) {

        // Move transition label vertically to avoid overlap
        const moveDistance = 80; // Fixed distance to move
        if (transitionLabelY > stateLabelY) {
          // Transition label is below state label, move it up
          transitionLabelY -= moveDistance;
        } else {
          // Transition label is above state label, move it down
          transitionLabelY += moveDistance;
        }

        // Update AABB for next iteration
        transLeft = transitionLabelX - transitionLabelWidth / 2 - labelPadding;
        transRight = transitionLabelX + transitionLabelWidth / 2 + labelPadding;
        transTop = transitionLabelY - transitionLabelHeight / 2 - labelPadding;
        transBottom = transitionLabelY + transitionLabelHeight / 2 + labelPadding;
      }
    });

    // Update transition position with adjusted label position
    transition.position.y = transitionLabelY;
  });

  return { states, transitions };
}

/**
 * Applies the calculated layout to a workflow by updating state positions.
 *
 * @param workflow - The workflow to update
 * @param layoutResult - The layout result from calculateAutoLayout
 * @param options - Layout options (to save direction)
 * @returns Updated workflow with new state positions
 */
export function applyLayoutToWorkflow(
  workflow: UIWorkflowData,
  layoutResult: LayoutResult,
  options: LayoutOptions = {}
): UIWorkflowData {
  const updatedLayout = { ...workflow.layout };

  // Update positions for each state
  const updatedStates = updatedLayout.states.map(layoutState => {
    const newPosition = layoutResult.states.find(s => s.id === layoutState.id);
    if (newPosition) {
      return {
        ...layoutState,
        position: newPosition.position,
      };
    }
    return layoutState;
  });

  // Update positions for each transition
  // If there are no transitions in the layout yet, create them from the layout result
  let updatedTransitions: typeof updatedLayout.transitions;

  if (updatedLayout.transitions.length === 0 && layoutResult.transitions.length > 0) {
    // Create new transitions from layout result
    updatedTransitions = layoutResult.transitions.map(t => {
      const transition = {
        id: t.id,
        sourceStateId: t.sourceStateId,
        targetStateId: t.targetStateId,
        position: t.position,
        // Include handle information for bidirectional transitions
        stateToTransitionSourceHandle: t.stateToTransitionSourceHandle,
        stateToTransitionTargetHandle: t.stateToTransitionTargetHandle,
        transitionToStateSourceHandle: t.transitionToStateSourceHandle,
        transitionToStateTargetHandle: t.transitionToStateTargetHandle,
        // Include handle information for regular transitions
        sourceHandle: t.sourceHandle,
        targetHandle: t.targetHandle,
      };
      // console.log('💾 Saving transition to layout (new):', transition);
      return transition;
    });
  } else {
    // Update existing transitions
    updatedTransitions = updatedLayout.transitions.map(layoutTransition => {
      const newPosition = layoutResult.transitions?.find(t => t.id === layoutTransition.id);
      if (newPosition) {
        const transition = {
          ...layoutTransition,
          position: newPosition.position,
          // Include handle information for bidirectional transitions
          stateToTransitionSourceHandle: newPosition.stateToTransitionSourceHandle,
          stateToTransitionTargetHandle: newPosition.stateToTransitionTargetHandle,
          transitionToStateSourceHandle: newPosition.transitionToStateSourceHandle,
          transitionToStateTargetHandle: newPosition.transitionToStateTargetHandle,
          // Include handle information for regular transitions
          sourceHandle: newPosition.sourceHandle,
          targetHandle: newPosition.targetHandle,
        };
        // console.log('💾 Saving transition to layout (update):', transition);
        return transition;
      }
      return layoutTransition;
    });
  }

  const now = new Date().toISOString();

  return {
    ...workflow,
    layout: {
      ...updatedLayout,
      states: updatedStates,
      transitions: updatedTransitions,
      direction: options.direction, // Save direction to detect layout changes
      updatedAt: now, // Update layout timestamp to trigger useEffect
    },
    updatedAt: now,
  };
}

/**
 * Convenience function that calculates and applies auto-layout in one step.
 *
 * @param workflow - The workflow to layout
 * @param options - Layout configuration options
 * @returns Updated workflow with auto-layout applied
 */
export function autoLayoutWorkflow(
  workflow: UIWorkflowData,
  options: LayoutOptions = {}
): UIWorkflowData {
  const layoutResult = calculateAutoLayout(workflow, options);
  return applyLayoutToWorkflow(workflow, layoutResult, options);
}

/**
 * Validates that a workflow has the necessary structure for auto-layout.
 *
 * @param workflow - The workflow to validate
 * @returns True if the workflow can be auto-laid out
 */
export function canAutoLayout(workflow: UIWorkflowData | null): boolean {
  if (!workflow) return false;

  const stateIds = Object.keys(workflow.configuration.states);
  if (stateIds.length === 0) return false;

  // Check that layout data exists for all states
  return stateIds.every(stateId =>
    workflow.layout.states.some(layoutState => layoutState.id === stateId)
  );
}

/**
 * Recalculate handles for transitions connected to a moved state.
 * This function updates handles based on new state positions without changing transition positions.
 */
export function recalculateHandlesForMovedState(
  workflow: UIWorkflowData,
  movedStateId: string,
  options?: Partial<LayoutOptions>
): UIWorkflowData {
  const opts: Required<LayoutOptions> = { ...DEFAULT_OPTIONS, ...options };

  // console.log('[AutoLayout] Recalculating handles for moved state:', movedStateId);

  // Build position map from layout
  const statePositions = new Map<string, { x: number; y: number }>();
  workflow.layout.states.forEach(layoutState => {
    statePositions.set(layoutState.id, layoutState.position);
  });

  // Find all specific transitions that are connected to the moved state
  // We track transitions by their key (sourceStateId-transitionIndex)
  const affectedTransitions = new Set<string>();

  Object.entries(workflow.configuration.states).forEach(([sourceStateId, stateDefinition]) => {
    stateDefinition.transitions.forEach((transition, index) => {
      const transitionKey = `${sourceStateId}-${index}`;

      // Include transition if:
      // 1. It originates FROM the moved state (sourceStateId === movedStateId)
      // 2. It goes TO the moved state (transition.next === movedStateId)
      if (sourceStateId === movedStateId || transition.next === movedStateId) {
        affectedTransitions.add(transitionKey);
      }
    });
  });

  // console.log('[AutoLayout] Affected transitions:', Array.from(affectedTransitions));

  // Track used handles for each state
  const usedSourceHandles = new Map<string, Set<string>>();
  const usedTargetHandles = new Map<string, Set<string>>();
  Object.keys(workflow.configuration.states).forEach(stateId => {
    usedSourceHandles.set(stateId, new Set<string>());
    usedTargetHandles.set(stateId, new Set<string>());
  });

  // IMPORTANT: Pre-populate used handles from existing layout for NON-affected transitions
  // This ensures we don't reassign handles that are already in use by unaffected transitions
  workflow.layout.transitions.forEach(layoutTransition => {
    if (affectedTransitions.has(layoutTransition.id)) {
      // Skip affected transitions - they will be recalculated
      return;
    }

    // Parse transition ID to get source and target states
    const parts = layoutTransition.id.split('-');
    const index = parseInt(parts[parts.length - 1], 10);
    const sourceStateId = parts.slice(0, -1).join('-');

    const state = workflow.configuration.states[sourceStateId];
    if (!state || !state.transitions[index]) return;

    const targetStateId = state.transitions[index].next;

    // Mark all handles as used (both legacy and new format)
    // Legacy format: sourceHandle and targetHandle
    if (layoutTransition.sourceHandle) {
      const sourceUsed = usedSourceHandles.get(sourceStateId) || new Set<string>();
      sourceUsed.add(layoutTransition.sourceHandle);
      usedSourceHandles.set(sourceStateId, sourceUsed);
    }

    if (layoutTransition.targetHandle) {
      const targetUsed = usedTargetHandles.get(targetStateId) || new Set<string>();
      targetUsed.add(layoutTransition.targetHandle);
      usedTargetHandles.set(targetStateId, targetUsed);
    }

    // New format: stateToTransition and transitionToState handles
    if (layoutTransition.stateToTransitionSourceHandle) {
      const sourceUsed = usedSourceHandles.get(sourceStateId) || new Set<string>();
      sourceUsed.add(layoutTransition.stateToTransitionSourceHandle);
      usedSourceHandles.set(sourceStateId, sourceUsed);
    }

    if (layoutTransition.transitionToStateTargetHandle) {
      const targetUsed = usedTargetHandles.get(targetStateId) || new Set<string>();
      targetUsed.add(layoutTransition.transitionToStateTargetHandle);
      usedTargetHandles.set(targetStateId, targetUsed);
    }
  });

  // Store new handle assignments
  const newHandleAssignments = new Map<string, { sourceHandle: string; targetHandle: string }>();

  // STEP 1: Reserve handles for loopback transitions that are affected
  Object.entries(workflow.configuration.states).forEach(([stateId, state]) => {
    state.transitions.forEach((transition, index) => {
      const transitionKey = `${stateId}-${index}`;

      // Only process if this transition is affected
      if (!affectedTransitions.has(transitionKey)) return;

      const isLoopback = transition.next === stateId;
      if (!isLoopback) return;

      const sourceHandle = 'top-right-source';
      const targetHandle = 'top-left-target';

      const sourceUsed = usedSourceHandles.get(stateId) || new Set<string>();
      const targetUsed = usedTargetHandles.get(stateId) || new Set<string>();

      sourceUsed.add(sourceHandle);
      targetUsed.add('top-right-target');
      targetUsed.add('top-left-target');

      usedSourceHandles.set(stateId, sourceUsed);
      usedTargetHandles.set(stateId, targetUsed);

      newHandleAssignments.set(transitionKey, { sourceHandle, targetHandle });

      // console.log('[AutoLayout] Reserved loopback handles:', {
      //   stateId,
      //   transitionKey,
      //   sourceHandle,
      //   targetHandle,
      // });
    });
  });

  // STEP 2: Assign source handles for affected outgoing transitions
  // Group affected transitions by their source state
  const transitionsBySourceState = new Map<string, Array<{ targetStateId: string; index: number; targetPos?: { x: number; y: number } }>>();

  affectedTransitions.forEach(transitionKey => {
    const parts = transitionKey.split('-');
    const index = parseInt(parts[parts.length - 1], 10);
    const sourceStateId = parts.slice(0, -1).join('-');

    const state = workflow.configuration.states[sourceStateId];
    if (!state || !state.transitions[index]) return;

    const transition = state.transitions[index];
    const targetPos = statePositions.get(transition.next);
    if (!targetPos) return;

    // Skip loopback transitions (already handled)
    const isLoopback = sourceStateId === transition.next;
    if (isLoopback) return;

    if (!transitionsBySourceState.has(sourceStateId)) {
      transitionsBySourceState.set(sourceStateId, []);
    }
    transitionsBySourceState.get(sourceStateId)!.push({ targetStateId: transition.next, index, targetPos });
  });

  transitionsBySourceState.forEach((transitions, sourceStateId) => {
    const sourcePos = statePositions.get(sourceStateId);
    if (!sourcePos) return;

    // Group transitions by direction
    const transitionsByDirection = new Map<string, Array<{ targetStateId: string; index: number; targetPos?: { x: number; y: number } }>>();

    transitions.forEach((trans) => {
      const targetPos = trans.targetPos;
      if (!targetPos) return;

      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;

      // Determine primary direction
      let direction: string;
      if (Math.abs(dy) > Math.abs(dx)) {
        direction = dy > 0 ? 'bottom' : 'top';
      } else {
        direction = dx > 0 ? 'right' : 'left';
      }

      if (!transitionsByDirection.has(direction)) {
        transitionsByDirection.set(direction, []);
      }
      transitionsByDirection.get(direction)!.push(trans);
    });

    // Assign handles for each direction group
    let stateUsedHandles = usedSourceHandles.get(sourceStateId) || new Set<string>();

    transitionsByDirection.forEach((transitionsInDirection, direction) => {
      const primaryHandles = getAllHandlesForSide(direction as 'top' | 'bottom' | 'left' | 'right');
      const fallbackHandles = getFallbackHandlesForSide(direction as 'top' | 'bottom' | 'left' | 'right');
      const allHandlesInOrder = [...primaryHandles, ...fallbackHandles];

      // Sort transitions by angle
      const sortedTransitions = transitionsInDirection.sort((a, b) => {
        const angleA = Math.atan2(a.targetPos!.y - sourcePos.y, a.targetPos!.x - sourcePos.x);
        const angleB = Math.atan2(b.targetPos!.y - sourcePos.y, b.targetPos!.x - sourcePos.x);
        return angleA - angleB;
      });

      // Assign handles
      sortedTransitions.forEach((trans, i) => {
        let assignedHandle: string | null = null;

        // Try primary handles first
        if (i < primaryHandles.length) {
          const primaryHandle = primaryHandles[i];
          if (!stateUsedHandles.has(primaryHandle)) {
            assignedHandle = primaryHandle;
          }
        }

        // Use fallback if needed
        if (!assignedHandle) {
          const sortedFallbacks = [...fallbackHandles].sort((a, b) => {
            const distA = getHandleDistanceToTarget(a, sourcePos, trans.targetPos!, opts.nodeWidth, opts.nodeHeight);
            const distB = getHandleDistanceToTarget(b, sourcePos, trans.targetPos!, opts.nodeWidth, opts.nodeHeight);
            return distA - distB;
          });

          for (const handle of sortedFallbacks) {
            if (!stateUsedHandles.has(handle)) {
              assignedHandle = handle;
              break;
            }
          }
        }

        // Ultimate fallback
        if (!assignedHandle) {
          assignedHandle = primaryHandles[primaryHandles.length - 1];
        }

        stateUsedHandles.add(assignedHandle);

        // Reserve corresponding target handle
        const correspondingTargetHandle = sourceHandleToTargetHandle(assignedHandle);
        const stateTargetHandles = usedTargetHandles.get(sourceStateId) || new Set<string>();
        stateTargetHandles.add(correspondingTargetHandle);
        usedTargetHandles.set(sourceStateId, stateTargetHandles);

        const transitionKey = `${sourceStateId}-${trans.index}`;
        if (!newHandleAssignments.has(transitionKey)) {
          newHandleAssignments.set(transitionKey, {
            sourceHandle: assignedHandle,
            targetHandle: '', // Will be assigned in STEP 3
          });
        }
      });
    });

    usedSourceHandles.set(sourceStateId, stateUsedHandles);
  });

  // console.log('[AutoLayout] Recalculated source handles:', newHandleAssignments.size);

  // STEP 3: Assign target handles for affected incoming transitions
  // Group affected transitions by their target state
  const transitionsByTargetState = new Map<string, Array<{ sourceStateId: string; index: number; sourcePos?: { x: number; y: number } }>>();

  affectedTransitions.forEach(transitionKey => {
    const parts = transitionKey.split('-');
    const index = parseInt(parts[parts.length - 1], 10);
    const sourceStateId = parts.slice(0, -1).join('-');

    const state = workflow.configuration.states[sourceStateId];
    if (!state || !state.transitions[index]) return;

    const transition = state.transitions[index];
    const targetStateId = transition.next;
    const sourcePos = statePositions.get(sourceStateId);

    if (!transitionsByTargetState.has(targetStateId)) {
      transitionsByTargetState.set(targetStateId, []);
    }
    transitionsByTargetState.get(targetStateId)!.push({ sourceStateId, index, sourcePos });
  });

  transitionsByTargetState.forEach((incomingTransitions, targetStateId) => {
    const targetPos = statePositions.get(targetStateId);
    if (!targetPos) return;

    // Group incoming transitions by direction
    const incomingByDirection = new Map<string, typeof incomingTransitions>();

    incomingTransitions.forEach(trans => {
      if (!trans.sourcePos) return;

      const dx = targetPos.x - trans.sourcePos.x;
      const dy = targetPos.y - trans.sourcePos.y;

      let direction: string;
      if (Math.abs(dy) > Math.abs(dx)) {
        direction = dy > 0 ? 'top' : 'bottom';
      } else {
        direction = dx > 0 ? 'left' : 'right';
      }

      if (!incomingByDirection.has(direction)) {
        incomingByDirection.set(direction, []);
      }
      incomingByDirection.get(direction)!.push(trans);
    });

    // Assign target handles for each direction group
    incomingByDirection.forEach((transitionsInDirection, direction) => {
      const allTargetHandles = getAllTargetHandlesForSide(direction as 'top' | 'bottom' | 'left' | 'right');
      let usedTargets = usedTargetHandles.get(targetStateId) || new Set<string>();
      const availableTargetHandles = allTargetHandles.filter(h => !usedTargets.has(h));

      transitionsInDirection.forEach((trans, i) => {
        const handleIndex = Math.min(i, availableTargetHandles.length - 1);
        const stateTargetHandle = availableTargetHandles.length > 0
          ? availableTargetHandles[handleIndex]
          : allTargetHandles[0];

        usedTargets.add(stateTargetHandle);

        const transitionKey = `${trans.sourceStateId}-${trans.index}`;
        const existing = newHandleAssignments.get(transitionKey);
        if (existing) {
          newHandleAssignments.set(transitionKey, {
            ...existing,
            targetHandle: stateTargetHandle,
          });
        }
      });

      usedTargetHandles.set(targetStateId, usedTargets);
    });
  });

  // console.log('[AutoLayout] Recalculated target handles');

  // STEP 4: Update layout transitions with new handles
  const updatedLayoutTransitions = workflow.layout.transitions.map(layoutTransition => {
    const assignment = newHandleAssignments.get(layoutTransition.id);
    if (!assignment) return layoutTransition;

    // console.log('[AutoLayout] Updating handles for transition:', {
    //   id: layoutTransition.id,
    //   oldSourceHandle: layoutTransition.sourceHandle,
    //   newSourceHandle: assignment.sourceHandle,
    //   oldTargetHandle: layoutTransition.targetHandle,
    //   newTargetHandle: assignment.targetHandle,
    // });

    return {
      ...layoutTransition,
      sourceHandle: assignment.sourceHandle,
      targetHandle: assignment.targetHandle,
    };
  });

  const updatedWorkflow: UIWorkflowData = {
    ...workflow,
    layout: {
      ...workflow.layout,
      transitions: updatedLayoutTransitions,
      updatedAt: new Date().toISOString(),
    },
  };

  // console.log('[AutoLayout] Handle recalculation complete');

  return updatedWorkflow;
}
