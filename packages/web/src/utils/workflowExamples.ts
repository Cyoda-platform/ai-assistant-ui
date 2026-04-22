/**
 * Workflow Example Generator
 * Generates simple example workflows for educational purposes
 */

import type { WorkflowConfiguration, CanvasLayout } from '@/components/WorkflowCanvas/types/workflow';

export interface ExampleWorkflowData {
  configuration: WorkflowConfiguration;
  layout: CanvasLayout;
  name: string;
  description: string;
}

/**
 * Generate a very simple 3-state workflow example for beginners
 */
export function generateSimpleWorkflowExample(): ExampleWorkflowData {
  const workflowId = `example-simple-${Date.now()}`;

  const configuration: WorkflowConfiguration = {
    version: '1.0',
    name: 'Simple Task Workflow',
    desc: 'A basic 3-state workflow example',
    initialState: 'todo',
    active: true,
    states: {
      todo: {
        name: 'To Do',
        transitions: [
          {
            name: 'Start Task',
            next: 'in_progress',
            manual: true,
          }
        ]
      },
      in_progress: {
        name: 'In Progress',
        transitions: [
          {
            name: 'Complete Task',
            next: 'done',
            manual: true,
          }
        ]
      },
      done: {
        name: 'Done',
        transitions: []
      }
    }
  };

  const layout: CanvasLayout = {
    workflowId,
    version: 1,
    updatedAt: new Date().toISOString(),
    states: [
      { id: 'todo', position: { x: 150, y: 150 } },
      { id: 'in_progress', position: { x: 450, y: 150 } },
      { id: 'done', position: { x: 750, y: 150 } }
    ],
    transitions: [
      { id: 'todo-0', position: { x: 300, y: 150 } },
      { id: 'in_progress-0', position: { x: 600, y: 150 } }
    ]
  };

  return {
    configuration,
    layout,
    name: 'Simple Task Workflow',
    description: 'A simple 3-state workflow: To Do → In Progress → Done'
  };
}

/**
 * Generate a simple user registration workflow example
 */
export function generateSimpleRegistrationWorkflow(): ExampleWorkflowData {
  const workflowId = `example-registration-${Date.now()}`;

  const configuration: WorkflowConfiguration = {
    version: '1.0',
    name: 'User Registration',
    desc: 'A simple user registration and verification workflow',
    initialState: 'submitted',
    active: true,
    states: {
      submitted: {
        name: 'Submitted',
        transitions: [
          {
            name: 'Send Verification Email',
            next: 'pending_verification',
            manual: false,
          }
        ]
      },
      pending_verification: {
        name: 'Pending Verification',
        transitions: [
          {
            name: 'Verify Email',
            next: 'verified',
            manual: true,
          },
          {
            name: 'Verification Expired',
            next: 'expired',
            manual: false,
          }
        ]
      },
      verified: {
        name: 'Verified',
        transitions: [
          {
            name: 'Activate Account',
            next: 'active',
            manual: false,
          }
        ]
      },
      expired: {
        name: 'Expired',
        transitions: [
          {
            name: 'Resend Verification',
            next: 'pending_verification',
            manual: true,
          }
        ]
      },
      active: {
        name: 'Active',
        transitions: []
      }
    }
  };

  const layout: CanvasLayout = {
    workflowId,
    version: 1,
    updatedAt: new Date().toISOString(),
    states: [
      { id: 'submitted', position: { x: 100, y: 150 } },
      { id: 'pending_verification', position: { x: 350, y: 150 } },
      { id: 'verified', position: { x: 600, y: 100 } },
      { id: 'expired', position: { x: 600, y: 250 } },
      { id: 'active', position: { x: 850, y: 100 } }
    ],
    transitions: [
      { id: 'submitted-0', position: { x: 225, y: 150 } },
      { id: 'pending_verification-0', position: { x: 475, y: 125 } },
      { id: 'pending_verification-1', position: { x: 475, y: 200 } },
      { id: 'verified-0', position: { x: 725, y: 100 } },
      { id: 'expired-0', position: { x: 475, y: 250 } }
    ]
  };

  return {
    configuration,
    layout,
    name: 'User Registration',
    description: 'An example showing how users register and verify their accounts through different states.'
  };
}

/**
 * Generate a document approval workflow example
 */
