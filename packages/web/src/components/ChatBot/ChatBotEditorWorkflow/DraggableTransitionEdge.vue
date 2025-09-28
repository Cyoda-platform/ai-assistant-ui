<template>
  <g
      class="draggable-transition-edge"
      :class="{
      'dimmed': shouldDimEdge,
      'highlighted': isHighlighted,
      'dragging': isDragging,
      'dragging-transition': isDraggingTransition,
      'no-draggable': !isDraggable
    }"
  @mouseenter="handleEdgeMouseEnter"
  @mouseleave="handleEdgeMouseLeave"
  >
    <path
        :id="id"
        :d="edgePath"
        :style="edgeStyle"
        :marker-end="markerEnd"
        :marker-start="markerStart"
        fill="none"
        style="cursor: default;"
    />

    <path
        :d="edgePath"
        fill="none"
        stroke="transparent"
        stroke-width="20"
        style="cursor: default;"
        @mouseenter="onPathHover"
        @mouseleave="onPathLeave"
    />

    <!-- Расширенная кликабельная область на начале edge (source) -->
    <circle
      :cx="circleSourceX"
      :cy="circleSourceY"
      r="18"
      fill="transparent"
      style="cursor: grab; pointer-events: all;"
      @mousedown="startSourceDrag"
    />
    <!-- Дополнительная хит-зона (толстый прозрачный сегмент) около начала -->
    <path
      :d="`M ${circleSourceX - 24},${circleSourceY - 24} L ${circleSourceX + 24},${circleSourceY + 24}`"
      stroke="transparent"
      stroke-width="32"
      style="pointer-events: stroke; cursor: grab;"
      @mousedown="startSourceDrag"
    />

    <!-- Расширенная кликабельная область на конце edge (target) -->
    <circle
      :cx="circleTargetX"
      :cy="circleTargetY"
      r="18"
      fill="transparent"
      style="cursor: grab; pointer-events: all;"
      @mousedown="startTargetDrag"
    />
    <!-- Дополнительная хит-зона (толстый прозрачный сегмент) около конца -->
    <path
      :d="`M ${circleTargetX - 24},${circleTargetY - 24} L ${circleTargetX + 24},${circleTargetY + 24}`"
      stroke="transparent"
      stroke-width="32"
      style="pointer-events: stroke; cursor: grab;"
      @mousedown="startTargetDrag"
    />

    <foreignObject
        :x="labelPosition.x - labelWidth/2 - 10"
        :y="labelPosition.y - 15"
        :width="labelWidth + 20"
        :height="30"
        style="overflow: visible;"
    >
    <div
      class="transition-label-container"
      :class="{ 
        'manual': isManual, 
        'auto': !isManual, 
        'selected': isSelected 
      }"
      :data-transition-id="transitionId"
      @mouseenter="isHoveringLabel = true"
      @mouseleave="isHoveringLabel = false"
      @mousedown="onLabelMouseDown"
      @click="onLabelClick"
      @dragstart.prevent
      style="margin: 0 auto; position: relative; cursor: grab;"
    >
        <div
            class="transition-label"
            @dblclick="editTransition"
            @mousedown="onLabelMouseDown"
            style="cursor: grab; user-select: none;"
        >
          <span class="transition-name">{{ originalTransitionName }}</span>
        </div>
        <div v-if="hasCriteria || hasProcessors" class="transition-indicators">
        <div v-if="hasCriteria" class="transition-indicator transition-indicator-filter">
          <FilterIcon class="indicator-icon" />
          <span v-if="criteriaCount > 1" class="indicator-count">{{ criteriaCount }}</span>
        </div>
        <div v-if="hasProcessors" class="transition-indicator transition-indicator-zap">
          <ZapIcon class="indicator-icon indicator-zap" />
          <span v-if="processorsCount > 1" class="indicator-count">{{ processorsCount }}</span>
        </div>
      </div>
      </div>
    </foreignObject>
  </g>
</template>

<script setup lang="ts">
import {computed, ref, onMounted, onUnmounted, watch, inject, type Ref} from 'vue'
import {EdgeProps, useVueFlow} from '@vue-flow/core'
import {useTransitionHighlight} from './composables/useTransitionHighlight'
import {ElMessageBox} from 'element-plus'
import eventBus from '../../../plugins/eventBus'
import FilterIcon from '@/assets/images/icons/filter.svg';
import ZapIcon from '@/assets/images/icons/zap.svg';

