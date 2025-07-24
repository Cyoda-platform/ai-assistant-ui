<template>
  <div
    class="workflow-node"
    :class="[nodeTypeClass, { 
      'dimmed': shouldDimNode(nodeId),
      'dropdown-open': isDropdownOpen,
      'hovering-dropdown': isHoveringDropdown,
      'hovering-delete': isHoveringDeleteBtn
    }]"
    ref="nodeRef"
  >
    <!-- Universal connection points - one handle per side that works as both source and target -->
    
    <!-- Left side handle -->
    <Handle 
      type="source" 
      :position="Position.Left" 
      id="left-source" 
      class="connection-handle universal-handle"
      title="Connection point"
    />
    
    <!-- Right side handle -->
    <Handle 
      type="source" 
      :position="Position.Right" 
      id="right-source" 
      class="connection-handle universal-handle"
      title="Connection point"
    />
    
    <!-- Top side handle -->
    <Handle 
      type="source" 
      :position="Position.Top" 
      id="top-source" 
      class="connection-handle universal-handle"
      title="Connection point"
    />
    
    <!-- Bottom side handle -->
    <Handle 
      type="source" 
      :position="Position.Bottom" 
      id="bottom-source" 
      class="connection-handle universal-handle"
      title="Connection point"
    />

    <!-- Target handles (invisible, for accepting connections) -->
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
      <div class="node-title">{{ data.label }}</div>
      <button 
        class="delete-state-btn" 
        @click.stop="deleteState"
        @mouseenter="isHoveringDeleteBtn = true"
        @mouseleave="isHoveringDeleteBtn = false"
        title="Delete state"
      >
        ×
      </button>
    </div>
    <div class="node-footer" v-if="hasTransitions">
      <div 
        class="transitions-dropdown" 
        :class="{ 'expanded': isDropdownOpen }"
        @mouseenter="isHoveringDropdown = true"
        @mouseleave="isHoveringDropdown = false"
      >
        <div class="dropdown-trigger" @click="toggleDropdown">
          <span class="transition-count">{{ transitionCount }} {{ transitionCount === 1 ? 'transition' : 'transitions' }}</span>
          <span class="dropdown-arrow" :class="{ 'rotated': isDropdownOpen }">▼</span>
        </div>

        <div class="dropdown-content" v-show="isDropdownOpen">
          <div
            v-for="(transition, index) in transitions"
            :key="transition.id"
            class="transition-item"
            :class="{ 'highlighted': isTransitionHighlighted(transition.id) }"
          >
            <div class="transition-content" @click="editTransition(transition)" @mouseenter="handleTransitionHover(transition)" @mouseleave="handleTransitionLeave">
              <span class="transition-order">{{ index + 1 }}.</span>
              <span class="transition-name">{{ transition.name || 'Unnamed' }}</span>
              <span class="transition-direction">→ {{ transition.direction }}</span>
            </div>
            <div class="transition-actions">
              <button 
                class="change-target-btn" 
                @click.stop="changeTransitionTarget(transition)"
                title="Change target node"
              >
                🔗
              </button>
              <button 
                class="delete-transition-btn" 
                @click.stop="deleteTransition(transition)"
                title="Delete transition"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, h } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { ElMessageBox, ElSelect, ElOption } from 'element-plus'
import { useDropdownManager } from './composables/useDropdownManager'
import { useTransitionHighlight } from './composables/useTransitionHighlight'
import eventBus from '../../../plugins/eventBus'

interface Transition {
  id: string
  name?: string
  direction: string
  fullData?: unknown
}

interface NodeData {
  label: string
  transitionCount?: number
  transitions?: Transition[]
  isInitial?: boolean
  isTerminal?: boolean
}

const props = defineProps<{
  data: NodeData,
}>()

const nodeRef = ref()
const isHoveringDropdown = ref(false)

