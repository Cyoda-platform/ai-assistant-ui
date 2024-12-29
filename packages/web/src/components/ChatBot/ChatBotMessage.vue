<template>
  <el-row class="chat-bot-message" :class="{
    'chat-bot-message--question': message.type === 'question',
    'chat-bot-message--answer': message.type === 'answer',
    'chat-bot-message--notification': message.type === 'notification',
  }">
    <el-col :offset="offsetColumn" :span="12">
      <div class="chat-bot-message__inner">
        <div class="chat-bot-message__avatar">
          <template v-if="message.type === 'question'">
            <div class="inner-avatar"></div>
          </template>
          <template v-if="message.type === 'answer'">
            <img class="inner-avatar" src="../../assets/images/avatar.png">
          </template>
        </div>
        <div v-html="computedMessage" class="chat-bot-message__body">
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import {computed} from "vue";

const props = defineProps<{
  message: any,
}>()

const offsetColumn = computed(() => {
  return props.message.type === 'answer' ? 12 : 0;
});

const computedMessage = computed(() => {
  const text = props.message.text;
  if (typeof text === 'object' && text !== null) {
    return JSON.stringify(text, null, 2);
  }
  return text;
});
</script>

<style lang="scss">
.chat-bot-message {
  &--answer &__inner {
    padding-left: 30px;
  }

  &__inner {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }

  &__avatar .inner-avatar {
    width: 36px;
    height: 36px;
    background-color: rgba(0, 0, 0, 0.2);
    margin-right: 24px;
    border-radius: 8px;
  }

  &__body {
    border-radius: 24px;
    background-color: #EBEBEB;
    padding: 8px 16px;
    white-space: pre-wrap;
  }

  &--notification &__body {
    background-color: rgba(230, 162, 60, 0.5);
  }
}
</style>
