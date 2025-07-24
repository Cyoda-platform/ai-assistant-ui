/**
 * Простая система undo/redo для workflow editor
 */
import { ref, computed } from 'vue';

export function useUndoRedo(maxHistorySize = 50) {
  const history = ref<string[]>([]);
  const currentIndex = ref(-1);

  const canUndo = computed(() => currentIndex.value > 0);
  const canRedo = computed(() => currentIndex.value < history.value.length - 1);

  function saveState(data: string) {
    if (history.value.length > 0 && history.value[currentIndex.value] === data) {
      return;
    }

    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1);
    }

    history.value.push(data);

    if (history.value.length > maxHistorySize) {
      history.value = history.value.slice(-maxHistorySize);
    }

    currentIndex.value = history.value.length - 1;
  }

  function undo(): string | null {
    if (!canUndo.value) return null;

    currentIndex.value--;
    return history.value[currentIndex.value];
  }

  function redo(): string | null {
    if (!canRedo.value) return null;

    currentIndex.value++;
    return history.value[currentIndex.value];
  }

  function initialize(initialData: string) {
    history.value = [initialData];
    currentIndex.value = 0;
  }

  return {
    history,
    currentIndex,
    canUndo,
    canRedo,
    saveState,
    undo,
    redo,
    initialize
  };
}
