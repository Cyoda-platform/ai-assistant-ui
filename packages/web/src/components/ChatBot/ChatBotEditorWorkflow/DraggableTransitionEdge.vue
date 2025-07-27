<template>
  <g
    class="draggable-transition-edge"
    :class="{
      'dimmed': shouldDimEdge,
      'highlighted': isHighlighted,
      'dragging': isDragging,
      'dragging-transition': isDraggingTransition
    }"
    @mousedown="onGroupMouseDown"
  >
    <path
      :id="id"
      :d="edgePath"
      :style="edgeStyle"
      :marker-end="markerEnd"
      :marker-start="markerStart"
      fill="none"
    />

    <path
      :d="edgePath"
      fill="none"
      stroke="transparent"
      stroke-width="20"
      style="cursor: grab;"
      @mousedown="startTransitionDrag"
      @mouseenter="onPathHover"
      @mouseleave="onPathLeave"
    />

    <foreignObject
      :x="labelPosition.x - labelWidth/2 - 15"
      :y="labelPosition.y - 15"
      :width="labelWidth + 30"
      :height="30"
    >
      <div
        class="transition-label-container"
        @mouseenter="isHoveringLabel = true"
        @mouseleave="isHoveringLabel = false"
      >
        <div
          class="transition-label"
          @mousedown="startDrag"
          @dragstart.prevent
        >
          {{ transitionId }}
        </div>
        <div class="transition-actions">
          <button
            class="edit-edge-btn"
            @click.stop="editTransition"
            @mousedown.stop
            title="Edit transition"
          >
            <EditIcon/>
          </button>
          <button
            class="delete-edge-btn"
            @click.stop="deleteEdge"
            @mousedown.stop
            title="Delete transition"
          >
            <TrashSmallIcon />
          </button>
        </div>
      </div>
    </foreignObject>
  </g>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { EdgeProps, useVueFlow } from '@vue-flow/core'
import { useTransitionHighlight } from './composables/useTransitionHighlight'
import { ElMessageBox } from 'element-plus'
import eventBus from '../../../plugins/eventBus'
import EditIcon from '@/assets/images/icons/edit.svg';
// @ts-expect-error SVG import
import TrashSmallIcon from "@/assets/images/icons/trash-small.svg"

// Props
interface CustomEdgeData {
  sourceOffset?: { x: number; y: number }
  targetOffset?: { x: number; y: number }
  customPath?: Array<{ x: number; y: number }>
  transitionData?: object
}

const props = defineProps<EdgeProps<CustomEdgeData>>()

// Vue Flow
const { viewport } = useVueFlow()

// Composables
const {
  isTransitionHighlighted,
  highlightedTransition
} = useTransitionHighlight()

const isDragging = ref(false)
const isHoveringLabel = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const dragStartMouse = ref({ x: 0, y: 0 })
const savedLabelOffset = ref({ x: 0, y: 0 })

const isDraggingTransition = ref(false)
const transitionDragStart = ref({ x: 0, y: 0 })
const hoveredNodeId = ref<string | null>(null)
const currentMousePosition = ref({ x: 0, y: 0 })
const svgElementRef = ref<SVGSVGElement | null>(null)

const transitionId = computed(() => props.id.split('-').pop() || props.id)

const isHighlighted = computed(() => isTransitionHighlighted(transitionId.value))
const shouldDimEdge = computed(() =>
  highlightedTransition.value !== null && !isHighlighted.value
)

const edgePath = computed(() => {
  if (isDraggingTransition.value && currentMousePosition.value) {
    const sourceX = props.sourceX
    const sourceY = props.sourceY
    const targetX = currentMousePosition.value.x
    const targetY = currentMousePosition.value.y

    const startX = sourceX
    const startY = sourceY
    const endX = targetX
    const endY = targetY

    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2

    const dx = endX - startX
    const dy = endY - startY
    const length = Math.sqrt(dx * dx + dy * dy)
    
    if (length === 0) {
      return `M ${startX},${startY} L ${endX},${endY}`
    }

    const perpX = -dy / length
    const perpY = dx / length

    const offset = Math.min(length * 0.3, 50)
    const controlX = midX + perpX * offset
    const controlY = midY + perpY * offset
    
    return `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`
  }

  const sourceX = props.sourceX
  const sourceY = props.sourceY
  const targetX = props.targetX
  const targetY = props.targetY

  if (props.source === props.target) {
    const labelX = labelPosition.value.x
    const labelY = labelPosition.value.y

    const startX = sourceX
    const startY = sourceY
    const endX = targetX
    const endY = targetY

    const controlX = 2 * labelX - 0.5 * (startX + endX)
    const controlY = 2 * labelY - 0.5 * (startY + endY)

    return `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`
  }

  const labelX = labelPosition.value.x
  const labelY = labelPosition.value.y

  const controlX = 2 * labelX - 0.5 * (sourceX + targetX)
  const controlY = 2 * labelY - 0.5 * (sourceY + targetY)

  const path = `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`

  return path
})

