<template>
  <ChatBot
      :technicalId="technicalId"
      :chatName="chatName"
      @answer="onAnswer"
      @approve="onClickApprove"
      @rollbackQuestion="onRollbackQuestion"
      @approveQuestion="onApproveQuestion"
      @toggleCanvas="onToggleCanvas"
      @updateNotification="onUpdateNotification"
      :disabled="disabled"
      :isLoading="isLoading"
      :messages="messages"
      :entitiesData="entitiesData"
  />

  <el-dialog
      v-model="canvasVisible"
      fullscreen
      class="chat-bot-dialog"
      :close-on-click-modal="false"
  >
    <ChatBotCanvas
        :technicalId="technicalId"
        :chatName="chatName"
        @answer="onAnswer"
        @approve="onClickApprove"
        @rollbackQuestion="onRollbackQuestion"
        @approveQuestion="onApproveQuestion"
        @toggleCanvas="onToggleCanvas"
        @updateNotification="onUpdateNotification"
        :isLoading="isLoading"
        :messages="messages"
        :entitiesData="entitiesData"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import ChatBot from "@/components/ChatBot/ChatBot.vue";
import {computed, provide} from "vue";
import {useRoute} from "vue-router";
import ChatBotCanvas from "@/components/ChatBot/ChatBotCanvas.vue";
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import useAssistantStore from "@/stores/assistant.ts";
import HelperStorage from "@/helpers/HelperStorage.ts";
import useAuthStore from "@/stores/auth";
import eventBus from "@/plugins/eventBus";
import {DELETE_CHAT_START} from "@/helpers/HelperConstants";
import Tinycon from 'tinycon';
import {ElMessage} from "element-plus";

const helperStorage = new HelperStorage();
const route = useRoute();

const technicalId = computed(() => {
  return route.params.technicalId as string;
});

const canvasVisible = ref(helperStorage.get(`chatDialog:${technicalId.value}`, false));

provide('canvasVisible', canvasVisible);

let pollChatTimeoutId: any = null;
let intervalEnvelopeId: any = null;
let promiseInterval: any = null;
let abortController: any = null;
const chatName = ref<string | null>(null);
const entitiesData = ref<string | null>({});
const messages = ref<any[]>([]);
const assistantStore = useAssistantStore();
const isLoading = ref(false);
const isEnvelopeActive = ref(false);
const authStore = useAuthStore();
const countNewMessages = ref(0);
const originalTitle = 'Cyoda AI Assistant';
const disabled = ref(false);

const BASE_INTERVAL = import.meta.env.VITE_APP_QUESTION_POLLING_INTERVAL_MS || 5000;
const MAX_INTERVAL = import.meta.env.VITE_APP_QUESTION_MAX_POLLING_INTERVAL || 7000;
const JITTER_PERCENT = 0.1;
let currentInterval = BASE_INTERVAL;

provide('entitiesData', entitiesData);

onMounted(() => {
  init();
  isLoading.value = true;
  eventBus.$on(DELETE_CHAT_START, onDeleteChat);
  window.addEventListener('focus', onFocusDocument);
})

onBeforeUnmount(() => {
  clearIntervals();
  eventBus.$off(DELETE_CHAT_START, onDeleteChat);
  window.removeEventListener('focus', onFocusDocument);
})

function onFocusDocument() {
  countNewMessages.value = 0;
}

function init() {
  const params = new URLSearchParams(window.location.search);
  const authState = params.get('authState');
  if (authState) {
    authStore.saveData(JSON.parse(authState));

    const url = new URL(window.location.href)
    url.searchParams.delete('authState')
    window.history.replaceState({}, '', url)
  }

  if (route.query.isNew) {
    const url = new URL(window.location.href)
    url.searchParams.delete('isNew')
    window.history.replaceState({}, '', url)
  }
  pollChat();
}

async function loadChatHistory() {
  if (promiseInterval || !technicalId.value) return false;
  abortController = new AbortController();
  const newResults = [];
  const isFirstRequest = !messages.value.length;
  try {
    promiseInterval = assistantStore.getChatById(technicalId.value, {signal: abortController.signal});
    const {data} = await promiseInterval;
    chatName.value = data.chat_body.name;
    entitiesData.value = data.chat_body.entities_data;
    data.chat_body.dialogue.forEach((el) => {
      const result = addMessage(el);
      newResults.push(result);
    })
    if (messages.value[messages.value.length - 1]?.type !== 'answer') isLoading.value = false;
  } finally {
    promiseInterval = null;
  }

  if (!isFirstRequest && messages.value[messages.value.length - 1]?.type !== 'answer') countNewMessages.value += newResults.filter(el => el).length;
  return newResults.some(el => el);
}

