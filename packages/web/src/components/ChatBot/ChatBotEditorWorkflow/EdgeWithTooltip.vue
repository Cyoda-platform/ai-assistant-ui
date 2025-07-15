<template>
  <g class="edge-with-tooltip" :class="{ 'dimmed': shouldDimEdge }">
    <BaseEdge
      :id="id"
      :style="edgeStyle"
      :path="edgePath"
      :marker-end="markerEnd"
      :marker-start="markerStart"
    />
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, EdgeProps, getBezierPath } from '@vue-flow/core'
import { useTransitionHighlight } from './composables/useTransitionHighlight'

interface EdgeData {
  transitionData?: object
  stateName: string
  transitionName: string
}

const props = defineProps<EdgeProps<EdgeData>>()

const { highlightedTransition } = useTransitionHighlight()

const edgePath = computed(() => {
  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  })
  return path
})

// Создаем уникальный ID для перехода на основе source и target
const transitionId = computed(() => {
  return `${props.source}-${props.data?.transitionName || 'unnamed'}`
})

const shouldDimEdge = computed(() => {
  return highlightedTransition.value !== null && highlightedTransition.value !== transitionId.value
})

const edgeStyle = computed(() => {
  return {
    ...props.style,
    opacity: shouldDimEdge.value ? 0.5 : 1,
    transition: 'opacity 0.3s ease'
  }
})
</script>

<style scoped>
.edge-with-tooltip {
  position: relative;
  transition: opacity 0.3s ease;
}

.edge-with-tooltip.dimmed {
  opacity: 0.5;
}
</style>