interface TransitionDataType {
  name?: string;
  next?: string;
  manual?: boolean;
  processors?: Array<{
    name: string;
    config?: Record<string, any>;
  }>;
  criteria?: Array<{
    type: string;
    function?: {
      name: string;
    };
    name?: string;
    operator?: string;
    parameters?: Array<{
      jsonPath: string;
      operatorType: string;
      value: any;
      type: string;
    }>;
  }>;
  criterion?: {
    type: string;
    function?: {
      name: string;
    };
    name?: string;
    operator?: string;
    parameters?: Array<{
      jsonPath: string;
      operatorType: string;
      value: any;
      type: string;
    }>;
  };

  [key: string]: unknown;
}

interface CustomEdgeData {
  sourceOffset?: { x: number; y: number }
  targetOffset?: { x: number; y: number }
  customPath?: Array<{ x: number; y: number }>
  transitionData?: TransitionDataType
  labelOffset?: { x: number; y: number }
  transitionId?: string // Уникальный ID для этого конкретного transition edge
  layoutMode?: 'horizontal' | 'vertical' // Добавляем информацию о режиме layout
  sourceStateName?: string // Название источника состояния для расчета размеров
  targetStateName?: string // Название целевого состояния для расчета размеров
  isSingleBetweenPair?: boolean // Единственный переход между парой узлов
}

const props = defineProps<EdgeProps<CustomEdgeData>>()

const isDraggable = inject<Ref<boolean>>('isDraggable', ref(true))

const {viewport} = useVueFlow()

const {
  isTransitionHighlighted,
  highlightedTransition
} = useTransitionHighlight()

const isDragging = ref(false)
const isHoveringLabel = ref(false)
const isSelected = ref(false)
const hasMoved = ref(false)
const dragOffset = ref({x: 0, y: 0})
const dragStartMouse = ref({x: 0, y: 0})
// Инициализируем savedLabelOffset из props.data.labelOffset
const savedLabelOffset = ref({
  x: props.data?.labelOffset?.x || 0, 
  y: props.data?.labelOffset?.y || 0
})

const isDraggingTransition = ref(false)
const transitionDragStart = ref({x: 0, y: 0})
const hoveredNodeId = ref<string | null>(null)
const currentMousePosition = ref({x: 0, y: 0})
const svgElementRef = ref<SVGSVGElement | null>(null)
const dragType = ref<'source' | 'target' | null>(null)

// Original transition name (may repeat across states)
const originalTransitionName = computed(() => props.data?.transitionData?.name || 'unnamed')
// Unique transition ID - use from props.data or fallback to constructed one
const transitionId = computed(() => 
  props.data?.transitionId || `${props.source}-${originalTransitionName.value}`
)

const isHighlighted = computed(() => isTransitionHighlighted(transitionId.value))
const hoveredEdgeGlobal = ref<string | null>(null)

// Computed properties for indicators
const hasProcessors = computed(() => {
  const processors = props.data?.transitionData?.processors;
  return processors && processors.length > 0;
})

const hasCriteria = computed(() => {
  const criteria = props.data?.transitionData?.criteria;
  const criterion = props.data?.transitionData?.criterion;
  return (criteria && criteria.length > 0) || criterion;
})

const processorsCount = computed(() => {
  const processors = props.data?.transitionData?.processors;
  return processors ? processors.length : 0;
})

const criteriaCount = computed(() => {
  const criteria = props.data?.transitionData?.criteria;
  const criterion = props.data?.transitionData?.criterion;
  if (criteria && criteria.length > 0) {
    return criteria.length;
  }
  return criterion ? 1 : 0;
})

// (Removed unused calculateNodeWidth helper)

// (Removed unused node dimension computations)

function handleEdgeMouseEnter() {
  eventBus.$emit('edge-hover', { edgeId: props.id })
}
function handleEdgeMouseLeave() {
  eventBus.$emit('edge-hover-clear')
}

function onEdgeHover(event: { edgeId: string }) {
  hoveredEdgeGlobal.value = event.edgeId
}
function onEdgeHoverClear() {
  hoveredEdgeGlobal.value = null
}

const shouldDimEdge = computed(() => {
  const dimBySearch = highlightedTransition.value !== null && !isHighlighted.value
  const dimByHover = hoveredEdgeGlobal.value !== null && hoveredEdgeGlobal.value !== props.id
  return dimBySearch || dimByHover
})

