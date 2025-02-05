<template>
  <div class="chat-bot-message-question">
    <div class="chat-bot-message-question__title">
        <span class="chat-bot-message-question__cyoda-wrapper-icon">
          <AiChaIcon/>
        </span>
      <span>CYODA AI</span>

      <div class="chat-bot-message-question__top-actions">
        <el-tooltip
          class="box-item"
          effect="dark"
          content="Rollback"
          show-after="1000"
          placement="top"
        >
          <el-button
            @click="onClickRollbackQuestion"
            :loading="isLoadingRollback"
            size="small"
            class="btn-default btn-icon"
          >
            <RollbackQuestionIcon/>
          </el-button>
        </el-tooltip>
      </div>

    </div>
    <div v-html="computedMessage" class="chat-bot-message-question__body"></div>
    <div class="chat-bot-message-question__bottom-actions">

      <el-tooltip
        class="box-item"
        effect="dark"
        content="Copy"
        placement="top"
        show-after="1000"
      >
        <el-button
          @click="onClickCopy"
          size="small"
          class="btn-default btn-icon"
        >
          <CopyIcon/>
        </el-button>
      </el-tooltip>

      <el-tooltip
        v-if="message.approve"
        class="box-item"
        effect="dark"
        content="Approve"
        placement="top"
        show-after="1000"
      >
        <el-button
          @click="onClickApproveQuestion"
          size="small"
          class="btn-default btn-icon"
          :loading="isLoadingApprove"
        >
          <ThumbUpIcon/>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import AiChaIcon from "@/assets/images/icons/ai-chat.svg";
import RollbackQuestionIcon from "@/assets/images/icons/rollback-question.svg";
import CopyIcon from "@/assets/images/icons/copy.svg";
import ThumbUpIcon from "@/assets/images/icons/thumb-up.svg";
import {computed, ref} from "vue";
import HelperMarkdown from "@/helpers/HelperMarkdown";
import HelperCopy from "@/helpers/HelperCopy";
import {ElNotification} from "element-plus";

const props = defineProps<{
  message: any,
}>()

const emit = defineEmits(['rollbackQuestion', 'approveQuestion']);
const isLoadingRollback = ref(false);
const isLoadingApprove = ref(false);
const computedMessage = computed(() => {
  const text = props.message.text;
  if (typeof text === 'object' && text !== null) {
    return JSON.stringify(text, null, 2);
  }

  return HelperMarkdown.parseMarkdown(text);
});

function onClickRollbackQuestion() {
  isLoadingRollback.value = true;
  emit('rollbackQuestion', props.message.raw);
}

function onClickApproveQuestion() {
  isLoadingApprove.value = true;
  emit('approveQuestion', props.message.raw);
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

  &__top-actions {
    margin-left: auto;
    position: relative;
    top: -10px;
  }

  &__bottom-actions {
    text-align: right;
  }

  &__body {
    font-size: 16px;
    line-height: 1.5;
    padding-right: 48px;
    padding-bottom: 16px;
    word-break: break-all;

    ul, ol {
      padding: 0 0 0 20px;
    }
  }

  &__actions {
    text-align: right;
  }
}
</style>
