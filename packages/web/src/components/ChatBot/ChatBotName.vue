<template>
  <div class="chat-bot-name">
    <span>{{ chatName }}</span>
  </div>
</template>

<script setup lang="ts">
import {computed, inject} from "vue";

defineProps<{
  technicalId: string,
}>();

const chatData = inject('chatData');

const chatName = computed(() => {
  return chatData.value?.chat_body?.name || '';
})
</script>

<style lang="scss" scoped>
@use '@/assets/css/particular/breakpoints';
.chat-bot-name {
  display: flex;
  align-items: center;
  gap: 12px;

  svg {
    fill: var(--text-color-regular);
  }

  span {
    color: var(--text-color-regular);
    font-size: 20px;
    font-style: italic;
    font-weight: 400;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    @include breakpoints.respond-max('md') {
      max-width: calc(100vw - 180px);
    }
  }
}
</style>
