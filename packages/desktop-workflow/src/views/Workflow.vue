<template>
  <div class="wrap-workflow">
    <Header/>
    <template v-if="selectedWorkflow">
      <ChatBotEditorWorkflow/>
    </template>
    <template v-else>
      <div class="wrap-workflow__empty-state">
        <div class="wrap-workflow__empty-state-message">
          Please select or create a workflow
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import ChatBotEditorWorkflow from "@/components/ChatBot/ChatBotEditorWorkflow.vue";
import Header from "../components/Header.vue";
import useWorkflowStore from "../stores/workflows";
import {computed} from "vue";

const workflowStore = useWorkflowStore();

const selectedWorkflow = computed(() => {
  workflowStore.selectedWorkflow;
})
</script>

<style scoped lang="scss">
.wrap-workflow {
  height: 100dvh;

  &__empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
}
</style>