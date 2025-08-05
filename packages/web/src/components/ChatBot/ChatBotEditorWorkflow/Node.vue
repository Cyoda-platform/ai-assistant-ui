<template>
  <div
      class="workflow-node"
      :class="[nodeTypeClass, {
      'dimmed': shouldDimNode(nodeId),
      'hovering-delete': isHoveringDeleteBtn
    }]"
      ref="nodeRef"
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
      <div class="node-title">
        <span v-if="data.isInitial" class="node-icon initial-icon" title="Initial state">
          <PlayIcon/>
        </span>
        <span v-else-if="data.isTerminal" class="node-icon terminal-icon" title="Terminal state">
          <StopIcon/>
        </span>
        <span v-else class="node-icon default-icon" title="State">
          <CircleIcon/>
        </span>
        {{ data.label }}
      </div>
      <div class="node-actions">
        <button
            @click="editStateName"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, onMounted, onUnmounted} from 'vue'
import {Handle, Position} from '@vue-flow/core'
import {ElMessageBox} from 'element-plus'
import {useDropdownManager} from './composables/useDropdownManager'
import {useTransitionHighlight} from './composables/useTransitionHighlight'
import eventBus from '../../../plugins/eventBus'
import TrashSmallIcon from "@/assets/images/icons/trash-small.svg"
import EditIcon from '@/assets/images/icons/edit.svg';
import PlayIcon from '@/assets/images/icons/play.svg';
import CircleIcon from '@/assets/images/icons/circle.svg';
import StopIcon from '@/assets/images/icons/stop.svg';

interface NodeData {
  label: string
  transitionCount?: number
  transitions?: unknown[]
  isInitial?: boolean
  isTerminal?: boolean
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

const handleDocumentClick = (event: Event) => {
  const target = event.target as Element
  if (nodeRef.value && !nodeRef.value.contains(target)) {
    closeOnClickOutside()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})

const nodeTypeClass = computed(() => {
  if (props.data.isInitial) return 'node-initial'
  if (props.data.isTerminal) return 'node-terminal'
  return 'node-default'
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
    })
  } catch {
    // User cancelled the deletion
  }
}

const editStateName = async () => {
  try {
    const {value: newName} = await ElMessageBox.prompt(
        'Enter new state name:',
        'Edit State Name',
        {
          confirmButtonText: 'Save',
          cancelButtonText: 'Cancel',
          inputValue: props.data.label,
          inputValidator: (value: string) => {
            if (!value || value.trim() === '') {
              return 'State name cannot be empty'
            }
            if (value.trim().length < 2) {
              return 'State name must be at least 2 characters long'
            }
            return true
          },
          inputErrorMessage: 'Invalid state name'
        }
    )

    if (newName && newName.trim() !== props.data.label) {
      eventBus.$emit('rename-state', {
        oldName: props.data.label,
        newName: newName.trim()
      })
    }
  } catch {
    // User cancelled the edit
  }
}
</script>

<style scoped lang="scss">
.workflow-node {
  position: relative;
  border-radius: 8px;
  padding: 8px 12px;
  min-width: fit-content;
  width: auto;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: none;
  white-space: nowrap;
  background-color: var(--color-primary);
  opacity: 1;

  &.dimmed {
    opacity: 0.5;
  }
}

.node-title {
  color: white;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: visible;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
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
}

.edit-state-btn,
.delete-state-btn {
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
    fill: currentColor;
  }
}

.edit-state-btn:hover {
  background: rgba(24, 144, 255, 0.2);
  border-color: rgba(24, 144, 255, 0.5);
  color: rgba(24, 144, 255, 0.9);
}

.delete-state-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: rgba(239, 68, 68, 0.9);
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
