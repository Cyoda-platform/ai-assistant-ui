<template>
  <div class="chat-bot">
    <ChatBotTopActions>
      <template #chat-name>
        <ChatBotName v-if="chatName" :chatName="chatName" :technicalId="technicalId"/>
      </template>
      <template #secondary-actions>
        <el-button @click="emit('toggleCanvas')" class="btn btn-default btn-icon btn-toggle-canvas">
          <OpenCanvasIcon/>
        </el-button>
      </template>
    </ChatBotTopActions>

    <div class="chat-bot__body">
      <div class="chat-bot__messages">
        <div class="chat-bot__inner-messages">
          <template v-for="message in messages">
            <el-row>
              <el-col :offset="getOffset(message.type)" :span="getSpan(message.type)">
                <ChatBotMessageQuestion
                  v-if="message.type === 'question'"
                  :message="message"
                  @rollbackQuestion="emit('rollbackQuestion', $event)"
                  @approveQuestion="emit('approveQuestion', $event)"
                />
                <ChatBotMessageNotification
                  v-if="message.type === 'notification'"
                  @updateNotification="emit('updateNotification', $event)"
                  :message="message"
                />
                <ChatBotMessageAnswer
                  v-if="message.type === 'answer'"
                  :message="message"/>
              </el-col>
            </el-row>
          </template>
          <ChatLoader v-if="isLoading"/>
        </div>
        <div class="chat-bot__form">
          <ChatBotSubmitForm @answer="emit('answer', $event)"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {watch} from "vue";
import ChatBotSubmitForm from "@/components/ChatBot/ChatBotSubmitForm.vue";
import ChatLoader from "@/components/ChatBot/ChatLoader.vue";
import OpenCanvasIcon from "@/assets/images/icons/open-canvas.svg";
import ChatBotMessageQuestion from "@/components/ChatBot/ChatBotMessageQuestion.vue";
import ChatBotMessageNotification from "@/components/ChatBot/ChatBotMessageNotification.vue";
import ChatBotMessageAnswer from "@/components/ChatBot/ChatBotMessageAnswer.vue";
import ChatBotTopActions from "@/components/ChatBot/ChatBotTopActions.vue";
import ChatBotName from "@/components/ChatBot/ChatBotName.vue";

const emit = defineEmits([
  'answer',
  'rollbackQuestion',
  'approveQuestion',
  'updateNotification',
  'toggleCanvas'
]);

const props = defineProps<{
  isLoading: boolean,
  messages: any[],
  technicalId: string,
  chatName: string | null,
}>();

function scrollDownMessages() {
  const messagesHtml = document.querySelector('.chat-bot__inner-messages');
  messagesHtml.scrollTo(0, messagesHtml.scrollHeight);
}

function getOffset(type) {
  if (type === 'answer') return 9;
  return ['question', 'notification'].includes(type) ? 1 : 8;
}

function getSpan(type) {
  return ['question', 'notification'].includes(type) ? 22 : 14;
}

watch(() => props.isLoading, () => {
  if (props.isLoading) return;
  setTimeout(() => {
    scrollDownMessages();
    window.getSelection().removeAllRanges();
  }, 500)
})
</script>

<style scoped lang="scss">
.layout-sidebar {
  display: flex;

  &__sidebar {
    min-height: 100vh;
    height: auto;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    border-right: 1px solid var(--sidebar-border);
    background-color: var(--bg-sidebar);
    width: 296px;

    &.hidden {
      width: 64px;
    }
  }

  &__main {
    flex: 1;
    min-height: 100vh;
    height: auto;
    background-color: var(--bg-sidebar-canvas);
  }
}
</style>

<style lang="scss">
.chat-bot {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;

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
    width: 91.6666666667%;
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
