<template>
  <div class="chat-bot">
    <el-row class="chat-bot__top_actions">
      <el-col :span="24" class="chat-bot__right">
        <el-form :model="form" label-width="auto">
          <el-form-item label="Go to canvas mode">
            <el-switch v-model="form.isShowCanvas"/>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
    <div class="chat-bot__body" :class="{'chat-bot__body--canvas': form.isShowCanvas}">
      <div class="chat-bot__messages">
        <div class="chat-bot__inner-messages">
          <ChatBotMessage ref="chatBotMessageRef" v-for="(message, index) in messages" :key="index" :message="message"/>
          <ChatLoader v-if="isLoadingQuestions"/>
        </div>
        <div class="chat-bot__form" :class="{'chat-bot__body--canvas': form.isShowCanvas}">
          <ChatBotSubmitForm @answer="onAnswer" :technicalId="props.technicalId"/>
        </div>
      </div>
      <div v-if="form.isShowCanvas" class="chat-bot__canvas">
        <ChatBotCanvas :technicalId="technicalId" @answer="onAnswer"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import useAssistantStore from "@/stores/assistant.ts";
import ChatBotMessage from "@/components/ChatBot/ChatBotMessage.vue";
import ChatBotSubmitForm from "@/components/ChatBot/ChatBotSubmitForm.vue";
import ChatLoader from "@/components/ChatBot/ChatLoader.vue";
import ChatBotCanvas from "@/components/ChatBot/ChatBotCanvas.vue";

let intervalId = null;
let promiseInterval: any = null;
const messages = ref<any[]>([]);
const assistantStore = useAssistantStore();
const isLoadingQuestions = ref(false);
const chatBotMessageRef = ref(null);
const form = ref({
  isShowCanvas: false
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

function onAnswer(answer: string) {
  assistantStore.postTextAnswers(props.technicalId, answer);
  messages.value.push({
    text: answer,
    type: 'answer'
  });
  isLoadingQuestions.value = true;
}

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
})

let messagesHtml: any = null;
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
  overflow: hidden;

  &__top_actions {
    height: auto;
  }

  &__right {
    margin-top: 15px;
    text-align: right;
    display: flex;
    justify-content: right;
  }

  &__body {
    flex-grow: 1;
    margin-bottom: 20px;
    display: flex;
    overflow: hidden;
  }

  &__messages {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  &__inner-messages {
    flex-grow: 1;
    flex-direction: column;
    display: flex;
    overflow-y: auto;
  }

  .chat-bot-submit-form {
    width: 90%;
    margin: 0 auto;
  }

  &__form {
    margin-top: 20px;
  }

  &__body--canvas {
    display: flex;
    gap: 30px;

    .chat-bot__messages, .chat-bot__canvas {
      flex: 1;

      .chat-bot-submit-form {
        width: 100%;
      }
    }
  }
}
</style>