const edgePath = computed(() => {
  if (isDraggingTransition.value && currentMousePosition.value) {
    // В режиме перетаскивания различаем что именно двигаем: начало (source) или конец (target)
    const draggingSource = dragType.value === 'source'

    // Фактические координаты двух концов до начала drag
    const originalSourceX = props.sourceX
    const originalSourceY = props.sourceY
    const originalTargetX = props.targetX
    const originalTargetY = props.targetY

    // Во время drag один из концов следует за мышью
    const dynamicSourceX = draggingSource ? currentMousePosition.value.x : originalSourceX
    const dynamicSourceY = draggingSource ? currentMousePosition.value.y : originalSourceY
    const dynamicTargetX = draggingSource ? originalTargetX : currentMousePosition.value.x
    const dynamicTargetY = draggingSource ? originalTargetY : currentMousePosition.value.y

    const startX = dynamicSourceX
    const startY = dynamicSourceY
    const endX = dynamicTargetX
    const endY = dynamicTargetY

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
    // Динамическая петля: форма зависит от позиции label (как было ранее)
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

  // Для одиночных переходов: проверяем, смещен ли label от центра
  const isSingle = !!props.data?.isSingleBetweenPair
  if (isSingle) {
    const centerX = (sourceX + targetX) / 2
    const centerY = (sourceY + targetY) / 2
    const offsetX = Math.abs(labelX - centerX)
    const offsetY = Math.abs(labelY - centerY)
    
    // Если label близко к центру (не перетаскивали), рисуем прямую линию
    if (offsetX < 15 && offsetY < 15) {
      return `M ${sourceX},${sourceY} L ${targetX},${targetY}`
    }
  }

  // Восстанавливаем оригинальную математику, но с правильными коэффициентами
  // Формула должна обеспечить прохождение кривой через позицию лейбла
  const controlX = 2 * labelX - 0.5 * (sourceX + targetX)
  const controlY = 2 * labelY - 0.5 * (sourceY + targetY)

  const path = `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`

  return path
})

// Координаты кругов (интерактивных зон) должны отражать текущий drag конца
const circleSourceX = computed(() => {
  if (isDraggingTransition.value && dragType.value === 'source') {
    return currentMousePosition.value.x
  }
  return props.sourceX
})
const circleSourceY = computed(() => {
  if (isDraggingTransition.value && dragType.value === 'source') {
    return currentMousePosition.value.y
  }
  return props.sourceY
})
const circleTargetX = computed(() => {
  if (isDraggingTransition.value && dragType.value === 'target') {
    return currentMousePosition.value.x
  }
  return props.targetX
})
const circleTargetY = computed(() => {
  if (isDraggingTransition.value && dragType.value === 'target') {
    return currentMousePosition.value.y
  }
  return props.targetY
})

const labelPosition = computed(() => {
  if (isDraggingTransition.value && currentMousePosition.value) {
    const draggingSource = dragType.value === 'source'
    const originalSourceX = props.sourceX
    const originalSourceY = props.sourceY
    const originalTargetX = props.targetX
    const originalTargetY = props.targetY

    const dynamicSourceX = draggingSource ? currentMousePosition.value.x : originalSourceX
    const dynamicSourceY = draggingSource ? currentMousePosition.value.y : originalSourceY
    const dynamicTargetX = draggingSource ? originalTargetX : currentMousePosition.value.x
    const dynamicTargetY = draggingSource ? originalTargetY : currentMousePosition.value.y

    return {
      x: (dynamicSourceX + dynamicTargetX) / 2,
      y: (dynamicSourceY + dynamicTargetY) / 2
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

  // Точный геометрический центр как базовая позиция
  const baseLabelX = (sourceX + targetX) / 2
  const baseLabelY = (sourceY + targetY) / 2

  // Всегда применяем смещения (как сохраненные, так и текущие при перетаскивании)
  const offsetX = savedLabelOffset.value.x + dragOffset.value.x
  const offsetY = savedLabelOffset.value.y + dragOffset.value.y

  return {
    x: baseLabelX + offsetX,
    y: baseLabelY + offsetY
  }
})

const labelWidth = computed(() => {
  // Более точный расчет ширины с учетом реального размера шрифта
  const textLength = originalTransitionName.value.length
  // Увеличиваем до 9px на символ для большинства шрифтов + учитываем кириллицу
  const textWidth = textLength * 9
  const actionsWidth = 60 // место для кнопок (edit + delete)
  const padding = 24 // больше отступов для комфорта
  return Math.max(textWidth + actionsWidth + padding, 100) // минимум 100px
})

const edgeStyle = computed(() => ({
  stroke: isHighlighted.value ? '#1890ff' : '#999',
  strokeWidth: isHighlighted.value ? 2 : 1,
  strokeDasharray: isManual.value ? '5,5' : 'none', // Manual transitions dashed, automatic solid
  opacity: shouldDimEdge.value ? 0.8 : 1,
  fill: 'none',
  transition: 'opacity 0.2s ease, stroke 0.2s ease, stroke-dasharray 0.2s ease'
}))

const isManual = computed(() => !!props.data?.transitionData?.manual)

onMounted(() => {
  eventBus.$on('reset-edge-positions', handleResetEdgePositions);
  eventBus.$on('edge-hover', onEdgeHover)
  eventBus.$on('edge-hover-clear', onEdgeHoverClear)
  eventBus.$on('label-selected', handleLabelSelected)
  eventBus.$on('label-deselected', handleLabelDeselected)
  eventBus.$on('select-transition', handleSelectTransition)
  eventBus.$on('delete-transition-with-confirm', handleDeleteTransitionWithConfirm)
  
  // Добавляем обработчик клавиш для Shift (выравнивание лейбла)
  document.addEventListener('keydown', handleKeyDown)
  // Добавляем глобальный обработчик для клика в любое место
  document.addEventListener('click', handleGlobalClick)
})

// Watch for changes in props.data.labelOffset to update savedLabelOffset
watch(() => props.data?.labelOffset, (newOffset) => {
  if (newOffset && !isDragging.value) {
    savedLabelOffset.value = {
      x: newOffset.x || 0,
      y: newOffset.y || 0
    };
  }
}, { deep: true });

onUnmounted(() => {
  
  eventBus.$off('reset-edge-positions', handleResetEdgePositions);
  eventBus.$off('edge-hover', onEdgeHover)
  eventBus.$off('edge-hover-clear', onEdgeHoverClear)
  eventBus.$off('label-selected', handleLabelSelected)
  eventBus.$off('label-deselected', handleLabelDeselected)
  eventBus.$off('select-transition', handleSelectTransition)
  eventBus.$off('delete-transition-with-confirm', handleDeleteTransitionWithConfirm)
  
  // Убираем глобальные обработчики
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', handleGlobalClick)
})

function handleKeyDown(event: KeyboardEvent) {
  
  // Проверяем, что нажат Shift и этот label выделен
  if (event.key === 'Shift' && isSelected.value) {
    // Выравниваем label по прямой линии
    savedLabelOffset.value = { x: 0, y: 0 }
    
    
    // Отправляем обновление позиции
    eventBus.$emit('update-transition-label-position', {
      transitionId: transitionId.value,
      offset: savedLabelOffset.value
    })
    
    // Снимаем выделение после выравнивания
    isSelected.value = false
  }
}

function handleLabelSelected(selectedTransitionId: string) {
  // Если выделен другой label, снимаем выделение с текущего
  if (selectedTransitionId !== transitionId.value && isSelected.value) {
    isSelected.value = false;
  }
}

function handleLabelDeselected() {
  // Снимаем выделение при глобальном событии deselected
  isSelected.value = false;
}

function handleSelectTransition(eventData: { transitionId: string }) {
  // Выделяем transition если его ID совпадает с текущим
  if (eventData.transitionId === transitionId.value) {
    isSelected.value = true;
    
  }
}

function handleDeleteTransitionWithConfirm(eventData: { transitionId: string }) {
  // Удаляем transition если его ID совпадает с текущим
  if (eventData.transitionId === transitionId.value) {
    
    deleteEdge();
  }
}

function handleGlobalClick(event: MouseEvent) {
  // Если происходит перетаскивание, не сбрасываем выделение
  if (isDragging.value) {
    return;
  }
  
  // Добавляем небольшую задержку, чтобы избежать конфликта с mousedown
  setTimeout(() => {
    // Проверяем, что клик не по любому transition label
    const target = event.target as HTMLElement;
    const clickedLabel = target.closest('.transition-label-container');
    
    if (!clickedLabel) {
      // Клик вне любого label - снимаем выделение
      if (isSelected.value) {
        isSelected.value = false;
        eventBus.$emit('label-deselected');
      }
    }
  }, 0);
}

function handleResetEdgePositions() {
  savedLabelOffset.value = { x: 0, y: 0 };
  dragOffset.value = { x: 0, y: 0 };
}

watch(() => props.data?.labelOffset, (newLabelOffset) => {
  if (newLabelOffset) {
    savedLabelOffset.value = newLabelOffset;
  } else {
    savedLabelOffset.value = { x: 0, y: 0 };
  }
}, { deep: true, immediate: true });

function onLabelClick(event: MouseEvent) {
  
  // Проверяем, что клик не по кнопкам
  const target = event.target as HTMLElement;
  if (target.closest('button')) {
    return;
  }
  
  // Если было перетаскивание (движение мыши), не обрабатываем клик
  if (hasMoved.value) {
    hasMoved.value = false; // Сбрасываем флаг
    return;
  }
  
  // Если уже выделен, снимаем выделение
  if (isSelected.value) {
    isSelected.value = false;
    eventBus.$emit('label-deselected');
  } else {
    // Сначала отправляем событие о том, что выбран новый label (это сбросит другие)
    eventBus.$emit('label-selected', transitionId.value);
    // Затем выделяем текущий
    isSelected.value = true;
  }
  
  // НЕ предотвращаем всплытие - позволяем работать перетаскиванию
}

function onLabelMouseDown(event: MouseEvent) {
  // Проверяем, что клик не по кнопкам
  const target = event.target as HTMLElement;
  if (target.closest('button')) {
    return; // Игнорируем клики по кнопкам
  }
  
  startDrag(event);
}

function startDrag(event: MouseEvent) {
  if (!isDraggable.value) {
    return
  }

  isDragging.value = true
  hasMoved.value = false

  dragStartMouse.value = {x: event.clientX, y: event.clientY}

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)

  event.preventDefault()
  event.stopPropagation()
}

function onDrag(event: MouseEvent) {
  if (!isDragging.value) return

  const mouseDeltaX = event.clientX - dragStartMouse.value.x
  const mouseDeltaY = event.clientY - dragStartMouse.value.y

  // Если мышь сдвинулась больше чем на 3 пикселя, считаем это движением
  if (Math.abs(mouseDeltaX) > 3 || Math.abs(mouseDeltaY) > 3) {
    // Выделяем элемент при первом реальном движении
    if (!hasMoved.value) {
      if (!isSelected.value) {
        eventBus.$emit('label-selected', transitionId.value);
        isSelected.value = true;
      }
    }
    hasMoved.value = true
  }

  const zoom = viewport.value.zoom || 1

  dragOffset.value = {
    x: mouseDeltaX / zoom,
    y: mouseDeltaY / zoom
  }
}

function endDrag() {
  if (isDragging.value) {
    savedLabelOffset.value = {
      x: savedLabelOffset.value.x + dragOffset.value.x,
      y: savedLabelOffset.value.y + dragOffset.value.y
    }

    
    eventBus.$emit('update-transition-label-position', {
      transitionId: transitionId.value,
      offset: savedLabelOffset.value
    })

    dragOffset.value = {x: 0, y: 0}
  }

  isDragging.value = false

  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
}

function deleteEdge() {
  ElMessageBox.confirm(
      `Are you sure you want to delete the transition "${originalTransitionName.value}"?`,
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
      transitionName: originalTransitionName.value
    });
    
    // Уведомляем ChatBotEditorWorkflow об успешном удалении
    eventBus.$emit('transition-deleted', transitionId.value);
  }).catch(() => {
    // Уведомляем ChatBotEditorWorkflow об отмене удаления
    eventBus.$emit('transition-delete-cancelled', transitionId.value);
  })
}

