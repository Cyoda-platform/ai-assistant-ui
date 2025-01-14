<template>
  <div class="chat-bot-message-question" :class="{
    'chat-bot-message-question--notification': message.type === 'notification',
  }">
    <div class="chat-bot-message-question__title">
      <span class="chat-bot-message-question__cyoda-wrapper-icon">
        <AiChaIcon/>
      </span>
      <span>CYODA. AI</span>
    </div>
    <div v-html="computedMessage" class="chat-bot-message-question__body"></div>
    <div class="chat-bot-message-question__actions">
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
import RollbackQuestionIcon from "@/assets/images/icons/rollback-question.svg";
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
  return text;
});

function onClickRollbackQuestion() {
  isLoading.value = true;
  emit('rollbackQuestion', props.message)
}
</script>

<style lang="scss">
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
    top: 20px;
    border: 1px solid #F0F1F4;
    border-radius: 4px;
    width: 32px;
    height: 32px;
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
    background-color: rgba(230, 162, 60, 0.5);
  }
}
</style>
