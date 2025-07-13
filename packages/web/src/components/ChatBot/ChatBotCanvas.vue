<template>
  <div class="chat-bot-canvas" :class="{'hidden':isSidebarHidden}">
    <div class="chat-bot-canvas__sidebar hidden-below-md" :class="{'hidden':isSidebarHidden}">
      <SideBar ref="sidebarRef"/>
    </div>
    <div ref="mainRef" class="chat-bot-canvas__main">
      <ChatBotTopActions @toggleCanvas="emit('toggleCanvas')">
        <template #left-side>
          <el-radio-group v-model="canvasType" size="large">
            <el-radio-button label="Markdown" value="markdown"/>
            <el-radio-button label="Workflow" value="workflow"/>
          </el-radio-group>
        </template>
        <template #modal-preview>
          <el-button v-if="canvasType==='markdown'" @click="onClickMarkdownSideBar"
                     class="btn btn-default btn-icon hidden-above-md">
            <MarkdownIcon/>
          </el-button>
          <el-button v-if="canvasType==='workflow'" @click="onClickVueFlowSideBar"
                     class="btn btn-default btn-icon hidden-above-md">
            <GraphIcon/>
          </el-button>
        </template>
      </ChatBotTopActions>
      <ChatBotEditorMarkdown
          v-if="canvasType==='markdown'"
          @answer="emit('answer', $event)"
          :technicalId="technicalId"
      />
      <ChatBotEditorWorkflow v-if="canvasType === 'workflow'" :technicalId="technicalId"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ChatBotEditorMarkdown from "@/components/ChatBot/ChatBotEditorMarkdown.vue";
import {computed, nextTick, onMounted, ref, useTemplateRef, watch} from "vue";

import ChatBotTopActions from "@/components/ChatBot/ChatBotTopActions.vue";
import SideBar from "@/components/SideBar/SideBar.vue";
import useAppStore from "@/stores/app";
import ChatBotEditorWorkflow from "@/components/ChatBot/ChatBotEditorWorkflow.vue";
import eventBus from "@/plugins/eventBus";
import {SHOW_MARKDOWN_DRAWER, SHOW_VUE_FLOW_DRAWER} from "@/helpers/HelperConstants";
import MarkdownIcon from "@/assets/images/icons/markdown.svg";
import GraphIcon from "@/assets/images/icons/graph.svg";

const appStore = useAppStore();
const isSidebarHidden = computed(() => appStore.isSidebarHidden);
const canvasType = ref('markdown');

const sidebarRef = useTemplateRef('sidebarRef');
const mainRef = useTemplateRef('mainRef');
let resizeObserver: ResizeObserver | null = null;

const props = defineProps<{
  messages: any[],
  isLoading: boolean,
  technicalId: string,
}>();


const emit = defineEmits([
  'answer',
  'approveQuestion',
  'updateNotification',
  'toggleCanvas'
]);

function onClickMarkdownSideBar() {
  eventBus.$emit(SHOW_MARKDOWN_DRAWER);
}

function onClickVueFlowSideBar() {
  eventBus.$emit(SHOW_VUE_FLOW_DRAWER);
}

function scrollDownMessages() {
  const messagesHtml = document.querySelector('.chat-bot-canvas__sidebar-messages');
  if (!messagesHtml) return;
  messagesHtml.scrollTo(0, messagesHtml.scrollHeight);
}

onMounted(async () => {
  await nextTick();
  if (!sidebarRef.value.rootRef || !mainRef.value) return;

  resizeObserver = new ResizeObserver(() => {
    const height = sidebarRef.value.rootRef!.offsetHeight;
    mainRef.value!.style.maxHeight = `${height}px`;
  });

  resizeObserver.observe(sidebarRef.value.rootRef);
})

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
  justify-content: stretch;

  &__sidebar {
    border-right: 1px solid var(--sidebar-border);
    background-color: var(--bg-sidebar);
    min-height: 100vh;
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
    min-height: 100vh;
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
