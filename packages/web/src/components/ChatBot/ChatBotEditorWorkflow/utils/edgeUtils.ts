/**
 * Edge utilities for workflow graph
 * Handles edge creation, positioning, and handle calculation
 */

import { MarkerType } from 'reactflow';

export interface EdgeData {
  transitionData: unknown;
  stateName: string;
  transitionName: string;
  reverseTransitionData?: unknown;
  reverseStateName?: string;
  reverseTransitionName?: string;
  isBidirectional?: boolean;
  allTransitions?: Array<{ name: string, data: unknown, source: string, target: string }>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  label: string;
  animated: boolean;
  type: string;
  deletable?: boolean;
  markerEnd: {
    type: MarkerType;
    width: number;
    height: number;
    color: string;
  };
  data: EdgeData;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string;
  position: NodePosition;
}

export function calculateEdgeHandles(
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode
): { sourceHandle: string; targetHandle: string } {
  // Специальная обработка для self-loops (узел ссылается сам на себя)
  if (sourceNode.id === targetNode.id) {
    return { sourceHandle: 'right', targetHandle: 'top' };
  }

  let sourceHandle = 'right';
  let targetHandle = 'left';

  if (sourceNode && targetNode) {
    const sourceY = sourceNode.position.y;
    const targetY = targetNode.position.y;
    const sourceX = sourceNode.position.x;
    const targetX = targetNode.position.x;

    const deltaY = Math.abs(targetY - sourceY);
    const deltaX = Math.abs(targetX - sourceX);

    if (deltaY > 80 && deltaX < 200) {
      if (targetY > sourceY) {
        sourceHandle = 'bottom';
        targetHandle = 'top';
      } else {
        sourceHandle = 'top-source';
        targetHandle = 'bottom-target';
      }
    } else if (targetX < sourceX) {
      if (targetY > sourceY + 50) {
        sourceHandle = 'bottom';
        targetHandle = 'top';
      } else if (targetY < sourceY - 50) {
        sourceHandle = 'top-source';
        targetHandle = 'bottom-target';
      } else {
        sourceHandle = 'left';
        targetHandle = 'right';
      }
    }
  }

  return { sourceHandle, targetHandle };
}

export function createWorkflowEdge(
  stateName: string,
  transitionName: string,
  transitionData: unknown,
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode
): WorkflowEdge {
  const { sourceHandle, targetHandle } = calculateEdgeHandles(sourceNode, targetNode);
  const transition = transitionData as { next: string };

  return {
    id: `${stateName}-${transitionName}`,
    source: stateName,
    target: transition.next,
    sourceHandle,
    targetHandle,
    label: transitionName,
    animated: true,
    type: transitionData ? 'custom' : 'default',
    deletable: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#333',
    },
    data: {
      transitionData,
      stateName,
      transitionName,
    },
  };
}

export function generateWorkflowEdges(
  states: Record<string, unknown>,
  nodes: WorkflowNode[]
): WorkflowEdge[] {
  const result: WorkflowEdge[] = [];
  const connectionMap = new Map<string, { transitions: Array<{ name: string, data: unknown, source: string, target: string }> }>();

  for (const [stateName, stateData] of Object.entries(states)) {
    const state = stateData as { transitions?: Record<string, { next: string }> };
    if (state.transitions) {
      for (const [transitionName, transitionData] of Object.entries(state.transitions)) {
        const transition = transitionData;
        const sourceNode = nodes.find(n => n.id === stateName);
        const targetNode = nodes.find(n => n.id === transition.next);

        if (sourceNode && targetNode) {
          const connectionKey = `${stateName}->${transition.next}`;

          if (!connectionMap.has(connectionKey)) {
            connectionMap.set(connectionKey, { transitions: [] });
          }

          connectionMap.get(connectionKey)!.transitions.push({
            name: transitionName,
            data: transition,
            source: stateName,
            target: transition.next
          });
        }
      }
    }
  }

  for (const [connectionKey, connectionData] of connectionMap.entries()) {
    const [source, target] = connectionKey.split('->');
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);

    if (sourceNode && targetNode && connectionData.transitions.length > 0) {
      const firstTransition = connectionData.transitions[0];
      const { sourceHandle, targetHandle } = calculateEdgeHandles(sourceNode, targetNode);

      let label: string;
      if (connectionData.transitions.length === 1) {
        label = firstTransition.name;
      } else if (connectionData.transitions.length === 2) {
        label = `${connectionData.transitions[0].name}, ${connectionData.transitions[1].name}`;
      } else {
        label = `${connectionData.transitions[0].name}, ${connectionData.transitions[1].name}...`;
      }

      const edge: WorkflowEdge = {
        id: `${source}-${target}`,
        source,
        target,
        sourceHandle,
        targetHandle,
        label,
        animated: true,
        type: 'custom',
        deletable: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#333',
        },
        data: {
          transitionData: firstTransition.data,
          stateName: source,
          transitionName: firstTransition.name,
          allTransitions: connectionData.transitions,
        },
      };

      result.push(edge);
    }
  }

  return result;
}
