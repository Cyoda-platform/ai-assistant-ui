<template>
  <div class="chat-bot-message-question" :class="{
    'chat-bot-message-question--notification': message.type === 'notification',
  }">
    <div class="chat-bot-message-question__title">
      <AiChat class="cyoda-icon"/>
      <span>CYODA. AI</span>
    </div>
    <div v-html="computedMessage" class="chat-bot-message-question__body"></div>
  </div>
</template>

<script lang="ts" setup>
import AiChat from "@/assets/images/icons/ai-chat.svg";
import {computed} from "vue";

const props = defineProps<{
  message: any,
}>()

const computedMessage = computed(() => {
  const text = props.message.text;
  if (typeof text === 'object' && text !== null) {
    return JSON.stringify(text, null, 2);
  }
  return text;
});
</script>

<style lang="scss">
.chat-bot-message-question {
  background: #FFFFFF;
  border: 1px solid #F0F1F4;
  box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.12);
  border-radius: 24px;
  min-height: 100px;
  padding-left: 68px;
  padding-right: 64px;
  padding-top: 24px;
  padding-bottom: 24px;
  position: relative;
  margin-bottom: 25px;

  .cyoda-icon{
    position: absolute;
    left: 24px;
    top: 20px;
  }

  &__title {
    display: flex;
    margin-bottom: 8px;
    font-size: 15px;
    letter-spacing: 2px;
  }

  &__body {
    font-size: 16px;
    line-height: 1.5;
  }

  &--notification {
    background-color: rgba(230, 162, 60, 0.5);
  }
}
</style>
