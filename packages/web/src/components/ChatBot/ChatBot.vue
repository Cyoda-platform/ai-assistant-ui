<template>
  <div class="chat-bot">
    <div class="chat-bot__top_actions">
      <div>
        <el-button @click="onClickShowCanvas" class="btn btn-default btn-icon">
          <OpenCanvasIcon/>
        </el-button>
      </div>
      <div>
        <el-tooltip
          class="box-item"
          effect="dark"
          content="Push"
          placement="top"
        >
          <el-button @click="onClickPush" class="btn btn-default btn-icon">
            <PushIcon class="icon"/>
          </el-button>
        </el-tooltip>
        <el-tooltip
          class="box-item"
          effect="dark"
          content="Approve"
          placement="top"
        >
          <el-button @click="onClickApprove" class="btn btn-default btn-icon">
            <ApproveIcon class="icon"/>
          </el-button>
        </el-tooltip>
        <el-tooltip
          class="box-item"
          effect="dark"
          content="Rollback"
          placement="top"
        >
          <el-button @click="onClickRollback" class="btn btn-default btn-icon">
            <RollbackIcon class="icon"/>
          </el-button>
        </el-tooltip>
        <el-button class="btn btn-default btn-icon">
          <BellIcon style="height: 2rem; color: #000000" class="bell-icon"
                    :class="{'bell-icon--active': isEnvelopeActive}"/>
        </el-button>
      </div>
    </div>
    <div class="chat-bot__body">
      <div class="chat-bot__messages">
        <div class="chat-bot__inner-messages">
          <el-row>
            <el-col :span="14">
              <template v-for="message in messages">
                <ChatBotMessageQuestion
                  v-if="message.type === 'question'"
                  :message="message"
                  @rollbackQuestion="onRollbackQuestion"
                />
                <ChatBotMessageNotification
                  v-if="message.type === 'notification'"
                  @updateNotification="onUpdateNotification"
                  :message="message"
                />
                <ChatBotMessageAnswer
                  v-if="message.type === 'answer'"
                  :message="message"/>
              </template>
            </el-col>
          </el-row>
          <ChatLoader v-if="isLoading"/>
        </div>
        <div class="chat-bot__form">
          <ChatBotSubmitForm @answer="onAnswer"/>
        </div>
      </div>
    </div>
    <ChatBotDialogCanvas ref="chatBotDialogCanvasRef"
                         @answer="onAnswer"
                         @push="onClickPush"
                         @approve="onClickApprove"
                         @rollback="onClickRollback"
                         @rollbackQuestion="onRollbackQuestion"
                         :technicalId="props.technicalId"
                         :isLoading="isLoading"
                         :messages="messages"/>
  </div>
</template>

<script lang="ts" setup>
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import useAssistantStore from "@/stores/assistant.ts";
import ChatBotSubmitForm from "@/components/ChatBot/ChatBotSubmitForm.vue";
import ChatLoader from "@/components/ChatBot/ChatLoader.vue";
import PushIcon from "@/assets/images/icons/push.svg";
import ApproveIcon from "@/assets/images/icons/approve.svg";
import RollbackIcon from "@/assets/images/icons/rollback.svg";
import BellIcon from "@/assets/images/icons/bell.svg";
import OpenCanvasIcon from "@/assets/images/icons/open-canvas.svg";
import {v4 as uuidv4} from "uuid";
import ChatBotMessageQuestion from "@/components/ChatBot/ChatBotMessageQuestion.vue";
import ChatBotMessageNotification from "@/components/ChatBot/ChatBotMessageNotification.vue";
import ChatBotMessageAnswer from "@/components/ChatBot/ChatBotMessageAnswer.vue";
import ChatBotDialogCanvas from "@/components/ChatBot/ChatBotDialogCanvas.vue";

let intervalId: any = null;
let intervalEnvelopeId: any = null;
let promiseInterval: any = null;
const messages = ref<any[]>([]);
const assistantStore = useAssistantStore();
const isLoading = ref(false);
const isEnvelopeActive = ref(false);
const chatBotDialogCanvasRef = ref(null);

const props = defineProps<{
  technicalId: string;
}>();

onMounted(() => {
  init();
})

function init() {
  loadChatHistory();
  intervalId = setInterval(() => {
    getQuestions();
  }, 5000);
  getQuestions();
}

async function loadChatHistory() {
  try {
    messages.value = [];
    isLoading.value = true;
    const {data} = await assistantStore.getChatById(props.technicalId);
    data.chat_body.dialogue.forEach((el) => {
      addMessage(el);
    })
  } finally {
    isLoading.value = false;
  }
}

async function getQuestions() {
  if (promiseInterval) return;
  promiseInterval = assistantStore.getQuestions(props.technicalId);
  const {data} = await promiseInterval;
  data.questions.forEach((el) => {
    addMessage(el);
    if (el.notification) startEnvelopeFlash();
  })
  promiseInterval = null;
  isLoading.value = false;
}

function onAnswer(answer: string) {
  assistantStore.postTextAnswers(props.technicalId, answer);
  addMessage({answer});
  isLoading.value = true;
}

function addMessage(el) {
  let type = 'answer'; // Значение по умолчанию
  if (el.question) type = 'question';
  else if (el.notification) type = 'notification';

  messages.value.push({
    id: uuidv4(),
    text: el.question || el.notification || el.answer,
    editable: !!el.editable,
    raw: el,
    type
  });
}

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
  if (intervalEnvelopeId) clearInterval(intervalEnvelopeId);
})

onMounted(() => {
  scrollDownMessages();
})

function scrollDownMessages() {
  const messagesHtml = document.querySelector('.chat-bot__inner-messages');
  new MutationObserver(() => {
    messagesHtml.scrollTo(0, messagesHtml.scrollHeight);
  }).observe(messagesHtml, {
    childList: true,
  });
}

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

function onClickShowCanvas() {
  chatBotDialogCanvasRef.value.dialogVisible = true;
}

async function onRollbackQuestion(question) {
  await assistantStore.postRollbackQuestion(props.technicalId, question);
  isLoading.value = true;
  loadChatHistory();
}

async function onUpdateNotification(notification) {
  await assistantStore.putNotification(props.technicalId, notification);
  isLoading.value = true;
  loadChatHistory();
}

watch(() => props.technicalId, () => {
  loadChatHistory();
})
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
    align-items: center;
    justify-content: space-between;
    margin: 15px 0;
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
    padding-left: 5px;
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

  .bell-icon {
    position: relative;
    top: 4px;
  }

  .bell-icon--active {
    fill: rgb(230, 162, 60);
  }
}
</style>
