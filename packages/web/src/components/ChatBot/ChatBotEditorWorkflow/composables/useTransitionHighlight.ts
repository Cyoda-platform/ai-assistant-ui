import { ref } from 'vue'

// Глобальное состояние для подсветки переходов
const highlightedTransition = ref<string | null>(null)
const highlightedSourceNode = ref<string | null>(null)
const highlightedTargetNode = ref<string | null>(null)

export function useTransitionHighlight() {
  const setHighlight = (transitionId: string, sourceNodeId: string, targetNodeId: string) => {
    highlightedTransition.value = transitionId
    highlightedSourceNode.value = sourceNodeId
    highlightedTargetNode.value = targetNodeId
  }

  const clearHighlight = () => {
    highlightedTransition.value = null
    highlightedSourceNode.value = null
    highlightedTargetNode.value = null
  }

  const isTransitionHighlighted = (transitionId: string) => {
    return highlightedTransition.value === transitionId
  }

  const isNodeHighlighted = (nodeId: string) => {
    return highlightedSourceNode.value === nodeId || highlightedTargetNode.value === nodeId
  }

  const shouldDimNode = (nodeId: string) => {
    return highlightedTransition.value !== null && !isNodeHighlighted(nodeId)
  }

  return {
    highlightedTransition,
    highlightedSourceNode,
    highlightedTargetNode,
    setHighlight,
    clearHighlight,
    isTransitionHighlighted,
    isNodeHighlighted,
    shouldDimNode
  }
}
