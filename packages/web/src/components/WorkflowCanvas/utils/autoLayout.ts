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
  const transitionWidth = 80;
  const transitionHeight = 40;

  // Track transitions between each pair of states
  const transitionsByPair = new Map<string, Array<{ sourceStateId: string; index: number }>>();

  Object.entries(workflow.configuration.states).forEach(([sourceStateId, stateDefinition]) => {
    stateDefinition.transitions.forEach((transition, index) => {
      const key = `${sourceStateId}-${transition.next}`;
      if (!transitionsByPair.has(key)) {
        transitionsByPair.set(key, []);
      }
      transitionsByPair.get(key)!.push({ sourceStateId, index });
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

          const verticalDistance = Math.abs(targetPos.y - sourcePos.y);
          const horizontalDistance = Math.abs(targetPos.x - sourcePos.x);

          // Calculate offsets for parallel transitions based on direction
          // Larger offset to prevent overlapping (100px per transition)
          const parallelOffset = (transitionIndex - (totalTransitions - 1) / 2) * 100;
          // Vertical spacing between parallel transitions (80px per transition)
          const verticalSpacing = (transitionIndex - (totalTransitions - 1) / 2) * 80;

          let midX = (sourcePos.x + targetPos.x) / 2;
          let midY = (sourcePos.y + targetPos.y) / 2;

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

            // Ensure minimum horizontal distance
            if (horizontalDistance < opts.minTransitionLength) {
              midX = sourcePos.x - opts.minTransitionLength + (transitionIndex - (totalTransitions - 1) / 2) * opts.edgeSeparation;
            }

            // Ensure minimum vertical distance
            if (verticalDistance < opts.minTransitionWidth) {
              const direction = targetPos.y > sourcePos.y ? 1 : -1;
              midY = sourcePos.y + (direction * opts.minTransitionWidth) + parallelOffset;
            }
          }

          transitions.push({
            id: transitionId,
            position: {
              x: midX - transitionWidth / 2,
              y: midY - transitionHeight / 2,
            },
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
  const updatedTransitions = updatedLayout.transitions.map(layoutTransition => {
    const newPosition = layoutResult.transitions?.find(t => t.id === layoutTransition.id);
    if (newPosition) {
      return {
        ...layoutTransition,
        position: newPosition.position,
      };
    }
    return layoutTransition;
  });

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
