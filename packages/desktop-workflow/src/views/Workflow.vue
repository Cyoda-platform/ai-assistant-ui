<template>
  <div class="wrap-workflow">
    <Header/>
    <ChatBotEditorWorkflow/>
  </div>
</template>

<script setup lang="ts">
import ChatBotEditorWorkflow from "@/components/ChatBot/ChatBotEditorWorkflow.vue";
import Header from "../components/Header.vue";

</script>

<style scoped lang="scss">
.wrap-workflow{
  height: 100dvh;
}
</style>