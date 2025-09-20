<template>
  <el-dialog
      v-model="visible"
      title="Workflow Editor Help & Legend"
      width="800px"
      :modal="true"
      :close-on-click-modal="true"
      class="workflow-help-dialog"
  >
    <div class="help-content">
      <!-- Legend Section -->
      <div class="help-section">
        <h3>Legend</h3>

        <!-- Node Types -->
        <div class="legend-group">
          <h4>Node Types</h4>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-icon">
                <PlayIcon/>
              </div>
              <div class="legend-text">
                <strong>Initial State:</strong> Starting point of the workflow
              </div>
            </div>
            <div class="legend-item">
              <div class="legend-icon">
                <StopIcon/>
              </div>
              <div class="legend-text">
                <strong>End State:</strong> Terminal state (no outgoing transitions)
              </div>
            </div>
          </div>
        </div>

        <!-- Transition Types -->
        <div class="legend-group">
          <h4>Transition Lines</h4>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-icon">
                <div class="line-example solid"></div>
              </div>
              <div class="legend-text">
                <strong>Automatic Transition:</strong> Executes automatically when conditions are met
              </div>
            </div>
            <div class="legend-item">
              <div class="legend-icon">
                <div class="line-example dashed"></div>
              </div>
              <div class="legend-text">
                <strong>Manual Transition:</strong> Requires manual trigger
              </div>
            </div>
          </div>
        </div>

        <!-- Transition Indicators -->
        <div class="legend-group">
          <h4>Transition Indicators</h4>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-icon">
                <svg class="indicator-example" viewBox="0 0 16 16" fill="currentColor">
                  <path
                      d="m15.22 2.38666667a1.5 1.5 0 0 0 -1.22-2.38666667h-12a1.50666667 1.50666667 0 0 0 -1.33333333.82666667 1.48 1.48 0 0 0 .12 1.54666667l4.73333333 6.78v5.33333333a1.50666667 1.50666667 0 0 0 1.62666667 1.51333333 1.94666667 1.94666667 0 0 0 1.04666667-.27333333l1.64666667-1.02666667a1.51333333 1.51333333 0 0 0 .6-1.2v-4.34zm-6.29333333 6a.82.82 0 0 0 -.15333333.48v4.32a.33333333.33333333 0 0 1 -.16.28666667l-.94.55333333a.33333333.33333333 0 0 1 -.33333333 0 .33333333.33333333 0 0 1 -.16666667-.28666667v-4.84666667a.82666667.82666667 0 0 0 -.14666667-.47333333l-4.36-6.22666667a.34.34 0 0 1 0-.34666667.33333333.33333333 0 0 1 .3-.18h10.07333333a.33333333.33333333 0 0 1 .3.18.34.34 0 0 1 0 .34666667z"/>
                </svg>
              </div>
              <div class="legend-text">
                <strong>Criteria:</strong> Transition has conditional logic attached
              </div>
            </div>
            <div class="legend-item">
              <div class="legend-icon">
                <svg class="indicator-example" viewBox="0 0 16 16" fill="currentColor">
                  <path
                      d="m2.445 8.5575a.61125.61125 0 0 1 -.476775-.9963375l6.051375-6.23475a.305625.305625 0 0 1 .525675.281175l-1.1736 3.679725a.61125.61125 0 0 0 .574575.8251875h4.27875a.61125.61125 0 0 1 .476775.9963375l-6.051375 6.23475a.305625.305625 0 0 1 -.525675-.281175l1.1736-3.679725a.61125.61125 0 0 0 -.574575-.8251875z"/>
                </svg>
                <span class="indicator-count">2</span>
              </div>
              <div class="legend-text">
                <strong>Processors:</strong> Transition has processing logic (number shows count if more than one)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Functions Section -->
      <div class="help-section">
        <h3>Functions & Interactions</h3>

        <div class="function-group">
          <h4>Selection & Editing</h4>
          <ul class="function-list">
            <li><strong>Click on node/transition:</strong> Select for editing</li>
            <li><strong>Double-click node:</strong> Edit node properties</li>
            <li><strong>Double-click transition:</strong> Edit transition conditions and processors</li>
            <li><strong>Double-click workspace:</strong> Add new state at clicked position</li>
          </ul>
        </div>

        <div class="function-group">
          <h4>Drag & Drop Operations</h4>
          <ul class="function-list">
            <li><strong>Drag nodes:</strong> Reposition states in the workflow</li>
            <li><strong>Drag transition labels:</strong> Adjust label positioning for better readability</li>
            <li><strong>Drag from node handles:</strong> Create new transitions between states</li>
            <li><strong>Drag transition endpoints:</strong> Reassign transition source or target</li>
          </ul>
        </div>

        <div class="function-group">
          <h4>Toolbar Controls</h4>
          <ul class="function-list">
            <li><strong>Zoom In/Out:</strong> Adjust viewport scale</li>
            <li><strong>Lock/Unlock:</strong> Enable/disable interaction with nodes and transitions</li>
            <li><strong>Fit to View:</strong> Auto-zoom to show entire workflow</li>
            <li><strong>Undo/Redo:</strong> Navigate workflow edit history</li>
            <li><strong>Reset Position:</strong> Return to default viewport position</li>
            <li><strong>Layout Toggle:</strong> Switch between horizontal and vertical auto-layout</li>
            <li><strong>Add State:</strong> Insert new state node</li>
            <li><strong>Settings:</strong> Access workflow metadata and configuration</li>
          </ul>
        </div>

        <div class="function-group">
          <h4>Keyboard Shortcuts</h4>
          <ul class="function-list">
            <li><strong>Delete/Backspace:</strong> Remove selected nodes or transitions</li>
          </ul>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">Close</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import PlayIcon from '@/assets/images/icons/play.svg';
import StopIcon from '@/assets/images/icons/stop.svg';

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  visible.value = newValue
})

watch(visible, (newValue) => {
  emit('update:modelValue', newValue)
})

const closeDialog = () => {
  visible.value = false
}
</script>

<style lang="scss" scoped>
.workflow-help-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
    max-height: 70vh;
    overflow-y: auto;
  }
}

.help-content {
  font-size: 14px;
  line-height: 1.6;
}

.help-section {
  margin-bottom: 30px;

  h3 {
    color: var(--color-primary);
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
    border-bottom: 2px solid var(--color-primary);
    padding-bottom: 5px;
  }
}

.legend-group, .function-group {
  margin-bottom: 20px;

  h4 {
    color: #333;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 10px;
  }
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 24px;
  flex-shrink: 0;
}

.legend-text {
  flex: 1;

  strong {
    color: #333;
  }
}

.node-example {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-primary);

  &.circle {
    border-radius: 50%;
    background: white;
  }

  &.triangle {
    width: 0;
    height: 0;
    border: none;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 14px solid var(--color-primary);
  }

  &.square {
    border-radius: 2px;
    background: var(--color-primary);
  }
}

.line-example {
  width: 30px;
  height: 2px;
  background: var(--color-primary);

  &.solid {
    background: #666;
  }

  &.dashed {
    background: linear-gradient(to right, #666 50%, transparent 50%);
    background-size: 4px 2px;
  }

  &.highlighted {
    background: #1890ff;
    height: 3px;
  }
}

.indicator-example {
  width: 12px;
  height: 12px;
  color: #666;
}

.indicator-count {
  font-size: 10px;
  font-weight: 600;
  color: #666;
  margin-left: 2px;
}

.function-list {
  margin: 0;
  padding-left: 20px;

  li {
    margin-bottom: 8px;

    strong {
      color: #333;
    }
  }
}

.dialog-footer {
  text-align: right;
}
</style>