<template>
  <el-dialog
    v-model="dialogVisible"
    fullscreen
    draggable
    class="chat-bot-dialog-canvas"
  >
    <el-row>
      <el-col :span="5" class="chat-bot-dialog-canvas__sidebar">
        <h2>Cyoda Chat with Canvas</h2>
        <div class="chat-bot-dialog-canvas__sidebar-messages">
          <template v-for="message in props.messages">
            <ChatBotMessageQuestion v-if="isQuestion(message)" :message="message"/>
            <ChatBotMessageAnswer v-if="isAnswer(message)" :message="message"/>
          </template>
          <ChatLoader v-if="props.isLoading"/>
        </div>
        <ChatBotDialogCanvasSubmitForm @answer="emit('answer', $event)"/>
      </el-col>
      <el-col :span="19" class="chat-bot-dialog-canvas__main">
        <div class="chat-bot-dialog-canvas__top_actions">
          <div>
            <el-button @click="onClickCloseCanvas" class="btn btn-default btn-icon">
              <CloseCanvasIcon/>
            </el-button>
          </div>
          <div>
            <el-tooltip
              class="box-item"
              effect="dark"
              content="Push"
              placement="top"
            >
              <el-button @click="emit('push')" class="btn btn-default btn-icon">
                <PushIcon class="icon"/>
              </el-button>
            </el-tooltip>
            <el-tooltip
              class="box-item"
              effect="dark"
              content="Approve"
              placement="top"
            >
              <el-button @click="emit('approve')" class="btn btn-default btn-icon">
                <ApproveIcon class="icon"/>
              </el-button>
            </el-tooltip>
            <el-tooltip
              class="box-item"
              effect="dark"
              content="Rollback"
              placement="top"
            >
              <el-button @click="emit('rollback')" class="btn btn-default btn-icon">
                <RollbackIcon class="icon"/>
              </el-button>
            </el-tooltip>
            <el-button class="btn btn-default btn-icon">
              <BellIcon style="height: 2rem; color: #000000" class="bell-icon"
                        :class="{'bell-icon--active': isEnvelopeActive}"/>
            </el-button>
          </div>
        </div>
        <ChatBotCanvas :technicalId="technicalId" @answer="emit('answer', $event)"/>
      </el-col>
    </el-row>
  </el-dialog>
</template>

<script lang="ts" setup>
import ChatBotCanvas from "@/components/ChatBot/ChatBotCanvas.vue";
import {nextTick, ref, watch} from "vue";
import ChatBotMessageAnswer from "@/components/ChatBot/ChatBotMessageAnswer.vue";
import ChatBotMessageQuestion from "@/components/ChatBot/ChatBotMessageQuestion.vue";
import PushIcon from "@/assets/images/icons/push.svg";
import ApproveIcon from "@/assets/images/icons/approve.svg";
import RollbackIcon from "@/assets/images/icons/rollback.svg";
import BellIcon from "@/assets/images/icons/bell.svg";
import CloseCanvasIcon from "@/assets/images/icons/close-canvas.svg";
import ChatBotDialogCanvasSubmitForm from "@/components/ChatBot/ChatBotDialogCanvasSubmitForm.vue";
import ChatLoader from "@/components/ChatBot/ChatLoader.vue";

const props = defineProps<{
  messages: any[],
  technicalId: string,
  isLoading: boolean,
}>();

const isEnvelopeActive = ref(false);
const dialogVisible = ref(false);
const emit = defineEmits(['push', 'approve', 'rollback', 'answer']);

function isQuestion(message) {
  return ['question', 'notification'].includes(message.type);
}

function isAnswer(message) {
  return ['answer'].includes(message.type);
}

defineExpose({dialogVisible});

function onClickCloseCanvas() {
  dialogVisible.value = false;
}

let mutationObserverEl = null;

function scrollDownMessages() {
  const messagesHtml = document.querySelector('.chat-bot-dialog-canvas__sidebar-messages');
  mutationObserverEl = new MutationObserver(() => {
    messagesHtml.scrollTo(0, messagesHtml.scrollHeight);
  });
  mutationObserverEl.observe(messagesHtml, {
    childList: true,
  });
}

watch(dialogVisible, (value) => {
  if (value) {
    nextTick(() => scrollDownMessages())
  } else {
    mutationObserverEl.disconnect();
  }
})

</script>

<style lang="scss">
.chat-bot-dialog-canvas {
  padding: 0;

  .el-dialog__header {
    display: none;
  }

  &__sidebar {
    padding: 36px 15px;
    background-color: #FFFFF4;
    border-right: 1px solid #ccd0d7;
    height: 100vh;
    display: flex;
    flex-direction: column;

    h2 {
      margin: 0;
      color: #606266;
    }
  }

  &__sidebar-messages {
    flex-grow: 1;
    overflow: auto;
    margin: 15px 0;
    padding: 0 15px;
  }

  &__main {
    padding: 0 30px;
    height: 100vh;
  }

  &__top_actions {
    height: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 15px 0;
  }
}
</style>
