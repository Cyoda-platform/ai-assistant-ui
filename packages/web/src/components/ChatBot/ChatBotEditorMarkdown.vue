<template>
  <div
      v-loading="isLoading"
      class="chat-bot-editor-markdown"
  >
    <el-splitter>
      <el-splitter-panel v-model:size="editorSize" class="chat-bot-editor-markdown__editor-wrapper">
        <Editor v-model="canvasData" class="chat-bot-editor-markdown__editor-inner" :actions="editorActions"/>
        <div class="chat-bot-editor-markdown__actions">
          <div class="btn-action btn-block">
            <el-tooltip
                class="box-item"
                effect="dark"
                content="Send Answer"
                placement="left"
                :show-after="1000"
            >
              <el-button @click="onSubmitQuestion" class="btn-white btn-icon">
                <SendIcon/>
              </el-button>
            </el-tooltip>
          </div>
          <div class="btn-action btn-block">
            <el-tooltip
                class="box-item"
                effect="dark"
                content="Attach File"
                placement="left"
                :show-after="1000"
            >
              <el-badge :show-zero="false" :value="countFiles" class="item" color="green">
                <el-button @click="onAttachFile" class="btn-white btn-icon">
                  <AttachIcon/>
                </el-button>
              </el-badge>
            </el-tooltip>
          </div>
        </div>
      </el-splitter-panel>
      <el-splitter-panel v-if="isShowMarkdown" class="chat-bot-editor-markdown__markdown-wrapper">
        <div class="chat-bot-editor-markdown__markdown-inner" v-html="canvasDataWithMarkdown"></div>
      </el-splitter-panel>
    </el-splitter>
    <ChatBotAttachFile
        ref="chatBotAttachFileRef"
        @file="onFile"
    />
    <ChatBotCanvasMarkdownDrawer
        ref="chatBotCanvasMarkdownDrawerRef"
        :canvasDataWithMarkdown="canvasDataWithMarkdown"
    />
  </div>
</template>

<script setup lang="ts">
import Editor from "@/components/Editor/Editor.vue";
import SendIcon from "@/assets/images/icons/send.svg";
import AttachIcon from "@/assets/images/icons/attach.svg";
import {computed, onMounted, ref, useTemplateRef, onUnmounted, watch} from "vue";
import * as monaco from 'monaco-editor';
import {ElMessageBox, ElNotification} from "element-plus";
import useAssistantStore from "@/stores/assistant.ts";
import ChatBotAttachFile from "@/components/ChatBot/ChatBotAttachFile.vue";
import HelperMarkdown from "@/helpers/HelperMarkdown";
import HelperStorage from "@/helpers/HelperStorage";
import helperBreakpoints from "@/helpers/HelperBreakpoints";
import ChatBotCanvasMarkdownDrawer from "@/components/ChatBot/ChatBotCanvasMarkdownDrawer.vue";
import {SHOW_MARKDOWN_DRAWER} from "@/helpers/HelperConstants";
import eventBus from "@/plugins/eventBus";
import {templateRef} from "@vueuse/core";

const canvasData = ref('');
const editorActions = ref<any[]>([]);
const isLoading = ref(false);
const assistantStore = useAssistantStore();
const emit = defineEmits(['answer']);
const chatBotAttachFileRef = useTemplateRef('chatBotAttachFileRef');
const currentFile = ref(null);
const helperStorage = new HelperStorage();
const chatBotCanvasMarkdownDrawerRef = templateRef('chatBotCanvasMarkdownDrawerRef');
const EDITOR_WIDTH = 'chatBotEditorMarkdown:width';

const editorSize = ref(helperStorage.get(EDITOR_WIDTH, '50%'));

const props = defineProps<{
  technicalId: string,
}>();

const isShowMarkdown = computed(() => {
  return !helperBreakpoints.smaller('md').value;
})

onMounted(() => {
  eventBus.$on(SHOW_MARKDOWN_DRAWER, showChatBotCanvasMarkdownDrawer);
})

onUnmounted(() => {
  eventBus.$off(SHOW_MARKDOWN_DRAWER, showChatBotCanvasMarkdownDrawer);
})

function showChatBotCanvasMarkdownDrawer() {
  chatBotCanvasMarkdownDrawerRef.value.drawerVisible = true;
}

function onAttachFile() {
  chatBotAttachFileRef.value.openDialog(currentFile.value);
}

