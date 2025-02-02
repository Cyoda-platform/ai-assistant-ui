<template>
  <div class="chat-bot-message-question">
    <div class="chat-bot-message-question__title">
        <span class="chat-bot-message-question__cyoda-wrapper-icon">
          <AiChaIcon/>
        </span>
      <span>CYODA AI</span>
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
import HelperMarkdown from "@/helpers/HelperMarkdown";

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

  return HelperMarkdown.parseMarkdown(text);
});

function onClickRollbackQuestion() {
  isLoading.value = true;
  emit('rollbackQuestion', props.message.raw);
}
</script>

<style lang="scss">
@use '@/assets/css/particular/variables.scss';

.chat-bot-message-question {
  background: #FFFFFF;
  border: 1px solid #F0F1F4;
  border-radius: 16px;
  min-height: 100px;
  padding: 24px 16px 16px 68px;
  position: relative;
  margin-bottom: 25px;

  &__cyoda-wrapper-icon {
    position: absolute;
    left: 24px;
    top: 17px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__title {
    display: flex;
    margin-bottom: 8px;
    font-size: 15px;
    letter-spacing: 2px;

    span {
      font-weight: bold;
    }
  }

  &__body {
    font-size: 16px;
    line-height: 1.5;
    padding-right: 48px;
    padding-bottom: 16px;
    word-break: break-all;
    ul, ol{
      padding: 0 0 0 20px;
    }
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
}
</style>
