<template>
  <div class="wrap-workflow">
    <Header/>
    <template v-if="selectedWorkflow">
      <ChatBotEditorWorkflow ref="chatBotEditorWorkflowRef" :technicalId="selectedWorkflow.technical_id"/>
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
import {computed, useTemplateRef, watch} from "vue";

const workflowStore = useWorkflowStore();
const chatBotEditorWorkflowRef = useTemplateRef('chatBotEditorWorkflowRef');

const selectedWorkflow = computed(() => {
  return workflowStore.selectedWorkflow;
});

watch(selectedWorkflow, (newVal, oldVal) => {
      if (!newVal || !chatBotEditorWorkflowRef.value || !selectedWorkflow.value) return;
      chatBotEditorWorkflowRef.value.workflowMetaData = selectedWorkflow.value.workflowMetaData;
      chatBotEditorWorkflowRef.value.canvasData = selectedWorkflow.value.canvasData;
    }, {
      immediate: true
    }
)

watch(chatBotEditorWorkflowRef, () => {
  console.log('cchatBotEditorWorkflowRef.value.workflowMetaData', chatBotEditorWorkflowRef.value.workflowMetaData)
  workflowStore.updateWorkflow({
    workflowMetaData: chatBotEditorWorkflowRef.value.workflowMetaData,
    canvasData: chatBotEditorWorkflowRef.value.canvasData,
    technical_id: selectedWorkflow.value.technical_id,
  })
})
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
    background: white;
  }

  &__empty-state-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1f2937;
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