async function pollChat() {
  try {
    const gotNew = await loadChatHistory();
    currentInterval = gotNew
        ? BASE_INTERVAL
        : Math.min(currentInterval * 2, MAX_INTERVAL);
  } catch (err) {
    currentInterval = Math.min(currentInterval * 2, MAX_INTERVAL);
  }

  const jitterFactor = 1 + (Math.random() * 2 - 1) * JITTER_PERCENT;
  const nextDelay = Math.round(currentInterval * jitterFactor);
  pollChatTimeoutId = setTimeout(pollChat, nextDelay);
}

async function onAnswer(answer: any) {
  disabled.value = true;
  let response;
  if (answer.file) {
    const formData = new FormData();
    formData.append('file', answer.file);
    formData.append('answer', answer.answer);

    const {data} = await assistantStore.postAnswers(technicalId.value, formData);
    response = data;
  } else {
    const {data} = await assistantStore.postTextAnswers(technicalId.value, answer);
    response = data;
  }
  if (!response.answer_technical_id) return;
  answer.technical_id = response.answer_technical_id;
  addMessage(answer);
  isLoading.value = true;
  loadChatHistory();
}

function addMessage(el) {
  let type = 'answer';
  if (el.question) type = 'question';
  else if (el.notification) type = 'notification';
  else if (el.type==='ui_function') type = 'ui_function';

  if (messages.value.find(m => m.id === el.technical_id)) return false;

  messages.value.push({
    id: el.technical_id,
    text: el.question || el.notification || el.answer || el.message,
    file: el.file,
    editable: !!el.editable,
    approve: !!el.approve,
    raw: el,
    type
  });

  return true;
}

function onDeleteChat() {
  clearIntervals();
}

function clearIntervals() {
  if (promiseInterval) promiseInterval = null;
  if (pollChatTimeoutId) clearInterval(pollChatTimeoutId);
  if (intervalEnvelopeId) clearInterval(intervalEnvelopeId);
}

function onClickApprove() {
  assistantStore.postApprove(technicalId.value);
  isLoading.value = true;
}

function startEnvelopeFlash() {
  if (intervalEnvelopeId) return;
  isEnvelopeActive.value = true;
  intervalEnvelopeId = setTimeout(() => {
    isEnvelopeActive.value = false;
    intervalEnvelopeId = null;
  }, 500);
}

async function onRollbackQuestion(event) {
  isLoading.value = true;
  try {
    await assistantStore.postRollbackQuestion(technicalId.value, event);
  } catch {
    isLoading.value = false;
  }
  await loadChatHistory();
}

async function onApproveQuestion(event) {
  isLoading.value = true;
  try {
    await assistantStore.postApproveQuestion(technicalId.value, event);
  } catch {
    isLoading.value = false;
  }
  await loadChatHistory();
}

function onToggleCanvas() {
  canvasVisible.value = !canvasVisible.value;
  helperStorage.set(`chatDialog:${technicalId.value}`, canvasVisible.value)
}


async function onUpdateNotification(notification) {
  isLoading.value = true;
  try {
    await assistantStore.putNotification(technicalId.value, notification);
  } catch {
    isLoading.value = false;
  }
  await loadChatHistory();
}

watch(technicalId, () => {
  messages.value = [];
  isLoading.value = true;
  if (abortController) abortController.abort();
  chatName.value = null;
  abortController = null;
  clearIntervals();
  init();
})

watch(countNewMessages, (newVal) => {
  if (document.hasFocus() && newVal > 0) {
    ElMessage({
      message: 'New message!',
      type: 'info',
      plain: true,
      duration: 5000,
      grouping: true,
      showClose: true,
    })
  } else if (newVal > 0) {
    document.title = `(${newVal}) New question${newVal > 1 ? 's' : ''}`;
    Tinycon.setBubble(newVal);
  }

  if (newVal === 0) {
    document.title = originalTitle;
    Tinycon.setBubble(0);
  }
});

watch(isLoading, () => {
  disabled.value = isLoading.value;
})
</script>

<style>
.chat-bot-dialog {
  padding: 0;

  > .el-dialog__header {
    display: none;
  }
}
</style>
