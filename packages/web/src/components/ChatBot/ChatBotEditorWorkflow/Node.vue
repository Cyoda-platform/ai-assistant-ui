<template>
  <div
      class="workflow-node"
      :class="[nodeTypeClass, {
      'dimmed': shouldDimNode(nodeId),
      'hovering-delete': isHoveringDeleteBtn,
      'selected': isSelected
    }]"
      :style="nodeStyle"
      ref="nodeRef"
      @mousedown="onNodeClick"
  >
    <Handle
        type="source"
        :position="Position.Left"
        id="left-source"
        class="connection-handle universal-handle"
        title="Connection point"
    />
    <Handle
        type="source"
        :position="Position.Right"
        id="right-source"
        class="connection-handle universal-handle"
        title="Connection point"
    />
    <Handle
        type="source"
        :position="Position.Top"
        id="top-source"
        class="connection-handle universal-handle"
        title="Connection point"
    />
    <Handle
        type="source"
        :position="Position.Bottom"
        id="bottom-source"
        class="connection-handle universal-handle"
        title="Connection point"
    />
    <Handle
        type="target"
        :position="Position.Left"
        id="left-target"
        class="connection-handle target-invisible"
    />
    <Handle
        type="target"
        :position="Position.Right"
        id="right-target"
        class="connection-handle target-invisible"
    />
    <Handle
        type="target"
        :position="Position.Top"
        id="top-target"
        class="connection-handle target-invisible"
    />
    <Handle
        type="target"
        :position="Position.Bottom"
        id="bottom-target"
        class="connection-handle target-invisible"
    />

    <div class="node-header">
      <div class="node-title" @click="onNodeClick" @dblclick="startInlineEdit">
        <span v-if="data.isInitial" class="node-icon initial-icon" title="Initial state">
          <PlayIcon/>
        </span>
        <span v-else-if="data.isTerminal" class="node-icon terminal-icon" title="Terminal state">
          <StopIcon/>
        </span>
        <span v-else class="node-icon default-icon" title="State">
          <CircleIcon/>
        </span>
        <span v-if="!isEditing" class="node-name">{{ data.label }}</span>
        <el-input
            v-if="isEditing"
            v-model="editingName"
            @blur="finishEdit"
            @keyup.enter="finishEdit"
            @keyup.escape="cancelEdit"
            size="small"
            class="inline-edit-input"
            ref="editInput"
        />
      </div>
      <div class="node-actions">
        <template v-if="isEditing">
          <button
              @click="finishEdit"
              class="confirm-edit-btn"
              title="Confirm changes"
          >
            <CheckIcon/>
          </button>
          <button
              @click="cancelEdit"
              class="cancel-edit-btn"
              title="Cancel editing"
          >
            <CloseSmallIcon/>
          </button>
        </template>
        <template v-else>
          <button
              @click="startInlineEdit"
              class="edit-state-btn"
              title="Edit state name"
          >
            <EditIcon/>
          </button>
          <button
              @click="deleteState"
              class="delete-state-btn"
              title="Delete state"
          >
            <TrashSmallIcon/>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, onMounted, onUnmounted, nextTick} from 'vue'
import {Handle, Position} from '@vue-flow/core'
import {ElMessageBox, ElInput} from 'element-plus'
import {useDropdownManager} from './composables/useDropdownManager'
import {useTransitionHighlight} from './composables/useTransitionHighlight'
import eventBus from '../../../plugins/eventBus'
import TrashSmallIcon from "@/assets/images/icons/trash-small.svg"
import EditIcon from '@/assets/images/icons/edit.svg';
import CheckIcon from '@/assets/images/icons/check.svg';
import CloseSmallIcon from '@/assets/images/icons/close-small.svg';
import PlayIcon from '@/assets/images/icons/play.svg';
import CircleIcon from '@/assets/images/icons/circle.svg';
import StopIcon from '@/assets/images/icons/stop.svg';

interface NodeData {
  label: string
  transitionCount?: number
  transitions?: unknown[]
  isInitial?: boolean
  isTerminal?: boolean
  nodeWidth?: number
  layoutMode?: 'horizontal' | 'vertical'
}

const props = defineProps<{
  data: NodeData,
}>()

const nodeRef = ref()

const nodeId = computed(() => props.data.label || 'unknown')
const {
  closeOnClickOutside,
} = useDropdownManager(nodeId.value)

const {
  shouldDimNode
} = useTransitionHighlight()

const isHoveringDeleteBtn = ref(false)

// Selection state
const isSelected = ref(false)
const isDragging = ref(false) // Флаг для отслеживания перетаскивания

// Inline editing state
const isEditing = ref(false)
const editingName = ref('')
const editInput = ref()

const handleDocumentClick = (event: Event) => {
  const target = event.target as Element
  if (nodeRef.value && !nodeRef.value.contains(target)) {
    closeOnClickOutside()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  eventBus.$on('node-deselected', () => {
    isSelected.value = false;
  });

  // Listen for delete node with confirm event
  eventBus.$on('delete-node-with-confirm', (eventData: { nodeId: string }) => {
    // Удаляем node если его ID совпадает с текущим
    if (eventData.nodeId === nodeId.value) {
      deleteState();
    }
  });
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)

  // Remove event listeners
  eventBus.$off('node-selected');
  eventBus.$off('node-deselected');
  eventBus.$off('delete-node-with-confirm');
})

