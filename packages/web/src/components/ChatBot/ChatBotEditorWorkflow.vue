<template>
  <div v-loading="isLoading" class="chat-bot-editor-workflow">
    <EditorViewMode @clear="onClear" v-model="editorMode"/>
    <el-splitter @resize="onResize">
      <el-splitter-panel v-if="isShowEditor" v-model:size="editorSize" class="chat-bot-editor-workflow__editor-wrapper">
        <Editor v-model="canvasData" language="json" class="chat-bot-editor-workflow__editor-inner"
                :actions="editorActions"/>
        <div v-if="hasWorkflowActions" class="chat-bot-editor-workflow__actions">
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
            :delete-key-code="null"
            class="chat-bot-editor-workflow__vue-flow"
            :class="{ 'connection-dragging': isDraggingConnection }"
            :fit-view-on-init="false"
            :zoom-on-double-click="false"
            :pan-on-drag="true"
            :selection-on-drag="false"
            @nodeDragStop="onNodeDragStop"
            @connect="onConnect"
            @connectStart="onConnectStart"
            @connectEnd="onConnectEnd"
            @viewportChange="onViewportChange"
            :connection-mode="ConnectionMode.Loose"
            v-model:nodes="nodes"
            :edges="edges"
            :edge-types="edgeTypes"
            :default-viewport="{ zoom: 1.5 }"
            :min-zoom="0.2"
            :max-zoom="4"
        >
          <Controls position="top-left" :show-fit-view="false">
            <template #icon-zoom-in>
              <Icon name="zoom-in"/>
            </template>
            <template #icon-zoom-out>
              <Icon name="zoom-out"/>
            </template>
            <template #icon-lock>
              <Icon name="lock"/>
            </template>
            <template #icon-unlock>
              <Icon name="unlock"/>
            </template>

            <ControlButton @click="fitView">
              <Icon name="fit-view"/>
            </ControlButton>

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
import {VueFlow, ConnectionMode} from '@vue-flow/core'
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
import {computed, markRaw, useTemplateRef, onMounted, onUnmounted, nextTick, ref} from "vue";
import EditorViewMode from "@/components/ChatBot/EditorViewMode.vue";
import SendIcon from "@/assets/images/icons/send.svg";
import eventBus from "../../plugins/eventBus";

const props = defineProps<{
  technicalId: string,
}>();

const emit = defineEmits(['answer']);

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
  onViewportChange,
  saveViewport,
  restoreViewport,
  resetTransform,
  addNewState,
  autoLayout,
  onUpdateWorkflowMetaDialog,
  onResize,
  fitView,
  canUndo,
  canRedo,
  undoAction,
  redoAction,
  isDraggingConnection,
  onSubmitQuestion,
} = useWorkflowEditor(props, assistantStore, emit);

// Track selected transitions and nodes for deletion
const selectedTransitions = ref(new Set<string>());
const selectedNodes = ref(new Set<string>());

// Event handler functions
const handleLabelSelected = (transitionId: string) => {
  // Clear ALL other selections (transitions and nodes)
  selectedTransitions.value.clear();
  selectedNodes.value.clear();
  selectedTransitions.value.add(transitionId);
  
  // Notify nodes to deselect
  eventBus.$emit('node-deselected');
};

const handleLabelDeselected = () => {
  selectedTransitions.value.clear();
};

const handleTransitionDeleted = (transitionId: string) => {
  selectedTransitions.value.delete(transitionId);
};

const handleNodeSelected = (nodeId: string) => {
  // Clear ALL other selections (nodes and transitions)
  selectedNodes.value.clear();
  selectedTransitions.value.clear();
  selectedNodes.value.add(nodeId);
  
  // Notify transitions to deselect
  eventBus.$emit('label-deselected');
};

