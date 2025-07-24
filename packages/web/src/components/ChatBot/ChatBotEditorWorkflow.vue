<template>
  <div v-loading="isLoading" class="chat-bot-editor-workflow">
    <el-splitter @resize="onResize">
      <el-splitter-panel v-model:size="editorSize" class="chat-bot-editor-workflow__editor-wrapper">
        <Editor v-model="canvasData" language="json" class="chat-bot-editor-workflow__editor-inner"
                :actions="editorActions"/>
      </el-splitter-panel>
      <el-splitter-panel v-if="isShowVueFlow" class="chat-bot-editor-workflow__flow-wrapper">
        <VueFlow
            class="chat-bot-editor-workflow__vue-flow"
            :class="{ 'connection-dragging': isDraggingConnection }"
            :fit-view-on-init="true"
            :zoom-on-scroll="false"
            @nodeDragStop="onNodeDragStop"
            @connect="onConnect"
            @connectStart="onConnectStart"
            @connectEnd="onConnectEnd"
            :connection-mode="ConnectionMode.Strict"
            v-model:nodes="nodes"
            v-model:edges="edges"
            :edge-types="edgeTypes"
            :default-viewport="{ zoom: 1.5 }"
            :min-zoom="0.2"
            :max-zoom="4"
        >
          <Controls position="top-left">
            <ControlButton @click="undoAction" :disabled="!canUndo">
              <Icon name="undo"/>
            </ControlButton>
            
            <ControlButton @click="redoAction" :disabled="!canRedo">
              <Icon name="redo"/>
            </ControlButton>

            <ControlButton @click="resetTransform">
              <Icon name="reset"/>
            </ControlButton>

            <ControlButton @click="autoLayout">
              <Icon name="update"/>
            </ControlButton>

            <ControlButton @click="addNewState">
              <Icon name="plus"/>
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

    <ChatBotCanvasVueFlowDrawer
        ref="chatBotCanvasVueFlowDrawerRef"
        :nodes="nodes"
        :edges="edges"
        :edge-types="edgeTypes"
        @onNodeDragStop="onNodeDragStop"
        @onConnect="onConnect"
        @resetTransform="resetTransform"
        @autoLayout="autoLayout"
        @workflowMeta="workflowMeta"
    />
  </div>
</template>

<script setup lang="ts">
import {templateRef} from "@vueuse/core";
import {VueFlow, ConnectionMode} from '@vue-flow/core'
import {Background} from '@vue-flow/background'
import {ControlButton, Controls} from '@vue-flow/controls'
import Editor from "@/components/Editor/Editor.vue";
import Icon from "@/components/ChatBot/ChatBotEditorWorkflow/Icon.vue";
import Node from "@/components/ChatBot/ChatBotEditorWorkflow/Node.vue";
import EdgeWithTooltip from "@/components/ChatBot/ChatBotEditorWorkflow/EdgeWithTooltip.vue";
import EditEdgeConditionalDialog from "@/components/ChatBot/ChatBotEditorWorkflow/EditEdgeConditionalDialog.vue";
import WorkflowMetaDialog from "@/components/ChatBot/ChatBotEditorWorkflow/WorkflowMetaDialog.vue";
import {useWorkflowEditor} from './ChatBotEditorWorkflow/composables/useWorkflowEditor';
import useAssistantStore from "@/stores/assistant.ts";
import {computed, onMounted, onUnmounted, ref} from "vue";
import helperBreakpoints from "@/helpers/HelperBreakpoints";
import ChatBotCanvasVueFlowDrawer from "@/components/ChatBot/ChatBotCanvasVueFlowDrawer.vue";
import eventBus from "@/plugins/eventBus";
import {SHOW_MARKDOWN_DRAWER, SHOW_VUE_FLOW_DRAWER} from "@/helpers/HelperConstants";

const props = defineProps<{
  technicalId: string,
}>();

const workflowMetaDialogRef = templateRef('workflowMetaDialogRef');
const assistantStore = useAssistantStore();
const chatBotCanvasVueFlowDrawerRef = templateRef('chatBotCanvasVueFlowDrawerRef');

const {
  canvasData,
  editorSize,
  isLoading,
  editorActions,
  nodes,
  edges,
  workflowMetaData,
  onNodeDragStop,
  onConnect,
  onConnectStart,
  onConnectEnd,
  resetTransform,
  addNewState,
  autoLayout,
  onUpdateWorkflowMetaDialog,
  onResize,
  // Undo/Redo функциональность
  canUndo,
  canRedo,
  undoAction,
  redoAction,
  // Connection drag состояние
  isDraggingConnection,
} = useWorkflowEditor(props, assistantStore);

onMounted(() => {
  eventBus.$on(SHOW_VUE_FLOW_DRAWER, showChatBotCanvasVueFlowDrawer);
})

onUnmounted(() => {
  eventBus.$off(SHOW_MARKDOWN_DRAWER, showChatBotCanvasVueFlowDrawer);
})

const edgeTypes = {
  custom: EdgeWithTooltip
};

function workflowMeta() {
  workflowMetaDialogRef.value.openDialog(workflowMetaData.value);
}

const isShowVueFlow = computed(() => {
  return !helperBreakpoints.smaller('md').value;
})

function showChatBotCanvasVueFlowDrawer() {
  chatBotCanvasVueFlowDrawerRef.value.drawerVisible = true;
}
</script>

<style lang="scss">
.chat-bot-editor-workflow {
  width: 100%;
  min-height: calc(100vh - 81px);
  height: calc(100% - 81px);

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