const nodeTypeClass = computed(() => {
  if (props.data.isInitial) return 'node-initial'
  if (props.data.isTerminal) return 'node-terminal'
  return 'node-default'
})

// Computed свойство для стиля узла с автоматической шириной
const nodeStyle = computed(() => {
  const style: Record<string, string> = {}

  return style
})

const deleteState = async () => {
  try {
    await ElMessageBox.confirm(
        `Are you sure you want to delete the state "${props.data.label}"? This will also delete all transitions to and from this state.`,
        'Delete State',
        {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
    )
    eventBus.$emit('delete-state', {
      stateName: nodeId.value
    });

    // Уведомляем ChatBotEditorWorkflow об успешном удалении
    eventBus.$emit('node-deleted', nodeId.value);
  } catch {
    // Уведомляем ChatBotEditorWorkflow об отмене удаления
    eventBus.$emit('node-delete-cancelled', nodeId.value);
  }
}

// Inline editing methods
const startInlineEdit = () => {
  if (isEditing.value) return

  isEditing.value = true
  editingName.value = props.data.label

  nextTick(() => {
    if (editInput.value?.focus) {
      editInput.value.focus()
    }
  })
}

const finishEdit = () => {
  if (!isEditing.value) return

  const newName = editingName.value.trim()

  // Validate the name
  if (!newName) {
    cancelEdit()
    return
  }

  if (newName.length < 2) {
    cancelEdit()
    return
  }

  if (newName !== props.data.label) {
    eventBus.$emit('rename-state', {
      oldName: props.data.label,
      newName: newName
    })
  }

  isEditing.value = false
  editingName.value = ''
}

const cancelEdit = () => {
  isEditing.value = false
  editingName.value = ''
}

const onNodeClick = (event: MouseEvent) => {
  // Проверяем, что клик не по кнопкам
  const target = event.target as HTMLElement;
  if (target.closest('button')) {
    console.log('❌ Click ignored - clicked on button');
    return;
  }

  // Если было перетаскивание, не обрабатываем клик
  if (isDragging.value) {
    console.log('❌ Click ignored - node was dragged');
    isDragging.value = false; // Сбрасываем флаг
    return;
  }

  // При клике просто убеждаемся что узел выделен (не переключаем)
  // Снятие выделения происходит при клике в пустом месте
    eventBus.$emit('node-deselected');
    isSelected.value = true;
}
</script>

<style scoped lang="scss">
.workflow-node {
  position: relative;
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 160px; /* Минимальная ширина */
  width: fit-content; /* Автоматическая ширина по контенту */
  max-width: 400px; /* Максимальная ширина чтобы не разлетались */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: none;
  white-space: nowrap;
  background-color: var(--color-primary);
  opacity: 1;

  &.dimmed {
    opacity: 0.5;
  }

  &.selected {
    background-color: #409eff !important;
  }
}

.node-title {
  color: white;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: text;
  flex: 1;
  min-width: 0; /* Позволяет сжиматься при необходимости */

  &:hover .node-name {
    text-decoration: underline;
    cursor: pointer;
  }
}

.node-name {
  user-select: none;
}

.inline-edit-input {
  width: 150px;

  :deep(.el-input__wrapper) {
    background-color: rgba(255, 255, 255, 0.9) !important;
    border-radius: 3px;
    padding: 2px 6px;
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.3);

    .el-input__inner {
      color: #333 !important;
      font-size: 13px;
      font-weight: 600;
      padding: 0;
      height: 18px;
      line-height: 18px;
    }
  }

  :deep(.el-input__wrapper:focus) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
}

.node-icon {
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  color: white;

  &.initial-icon {
    font-weight: bold;
  }

  &.terminal-icon {
    font-weight: bold;
  }

  &.default-icon {
    font-size: 8px;
  }
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.node-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  flex-shrink: 0; /* Кнопки не сжимаются */
}

.edit-state-btn,
.delete-state-btn,
.confirm-edit-btn,
.cancel-edit-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  transition: all 0.2s ease;
  padding: 3px;

  svg {
    width: 12px;
    height: auto;

    &:hover {
      opacity: 0.5;
    }
  }
}



.node-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 8px;
  margin-top: 8px;
}

.transitions-dropdown {
  position: relative;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.transition-count {
  color: white;
  font-weight: 500;
  font-size: 12px;
}

.dropdown-arrow {
  color: white;
  font-size: 10px;
  margin-left: 8px;
  transition: transform 0.2s ease;

  &.rotated {
    transform: rotate(180deg);
  }
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  min-width: 200px;
  width: max-content;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e5e9;
  z-index: 1000;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
}

.transition-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f2f5;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 0;
  border-left: 3px solid transparent;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8f9fa;
  }

  &.highlighted {
    background-color: #e3f2fd;
    border-left: 3px solid var(--color-primary);
  }
}

