import type {
  Entity,
  WorkflowConfiguration,
  CanvasLayout,
  WorkflowSummary,
  EntitiesResponse,
  WorkflowsResponse,
  WorkflowConfigurationResponse,
  CanvasLayoutResponse,
  WorkflowWithLayoutResponse
} from '../types/workflow';

// Mock data
const mockEntities: Entity[] = [
  {
    id: 'user-entity',
    name: 'User',
    description: 'User account management workflows',
    workflowCount: 2
  },
  {
    id: 'order-entity',
    name: 'Order',
    description: 'Order processing and fulfillment workflows',
    workflowCount: 1
  },
  {
    id: 'payment-entity',
    name: 'Payment',
    description: 'Payment processing workflows',
    workflowCount: 1
  }
];

const mockWorkflows: Record<string, WorkflowSummary[]> = {
  'user-entity': [
    {
      id: 'user-registration',
      name: 'User Registration',
      description: 'New user account creation process',
      stateCount: 4,
      transitionCount: 5,
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'user-verification',
      name: 'User Verification',
      description: 'Email and identity verification process',
      stateCount: 3,
      transitionCount: 4,
      updatedAt: '2024-01-14T15:45:00Z'
    }
  ],
  'order-entity': [
    {
      id: 'order-fulfillment',
      name: 'Order Fulfillment',
      description: 'Complete order processing workflow',
      stateCount: 6,
      transitionCount: 8,
      updatedAt: '2024-01-16T09:15:00Z'
    }
  ],
  'payment-entity': [
    {
      id: 'payment-processing',
      name: 'Payment Processing',
      description: 'Payment authorization and settlement',
      stateCount: 5,
      transitionCount: 6,
      updatedAt: '2024-01-13T14:20:00Z'
    }
  ]
};

