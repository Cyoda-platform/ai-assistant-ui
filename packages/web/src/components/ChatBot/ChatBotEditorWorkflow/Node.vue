<template>
  <div
    class="workflow-node"
    :class="nodeTypeClass"
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
      <span class="transition-count">{{ transitionCount }} {{ transitionCount === 1 ? 'transition' : 'transitions' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<{
  data: any,
}>()

const nodeRef = ref()

const hasTransitions = computed(() => {
  return props.data.transitionCount > 0
})

const transitionCount = computed(() => {
  return props.data.transitionCount || 0
})

const nodeTypeClass = computed(() => {
  if (props.data.isInitial) return 'node-initial'
  if (props.data.isTerminal) return 'node-terminal'
  return 'node-default'
})
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

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
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

.transition-count {
  color: white;
  font-weight: 500;
  font-size: 12px;
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