const handleNodeSelectionExclusive = (nodeId: string) => {
  // Clear ALL selections first
  selectedNodes.value.clear();
  selectedTransitions.value.clear();
  
  // Add the new node to selection
  selectedNodes.value.add(nodeId);
  
  // Notify all nodes to deselect (they will handle their own state)
  eventBus.$emit('node-deselected');
  
  // Notify transitions to deselect
  eventBus.$emit('label-deselected');
};

const handleNodeDeselected = () => {
  selectedNodes.value.clear();
};

const handleNodeDeleted = (nodeId: string) => {
  selectedNodes.value.delete(nodeId);
};

// Add/remove keyboard listeners
onMounted(() => {
  // Small delay for complete VueFlow initialization
  nextTick(() => {
    setTimeout(() => {
      restoreViewport();
    }, 50);
  });
  
  // Listen for transition selection/deselection
  eventBus.$on('label-selected', handleLabelSelected);
  eventBus.$on('label-deselected', handleLabelDeselected);
  
  // Listen for deletion results
  eventBus.$on('transition-deleted', handleTransitionDeleted);
  
  // Listen for node selection/deselection
  eventBus.$on('node-selected', handleNodeSelected);
  eventBus.$on('node-selection-exclusive', handleNodeSelectionExclusive);
  eventBus.$on('node-deselected', handleNodeDeselected);
  
  // Listen for node deletion results
  eventBus.$on('node-deleted', handleNodeDeleted);
  
  // Add keyboard listener
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  // Remove keyboard listener
  document.removeEventListener('keydown', handleKeyDown);
  
  // Remove event listeners with proper function references
  eventBus.$off('label-selected', handleLabelSelected);
  eventBus.$off('label-deselected', handleLabelDeselected);
  eventBus.$off('transition-deleted', handleTransitionDeleted);
  eventBus.$off('node-selected', handleNodeSelected);
  eventBus.$off('node-selection-exclusive', handleNodeSelectionExclusive);
  eventBus.$off('node-deselected', handleNodeDeselected);
  eventBus.$off('node-deleted', handleNodeDeleted);
});

// Handle keyboard deletion
const handleKeyDown = (event: KeyboardEvent) => {
  // Delete or Backspace key
  if (event.key === 'Delete' || event.key === 'Backspace') {
    
    let hasItemsToDelete = false;
    
    if (selectedTransitions.value.size > 0) {
      hasItemsToDelete = true;
      
      // Delete each selected transition via confirm dialog
      selectedTransitions.value.forEach(transitionId => {
        // Emit event to trigger deleteEdge() function in the transition component
        eventBus.$emit('delete-transition-with-confirm', {
          transitionId
        });
      });
    }
    
    if (selectedNodes.value.size > 0) {
      hasItemsToDelete = true;
      
      // Delete each selected node via confirm dialog
      selectedNodes.value.forEach(nodeId => {
        // Emit event to trigger delete confirmation for the node
        eventBus.$emit('delete-node-with-confirm', {
          nodeId
        });
      });
    }
    
    if (hasItemsToDelete) {
      // Prevent default browser behavior
      event.preventDefault();
    } else {
      console.log('❌ No items selected for deletion');
    }
  } else {
    console.log('ℹ️ Key ignored:', event.key);
  }
};

// Export methods for viewport management from parent component
const saveCurrentViewport = () => {
  saveViewport();
};

const restoreCurrentViewport = () => {
  restoreViewport();
};

// Expose methods to parent component
defineExpose({
  saveCurrentViewport,
  restoreViewport: restoreCurrentViewport
});

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

const hasWorkflowActions = computed(() => {
  if (import.meta.env.VITE_IS_WORKFLOW_ELECTRON) return false
  return true;
})

function onClear() {
  canvasData.value = '';
}

// No need for fitView from main component since viewport is now restored in composable
// const {fitView} = useVueFlow();

// Remove old watcher that reset zoom - now we save and restore viewport
// watch(editorMode, ()=>{
//   setTimeout(()=>{
//     fitView();
//   }, 10)
// })
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
    .el-loading-mask {
      top: -15px;
      bottom: -55px;
    }
  }
}
</style>