function editTransition() {
  if (!isDraggable.value) {
    return
  }
  
  eventBus.$emit('get-transition-data', {
    stateName: props.source,
    transitionName: originalTransitionName.value,
    callback: (transitionData: object | null) => {
      eventBus.$emit('show-condition-popup', {
        id: props.id,
        source: props.source,
        target: props.target,
        stateName: props.source,
        transitionName: originalTransitionName.value,
        transitionData: transitionData || props.data?.transitionData || null
      })
    }
  })
}

function onPathHover() {
  // Path hover logic can be added here if needed
}

function onPathLeave() {
  // Path leave logic can be added here if needed
}

function startSourceDrag(event: MouseEvent) {
  dragType.value = 'source'
  startEdgeDrag(event)
}

function startTargetDrag(event: MouseEvent) {
  dragType.value = 'target'
  startEdgeDrag(event)
}

function startEdgeDrag(event: MouseEvent) {
  if (!isDraggable.value) {
    return
  }

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

  const eventName = dragType.value === 'source' ? 'transition-source-drag-start' : 'transition-target-drag-start'
  
  eventBus.$emit(eventName, {
    transitionId: transitionId.value,
    sourceNode: props.source,
    targetNode: props.target,
    transitionData: props.data?.transitionData,
    dragType: dragType.value
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

  const eventName = dragType.value === 'source' ? 'transition-source-drag' : 'transition-target-drag'

  eventBus.$emit(eventName, {
    transitionId: transitionId.value,
    mouseX: event.clientX,
    mouseY: event.clientY,
    startX: transitionDragStart.value.x,
    startY: transitionDragStart.value.y,
    dragType: dragType.value
  })
}

function endTransitionDrag(event: MouseEvent) {
  if (!isDraggingTransition.value) return

  const eventName = dragType.value === 'source' ? 'transition-source-drag-end' : 'transition-target-drag-end'

  eventBus.$emit(eventName, {
    transitionId: transitionId.value,
    sourceNode: props.source,
    targetNode: props.target,
    mouseX: event.clientX,
    mouseY: event.clientY,
    transitionData: props.data?.transitionData,
    dragType: dragType.value
  })

  // Выделяем transition label после завершения drop операции с небольшой задержкой
  // чтобы дать время для завершения всех операций перерендеринга
  setTimeout(() => {
    // Также отправляем событие для выделения через eventBus
    eventBus.$emit('select-transition', { transitionId: transitionId.value });
    
    if (!isSelected.value) {
      isSelected.value = true;
    }
  }, 50);

  isDraggingTransition.value = false
  hoveredNodeId.value = null
  svgElementRef.value = null
  dragType.value = null

  document.removeEventListener('mousemove', onTransitionDrag)
  document.removeEventListener('mouseup', endTransitionDrag)
}
</script>

<style scoped>
.draggable-transition-edge {
  cursor: default;

  &.no-draggable, &.no-draggable * {
    cursor: default !important;
    text-decoration: none !important;
  }
}

.draggable-transition-edge.dimmed {
  opacity: 0.8;
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

.draggable-transition-edge.dragging-transition {
  cursor: grabbing !important;
}

.draggable-transition-edge.dragging-transition path {
  cursor: grabbing !important;
}

.transition-label-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #d9d9d9;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 4px 8px;
  min-height: 20px;
  transition: all 0.2s ease;
  cursor: grab;
  width: fit-content;
  min-width: 80px;
}

.transition-label-container:active {
  cursor: grabbing;
}

.transition-label-container.manual {
  background: var(--workflow-transition-manual-bg, var(--color-primary-darken));
  color: var(--workflow-transition-manual-text, #fff);
  border-color: var(--workflow-transition-manual-border, var(--color-primary-darken));
}

.transition-label-container.selected {
  background: #e6f7ff;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.transition-label-container.auto .transition-label {
  color: #333;
}

.transition-label {
  font-size: 12px;
  font-weight: 500;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 16px;
  white-space: nowrap;
  background: transparent;
  border: none;
  cursor: grab;
  /* Увеличиваем область захвата */
  padding: 12px;
  margin: -4px -6px;
  
  &:active {
    cursor: grabbing;
  }
  &:hover{
    text-decoration: underline;
    cursor: pointer;
  }
}

.transition-name {
  line-height: 16px;
}

.transition-indicators {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 2px;
}

.transition-indicator {
  display: flex;
  align-items: center;
  gap: 1px;
  opacity: 0.7;
}

.transition-indicator-filter {
  color: #3662e3;
}

.transition-indicator-zap {
  color: #4ca154;
}

.indicator-icon {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
}

.indicator-zap{
  width: 10px;
  height: 10px;
}

.indicator-count {
  font-size: 8px;
  font-weight: 600;
  line-height: 1;
}

.transition-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.align-edge-btn,
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
    stroke-dashoffset: 0 !important;
  }
}

.align-edge-btn {
  background: var(--color-primary);
  color: white;

  &:hover {
    opacity: 0.8;
  }
}

.edit-edge-btn {
  background: var(--color-primary);
  color: white;

  &:hover {
    opacity: 0.8;
  }
}

.delete-edge-btn {
  background: var(--color-primary);
  color: white;

  &:hover {
    opacity: 0.8;
  }
}

.draggable-transition-edge.highlighted .transition-label-container {
  border-color: #1890ff;
}

.draggable-transition-edge.highlighted .transition-label {
  color: #1890ff;
  font-weight: 600;
}
</style>

<style>
.align-edge-btn svg *,
.edit-edge-btn svg *,
.delete-edge-btn svg *,
.indicator-icon * {
  animation: none !important;
  stroke-dasharray: none !important;
  stroke-dashoffset: 0 !important;
}
</style>
