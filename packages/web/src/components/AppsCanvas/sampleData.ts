// Sample data for portal canvas demonstration
// Hierarchy: Environment → App → Requirement (versioned) → Entity-Version → Workflow → Code
import type { PortalData } from './types/portal';

export const samplePortalData: PortalData = {
  environments: [
    {
      id: 'env-production',
      name: 'Production',
      type: 'environment',
      environmentType: 'production',
      description: 'Live production environment',
      appCount: 2,
      status: 'active'
    },
    {
      id: 'env-staging',
      name: 'Staging',
      type: 'environment',
      environmentType: 'staging',
      description: 'Pre-production testing',
      appCount: 2,
      status: 'active'
    },
    {
      id: 'env-development',
      name: 'Development',
      type: 'environment',
      environmentType: 'development',
      description: 'Development environment',
      appCount: 1,
      status: 'active'
    }
  ],

  apps: [
    {
      id: 'app-customer-service',
      environmentId: 'env-production',
      name: 'Customer Service',
      type: 'app',
      description: 'Customer management and onboarding',
      requirementCount: 2,
      version: '2.1.0',
      status: 'running'
    },
    {
      id: 'app-order-api',
      environmentId: 'env-production',
      name: 'Order API',
      type: 'app',
      description: 'Order processing and fulfillment',
      requirementCount: 1,
      version: '1.5.3',
      status: 'running'
    },
    {
      id: 'app-customer-service-staging',
      environmentId: 'env-staging',
      name: 'Customer Service',
      type: 'app',
      description: 'Customer management (staging)',
      requirementCount: 1,
      version: '2.2.0-beta',
      status: 'running'
    },
    {
      id: 'app-order-api-staging',
      environmentId: 'env-staging',
      name: 'Order API',
      type: 'app',
      description: 'Order processing (staging)',
      requirementCount: 1,
      version: '1.6.0-beta',
      status: 'deploying'
    },
    {
      id: 'app-payment-gateway-dev',
      environmentId: 'env-development',
      name: 'Payment Gateway',
      type: 'app',
      description: 'Payment processing (dev)',
      requirementCount: 1,
      version: '0.1.0-dev',
      status: 'stopped'
    }
  ],

  requirements: [
    {
      id: 'req-customer-onboarding-v1',
      appId: 'app-customer-service',
      title: 'Customer Onboarding',
      version: '1.0',
      type: 'requirement',
      description: 'Basic customer registration and verification',
      status: 'verified',
      priority: 'high',
      entityCount: 1,
      createdAt: '2024-09-01T10:00:00Z',
      updatedAt: '2024-09-15T14:30:00Z'
    },
    {
      id: 'req-customer-onboarding-v2',
      appId: 'app-customer-service',
      title: 'Enhanced Onboarding',
      version: '2.0',
      type: 'requirement',
      description: 'Advanced onboarding with biometric auth',
      status: 'approved',
      priority: 'high',
      entityCount: 1,
      createdAt: '2024-10-01T09:00:00Z',
      updatedAt: '2024-10-03T16:45:00Z'
    },
    {
      id: 'req-order-processing-v1',
      appId: 'app-order-api',
      title: 'Order Processing',
      version: '1.0',
      type: 'requirement',
      description: 'Order creation, payment, fulfillment',
      status: 'implemented',
      priority: 'critical',
      entityCount: 1,
      createdAt: '2024-09-10T11:00:00Z',
      updatedAt: '2024-09-28T10:30:00Z'
    },
    {
      id: 'req-customer-onboarding-v2-staging',
      appId: 'app-customer-service-staging',
      title: 'Enhanced Onboarding',
      version: '2.0',
      type: 'requirement',
      description: 'Testing enhanced onboarding',
      status: 'implemented',
      priority: 'high',
      entityCount: 1,
      createdAt: '2024-10-01T09:00:00Z',
      updatedAt: '2024-10-05T12:00:00Z'
    },
    {
      id: 'req-order-processing-v1-staging',
      appId: 'app-order-api-staging',
      title: 'Order Processing',
      version: '1.0',
      type: 'requirement',
      description: 'Testing order processing',
      status: 'implemented',
      priority: 'critical',
      entityCount: 1,
      createdAt: '2024-09-10T11:00:00Z',
      updatedAt: '2024-10-04T14:00:00Z'
    },
    {
      id: 'req-payment-integration-v1',
      appId: 'app-payment-gateway-dev',
      title: 'Payment Integration',
      version: '1.0',
      type: 'requirement',
      description: 'Stripe and PayPal integration',
      status: 'draft',
      priority: 'critical',
      entityCount: 1,
      createdAt: '2024-10-05T10:00:00Z',
      updatedAt: '2024-10-05T10:00:00Z'
    }
  ],

  entityVersions: [
    {
      id: 'entity-customer-v1',
      requirementId: 'req-customer-onboarding-v1',
      entityName: 'Customer',
      version: '1.0',
      description: 'Customer entity with basic fields',
      type: 'entityVersion',
      state: 'ACTIVE',
      workflowCount: 2,
      createdAt: '2024-09-01T10:00:00Z',
      updatedAt: '2024-09-15T14:30:00Z',
      isActive: true,
      dataFormat: 'json',
      sampleData: { id: 'cust-001', name: 'John Doe', email: 'john@example.com' }
    },
    {
      id: 'entity-customer-v2',
      requirementId: 'req-customer-onboarding-v2',
      entityName: 'Customer',
      version: '2.0',
      description: 'Enhanced customer entity',
      type: 'entityVersion',
      state: 'DRAFT',
      workflowCount: 2,
      createdAt: '2024-10-01T09:00:00Z',
      updatedAt: '2024-10-03T16:45:00Z',
      isActive: false,
      dataFormat: 'json'
    },
    {
      id: 'entity-order-v1',
      requirementId: 'req-order-processing-v1',
      entityName: 'Order',
      version: '1.0',
      description: 'Order entity for e-commerce',
      type: 'entityVersion',
      state: 'ACTIVE',
      workflowCount: 2,
      createdAt: '2024-09-10T11:00:00Z',
      updatedAt: '2024-09-28T10:30:00Z',
      isActive: true,
      dataFormat: 'json'
    },
    {
      id: 'entity-customer-v2-staging',
      requirementId: 'req-customer-onboarding-v2-staging',
      entityName: 'Customer',
      version: '2.0',
      description: 'Enhanced customer (staging)',
      type: 'entityVersion',
      state: 'ACTIVE',
      workflowCount: 2,
      createdAt: '2024-10-01T09:00:00Z',
      updatedAt: '2024-10-05T12:00:00Z',
      isActive: true,
      dataFormat: 'json'
    },
    {
      id: 'entity-order-v1-staging',
      requirementId: 'req-order-processing-v1-staging',
      entityName: 'Order',
      version: '1.0',
      description: 'Order entity (staging)',
      type: 'entityVersion',
      state: 'ACTIVE',
      workflowCount: 2,
      createdAt: '2024-09-10T11:00:00Z',
      updatedAt: '2024-10-04T14:00:00Z',
      isActive: true,
      dataFormat: 'json'
    },
    {
      id: 'entity-payment-v1',
      requirementId: 'req-payment-integration-v1',
      entityName: 'Payment',
      version: '1.0',
      description: 'Payment transaction entity',
      type: 'entityVersion',
      state: 'DRAFT',
      workflowCount: 1,
      createdAt: '2024-10-05T10:00:00Z',
      updatedAt: '2024-10-05T10:00:00Z',
      isActive: false,
      dataFormat: 'json'
    }
  ],

  workflows: [
    {
      id: 'workflow-customer-onboarding',
      entityVersionId: 'entity-customer-v1',
      name: 'Customer Onboarding',
      type: 'workflow',
      stateCount: 5,
      transitionCount: 8,
      updatedAt: '2024-09-15T14:30:00Z'
    },
    {
      id: 'workflow-customer-verification',
      entityVersionId: 'entity-customer-v1',
      name: 'KYC Verification',
      type: 'workflow',
      stateCount: 4,
      transitionCount: 6,
      updatedAt: '2024-09-20T11:20:00Z'
    },
    {
      id: 'workflow-customer-onboarding-v2',
      entityVersionId: 'entity-customer-v2',
      name: 'Enhanced Onboarding',
      type: 'workflow',
      stateCount: 7,
      transitionCount: 12,
      updatedAt: '2024-10-02T09:15:00Z'
    },
    {
      id: 'workflow-customer-verification-v2',
      entityVersionId: 'entity-customer-v2',
      name: 'Advanced KYC',
      type: 'workflow',
      stateCount: 6,
      transitionCount: 10,
      updatedAt: '2024-10-03T16:45:00Z'
    },
    {
      id: 'workflow-order-processing',
      entityVersionId: 'entity-order-v1',
      name: 'Order Processing',
      type: 'workflow',
      stateCount: 6,
      transitionCount: 9,
      updatedAt: '2024-09-25T13:00:00Z'
    },
    {
      id: 'workflow-order-fulfillment',
      entityVersionId: 'entity-order-v1',
      name: 'Order Fulfillment',
      type: 'workflow',
      stateCount: 4,
      transitionCount: 5,
      updatedAt: '2024-09-28T10:30:00Z'
    }
  ],

  code: [
    {
      id: 'code-1',
      entityVersionId: 'entity-customer-v1',
      workflowId: 'workflow-customer-onboarding',
      name: 'EmailValidator.ts',
      type: 'code',
      language: 'typescript',
      description: 'Email validation logic',
      linesOfCode: 45
    },
    {
      id: 'code-2',
      entityVersionId: 'entity-customer-v1',
      workflowId: 'workflow-customer-verification',
      name: 'KYCProcessor.ts',
      type: 'code',
      language: 'typescript',
      description: 'KYC verification processor',
      linesOfCode: 120
    },
    {
      id: 'code-3',
      entityVersionId: 'entity-order-v1',
      workflowId: 'workflow-order-processing',
      name: 'PaymentGateway.py',
      type: 'code',
      language: 'python',
      description: 'Payment processing integration',
      linesOfCode: 200
    }
  ]
};

