// ABOUTME: This file contains centralized utilities for managing transition IDs throughout the application.
// It provides a single source of truth for transition ID generation, parsing, and validation.

/**
 * CENTRALIZED TRANSITION ID SYSTEM
 * 
 * This system uses a single, consistent format for transition IDs:
 * Format: "sourceStateId-transitionIndex"
 * 
 * Where:
 * - sourceStateId: The ID of the source state
 * - transitionIndex: The 0-based index of the transition in the source state's transitions array
 * 
 * Examples:
 * - "start-0" = First transition from "start" state
 * - "processing-1" = Second transition from "processing" state
 * - "email-sent-0" = First transition from "email-sent" state (handles hyphens in state names)
 */

/**
 * Generates a transition ID using the canonical format
 * @param sourceStateId The source state ID
 * @param transitionIndex The index of the transition in the source state's transitions array
 * @returns The generated transition ID
 */
export function generateTransitionId(sourceStateId: string, transitionIndex: number): string {
  return `${sourceStateId}-${transitionIndex}`;
}

/**
 * Parses a transition ID to extract source state ID and transition index
 * @param transitionId The transition ID to parse
 * @returns Object containing sourceStateId and transitionIndex, or null if parsing fails
 */
export function parseTransitionId(transitionId: string): { sourceStateId: string; transitionIndex: number } | null {
  const lastHyphenIndex = transitionId.lastIndexOf('-');
  if (lastHyphenIndex > 0) {
    const sourceStateId = transitionId.substring(0, lastHyphenIndex);
    const indexStr = transitionId.substring(lastHyphenIndex + 1);
    const transitionIndex = parseInt(indexStr, 10);
    
    // Validate that we have a valid state ID and numeric index
    if (sourceStateId && !isNaN(transitionIndex) && transitionIndex >= 0) {
      return { sourceStateId, transitionIndex };
    }
  }
  
  return null;
}

/**
 * Generates a layout transition ID for backward compatibility with existing layout data
 * Format: "sourceStateId-to-targetStateId"
 * @param sourceStateId The source state ID
 * @param targetStateId The target state ID
 * @returns The generated layout transition ID
 */
export function generateLayoutTransitionId(sourceStateId: string, targetStateId: string): string {
  return `${sourceStateId}-to-${targetStateId}`;
}

/**
 * Parses a layout transition ID to extract source and target state IDs
 * @param layoutTransitionId The layout transition ID to parse
 * @returns Object containing sourceStateId and targetStateId, or null if parsing fails
 */
export function parseLayoutTransitionId(layoutTransitionId: string): { sourceStateId: string; targetStateId: string } | null {
  const toIndex = layoutTransitionId.indexOf('-to-');
  if (toIndex !== -1) {
    const sourceStateId = layoutTransitionId.substring(0, toIndex);
    const targetStateId = layoutTransitionId.substring(toIndex + 4); // +4 for '-to-'
    
    // Basic validation - state IDs shouldn't be empty
    if (sourceStateId && targetStateId) {
      return { sourceStateId, targetStateId };
    }
  }
  
  return null;
}

/**
 * Validates that a transition exists in the workflow configuration
 * @param transitionId The transition ID to validate
 * @param workflowStates The workflow states configuration
 * @returns true if the transition exists
 */
export function validateTransitionExists(transitionId: string, workflowStates: Record<string, any>): boolean {
  const parsed = parseTransitionId(transitionId);
  if (!parsed) {
    return false;
  }

  const { sourceStateId, transitionIndex } = parsed;
  const sourceState = workflowStates[sourceStateId];

  return !!(sourceState &&
           sourceState.transitions &&
           Array.isArray(sourceState.transitions) &&
           transitionIndex < sourceState.transitions.length);
}

/**
 * Validates that both source and target states exist for a layout transition ID
 * @param layoutTransitionId The layout transition ID (format: "sourceState-to-targetState")
 * @param stateIds Set of valid state IDs
 * @returns true if both source and target states exist
 */
export function validateTransitionStates(layoutTransitionId: string, stateIds: Set<string>): boolean {
  const parsed = parseLayoutTransitionId(layoutTransitionId);
  if (!parsed) {
    return false;
  }

  const { sourceStateId, targetStateId } = parsed;
  return stateIds.has(sourceStateId) && stateIds.has(targetStateId);
}

/**
 * Gets a transition definition from the workflow configuration
 * @param transitionId The transition ID
 * @param workflowStates The workflow states configuration
 * @returns The transition definition or null if not found
 */
export function getTransitionDefinition(transitionId: string, workflowStates: Record<string, any>): any | null {
  const parsed = parseTransitionId(transitionId);
  if (!parsed) {
    return null;
  }
  
  const { sourceStateId, transitionIndex } = parsed;
  const sourceState = workflowStates[sourceStateId];
  
  if (sourceState && sourceState.transitions && Array.isArray(sourceState.transitions)) {
    return sourceState.transitions[transitionIndex] || null;
  }
  
  return null;
}

/**
 * Creates a transition ID from a source state and target state by finding the matching transition
 * @param sourceStateId The source state ID
 * @param targetStateId The target state ID
 * @param workflowStates The workflow states configuration
 * @returns The transition ID or null if no matching transition found
 */
export function findTransitionId(sourceStateId: string, targetStateId: string, workflowStates: Record<string, any>): string | null {
  const sourceState = workflowStates[sourceStateId];
  if (!sourceState || !sourceState.transitions || !Array.isArray(sourceState.transitions)) {
    return null;
  }
  
  const transitionIndex = sourceState.transitions.findIndex((transition: any) => transition.next === targetStateId);
  if (transitionIndex >= 0) {
    return generateTransitionId(sourceStateId, transitionIndex);
  }
  
  return null;
}

/**
 * Migrates old layout transition IDs to the new canonical format
 * @param layoutTransitionId The old layout transition ID (sourceState-to-targetState)
 * @param workflowStates The workflow states configuration
 * @returns The new canonical transition ID or null if migration fails
 */
export function migrateLayoutTransitionId(layoutTransitionId: string, workflowStates: Record<string, any>): string | null {
  const parsed = parseLayoutTransitionId(layoutTransitionId);
  if (!parsed) {
    return null;
  }
  
  const { sourceStateId, targetStateId } = parsed;
  return findTransitionId(sourceStateId, targetStateId, workflowStates);
}
