<template>
  <div class="chat-bot-canvas" :class="{'hidden':isSidebarHidden}">
    <div class="chat-bot-canvas__sidebar" :class="{'hidden':isSidebarHidden}">
      <SideBar/>
    </div>
    <div class="chat-bot-canvas__main">
      <ChatBotTopActions>
        <template #secondary-actions>
          <el-tooltip
            class="box-item"
            effect="dark"
            content="Close Canvas"
            :show-after="1000"
            placement="top"
          >
            <el-button @click="emit('toggleCanvas')" class="btn btn-default btn-icon btn-toggle-canvas">
              <CloseCanvasIcon/>
            </el-button>
          </el-tooltip>
        </template>
      </ChatBotTopActions>
      <ChatBotEditor :technicalId="technicalId" @answer="emit('answer', $event)" :isShowMarkdown="isShowMarkdown"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ChatBotEditor from "@/components/ChatBot/ChatBotEditor.vue";
import {computed, ref, watch} from "vue";

import CloseCanvasIcon from "@/assets/images/icons/close-canvas.svg";
import ChatBotTopActions from "@/components/ChatBot/ChatBotTopActions.vue";
import SideBar from "@/components/SideBar/SideBar.vue";
import useAppStore from "@/stores/app";

const appStore = useAppStore();
const isSidebarHidden = computed(() => appStore.isSidebarHidden);

const props = defineProps<{
  messages: any[],
  isLoading: boolean,
  technicalId: string,
  chatName: string,
}>();


const emit = defineEmits([
  'answer',
  'rollbackQuestion',
  'approveQuestion',
  'updateNotification',
  'toggleCanvas'
]);

const isShowMarkdown = ref(true);

function scrollDownMessages() {
  const messagesHtml = document.querySelector('.chat-bot-canvas__sidebar-messages');
  if (!messagesHtml) return;
  messagesHtml.scrollTo(0, messagesHtml.scrollHeight);
}

watch(() => props.isLoading, () => {
  if (props.isLoading) return;
  setTimeout(() => {
    scrollDownMessages();
    window.getSelection().removeAllRanges();
  }, 500)
})
</script>

<style lang="scss">
.chat-bot-canvas {
  display: flex;

  &__sidebar {
    border-right: 1px solid var(--sidebar-border);
    background-color: var(--bg-sidebar);
    height: 100vh;
    display: flex;
    flex-direction: column;
    width: 296px;

    &.hidden {
      width: 64px;
    }

    h2 {
      margin: 0;
      color: #606266;
      margin-left: 24px;
    }
  }

  &__sidebar-title {
    display: flex;
    align-items: center;
    margin: 0 15px;
  }

  .chat-bot-name {
    margin-left: 10px;
  }

  &__sidebar-messages {
    flex-grow: 1;
    overflow: auto;
    margin: 15px 0;
    padding: 0 15px;
  }

  &__message-answer {
    width: 60%;
    margin-left: 40%;
  }

  &__main {
    flex: 1;
    height: 100vh;
    transition: opacity 0.5s;
    background-color: var(--bg);
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