.transition-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.transition-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  margin-left: 4px;
}

.change-target-btn,
.delete-transition-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.change-target-btn {
  color: black;

  &:hover {
    background-color: #1890ff;
    color: white;
  }
}

.delete-transition-btn {
  color: #dc3545;
  font-size: 16px;

  &:hover {
    background-color: #dc3545;
    color: white;
  }
}

.transition-item:hover .transition-actions {
  opacity: 1;
}

.transition-order {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 11px;
  margin-right: 8px;
  flex-shrink: 0;
}

.transition-name {
  color: #2c3e50;
  font-weight: 500;
  font-size: 12px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

.transition-direction {
  color: #6c757d;
  font-size: 11px;
  margin-left: 8px;
  flex-shrink: 0;
  white-space: nowrap;
}

:deep(.vue-flow__handle) {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 2px solid #fff;
  border-radius: 50%;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
  cursor: crosshair;
  pointer-events: none;
  z-index: 10;
  background: #722ed1;

  &.connection-handle {
    &.target-handle {
      background: #52c41a;
    }

    &.source-handle {
      background: #1890ff;
    }

    &.universal-handle {
      background: #722ed1;
    }

    &.target-invisible {
      opacity: 0 !important;
      pointer-events: auto !important;
      background: transparent;
      border: none;
      box-shadow: none;
      width: 16px;
      height: 16px;
    }

    &.secondary {
      width: 8px;
      height: 8px;
      opacity: 0.5;
    }
  }

  &.vue-flow__handle-left {
    left: -5px;
    top: 50%;
    transform: translateY(-50%);

    &:hover:not(.target-invisible) {
      background: #9254de;
    }
  }

  &.vue-flow__handle-right {
    right: -5px;
    top: 50%;
    transform: translateY(-50%);

    &:hover:not(.target-invisible) {
      background: #9254de;
    }
  }

  &.vue-flow__handle-top {
    top: -5px;
    left: 50%;
    transform: translateX(-50%);

    &:hover:not(.target-invisible) {
      background: #9254de;
    }
  }

  &.vue-flow__handle-bottom {
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);

    &:hover:not(.target-invisible) {
      background: #9254de;
    }
  }

  &.target-invisible {
    &.vue-flow__handle-left {
      left: -3px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
    }

    &.vue-flow__handle-right {
      right: -3px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
    }

    &.vue-flow__handle-top {
      top: -3px;
      left: 50%;
      transform: translateX(-50%);
      width: 18px;
      height: 18px;
    }

    &.vue-flow__handle-bottom {
      bottom: -3px;
      left: 50%;
      transform: translateX(-50%);
      width: 18px;
      height: 18px;
    }
  }
}

.vue-flow.connection-dragging .workflow-node :deep(.vue-flow__handle) {
  opacity: 0.8 !important;
  visibility: visible !important;
  pointer-events: auto !important;
  animation: pulse-universal 2s infinite;

  &.vue-flow__handle-left:not(.target-invisible) {
    transform: translateY(-50%) !important;
  }

  &.vue-flow__handle-right:not(.target-invisible) {
    transform: translateY(-50%) !important;
  }

  &.vue-flow__handle-top:not(.target-invisible) {
    transform: translateX(-50%) !important;
  }

  &.vue-flow__handle-bottom:not(.target-invisible) {
    transform: translateX(-50%) !important;
  }

  &.target-invisible {
    opacity: 0 !important;
    visibility: visible !important;
  }
}

.workflow-node:hover :deep(.vue-flow__handle) {
  opacity: 0.8;
  visibility: visible;
  pointer-events: auto;

  &.vue-flow__handle-left:not(.target-invisible) {
    transform: translateY(-50%);
  }

  &.vue-flow__handle-right:not(.target-invisible) {
    transform: translateY(-50%);
  }

  &.vue-flow__handle-top:not(.target-invisible) {
    transform: translateX(-50%);
  }

  &.vue-flow__handle-bottom:not(.target-invisible) {
    transform: translateX(-50%);
  }

  &.secondary {
    opacity: 0.6;
  }

  &.target-invisible {
    opacity: 0 !important;
    visibility: hidden !important;
  }
}

.workflow-node:hover :deep(.vue-flow__handle.source-handle) {
  animation: pulse-source 2s infinite;
}

.workflow-node:hover :deep(.vue-flow__handle.target-handle) {
  animation: pulse-target 2s infinite;
}

.workflow-node:hover :deep(.vue-flow__handle.universal-handle) {
  animation: pulse-universal 2s infinite;
}

.workflow-node.dropdown-open :deep(.vue-flow__handle),
.workflow-node.hovering-dropdown :deep(.vue-flow__handle),
.workflow-node.hovering-delete :deep(.vue-flow__handle) {
  opacity: 0 !important;
  visibility: hidden !important;
  animation: none !important;
  pointer-events: none !important;
}

@keyframes pulse-source {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(24, 144, 255, 0.1);
  }
}

@keyframes pulse-target {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(82, 196, 26, 0.1);
  }
}

@keyframes pulse-universal {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(114, 46, 209, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(114, 46, 209, 0.1);
  }
}
</style>