const countFiles = computed(() => {
  return currentFile.value ? 1 : 0;
})

async function onSubmitQuestion() {
  try {
    isLoading.value = true;

    const dataRequest = {
      question: canvasData.value
    };

    if (currentFile.value) {
      dataRequest.file = currentFile.value;
    }

    const {data} = await questionRequest(dataRequest)
    currentFile.value = null;
    canvasData.value += `\n/*\n${data.message}\n*/`;
  } finally {
    isLoading.value = false;
  }
}

async function questionRequest(data) {
  if (data.file) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('question', data.question);

    return assistantStore.postQuestions(props.technicalId, formData);
  } else {
    return assistantStore.postTextQuestions(props.technicalId, data);
  }
}

// Not used
async function onSubmitAnswer() {

  const dataRequest = {
    answer: canvasData.value
  };

  if (currentFile.value) {
    dataRequest.file = currentFile.value;
  }

  emit('answer', dataRequest);
  currentFile.value = null;
}

addSubmitQuestionAction();
addSubmitAnswerAction();

const canvasDataWithMarkdown = computed(() => {
  return HelperMarkdown.parseMarkdown(canvasData.value);
})

function addSubmitQuestionAction() {
  editorActions.value.push({
    id: "submitQuestion",
    label: "Submit Question",
    contextMenuGroupId: "chatbot",
    keybindings: [
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyQ,
    ],
    run: async (editor) => {
      const selectedValue = editor.getModel().getValueInRange(editor.getSelection());

      if (!selectedValue) {
        ElMessageBox.alert('Please select text before use it', 'Warning');
        return;
      }

      try {
        isLoading.value = true;

        const dataRequest = {
          question: selectedValue
        };

        if (currentFile.value) {
          dataRequest.file = currentFile.value;
        }

        const {data} = await questionRequest(dataRequest);
        currentFile.value = null;

        const position = editor.getPosition();
        const lineCount = editor.getModel().getLineCount();
        const message = data.message.replaceAll('```javascript', '').replaceAll('```', '').trim();
        let textToInsert = `/*\n${message}\n*/`;
        if (position.lineNumber === lineCount) {
          textToInsert = '\n' + textToInsert;
        } else {
          textToInsert = textToInsert + '\n';
        }
        const range = new monaco.Range(
            position.lineNumber + 1,
            1,
            position.lineNumber + 1,
            1
        );
        editor.executeEdits('DialogContentScriptEditor', [
          {
            range,
            text: textToInsert,
          },
        ]);
        editor.setPosition({
          lineNumber: position.lineNumber + 1,
          column: textToInsert.length + 1
        });

        ElNotification({
          title: 'Success',
          message: 'The code was generated',
          type: 'success',
        })
      } finally {
        isLoading.value = false;
      }

    }
  })
}

function addSubmitAnswerAction() {
  editorActions.value.push({
    id: "submitAnswer",
    label: "Submit Answer",
    contextMenuGroupId: "chatbot",
    keybindings: [
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyA,
    ],
    run: async (editor) => {
      const selectedValue = editor.getModel().getValueInRange(editor.getSelection());

      if (!selectedValue) {
        ElMessageBox.alert('Please select text before use it', 'Warning');
        return;
      }

      const dataRequest = {
        answer: selectedValue
      };

      if (currentFile.value) {
        dataRequest.file = currentFile.value;
      }

      emit('answer', dataRequest);

      currentFile.value = null;
    }
  })
}

function onFile(file: File) {
  currentFile.value = file;
}

watch(editorSize, (value) => {
  helperStorage.set(EDITOR_WIDTH, value);
})
</script>

<style lang="scss">
.chat-bot-editor-markdown {
  position: relative;
  height: calc(100vh - 81px);

  &__editor-wrapper {
    padding-right: 15px;
    position: relative;
  }

  &__markdown-wrapper{
    padding-left: 15px;
  }

  &__editor-inner {
    min-height: 100%;
  }

  &__actions {
    position: absolute;
    right: 15px;
    bottom: 20px;
    z-index: 100;
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 12px;
    background: var(--bg-new-chat);
    border: 1px solid var(--input-border);
    padding: 9px 12px;
    border-radius: 4px;

    button {
      margin: 0 !important;
    }
  }

  &__markdown-inner p:first-child {
    margin-top: 8px;
  }

  &__markdown-inner {
    height: 100%;
    overflow-y: auto;
  }
}
</style>
