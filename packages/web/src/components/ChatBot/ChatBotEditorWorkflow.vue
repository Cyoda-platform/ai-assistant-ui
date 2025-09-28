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
            ref="vueFlowRef"
            noPanClassName="nopan"
            :delete-key-code="null"
            class="chat-bot-editor-workflow__vue-flow"
            :class="{ 'connection-dragging': isDraggingConnection }"
            :fit-view-on-init="false"
            :zoom-on-double-click="false"
            :pan-on-drag="true"
            :selection-on-drag="false"
            :nodes-draggable="isDraggable"
            :edges-draggable="isDraggable"
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
            <template #control-zoom-in>
              <el-tooltip content="Zoom in" placement="top" :show-after="500">
                <ControlButton @click="zoomIn">
                  <Icon name="zoom-in"/>
                </ControlButton>
              </el-tooltip>
            </template>

            <template #control-zoom-out>
              <el-tooltip content="Zoom out" placement="top" :show-after="500">
                <ControlButton @click="zoomOut">
                  <Icon name="zoom-out"/>
                </ControlButton>
              </el-tooltip>
            </template>

            <template #control-interactive>
              <el-tooltip v-if="isDraggable" content="Lock interaction" placement="top" :show-after="500">
                <ControlButton @click="() => isDraggable = false">
                  <Icon name="unlock"/>
                </ControlButton>
              </el-tooltip>
              <el-tooltip v-else content="Unlock interaction" placement="top" :show-after="500">
                <ControlButton @click="() => isDraggable = true">
                  <Icon name="lock"/>
                </ControlButton>
              </el-tooltip>
            </template>

            <el-tooltip content="Fit to view" placement="top" :show-after="500">
              <ControlButton @click="fitView">
                <Icon name="fit-view"/>
              </ControlButton>
            </el-tooltip>

            <el-tooltip content="Undo" placement="top" :show-after="500">
              <ControlButton @click="undoAction" :disabled="!canUndo">
                <Icon name="undo"/>
              </ControlButton>
            </el-tooltip>

            <el-tooltip content="Redo" placement="top" :show-after="500">
              <ControlButton @click="redoAction" :disabled="!canRedo">
                <Icon name="redo"/>
              </ControlButton>
            </el-tooltip>

            <el-tooltip content="Reset position" placement="top" :show-after="500">
              <ControlButton @click="resetTransform">
                <Icon name="reset"/>
              </ControlButton>
            </el-tooltip>

            <el-tooltip
                :content="layoutDirection === 'horizontal' ? 'Switch to vertical layout' : 'Switch to horizontal layout'"
                placement="top" :show-after="500">
              <ControlButton @click="autoLayout">
                <template v-if="layoutDirection==='horizontal'">
                  <Icon name="vertical"/>
                </template>
                <template v-else>
                  <Icon name="horizontal"/>
                </template>
              </ControlButton>
            </el-tooltip>

            <el-tooltip content="Add new state" placement="top" :show-after="500">
              <ControlButton @click="addNewState">
                <Icon name="plus"/>
              </ControlButton>
            </el-tooltip>

            <el-tooltip content="Workflow settings" placement="top" :show-after="500">
              <ControlButton @click="workflowMeta">
                <Icon name="cogs"/>
              </ControlButton>
            </el-tooltip>

            <el-tooltip content="Help & Legend" placement="top" :show-after="500">
              <ControlButton @click="showHelpDialog">
                <Icon name="question"/>
              </ControlButton>
            </el-tooltip>
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
    <WorkflowHelpDialog v-model="isHelpDialogVisible"/>
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
import WorkflowHelpDialog from "@/components/ChatBot/ChatBotEditorWorkflow/WorkflowHelpDialog.vue";
import {useWorkflowEditor} from './ChatBotEditorWorkflow/composables/useWorkflowEditor';
import useAssistantStore from "@/stores/assistant.ts";
import {computed, markRaw, useTemplateRef, onMounted, onUnmounted, nextTick, ref, watch} from "vue";
import EditorViewMode from "@/components/ChatBot/EditorViewMode.vue";
import SendIcon from "@/assets/images/icons/send.svg";
import eventBus from "../../plugins/eventBus";

const props = defineProps<{
  technicalId: string,
}>();

const emit = defineEmits(['answer', 'update']);

const workflowMetaDialogRef = useTemplateRef('workflowMetaDialogRef');
const assistantStore = useAssistantStore();

// Draggable state
const isDraggable = ref(true);

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
} = useWorkflowEditor(props, assistantStore, emit, isDraggable);

const {zoomIn, zoomOut, getViewport} = useVueFlow();

// Template ref for VueFlow
const vueFlowRef = ref();

// Help dialog state
const isHelpDialogVisible = ref(false);

// Track selected transitions and nodes for deletion
const selectedTransitions = ref(new Set<string>());
const selectedNodes = ref(new Set<string>());

