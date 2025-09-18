<template>
  <div class="wrap-workflow">
    <Header/>
    <template v-if="selectedWorkflow">
      <ChatBotEditorWorkflow @update="onUpdateWorkflow" ref="chatBotEditorWorkflowRef" :technicalId="selectedWorkflow.technical_id"/>
    </template>
    <template v-else>
      <div class="wrap-workflow__empty-state">
        <div class="wrap-workflow__empty-state-content">
          <h2 class="wrap-workflow__empty-state-title">
            No Workflow Selected
          </h2>
          <p class="wrap-workflow__empty-state-message">
            Choose an existing workflow from the sidebar or create a new one to get started with your automation
            journey.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import ChatBotEditorWorkflow from "@/components/ChatBot/ChatBotEditorWorkflow.vue";
import Header from "../components/Header.vue";
import useWorkflowStore from "../stores/workflows";
import { computed, useTemplateRef, watch } from "vue";
import { debounce } from "lodash";

const workflowStore = useWorkflowStore();
const chatBotEditorWorkflowRef = useTemplateRef('chatBotEditorWorkflowRef');

const selectedWorkflow = computed(() => {
  return workflowStore.selectedWorkflow;
});

// Original update function
function updateWorkflow({ workflowMetaData, canvasData }: { workflowMetaData: any; canvasData: any }) {
  const cleanMetaData = workflowMetaData ? JSON.parse(JSON.stringify(workflowMetaData)) : null;
  const cleanCanvasData = canvasData ? JSON.parse(JSON.stringify(canvasData)) : null;
  
  workflowStore.updateWorkflow({
    workflowMetaData: cleanMetaData,
    canvasData: cleanCanvasData,
    technical_id: selectedWorkflow.value.technical_id,
  });
}

// Debounced version with 500ms delay using lodash
const onUpdateWorkflow = debounce(updateWorkflow, 500);

watch(selectedWorkflow, () => {
      if (!chatBotEditorWorkflowRef.value) return;
      
      if (selectedWorkflow.value) {
        chatBotEditorWorkflowRef.value.workflowMetaData = selectedWorkflow.value.workflowMetaData;
        chatBotEditorWorkflowRef.value.canvasData = selectedWorkflow.value.canvasData;
      } else {
        chatBotEditorWorkflowRef.value.workflowMetaData = '';
        chatBotEditorWorkflowRef.value.canvasData = '';
      }
    }, {
      immediate: true
    }
)
</script>

<style scoped lang="scss">
.wrap-workflow {
  height: 100dvh;

  &__empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(100dvh - 80px);
    padding: 2rem;
  }

  &__empty-state-content {
    text-align: center;
    max-width: 480px;
    padding: 3rem 2rem;
  }

  &__empty-state-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-color-regular);
    margin: 0 0 1rem 0;
    line-height: 1.2;
  }

  &__empty-state-message {
    font-size: 1rem;
    color: #6b7280;
    line-height: 1.6;
    margin: 0 0 2rem 0;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>