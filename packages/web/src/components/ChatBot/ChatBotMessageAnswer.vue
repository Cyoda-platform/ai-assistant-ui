<template>
  <div class="chat-bot-message-answer">
    <div class="chat-bot-message-answer__title">
      <span>USER</span>
    </div>
    <div v-html="computedMessage" class="chat-bot-message-answer__body"></div>
  </div>
</template>

<script lang="ts" setup>
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
.chat-bot-message-answer {
  padding-left: 12px;
  padding-right: 64px;
  margin-bottom: 25px;
  position: relative;

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