const labelPosition = computed(() => {
  if (isDraggingTransition.value && currentMousePosition.value) {
    const sourceX = props.sourceX
    const sourceY = props.sourceY
    const targetX = currentMousePosition.value.x
    const targetY = currentMousePosition.value.y
    
    return {
      x: (sourceX + targetX) / 2,
      y: (sourceY + targetY) / 2
    }
  }

  const sourceX = props.sourceX
  const sourceY = props.sourceY
  const targetX = props.targetX
  const targetY = props.targetY

  if (props.source === props.target) {
    const baseLabelX = sourceX + 40
    const baseLabelY = sourceY - 30

    const offsetX = savedLabelOffset.value.x + dragOffset.value.x
    const offsetY = savedLabelOffset.value.y + dragOffset.value.y

    return {
      x: baseLabelX + offsetX,
      y: baseLabelY + offsetY
    }
  }

  const baseLabelX = (sourceX + targetX) / 2
  const baseLabelY = (sourceY + targetY) / 2

  const offsetX = savedLabelOffset.value.x + dragOffset.value.x
  const offsetY = savedLabelOffset.value.y + dragOffset.value.y

  return {
    x: baseLabelX + offsetX,
    y: baseLabelY + offsetY
  }
})

const labelWidth = computed(() => Math.max(transitionId.value.length * 8 + 16, 60))

const edgeStyle = computed(() => ({
  stroke: isHighlighted.value ? '#1890ff' : '#999',
  strokeWidth: isHighlighted.value ? 2 : 1,
  opacity: shouldDimEdge.value ? 0.3 : 1,
  fill: 'none'
}))

function getLabelPositionKey() {
  return `transition-label-${transitionId.value}`
}

function loadSavedLabelPosition() {
  const key = getLabelPositionKey()
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      const position = JSON.parse(saved)
      savedLabelOffset.value = position
    } catch (e) {
      console.warn('Failed to parse saved label position:', e)
    }
  }
}

function saveLabelPosition() {
  const key = getLabelPositionKey()
  localStorage.setItem(key, JSON.stringify(savedLabelOffset.value))
}

// Инициализация при монтировании
onMounted(() => {
  loadSavedLabelPosition()
})

// Methods
function startDrag(event: MouseEvent) {
  isDragging.value = true
  
  // Используем простые экранные координаты
  dragStartMouse.value = { x: event.clientX, y: event.clientY }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)

  event.preventDefault()
  event.stopPropagation()
}

function onDrag(event: MouseEvent) {
  if (!isDragging.value) return

  // Вычисляем смещение в экранных координатах
  const mouseDeltaX = event.clientX - dragStartMouse.value.x
  const mouseDeltaY = event.clientY - dragStartMouse.value.y
  
  // Используем зум из viewport для правильного масштабирования
  const zoom = viewport.value.zoom || 1
  
  dragOffset.value = {
    x: mouseDeltaX / zoom,
    y: mouseDeltaY / zoom
  }
}

function endDrag() {
  if (isDragging.value) {
    // Добавляем текущий offset к сохранённой позиции
    savedLabelOffset.value = {
      x: savedLabelOffset.value.x + dragOffset.value.x,
      y: savedLabelOffset.value.y + dragOffset.value.y
    }

    // Сохраняем новую позицию в localStorage
    saveLabelPosition()

    // Сбрасываем временный offset
    dragOffset.value = { x: 0, y: 0 }
  }

  isDragging.value = false

  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
}

function deleteEdge() {
  ElMessageBox.confirm(
    `Are you sure you want to delete the transition "${transitionId.value}"?`,
    'Delete Transition',
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    eventBus.$emit('delete-transition', {
      stateName: props.source,
      transitionName: transitionId.value
    })
  }).catch(() => {
    console.log('Transition deletion cancelled')
  })
}

function editTransition() {
  eventBus.$emit('get-transition-data', {
    stateName: props.source,
    transitionName: transitionId.value,
    callback: (transitionData: object | null) => {
      eventBus.$emit('show-condition-popup', {
        id: props.id,
        source: props.source,
        target: props.target,
        stateName: props.source,
        transitionName: transitionId.value,
        transitionData: transitionData || props.data?.transitionData || null
      })
    }
  })
}

function onPathHover() {
  console.log('🎯 Hovering over path:', transitionId.value)
}

function onPathLeave() {
  console.log('🎯 Left path:', transitionId.value)
}

function onGroupMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('.transition-label-container') || target.closest('button')) {
    console.log('🎯 Ignoring click on label/button')
    return
  }
  startTransitionDrag(event)
}

