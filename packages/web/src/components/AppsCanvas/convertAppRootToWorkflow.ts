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

/**
 * Convert AppRoot to simplified workflow view (for new apps)
 * Shows: App name, Entities group, individual entities, and their workflows
 */
export function convertAppRootToSimplifiedWorkflow(
  appRoot: AppRoot,
  onAddNewInstance?: (groupType: string, entityId?: string) => void,
  onNodeUpdate?: (nodeId: string, nodeType: string, updatedMetadata: any) => void,
  onSendToChat?: (nodeData: any, nodeType: string) => void
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
    type: 'appNode',
    position: { x: 600, y: 50 },
    data: {
      // AppNode expects: name, description, requirementCount, version, status
      name: appRoot.app.name,
      description: appRoot.app.description,
      requirementCount: (appRoot.app.requirements?.length || 0) + (appRoot.app.requirement ? 1 : 0),
      version: appRoot.app.version,
      status: 'running' as const,
      onClick: () => console.log('App node clicked'),
      // Store full metadata for editing
      metadata: {
        type: 'appNode', // Add type to metadata for navigation
        name: appRoot.app.name,
        version: appRoot.app.version,
        author: appRoot.app.author,
        description: appRoot.app.description,
        license: appRoot.app.license,
        repository: appRoot.app.repository,
        requirement: appRoot.app.requirement
      },
      onUpdate: onNodeUpdate ? (updatedMetadata: any) => onNodeUpdate(appId, 'app', updatedMetadata) : undefined,
      onSendToChat: onSendToChat
    },
    properties: {
      color: '#9333ea', // Purple
      type: 'app'
    }
  });

  // ========================================
  // 2. ENTITIES GROUP NODE
  // ========================================
  const entitiesGroupId = 'group-entities';

  states[entitiesGroupId] = {
    name: 'Entities',
    transitions: []
  };

  layoutStates.push({
    id: entitiesGroupId,
    type: 'groupNode',
    position: { x: 600, y: 250 },
    data: {
      label: 'Entities',
      metadata: {
        groupType: 'entities',
        count: appRoot.app.entities.length,
        onAddNew: onAddNewInstance ? () => onAddNewInstance('entities') : undefined,
        onSendToChat: onSendToChat
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
    sourceHandle: 'bottom',
    targetHandle: 'top-target',
    label: ''
  });

  // ========================================
  // 3. ENTITY NODES (Under Group)
  // ========================================
  const entityStartX = 600;
  const entityStartY = 400;
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
        // EntityNode expects: entityName, version, description, state, workflowCount, requirementCount, codeCount, isActive, updatedAt
        entityName: entity.name,
        version: entity.version,
        description: entity.description,
        state: 'active',
        workflowCount: entity.workflows?.length || 0,
        requirementCount: 0,
        codeCount: 0,
        isActive: true,
        updatedAt: new Date().toISOString(),
        onClick: () => console.log('Entity node clicked:', entity.name),
        // Store full metadata for editing
        metadata: {
          type: 'entityNode', // Add type to metadata for navigation
          name: entity.name,
          version: entity.version,
          description: entity.description,
          cyoda_url: entity.cyoda_url,
          github_url: entity.github_url,
          model: entity.model
        },
        onUpdate: onNodeUpdate ? (updatedMetadata: any) => onNodeUpdate(entityId, 'entity', updatedMetadata) : undefined,
        onSendToChat: onSendToChat
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
      sourceHandle: 'bottom',
      targetHandle: 'top-target',
      label: ''
    });

    // ========================================
    // 4. WORKFLOWS GROUP NODE (For Each Entity)
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
          onAddNew: onAddNewInstance ? () => onAddNewInstance('workflows', entityId) : undefined,
          onSendToChat: onSendToChat
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
      sourceHandle: 'right',
      targetHandle: 'left-target',
      label: ''
    });

    // ========================================
    // 5. WORKFLOW NODES (Under Workflows Group)
    // ========================================
    const workflowStartX = entityStartX + 600;
    const workflowStartY = entityStartY + entityIndex * entitySpacingY;
    const workflowSpacingY = 150;

    entity.workflows.forEach((workflow, workflowIndex) => {
      const workflowId = `workflow-${workflow.name.toLowerCase().replace(/\s+/g, '-')}`;

      states[workflowId] = {
        name: workflow.name,
        transitions: []
      };

      layoutStates.push({
        id: workflowId,
        type: 'workflowNode', // Custom node type
        position: { x: workflowStartX, y: workflowStartY + workflowIndex * workflowSpacingY },
        data: {
          // WorkflowNode expects: workflowName, version, description, state, stateCount, transitionCount, isActive, updatedAt
          workflowName: workflow.name,
          version: '1.0',
          description: 'Workflow',
          state: 'active',
          stateCount: Object.keys(workflow.config?.states || {}).length,
          transitionCount: 0,
          isActive: true,
          updatedAt: new Date().toISOString(),
          onClick: () => console.log('Workflow node clicked:', workflow.name),
          // Store full metadata for editing
          metadata: {
            type: 'workflowNode', // Add type to metadata for navigation
            name: workflow.name,
            cyoda_url: workflow.cyoda_url,
            github_url: workflow.github_url,
            entity_id: entityId, // Store entity ID for navigation
            entity_name: entity.name,
            entity_version: entity.version,
            states: workflow.config.states
          },
          onUpdate: onNodeUpdate ? (updatedMetadata: any) => onNodeUpdate(workflowId, 'workflow', updatedMetadata) : undefined,
          onSendToChat: onSendToChat
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
        sourceHandle: 'bottom',
        targetHandle: 'top-target',
        label: ''
      });
    });
  });

  // ========================================
  // 6. BUILD WORKFLOW DATA
  // ========================================
  return {
    id: `app-${appRoot.app.name.toLowerCase().replace(/\s+/g, '-')}`,
    entityModel: {
      modelName: appRoot.app.name,
      modelVersion: 1
    },
    configuration: {
      version: '1.0',
      name: appRoot.app.name,
      desc: appRoot.app.description,
      initialState: appId,
      active: true,
      states: states
    },
    layout: {
      workflowId: `app-${appRoot.app.name.toLowerCase().replace(/\s+/g, '-')}`,
      states: layoutStates,
      transitions: layoutTransitions,
      version: 1,
      updatedAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function convertAppRootToWorkflow(
  appRoot: AppRoot,
  onAddNewInstance?: (groupType: string, entityId?: string) => void,
  onNodeUpdate?: (nodeId: string, nodeType: string, updatedMetadata: any) => void,
  onSendToChat?: (nodeData: any, nodeType: string) => void
): UIWorkflowData {
  console.log('🔄 convertAppRootToWorkflow: Starting conversion:', {
    appName: appRoot.app.name,
    entitiesCount: appRoot.app.entities?.length || 0,
    entities: appRoot.app.entities?.map(e => ({
      id: e.id,
      name: e.name,
      version: e.version,
      workflows: e.workflows?.length || 0
    })) || []
  });

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
      // AppNode expects: name, description, requirementCount, version, status
      name: appRoot.app.name,
      description: appRoot.app.description,
      requirementCount: (appRoot.app.requirements?.length || 0) + (appRoot.app.requirement ? 1 : 0),
      version: appRoot.app.version,
      status: 'running' as const,
      onClick: () => console.log('App node clicked'),
      // Store full metadata for editing
      metadata: {
        type: 'appNode', // Add type to metadata for navigation
        name: appRoot.app.name,
        version: appRoot.app.version,
        author: appRoot.app.author,
        description: appRoot.app.description,
        license: appRoot.app.license,
        repository: appRoot.app.repository,
        requirement: appRoot.app.requirement
      },
      onUpdate: onNodeUpdate ? (updatedMetadata: any) => onNodeUpdate(appId, 'app', updatedMetadata) : undefined,
      onSendToChat: onSendToChat
    },
    properties: {
      color: '#9333ea', // Purple
      type: 'app'
    }
  });

  // ========================================
  // 2. ENTITIES GROUP NODE
  // ========================================
  const entitiesGroupId = 'group-entities';

  states[entitiesGroupId] = {
    name: 'Entities',
    transitions: []
  };

  layoutStates.push({
    id: entitiesGroupId,
    type: 'groupNode',
    position: { x: 600, y: 200 },
    data: {
      label: 'Entities',
      metadata: {
        groupType: 'entities',
        count: appRoot.app.entities.length,
        onAddNew: onAddNewInstance ? () => onAddNewInstance('entities') : undefined,
        onSendToChat: onSendToChat
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
    sourceHandle: 'bottom',
    targetHandle: 'top-target',
    label: ''
  });

  // ========================================
  // 3. ENTITY NODES (Under Group)
  // ========================================
  const entityStartX = 200; // Move much closer to the left for visibility
  const entityStartY = 300; // Move up slightly
  const entitySpacingY = 200; // Reduce spacing between entities

  appRoot.app.entities.forEach((entity, entityIndex) => {
    const entityId = `entity-${entity.name.toLowerCase().replace(/\s+/g, '-')}-${entity.version.toLowerCase().replace(/\s+/g, '-')}`;

    console.log('🔧 convertAppRootToWorkflow: Processing entity:', {
      entityIndex,
      entityId,
      entityName: entity.name,
      entityVersion: entity.version,
      workflowsCount: entity.workflows?.length || 0
    });

    states[entityId] = {
      name: entity.name,
      transitions: []
    };

    layoutStates.push({
      id: entityId,
      type: 'entityNode', // Custom node type
      position: { x: entityStartX, y: entityStartY + entityIndex * entitySpacingY },
      data: {
        // EntityNode expects: entityName, version, description, state, workflowCount, requirementCount, codeCount, isActive, updatedAt
        entityName: entity.name,
        version: entity.version,
        description: entity.description,
        state: 'active',
        workflowCount: entity.workflows?.length || 0,
        requirementCount: 0,
        codeCount: 0,
        isActive: true,
        updatedAt: new Date().toISOString(),
        onClick: () => console.log('Entity node clicked:', entity.name),
        // Store full metadata for editing
        metadata: {
          type: 'entityNode', // Add type to metadata for navigation
          name: entity.name,
          version: entity.version,
          description: entity.description,
          cyoda_url: entity.cyoda_url,
          github_url: entity.github_url,
          model: entity.model
        },
        onUpdate: onNodeUpdate ? (updatedMetadata: any) => onNodeUpdate(entityId, 'entity', updatedMetadata) : undefined,
        onSendToChat: onSendToChat
      },
      properties: {
        color: '#3b82f6', // Blue
        type: 'entity'
      }
    });

    console.log('✅ convertAppRootToWorkflow: Created entity layout node:', {
      entityId,
      entityName: entity.name,
      position: { x: entityStartX, y: entityStartY + entityIndex * entitySpacingY },
      type: 'entityNode',
      workflowCount: entity.workflows?.length || 0
    });

    // Edge: Entities Group → Entity
    layoutTransitions.push({
      id: `${entitiesGroupId}-to-${entityId}`,
      source: entitiesGroupId,
      target: entityId,
      sourceHandle: 'bottom',
      targetHandle: 'top-target',
      label: ''
    });

    // ========================================
    // 4. WORKFLOWS GROUP NODE (For Each Entity)
    // ========================================
    const workflowsGroupId = `group-workflows-${entityId}`;

    states[workflowsGroupId] = {
      name: 'Workflows',
      transitions: []
    };

    layoutStates.push({
      id: workflowsGroupId,
      type: 'groupNode',
      position: { x: entityStartX + 250, y: entityStartY + entityIndex * entitySpacingY },
      data: {
        label: 'Workflows',
        metadata: {
          groupType: 'workflows',
          count: entity.workflows.length,
          onAddNew: onAddNewInstance ? () => onAddNewInstance('workflows', entityId) : undefined,
          onSendToChat: onSendToChat
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
      sourceHandle: 'right',
      targetHandle: 'left-target',
      label: ''
    });

    // ========================================
    // 5. WORKFLOW NODES (Under Workflows Group)
    // ========================================
    const workflowStartX = entityStartX + 250;
    const workflowStartY = entityStartY + entityIndex * entitySpacingY + 100;
    const workflowSpacingY = 150;

    entity.workflows.forEach((workflow, workflowIndex) => {
      const workflowId = `workflow-${workflow.name.toLowerCase().replace(/\s+/g, '-')}`;

      // Count states in workflow
      const stateCount = Object.keys(workflow.config.states).length;

      states[workflowId] = {
        name: workflow.name,
        transitions: []
      };

      console.log(`📝 Creating workflow node "${workflow.name}" for entity "${entity.name}":`, {
        workflowId,
        entityId,
        entity_name: entity.name,
        entity_version: entity.version
      });

      // Count transitions in workflow
      let transitionCount = 0;
      Object.values(workflow.config.states).forEach((state: any) => {
        if (state.transitions) {
          transitionCount += state.transitions.length;
        }
      });

      layoutStates.push({
        id: workflowId,
        type: 'workflowNode', // Custom node type
        position: {
          x: workflowStartX,
          y: workflowStartY + workflowIndex * workflowSpacingY
        },
        data: {
          // WorkflowNode expects: name, stateCount, transitionCount, updatedAt
          name: workflow.name,
          stateCount: stateCount,
          transitionCount: transitionCount,
          updatedAt: new Date().toISOString(),
          onClick: () => console.log('Workflow node clicked:', workflow.name),
          onEdit: () => console.log('Workflow node edit:', workflow.name),
          // Store full metadata for editing
          metadata: {
            type: 'workflowNode', // Add type to metadata for navigation
            name: workflow.name,
            entity_id: entityId, // Store entity ID for workflow association
            entity_name: entity.name, // Store entity name for reference
            entity_version: entity.version, // Store entity version for reference
            cyoda_url: workflow.cyoda_url,
            github_url: workflow.github_url,
            stateCount: stateCount,
            states: workflow.config.states
          },
          onUpdate: onNodeUpdate ? (updatedMetadata: any) => onNodeUpdate(workflowId, 'workflow', updatedMetadata) : undefined,
          onSendToChat: onSendToChat
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
        sourceHandle: 'bottom',
        targetHandle: 'top-target',
        label: ''
      });
    });
  });

  // ========================================
  // 6. BUILD WORKFLOW DATA
  // ========================================
  const result = {
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

  return result;
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

