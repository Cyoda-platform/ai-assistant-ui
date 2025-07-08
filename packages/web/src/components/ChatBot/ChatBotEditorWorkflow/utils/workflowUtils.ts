/**
 * Workflow utility functions for JSON handling and state management
 */

export interface WorkflowData {
  states: Record<string, any>;
  initial_state: string;
}

export interface TransitionData {
  next: string;
  condition?: string;
  [key: string]: any;
}

export interface StateData {
  transitions: Record<string, TransitionData>;
  [key: string]: any;
}

/**
 * Safely parse JSON workflow data
 */
export function parseWorkflowData(jsonString: string): WorkflowData | null {
  try {
    const parsed = JSON.parse(jsonString);
    return {
      states: parsed.states || {},
      initial_state: parsed.initial_state || '',
    };
  } catch (e) {
    console.error('Invalid JSON in workflow data:', e);
    return null;
  }
}

/**
 * Update transition data in workflow
 */
export function updateTransition(
  workflowData: WorkflowData,
  stateName: string,
  transitionName: string,
  transitionData: TransitionData
): WorkflowData {
  const updatedData = { ...workflowData };
  
  if (!updatedData.states[stateName]) {
    console.error('State not found:', stateName);
    return workflowData;
  }

  if (!updatedData.states[stateName].transitions) {
    updatedData.states[stateName].transitions = {};
  }

  updatedData.states[stateName].transitions[transitionName] = transitionData;
  
  return updatedData;
}

/**
 * Generate workflow nodes from parsed data
 */
export function generateWorkflowNodes(
  workflowData: WorkflowData,
  savedPositions: Record<string, { x: number; y: number }>,
  calculatePosition: (stateName: string, states: any, initialState: string) => { x: number; y: number }
): any[] {
  const result: any[] = [];
  const { states, initial_state } = workflowData;
  
  // Check if we have saved positions
  const hasSavedPositions = Object.keys(savedPositions).length > 0;

  for (const [stateName, stateData] of Object.entries(states)) {
    const state = stateData as StateData;
    const transitionCount = Object.keys(state.transitions || {}).length;
    const isTerminal = transitionCount === 0;

    // Use saved positions if available, otherwise calculate smart layout
    const position = hasSavedPositions 
      ? savedPositions[stateName] || calculatePosition(stateName, states, initial_state)
      : calculatePosition(stateName, states, initial_state);

    result.push({
      id: stateName,
      type: 'default',
      data: {
        label: stateName,
        stateName,
        transitionCount,
        isInitial: stateName === initial_state,
        isTerminal,
      },
      position,
    });
  }

  return result;
}

/**
 * Validate workflow data structure
 */
export function validateWorkflowData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!data.states || typeof data.states !== 'object') return false;
  if (!data.initial_state || typeof data.initial_state !== 'string') return false;
  
  // Check if initial state exists in states
  if (!data.states[data.initial_state]) return false;
  
  // Validate state structure
  for (const [stateName, stateData] of Object.entries(data.states)) {
    const state = stateData as any;
    if (state.transitions && typeof state.transitions !== 'object') return false;
    
    // Validate transitions
    if (state.transitions) {
      for (const [transitionName, transitionData] of Object.entries(state.transitions)) {
        const transition = transitionData as any;
        if (!transition.next || typeof transition.next !== 'string') return false;
        
        // Check if target state exists
        if (!data.states[transition.next]) return false;
      }
    }
  }
  
  return true;
}

/**
 * Get workflow statistics
 */
export function getWorkflowStats(workflowData: WorkflowData): {
  totalStates: number;
  totalTransitions: number;
  terminalStates: number;
  conditionalTransitions: number;
  selfLoops: number;
} {
  const { states } = workflowData;
  let totalTransitions = 0;
  let terminalStates = 0;
  let conditionalTransitions = 0;
  let selfLoops = 0;

  for (const [stateName, stateData] of Object.entries(states)) {
    const state = stateData as StateData;
    const transitions = state.transitions || {};
    const transitionCount = Object.keys(transitions).length;
    
    if (transitionCount === 0) {
      terminalStates++;
    }
    
    totalTransitions += transitionCount;
    
    for (const [transitionName, transitionData] of Object.entries(transitions)) {
      if (transitionData.condition) {
        conditionalTransitions++;
      }
      
      if (transitionData.next === stateName) {
        selfLoops++;
      }
    }
  }

  return {
    totalStates: Object.keys(states).length,
    totalTransitions,
    terminalStates,
    conditionalTransitions,
    selfLoops,
  };
}
