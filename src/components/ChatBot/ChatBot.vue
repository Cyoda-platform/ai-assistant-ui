<template>
  <div class="chat-bot">
    <el-row class="chat-bot__top_actions">
      <el-col :span="24" class="chat-bot__right">
        <el-form :model="form" label-width="auto">
          <el-form-item label="Go to terminal mode">
            <el-switch v-model="form.terminalMode"/>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
    <div class="chat-bot__messages">
      <ChatBotMessage ref="chatBotMessageRef" v-for="(message, index) in messages" :key="index" :message="message"/>
      <ChatLoader v-if="isLoadingQuestions"/>
    </div>
    <div class="form">
      <ChatBotSubmitForm @answer="onAnswer" :technicalId="props.technicalId"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import useAssistantStore from "@/stores/assistant.ts";
import ChatBotMessage from "@/components/ChatBot/ChatBotMessage.vue";
import ChatBotSubmitForm from "@/components/ChatBot/ChatBotSubmitForm.vue";
import ChatLoader from "@/components/ChatBot/ChatLoader.vue";

let intervalId = null;
let promiseInterval: any = null;
const messages = ref<any[]>([]);
const assistantStore = useAssistantStore();
const isLoadingQuestions = ref(false);
const chatBotMessageRef = ref(null);

const form = ref({
  terminalMode: false
})

const props = defineProps<{
  technicalId: string
}>()

onMounted(() => {
  init();
})

function init() {
  intervalId = setInterval(() => {
    getQuestions();
  }, 5000);
  getQuestions();
}

async function getQuestions() {
  if (!promiseInterval) {
    promiseInterval = assistantStore.getQuestions(props.technicalId);
  }
  const {data} = await promiseInterval;
  data.questions.forEach((el) => {
    messages.value.push({
      text: el.question || el.notification,
      type: 'question'
    });
  })
  promiseInterval = null;
  isLoadingQuestions.value = false;
}

function onAnswer(text: string) {
  messages.value.push({
    text,
    type: 'answer'
  });
  isLoadingQuestions.value = true;
}

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
})

let messagesHtml:any = null;
watch(messages.value, (value) => {
  if (!value || messagesHtml) return;
  nextTick(() => {
    messagesHtml = document.querySelector('.chat-bot__messages');
    new MutationObserver(() => {
      messagesHtml.scrollTo(0, messagesHtml.scrollHeight);
    }).observe(messagesHtml, {
      childList: true,
    });
  })
});

function scrollToBottom() {
  const lastElement = chatBotMessageRef.value[chatBotMessageRef.value.length - 1];
  if (lastElement) {
    lastElement.scrollIntoView({behavior: 'smooth'});
  }
}
</script>

<style lang="scss">
.chat-bot {
  display: flex;
  flex-direction: column;
  height: 100vh;

  &__top_actions {
    height: auto;
  }

  &__right {
    justify-items: end;
    padding-right: 15px;
    padding-top: 15px;
  }

  &__messages {
    flex-grow: 1;
    overflow-y: auto;
    margin-bottom: 20px;
  }
}
</style>
