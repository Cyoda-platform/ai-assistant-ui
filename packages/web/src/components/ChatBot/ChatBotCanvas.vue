<template>
  <div class="chat-bot-canvas" :class="{
    resizing: isResizing
  }">
    <el-row>
      <el-col :span="5" class="chat-bot-canvas__sidebar" :style="{ flexBasis: sideBarWidth, maxWidth: sideBarWidth }">
        <div class="chat-bot-canvas__drag" @mousedown="startResize"></div>
        <div class="chat-bot-canvas__sidebar-title">
          <el-button @click="drawerVisible=true" class="btn-default btn-icon">
            <ToggleSidebar/>
          </el-button>
          <h2>Cyoda Chat with Canvas</h2>
        </div>
        <div class="chat-bot-canvas__sidebar-messages">
          <template v-for="message in props.messages">
            <ChatBotMessageQuestion
              v-if="message.type === 'question'"
              :message="message"
              @rollbackQuestion="emit('rollbackQuestion', $event)"
            />
            <ChatBotMessageNotification
              v-if="message.type === 'notification'"
              :message="message"
              @updateNotification="emit('updateNotification', $event)"
            />
            <ChatBotMessageAnswer
              v-if="message.type === 'answer'"
              :message="message"
            />
          </template>
          <ChatLoader v-if="props.isLoading"/>
        </div>
        <ChatBotSubmitForm layout="canvas" @answer="emit('answer', $event)"/>
      </el-col>
      <el-col :span="19" class="chat-bot-canvas__main" :style="{ flexBasis: mainWidth, maxWidth: mainWidth }">
        <ChatBotTopActions
          @toggleCanvas="emit('toggleCanvas')"
          @push="emit('push')"
          @approve="emit('approve')"
          @rollback="emit('rollback')"
        >
          <template #toggle-canvas-icon>
            <CloseCanvasIcon/>
          </template>
        </ChatBotTopActions>
        <ChatBotEditor :technicalId="technicalId" @answer="emit('answer', $event)"/>
      </el-col>
    </el-row>

    <el-drawer
      ref="elDrawerRef"
      v-model="drawerVisible"
      :modal="false"
      direction="ltr"
      size="320px"
      class="chat-bot-canvas__drawer"
    >
      <SideBar mode="drawer">
        <template #toggle>
          <el-button @click="drawerVisible=false" class="btn-default btn-icon">
            <ToggleSidebar/>
          </el-button>
        </template>
      </SideBar>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import ChatBotEditor from "@/components/ChatBot/ChatBotEditor.vue";
import {nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch} from "vue";
import ChatBotMessageAnswer from "@/components/ChatBot/ChatBotMessageAnswer.vue";
import ChatBotMessageQuestion from "@/components/ChatBot/ChatBotMessageQuestion.vue";

import ToggleSidebar from '@/assets/images/icons/toggle-sidebar.svg';
import CloseCanvasIcon from "@/assets/images/icons/close-canvas.svg";
import ChatLoader from "@/components/ChatBot/ChatLoader.vue";
import ChatBotMessageNotification from "@/components/ChatBot/ChatBotMessageNotification.vue";
import ChatBotSubmitForm from "@/components/ChatBot/ChatBotSubmitForm.vue";
import ChatBotTopActions from "@/components/ChatBot/ChatBotTopActions.vue";
import SideBar from "@/components/SideBar/SideBar.vue";
import HelperStorage from "@/helpers/HelperStorage";


const helperStorage = new HelperStorage();

const INIT_SIDEBAR_WIDTH = '20.8333333333%';
const INIT_MAIN_WIDTH = '79.1666666667%';

const props = defineProps<{
  messages: any[],
  technicalId: string,
  isLoading: boolean,
}>();


const emit = defineEmits([
  'push',
  'approve',
  'rollback',
  'answer',
  'rollbackQuestion',
  'updateNotification',
  'toggleCanvas'
]);

let mutationObserverEl = null;
const drawerVisible = ref(false);
const isResizing = ref(false);

const canvasWidth = helperStorage.get('canvasWidth', {});

const sideBarWidth = ref(canvasWidth.sideBarWidth || INIT_SIDEBAR_WIDTH);
const mainWidth = ref(canvasWidth.mainWidth || INIT_MAIN_WIDTH);

onMounted(() => {
  scrollDownMessages();
  window.addEventListener("mousedown", onDocumentClick);
});

onUnmounted(() => {
  mutationObserverEl.disconnect();
  window.removeEventListener("mousedown", onDocumentClick);
})

function scrollDownMessages() {
  const messagesHtml = document.querySelector('.chat-bot-canvas__sidebar-messages');
  mutationObserverEl = new MutationObserver(() => {
    nextTick(() => {
      messagesHtml.scrollTo(0, messagesHtml.scrollHeight);
    });
  });
  mutationObserverEl.observe(messagesHtml, {
    childList: true,
  });
}

function onDocumentClick(e) {
  const elDrawerEl = document.querySelector('.chat-bot-canvas__drawer');
  if (!elDrawerEl?.contains(e.target) && drawerVisible.value) {
    drawerVisible.value = false;
  }
}

const startResize = (event) => {
  isResizing.value = true;
  const startX = event.clientX;
  const startSideBarWidth = document.querySelector('.chat-bot-canvas__sidebar').clientWidth;
  const parentWidth = document.querySelector('.chat-bot-canvas').clientWidth-20;
  const minWidth = (parseFloat(INIT_SIDEBAR_WIDTH) / 100) * parentWidth;

  const onMouseMove = (e) => {
    let newSideBarWidth = Math.max(100, startSideBarWidth + (e.clientX - startX));

    if (newSideBarWidth > parentWidth / 2) newSideBarWidth = parentWidth / 2;
    if (newSideBarWidth < minWidth) newSideBarWidth = minWidth;

    let newMainWidth = parentWidth - newSideBarWidth;

    sideBarWidth.value = `${newSideBarWidth}px`;
    mainWidth.value = `${newMainWidth}px`;

    helperStorage.set('canvasWidth', {
      sideBarWidth: sideBarWidth.value,
      mainWidth: mainWidth.value,
    });
  };

  const onMouseUp = () => {
    isResizing.value = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
};

watch(() => props.technicalId, () => {
  drawerVisible.value = false
})
</script>

<style lang="scss">
.chat-bot-canvas {
  &.resizing * {
    user-select: none;
  }
  &.resizing .chat-bot-canvas__main{
    opacity: 0.5;
  }

  &__drag {
    position: absolute;
    width: 10px;
    height: 100%;
    background: transparent;
    top: 0;
    right: -4px;
    cursor: ew-resize;
  }

  &__sidebar {
    position: relative;
    padding: 36px 15px;
    background-color: #FFFFF4;
    border-right: 1px solid #ccd0d7;
    height: 100vh;
    display: flex;
    flex-direction: column;

    h2 {
      margin: 0;
      color: #606266;
      margin-left: 24px;
    }
  }

  &__sidebar-title {
    display: flex;
    align-items: center;
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
    transition: opacity 0.5s;
  }

  &__top_actions {
    height: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 15px 0;
  }

  &__drawer {
    box-shadow: none;
    border-right: 1px solid rgba(20, 135, 81, 0.5);

    .el-drawer__header {
      display: none
    }

    .el-drawer__body {
      padding: 0;
    }
  }
}
</style>
