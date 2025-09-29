/**
 * Workflow utility functions for JSON handling and state management
 */

// Comprehensive type definitions based on workflow_schema.json
export interface WorkflowData {
  version: string;
  name: string;
  desc?: string;
  initialState: string;
  active?: boolean;
  states: Record<string, StateData>;
  // Legacy support
  initial_state?: string;
}

export interface StateData {
  transitions: TransitionData[];
}

export interface TransitionData {
  name: string;
  next: string;
  manual: boolean;
  processors?: ProcessorData[];
  criterion?: CriterionData;
}

export interface ProcessorData {
  name: string;
  executionMode: 'SYNC' | 'ASYNC_NEW_TX' | 'ASYNC_SAME_TX';
  config: {
    calculationNodesTags: 'cyoda_application';
    attachEntity?: boolean;
    responseTimeoutMs?: number;
    retryPolicy?: 'FIXED' | 'EXPONENTIAL' | 'LINEAR';
  };
}

export interface CriterionData {
  type: 'function' | 'group' | 'simple';
  // For function type
  function?: {
    name: string;
    config: {
      calculationNodesTags: 'cyoda_application';
      attachEntity?: boolean;
      responseTimeoutMs?: number;
      retryPolicy?: 'FIXED' | 'EXPONENTIAL' | 'LINEAR';
    };
    criterion?: SimpleCriterion | GroupCriterion;
  };
  // For simple type
  jsonPath?: string;
  operation?: 'EQUALS' | 'GREATER_THAN' | 'GREATER_OR_EQUAL' | 'LESS_THAN' | 'LESS_OR_EQUAL' | 'NOT_EQUALS';
  value?: string | number | boolean;
  // For group type
  operator?: 'AND' | 'OR';
  conditions?: SimpleCriterion[];
}

export interface SimpleCriterion {
  type: 'simple';
  jsonPath: string;
  operation: 'EQUALS' | 'GREATER_THAN' | 'GREATER_OR_EQUAL' | 'LESS_THAN' | 'LESS_OR_EQUAL' | 'NOT_EQUALS';
  value: string | number | boolean;
}

