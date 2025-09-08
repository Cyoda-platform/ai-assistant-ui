/**
 * Simplified layout utilities using only Dagre
 */

import { applyDagreLayout } from './dagreLayout';

export interface NodePosition {
  x: number;
  y: number;
}

export interface Transition {
  next: string;
  condition?: unknown;
  criteria?: unknown;
  criterion?: unknown;
  name?: string;
  manual?: boolean;
  processors?: Array<{
    name: string;
    config?: Record<string, unknown>;
  }>;
}

export type Transitions = Array<Transition> | Record<string, Transition>;

export interface WorkflowState {
  transitions?: Transitions;
  [key: string]: unknown;
}

export type WorkflowStates = Record<string, WorkflowState>;

// Единственная функция для layout - использует только Dagre
export async function applyAutoLayout(
  states: WorkflowStates, 
  initialState: string, 
  isVertical: boolean = false
): Promise<{
  nodePositions: { [key: string]: NodePosition };
  transitionPositions: { [key: string]: {x: number, y: number} };
}> {
  console.log('🚀 Using Dagre layout engine');
  return applyDagreLayout(states as unknown as import('./dagreLayout').WorkflowStates, initialState, isVertical);
}

// Удобная функция для явного использования Dagre (алиас)
export async function applyAutoLayoutWithDagre(
  states: WorkflowStates, 
  initialState: string, 
  isVertical: boolean = false
): Promise<{
  nodePositions: { [key: string]: NodePosition };
  transitionPositions: { [key: string]: {x: number, y: number} };
}> {
  return applyDagreLayout(states as unknown as import('./dagreLayout').WorkflowStates, initialState, isVertical);
}

// Функция для расчета позиции нового состояния (используется при добавлении состояний)
export function calculateSmartPosition(
  existingNodes: Array<{ id: string; position: NodePosition }>,
  isVertical: boolean = false
): NodePosition {
  if (existingNodes.length === 0) {
    return { x: 100, y: 100 };
  }

  // Найти самую правую/нижнюю позицию
  const positions = existingNodes.map(node => node.position);
  
  if (isVertical) {
    const maxY = Math.max(...positions.map(p => p.y));
    const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    return { x: avgX, y: maxY + 200 };
  } else {
    const maxX = Math.max(...positions.map(p => p.x));
    const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
    return { x: maxX + 300, y: avgY };
  }
}