const nodeId = computed(() => props.data.label || 'unknown')
const {
  isOpen: isDropdownOpen,
  toggleDropdown,
  updateState,
  closeOnClickOutside,
  activeDropdownId
} = useDropdownManager(nodeId.value)

const {
  setHighlight,
  clearHighlight,
  isTransitionHighlighted,
  shouldDimNode
} = useTransitionHighlight()

// Состояние для отслеживания hover на кнопке удаления
const isHoveringDeleteBtn = ref(false)

watch(activeDropdownId, () => {
  updateState()
})

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

const hasTransitions = computed(() => {
  return (props.data.transitionCount || 0) > 0
})

const transitionCount = computed(() => {
  return props.data.transitionCount || 0
})

const transitions = computed(() => {
  return props.data.transitions || []
})

const nodeTypeClass = computed(() => {
  if (props.data.isInitial) return 'node-initial'
  if (props.data.isTerminal) return 'node-terminal'
  return 'node-default'
})

const editTransition = (transition: Transition) => {
  closeOnClickOutside()

  const stateName = nodeId.value

  const transitionData = transition.fullData || {
    id: transition.name,
    next: transition.direction
  }

  eventBus.$emit('show-condition-popup', {
    stateName: stateName,
    transitionName: transition.name,
    transitionData: transitionData
  })
}

