<template>
  <el-row class="layout-sidebar">
    <el-col :span="sidebarSpan" class="layout-sidebar__sidebar">
      <SideBar/>
    </el-col>
    <el-col :span="mainSpan" class="layout-sidebar__main">
      <div class="chat-bot">
        <ChatBotTopActions
          @toggleCanvas="emit('toggleCanvas')"
        >
          <template #toggle-canvas-icon>
            <OpenCanvasIcon/>
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

const sidebarSpan = computed(() => {
  return appStore.isSidebarHidden ? 2 : 5;
});

const mainSpan = computed(() => {
  return appStore.isSidebarHidden ? 22 : 19;
});

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
}>();

function getOffset(type){
  return ['question', 'notification'].includes(type) ? 1: 8;
}

function getSpan(type){
  return ['question', 'notification'].includes(type) ? 21: 14;
}
</script>

<style scoped lang="scss">
@use "@/assets/css/particular/variables";

.layout-sidebar {
  &__sidebar {
    min-height: 100vh;
    height: auto;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    border-right: 1px solid variables.$accent-border;
    background-color: variables.$bg-sidebar;
  }

  &__main {
    min-height: 100vh;
    height: auto;
    padding: 0 30px;
    background-color: variables.$bg;
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
