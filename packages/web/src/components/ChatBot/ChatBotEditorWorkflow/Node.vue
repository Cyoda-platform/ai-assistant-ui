<template>
  <div
    class="workflow-node"
    :class="[nodeTypeClass, { 'dimmed': shouldDimNode(nodeId) }]"
    ref="nodeRef"
  >
    <Handle type="target" :position="Position.Left" id="left-target" />
    <Handle type="source" :position="Position.Left" id="left-source" />
    <Handle type="target" :position="Position.Right" id="right-target" />
    <Handle type="source" :position="Position.Right" id="right-source" />
    <Handle type="target" :position="Position.Top" id="top-target" />
    <Handle type="source" :position="Position.Top" id="top-source" />
    <Handle type="target" :position="Position.Bottom" id="bottom-target" />
    <Handle type="source" :position="Position.Bottom" id="bottom-source" />

    <div class="node-title">{{ data.label }}</div>
    <div class="node-footer" v-if="hasTransitions">
      <div class="transitions-dropdown" :class="{ 'expanded': isDropdownOpen }">
        <div class="dropdown-trigger" @click="toggleDropdown">
          <span class="transition-count">{{ transitionCount }} {{ transitionCount === 1 ? 'transition' : 'transitions' }}</span>
          <span class="dropdown-arrow" :class="{ 'rotated': isDropdownOpen }">▼</span>
        </div>

        <div class="dropdown-content" v-show="isDropdownOpen">
          <div
            v-for="transition in transitions"
            :key="transition.id"
            class="transition-item"
            :class="{ 'highlighted': isTransitionHighlighted(transition.id) }"
            @click="editTransition(transition)"
            @mouseenter="handleTransitionHover(transition)"
            @mouseleave="handleTransitionLeave"
          >
            <span class="transition-name">{{ transition.name || 'Unnamed' }}</span>
            <span class="transition-direction">→ {{ transition.direction }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { Handle, Position } from '@vue-flow/core'
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
  width: 1px;
  height: 1px;
  background: transparent;
  border: none;
  opacity: 0;

  &.vue-flow__handle-left {
    left: -4px;
    top: 50%;
    transform: translateY(-50%);
  }

  &.vue-flow__handle-right {
    right: -4px;
    top: 50%;
    transform: translateY(-50%);
  }

  &.vue-flow__handle-top {
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
  }

  &.vue-flow__handle-bottom {
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
