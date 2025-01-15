<template>
  <div class="chat-bot-message-question" :class="{
    'chat-bot-message-question--notification': message.type === 'notification',
  }">
    <div class="chat-bot-message-question__title">
      <template v-if="message.type === 'question'">
        <span class="chat-bot-message-question__cyoda-wrapper-icon">
          <AiChaIcon/>
        </span>
        <span>CYODA AI</span>
      </template>
      <template v-if="message.type === 'notification'">
         <span class="chat-bot-message-question__cyoda-wrapper-icon">
          <NotificationIcon/>
        </span>
        <span>Notification</span>
      </template>
    </div>
    <div v-html="computedMessage" class="chat-bot-message-question__body"></div>
    <div v-if="message.type === 'question'" class="chat-bot-message-question__actions">
      <el-button
        @click="onClickRollbackQuestion"
        :loading="isLoading"
        class="btn-default chat-bot-message-question__action-rollback"
        :class="{
          'is-loading': isLoading
        }"
      >
        <RollbackQuestionIcon class="chat-bot-message-question__rollback-icon"/>
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import AiChaIcon from "@/assets/images/icons/ai-chat.svg";
import NotificationIcon from "@/assets/images/icons/notification.svg";
import RollbackQuestionIcon from "@/assets/images/icons/rollback-question.svg";
import * as marked from 'marked';
import {computed, ref} from "vue";

const props = defineProps<{
  message: any,
}>()

const emit = defineEmits(['rollbackQuestion']);
const isLoading = ref(false);
const computedMessage = computed(() => {
  const text = props.message.text;
  if (typeof text === 'object' && text !== null) {
    return JSON.stringify(text, null, 2);
  }

  return marked.parse(text);
});

function onClickRollbackQuestion() {
  isLoading.value = true;
  emit('rollbackQuestion', props.message.text)
}
</script>

<style lang="scss">
@use '@/assets/css/particular/variables.scss';

.chat-bot-message-question {
  background: #FFFFFF;
  border: 1px solid #F0F1F4;
  border-radius: 16px;
  min-height: 100px;
  padding-left: 68px;
  padding-right: 16px;
  padding-top: 24px;
  padding-bottom: 16px;
  position: relative;
  margin-bottom: 25px;

  &__cyoda-wrapper-icon {
    position: absolute;
    left: 24px;
    top: 17px;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
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
    padding-right: 48px;
    padding-bottom: 16px;
  }

  &__actions {
    text-align: right;
  }

  &__action-rollback {
    width: 28px;
    height: 28px;
    padding: 0;

    &.is-loading {
      span {
        display: none;
      }
    }
  }

  &--notification {
    padding-bottom: 0;
  }
  &--notification &__cyoda-wrapper-icon {
    border: none;
    top: 22px;
  }

  &--notification &__title span {
    color: variables.$color-primary;
    font-size: 16px;
  }
}
</style>
