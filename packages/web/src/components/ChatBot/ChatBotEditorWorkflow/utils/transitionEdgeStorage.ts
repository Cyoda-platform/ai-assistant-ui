/**
 * Storage for transition edge positions and offsets
 */
import HelperStorage from '@/helpers/HelperStorage';

export interface TransitionEdgePosition {
  sourceOffset: { x: number; y: number };
  targetOffset: { x: number; y: number };
  curvature?: number;
  customPath?: Array<{ x: number; y: number }>; // Для кастомных путей
}

export interface TransitionEdgeStorage {
  [transitionId: string]: TransitionEdgePosition;
}

export class TransitionEdgePositionStorage {
  private storage: HelperStorage;
  private workflowId: string;
  private storageKey: string;

  constructor(storage: HelperStorage, workflowId: string) {
    this.storage = storage;
    this.workflowId = workflowId;
    this.storageKey = `workflow_transition_edges_${workflowId}`;
  }

  /**
   * Загружает позиции всех transition edges
   */
  loadPositions(): TransitionEdgeStorage {
    const stored = this.storage.get<TransitionEdgeStorage>(this.storageKey);
    return stored || {};
  }

  /**
   * Сохраняет позицию конкретной transition edge
   */
  saveTransitionPosition(transitionId: string, position: TransitionEdgePosition): void {
    const positions = this.loadPositions();
    positions[transitionId] = position;
    this.storage.set(this.storageKey, positions);
  }

  /**
   * Получает позицию конкретной transition edge
   */
  getTransitionPosition(transitionId: string): TransitionEdgePosition | null {
    const positions = this.loadPositions();
    return positions[transitionId] || null;
  }

  /**
   * Удаляет позицию transition edge
   */
  removeTransitionPosition(transitionId: string): void {
    const positions = this.loadPositions();
    delete positions[transitionId];
    this.storage.set(this.storageKey, positions);
  }

  /**
   * Генерирует автоматический offset для множественных transitions между одними узлами
   */
  generateAutoOffset(
    sourceNodeId: string,
    targetNodeId: string,
    transitionIndex: number,
    totalTransitions: number
  ): { sourceOffset: { x: number; y: number }; targetOffset: { x: number; y: number } } {
    // Базовое расстояние между линиями
    const baseOffset = 20;

    // Если transition единственная, никакого offset не нужно
    if (totalTransitions === 1) {
      return {
        sourceOffset: { x: 0, y: 0 },
        targetOffset: { x: 0, y: 0 }
      };
    }

    // Для множественных transitions создаем веер
    const centerIndex = (totalTransitions - 1) / 2;
    const relativeIndex = transitionIndex - centerIndex;
    const offsetValue = relativeIndex * baseOffset;

    return {
      sourceOffset: { x: 0, y: offsetValue },
      targetOffset: { x: 0, y: offsetValue }
    };
  }

  /**
   * Очищает все позиции (для сброса layout)
   */
  clearAllPositions(): void {
    this.storage.remove(this.storageKey);
  }
}