const deleteTransition = async (transition: Transition) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete the transition "${transition.name || 'Unnamed'}"?`,
      'Delete Transition',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    // Emit event to delete transition
    eventBus.$emit('delete-transition', {
      stateName: nodeId.value,
      transitionName: transition.name
    })
  } catch {
    // User cancelled the deletion
  }
}

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
    
    // Emit event to delete state
    eventBus.$emit('delete-state', {
      stateName: nodeId.value
    })
  } catch {
    // User cancelled the deletion
  }
}

const changeTransitionTarget = async (transition: Transition) => {
  // Получаем список всех доступных нод из родительского компонента
  eventBus.$emit('get-available-nodes', {
    currentTransition: transition,
    callback: async (availableNodes: string[]) => {
      if (availableNodes.length === 0) {
        ElMessageBox.alert('No other nodes available', 'Change Target Node', {
          type: 'warning'
        })
        return
      }

      try {
        const selectedValue = ref(transition.direction)

        await ElMessageBox({
          title: 'Change Target Node',
          message: () => h('div', [
            h('p', { style: { marginBottom: '15px' } }, 
              `Select the new target node for transition "${transition.name || 'Unnamed'}":`
            ),
            h(ElSelect, {
              modelValue: selectedValue.value,
              'onUpdate:modelValue': (value: string) => {
                selectedValue.value = value
              },
              placeholder: 'Select target node',
              style: { width: '100%' },
              filterable: true,
            }, {
              default: () => availableNodes.map(nodeName => 
                h(ElOption, {
                  key: nodeName,
                  label: nodeName,
                  value: nodeName
                })
              )
            })
          ]),
          showCancelButton: true,
          confirmButtonText: 'Change',
          cancelButtonText: 'Cancel',
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (instance as any).inputValue = selectedValue.value
            }
            done()
          }
        })
        
        if (selectedValue.value && selectedValue.value !== transition.direction) {
          // Emit event to change transition target
          eventBus.$emit('change-transition-target', {
            stateName: nodeId.value,
            transitionName: transition.name,
            newTarget: selectedValue.value
          })
        }
      } catch {
        // User cancelled the change
      }
    }
  })
}

const handleTransitionHover = (transition: Transition) => {
  const targetNodeId = transition.direction
  setHighlight(transition.id, nodeId.value, targetNodeId)
}

const handleTransitionLeave = () => {
  clearHighlight()
}
</script>

<style scoped lang="scss">
.workflow-node {
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

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

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
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

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
  margin-left: 8px;
  
  &:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
    color: rgba(239, 68, 68, 0.9);
    transform: scale(1.1);
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
  color: #1890ff;
  
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
  width: 10px;
  height: 10px;
  border: 2px solid #fff;
  border-radius: 50%;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  cursor: crosshair;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.3);
  pointer-events: none;

  &.connection-handle {
    &.target-handle {
      background: #52c41a;
      
      &:hover {
        background: #73d13d;
        box-shadow: 0 0 12px rgba(82, 196, 26, 0.6);
      }
    }

    &.source-handle {
      background: #1890ff;
      
      &:hover {
        background: #40a9ff;
        box-shadow: 0 0 12px rgba(24, 144, 255, 0.6);
      }
    }

    &.universal-handle {
      background: #722ed1;
      
      &:hover {
        background: #9254de;
        box-shadow: 0 0 12px rgba(114, 46, 209, 0.6);
      }
    }

    &.target-invisible {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: auto;
      background: transparent;
      border: none;
      box-shadow: none;
    }

    &.secondary {
      width: 8px;
      height: 8px;
      opacity: 0.5;
    }
  }

  &.vue-flow__handle-left {
    left: -7px;
    top: 50%;
    transform: translateY(-50%) scale(0.5);
    
    &:hover:not(.target-invisible) {
      transform: translateY(-50%) scale(1.1);
    }
  }

  &.vue-flow__handle-right {
    right: -7px;
    top: 50%;
    transform: translateY(-50%) scale(0.5);
    
    &:hover:not(.target-invisible) {
      transform: translateY(-50%) scale(1.1);
    }
  }

  &.vue-flow__handle-top {
    top: -7px;
    left: 50%;
    transform: translateX(-50%) scale(0.5);
    
    &:hover:not(.target-invisible) {
      transform: translateX(-50%) scale(1.1);
    }
  }

  &.vue-flow__handle-bottom {
    bottom: -7px;
    left: 50%;
    transform: translateX(-50%) scale(0.5);
    
    &:hover:not(.target-invisible) {
      transform: translateX(-50%) scale(1.1);
    }
  }

  // Invisible target handles should not interfere
  &.target-invisible {
    &.vue-flow__handle-left {
      transform: translateY(-50%) scale(0) !important;
    }
    &.vue-flow__handle-right {
      transform: translateY(-50%) scale(0) !important;
    }
    &.vue-flow__handle-top {
      transform: translateX(-50%) scale(0) !important;
    }
    &.vue-flow__handle-bottom {
      transform: translateX(-50%) scale(0) !important;
    }
  }
}

/* Show handles on all nodes when dragging connection */
.vue-flow.connection-dragging .workflow-node :deep(.vue-flow__handle) {
  opacity: 0.8 !important;
  visibility: visible !important;
  pointer-events: auto !important;
  animation: pulse-universal 2s infinite;
  
  &.vue-flow__handle-left:not(.target-invisible) {
    transform: translateY(-50%) scale(1) !important;
  }
  
  &.vue-flow__handle-right:not(.target-invisible) {
    transform: translateY(-50%) scale(1) !important;
  }
  
  &.vue-flow__handle-top:not(.target-invisible) {
    transform: translateX(-50%) scale(1) !important;
  }
  
  &.vue-flow__handle-bottom:not(.target-invisible) {
    transform: translateX(-50%) scale(1) !important;
  }
  
  &.target-invisible {
    opacity: 0 !important;
    visibility: hidden !important;
  }
}

.workflow-node:hover :deep(.vue-flow__handle) {
  opacity: 0.8;
  visibility: visible;
  pointer-events: auto;
  
  &.vue-flow__handle-left:not(.target-invisible) {
    transform: translateY(-50%) scale(1.1);
  }
  
  &.vue-flow__handle-right:not(.target-invisible) {
    transform: translateY(-50%) scale(1.1);
  }
  
  &.vue-flow__handle-top:not(.target-invisible) {
    transform: translateX(-50%) scale(1.1);
  }
  
  &.vue-flow__handle-bottom:not(.target-invisible) {
    transform: translateX(-50%) scale(1.1);
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

/* Hide handles when dropdown is open or being hovered */
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
