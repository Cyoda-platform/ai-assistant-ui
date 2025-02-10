<template>
  <div class="chat-bot-message-answer">
    <div class="chat-bot-message-answer__title">
      <span>USER</span>
    </div>
    <div v-html="computedMessage" class="chat-bot-message-answer__body"></div>
    <FilePreview v-if="currentFile" :file="currentFile"/>
  </div>
</template>

<script lang="ts" setup>
import {computed} from "vue";
import FilePreview from "@/components/FilePreview/FilePreview.vue";

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


const currentFile = computed(() => {
  return props.message.file || null;
})
</script>

<style lang="scss">
.chat-bot-message-answer {
  padding: 16px;
  padding-right: 64px;
  margin-bottom: 25px;
  position: relative;
  box-shadow: -2px 2px 2px rgba(66, 65, 45, 0.2);
  background: #D6DBDB;
  border-radius: 16px;

  &__title {
    display: flex;
    margin-bottom: 8px;
    font-size: 15px;
    letter-spacing: 2px;
    font-weight: bold;
  }

  &__body {
    font-size: 16px;
    line-height: 1.5;
    overflow-wrap: break-word;
  }

  &--notification {
    background-color: rgba(230, 162, 60, 0.5);
  }
}
</style>
