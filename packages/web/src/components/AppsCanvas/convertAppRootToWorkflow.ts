/**
 * Convert AppRoot data to UIWorkflowData for visualization
 *
 * Hierarchy:
 * - App Node (top center)
 *   ├── Environment Nodes (left branch)
 *   └── Entity Nodes (right branch)
 *       └── Workflow Nodes (under each entity)
 */

import type { AppRoot } from './types/appSchema';
import type { UIWorkflowData } from '../WorkflowCanvas/types/workflow';

export function convertAppRootToWorkflow(
  appRoot: AppRoot,
  onAddNewInstance?: (groupType: string, entityId?: string) => void,
  onNodeUpdate?: (nodeId: string, nodeType: string, updatedMetadata: any) => void
): UIWorkflowData {
  const states: Record<string, any> = {};
  const layoutStates: any[] = [];
  const layoutTransitions: any[] = [];

  // Generate unique IDs
  const appId = 'app-root';

  // ========================================
  // 1. APP NODE (Top Center)
  // ========================================
  states[appId] = {
    name: appRoot.app.name,
    transitions: []
  };

  layoutStates.push({
    id: appId,
    type: 'appNode', // Custom node type
    position: { x: 600, y: 50 },
    data: {
      label: appRoot.app.name,
      metadata: {
        name: appRoot.app.name,
        version: appRoot.app.version,
        author: appRoot.app.author,
        description: appRoot.app.description,
        license: appRoot.app.license,
        repository: appRoot.app.repository,
        requirement: appRoot.app.requirement
      },
      onUpdate: onNodeUpdate ? (updatedMetadata: any) => onNodeUpdate(appId, 'app', updatedMetadata) : undefined
    },
    properties: {
      color: '#9333ea', // Purple
      type: 'app'
    }
  });

  // ========================================
  // 2. ENVIRONMENTS GROUP NODE
  // ========================================
  const environmentsGroupId = 'group-environments';

  states[environmentsGroupId] = {
    name: 'Environments',
    transitions: []
  };

  layoutStates.push({
    id: environmentsGroupId,
    type: 'groupNode',
    position: { x: 200, y: 200 },
    data: {
      label: 'Environments',
      metadata: {
        groupType: 'environments',
        count: appRoot.app.environments.length,
        onAddNew: onAddNewInstance ? () => onAddNewInstance('environments') : undefined
      }
    },
    properties: {
      color: '#059669', // Dark green
      type: 'group'
    }
  });

  // Edge: App → Environments Group
  layoutTransitions.push({
    id: `${appId}-to-${environmentsGroupId}`,
    source: appId,
    target: environmentsGroupId,
    label: ''
  });

  // ========================================
  // 3. ENVIRONMENT NODES (Under Group)
  // ========================================
  const envStartX = 200;
  const envStartY = 350;
  const envSpacingY = 150;

  appRoot.app.environments.forEach((env, index) => {
    const envId = `environment-${env.name.toLowerCase().replace(/\s+/g, '-')}`;

    states[envId] = {
      name: env.name,
      transitions: []
    };

    layoutStates.push({
      id: envId,
      type: 'environmentNode', // Custom node type
      position: { x: envStartX, y: envStartY + index * envSpacingY },
      data: {
        label: env.name,
        metadata: {
          name: env.name,
          url: env.url,
          status: env.status
        },
        onUpdate: onNodeUpdate ? (updatedMetadata: any) => onNodeUpdate(envId, 'environment', updatedMetadata) : undefined
      },
      properties: {
        color: '#10b981', // Green
        type: 'environment'
      }
    });

    // Edge: Environments Group → Environment
    layoutTransitions.push({
      id: `${environmentsGroupId}-to-${envId}`,
      source: environmentsGroupId,
      target: envId,
      label: ''
    });
  });

  // ========================================
  // 4. ENTITIES GROUP NODE
  // ========================================
  const entitiesGroupId = 'group-entities';

  states[entitiesGroupId] = {
    name: 'Entities',
    transitions: []
  };

  layoutStates.push({
    id: entitiesGroupId,
    type: 'groupNode',
    position: { x: 800, y: 200 },
    data: {
      label: 'Entities',
      metadata: {
        groupType: 'entities',
        count: appRoot.app.entities.length,
        onAddNew: onAddNewInstance ? () => onAddNewInstance('entities') : undefined
      }
    },
    properties: {
      color: '#2563eb', // Dark blue
      type: 'group'
    }
  });

  // Edge: App → Entities Group
  layoutTransitions.push({
    id: `${appId}-to-${entitiesGroupId}`,
    source: appId,
    target: entitiesGroupId,
    label: ''
  });

  // ========================================
  // 5. ENTITY NODES (Under Group)
  // ========================================
  const entityStartX = 800;
  const entityStartY = 350;
  const entitySpacingY = 500;

  appRoot.app.entities.forEach((entity, entityIndex) => {
    const entityId = `entity-${entity.name.toLowerCase().replace(/\s+/g, '-')}-${entity.version.toLowerCase().replace(/\s+/g, '-')}`;

    states[entityId] = {
      name: entity.name,
      transitions: []
    };

    layoutStates.push({
      id: entityId,
      type: 'entityNode', // Custom node type
      position: { x: entityStartX, y: entityStartY + entityIndex * entitySpacingY },
      data: {
        label: `${entity.name} ${entity.version}`,
        metadata: {
          name: entity.name,
          version: entity.version,
          description: entity.description,
          cyoda_url: entity.cyoda_url,
          github_url: entity.github_url,
          model: entity.model
        },
        onUpdate: onNodeUpdate ? (updatedMetadata: any) => onNodeUpdate(entityId, 'entity', updatedMetadata) : undefined
      },
      properties: {
        color: '#3b82f6', // Blue
        type: 'entity'
      }
    });

    // Edge: Entities Group → Entity
    layoutTransitions.push({
      id: `${entitiesGroupId}-to-${entityId}`,
      source: entitiesGroupId,
      target: entityId,
      label: ''
    });

    // ========================================
    // 6. WORKFLOWS GROUP NODE (For Each Entity)
    // ========================================
    const workflowsGroupId = `group-workflows-${entityId}`;

    states[workflowsGroupId] = {
      name: 'Workflows',
      transitions: []
    };

    layoutStates.push({
      id: workflowsGroupId,
      type: 'groupNode',
      position: { x: entityStartX + 300, y: entityStartY + entityIndex * entitySpacingY },
      data: {
        label: 'Workflows',
        metadata: {
          groupType: 'workflows',
          count: entity.workflows.length,
          onAddNew: onAddNewInstance ? () => onAddNewInstance('workflows', entityId) : undefined
        }
      },
      properties: {
        color: '#d97706', // Dark orange
        type: 'group'
      }
    });

    // Edge: Entity → Workflows Group
    layoutTransitions.push({
      id: `${entityId}-to-${workflowsGroupId}`,
      source: entityId,
      target: workflowsGroupId,
      label: ''
    });

    // ========================================
    // 7. WORKFLOW NODES (Under Workflows Group)
    // ========================================
    const workflowStartX = entityStartX + 300;
    const workflowStartY = entityStartY + entityIndex * entitySpacingY + 150;
    const workflowSpacingY = 150;

    entity.workflows.forEach((workflow, workflowIndex) => {
      const workflowId = `workflow-${workflow.name.toLowerCase().replace(/\s+/g, '-')}`;

      // Count states in workflow
      const stateCount = Object.keys(workflow.config.states).length;

      states[workflowId] = {
        name: workflow.name,
        transitions: []
      };

      layoutStates.push({
        id: workflowId,
        type: 'workflowNode', // Custom node type
        position: {
          x: workflowStartX,
          y: workflowStartY + workflowIndex * workflowSpacingY
        },
        data: {
          label: workflow.name,
          metadata: {
            name: workflow.name,
            cyoda_url: workflow.cyoda_url,
            github_url: workflow.github_url,
            stateCount: stateCount,
            states: workflow.config.states
          },
          onUpdate: onNodeUpdate ? (updatedMetadata: any) => onNodeUpdate(workflowId, 'workflow', updatedMetadata) : undefined
        },
        properties: {
          color: '#f59e0b', // Orange
          type: 'workflow'
        }
      });

      // Edge: Workflows Group → Workflow
      layoutTransitions.push({
        id: `${workflowsGroupId}-to-${workflowId}`,
        source: workflowsGroupId,
        target: workflowId,
        label: ''
      });
    });
  });

  // ========================================
  // 5. BUILD WORKFLOW DATA
  // ========================================
  return {
    configuration: {
      version: '1.0',
      name: appRoot.app.name,
      desc: appRoot.app.description,
      initialState: appId,
      active: true,
      states: states
    },
    layout: {
      states: layoutStates,
      transitions: layoutTransitions
    }
  };
}

/**
 * Convert UIWorkflowData back to AppRoot
 * This is needed when the canvas is edited
 */
export function convertWorkflowToAppRoot(
  workflowData: UIWorkflowData,
  originalAppRoot: AppRoot
): AppRoot {
  // For now, return the original since we're not editing the structure yet
  // In the future, this would parse the workflow data back to AppRoot format

  // Extract updated positions from layout
  const updatedAppRoot = JSON.parse(JSON.stringify(originalAppRoot));

  // TODO: Update positions, add/remove nodes, etc.
  // For now, just return the original

  return updatedAppRoot;
}

