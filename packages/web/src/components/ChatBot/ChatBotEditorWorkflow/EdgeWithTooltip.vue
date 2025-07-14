<template>
  <g class="edge-with-tooltip">
    <BaseEdge
      :id="id"
      :style="style"
      :path="edgePath"
      :marker-end="markerEnd"
      :marker-start="markerStart"
    />

    <foreignObject
      v-if="data?.transitionData"
      :x="badgeX"
      :y="badgeY"
      width="300"
      height="30"
    >
      <div
        class="condition-badge-html"
        @click="handleBadgeClick"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
      >
        {{ data?.transitionName || 'Transition' }}
      </div>
    </foreignObject>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, EdgeProps, getBezierPath } from '@vue-flow/core'
import eventBus from "@/plugins/eventBus";

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

const badgeX = computed(() => {
  return (props.sourceX + props.targetX) / 2 - 150; // Половина от ширины foreignObject (300/2)
});

const badgeY = computed(() => {
  return (props.sourceY + props.targetY) / 2 - 15; // Центрируем по вертикали
})

function openConditionPopup() {
  eventBus.$emit('show-condition-popup', props.data);
}

function handleBadgeClick() {
  openConditionPopup()
}

function handleMouseDown(event: MouseEvent) {
  event.stopPropagation()
}

function handleMouseUp(event: MouseEvent) {
  event.stopPropagation()
}
</script>

<style scoped>
.edge-with-tooltip {
  position: relative;
}

.condition-badge-html {
  background-color: #ff6b35;
  color: white;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  text-align: center;
  white-space: nowrap;
  display: inline-block;
  min-width: 40px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.condition-badge-html:hover {
  background-color: #e55a2b;
  transform: translateX(-50%) scale(1.05);
}

.condition-editor {
  margin-bottom: 16px;
}

.condition-editor :deep(.el-textarea.is-error .el-textarea__inner) {
  border-color: #f56c6c;
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-primary {
  background-color: #409eff;
  color: white;
}

.btn-primary:hover {
  background-color: #337ab7;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
