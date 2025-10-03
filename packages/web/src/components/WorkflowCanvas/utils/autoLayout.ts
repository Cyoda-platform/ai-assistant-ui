// ABOUTME: This file provides automatic layout functionality using Dagre algorithm
// to arrange workflow states in a hierarchical, visually organized manner.

import dagre from '@dagrejs/dagre';
import type { UIWorkflowData, UIStateData, UITransitionData } from '../types/workflow';

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  rankSeparation?: number;
  nodeSeparation?: number;
  edgeSeparation?: number;
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
  rankSeparation: 400, // MUCH larger vertical spacing to account for transition nodes between states (was 250)
  nodeSeparation: 300, // MUCH larger horizontal spacing to prevent overlap (was 200)
  edgeSeparation: 80,  // Larger spacing between parallel edges (was 60)
  direction: 'TB', // Top to Bottom
};

/**
 * Calculates optimal positions for workflow states using Dagre hierarchical layout algorithm.
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

  // Create a new directed graph
  const graph = new dagre.graphlib.Graph();

  // Set graph properties
  graph.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSeparation,
    nodesep: opts.nodeSeparation,
    edgesep: opts.edgeSeparation,
  });

  // Set default edge label
  graph.setDefaultEdgeLabel(() => ({}));

  // Add nodes (states) to the graph
  const stateIds = Object.keys(workflow.configuration.states);
  stateIds.forEach(stateId => {
    graph.setNode(stateId, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
  });

  // Add phantom nodes for loopback transitions so Dagre accounts for them
  const loopbackTransitions: Array<{ stateId: string; transitionId: string; index: number }> = [];
  Object.entries(workflow.configuration.states).forEach(([stateId, stateDefinition]) => {
    stateDefinition.transitions.forEach((transition, index) => {
      const isLoopback = stateId === transition.next;
      if (isLoopback) {
        const phantomId = `phantom-loopback-${stateId}-${index}`;
        loopbackTransitions.push({ stateId, transitionId: phantomId, index });

        // Add phantom node for the loopback transition
        // Position it to the right and up from the state
        graph.setNode(phantomId, {
          width: 80,  // Smaller width for transition node
          height: 40, // Smaller height for transition node
        });

        // Add edges to create the loop through the phantom node
        graph.setEdge(stateId, phantomId);
        graph.setEdge(phantomId, stateId);
      }
    });
  });

  // Add edges (transitions) to the graph
  // Transitions are stored within each state's definition, not as a separate array
  Object.entries(workflow.configuration.states).forEach(([stateId, stateDefinition]) => {
    stateDefinition.transitions.forEach(transition => {
      const isLoopback = stateId === transition.next;
      // Skip loopback transitions as they're handled by phantom nodes
      if (!isLoopback) {
        // Ensure both source and target states exist
        if (workflow.configuration.states[stateId] &&
            workflow.configuration.states[transition.next]) {
          graph.setEdge(stateId, transition.next);
        }
      }
    });
  });

  // Run the layout algorithm
  dagre.layout(graph);

  // Extract the calculated positions
  const states = stateIds.map(stateId => {
    const node = graph.node(stateId);
    return {
      id: stateId,
      position: {
        // Dagre returns center positions, but React Flow expects top-left positions
        x: node.x - opts.nodeWidth / 2,
        y: node.y - opts.nodeHeight / 2,
      },
    };
  });

  // Calculate transition node positions
  const transitions: Array<{ id: string; position: { x: number; y: number } }> = [];

  Object.entries(workflow.configuration.states).forEach(([sourceStateId, stateDefinition]) => {
    stateDefinition.transitions.forEach((transition, index) => {
      const sourceNode = graph.node(sourceStateId);
      const targetNode = graph.node(transition.next);

      if (sourceNode && targetNode) {
        const isLoopback = sourceStateId === transition.next;
        const transitionId = `${sourceStateId}-${index}`;

        if (isLoopback) {
          // For loopback, use the phantom node position calculated by Dagre
          const phantomId = `phantom-loopback-${sourceStateId}-${index}`;
          const phantomNode = graph.node(phantomId);

          if (phantomNode) {
            // Use Dagre's calculated position for the phantom node
            transitions.push({
              id: transitionId,
              position: {
                x: phantomNode.x - 40, // Center the transition node (width 80 / 2)
                y: phantomNode.y - 20, // Center the transition node (height 40 / 2)
              },
            });
          } else {
            // Fallback if phantom node not found
            transitions.push({
              id: transitionId,
              position: {
                x: sourceNode.x + 150,
                y: sourceNode.y - 80,
              },
            });
          }
        } else {
          // For regular transitions, position midway between source and target
          // Transition nodes are smaller (80x40), so center them properly
          const transitionWidth = 80;
          const transitionHeight = 40;

          transitions.push({
            id: transitionId,
            position: {
              x: (sourceNode.x + targetNode.x) / 2 - transitionWidth / 2,
              y: (sourceNode.y + targetNode.y) / 2 - transitionHeight / 2,
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
