<template>
  <div class="chat-bot-canvas" :class="{
    resizing: isResizing
  }">
    <el-row>
      <el-col :span="5" class="chat-bot-canvas__sidebar" :style="{ flexBasis: sideBarWidth, maxWidth: sideBarWidth }">
        <div class="chat-bot-canvas__drag" @mousedown="startResize"></div>
        <div class="chat-bot-canvas__sidebar-title">
          <el-button @click="drawerVisible=true" class="btn-default btn-icon">
            <ToggleSidebar class="fill-stroke"/>
          </el-button>
          <ChatBotName v-if="chatName" :chatName="chatName" :technicalId="technicalId"/>
        </div>
        <div class="chat-bot-canvas__sidebar-messages">
          <template v-for="message in props.messages">
            <ChatBotMessageQuestion
              v-if="message.type === 'question'"
              :message="message"
              @rollbackQuestion="emit('rollbackQuestion', $event)"
              @approveQuestion="emit('approveQuestion', $event)"
            />
            <ChatBotMessageNotification
              v-if="message.type === 'notification'"
              :message="message"
              @updateNotification="emit('updateNotification', $event)"
            />
            <ChatBotMessageAnswer
              v-if="message.type === 'answer'"
              class="chat-bot-canvas__message-answer"
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
        >
          <template #actions>
            <el-button @click="onToggleMarkdown" class="btn btn-default btn-icon">
              <SplitScreenCloseIcon v-if="isShowMarkdown" class="icon"/>
              <SplitScreenIcon v-else class="icon"/>
            </el-button>
          </template>
          <template #toggle-canvas-icon>
            <CloseCanvasIcon/>
          </template>
        </ChatBotTopActions>
        <ChatBotEditor :technicalId="technicalId" @answer="emit('answer', $event)" :isShowMarkdown="isShowMarkdown"/>
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
            <ToggleSidebar class="fill-stroke"/>
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
import SplitScreenIcon from "@/assets/images/icons/split-screen.svg";
import SplitScreenCloseIcon from "@/assets/images/icons/split-screen-close.svg";
import ChatLoader from "@/components/ChatBot/ChatLoader.vue";
import ChatBotMessageNotification from "@/components/ChatBot/ChatBotMessageNotification.vue";
import ChatBotSubmitForm from "@/components/ChatBot/ChatBotSubmitForm.vue";
import ChatBotTopActions from "@/components/ChatBot/ChatBotTopActions.vue";
import SideBar from "@/components/SideBar/SideBar.vue";
import HelperStorage from "@/helpers/HelperStorage";
import ChatBotName from "@/components/ChatBot/ChatBotName.vue";

const helperStorage = new HelperStorage();

const INIT_SIDEBAR_WIDTH = '54%';
const INIT_MAIN_WIDTH = '46%';

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

const drawerVisible = ref(false);
const isResizing = ref(false);
const isShowMarkdown = ref(false);

const canvasWidth = helperStorage.get('canvasWidth', {});

const sideBarWidth = ref(canvasWidth.sideBarWidth || INIT_SIDEBAR_WIDTH);
const mainWidth = ref(canvasWidth.mainWidth || INIT_MAIN_WIDTH);

onMounted(() => {
  window.addEventListener("mousedown", onDocumentClick);
  window.addEventListener('resize', () => calculateSizes());
});

onUnmounted(() => {
  window.removeEventListener("mousedown", onDocumentClick);
})

function scrollDownMessages() {
  const messagesHtml = document.querySelector('.chat-bot-canvas__sidebar-messages');
  messagesHtml.scrollTo(0, messagesHtml.scrollHeight);
}

function onDocumentClick(e) {
  const elDrawerEl = document.querySelector('.chat-bot-canvas__drawer');
  const elDropdownMenuEl = document.querySelector('.el-dropdown-menu');
  if ((!elDrawerEl?.contains(e.target) && !elDropdownMenuEl.contains(e.target)) && drawerVisible.value) {
    drawerVisible.value = false;
  }
}

function onToggleMarkdown() {
  isShowMarkdown.value = !isShowMarkdown.value;
}

function calculateSizes(newSideBarWidth = null) {
  const parentWidth = document.querySelector('.chat-bot-canvas').clientWidth - 20;
  const minWidth = (parseFloat('32%') / 100) * parentWidth;
  const maxWidth = (parseFloat('54%') / 100) * parentWidth;

  if (newSideBarWidth === null) {
    const savedSizes = helperStorage.get('canvasWidth');
    newSideBarWidth = savedSizes ? parseFloat(savedSizes.sideBarWidth) : minWidth;
  }

  newSideBarWidth = Math.max(minWidth, Math.min(maxWidth, newSideBarWidth));
  const newMainWidth = parentWidth - newSideBarWidth;

  sideBarWidth.value = `${newSideBarWidth}px`;
  mainWidth.value = `${newMainWidth}px`;

  helperStorage.set('canvasWidth', {
    sideBarWidth: sideBarWidth.value,
    mainWidth: mainWidth.value,
  });
}

function startResize(event) {
  isResizing.value = true;
  const startX = event.clientX;
  const startSideBarWidth = document.querySelector('.chat-bot-canvas__sidebar').clientWidth;
  const parentWidth = document.querySelector('.chat-bot-canvas').clientWidth - 20;
  const minWidth = (parseFloat('32%') / 100) * parentWidth;
  const maxWidth = (parseFloat('54%') / 100) * parentWidth;

  const onMouseMove = (e) => {
    const newSideBarWidth = startSideBarWidth + (e.clientX - startX);
    calculateSizes(newSideBarWidth);
  };

  const onMouseUp = () => {
    isResizing.value = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

watch(() => props.technicalId, () => {
  drawerVisible.value = false
})

watch(() => props.isLoading, () => {
  if (props.isLoading) return;
  nextTick(() => {
    scrollDownMessages();
  })
})
</script>

<style lang="scss">
.chat-bot-canvas {
  &.resizing * {
    user-select: none;
  }

  &.resizing .chat-bot-canvas__main {
    opacity: 0.5;
  }

  &__drag {
    position: absolute;
    width: 20px;
    height: 100%;
    background: transparent;
    top: 0;
    right: -10px;
    cursor: ew-resize;
  }

  &__sidebar {
    position: relative;
    padding: 15px 15px;
    border-right: 1px solid var(--accent-border);
    background: var(--bg-sidebar-canvas);
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
    margin: 0 15px;
  }

  .chat-bot-name{
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
    padding: 0 30px;
    padding-right: 10px;
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

  &__drawer {
    box-shadow: none;
    border-right: 1px solid var(--accent-border);

    .el-drawer__header {
      display: none
    }

    .el-drawer__body {
      padding: 0;
    }
  }
}
</style>
