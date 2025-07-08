/**
 * Edge utilities for workflow graph
 * Handles edge creation, positioning, and handle calculation
 */

import { MarkerType } from '@vue-flow/core';

export interface EdgeData {
  transitionData: any;
  stateName: string;
  transitionName: string;
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
  transitionData: any,
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode
): WorkflowEdge {
  const { sourceHandle, targetHandle } = calculateEdgeHandles(sourceNode, targetNode);

  return {
    id: `${stateName}-${transitionName}`,
    source: stateName,
    target: transitionData.next,
    sourceHandle,
    targetHandle,
    label: transitionName,
    animated: true,
    type: transitionData ? 'custom' : 'default',
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
  states: any,
  nodes: WorkflowNode[]
): WorkflowEdge[] {
  const result: WorkflowEdge[] = [];

  for (const [stateName, stateData] of Object.entries(states)) {
    const state = stateData as any;
    if (state.transitions) {
      for (const [transitionName, transitionData] of Object.entries(state.transitions)) {
        const transition = transitionData as any;
        const sourceNode = nodes.find(n => n.id === stateName);
        const targetNode = nodes.find(n => n.id === transition.next);

        if (sourceNode && targetNode) {
          const edge = createWorkflowEdge(
            stateName,
            transitionName,
            transition,
            sourceNode,
            targetNode
          );
          result.push(edge);
        }
      }
    }
  }

  return result;
}
