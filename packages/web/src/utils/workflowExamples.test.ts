import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateSimpleWorkflowExample,
  generateSimpleRegistrationWorkflow,
  generateSimpleApprovalWorkflow,
  getRandomExampleWorkflow,
  generateWorkflowExplanation,
  exampleWorkflowToStorageFormat,
  isWorkflowExampleRequest,
  type ExampleWorkflowData,
} from './workflowExamples';

describe('workflowExamples', () => {
  describe('generateSimpleWorkflowExample', () => {
    it('should generate a simple 3-state workflow', () => {
      const example = generateSimpleWorkflowExample();

      expect(example.name).toBe('Simple Task Workflow');
      expect(example.description).toContain('3-state workflow');
      expect(example.configuration.states).toHaveProperty('todo');
      expect(example.configuration.states).toHaveProperty('in_progress');
      expect(example.configuration.states).toHaveProperty('done');
    });

    it('should have correct initial state', () => {
      const example = generateSimpleWorkflowExample();

      expect(example.configuration.initialState).toBe('todo');
      expect(example.configuration.active).toBe(true);
    });

    it('should have correct transitions', () => {
      const example = generateSimpleWorkflowExample();

      expect(example.configuration.states.todo.transitions).toHaveLength(1);
      expect(example.configuration.states.todo.transitions[0].next).toBe('in_progress');

      expect(example.configuration.states.in_progress.transitions).toHaveLength(1);
      expect(example.configuration.states.in_progress.transitions[0].next).toBe('done');

      expect(example.configuration.states.done.transitions).toHaveLength(0);
    });

    it('should generate layout with correct state positions', () => {
      const example = generateSimpleWorkflowExample();

      expect(example.layout.states).toHaveLength(3);
      expect(example.layout.states[0].id).toBe('todo');
      expect(example.layout.states[1].id).toBe('in_progress');
      expect(example.layout.states[2].id).toBe('done');
    });

    it('should generate layout with transition positions', () => {
      const example = generateSimpleWorkflowExample();

      expect(example.layout.transitions).toHaveLength(2);
      expect(example.layout.transitions[0].id).toBe('todo-0');
      expect(example.layout.transitions[1].id).toBe('in_progress-0');
    });

    it('should include workflow ID in layout', () => {
      const example = generateSimpleWorkflowExample();

      expect(example.layout.workflowId).toMatch(/^example-simple-\d+$/);
    });
  });

  describe('generateSimpleRegistrationWorkflow', () => {
    it('should generate a registration workflow', () => {
      const example = generateSimpleRegistrationWorkflow();

      expect(example.name).toBe('User Registration');
      expect(example.configuration.initialState).toBe('submitted');
    });

    it('should have 5 states', () => {
      const example = generateSimpleRegistrationWorkflow();

      expect(Object.keys(example.configuration.states)).toHaveLength(5);
      expect(example.configuration.states).toHaveProperty('submitted');
      expect(example.configuration.states).toHaveProperty('pending_verification');
      expect(example.configuration.states).toHaveProperty('verified');
      expect(example.configuration.states).toHaveProperty('expired');
      expect(example.configuration.states).toHaveProperty('active');
    });

    it('should have verification workflow transitions', () => {
      const example = generateSimpleRegistrationWorkflow();

      // Submitted -> Pending Verification
      expect(example.configuration.states.submitted.transitions[0].next).toBe(
        'pending_verification'
      );

      // Pending Verification can go to Verified or Expired
      expect(example.configuration.states.pending_verification.transitions).toHaveLength(2);
      expect(
        example.configuration.states.pending_verification.transitions.map((t) => t.next)
      ).toContain('verified');
      expect(
        example.configuration.states.pending_verification.transitions.map((t) => t.next)
      ).toContain('expired');
    });

    it('should have manual and automatic transitions', () => {
      const example = generateSimpleRegistrationWorkflow();

      // Manual transition
      const verifyTransition = example.configuration.states.pending_verification.transitions.find(
        (t) => t.name === 'Verify Email'
      );
      expect(verifyTransition?.manual).toBe(true);

      // Automatic transition
      const autoActivate = example.configuration.states.verified.transitions[0];
      expect(autoActivate.manual).toBe(false);
    });
  });

  describe('generateSimpleApprovalWorkflow', () => {
    it('should generate an approval workflow', () => {
      const example = generateSimpleApprovalWorkflow();

      expect(example.name).toBe('Document Approval');
      expect(example.configuration.initialState).toBe('draft');
    });

    it('should have 5 states', () => {
      const example = generateSimpleApprovalWorkflow();

      expect(Object.keys(example.configuration.states)).toHaveLength(5);
      expect(example.configuration.states).toHaveProperty('draft');
      expect(example.configuration.states).toHaveProperty('in_review');
      expect(example.configuration.states).toHaveProperty('approved');
      expect(example.configuration.states).toHaveProperty('rejected');
      expect(example.configuration.states).toHaveProperty('published');
    });

    it('should have branching from in_review state', () => {
      const example = generateSimpleApprovalWorkflow();

      const reviewTransitions = example.configuration.states.in_review.transitions;
      expect(reviewTransitions).toHaveLength(3);

      const nextStates = reviewTransitions.map((t) => t.next);
      expect(nextStates).toContain('approved');
      expect(nextStates).toContain('draft');
      expect(nextStates).toContain('rejected');
    });

    it('should have final states with no transitions', () => {
      const example = generateSimpleApprovalWorkflow();

      expect(example.configuration.states.rejected.transitions).toHaveLength(0);
      expect(example.configuration.states.published.transitions).toHaveLength(0);
    });
  });

  describe('getRandomExampleWorkflow', () => {
    it('should return a workflow example', () => {
      const example = getRandomExampleWorkflow();

      expect(example).toBeDefined();
      expect(example.configuration).toBeDefined();
      expect(example.layout).toBeDefined();
    });

    it('should return the simple workflow example', () => {
      const example = getRandomExampleWorkflow();

      expect(example.name).toBe('Simple Task Workflow');
    });
  });

  describe('generateWorkflowExplanation', () => {
    it('should generate explanation text', () => {
      const explanation = generateWorkflowExplanation();

      expect(explanation).toContain('workflow');
      expect(explanation).toContain('Simple Task Workflow');
      expect(explanation).toContain('To Do');
      expect(explanation).toContain('In Progress');
      expect(explanation).toContain('Done');
    });

    it('should explain key concepts', () => {
      const explanation = generateWorkflowExplanation();

      expect(explanation).toContain('Initial State');
      expect(explanation).toContain('Transitions');
      expect(explanation).toContain('Manual Transitions');
      expect(explanation).toContain('Final State');
    });

    it('should include markdown formatting', () => {
      const explanation = generateWorkflowExplanation();

      expect(explanation).toContain('##');
      expect(explanation).toContain('###');
      expect(explanation).toContain('**');
    });
  });

  describe('exampleWorkflowToStorageFormat', () => {
    it('should convert example to JSON string', () => {
      const example = generateSimpleWorkflowExample();
      const storage = exampleWorkflowToStorageFormat(example);

      expect(typeof storage).toBe('string');

      const parsed = JSON.parse(storage);
      expect(parsed.name).toBe(example.configuration.name);
      expect(parsed.version).toBe(example.configuration.version);
    });

    it('should include layout in storage format', () => {
      const example = generateSimpleWorkflowExample();
      const storage = exampleWorkflowToStorageFormat(example);

      const parsed = JSON.parse(storage);
      expect(parsed.layout).toBeDefined();
      expect(parsed.layout.states).toHaveLength(3);
    });

    it('should include both initialState and initial_state for legacy support', () => {
      const example = generateSimpleWorkflowExample();
      const storage = exampleWorkflowToStorageFormat(example);

      const parsed = JSON.parse(storage);
      expect(parsed.initialState).toBe('todo');
      expect(parsed.initial_state).toBe('todo');
    });

    it('should be pretty-formatted with 2-space indent', () => {
      const example = generateSimpleWorkflowExample();
      const storage = exampleWorkflowToStorageFormat(example);

      // Should have newlines and indentation
      expect(storage).toContain('\n');
      expect(storage).toContain('  ');
    });
  });

  describe('isWorkflowExampleRequest', () => {
    it('should detect "give me an example of workflow"', () => {
      expect(isWorkflowExampleRequest('give me an example of workflow')).toBe(true);
      expect(isWorkflowExampleRequest('Give me an example workflow')).toBe(true);
      expect(isWorkflowExampleRequest('give me a workflow example')).toBe(true);
    });

    it('should detect "show me an example of workflow"', () => {
      expect(isWorkflowExampleRequest('show me an example of workflow')).toBe(true);
      expect(isWorkflowExampleRequest('Show me a workflow example')).toBe(true);
    });

    it('should detect "can you give/show me a workflow example"', () => {
      expect(isWorkflowExampleRequest('can you give me a workflow example')).toBe(true);
      expect(isWorkflowExampleRequest('can you show me an workflow example')).toBe(true);
    });

    it('should detect "what is a workflow look like"', () => {
      expect(isWorkflowExampleRequest('what is a workflow look like')).toBe(true);
      expect(isWorkflowExampleRequest('what does a workflow look like')).toBe(true);
    });

    it('should detect simple "example workflow" variations', () => {
      expect(isWorkflowExampleRequest('example workflow')).toBe(true);
      expect(isWorkflowExampleRequest('workflow example')).toBe(true);
    });

    it('should detect "how do workflows work"', () => {
      expect(isWorkflowExampleRequest('how do workflows work')).toBe(true);
      expect(isWorkflowExampleRequest('how does workflow work')).toBe(true);
    });

    it('should detect "explain workflow"', () => {
      expect(isWorkflowExampleRequest('explain workflow')).toBe(true);
      expect(isWorkflowExampleRequest('Explain workflows to me')).toBe(true);
    });

    it('should detect "demonstrate workflow"', () => {
      expect(isWorkflowExampleRequest('demonstrate workflow')).toBe(true);
      expect(isWorkflowExampleRequest('Demonstrate workflows')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isWorkflowExampleRequest('GIVE ME A WORKFLOW EXAMPLE')).toBe(true);
      expect(isWorkflowExampleRequest('gIvE mE a WoRkFlOw ExAmPlE')).toBe(true);
    });

    it('should handle extra whitespace', () => {
      expect(isWorkflowExampleRequest('  give me a workflow example  ')).toBe(true);
      expect(isWorkflowExampleRequest('give  me   a   workflow  example')).toBe(true);
    });

    it('should not match unrelated messages', () => {
      expect(isWorkflowExampleRequest('hello')).toBe(false);
      expect(isWorkflowExampleRequest('what is the weather')).toBe(false);
      expect(isWorkflowExampleRequest('create a new entity')).toBe(false);
      expect(isWorkflowExampleRequest('I need help')).toBe(false);
    });

    it('should not match partial words', () => {
      expect(isWorkflowExampleRequest('workflows are great')).toBe(false);
      expect(isWorkflowExampleRequest('this is an example of something')).toBe(false);
    });
  });
});
