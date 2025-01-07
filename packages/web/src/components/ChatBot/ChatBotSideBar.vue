<template>
  <div class="chat-bot-side-bar">
    <template v-for="message in props.messages">
      <ChatBotMessageQuestion v-if="isQuestion(message)" :message="message"/>
      <ChatBotMessageAnswer else :message="message"/>
    </template>
  </div>
</template>

<script setup lang="ts">
import ChatBotMessageAnswer from "@/components/ChatBot/ChatBotMessageAnswer.vue";
import ChatBotMessageQuestion from "@/components/ChatBot/ChatBotMessageQuestion.vue";

const props = defineProps<{
  messages: any[],
}>();

function isQuestion(message) {
  return ['question', 'notification'].includes(message.type);
}
</script>

<style lang="scss">
.chat-bot-side-bar {

}
</style>