// Handle double click on pane to add new state at click position
const handlePaneDoubleClick = (event: MouseEvent) => {
  if (!isDraggable.value) {
    return;
  }
  
  // Prevent adding state if clicking on nodes, edges, transitions, or controls
  const target = event.target as HTMLElement;
  if (target.closest('.vue-flow__node') ||
      target.closest('.vue-flow__edge') ||
      target.closest('.vue-flow__controls') ||
      target.closest('.vue-flow__handle') ||
      target.closest('.transition-label') ||
      target.closest('[data-testid*="edge"]') ||
      target.closest('[class*="node"]') ||
      target.closest('[class*="edge"]') ||
      target.closest('[class*="transition"]')) {
    return;
  }

  // Get VueFlow element
  const vueFlowElement = vueFlowRef.value?.$el || vueFlowRef.value;
  if (!vueFlowElement) return;

  // Get bounding rect and viewport for coordinate transformation
  const rect = vueFlowElement.getBoundingClientRect();
  const viewport = getViewport();

  // Transform DOM coordinates to VueFlow coordinates
  const position = {
    x: (event.clientX - rect.left - viewport.x) / viewport.zoom,
    y: (event.clientY - rect.top - viewport.y) / viewport.zoom
  };

  addNewState(position);
};

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
  if (selectedNodes.value.size === 1 && selectedNodes.value.has(nodeId)) {
    return;
  }

  eventBus.$emit('node-deselected');

  selectedNodes.value.clear();
  selectedTransitions.value.clear();

  selectedNodes.value.add(nodeId);

  eventBus.$emit('label-deselected');
};

const handleNodeDeselected = () => {
  selectedNodes.value.clear();
};

const handleNodeDeleted = (nodeId: string) => {
  selectedNodes.value.delete(nodeId);
};

// Handle clicks on document to deselect nodes/transitions
const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  
  // Only prevent deselection if clicking directly on nodes or transition labels
  if (target.closest('.vue-flow__node') || 
      target.closest('.transition-label')) {
    return;
  }
  
  // Clear all selections when clicking anywhere else
  selectedNodes.value.clear();
  selectedTransitions.value.clear();
  
  // Notify all nodes and edges to deselect
  eventBus.$emit('node-deselected');
  eventBus.$emit('label-deselected');
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
  
  // Add document click listener for deselecting nodes/transitions
  document.addEventListener('click', handleDocumentClick);
});

onUnmounted(() => {
  // Remove keyboard listener
  document.removeEventListener('keydown', handleKeyDown);
  
  // Remove document click listener
  document.removeEventListener('click', handleDocumentClick);

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
    // Check if the active element is an input field - if so, don't trigger deletion
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).contentEditable === 'true'
    )) {
      return; // Let the input handle the delete key normally
    }

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
    }
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
  restoreViewport: restoreCurrentViewport,
  workflowMetaData,
  canvasData
});

const edgeTypes = {
  custom: markRaw(EdgeWithTooltip),
  draggableTransition: markRaw(DraggableTransitionEdge)
};

function workflowMeta() {
  workflowMetaDialogRef.value.openDialog(workflowMetaData.value);
}

function showHelpDialog() {
  isHelpDialogVisible.value = true;
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
  workflowMetaData.value = '';
}

// No need for fitView from main component since viewport is now restored in composable
// const {fitView} = useVueFlow();

// Remove old watcher that reset zoom - now we save and restore viewport
// watch(editorMode, ()=>{
//   setTimeout(()=>{
//     fitView();
//   }, 10)
// })

// Setup double click listener for adding new states
const setupDoubleClickListener = () => {
  // Remove existing listener first
  const vueFlowElement = vueFlowRef.value?.$el || vueFlowRef.value;
  if (vueFlowElement) {
    vueFlowElement.removeEventListener('dblclick', handlePaneDoubleClick);
    vueFlowElement.addEventListener('dblclick', handlePaneDoubleClick);
  }
};

onMounted(() => {
  nextTick(() => {
    setupDoubleClickListener();
  });
});

// Re-setup listener when Vue Flow ref changes or editor mode changes
watch([vueFlowRef, editorMode], () => {
  nextTick(() => {
    setupDoubleClickListener();
  });
}, { flush: 'post' });

onUnmounted(() => {
  const vueFlowElement = vueFlowRef.value?.$el || vueFlowRef.value;
  if (vueFlowElement) {
    vueFlowElement.removeEventListener('dblclick', handlePaneDoubleClick);
  }
});

watch([canvasData, workflowMetaData], () => {
  emit('update', {canvasData: canvasData.value, workflowMetaData: workflowMetaData.value});
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
    justify-content: center;
    z-index: 1000;
  }

  &__vue-flow {
    margin-top: 60px;
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
