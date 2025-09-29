<template>
  <div
      class="chat-bot-message-function-item"
      :class="{
      'chat-bot-message-function-item--post': props.item.method === 'POST',
      'chat-bot-message-function-item--get': props.item.method === 'GET',
      'chat-bot-message-function-item--delete': props.item.method === 'DELETE',
      'chat-bot-message-function-item--put': props.item.method === 'PUT',
      'chat-bot-message-function-item--patch': props.item.method === 'PATCH',
     }"
  >
    <div
        class="chat-bot-message-function-item__body"
    >
      <div class="chat-bot-message-function-item__body-method">
        {{ props.item.method }}
      </div>
      <div class="chat-bot-message-function-item__body-path">
        {{ props.item.path }}
      </div>
      <div class="chat-bot-message-function-item__body-function">
        {{ props.item.function }}
      </div>
      <div class="chat-bot-message-function-item__body-right-part">
        <div class="chat-bot-message-function-item__body-response_format">
          <span>Response format:</span> {{ props.item.response_format }}
        </div>
        <div class="chat-bot-message-function-item__body-button">
          <el-button :loading="isLoading" @click="emit('click')">Try it out</el-button>
        </div>
      </div>
    </div>
    <div class="chat-bot-message-function-item__info">
      <InfoIcon/>
      The response might contain sensitive user environment information and will not be persisted.
    </div>
  </div>
</template>

<script setup lang="ts">
import InfoIcon from '@/assets/images/icons/info.svg';

const emit = defineEmits(['click']);
const props = defineProps<{
  item: any,
  isLoading: any,
}>()

</script>

<style lang="scss" scoped>
@use '@/assets/css/particular/breakpoints';

.chat-bot-message-function-item {
  &__body {
    display: flex;
    padding: 5px;
    border-radius: 4px;
    border: 1px solid;
    box-shadow: 0 0 3px rgba(0, 0, 0, .25);
    gap: 10px;
    align-items: center;

    background: var(--bubble-question-bg-color);
    border-color: var(--bubble-question-title-color);

    @include breakpoints.respond-max('sm') {
      flex-direction: column;
    }

    &-method {
      font-size: 14px;
      font-weight: 700;
      min-width: 80px;
      padding: 6px 0;
      border-radius: 3px;
      color: var(--white-black);
      text-align: center;
      text-shadow: 0 1px 0 rgba(0, 0, 0, .1);
      background: var(--bubble-question-title-color);

      @include breakpoints.respond-max('sm') {
        width: 100%;
      }
    }

    &-path {
      color: var(--bubble-text-color);
      font-weight: bold;
    }

    &-function {
      color: var(--bubble-text-color);
      font-size: 13px;
      word-break: break-word;
    }

    &-right-part {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 10px;

      @include breakpoints.respond-max('sm') {
        margin-left: unset;
        flex-direction: column;
      }
    }

    &-button {
      @include breakpoints.respond-max('sm') {
        margin-top: 10px;
      }
    }

    &-response_format {
      margin-left: auto;
      font-size: 16px;
      color: var(--bubble-text-color);

      span {
        color: var(--bubble-text-color);
        font-size: 13px;
        font-weight: 600;
      }
    }
  }

  &__info {
    margin-top: 5px;
    font-size: 14px;
    font-weight: bold;
    color: var(--bubble-text-color);

    svg {
      position: relative;
      top: 2px;
    }
  }
}
</style>