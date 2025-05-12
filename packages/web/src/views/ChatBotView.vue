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
    :isLoading="isLoading"
    :messages="messages"
    :entitiesData="entitiesData"
  />

  <el-dialog
    v-model="dialogVisible"
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

const questionPollingInterval = import.meta.env.VITE_APP_QUESTION_POLLING_INTERVAL_MS || 5000;

const helperStorage = new HelperStorage();
const route = useRoute();

const technicalId = computed(() => {
  return route.params.technicalId as string;
});

const dialogVisible = ref(helperStorage.get(`chatDialog:${technicalId.value}`, false));

let intervalId: any = null;
let intervalEnvelopeId: any = null;
let promiseInterval: any = null;
const chatName = ref<string | null>(null);
const entitiesData = ref<string | null>({});
const messages = ref<any[]>([]);
const assistantStore = useAssistantStore();
const isLoading = ref(false);
const isEnvelopeActive = ref(false);
const authStore = useAuthStore();

provide('entitiesData', entitiesData);

onMounted(() => {
  init();
})

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
  intervalId = setInterval(() => {
    loadChatHistory();
  }, questionPollingInterval);
  loadChatHistory();
}

async function loadChatHistory() {
  if (promiseInterval) return;
  try {
    promiseInterval = assistantStore.getChatById(technicalId.value);
    const {data} = await promiseInterval;
    chatName.value = data.chat_body.name;
    entitiesData.value = data.chat_body.entities_data;
    data.chat_body.dialogue.forEach((el) => {
      addMessage(el);
    })
    if (messages.value[messages.value.length - 1]?.type !== 'answer') isLoading.value = false;
  } finally {
    promiseInterval = null;
  }
}

async function onAnswer(answer: any) {
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

  if (messages.value.find(m => m.id === el.technical_id)) return;

  messages.value.push({
    id: el.technical_id,
    text: el.question || el.notification || el.answer,
    file: el.file,
    editable: !!el.editable,
    approve: !!el.approve,
    raw: el,
    type
  });
}

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
  if (intervalEnvelopeId) clearInterval(intervalEnvelopeId);
})

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
  await assistantStore.postRollbackQuestion(technicalId.value, event);
  isLoading.value = true;
  await loadChatHistory();
}

async function onApproveQuestion(event) {
  await assistantStore.postApproveQuestion(technicalId.value, event);
  isLoading.value = true;
  await loadChatHistory();
}

function onToggleCanvas() {
  dialogVisible.value = !dialogVisible.value;
  helperStorage.set(`chatDialog:${technicalId.value}`, dialogVisible.value)
}


async function onUpdateNotification(notification) {
  await assistantStore.putNotification(technicalId.value, notification);
  isLoading.value = true;
  await loadChatHistory();
}

watch(technicalId, () => {
  messages.value = [];
  isLoading.value = true;
  loadChatHistory();
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