// Workflow metadata for API operations
const mockWorkflowMetadata: Record<string, { id: string; entityId: string; createdAt: string; updatedAt: string }> = {
  'user-registration': {
    id: 'user-registration',
    entityId: 'user-entity',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  'user-verification': {
    id: 'user-verification',
    entityId: 'user-entity',
    createdAt: '2024-01-12T08:00:00Z',
    updatedAt: '2024-01-14T15:45:00Z'
  },
  'order-fulfillment': {
    id: 'order-fulfillment',
    entityId: 'order-entity',
    createdAt: '2024-01-14T08:00:00Z',
    updatedAt: '2024-01-16T09:15:00Z'
  },
  'payment-processing': {
    id: 'payment-processing',
    entityId: 'payment-entity',
    createdAt: '2024-01-11T08:00:00Z',
    updatedAt: '2024-01-13T14:20:00Z'
  }
};

// Segregated mock data - workflow configurations (functional specification)
const mockWorkflowConfigurations: Record<string, WorkflowConfiguration> = {
  'user-registration': {
    version: '1.0',
    name: 'User Registration',
    desc: 'New user account creation process',
    initialState: 'pending',
    active: true,
    states: {
      'pending': {
        transitions: [
          {
            name: 'Send Verification Email',
            next: 'email-sent',
            manual: false,
            criterion: {
              type: 'simple',
              field: 'email',
              operator: 'contains',
              value: '@'
            },
            processors: [
              {
                name: 'send-verification-email',
                executionMode: 'ASYNC_NEW_TX',
                config: {
                  attachEntity: true,
                  responseTimeoutMs: 5000,
                  context: 'email-verification'
                }
              }
            ]
          },
          {
            name: 'Invalid Email',
            next: 'failed',
            manual: false,
            criterion: {
              type: 'simple',
              field: 'email',
              operator: 'not_contains',
              value: '@'
            }
          },
          {
            name: 'Retry Registration',
            next: 'pending',
            manual: true,
            disabled: false
          }
        ]
      },
      'email-sent': {
        transitions: [
          {
            name: 'Email Verified',
            next: 'verified',
            manual: true,
            criterion: {
              type: 'simple',
              field: 'verification_token',
              operator: 'equals',
              value: 'valid'
            }
          },
          {
            name: 'Verification Timeout',
            next: 'failed',
            manual: false,
            criterion: {
              type: 'simple',
              field: 'timeout',
              operator: 'greater_than',
              value: 3600
            }
          }
        ]
      },
      'verified': {
        transitions: []
      },
      'failed': {
        transitions: []
      }
    }
  },
  'user-verification': {
    version: '1.0',
    name: 'User Verification',
    desc: 'Email and identity verification process',
    initialState: 'unverified',
    active: true,
    states: {
      'unverified': {
        transitions: [
          {
            name: 'Send Verification',
            next: 'verification-sent',
            criterion: {
              type: 'simple',
              field: 'email_valid',
              operator: 'equals',
              value: true
            },
            processors: [
              {
                name: 'send-verification-email',
                executionMode: 'ASYNC_NEW_TX',
                config: {
                  attachEntity: true,
                  responseTimeoutMs: 5000
                }
              }
            ]
          }
        ]
      },
      'verification-sent': {
        transitions: [
          {
            name: 'Verify Email',
            next: 'verified',
            criterion: {
              type: 'simple',
              field: 'verification_code',
              operator: 'equals',
              value: 'valid'
            },
            processors: [
              {
                name: 'mark-verified',
                executionMode: 'SYNC',
                config: {
                  attachEntity: true
                }
              }
            ]
          },
          {
            name: 'Resend Verification',
            next: 'unverified',
            criterion: {
              type: 'simple',
              field: 'resend_requested',
              operator: 'equals',
              value: true
            }
          }
        ]
      },
      'verified': {
        transitions: []
      }
    }
  },
  'order-fulfillment': {
    version: '1.0',
    name: 'Order Fulfillment',
    desc: 'Complete order processing workflow',
    initialState: 'pending',
    active: true,
    states: {
      'pending': {
        transitions: [
          {
            name: 'Start Processing',
            next: 'processing',
            criterion: {
              type: 'simple',
              field: 'payment_confirmed',
              operator: 'equals',
              value: true
            },
            processors: [
              {
                name: 'inventory-check',
                executionMode: 'SYNC',
                config: {
                  attachEntity: true,
                  responseTimeoutMs: 3000
                }
              }
            ]
          },
          {
            name: 'Cancel Order',
            next: 'cancelled',
            manual: true
          }
        ]
      },
      'processing': {
        transitions: [
          {
            name: 'Ship Order',
            next: 'shipped',
            criterion: {
              type: 'simple',
              field: 'items_packed',
              operator: 'equals',
              value: true
            },
            processors: [
              {
                name: 'shipping-label',
                executionMode: 'ASYNC_NEW_TX',
                config: {
                  attachEntity: true,
                  responseTimeoutMs: 10000
                }
              }
            ]
          }
        ]
      },
      'shipped': {
        transitions: [
          {
            name: 'Confirm Delivery',
            next: 'delivered',
            criterion: {
              type: 'simple',
              field: 'delivery_confirmed',
              operator: 'equals',
              value: true
            }
          }
        ]
      },
      'delivered': {
        transitions: []
      },
      'cancelled': {
        transitions: []
      }
    }
  },
  'payment-processing': {
    version: '1.0',
    name: 'Payment Processing',
    desc: 'Payment authorization and settlement',
    initialState: 'initiated',
    active: true,
    states: {
      'initiated': {
        transitions: [
          {
            name: 'Authorize Payment',
            next: 'authorized',
            criterion: {
              type: 'simple',
              field: 'card_valid',
              operator: 'equals',
              value: true
            },
            processors: [
              {
                name: 'payment-gateway',
                executionMode: 'SYNC',
                config: {
                  attachEntity: true,
                  responseTimeoutMs: 5000,
                  retryPolicy: 'exponential-backoff'
                }
              }
            ]
          },
          {
            name: 'Payment Failed',
            next: 'failed',
            criterion: {
              type: 'simple',
              field: 'authorization_failed',
              operator: 'equals',
              value: true
            }
          }
        ]
      },
      'authorized': {
        transitions: [
          {
            name: 'Capture Payment',
            next: 'captured',
            criterion: {
              type: 'simple',
              field: 'capture_requested',
              operator: 'equals',
              value: true
            },
            processors: [
              {
                name: 'payment-capture',
                executionMode: 'SYNC',
                config: {
                  attachEntity: true,
                  responseTimeoutMs: 5000
                }
              }
            ]
          }
        ]
      },
      'captured': {
        transitions: [
          {
            name: 'Refund Payment',
            next: 'refunded',
            criterion: {
              type: 'simple',
              field: 'refund_requested',
              operator: 'equals',
              value: true
            },
            processors: [
              {
                name: 'payment-refund',
                executionMode: 'ASYNC_NEW_TX',
                config: {
                  attachEntity: true,
                  responseTimeoutMs: 10000
                }
              }
            ]
          }
        ]
      },
      'failed': {
        transitions: []
      },
      'refunded': {
        transitions: []
      }
    }
  }
};

// Canvas layouts (visual/positional data)
const mockCanvasLayouts: Record<string, CanvasLayout> = {
  'user-registration': {
    workflowId: 'user-registration',
    version: 1,
    updatedAt: '2024-01-15T10:30:00Z',
    states: [
      {
        id: 'pending',
        position: { x: 100, y: 100 },
        properties: { color: '#fbbf24' }
      },
      {
        id: 'email-sent',
        position: { x: 300, y: 100 },
        properties: { color: '#60a5fa' }
      },
      {
        id: 'verified',
        position: { x: 500, y: 100 },
        properties: { color: '#34d399' }
      },
      {
        id: 'failed',
        position: { x: 300, y: 250 },
        properties: { color: '#f87171' }
      }
    ],
    transitions: [
      {
        id: 'pending-to-email-sent',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'right-center-source',
        targetHandle: 'left-center-target'
      },
      {
        id: 'email-sent-to-verified',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'right-center-source',
        targetHandle: 'left-center-target'
      },
      {
        id: 'pending-to-failed',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'bottom-center-source',
        targetHandle: 'top-center-target'
      },
      {
        id: 'email-sent-to-failed',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'bottom-center-source',
        targetHandle: 'top-center-target'
      },
      {
        id: 'pending-to-pending',
        labelPosition: { x: 0, y: -60 },
        sourceHandle: 'bottom-center-source',
        targetHandle: 'top-center-target'
      }
    ]
  },
  'user-verification': {
    workflowId: 'user-verification',
    version: 1,
    updatedAt: '2024-01-14T15:45:00Z',
    states: [
      {
        id: 'unverified',
        position: { x: 100, y: 100 },
        properties: { color: '#f59e0b' }
      },
      {
        id: 'verification-sent',
        position: { x: 350, y: 100 },
        properties: { color: '#3b82f6' }
      },
      {
        id: 'verified',
        position: { x: 600, y: 100 },
        properties: { color: '#10b981' }
      }
    ],
    transitions: [
      {
        id: 'unverified-to-verification-sent',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'right-center-source',
        targetHandle: 'left-center-target'
      },
      {
        id: 'verification-sent-to-verified',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'right-center-source',
        targetHandle: 'left-center-target'
      },
      {
        id: 'verification-sent-to-unverified',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'bottom-center-source',
        targetHandle: 'top-center-target'
      }
    ]
  },
  'order-fulfillment': {
    workflowId: 'order-fulfillment',
    version: 1,
    updatedAt: '2024-01-16T09:15:00Z',
    states: [
      {
        id: 'pending',
        position: { x: 100, y: 100 },
        properties: { color: '#f59e0b' }
      },
      {
        id: 'processing',
        position: { x: 300, y: 100 },
        properties: { color: '#3b82f6' }
      },
      {
        id: 'shipped',
        position: { x: 500, y: 100 },
        properties: { color: '#8b5cf6' }
      },
      {
        id: 'delivered',
        position: { x: 700, y: 100 },
        properties: { color: '#10b981' }
      },
      {
        id: 'cancelled',
        position: { x: 300, y: 250 },
        properties: { color: '#ef4444' }
      }
    ],
    transitions: [
      {
        id: 'pending-to-processing',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'right-center-source',
        targetHandle: 'left-center-target'
      },
      {
        id: 'processing-to-shipped',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'right-center-source',
        targetHandle: 'left-center-target'
      },
      {
        id: 'shipped-to-delivered',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'right-center-source',
        targetHandle: 'left-center-target'
      },
      {
        id: 'pending-to-cancelled',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'bottom-center-source',
        targetHandle: 'top-center-target'
      }
    ]
  },
  'payment-processing': {
    workflowId: 'payment-processing',
    version: 1,
    updatedAt: '2024-01-13T14:20:00Z',
    states: [
      {
        id: 'initiated',
        position: { x: 100, y: 100 },
        properties: { color: '#f59e0b' }
      },
      {
        id: 'authorized',
        position: { x: 300, y: 100 },
        properties: { color: '#3b82f6' }
      },
      {
        id: 'captured',
        position: { x: 500, y: 100 },
        properties: { color: '#10b981' }
      },
      {
        id: 'failed',
        position: { x: 300, y: 250 },
        properties: { color: '#ef4444' }
      },
      {
        id: 'refunded',
        position: { x: 500, y: 250 },
        properties: { color: '#6b7280' }
      }
    ],
    transitions: [
      {
        id: 'initiated-to-authorized',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'right-center-source',
        targetHandle: 'left-center-target'
      },
      {
        id: 'authorized-to-captured',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'right-center-source',
        targetHandle: 'left-center-target'
      },
      {
        id: 'initiated-to-failed',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'bottom-center-source',
        targetHandle: 'top-center-target'
      },
      {
        id: 'captured-to-refunded',
        labelPosition: { x: 0, y: 0 },
        sourceHandle: 'bottom-center-source',
        targetHandle: 'top-center-target'
      }
    ]
  }
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockApiService {
  static async getEntities(): Promise<EntitiesResponse> {
    await delay(500);
    return {
      data: mockEntities,
      success: true,
      message: 'Entities retrieved successfully'
    };
  }

  static async getWorkflows(entityId: string): Promise<WorkflowsResponse> {
    await delay(300);
    const workflows = mockWorkflows[entityId] || [];
    return {
      data: workflows,
      success: true,
      message: `Workflows for entity ${entityId} retrieved successfully`
    };
  }

  // Get workflow configuration (functional specification)
  static async getWorkflowConfiguration(_entityId: string, workflowId: string): Promise<WorkflowConfigurationResponse> {
    await delay(400);
    const configuration = mockWorkflowConfigurations[workflowId];

    if (!configuration) {
      return {
        data: {} as WorkflowConfiguration,
        success: false,
        message: `Workflow configuration ${workflowId} not found`
      };
    }

    return {
      data: configuration,
      success: true,
      message: `Workflow configuration ${workflowId} retrieved successfully`
    };
  }

  // Get canvas layout (visual/positional data)
  static async getCanvasLayout(_entityId: string, workflowId: string): Promise<CanvasLayoutResponse> {
    await delay(300);
    const layout = mockCanvasLayouts[workflowId];

    if (!layout) {
      return {
        data: {} as CanvasLayout,
        success: false,
        message: `Canvas layout ${workflowId} not found`
      };
    }

    return {
      data: layout,
      success: true,
      message: `Canvas layout ${workflowId} retrieved successfully`
    };
  }

  // Get both workflow configuration and canvas layout together
  static async getWorkflowWithLayout(_entityId: string, workflowId: string): Promise<WorkflowWithLayoutResponse> {
    await delay(500);
    const configuration = mockWorkflowConfigurations[workflowId];
    const layout = mockCanvasLayouts[workflowId];

    if (!configuration || !layout) {
      return {
        data: { configuration: {} as WorkflowConfiguration, layout: {} as CanvasLayout },
        success: false,
        message: `Workflow ${workflowId} not found`
      };
    }

    return {
      data: { configuration, layout },
      success: true,
      message: `Workflow ${workflowId} retrieved successfully`
    };
  }

  // Update workflow configuration
  static async updateWorkflowConfiguration(entityId: string, workflowId: string, configuration: WorkflowConfiguration): Promise<WorkflowConfigurationResponse> {
    await delay(600);

    // Update the mock data
    mockWorkflowConfigurations[workflowId] = configuration;

    // Update metadata
    if (mockWorkflowMetadata[workflowId]) {
      mockWorkflowMetadata[workflowId].updatedAt = new Date().toISOString();
    }

    return {
      data: mockWorkflowConfigurations[workflowId],
      success: true,
      message: `Workflow configuration ${workflowId} updated successfully`
    };
  }

  // Update canvas layout
  static async updateCanvasLayout(_entityId: string, layout: CanvasLayout): Promise<CanvasLayoutResponse> {
    await delay(400);

    // Update the mock data
    mockCanvasLayouts[layout.workflowId] = {
      ...layout,
      updatedAt: new Date().toISOString()
    };

    return {
      data: mockCanvasLayouts[layout.workflowId],
      success: true,
      message: `Canvas layout ${layout.workflowId} updated successfully`
    };
  }
}
