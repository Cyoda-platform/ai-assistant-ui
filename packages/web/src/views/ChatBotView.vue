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
  />

  <el-dialog
    v-model="dialogVisible"
    fullscreen
    class="chat-bot-dialog"
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
    />
  </el-dialog>
</template>

<script setup lang="ts">
import ChatBot from "@/components/ChatBot/ChatBot.vue";
import {computed} from "vue";
import {useRoute, useRouter} from "vue-router";
import ChatBotCanvas from "@/components/ChatBot/ChatBotCanvas.vue";
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import useAssistantStore from "@/stores/assistant.ts";
import {v4 as uuidv4} from "uuid";
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
const messages = ref<any[]>([]);
const assistantStore = useAssistantStore();
const isLoading = ref(false);
const isEnvelopeActive = ref(false);
const router = useRouter();
const authStore = useAuthStore();

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
  } else {
    loadChatHistory();
  }
  intervalId = setInterval(() => {
    getQuestions();
  }, questionPollingInterval);
  getQuestions();
}

async function loadChatHistory() {
  try {
    messages.value = [];
    isLoading.value = true;
    const {data} = await assistantStore.getChatById(technicalId.value);
    chatName.value = data.chat_body.name;
    data.chat_body.dialogue.forEach((el) => {
      addMessage(el);
    })
  } finally {
    isLoading.value = false;
  }
}

async function getQuestions() {
  if (promiseInterval) return;
  promiseInterval = assistantStore.getQuestions(technicalId.value);
  const {data} = await promiseInterval;
  data.questions.forEach((el) => {
    addMessage(el);
    if (el.notification) startEnvelopeFlash();
  })
  promiseInterval = null;
  isLoading.value = false;
}

function onAnswer(answer: any) {
  if (answer.file) {
    const formData = new FormData();
    formData.append('file', answer.file);
    formData.append('answer', answer.answer);

    assistantStore.postAnswers(technicalId.value, formData);
  } else {
    assistantStore.postTextAnswers(technicalId.value, answer);
  }
  addMessage(answer);
  isLoading.value = true;
}

function addMessage(el) {
  let type = 'answer';
  if (el.question) type = 'question';
  else if (el.notification) type = 'notification';

  messages.value.push({
    id: uuidv4(),
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
  loadChatHistory();
}

async function onApproveQuestion(event) {
  await assistantStore.postApproveQuestion(technicalId.value, event);
  isLoading.value = true;
  loadChatHistory();
}

function onToggleCanvas() {
  dialogVisible.value = !dialogVisible.value;
  helperStorage.set(`chatDialog:${technicalId.value}`, dialogVisible.value)
}


async function onUpdateNotification(notification) {
  await assistantStore.putNotification(technicalId.value, notification);
  isLoading.value = true;
  loadChatHistory();
}

watch(technicalId, () => {
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
