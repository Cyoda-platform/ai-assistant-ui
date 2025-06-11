<template>
  <div class="chat-bot-name">
    <span>{{ chatName }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  technicalId: string,
  chatName: string,
}>();
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
