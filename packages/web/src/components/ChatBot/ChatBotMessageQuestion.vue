<template>
  <div class="chat-bot-message-question">
    <div class="chat-bot-message-question__title">
        <span class="chat-bot-message-question__cyoda-wrapper-icon">
          <AiChaIcon/>
        </span>
      <span>CYODA AI | <small class="chat-bot-message-question__date">{{ date }}</small></span>

      <div class="chat-bot-message-question__top-actions">
        <el-tooltip
            class="box-item"
            effect="dark"
            content="Copy"
            placement="top"
            :show-after="1000"
        >
          <el-button
              @click="onClickCopy"
              size="small"
              class="btn-default-lighter btn-icon"
          >
            <CopyIcon/>
          </el-button>
        </el-tooltip>
      </div>

    </div>
    <div v-html="computedMessage" class="chat-bot-message-question__body"></div>
    <div class="chat-bot-message-question__bottom-actions">
      <el-tooltip
          v-if="message.approve"
          class="box-item"
          effect="dark"
          content="Approve"
          placement="top"
          :show-after="1000"
      >
        <el-button
            @click="onClickApproveQuestion"
            size="small"
            :disabled="isLoading"
            class="btn btn-primary btn-icon"
            :loading="isLoadingApprove"
        >
          <CheckIcon class="fill-stroke"/>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import AiChaIcon from "@/assets/images/icons/ai-chat.svg";
import CopyIcon from "@/assets/images/icons/copy.svg";
import CheckIcon from "@/assets/images/icons/check.svg";
import {computed, ref} from "vue";
import HelperMarkdown from "@/helpers/HelperMarkdown";
import HelperCopy from "@/helpers/HelperCopy";
import {ElNotification} from "element-plus";
import dayjs from "dayjs";

const props = defineProps<{
  message: any,
  isLoading: boolean,
}>()

const emit = defineEmits(['approveQuestion']);
const isLoadingApprove = ref(false);
const computedMessage = computed(() => {
  const text = props.message.text;
  if (typeof text === 'object' && text !== null) {
    return JSON.stringify(text, null, 2);
  }

  return HelperMarkdown.parseMarkdown(text);
});

const date = computed(() => {
  return dayjs(props.message.raw.last_modified).format('DD/MM/YYYY HH:mm:ss')
})

function onClickApproveQuestion() {
  isLoadingApprove.value = true;
  emit('approveQuestion', props.message.raw);
  setTimeout(() => {
    isLoadingApprove.value = false;
  }, 2000);
}

function onClickCopy() {
  HelperCopy.copy(props.message.text);
  ElNotification({
    title: 'Success',
    message: 'The data has been copied',
    type: 'success',
  })
}
</script>

<style lang="scss">
@use '@/assets/css/particular/mixins';
@use '@/assets/css/particular/breakpoints';

.chat-bot-message-question {
  background: var(--bubble-notification-bg-color);
  border: 1px solid var(--bubble-border-color);
  border-radius: 16px;
  min-height: 100px;
  padding: 24px 16px 16px 68px;
  position: relative;
  margin-bottom: 25px;
  box-shadow: -1px 1px 20px var(--bubble-box-shadow-color);

  @include breakpoints.respond-max('md') {
    padding: 24px 8px 8px 68px;
    @include breakpoints.respond-max('md') {
      padding-right: 18px;
    }
  }

  &__date {
    font-size: 12px;
  }

  &__cyoda-wrapper-icon {
    position: absolute;
    left: 24px;
    top: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__title {
    display: flex;
    margin-bottom: 8px;
    font-size: 16px;
    letter-spacing: 2px;
    color: var(--bubble-question-title-color);

    span {
      font-weight: bold;
    }
  }

  &__top-actions {
    margin-left: auto;
    position: relative;
    top: -10px;
  }

  &__bottom-actions {
    text-align: right;

    .btn-primary svg {
      stroke: var(--color-icon-submit) !important;
    }
  }

  &__body {
    @include mixins.bubble_body;
  }

  .wrap-container {
    overflow: auto;
  }

  &__actions {
    text-align: right;
  }
}
</style>
