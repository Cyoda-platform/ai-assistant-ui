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
  // Проверяем, является ли это self-loop (переход в себя)
  if (props.source === props.target) {
    // Для self-loop создаем дугу, которая выходит из правой точки и возвращается в левую
    const startX = props.sourceX
    const startY = props.sourceY
    const endX = props.targetX
    const endY = props.targetY
    
    // Радиус для self-loop дуги
    const radius = 80
    const offset = 120
    
    // Если у нас right-source и left-target (стандартная self-loop конфигурация)
    if (props.sourcePosition === 'right' && props.targetPosition === 'left') {
      // Создаем дугу справа, которая огибает узел и возвращается слева
      const controlX1 = startX + offset
      const controlY1 = startY - radius
      const controlX2 = endX - offset
      const controlY2 = endY - radius
      
      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
    }
    
    // Для других конфигураций self-loop
    if (props.sourcePosition === 'left' && props.targetPosition === 'right') {
      // Дуга слева направо
      const controlX1 = startX - offset
      const controlY1 = startY - radius
      const controlX2 = endX + offset
      const controlY2 = endY - radius
      
      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
    }
    
    if (props.sourcePosition === 'top' && props.targetPosition === 'bottom') {
      // Дуга сверху вниз
      const controlX1 = startX - radius
      const controlY1 = startY - offset
      const controlX2 = endX - radius
      const controlY2 = endY + offset
      
      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
    }
    
    if (props.sourcePosition === 'bottom' && props.targetPosition === 'top') {
      // Дуга снизу вверх
      const controlX1 = startX + radius
      const controlY1 = startY + offset
      const controlX2 = endX + radius
      const controlY2 = endY - offset
      
      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
    }
    
    // Фолбэк - дуга справа (если конфигурация не распознана)
    const controlX1 = startX + offset
    const controlY1 = startY - radius
    const controlX2 = endX - offset
    const controlY2 = endY - radius
    
    return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
  }

  // Для обычных edges используем стандартный bezier path
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
