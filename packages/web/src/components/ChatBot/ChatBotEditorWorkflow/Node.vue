<template>
  <div
    class="workflow-node"
    :class="nodeTypeClass"
    ref="nodeRef"
  >
    <Handle type="target" :position="Position.Left" id="left" />
    <Handle type="source" :position="Position.Right" id="right" />
    <Handle type="target" :position="Position.Top" id="top" :style="topHandleStyle" />
    <Handle type="source" :position="Position.Bottom" id="bottom" :style="bottomHandleStyle" />
    <Handle type="target" :position="Position.Bottom" id="bottom-target" :style="bottomHandleStyle" />
    <Handle type="source" :position="Position.Top" id="top-source" :style="topHandleStyle" />

    <div class="node-title">{{ data.label }}</div>
    <div class="node-footer" v-if="hasTransitions">
      <span class="transition-count">{{ transitionCount }} {{ transitionCount === 1 ? 'transition' : 'transitions' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<{
  data: any,
}>()

const nodeRef = ref()
const nodeWidth = ref(0)

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

const updateNodeWidth = () => {
  if (nodeRef.value) {
    nodeWidth.value = nodeRef.value.offsetWidth
  }
}

const topHandleStyle = computed(() => ({
  left: nodeWidth.value ? `${nodeWidth.value / 2}px` : '50%',
  transform: nodeWidth.value ? 'translateX(-4px)' : 'translateX(-50%)',
  top: '-4px',
  position: 'absolute',
  zIndex: 10
}))

const bottomHandleStyle = computed(() => ({
  left: nodeWidth.value ? `${nodeWidth.value / 2}px` : '50%',
  transform: nodeWidth.value ? 'translateX(-4px)' : 'translateX(-50%)',
  bottom: '-4px',
  position: 'absolute',
  zIndex: 10
}))

onMounted(() => {
  nextTick(() => {
    updateNodeWidth()
  })
})

watch(() => props.data.label, () => {
  nextTick(() => {
    updateNodeWidth()
  })
})

watch(() => props.data.transitionCount, () => {
  nextTick(() => {
    updateNodeWidth()
  })
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
    left: 0;
    top: 50%;
    transform: translateY(-50%);
  }

  &.vue-flow__handle-right {
    right: 0;
    top: 50%;
    transform: translateY(-50%);
  }

  &.vue-flow__handle-top {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  &.vue-flow__handle-bottom {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>