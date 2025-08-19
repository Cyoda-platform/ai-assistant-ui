<template>
  <div v-loading="isLoading" class="chat-bot-editor-workflow">
    <EditorViewMode v-model="editorMode"/>
    <el-splitter @resize="onResize">
      <el-splitter-panel v-if="isShowEditor" v-model:size="editorSize" class="chat-bot-editor-workflow__editor-wrapper">
        <Editor v-model="canvasData" language="json" class="chat-bot-editor-workflow__editor-inner"
                :actions="editorActions"/>
        <div class="chat-bot-editor-workflow__actions">
          <div class="btn-action btn-block">
            <el-tooltip
                class="box-item"
                effect="dark"
                content="Send Answer"
                placement="left"
                :show-after="1000"
            >
              <el-button @click="onSubmitQuestion" class="btn-white btn-icon">
                <SendIcon/>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </el-splitter-panel>
      <el-splitter-panel v-if="isShowVueFlow" class="chat-bot-editor-workflow__flow-wrapper">
        <VueFlow
            class="chat-bot-editor-workflow__vue-flow"
            :class="{ 'connection-dragging': isDraggingConnection }"
            :fit-view-on-init="true"
            :zoom-on-scroll="false"
            :zoom-on-double-click="false"
            @nodeDragStop="onNodeDragStop"
            @connect="onConnect"
            @connectStart="onConnectStart"
            @connectEnd="onConnectEnd"
            :connection-mode="ConnectionMode.Loose"
            v-model:nodes="nodes"
            :edges="edges"
            :edge-types="edgeTypes"
            :default-viewport="{ zoom: 1.5 }"
            :min-zoom="0.2"
            :max-zoom="4"
        >
          <Controls position="top-left">
            <template #icon-zoom-in>
              <Icon name="zoom-in"/>
            </template>
            <template #icon-zoom-out>
              <Icon name="zoom-out"/>
            </template>
            <template #icon-fit-view>
              <Icon name="fit-view"/>
            </template>
            <template #icon-lock>
              <Icon name="lock"/>
            </template>
            <template #icon-unlock>
              <Icon name="unlock"/>
            </template>

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
              <template v-if="layoutDirection==='horizontal'">
                <Icon name="vertical"/>
              </template>
              <template v-else>
                <Icon name="horizontal"/>
              </template>
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
  </div>
</template>

<script setup lang="ts">
import {VueFlow, ConnectionMode, useVueFlow} from '@vue-flow/core'
import {Background} from '@vue-flow/background'
import {ControlButton, Controls} from '@vue-flow/controls'
import Editor from "@/components/Editor/Editor.vue";
import Icon from "@/components/ChatBot/ChatBotEditorWorkflow/Icon.vue";
import Node from "@/components/ChatBot/ChatBotEditorWorkflow/Node.vue";
import EdgeWithTooltip from "@/components/ChatBot/ChatBotEditorWorkflow/EdgeWithTooltip.vue";
import DraggableTransitionEdge from "@/components/ChatBot/ChatBotEditorWorkflow/DraggableTransitionEdge.vue";
import EditEdgeConditionalDialog from "@/components/ChatBot/ChatBotEditorWorkflow/EditEdgeConditionalDialog.vue";
import WorkflowMetaDialog from "@/components/ChatBot/ChatBotEditorWorkflow/WorkflowMetaDialog.vue";
import {useWorkflowEditor} from './ChatBotEditorWorkflow/composables/useWorkflowEditor';
import useAssistantStore from "@/stores/assistant.ts";
import {computed, markRaw, watch, nextTick, useTemplateRef} from "vue";
import EditorViewMode from "@/components/ChatBot/EditorViewMode.vue";
import SendIcon from "@/assets/images/icons/send.svg";

const props = defineProps<{
  technicalId: string,
}>();

const workflowMetaDialogRef = useTemplateRef('workflowMetaDialogRef');
const assistantStore = useAssistantStore();

const {
  canvasData,
  editorSize,
  editorMode,
  layoutDirection,
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
  canUndo,
  canRedo,
  undoAction,
  redoAction,
  isDraggingConnection,
  onSubmitQuestion,
} = useWorkflowEditor(props, assistantStore);

const edgeTypes = {
  custom: markRaw(EdgeWithTooltip),
  draggableTransition: markRaw(DraggableTransitionEdge)
};

function workflowMeta() {
  workflowMetaDialogRef.value.openDialog(workflowMetaData.value);
}

const isShowVueFlow = computed(() => {
  return ['preview', 'editorPreview'].includes(editorMode.value);
})

const isShowEditor = computed(() => {
  return ['editor', 'editorPreview'].includes(editorMode.value);
})

const {fitView} = useVueFlow();

watch(editorMode, ()=>{
  nextTick(()=>{
    fitView();
  })
})
</script>

<style lang="scss">
.chat-bot-editor-workflow {
  width: 100%;
  min-height: calc(100vh - 137px);
  height: calc(100% - 137px);

  .vue-flow__controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center
  }

  &__editor-wrapper {
    padding-right: 15px;
    position: relative;
  }

  &__flow-wrapper {
    padding-left: 15px;
  }

  &__editor-inner {
    min-height: 100%;
  }

  &__actions {
    position: absolute;
    right: 15px;
    bottom: 20px;
    z-index: 100;
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 12px;
    background: var(--bg-new-chat);
    border: 1px solid var(--input-border);
    padding: 9px 12px;
    border-radius: 4px;

    button {
      margin: 0 !important;
    }
  }

  &.el-loading-parent--relative {
    .el-loading-mask{
      top: -15px;
      bottom: -55px;
    }
  }
}
</style>
