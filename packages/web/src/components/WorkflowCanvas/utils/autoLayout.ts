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
  rankSeparation: 380, // Vertical spacing between ranks (increased from 280 for better separation of transition nodes)
  nodeSeparation: 600, // Horizontal spacing between nodes in same rank (increased from 550 for better separation)
  edgeSeparation: 100, // Spacing between parallel edges
  minTransitionLength: 150, // Minimum vertical distance for transition nodes
  minTransitionWidth: 100, // Minimum horizontal distance for transition nodes
  direction: 'TB', // Top to Bottom
};

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

        console.log(`  📌 State ${stateId} (rank ${rank}): x=${x}, y=${y}`);

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

          // Position transition nodes at 40% horizontally (closer to source), 50% vertically (centered)
          const ratioX = 0.4;
          const ratioY = 0.5;
          let midX = sourceCenterX + (targetCenterX - sourceCenterX) * ratioX;
          let midY = sourceCenterY + (targetCenterY - sourceCenterY) * ratioY;

          if (isBidirectional) {
            // For bidirectional transitions, use simple offset from the midpoint
            const dx = targetCenterX - sourceCenterX;
            const dy = targetCenterY - sourceCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
              // Determine if the line is more horizontal or vertical
              const isHorizontal = Math.abs(dx) > Math.abs(dy);

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

              console.log(`🔄 Bidirectional transition ${sourceStateId} -> ${transition.next}:`, {
                isHorizontal,
                isFirstInPair,
                offsetDirection,
                midX,
                midY,
              });

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

              console.log(`  After offset: midX=${midX}, midY=${midY}`);
            }
          } else {
            // For non-bidirectional transitions, apply the standard positioning logic
            if (opts.direction === 'TB' || opts.direction === 'BT') {
              // Top-to-Bottom or Bottom-to-Top: offset horizontally for parallel edges
              midX += parallelOffset;
              midY += verticalSpacing;

              // Ensure minimum vertical distance
              if (verticalDistance < opts.minTransitionLength) {
                midY = sourcePos.y - opts.minTransitionLength + (transitionIndex - (totalTransitions - 1) / 2) * opts.edgeSeparation;
              }

              // Ensure minimum horizontal distance
              if (horizontalDistance < opts.minTransitionWidth) {
                const direction = targetPos.x > sourcePos.x ? 1 : -1;
                midX = sourcePos.x + (direction * opts.minTransitionWidth) + parallelOffset;
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

          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;

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
              // Use left/right handles for separation
              if (dy > 0) {
                // Target is below
                if (isFirstInPair) {
                  handles.stateToTransitionSourceHandle = 'bottom-right-source';
                  handles.stateToTransitionTargetHandle = 'top-right-target';
                  handles.transitionToStateSourceHandle = 'bottom-right-source';
                  handles.transitionToStateTargetHandle = 'top-right-target';
                } else {
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

            console.log(`🎯 Handles for ${sourceStateId} -> ${transition.next}:`, handles);
          } else {
            // Non-bidirectional transition
            // Use rank-based alternating handle strategy for LR layout
            const sourceRank = ranks.get(sourceStateId) || 0;
            const targetRank = ranks.get(transition.next) || 0;

            // Determine if we're in LR or TB layout
            const isHorizontal = Math.abs(dx) > Math.abs(dy);

            if (isHorizontal) {
              // LR layout: alternate between vertical and horizontal handles based on rank
              // IMPORTANT: Transition nodes ALWAYS use left entry and right exit
              // Even rank (0, 2, 4...): vertical exit → horizontal entry
              // Odd rank (1, 3, 5...): horizontal exit → vertical entry
              const useVerticalExit = sourceRank % 2 === 0;

              if (useVerticalExit) {
                // Vertical exit from source state, horizontal entry to target state
                // State -> Transition: top/bottom of state → LEFT of transition (always)
                // Transition -> State: RIGHT of transition (always) → left of state
                const verticalHandle = dy > 0 ? 'bottom-center-source' : 'top-center-source';
                handles.stateToTransitionSourceHandle = verticalHandle;
                handles.stateToTransitionTargetHandle = 'left-top-target';
                handles.transitionToStateSourceHandle = 'right-top-source';
                handles.transitionToStateTargetHandle = 'left-top-target';
              } else {
                // Horizontal exit from source state, vertical entry to target state
                // State -> Transition: right of state → LEFT of transition (always)
                // Transition -> State: RIGHT of transition (always) → top/bottom of state
                const horizontalHandle = dx > 0 ? 'right-top-source' : 'left-top-source';
                const verticalTargetHandle = dy > 0 ? 'top-center-target' : 'bottom-center-target';
                handles.stateToTransitionSourceHandle = horizontalHandle;
                handles.stateToTransitionTargetHandle = 'left-top-target';
                handles.transitionToStateSourceHandle = 'right-top-source';
                handles.transitionToStateTargetHandle = verticalTargetHandle;
              }
            } else {
              // TB layout: use top/bottom center handles for cleaner routing
              if (dy > 0) {
                // Target is below - use bottom-center on source, top-center on target
                handles.stateToTransitionSourceHandle = 'bottom-center-source';
                handles.stateToTransitionTargetHandle = 'top-center-target';
                handles.transitionToStateSourceHandle = 'bottom-center-source';
                handles.transitionToStateTargetHandle = 'top-center-target';
              } else {
                // Target is above - use top-center on source, bottom-center on target
                handles.stateToTransitionSourceHandle = 'top-center-source';
                handles.stateToTransitionTargetHandle = 'bottom-center-target';
                handles.transitionToStateSourceHandle = 'top-center-source';
                handles.transitionToStateTargetHandle = 'bottom-center-target';
              }
            }

            console.log(`🎯 Handles for non-bidirectional ${sourceStateId} (rank ${sourceRank}) -> ${transition.next} (rank ${targetRank}):`, handles);
          }

          const transitionPosition = {
            x: midX - transitionWidth / 2,
            y: midY - transitionHeight / 2,
          };

          console.log(`📍 Transition ${sourceStateId} -> ${transition.next}:`, {
            sourcePos,
            targetPos,
            sourceCenter: { x: sourceCenterX, y: sourceCenterY },
            targetCenter: { x: targetCenterX, y: targetCenterY },
            midX,
            midY,
            transitionPosition,
            transitionWidth,
            transitionHeight,
            calculatedCenter: { x: transitionPosition.x + transitionWidth / 2, y: transitionPosition.y + transitionHeight / 2 },
            dx: targetCenterX - sourceCenterX,
            dy: targetCenterY - sourceCenterY,
          });

          transitions.push({
            id: transitionId,
            position: transitionPosition,
            ...handles,
          });
        }
      }
    });
  });

  return { states, transitions };
}

/**
 * Applies the calculated layout to a workflow by updating state positions.
 *
 * @param workflow - The workflow to update
 * @param layoutResult - The layout result from calculateAutoLayout
 * @returns Updated workflow with new state positions
 */
export function applyLayoutToWorkflow(
  workflow: UIWorkflowData,
  layoutResult: LayoutResult
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
  return applyLayoutToWorkflow(workflow, layoutResult);
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
