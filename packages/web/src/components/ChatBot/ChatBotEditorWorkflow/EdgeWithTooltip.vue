<template>
  <g class="edge-with-tooltip">
    <BaseEdge
      :id="id"
      :style="style"
      :path="edgePath"
      :marker-end="markerEnd"
      :marker-start="markerStart"
    />
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, EdgeProps, getBezierPath } from '@vue-flow/core'

interface EdgeData {
  transitionData?: object
  stateName: string
  transitionName: string
}

const props = defineProps<EdgeProps<EdgeData>>()

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
</script>

<style scoped>
.edge-with-tooltip {
  position: relative;
}
</style>
