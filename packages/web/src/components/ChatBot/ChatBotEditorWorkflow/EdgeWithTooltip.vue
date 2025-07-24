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
  allTransitions?: Array<{
    stateName: string;
    transition: {
      id: string;
      next: string;
    };
  }>;
  isBidirectional?: boolean;
}

const props = defineProps<EdgeProps<EdgeData>>()

const { highlightedTransition } = useTransitionHighlight()

const edgePath = computed(() => {
  if (props.source === props.target) {
    const startX = props.sourceX
    const startY = props.sourceY
    const endX = props.targetX
    const endY = props.targetY

    const radius = 80
    const offset = 120

    if (props.sourcePosition === 'right' && props.targetPosition === 'left') {
      const controlX1 = startX + offset
      const controlY1 = startY - radius
      const controlX2 = endX - offset
      const controlY2 = endY - radius

      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
    }

    if (props.sourcePosition === 'left' && props.targetPosition === 'right') {
      const controlX1 = startX - offset
      const controlY1 = startY - radius
      const controlX2 = endX + offset
      const controlY2 = endY - radius

      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
    }

    if (props.sourcePosition === 'top' && props.targetPosition === 'bottom') {
      const controlX1 = startX - radius
      const controlY1 = startY - offset
      const controlX2 = endX - radius
      const controlY2 = endY + offset

      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
    }

    if (props.sourcePosition === 'bottom' && props.targetPosition === 'top') {
      const controlX1 = startX + radius
      const controlY1 = startY + offset
      const controlX2 = endX + radius
      const controlY2 = endY - offset

      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
    }

    const controlX1 = startX + offset
    const controlY1 = startY - radius
    const controlX2 = endX - offset
    const controlY2 = endY - radius

    return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
  }

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

const transitionId = computed(() => {
  return `${props.source}-${props.data?.transitionName || 'unnamed'}`
})

const shouldDimEdge = computed(() => {
  if (highlightedTransition.value === null) return false;

  if (highlightedTransition.value === transitionId.value) {
    return false;
  }

  if (props.data?.allTransitions) {
    const isTransitionInThisEdge = props.data.allTransitions.some(t => {
      const tId = `${t.stateName}-${t.transition.id}`;
      return tId === highlightedTransition.value;
    });
    return !isTransitionInThisEdge;
  }
  
  return true;
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
