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
    position: { x: number; y: number };
    // Handle information for bidirectional transitions
    stateToTransitionSourceHandle?: string;
    stateToTransitionTargetHandle?: string;
    transitionToStateSourceHandle?: string;
    transitionToStateTargetHandle?: string;
  }>;
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  nodeWidth: 200,      // State node width (actual visual width ~180px)
  nodeHeight: 100,     // State node height (actual visual height ~80px)
  rankSeparation: 500, // Vertical spacing between ranks (increased for better separation in TB layout)
  nodeSeparation: 500, // Horizontal spacing between nodes in same rank
  edgeSeparation: 100, // Spacing between parallel edges
  minTransitionLength: 150, // Minimum vertical distance for transition nodes
  minTransitionWidth: 100, // Minimum horizontal distance for transition nodes
  direction: 'TB', // Top to Bottom
};

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
 * Returns the first available handle, or reuses a handle if all are taken.
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

  // Try to find an unused handle from preferred list
  for (const handle of preferredHandles) {
    // Check if this handle is already used
    if (usedSame.has(handle)) {
      continue;
    }

    // Check if the opposite type handle at the EXACT SAME POSITION is used
    // E.g., if "left-top-target" is used, block "left-top-source", but allow "left-bottom-source"
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

  // All preferred handles are used, return the first one (will reuse)
  return preferredHandles[0];
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
  // For both TB and LR: rankSeparation controls spacing along main axis (should be larger)
  // nodeSeparation controls spacing along cross axis (should be smaller)
  if (!options.rankSeparation) opts.rankSeparation = 600; // Spacing between ranks (main axis)
  if (!options.nodeSeparation) opts.nodeSeparation = 500; // Spacing between nodes in same rank (cross axis)
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

  // Calculate positions based on ranks
  const states: Array<{ id: string; position: { x: number; y: number } }> = [];
  const statePositions = new Map<string, { x: number; y: number }>();

  // Sort ranks
  const sortedRanks = Array.from(statesByRank.keys()).sort((a, b) => a - b);

  sortedRanks.forEach(rank => {
    const statesInRank = statesByRank.get(rank) || [];

    let x: number;
    let y: number;

    if (opts.direction === 'TB' || opts.direction === 'BT') {
      // Top-to-Bottom or Bottom-to-Top: ranks go vertically
      const rankY = 100 + rank * opts.rankSeparation;
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
      const rankX = 100 + rank * opts.rankSeparation;
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
  const transitions: Array<{ id: string; position: { x: number; y: number } }> = [];
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

  Object.entries(workflow.configuration.states).forEach(([sourceStateId, stateDefinition]) => {
    stateDefinition.transitions.forEach((transition, index) => {
      const key = `${sourceStateId}-${transition.next}`;
      const reverseKey = `${transition.next}-${sourceStateId}`;

      if (!transitionsByPair.has(key)) {
        transitionsByPair.set(key, []);
      }
      transitionsByPair.get(key)!.push({ sourceStateId, index });

      // Check if reverse transition exists
      const reverseStateDefinition = workflow.configuration.states[transition.next];
      if (reverseStateDefinition?.transitions.some(t => t.next === sourceStateId)) {
        const canonicalKey = [sourceStateId, transition.next].sort().join('-');
        bidirectionalPairs.add(canonicalKey);
      }
    });
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
          transitions.push({
            id: transitionId,
            position: {
              x: sourcePos.x + 150,
              y: sourcePos.y - 100,
            },
          });
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
              // For Left-Right layout: use rank-based horizontal offset
              const sourceRank = ranks.get(sourceStateId) || 0;
              const horizontalOffset = 80;
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
              usedSourceHandles.get(sourceStateId)?.add(handles.stateToTransitionSourceHandle);
            }
            if (handles.transitionToStateTargetHandle) {
              usedTargetHandles.get(transition.next)?.add(handles.transitionToStateTargetHandle);
            }
          } else {
            // Non-bidirectional transition
            // Use rank-based alternating handle strategy for LR layout
            const sourceRank = ranks.get(sourceStateId) || 0;
            const targetRank = ranks.get(transition.next) || 0;

            // Determine if we're in LR or TB layout based on which direction is PRIMARY
            // For TB layout: dy is primary direction (vertical movement is larger)
            // For LR layout: dx is primary direction (horizontal movement is larger)
            const isVertical = Math.abs(dy) > Math.abs(dx);


            if (!isVertical) {
              // LR layout: ALWAYS use horizontal handles (right/left)
              // Choose handles based on VERTICAL direction (dy) to avoid crossing

              let preferredSourceHandles: string[];
              let preferredTargetHandles: string[];

              // Choose handles based on vertical direction (dy)
              const isVerticalTransition = Math.abs(dy) < 50;

              if (dx > 0) {
                // Target is to the right
                if (isVerticalTransition) {
                  // Horizontal transition (dy ≈ 0) - prefer center handles
                  preferredSourceHandles = ['right-top-source', 'right-bottom-source', 'bottom-center-source', 'top-center-source'];
                  preferredTargetHandles = ['left-top-target', 'left-bottom-target', 'top-center-target', 'bottom-center-target'];
                } else if (dy < 0) {
                  // Target is above - prefer top handles
                  preferredSourceHandles = ['right-top-source', 'top-right-source', 'top-center-source', 'right-bottom-source', 'top-left-source'];
                  preferredTargetHandles = ['left-bottom-target', 'bottom-left-target', 'bottom-center-target', 'left-top-target', 'bottom-right-target'];
                } else {
                  // Target is below - prefer bottom handles
                  preferredSourceHandles = ['right-bottom-source', 'bottom-right-source', 'bottom-center-source', 'right-top-source', 'bottom-left-source'];
                  preferredTargetHandles = ['left-top-target', 'top-left-target', 'top-center-target', 'left-bottom-target', 'top-right-target'];
                }
              } else {
                // Target is to the left
                if (isVerticalTransition) {
                  // Horizontal transition (dy ≈ 0) - prefer center handles
                  preferredSourceHandles = ['left-top-source', 'left-bottom-source', 'bottom-center-source', 'top-center-source'];
                  preferredTargetHandles = ['right-top-target', 'right-bottom-target', 'top-center-target', 'bottom-center-target'];
                } else if (dy < 0) {
                  // Target is above - prefer top handles
                  preferredSourceHandles = ['left-top-source', 'top-left-source', 'top-center-source', 'left-bottom-source', 'top-right-source'];
                  preferredTargetHandles = ['right-bottom-target', 'bottom-right-target', 'bottom-center-target', 'right-top-target', 'bottom-left-target'];
                } else {
                  // Target is below - prefer bottom handles
                  preferredSourceHandles = ['left-bottom-source', 'bottom-left-source', 'bottom-center-source', 'left-top-source', 'bottom-right-source'];
                  preferredTargetHandles = ['right-top-target', 'top-right-target', 'top-center-target', 'right-bottom-target', 'top-left-target'];
                }
              }

              // Find available handles
              const stateSourceHandle = findAvailableHandle(sourceStateId, usedSourceHandles, usedTargetHandles, preferredSourceHandles, true);
              const stateTargetHandle = findAvailableHandle(transition.next, usedSourceHandles, usedTargetHandles, preferredTargetHandles, false);

              // For transition node, use same direction as state handles
              const transitionTargetHandle = dx > 0 ? 'left-top-target' : 'right-top-target';
              const transitionSourceHandle = dx > 0 ? 'right-top-source' : 'left-top-source';


              handles.stateToTransitionSourceHandle = stateSourceHandle;
              handles.stateToTransitionTargetHandle = transitionTargetHandle;
              handles.transitionToStateSourceHandle = transitionSourceHandle;
              handles.transitionToStateTargetHandle = stateTargetHandle;

              // Mark handles as used
              usedSourceHandles.get(sourceStateId)?.add(stateSourceHandle);
              usedTargetHandles.get(transition.next)?.add(stateTargetHandle);
            } else {
              // TB layout: prefer vertical handles, but distribute based on horizontal direction
              if (dy > 0) {
                // Target is below - prefer bottom handles on source, top handles on target
                // Choose handle based on horizontal direction (dx)
                let preferredSourceHandles: string[];
                let preferredTargetHandles: string[];

                if (Math.abs(dx) < 50) {
                  // Vertical transition (dx ≈ 0) - prefer center handles
                  preferredSourceHandles = ['bottom-center-source', 'bottom-left-source', 'bottom-right-source'];
                  preferredTargetHandles = ['top-center-target', 'top-left-target', 'top-right-target'];
                } else if (dx < 0) {
                  // Target is to the left - prefer left handles
                  preferredSourceHandles = ['bottom-left-source', 'bottom-center-source', 'bottom-right-source'];
                  preferredTargetHandles = ['top-right-target', 'top-center-target', 'top-left-target'];
                } else {
                  // Target is to the right - prefer right handles
                  preferredSourceHandles = ['bottom-right-source', 'bottom-center-source', 'bottom-left-source'];
                  preferredTargetHandles = ['top-left-target', 'top-center-target', 'top-right-target'];
                }

                const stateSourceHandle = findAvailableHandle(sourceStateId, usedSourceHandles, usedTargetHandles, preferredSourceHandles, true);
                const stateTargetHandle = findAvailableHandle(transition.next, usedSourceHandles, usedTargetHandles, preferredTargetHandles, false);

                handles.stateToTransitionSourceHandle = stateSourceHandle;
                handles.stateToTransitionTargetHandle = 'top-center-target';
                handles.transitionToStateSourceHandle = 'bottom-center-source';
                handles.transitionToStateTargetHandle = stateTargetHandle;

                // Mark handles as used
                usedSourceHandles.get(sourceStateId)?.add(stateSourceHandle);
                usedTargetHandles.get(transition.next)?.add(stateTargetHandle);
              } else {
                // Target is above - prefer top handles on source, bottom handles on target
                const preferredSourceHandles = ['top-center-source', 'top-left-source', 'top-right-source'];
                const preferredTargetHandles = ['bottom-center-target', 'bottom-left-target', 'bottom-right-target'];

                const stateSourceHandle = findAvailableHandle(sourceStateId, usedSourceHandles, usedTargetHandles, preferredSourceHandles, true);
                const stateTargetHandle = findAvailableHandle(transition.next, usedSourceHandles, usedTargetHandles, preferredTargetHandles, false);

                handles.stateToTransitionSourceHandle = stateSourceHandle;
                handles.stateToTransitionTargetHandle = 'bottom-center-target';
                handles.transitionToStateSourceHandle = 'top-center-source';
                handles.transitionToStateTargetHandle = stateTargetHandle;

                // Mark handles as used
                usedSourceHandles.get(sourceStateId)?.add(stateSourceHandle);
                usedTargetHandles.get(transition.next)?.add(stateTargetHandle);
              }
            }
          }

          const transitionPosition = {
            x: midX - transitionWidth / 2,
            y: midY - transitionHeight / 2,
          };


          transitions.push({
            id: transitionId,
            position: transitionPosition,
            ...handles,
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
    updatedTransitions = layoutResult.transitions.map(t => ({
      id: t.id,
      position: t.position,
      // Include handle information for bidirectional transitions
      stateToTransitionSourceHandle: t.stateToTransitionSourceHandle,
      stateToTransitionTargetHandle: t.stateToTransitionTargetHandle,
      transitionToStateSourceHandle: t.transitionToStateSourceHandle,
      transitionToStateTargetHandle: t.transitionToStateTargetHandle,
    }));
  } else {
    // Update existing transitions
    updatedTransitions = updatedLayout.transitions.map(layoutTransition => {
      const newPosition = layoutResult.transitions?.find(t => t.id === layoutTransition.id);
      if (newPosition) {
        return {
          ...layoutTransition,
          position: newPosition.position,
          // Include handle information for bidirectional transitions
          stateToTransitionSourceHandle: newPosition.stateToTransitionSourceHandle,
          stateToTransitionTargetHandle: newPosition.stateToTransitionTargetHandle,
          transitionToStateSourceHandle: newPosition.transitionToStateSourceHandle,
          transitionToStateTargetHandle: newPosition.transitionToStateTargetHandle,
        };
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
      direction: options.direction, // Save layout direction
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
