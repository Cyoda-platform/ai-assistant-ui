<template>
  <el-drawer
      class="chat-bot-canvas-vue-flow-drawer"
      title="Workflow"
      v-model="drawerVisible"
      direction="ltr"
      size="80%"
  >
    <VueFlow
        class="chat-bot-editor-workflow__vue-flow"
        :fit-view-on-init="true"
        :zoom-on-scroll="false"
        @nodeDragStop="emit('onNodeDragStop', $event)"
        v-model:nodes="nodesLocal"
        v-model:edges="edgesLocal"
        :edge-types="edgeTypes"
        :default-viewport="{ zoom: 1.5 }"
        :min-zoom="0.2"
        :max-zoom="4"
    >
      <Controls position="top-left">
        <ControlButton @click="emit('resetTransform')">
          <Icon name="reset"/>
        </ControlButton>

        <ControlButton @click="emit('autoLayout')">
          <Icon name="update"/>
        </ControlButton>

        <ControlButton @click="emit('workflowMeta')">
          <Icon name="cogs"/>
        </ControlButton>
      </Controls>
      <Background pattern-color="#aaa" :gap="16"/>
      <template #node-default="{ data }">
        <Node :data="data"/>
      </template>
    </VueFlow>
  </el-drawer>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import {VueFlow} from "@vue-flow/core";
import {Background} from "@vue-flow/background";
import Icon from "@/components/ChatBot/ChatBotEditorWorkflow/Icon.vue";
import {ControlButton, Controls} from "@vue-flow/controls";
import Node from "@/components/ChatBot/ChatBotEditorWorkflow/Node.vue";

const drawerVisible = ref(false);

defineExpose({drawerVisible});

const emit = defineEmits([
  'onNodeDragStop',
  'resetTransform',
  'autoLayout',
  'workflowMeta',
  'update:nodes',
  'update:edges'
]);

const props = defineProps<{
  nodes: any[];
  edges: any[];
  edgeTypes: any;
}>();

const nodesLocal = computed({
  get() {
    return props.nodes;
  },
  set(newValue) {
    emit('update:nodes', newValue);
  }
})

const edgesLocal = computed({
  get() {
    return props.edges;
  },
  set(newValue) {
    emit('update:edges', newValue);
  }
})
</script>

<style lang="scss">
.chat-bot-canvas-vue-flow-drawer {
  background-color: var(--bg-sidebar);

  .el-drawer__header {
    margin-bottom: 0;
  }

  .el-drawer__body {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

.chat-bot-editor-workflow__vue-flow {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;

  // Ensure nodes can be dragged properly
  .vue-flow__node {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  .vue-flow__container {
    width: 100%;
    height: 100%;
  }
}
</style>
