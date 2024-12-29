<template>
  <div class="chat-bot">
    <div class="chat-bot__top_actions">
      <div class="chat-bot__top_actions_buttons">
        <el-tooltip
          class="box-item"
          effect="dark"
          content="Push"
          placement="top"
        >
          <el-button @click="onClickPush" class="btn btn-primary">
            <PushIcon class="icon"/>
          </el-button>
        </el-tooltip>
        <el-tooltip
          class="box-item"
          effect="dark"
          content="Approve"
          placement="top"
        >
          <el-button @click="onClickApprove" class="btn btn-primary">
            <ApproveIcon class="icon"/>
          </el-button>
        </el-tooltip>
        <el-tooltip
          class="box-item"
          effect="dark"
          content="Rollback"
          placement="top"
        >
          <el-button @click="onClickRollback" class="btn btn-primary">
            <RollbackIcon class="icon"/>
          </el-button>
        </el-tooltip>
        <span class="btn-wrapper">
          <EnvelopeIcon style="height: 2rem; color: #000000" class="envelope-icon"
                        :class="{'envelope-icon--active': isEnvelopeActive}"/>
        </span>
      </div>
      <el-form :model="form" label-width="auto">
        <el-form-item label="Go to canvas mode">
          <el-switch v-model="form.isShowCanvas"/>
        </el-form-item>
      </el-form>
    </div>
    <div class="chat-bot__body" :class="{'chat-bot__body--canvas': form.isShowCanvas}">
      <div class="chat-bot__messages">
        <div class="chat-bot__inner-messages">
          <ChatBotMessage ref="chatBotMessageRef" v-for="message in messages" :key="message.id" :message="message"/>
          <ChatLoader v-if="isLoading"/>
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
import PushIcon from "@/assets/images/icons/push.svg";
import ApproveIcon from "@/assets/images/icons/approve.svg";
import RollbackIcon from "@/assets/images/icons/rollback.svg";
import EnvelopeIcon from "@/assets/images/icons/envelope.svg";
import {v4 as uuidv4} from "uuid";

let intervalId = null;
let intervalEnvelopeId = null;
let promiseInterval: any = null;
const messages = ref<any[]>([]);
const assistantStore = useAssistantStore();
const isLoading = ref(false);
const chatBotMessageRef = ref(null);
const isEnvelopeActive = ref(false);
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
  if (promiseInterval) return;
  promiseInterval = assistantStore.getQuestions(props.technicalId);
  const {data} = await promiseInterval;
  data.questions.forEach((el) => {
    messages.value.push({
      id: uuidv4(),
      text: el.question || el.notification,
      type: el.question ? 'question' : 'notification'
    });
    if (el.notification) startEnvelopeFlash();
  })
  promiseInterval = null;
  isLoading.value = false;
}

function onAnswer(answer: string) {
  assistantStore.postTextAnswers(props.technicalId, answer);
  messages.value.push({
    text: answer,
    type: 'answer'
  });
  isLoading.value = true;
}

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
  if (intervalEnvelopeId) clearInterval(intervalEnvelopeId);
})

let messagesHtml: any = null;
watch(messages.value, (value) => {
  if (!value || messagesHtml) return;
  nextTick(() => {
    messagesHtml = document.querySelector('.chat-bot__inner-messages');
    new MutationObserver(() => {
      messagesHtml.scrollTo(0, messagesHtml.scrollHeight);
    }).observe(messagesHtml, {
      childList: true,
    });
  })
});

function onClickPush() {
  assistantStore.postPushNotify(props.technicalId);
  isLoading.value = true;
}

function onClickApprove() {
  assistantStore.postApprove(props.technicalId);
  isLoading.value = true;
}

function onClickRollback() {
  assistantStore.postRollback(props.technicalId);
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
</script>

<style lang="scss">
.chat-bot {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;

  &__top_actions {
    height: auto;
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
  }

  &__top_actions_buttons {
    display: flex;
    align-items: center;
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

  .btn-wrapper {
    margin-left: 12px;
  }

  .envelope-icon--active {
    fill: rgb(230, 162, 60);
  }
}
</style>