export interface GroupCriterion {
  type: 'group';
  operator: 'AND' | 'OR';
  conditions: SimpleCriterion[];
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Safely parse JSON workflow data with legacy support
 */
export function parseWorkflowData(jsonString: string): WorkflowData | null {
  try {
    const parsed = JSON.parse(jsonString);

    // Support both new (initialState) and legacy (initial_state) formats
    const initialState = parsed.initialState || parsed.initial_state || '';

    return {
      version: parsed.version || '1.0',
      name: parsed.name || 'Untitled Workflow',
      desc: parsed.desc,
      initialState,
      initial_state: initialState, // Keep for backward compatibility
      active: parsed.active,
      states: parsed.states || {},
    };
  } catch (e) {
    console.error('Invalid JSON in workflow data:', e);
    return null;
  }
}

/**
 * Comprehensive workflow validation according to workflow_schema.json
 */
export function validateWorkflowSchema(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check if data exists
  if (!data || typeof data !== 'object') {
    errors.push({
      path: 'root',
      message: 'Workflow data must be an object',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  // Required fields validation
  if (!data.version || typeof data.version !== 'string') {
    errors.push({
      path: 'version',
      message: 'Version is required and must be a string',
      severity: 'error'
    });
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push({
      path: 'name',
      message: 'Name is required and must be a string',
      severity: 'error'
    });
  }

  // Check initialState (support both formats)
  const initialState = data.initialState || data.initial_state;
  if (!initialState || typeof initialState !== 'string') {
    errors.push({
      path: 'initialState',
      message: 'initialState is required and must be a string',
      severity: 'error'
    });
  } else if (initialState !== 'initial_state') {
    warnings.push({
      path: 'initialState',
      message: 'initialState should be "initial_state" according to schema',
      severity: 'warning'
    });
  }

  // States validation
  if (!data.states || typeof data.states !== 'object') {
    errors.push({
      path: 'states',
      message: 'States is required and must be an object',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  // Check if initialState exists in states
  if (initialState && !data.states[initialState]) {
    errors.push({
      path: 'initialState',
      message: `Initial state "${initialState}" not found in states`,
      severity: 'error'
    });
  }

  // Validate each state
  for (const [stateName, stateData] of Object.entries(data.states)) {
    validateState(stateName, stateData as any, data.states, errors, warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate individual state
 */
function validateState(
  stateName: string,
  stateData: any,
  allStates: Record<string, any>,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const basePath = `states.${stateName}`;

  if (!stateData || typeof stateData !== 'object') {
    errors.push({
      path: basePath,
      message: 'State data must be an object',
      severity: 'error'
    });
    return;
  }

  // Transitions are required
  if (!Array.isArray(stateData.transitions)) {
    errors.push({
      path: `${basePath}.transitions`,
      message: 'Transitions must be an array',
      severity: 'error'
    });
    return;
  }

  // Validate each transition
  stateData.transitions.forEach((transition: any, index: number) => {
    validateTransition(stateName, transition, index, allStates, errors, warnings);
  });
}

/**
 * Validate individual transition
 */
function validateTransition(
  stateName: string,
  transition: any,
  index: number,
  allStates: Record<string, any>,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const basePath = `states.${stateName}.transitions[${index}]`;

  if (!transition || typeof transition !== 'object') {
    errors.push({
      path: basePath,
      message: 'Transition must be an object',
      severity: 'error'
    });
    return;
  }

  // Required fields
  if (!transition.name || typeof transition.name !== 'string') {
    errors.push({
      path: `${basePath}.name`,
      message: 'Transition name is required and must be a string',
      severity: 'error'
    });
  }

  if (!transition.next || typeof transition.next !== 'string') {
    errors.push({
      path: `${basePath}.next`,
      message: 'Transition next is required and must be a string',
      severity: 'error'
    });
  } else if (!allStates[transition.next]) {
    errors.push({
      path: `${basePath}.next`,
      message: `Target state "${transition.next}" not found`,
      severity: 'error'
    });
  }

  if (typeof transition.manual !== 'boolean') {
    errors.push({
      path: `${basePath}.manual`,
      message: 'Transition manual is required and must be a boolean',
      severity: 'error'
    });
  }

  // Optional: Validate processors
  if (transition.processors) {
    if (!Array.isArray(transition.processors)) {
      errors.push({
        path: `${basePath}.processors`,
        message: 'Processors must be an array',
        severity: 'error'
      });
    } else {
      transition.processors.forEach((processor: any, pIndex: number) => {
        validateProcessor(basePath, processor, pIndex, errors, warnings);
      });
    }
  }

  // Optional: Validate criterion
  if (transition.criterion) {
    validateCriterion(basePath, transition.criterion, errors, warnings);
  }
}

/**
 * Validate processor configuration
 */
function validateProcessor(
  basePath: string,
  processor: any,
  index: number,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const procPath = `${basePath}.processors[${index}]`;

  if (!processor || typeof processor !== 'object') {
    errors.push({
      path: procPath,
      message: 'Processor must be an object',
      severity: 'error'
    });
    return;
  }

  // Required fields
  if (!processor.name || typeof processor.name !== 'string') {
    errors.push({
      path: `${procPath}.name`,
      message: 'Processor name is required and must be a string',
      severity: 'error'
    });
  }

  const validExecutionModes = ['SYNC', 'ASYNC_NEW_TX', 'ASYNC_SAME_TX'];
  if (!processor.executionMode || !validExecutionModes.includes(processor.executionMode)) {
    errors.push({
      path: `${procPath}.executionMode`,
      message: `Processor executionMode must be one of: ${validExecutionModes.join(', ')}`,
      severity: 'error'
    });
  }

  // Config validation
  if (!processor.config || typeof processor.config !== 'object') {
    errors.push({
      path: `${procPath}.config`,
      message: 'Processor config is required and must be an object',
      severity: 'error'
    });
  } else {
    if (processor.config.calculationNodesTags !== 'cyoda_application') {
      errors.push({
        path: `${procPath}.config.calculationNodesTags`,
        message: 'calculationNodesTags must be "cyoda_application"',
        severity: 'error'
      });
    }

    if (processor.config.retryPolicy) {
      const validPolicies = ['FIXED', 'EXPONENTIAL', 'LINEAR'];
      if (!validPolicies.includes(processor.config.retryPolicy)) {
        errors.push({
          path: `${procPath}.config.retryPolicy`,
          message: `retryPolicy must be one of: ${validPolicies.join(', ')}`,
          severity: 'error'
        });
      }
    }
  }
}

/**
 * Validate criterion configuration
 */
function validateCriterion(
  basePath: string,
  criterion: any,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const critPath = `${basePath}.criterion`;

  if (!criterion || typeof criterion !== 'object') {
    errors.push({
      path: critPath,
      message: 'Criterion must be an object',
      severity: 'error'
    });
    return;
  }

  const validTypes = ['function', 'group', 'simple'];
  if (!criterion.type || !validTypes.includes(criterion.type)) {
    errors.push({
      path: `${critPath}.type`,
      message: `Criterion type must be one of: ${validTypes.join(', ')}`,
      severity: 'error'
    });
    return;
  }

  const validOperations = ['EQUALS', 'GREATER_THAN', 'GREATER_OR_EQUAL', 'LESS_THAN', 'LESS_OR_EQUAL', 'NOT_EQUALS'];

  switch (criterion.type) {
    case 'simple':
      if (!criterion.jsonPath || typeof criterion.jsonPath !== 'string') {
        errors.push({
          path: `${critPath}.jsonPath`,
          message: 'Simple criterion requires jsonPath string',
          severity: 'error'
        });
      }
      if (!criterion.operation || !validOperations.includes(criterion.operation)) {
        errors.push({
          path: `${critPath}.operation`,
          message: `Operation must be one of: ${validOperations.join(', ')}`,
          severity: 'error'
        });
      }
      if (criterion.value === undefined) {
        errors.push({
          path: `${critPath}.value`,
          message: 'Simple criterion requires value',
          severity: 'error'
        });
      }
      break;

    case 'group':
      const validOperators = ['AND', 'OR'];
      if (!criterion.operator || !validOperators.includes(criterion.operator)) {
        errors.push({
          path: `${critPath}.operator`,
          message: `Group operator must be one of: ${validOperators.join(', ')}`,
          severity: 'error'
        });
      }
      if (!Array.isArray(criterion.conditions)) {
        errors.push({
          path: `${critPath}.conditions`,
          message: 'Group criterion requires conditions array',
          severity: 'error'
        });
      } else {
        criterion.conditions.forEach((cond: any, idx: number) => {
          if (cond.type !== 'simple') {
            errors.push({
              path: `${critPath}.conditions[${idx}].type`,
              message: 'Group conditions must be of type "simple"',
              severity: 'error'
            });
          }
        });
      }
      break;

    case 'function':
      if (!criterion.function || typeof criterion.function !== 'object') {
        errors.push({
          path: `${critPath}.function`,
          message: 'Function criterion requires function object',
          severity: 'error'
        });
      } else {
        if (!criterion.function.name || typeof criterion.function.name !== 'string') {
          errors.push({
            path: `${critPath}.function.name`,
            message: 'Function name is required',
            severity: 'error'
          });
        }
        if (!criterion.function.config || typeof criterion.function.config !== 'object') {
          errors.push({
            path: `${critPath}.function.config`,
            message: 'Function config is required',
            severity: 'error'
          });
        }
      }
      break;
  }
}

/**
 * Update transition data in workflow
 */
export function updateTransition(
  workflowData: WorkflowData,
  stateName: string,
  transitionIndex: number,
  transitionData: TransitionData
): WorkflowData {
  const updatedData = { ...workflowData };

  if (!updatedData.states[stateName]) {
    console.error('State not found:', stateName);
    return workflowData;
  }

  if (!Array.isArray(updatedData.states[stateName].transitions)) {
    updatedData.states[stateName].transitions = [];
  }

  updatedData.states[stateName].transitions[transitionIndex] = transitionData;

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
  const { states, initialState, initial_state } = workflowData;
  const initState = initialState || initial_state || '';

  const hasSavedPositions = Object.keys(savedPositions).length > 0;

  for (const [stateName, stateData] of Object.entries(states)) {
    const state = stateData as StateData;
    const transitionCount = Array.isArray(state.transitions) ? state.transitions.length : 0;
    const isTerminal = transitionCount === 0;

    const position = hasSavedPositions
      ? savedPositions[stateName] || calculatePosition(stateName, states, initState)
      : calculatePosition(stateName, states, initState);

    result.push({
      id: stateName,
      type: 'default',
      data: {
        label: stateName,
        stateName,
        transitionCount,
        isInitial: stateName === initState,
        isTerminal,
        transitions: state.transitions || [],
      },
      position,
    });
  }

  return result;
}

/**
 * Simple validation check (use validateWorkflowSchema for comprehensive validation)
 */
export function validateWorkflowData(data: any): boolean {
  const result = validateWorkflowSchema(data);
  return result.isValid;
}

/**
 * Get comprehensive workflow statistics
 */
export function getWorkflowStats(workflowData: WorkflowData): {
  totalStates: number;
  totalTransitions: number;
  terminalStates: number;
  conditionalTransitions: number;
  selfLoops: number;
  totalProcessors: number;
  manualTransitions: number;
  automaticTransitions: number;
} {
  const { states } = workflowData;
  let totalTransitions = 0;
  let terminalStates = 0;
  let conditionalTransitions = 0;
  let selfLoops = 0;
  let totalProcessors = 0;
  let manualTransitions = 0;
  let automaticTransitions = 0;

  for (const [stateName, stateData] of Object.entries(states)) {
    const state = stateData as StateData;
    const transitions = Array.isArray(state.transitions) ? state.transitions : [];
    const transitionCount = transitions.length;

    if (transitionCount === 0) {
      terminalStates++;
    }

    totalTransitions += transitionCount;

    transitions.forEach((transition: TransitionData) => {
      // Count processors
      if (transition.processors && Array.isArray(transition.processors)) {
        totalProcessors += transition.processors.length;
      }

      // Count conditional transitions
      if (transition.criterion) {
        conditionalTransitions++;
      }

      // Count self-loops
      if (transition.next === stateName) {
        selfLoops++;
      }

      // Count manual vs automatic
      if (transition.manual) {
        manualTransitions++;
      } else {
        automaticTransitions++;
      }
    });
  }

  return {
    totalStates: Object.keys(states).length,
    totalTransitions,
    terminalStates,
    conditionalTransitions,
    selfLoops,
    totalProcessors,
    manualTransitions,
    automaticTransitions,
  };
}

/**
 * Create a new empty workflow with proper schema structure
 */
export function createEmptyWorkflow(name: string = 'New Workflow'): WorkflowData {
  return {
    version: '1.0',
    name,
    initialState: 'initial_state',
    states: {
      initial_state: {
        transitions: []
      }
    }
  };
}

/**
 * Add a new state to workflow
 */
export function addState(
  workflowData: WorkflowData,
  stateName: string,
  transitions: TransitionData[] = []
): WorkflowData {
  if (workflowData.states[stateName]) {
    console.warn(`State "${stateName}" already exists`);
    return workflowData;
  }

  return {
    ...workflowData,
    states: {
      ...workflowData.states,
      [stateName]: {
        transitions
      }
    }
  };
}

/**
 * Remove a state from workflow
 */
export function removeState(
  workflowData: WorkflowData,
  stateName: string
): WorkflowData {
  if (stateName === workflowData.initialState || stateName === workflowData.initial_state) {
    console.error('Cannot remove initial state');
    return workflowData;
  }

  const newStates = { ...workflowData.states };
  delete newStates[stateName];

  // Remove transitions pointing to this state
  Object.keys(newStates).forEach(key => {
    const state = newStates[key];
    if (Array.isArray(state.transitions)) {
      state.transitions = state.transitions.filter(t => t.next !== stateName);
    }
  });

  return {
    ...workflowData,
    states: newStates
  };
}

/**
 * Add a transition to a state
 */
export function addTransition(
  workflowData: WorkflowData,
  stateName: string,
  transition: TransitionData
): WorkflowData {
  if (!workflowData.states[stateName]) {
    console.error(`State "${stateName}" not found`);
    return workflowData;
  }

  const state = workflowData.states[stateName];
  const transitions = Array.isArray(state.transitions) ? [...state.transitions] : [];
  transitions.push(transition);

  return {
    ...workflowData,
    states: {
      ...workflowData.states,
      [stateName]: {
        ...state,
        transitions
      }
    }
  };
}

/**
 * Remove a transition from a state
 */
export function removeTransition(
  workflowData: WorkflowData,
  stateName: string,
  transitionIndex: number
): WorkflowData {
  if (!workflowData.states[stateName]) {
    console.error(`State "${stateName}" not found`);
    return workflowData;
  }

  const state = workflowData.states[stateName];
  const transitions = Array.isArray(state.transitions) ? [...state.transitions] : [];
  transitions.splice(transitionIndex, 1);

  return {
    ...workflowData,
    states: {
      ...workflowData.states,
      [stateName]: {
        ...state,
        transitions
      }
    }
  };
}