export function generateSimpleApprovalWorkflow(): ExampleWorkflowData {
  const workflowId = `example-approval-${Date.now()}`;

  const configuration: WorkflowConfiguration = {
    version: '1.0',
    name: 'Document Approval',
    desc: 'A simple document review and approval workflow',
    initialState: 'draft',
    active: true,
    states: {
      draft: {
        name: 'Draft',
        transitions: [
          {
            name: 'Submit for Review',
            next: 'in_review',
            manual: true,
          }
        ]
      },
      in_review: {
        name: 'In Review',
        transitions: [
          {
            name: 'Approve',
            next: 'approved',
            manual: true,
          },
          {
            name: 'Request Changes',
            next: 'draft',
            manual: true,
          },
          {
            name: 'Reject',
            next: 'rejected',
            manual: true,
          }
        ]
      },
      approved: {
        name: 'Approved',
        transitions: [
          {
            name: 'Publish',
            next: 'published',
            manual: false,
          }
        ]
      },
      rejected: {
        name: 'Rejected',
        transitions: []
      },
      published: {
        name: 'Published',
        transitions: []
      }
    }
  };

  const layout: CanvasLayout = {
    workflowId,
    version: 1,
    updatedAt: new Date().toISOString(),
    states: [
      { id: 'draft', position: { x: 100, y: 150 } },
      { id: 'in_review', position: { x: 350, y: 150 } },
      { id: 'approved', position: { x: 600, y: 50 } },
      { id: 'rejected', position: { x: 600, y: 250 } },
      { id: 'published', position: { x: 850, y: 50 } }
    ],
    transitions: [
      { id: 'draft-0', position: { x: 225, y: 150 } },
      { id: 'in_review-0', position: { x: 475, y: 100 } },
      { id: 'in_review-1', position: { x: 225, y: 200 } },
      { id: 'in_review-2', position: { x: 475, y: 200 } },
      { id: 'approved-0', position: { x: 725, y: 50 } }
    ]
  };

  return {
    configuration,
    layout,
    name: 'Document Approval',
    description: 'An example showing how documents move through draft, review, and approval stages.'
  };
}

/**
 * Get a simple example workflow (always returns the simple 3-state example)
 */
export function getRandomExampleWorkflow(): ExampleWorkflowData {
  return generateSimpleWorkflowExample();
}

/**
 * Generate explanation text for the workflow example (from Cyoda's perspective)
 */
export function generateWorkflowExplanation(): string {
  return `Great! Let me show you a simple workflow example. I've opened the Canvas and created a basic workflow for you.

## What is a Workflow?

A **workflow** defines how something moves through different stages. Think of it like a process with steps.

## This Example: Simple Task Workflow

I've created a simple 3-state workflow that shows how a task progresses:

### The States (Boxes):
1. **To Do** - The starting point. This is where new tasks begin.
2. **In Progress** - The task is being worked on.
3. **Done** - The task is completed (final state).

### The Transitions (Arrows):
- **Start Task** - Moves the task from "To Do" to "In Progress"
- **Complete Task** - Moves the task from "In Progress" to "Done"

### Key Concepts:
- **Initial State**: Every workflow starts at one state. Here, it's "To Do".
- **Transitions**: These are the actions that move between states.
- **Manual Transitions**: These require someone to trigger them (like clicking a button).
- **Final State**: "Done" has no transitions out - it's the end of the workflow.

## Try It Out!

Look at the **Workflow tab** in the Canvas on the left. You can:
- Click on states to see their details
- Click on transitions to see what triggers them
- Try adding more states or transitions if you want to experiment!

This is the foundation of how workflows work in Cyoda. You can create much more complex workflows with:
- Multiple paths (branching)
- Conditional transitions
- Automated processors
- And more!

Would you like me to explain any specific part in more detail?`;
}

/**
 * Convert workflow example to storage format (JSON string)
 */
export function exampleWorkflowToStorageFormat(example: ExampleWorkflowData): string {
  const storageData = {
    version: example.configuration.version,
    name: example.configuration.name,
    desc: example.configuration.desc,
    initialState: example.configuration.initialState,
    initial_state: example.configuration.initialState, // Legacy support
    active: example.configuration.active,
    states: example.configuration.states,
    layout: example.layout
  };

  return JSON.stringify(storageData, null, 2);
}

/**
 * Detect if user message is requesting a workflow example
 */
export function isWorkflowExampleRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();

  const patterns = [
    /give\s+me\s+(an?\s+)?example\s+(of\s+)?workflow/i,
    /show\s+me\s+(an?\s+)?example\s+(of\s+)?workflow/i,
    /can\s+you\s+(give|show)\s+me\s+(an?\s+)?workflow\s+example/i,
    /what\s+(is|does)\s+(an?\s+)?workflow\s+look\s+like/i,
    /example\s+workflow/i,
    /workflow\s+example/i,
    /how\s+(does|do)\s+workflows?\s+work/i,
    /explain\s+workflow/i,
    /demonstrate\s+workflow/i
  ];

  return patterns.some(pattern => pattern.test(lowerMessage));
}