function startTransitionDrag(event: MouseEvent) {
  isDraggingTransition.value = true

  const svgElement = (event.target as Element)?.closest('svg') as SVGSVGElement
  svgElementRef.value = svgElement
  
  if (svgElement) {
    const svgPoint = svgElement.createSVGPoint()
    svgPoint.x = event.clientX
    svgPoint.y = event.clientY
    
    const svgCoords = svgPoint.matrixTransform(svgElement.getScreenCTM()?.inverse())
    
    transitionDragStart.value = {
      x: svgCoords.x,
      y: svgCoords.y
    }
    
    currentMousePosition.value = {
      x: svgCoords.x,
      y: svgCoords.y
    }
  } else {
    transitionDragStart.value = {
      x: event.clientX,
      y: event.clientY
    }
    
    currentMousePosition.value = {
      x: event.clientX,
      y: event.clientY
    }
  }

  eventBus.$emit('transition-drag-start', {
    transitionId: transitionId.value,
    sourceNode: props.source,
    targetNode: props.target,
    transitionData: props.data?.transitionData
  })

  document.addEventListener('mousemove', onTransitionDrag)
  document.addEventListener('mouseup', endTransitionDrag)

  event.preventDefault()
  event.stopPropagation()
}

function onTransitionDrag(event: MouseEvent) {
  if (!isDraggingTransition.value) return

  const svgElement = svgElementRef.value
  if (svgElement) {
    const svgPoint = svgElement.createSVGPoint()
    svgPoint.x = event.clientX
    svgPoint.y = event.clientY

    const svgCoords = svgPoint.matrixTransform(svgElement.getScreenCTM()?.inverse())
    
    currentMousePosition.value = {
      x: svgCoords.x,
      y: svgCoords.y
    }
  } else {
    currentMousePosition.value = {
      x: event.clientX,
      y: event.clientY
    }
  }

  eventBus.$emit('transition-dragging', {
    transitionId: transitionId.value,
    mouseX: event.clientX,
    mouseY: event.clientY,
    startX: transitionDragStart.value.x,
    startY: transitionDragStart.value.y
  })
}

function endTransitionDrag(event: MouseEvent) {
  if (!isDraggingTransition.value) return

  eventBus.$emit('transition-drag-end', {
    transitionId: transitionId.value,
    sourceNode: props.source,
    targetNode: props.target,
    mouseX: event.clientX,
    mouseY: event.clientY,
    transitionData: props.data?.transitionData
  })

  isDraggingTransition.value = false
  hoveredNodeId.value = null
  svgElementRef.value = null // Очищаем ссылку на SVG

  document.removeEventListener('mousemove', onTransitionDrag)
  document.removeEventListener('mouseup', endTransitionDrag)
}
</script>

<style scoped>
.draggable-transition-edge {
  cursor: default;
}

.draggable-transition-edge.dimmed {
  opacity: 0.3;
}

.draggable-transition-edge.highlighted path {
  stroke: #1890ff !important;
  stroke-width: 3px !important;
}

.draggable-transition-edge path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.draggable-transition-edge.dragging {
  z-index: 1000;
}

.transition-label-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #d9d9d9;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 4px 8px;
  min-height: 20px;
  transition: all 0.2s ease;
}

.transition-label-container:hover {
  border-color: #1890ff;
}

.transition-label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  cursor: grab;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16px;
  white-space: nowrap;
  background: transparent;
  border: none;
}

.transition-label:active {
  cursor: grabbing;
}

.transition-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.edit-edge-btn,
.delete-edge-btn {
  border: none;
  border-radius: 3px;
  width: 18px;
  height: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 3px;

  svg {
    width: 12px;
    height: auto;
    fill: currentColor;
  }

  :deep(path) {
    animation: none !important;
    stroke-dasharray: none !important;
    stroke-dashoffset: 0 !important;
  }
}

.edit-edge-btn {
  background: #1890ff;
  color: white;

  &:hover {
    background: #40a9ff;
  }
}

.delete-edge-btn {
  background: #ff4d4f;
  color: white;

  &:hover {
    background: #ff7875;
  }
}

.draggable-transition-edge.highlighted .transition-label-container {
  border-color: #1890ff;
}

.draggable-transition-edge.highlighted .transition-label {
  color: #1890ff;
  font-weight: 600;
}

.theme-dark .transition-label-container {
  background: rgba(0, 0, 0, 0.9);
  border-color: #434343;
}

.theme-dark .transition-label {
  color: var(--text-color-regular);
}

.theme-dark .transition-label-container:hover {
  border-color: #1890ff;
}

.theme-dark .draggable-transition-edge.highlighted .transition-label-container {
  background: rgba(24, 144, 255, 0.2);
  border-color: #1890ff;
}

.theme-dark .draggable-transition-edge.highlighted .transition-label {
  color: #1890ff;
}
</style>

<style>
/* Глобальные стили для отключения анимации в кнопках */
.edit-edge-btn svg path,
.delete-edge-btn svg path {
  animation: none !important;
  stroke-dasharray: none !important;
  stroke-dashoffset: 0 !important;
}

.edit-edge-btn svg *,
.delete-edge-btn svg * {
  animation: none !important;
  stroke-dasharray: none !important;
  stroke-dashoffset: 0 !important;
}
</style>
