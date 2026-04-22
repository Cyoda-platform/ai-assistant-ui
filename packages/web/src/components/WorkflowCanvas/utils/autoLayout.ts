// ABOUTME: This file provides automatic layout functionality using a custom hierarchical layout algorithm
// to arrange workflow states in a hierarchical, visually organized manner.

import dagre from '@dagrejs/dagre';
import type { UIWorkflowData, UIStateData, UITransitionData } from '../types/workflow';

/**
 * Helper function to determine if a transition is a failure path
 */
function isFailureTransition(transition: UITransitionData, targetStateId: string): boolean {
  const transitionName = (transition.name || '').toLowerCase();
  const targetState = targetStateId.toLowerCase();
  const failureKeywords = ['fail', 'error', 'exception', 'reject', 'abort', 'cancel'];
  return failureKeywords.some(keyword =>
    transitionName.includes(keyword) || targetState.includes(keyword)
  );
}

/**
 * Assigns rank (level) to each state based on topological distance from initial state.
 * Handles cycles by allowing back-edges.
 * Prioritizes main path (success) over failure paths.
 */
function assignRanks(workflow: UIWorkflowData): Map<string, number> {
  const ranks = new Map<string, number>();
  const stateIds = Object.keys(workflow.configuration.states);
  const initialState = workflow.configuration.initialState;

  // Initialize all ranks to -1 (unvisited)
  stateIds.forEach(id => ranks.set(id, -1));

  // Priority queue: process main path transitions first, then failure paths
  // Each item: { stateId, rank, isFailurePath }
  const queue: Array<{ stateId: string; rank: number; isFailurePath: boolean }> = [];
  queue.push({ stateId: initialState, rank: 0, isFailurePath: false });
  ranks.set(initialState, 0);

  while (queue.length > 0) {
    // Sort queue: process non-failure paths first (lower isFailurePath value)
    queue.sort((a, b) => {
      if (a.isFailurePath !== b.isFailurePath) {
        return a.isFailurePath ? 1 : -1; // Non-failure first
      }
      return a.rank - b.rank; // Then by rank
    });

    const current = queue.shift()!;
    const currentStateId = current.stateId;
    const currentRank = current.rank;
    const stateDefinition = workflow.configuration.states[currentStateId];

    if (stateDefinition) {
      stateDefinition.transitions.forEach(transition => {
        const nextStateId = transition.next;
        const nextRank = ranks.get(nextStateId) ?? -1;
        const isFailure = isFailureTransition(transition, nextStateId);

        // Only update if we haven't visited this state yet, or if we found a shorter path
        if (nextRank === -1) {
          ranks.set(nextStateId, currentRank + 1);
          queue.push({ stateId: nextStateId, rank: currentRank + 1, isFailurePath: isFailure });
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
    // Handle information (legacy fields, kept for compatibility)
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
  nodeSeparation: 550, // Horizontal spacing between nodes in same rank - increased from 500
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
  const padding = 30; // Approximate padding around transition labels
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
 * Returns handles in order: center first (for single transitions), then left/right or top/bottom
 */
function getAllHandlesForSide(side: 'top' | 'bottom' | 'left' | 'right'): string[] {
  switch (side) {
    case 'top':
      // Order: center first (for single transitions), then left, then right
      return ['top-center-source', 'top-left-source', 'top-right-source'];
    case 'bottom':
      // Order: center first (for single transitions), then left, then right
      return ['bottom-center-source', 'bottom-left-source', 'bottom-right-source'];
    case 'left':
      // Order: top to bottom (matches angle sorting from top to bottom)
      return ['left-top-source', 'left-bottom-source'];
    case 'right':
      // Order: top to bottom (matches angle sorting from top to bottom)
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
 * Get handle position offset from node's top-left corner.
 */
function getHandleOffset(handle: string, nodeWidth: number, nodeHeight: number): { x: number; y: number } {
  // Offsets are from top-left corner of the node
  const handleOffsets: Record<string, { x: number; y: number }> = {
    // Top handles
    'top-left-source': { x: nodeWidth * 0.2, y: 0 },
    'top-center-source': { x: nodeWidth / 2, y: 0 },
    'top-right-source': { x: nodeWidth * 0.8, y: 0 },
    'top-left-target': { x: nodeWidth * 0.2, y: 0 },
    'top-center-target': { x: nodeWidth / 2, y: 0 },
    'top-right-target': { x: nodeWidth * 0.8, y: 0 },

    // Bottom handles
    'bottom-left-source': { x: nodeWidth * 0.2, y: nodeHeight },
    'bottom-center-source': { x: nodeWidth / 2, y: nodeHeight },
    'bottom-right-source': { x: nodeWidth * 0.8, y: nodeHeight },
    'bottom-left-target': { x: nodeWidth * 0.2, y: nodeHeight },
    'bottom-center-target': { x: nodeWidth / 2, y: nodeHeight },
    'bottom-right-target': { x: nodeWidth * 0.8, y: nodeHeight },

    // Left handles
    'left-top-source': { x: 0, y: nodeHeight * 0.33 },
    'left-bottom-source': { x: 0, y: nodeHeight * 0.67 },
    'left-top-target': { x: 0, y: nodeHeight * 0.33 },
    'left-bottom-target': { x: 0, y: nodeHeight * 0.67 },

    // Right handles
    'right-top-source': { x: nodeWidth, y: nodeHeight * 0.33 },
    'right-bottom-source': { x: nodeWidth, y: nodeHeight * 0.67 },
    'right-top-target': { x: nodeWidth, y: nodeHeight * 0.33 },
    'right-bottom-target': { x: nodeWidth, y: nodeHeight * 0.67 },
  };

  return handleOffsets[handle] || { x: nodeWidth / 2, y: nodeHeight / 2 };
}

/**
 * Calculate distance from source handle to target handle.
 * Lower distance = better match.
 */
function getHandleDistanceToTarget(
  handle: string,
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  nodeWidth: number,
  nodeHeight: number
): number {
  const offset = getHandleOffset(handle, nodeWidth, nodeHeight);

  // Calculate handle position in world coordinates
  const handleX = sourcePos.x + offset.x;
  const handleY = sourcePos.y + offset.y;

  // Calculate distance to target center (we'll improve this for target handles later)
  const targetCenterX = targetPos.x + nodeWidth / 2;
  const targetCenterY = targetPos.y + nodeHeight / 2;

  const dx = targetCenterX - handleX;
  const dy = targetCenterY - handleY;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate distance between two specific handles (source handle to target handle).
 * This is more accurate than calculating to the center of the target state.
 */
function getHandleToHandleDistance(
  sourceHandle: string,
  sourcePos: { x: number; y: number },
  targetHandle: string,
  targetPos: { x: number; y: number },
  nodeWidth: number,
  nodeHeight: number
): number {
  const sourceOffset = getHandleOffset(sourceHandle, nodeWidth, nodeHeight);
  const targetOffset = getHandleOffset(targetHandle, nodeWidth, nodeHeight);

  const sourceHandleX = sourcePos.x + sourceOffset.x;
  const sourceHandleY = sourcePos.y + sourceOffset.y;

  const targetHandleX = targetPos.x + targetOffset.x;
  const targetHandleY = targetPos.y + targetOffset.y;

  const dx = targetHandleX - sourceHandleX;
  const dy = targetHandleY - sourceHandleY;

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
 * This is used to reserve source handles when target handles are used.
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
      opts.rankSeparation = 400; // Horizontal spacing for LR/RL - decreased from 500
    } else {
      opts.rankSeparation = 350; // Vertical spacing for TB/BT
    }
  }
  if (!options.nodeSeparation) opts.nodeSeparation = 550; // Spacing between nodes in same rank (cross axis) - increased from 500
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

    // Sort states in rank: main path states first, then failure states
    // This ensures main path is centered and failure paths are on the sides
    const sortedStatesInRank = [...statesInRank].sort((a, b) => {
      const stateA = workflow.configuration.states[a];
      const stateB = workflow.configuration.states[b];

      // Check if state is a failure state by looking at incoming transitions
      const isFailureStateA = stateIds.some(sourceId => {
        const sourceState = workflow.configuration.states[sourceId];
        return sourceState?.transitions.some(t =>
          t.next === a && isFailureTransition(t, a)
        );
      });

      const isFailureStateB = stateIds.some(sourceId => {
        const sourceState = workflow.configuration.states[sourceId];
        return sourceState?.transitions.some(t =>
          t.next === b && isFailureTransition(t, b)
        );
      });

      // Main path states come first (lower value)
      if (isFailureStateA !== isFailureStateB) {
        return isFailureStateA ? 1 : -1;
      }

      // Otherwise maintain original order
      return 0;
    });

    let x: number;
    let y: number;

    if (opts.direction === 'TB' || opts.direction === 'BT') {
      // Top-to-Bottom or Bottom-to-Top: ranks go vertically
      const rankY = rankPositions.get(rank) || 100;
      const totalWidth = sortedStatesInRank.length * opts.nodeSeparation;
      const startX = 400 - totalWidth / 2; // Center around x=400

      sortedStatesInRank.forEach((stateId, index) => {
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
      const totalHeight = sortedStatesInRank.length * opts.nodeSeparation;
      const startY = 300 - totalHeight / 2; // Center around y=300

      sortedStatesInRank.forEach((stateId, index) => {
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

        // Reserve the source handle (outgoing from state)
        sourceUsed.add(sourceHandle);

        // Reserve the corresponding target handle for the source handle
        // (to prevent regular transitions from using it)
        const correspondingTargetForSource = sourceHandleToTargetHandle(sourceHandle);
        targetUsed.add(correspondingTargetForSource);

        // Reserve the target handle (incoming to state)
        targetUsed.add(targetHandle);

        // Reserve the corresponding source handle for the target handle
        // (to prevent regular transitions from using it)
        const correspondingSourceForTarget = targetHandleToSourceHandle(targetHandle);
        sourceUsed.add(correspondingSourceForTarget);

        usedSourceHandles.set(stateId, sourceUsed);
        usedTargetHandles.set(stateId, targetUsed);

        // Store assignment
        const transitionKey = `${stateId}-${index}`;
        transitionHandleAssignments.set(transitionKey, {
          sourceHandle,
          targetHandle,
        });
      }
    });
  });

  // STEP 2: Assign handles for regular (non-loopback) transitions

  outgoingTransitionsByState.forEach((outgoingTransitions, sourceStateId) => {
    const sourcePos = statePositions.get(sourceStateId);
    if (!sourcePos) return;

    // Get already used handles (including loopback reservations)
    let stateUsedHandles = usedSourceHandles.get(sourceStateId) || new Set<string>();

    // Group transitions by direction to assign handles intelligently
    const transitionsByDirection = new Map<string, typeof outgoingTransitions>();

    outgoingTransitions.forEach(trans => {
      if (!trans.targetPos) return;

      // Skip loopback transitions (already handled)
      const isLoopback = sourceStateId === trans.targetStateId;
      if (isLoopback) return;

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
      let primaryHandles = getAllHandlesForSide(direction as 'top' | 'bottom' | 'left' | 'right');
      const fallbackHandles = getFallbackHandlesForSide(direction as 'top' | 'bottom' | 'left' | 'right');

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

      // IMPORTANT: For multiple transitions in the same direction, skip center handle
      // Use left/right (or top/bottom) handles to avoid crossings
      if (sortedTransitions.length > 1 && (direction === 'top' || direction === 'bottom')) {
        // For vertical directions with multiple transitions, use left/right handles only
        primaryHandles = primaryHandles.filter(h => !h.includes('-center-'));
      }

      // Combine primary and fallback handles
      const allHandlesInOrder = [...primaryHandles, ...fallbackHandles];

      // console.log(`[AutoLayout] Assigning source handles for ${sourceStateId} direction ${direction}:`, {
      //   transitionCount: sortedTransitions.length,
      //   primaryHandles,
      //   fallbackHandles,
      //   usedHandles: Array.from(stateUsedHandles),
      // });

      // Assign handles to transitions in this direction
      sortedTransitions.forEach((trans, i) => {
        let assignedHandle: string | null = null;

        // Check if there's a reverse transition (transitions in both directions)
        const hasReverseTransition = outgoingTransitionsByState.get(trans.targetStateId)?.some(
          t => t.targetStateId === sourceStateId
        );

        // For transitions in both directions, use offset handles to avoid crossing
        // BUT ONLY if the transition is truly vertical/horizontal (not diagonal)
        if (hasReverseTransition && trans.targetPos) {
          const dx = trans.targetPos.x - sourcePos.x;
          const dy = trans.targetPos.y - sourcePos.y;

          // Check if transition is truly vertical (dx is small compared to dy)
          const isTrulyVertical = Math.abs(dy) > Math.abs(dx) * 4;
          // Check if transition is truly horizontal (dy is small compared to dx)
          const isTrulyHorizontal = Math.abs(dx) > Math.abs(dy) * 4;

          if (isTrulyVertical && (direction === 'top' || direction === 'bottom')) {
            // For vertical directions, use left/right offset handles
            // Choose side based on horizontal component (dx)
            // If dx === 0 (perfectly vertical), use consistent side based on state IDs
            let useRightSide: boolean;
            if (dx === 0) {
              // Use consistent side for both directions when perfectly vertical
              useRightSide = sourceStateId < trans.targetStateId;
            } else {
              // If moving right (dx > 0), use right side; if moving left (dx < 0), use left side
              useRightSide = dx > 0;
            }

            // Choose specific handle based on direction and side
            let preferredHandle: string;
            if (direction === 'bottom') {
              preferredHandle = useRightSide ? 'bottom-right-source' : 'bottom-left-source';
            } else { // direction === 'top'
              preferredHandle = useRightSide ? 'top-right-source' : 'top-left-source';
            }

            if (!stateUsedHandles.has(preferredHandle)) {
              assignedHandle = preferredHandle;
            }
          } else if (isTrulyHorizontal && (direction === 'left' || direction === 'right')) {
            // For horizontal directions, use top/bottom offset handles
            // Choose side based on vertical component (dy)
            // If dy === 0 (perfectly horizontal), use consistent side based on state IDs
            let useBottomSide: boolean;
            if (dy === 0) {
              // Use consistent side for both directions when perfectly horizontal
              useBottomSide = sourceStateId < trans.targetStateId;
            } else {
              // If moving down (dy > 0), use bottom side; if moving up (dy < 0), use top side
              useBottomSide = dy > 0;
            }

            // Choose specific handle based on direction and side
            let preferredHandle: string;
            if (direction === 'right') {
              preferredHandle = useBottomSide ? 'right-bottom-source' : 'right-top-source';
            } else { // direction === 'left'
              preferredHandle = useBottomSide ? 'left-bottom-source' : 'left-top-source';
            }

            if (!stateUsedHandles.has(preferredHandle)) {
              assignedHandle = preferredHandle;
            }
          }
        }

        // If no offset handle assigned, try primary handles
        if (!assignedHandle && i < primaryHandles.length) {
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

        // console.log(`[AutoLayout] Assigned source handle for ${sourceStateId} → ${trans.targetStateId}:`, {
        //   transitionIndex: i,
        //   targetStateId: trans.targetStateId,
        //   direction,
        //   assignedHandle,
        //   wasAlreadyUsed: stateUsedHandles.has(assignedHandle),
        // });

        stateUsedHandles.add(assignedHandle);

        // IMPORTANT: Also reserve the corresponding target handle on the SAME state
        // This prevents incoming transitions from using the same position (e.g., right-top-source and right-top-target)
        const correspondingTargetHandle = sourceHandleToTargetHandle(assignedHandle);
        const stateTargetHandles = usedTargetHandles.get(sourceStateId) || new Set<string>();
        stateTargetHandles.add(correspondingTargetHandle);
        usedTargetHandles.set(sourceStateId, stateTargetHandles);

        // console.log(`[AutoLayout] Reserved target handle ${correspondingTargetHandle} on ${sourceStateId} (same position as source ${assignedHandle})`);

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

          // Calculate deltas for later use (center-based)
          const dxCenter = targetCenterX - sourceCenterX;
          const dyCenter = targetCenterY - sourceCenterY;

          // Position transition nodes at 40% horizontally (closer to source), 50% vertically (centered)
          // For horizontal transitions (dy ≈ 0), use 50% to center them between states
          const isHorizontalTransition = Math.abs(dyCenter) < 50;
          const ratioX = isHorizontalTransition ? 0.5 : 0.4;
          const ratioY = 0.5;
          let midX = sourceCenterX + (targetCenterX - sourceCenterX) * ratioX;
          let midY = sourceCenterY + (targetCenterY - sourceCenterY) * ratioY;

          // Add offset to "expand" the diagram
          {
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

          // Apply standard positioning logic for all transitions
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

          // Assign handles for all transitions
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
            // Regular transition
            // Use pre-assigned source handle from the grouping logic
            let stateSourceHandle = preAssignedHandles?.sourceHandle || 'bottom-center-source';

            // Now assign target handle based on target state's incoming transitions
            const incomingTransitions = incomingTransitionsByState.get(transition.next) || [];
            const incomingIndex = incomingTransitions.findIndex(t => t.sourceStateId === sourceStateId && t.index === index);

            // Group incoming transitions by direction
            const incomingByDirection = new Map<string, typeof incomingTransitions>();
            incomingTransitions.forEach(trans => {
              if (!trans.sourcePos) return;

              const dx = trans.sourcePos.x - targetPos.x;
              const dy = trans.sourcePos.y - targetPos.y;

              // console.log('[AutoLayout] Grouping incoming transition:', {
              //   transitionKey: `${trans.sourceStateId}-${trans.index}`,
              //   sourceStateId: trans.sourceStateId,
              //   targetStateId: transition.next,
              //   sourcePos: trans.sourcePos,
              //   targetPos,
              //   dx,
              //   dy,
              // });

              let direction: string;

              // For TB/BT layouts, prioritize vertical direction
              // Use a lower threshold to prefer top/bottom over left/right
              if (opts.direction === 'TB' || opts.direction === 'BT') {
                // If there's any significant vertical movement, use vertical direction
                if (Math.abs(dy) > Math.abs(dx) * 0.3) {
                  // dy > 0 means source is BELOW target, so target receives from BOTTOM
                  // dy < 0 means source is ABOVE target, so target receives from TOP
                  direction = dy > 0 ? 'bottom' : 'top';
                } else {
                  // dx > 0 means source is to the RIGHT of target, so target receives from RIGHT
                  // dx < 0 means source is to the LEFT of target, so target receives from LEFT
                  direction = dx > 0 ? 'right' : 'left';
                }
              } else {
                // For LR/RL layouts, use standard logic
                if (Math.abs(dy) > Math.abs(dx)) {
                  // dy > 0 means source is BELOW target, so target receives from BOTTOM
                  // dy < 0 means source is ABOVE target, so target receives from TOP
                  direction = dy > 0 ? 'bottom' : 'top';
                } else {
                  // dx > 0 means source is to the RIGHT of target, so target receives from RIGHT
                  // dx < 0 means source is to the LEFT of target, so target receives from LEFT
                  direction = dx > 0 ? 'right' : 'left';
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

            // Get ALL available target handles on the target state
            // We'll prioritize handles from the preferred direction, but consider all handles
            const allPossibleTargetHandles = [
              ...getAllTargetHandlesForSide('top'),
              ...getAllTargetHandlesForSide('bottom'),
              ...getAllTargetHandlesForSide('left'),
              ...getAllTargetHandlesForSide('right'),
            ];

            let usedTargets = usedTargetHandles.get(transition.next) || new Set<string>();
            const availableTargetHandles = allPossibleTargetHandles.filter(h => !usedTargets.has(h));

            // console.log('[AutoLayout] Assigning target handle:', {
            //   transitionKey: `${sourceStateId}-${index}`,
            //   transitionName: transition.name,
            //   sourceStateId,
            //   targetStateId: transition.next,
            //   targetDirection,
            //   allPossibleTargetHandles: allPossibleTargetHandles.length,
            //   usedTargets: Array.from(usedTargets),
            //   availableTargetHandles: availableTargetHandles.length,
            // });

            // Select the best available handle based on handle-to-handle distance
            let stateTargetHandle: string;
            if (availableTargetHandles.length > 0) {
              // Check if there's a reverse transition (transitions in both directions)
              const hasReverseTransition = outgoingTransitionsByState.get(transition.next)?.some(
                t => t.targetStateId === sourceStateId
              );

              // For transitions in both directions, use offset handles to avoid crossing
              // BUT ONLY if the transition is truly vertical/horizontal (not diagonal)
              if (hasReverseTransition) {
                const dx = targetPos.x - sourcePos.x;
                const dy = targetPos.y - sourcePos.y;

                // Check if transition is truly vertical (dx is small compared to dy)
                const isTrulyVertical = Math.abs(dy) > Math.abs(dx) * 4;
                // Check if transition is truly horizontal (dy is small compared to dx)
                const isTrulyHorizontal = Math.abs(dx) > Math.abs(dy) * 4;

                if (isTrulyVertical && (targetDirection === 'top' || targetDirection === 'bottom')) {
                  // For vertical directions, use left/right offset handles
                  // Choose side based on horizontal component (dx)
                  // IMPORTANT: For target, we need SAME horizontal side as source for bidirectional transitions
                  // If dx === 0 (perfectly vertical), use consistent side based on state IDs
                  let useRightSide: boolean;
                  if (dx === 0) {
                    // Use consistent side for both directions when perfectly vertical
                    // Use SAME logic as source: if sourceStateId < targetStateId, both use right side
                    useRightSide = sourceStateId < transition.next;
                  } else {
                    // If moving right (dx > 0), both use right side
                    // If moving left (dx < 0), both use left side
                    useRightSide = dx > 0;
                  }

                  // Choose specific handle based on direction and side
                  let preferredHandle: string;
                  if (targetDirection === 'top') {
                    preferredHandle = useRightSide ? 'top-right-target' : 'top-left-target';
                  } else { // targetDirection === 'bottom'
                    preferredHandle = useRightSide ? 'bottom-right-target' : 'bottom-left-target';
                  }

                  if (availableTargetHandles.includes(preferredHandle)) {
                    stateTargetHandle = preferredHandle;
                  } else {
                    // Fallback to distance-based selection
                    const sortedAvailableHandles = [...availableTargetHandles].sort((a, b) => {
                      const actualSourceHandle = stateSourceHandle;
                      const distA = getHandleToHandleDistance(actualSourceHandle, sourcePos, a, targetPos, opts.nodeWidth, opts.nodeHeight);
                      const distB = getHandleToHandleDistance(actualSourceHandle, sourcePos, b, targetPos, opts.nodeWidth, opts.nodeHeight);
                      return distA - distB;
                    });
                    stateTargetHandle = sortedAvailableHandles[0];
                  }
                } else if (isTrulyHorizontal && (targetDirection === 'left' || targetDirection === 'right')) {
                  // For horizontal directions, use top/bottom offset handles
                  // Choose side based on vertical component (dy)
                  // IMPORTANT: For target, we need SAME vertical side as source for bidirectional transitions
                  // If dy === 0 (perfectly horizontal), use consistent side based on state IDs
                  let useBottomSide: boolean;
                  if (dy === 0) {
                    // Use consistent side for both directions when perfectly horizontal
                    // Use SAME logic as source: if sourceStateId < targetStateId, both use bottom side
                    useBottomSide = sourceStateId < transition.next;
                  } else {
                    // If moving down (dy > 0), both use bottom side
                    // If moving up (dy < 0), both use top side
                    useBottomSide = dy > 0;
                  }

                  // Choose specific handle based on direction and side
                  let preferredHandle: string;
                  if (targetDirection === 'left') {
                    preferredHandle = useBottomSide ? 'left-bottom-target' : 'left-top-target';
                  } else { // targetDirection === 'right'
                    preferredHandle = useBottomSide ? 'right-bottom-target' : 'right-top-target';
                  }

                  if (availableTargetHandles.includes(preferredHandle)) {
                    stateTargetHandle = preferredHandle;
                  } else {
                    // Fallback to distance-based selection
                    const sortedAvailableHandles = [...availableTargetHandles].sort((a, b) => {
                      const actualSourceHandle = stateSourceHandle;
                      const distA = getHandleToHandleDistance(actualSourceHandle, sourcePos, a, targetPos, opts.nodeWidth, opts.nodeHeight);
                      const distB = getHandleToHandleDistance(actualSourceHandle, sourcePos, b, targetPos, opts.nodeWidth, opts.nodeHeight);
                      return distA - distB;
                    });
                    stateTargetHandle = sortedAvailableHandles[0];
                  }
                } else {
                  // Diagonal transition - use distance-based selection
                  const sortedAvailableHandles = [...availableTargetHandles].sort((a, b) => {
                    const actualSourceHandle = stateSourceHandle;
                    const distA = getHandleToHandleDistance(actualSourceHandle, sourcePos, a, targetPos, opts.nodeWidth, opts.nodeHeight);
                    const distB = getHandleToHandleDistance(actualSourceHandle, sourcePos, b, targetPos, opts.nodeWidth, opts.nodeHeight);
                    return distA - distB;
                  });
                  stateTargetHandle = sortedAvailableHandles[0];
                }
              } else {
                // No reverse transition, use distance-based selection
                const sortedAvailableHandles = [...availableTargetHandles].sort((a, b) => {
                  const actualSourceHandle = stateSourceHandle;
                  const distA = getHandleToHandleDistance(actualSourceHandle, sourcePos, a, targetPos, opts.nodeWidth, opts.nodeHeight);
                  const distB = getHandleToHandleDistance(actualSourceHandle, sourcePos, b, targetPos, opts.nodeWidth, opts.nodeHeight);
                  return distA - distB; // Lower distance = better match
                });
                stateTargetHandle = sortedAvailableHandles[0];
                // console.log('[AutoLayout] Selected target handle (sorted by handle-to-handle distance):', {
                //   sourceHandle: stateSourceHandle,
                //   availableCount: availableTargetHandles.length,
                //   selected: stateTargetHandle,
                //   top3Distances: sortedAvailableHandles.slice(0, 3).map(h => ({
                //     handle: h,
                //     distance: getHandleToHandleDistance(stateSourceHandle, sourcePos, h, targetPos, opts.nodeWidth, opts.nodeHeight).toFixed(1),
                //   })),
                // });
              }
            } else {
              // No available handles at all, reuse the closest handle from preferred direction
              const preferredHandles = getAllTargetHandlesForSide(targetDirection as 'top' | 'bottom' | 'left' | 'right');
              stateTargetHandle = preferredHandles[0];
            }

            // For transition node, use center handles
            const transitionTargetHandle = 'top-center-target';
            const transitionSourceHandle = 'bottom-center-source';

            handles.stateToTransitionSourceHandle = stateSourceHandle;
            handles.stateToTransitionTargetHandle = transitionTargetHandle;
            handles.transitionToStateSourceHandle = transitionSourceHandle;
            handles.transitionToStateTargetHandle = stateTargetHandle;

            // console.log(`[AutoLayout] Final handles for ${sourceStateId} → ${transition.next}:`, {
            //   transitionName: transition.name,
            //   stateToTransitionSourceHandle: stateSourceHandle,
            //   stateToTransitionTargetHandle: transitionTargetHandle,
            //   transitionToStateSourceHandle: transitionSourceHandle,
            //   transitionToStateTargetHandle: stateTargetHandle,
            // });

            // Mark handles as used
            const sourceSet = usedSourceHandles.get(sourceStateId) || new Set<string>();
            sourceSet.add(stateSourceHandle);
            usedSourceHandles.set(sourceStateId, sourceSet);

            usedTargets.add(stateTargetHandle);
            usedTargetHandles.set(transition.next, usedTargets);

            // IMPORTANT: Also reserve the corresponding source handle on the target state
            // This prevents outgoing transitions from the target state from using the same position
            const correspondingSourceHandle = targetHandleToSourceHandle(stateTargetHandle);
            const targetStateSourceHandles = usedSourceHandles.get(transition.next) || new Set<string>();
            targetStateSourceHandles.add(correspondingSourceHandle);
            usedSourceHandles.set(transition.next, targetStateSourceHandles);

            // console.log(`[AutoLayout] Reserved source handle ${correspondingSourceHandle} on ${transition.next} (same position as target ${stateTargetHandle})`);
          }

          const transitionPosition = {
            x: midX - transitionWidth / 2,
            y: midY - transitionHeight / 2,
          };

          // Add sourceHandle and targetHandle for all transitions
          // These are used by WorkflowCanvas to create edges directly from source state to target state
          const regularHandles = {
            sourceHandle: handles.stateToTransitionSourceHandle,
            targetHandle: handles.transitionToStateTargetHandle,
          };

          // console.log('🔧 Creating transition in autoLayout:', {
          //   transitionId,
          //   transitionName: transition.name,
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
        // Include handle information (legacy fields)
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
          // Include handle information (legacy fields)
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

      // Skip loopback transitions - they keep their handles when state moves
      const isLoopback = sourceStateId === transition.next;
      if (isLoopback) {
        return;
      }

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

  // STEP 1: Reserve handles for ALL loopback transitions (not just affected ones)
  // Loopback handles are NEVER recalculated when state moves - they stay fixed
  Object.entries(workflow.configuration.states).forEach(([stateId, state]) => {
    state.transitions.forEach((transition, index) => {
      const transitionKey = `${stateId}-${index}`;

      const isLoopback = transition.next === stateId;
      if (!isLoopback) return;

      // Get existing handles from layout (loopback handles are preserved)
      const existingLayout = workflow.layout.transitions.find(t => t.id === transitionKey);
      const sourceHandle = existingLayout?.sourceHandle || 'top-right-source';
      const targetHandle = existingLayout?.targetHandle || 'top-left-target';

      const sourceUsed = usedSourceHandles.get(stateId) || new Set<string>();
      const targetUsed = usedTargetHandles.get(stateId) || new Set<string>();

      // Reserve the source handle (outgoing from state)
      sourceUsed.add(sourceHandle);

      // Reserve the corresponding target handle for the source handle
      // (to prevent regular transitions from using it)
      const correspondingTargetForSource = sourceHandleToTargetHandle(sourceHandle);
      targetUsed.add(correspondingTargetForSource);

      // Reserve the target handle (incoming to state)
      targetUsed.add(targetHandle);

      // Reserve the corresponding source handle for the target handle
      // (to prevent regular transitions from using it)
      const correspondingSourceForTarget = targetHandleToSourceHandle(targetHandle);
      sourceUsed.add(correspondingSourceForTarget);

      usedSourceHandles.set(stateId, sourceUsed);
      usedTargetHandles.set(stateId, targetUsed);
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

    // Get ALL available target handles on the target state (not just for one direction)
    const allPossibleTargetHandles = [
      ...getAllTargetHandlesForSide('top'),
      ...getAllTargetHandlesForSide('bottom'),
      ...getAllTargetHandlesForSide('left'),
      ...getAllTargetHandlesForSide('right'),
    ];

    let usedTargets = usedTargetHandles.get(targetStateId) || new Set<string>();

    // Process each incoming transition
    incomingTransitions.forEach((trans) => {
      if (!trans.sourcePos) return;

      const transitionKey = `${trans.sourceStateId}-${trans.index}`;
      const existing = newHandleAssignments.get(transitionKey);
      if (!existing || !existing.sourceHandle) return;

      // Get available target handles
      const availableTargetHandles = allPossibleTargetHandles.filter(h => !usedTargets.has(h));

      let stateTargetHandle: string;
      if (availableTargetHandles.length > 0) {
        // Sort ALL available handles by distance from source handle to target handle
        const sortedAvailableHandles = [...availableTargetHandles].sort((a, b) => {
          const distA = getHandleToHandleDistance(existing.sourceHandle, trans.sourcePos!, a, targetPos, opts.nodeWidth, opts.nodeHeight);
          const distB = getHandleToHandleDistance(existing.sourceHandle, trans.sourcePos!, b, targetPos, opts.nodeWidth, opts.nodeHeight);
          return distA - distB;
        });
        stateTargetHandle = sortedAvailableHandles[0];
      } else {
        // No available handles, reuse the first one
        stateTargetHandle = allPossibleTargetHandles[0];
      }

      usedTargets.add(stateTargetHandle);

      // Reserve corresponding source handle on target state
      const correspondingSourceHandle = targetHandleToSourceHandle(stateTargetHandle);
      const targetStateSourceHandles = usedSourceHandles.get(targetStateId) || new Set<string>();
      targetStateSourceHandles.add(correspondingSourceHandle);
      usedSourceHandles.set(targetStateId, targetStateSourceHandles);

      newHandleAssignments.set(transitionKey, {
        ...existing,
        targetHandle: stateTargetHandle,
      });
    });

    usedTargetHandles.set(targetStateId, usedTargets);
  });

  // console.log('[AutoLayout] Recalculated target handles');

  // STEP 4: Update layout transitions with new handles
  const updatedLayoutTransitions = workflow.layout.transitions.map(layoutTransition => {
    const assignment = newHandleAssignments.get(layoutTransition.id);
    if (!assignment) return layoutTransition;

    return {
      ...layoutTransition,
      sourceHandle: assignment.sourceHandle,
      targetHandle: assignment.targetHandle,
      // Also update legacy handle fields for compatibility
      stateToTransitionSourceHandle: assignment.sourceHandle,
      transitionToStateTargetHandle: assignment.targetHandle,
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

  return updatedWorkflow;
}
