<template>
  <el-row class="layout-sidebar">
    <el-col :span="sidebarSpan" class="layout-sidebar__sidebar">
      <SideBar/>
    </el-col>
    <el-col :span="mainSpan" class="layout-sidebar__main">
      <div class="chat-bot">
        <ChatBotTopActions
          @toggleCanvas="emit('toggleCanvas')"
          @push="emit('push')"
          @approve="emit('approve')"
          @rollback="emit('rollback')"
        >
          <template #toggle-canvas-icon>
            <OpenCanvasIcon/>
          </template>
        </ChatBotTopActions>

        <div class="chat-bot__body">
          <div class="chat-bot__messages">
            <div class="chat-bot__inner-messages">
              <el-row>
                <el-col :span="14">
                  <template v-for="message in messages">
                    <ChatBotMessageQuestion
                      v-if="message.type === 'question'"
                      :message="message"
                      @rollbackQuestion="emit('rollbackQuestion', $event)"
                    />
                    <ChatBotMessageNotification
                      v-if="message.type === 'notification'"
                      @updateNotification="emit('updateNotification', $event)"
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
              <ChatBotSubmitForm @answer="emit('answer', $event)"/>
            </div>
          </div>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted} from "vue";
import ChatBotSubmitForm from "@/components/ChatBot/ChatBotSubmitForm.vue";
import ChatLoader from "@/components/ChatBot/ChatLoader.vue";
import OpenCanvasIcon from "@/assets/images/icons/open-canvas.svg";
import ChatBotMessageQuestion from "@/components/ChatBot/ChatBotMessageQuestion.vue";
import ChatBotMessageNotification from "@/components/ChatBot/ChatBotMessageNotification.vue";
import ChatBotMessageAnswer from "@/components/ChatBot/ChatBotMessageAnswer.vue";
import ChatBotTopActions from "@/components/ChatBot/ChatBotTopActions.vue";
import SideBar from "@/components/SideBar/SideBar.vue";
import useAppStore from "@/stores/app";

const appStore = useAppStore();
let mutationObserverEl = null;

const sidebarSpan = computed(() => {
  return appStore.isSidebarHidden ? 2 : 5;
});

const mainSpan = computed(() => {
  return appStore.isSidebarHidden ? 22 : 19;
});

const emit = defineEmits([
  'push',
  'approve',
  'rollback',
  'answer',
  'rollbackQuestion',
  'updateNotification',
  'toggleCanvas'
]);

const props = defineProps<{
  isLoading: boolean,
  messages: any[],
}>();
onBeforeUnmount(() => {
  mutationObserverEl.disconnect();
})
onMounted(() => {
  scrollDownMessages();
})

function scrollDownMessages() {
  const messagesHtml = document.querySelector('.chat-bot__inner-messages');
  mutationObserverEl = new MutationObserver(() => {
    nextTick(() => {
      messagesHtml.scrollTo(0, messagesHtml.scrollHeight);
    })
  })
  mutationObserverEl.observe(messagesHtml, {
    childList: true,
  });
}
</script>

<style scoped lang="scss">
.layout-sidebar {
  &__sidebar {
    min-height: 100vh;
    height: auto;
    background: #fff;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    border-right: 1px solid rgba(20, 135, 81, 0.5);
  }

  &__main {
    min-height: 100vh;
    height: auto;
    padding: 0 30px;
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
