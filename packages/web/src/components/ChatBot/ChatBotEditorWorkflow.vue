<template>
  <div v-loading="isLoading" class="chat-bot-editor-workflow">
    <el-splitter @resize="onResize">
      <el-splitter-panel v-model:size="editorSize" class="chat-bot-editor-workflow__editor-wrapper">
        <Editor v-model="canvasData" language="javascript" class="chat-bot-editor-workflow__editor-inner"
                :actions="editorActions"/>
      </el-splitter-panel>
      <el-splitter-panel class="chat-bot-editor-workflow__flow-wrapper">
        <VueFlow
            class="chat-bot-editor-workflow__vue-flow"
            :fit-view-on-init="true"
            :zoom-on-scroll="false"
            @nodeDragStop="onNodeDragStop"
            v-model:nodes="nodes"
            v-model:edges="edges"
            :edge-types="edgeTypes"
            :default-viewport="{ zoom: 1.5 }"
            :min-zoom="0.2"
            :max-zoom="4"
        >
          <Controls position="top-left">
            <ControlButton @click="resetTransform">
              <Icon name="reset"/>
            </ControlButton>

            <ControlButton @click="autoLayout">
              <Icon name="update"/>
            </ControlButton>

            <ControlButton @click="workflowMeta">
              <Icon name="cogs"/>
            </ControlButton>
          </Controls>
          <Background pattern-color="#aaa" :gap="16"/>
          <template #node-default="{ data }">
            <Node :data="data"/>
          </template>
        </VueFlow>
      </el-splitter-panel>
    </el-splitter>
    <EditEdgeConditionalDialog/>
    <WorkflowMetaDialog @update="onUpdateWorkflowMetaDialog" ref="workflowMetaDialogRef"
                        :workflowMetaData="workflowMetaData"/>
  </div>
</template>

<script setup lang="ts">
import {templateRef} from "@vueuse/core";
import {VueFlow} from '@vue-flow/core'
import {Background} from '@vue-flow/background'
import {ControlButton, Controls} from '@vue-flow/controls'
import Editor from "@/components/Editor/Editor.vue";
import Icon from "@/components/ChatBot/ChatBotEditorWorkflow/Icon.vue";
import Node from "@/components/ChatBot/ChatBotEditorWorkflow/Node.vue";
import EdgeWithTooltip from "@/components/ChatBot/ChatBotEditorWorkflow/EdgeWithTooltip.vue";
import EditEdgeConditionalDialog from "@/components/ChatBot/ChatBotEditorWorkflow/EditEdgeConditionalDialog.vue";
import WorkflowMetaDialog from "@/components/ChatBot/ChatBotEditorWorkflow/WorkflowMetaDialog.vue";
import useAssistantStore from "@/stores/assistant";
import { useWorkflowEditor } from './ChatBotEditorWorkflow/composables/useWorkflowEditor';

const props = defineProps<{
  technicalId: string,
}>();

const assistantStore = useAssistantStore();
const workflowMetaDialogRef = templateRef('workflowMetaDialogRef');

// Use the workflow editor composable
const {
  canvasData,
  editorSize,
  isLoading,
  editorActions,
  nodes,
  edges,
  workflowMetaData,
  onNodeDragStop,
  resetTransform,
  autoLayout,
  onUpdateWorkflowMetaDialog,
  onResize,
} = useWorkflowEditor(props, assistantStore);

// Configure edge types
const edgeTypes = {
  custom: EdgeWithTooltip
};

function workflowMeta() {
  workflowMetaDialogRef.value.openDialog(workflowMetaData.value);
}
</script>

<style lang="scss">
.chat-bot-editor-workflow {
  width: 100%;
  height: calc(100vh - 81px);

  .vue-flow__controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center
  }

  &__editor-wrapper {
    padding-right: 15px;
  }

  &__flow-wrapper {
    padding-left: 15px;
  }

  &__editor-inner {
    min-height: 100%;
  }
}
</style>
