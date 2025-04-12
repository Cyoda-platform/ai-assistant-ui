<template>
  <div class="new-chat">
    <h1 class="new-chat-h1">BUILD BEAUTIFULLY</h1>
    <h2>Build, deploy and scale data-intensive operational services</h2>
    <div class="new-chat__title">
      <img class="only-theme-light" src="@/assets/images/logo.gif"/>
      <img class="only-theme-dark" src="@/assets/images/logo-dark.gif"/>
      What do you want to do?
    </div>

    <div class="new-chat__form" :class="{
      'is-loading': isLoading
    }">
      <el-input
        v-model="form.name"
        :disabled="isLoading"
        type="textarea"
        resize="none"
        :autosize="{ minRows: 1, maxRows: 10 }"
        placeholder="Build a microservice which is a scalable and can integrate and scale up"
      />
      <el-button :loading="isLoading" class="btn btn-primary btn-icon"
                 @click.prevent="onClickSend">
        <SendIcon/>
      </el-button>
    </div>

    <div class="new-chat__examples">
      <div class="new-chat__examples-title">For example</div>
      <div class="new-chat__buttons">
        <el-button
          v-for="example in examples"
          @click="onClickExample(example)"
          :class="{
            'readonly': example.readonly
          }"
        >
          {{ example.text }}
        </el-button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import SendIcon from '@/assets/images/icons/send.svg';

import {ref} from "vue";
import eventBus from "@/plugins/eventBus";
import {UPDATE_CHAT_LIST} from "@/helpers/HelperConstants";
import useAssistantStore from "@/stores/assistant";
import type {CreateChatResponse} from "@/types/chat.d";

const assistantStore = useAssistantStore();
const form = ref({
  name: '',
  description: '',
});

const emit = defineEmits<{
  created: [value: CreateChatResponse]
}>()

const isLoading = ref(false);

const examples = [
  {
    text: 'Create new workflow',
  },
  {
    text: 'Design small, independently deployable services',
  },
  {
    text: 'Build new application for retail company',
  },
  {
    text: 'Assist with a schema',
  },
  {
    text: '+10к different requests',
    readonly: true,
  }
];

function onClickExample(example) {
  if (example.readonly) return;

  form.value.name = example.text;
}

async function onClickSend() {
  isLoading.value = true;
  try {
    const {data} = await assistantStore.chats(form.value);
    emit('created', data);
    eventBus.$emit(UPDATE_CHAT_LIST);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style lang="scss">
.new-chat {
  max-width: 800px;
  margin: 0 auto;

  h1 {
    color: var(--color-title);
    margin: 0;
    font-size: 28px;
    text-align: center;
    font-weight: 600;
    letter-spacing: 2px;
  }

  h2 {
    color: var(--color-sub-title);
    font-size: 24px;
    font-weight: 400;
    text-align: center;
    margin: 12px 0;
  }

  &__title {
    color: var(--color-sub-title);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    font-weight: 400;
    margin: 24px 0;

    img {
      width: 120px;
      margin-right: 10px;
    }
  }

  &__form {
    display: flex;
    align-items: center;
    padding: 16px;
    border: 1px solid var(--input-border);
    border-radius: 10px;
    background: var(--input);

    &.is-loading {
      background-color: var(--input-disabled);
    }

    .el-textarea__inner {
      box-shadow: none !important;
      padding: 9px 0;
    }

    .btn-icon {
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      svg {
        fill: #fff;
      }
    }
  }

  .new-chat__examples-title {
    padding: 23px 0;
    text-align: center;
    font-size: 16px;
    font-weight: 400;
    color: var(--color-white-examples);
  }

  &__buttons {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
    padding-bottom: 12px;

    .el-button + .el-button {
      margin: 0;
    }

    .el-button {
      outline: none !important;
      border-color: var(--bg-new-chat-button);
      background: var(--bg-new-chat-button);
      font-size: 16px;
      font-weight: 400;
      border-radius: 4px;
      transition: all 0.3s;

      &:hover {
        background: var(--bg-new-chat-button-hover);
        border-color: var(--bg-new-chat-button-hover);
      }

      &.readonly {
        background: var(--bg-new-chat-button-readonly);
        border-color: var(--bg-new-chat-button-readonly);
        cursor: default;

        &:hover {
          background: var(--bg-new-chat-button-readonly);
          border-color: var(--bg-new-chat-button-readonly);
        }
      }
    }
  }
}
</style>
