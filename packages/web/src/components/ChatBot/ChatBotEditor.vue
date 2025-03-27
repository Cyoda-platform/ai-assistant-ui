<template>
  <div
    v-loading="isLoading"
    class="chat-bot-editor"
    :class="{
    resizing: isResizing
  }"
  >
    <div class="chat-bot-editor__wrap-editor" :class="{'chat-bot-editor__markdown--show': isShowMarkdown}">
      <div class="chat-bot-editor__editor" :style="editorStyle">
        <Editor v-model="canvasData" class="chat-bot-editor__editor-inner" :actions="editorActions"/>
        <div class="chat-bot-editor__actions">
          <div class="btn-action btn-block">
            <el-tooltip
              class="box-item"
              effect="dark"
              content="Attach File"
              placement="left"
              show-after="1000"
            >
              <el-badge :show-zero="false" :value="countFiles" class="item" color="green">
                <el-button @click="onAttachFile" class="btn-default btn-icon btn-border">
                  <AttachIcon/>
                </el-button>
              </el-badge>
            </el-tooltip>
          </div>

          <div class="btn-action btn-block">
            <el-tooltip
              class="box-item"
              effect="dark"
              content="Ask CYODA AI"
              placement="left"
              show-after="1000"
            >
              <el-button @click="onSubmitQuestion" class="btn-default btn-icon btn-border">
                <QuestionIcon/>
              </el-button>
            </el-tooltip>
          </div>

          <div class="btn-action btn-block">
            <el-tooltip
              class="box-item"
              effect="dark"
              content="Send Answer"
              placement="left"
              show-after="1000"
            >
              <el-button @click="onSubmitAnswer" class="btn-default btn-icon btn-border">
                <SendIcon/>
              </el-button>
            </el-tooltip>
          </div>

          <div class="btn-action">
            <el-badge :show-zero="false" :value="countFiles" class="item" color="green">
              <el-button class="btn-default btn-icon btn-border">
                <ThreeDotsIcon/>
              </el-button>
            </el-badge>
          </div>
        </div>
      </div>
      <template v-if="isShowMarkdown">
        <div class="chat-bot-editor__markdown">
          <div class="chat-bot-editor__drag" @mousedown="startResize"></div>
          <div class="chat-bot-editor__markdown-inner" v-html="canvasDataWithMarkdown"></div>
        </div>
      </template>
    </div>
    <ChatBotAttachFile
      ref="chatBotAttachFileRef"
      @file="onFile"
    />
  </div>
</template>

<script setup lang="ts">
import Editor from "@/components/Editor/Editor.vue";
import SendIcon from "@/assets/images/icons/send.svg";
import AttachIcon from "@/assets/images/icons/attach.svg";
import QuestionIcon from "@/assets/images/icons/question.svg";
import ThreeDotsIcon from "@/assets/images/icons/three-dots.svg";
import {computed, ref, useTemplateRef} from "vue";
import * as monaco from 'monaco-editor';
import {ElMessageBox, ElNotification} from "element-plus";
import useAssistantStore from "@/stores/assistant.ts";
import ChatBotAttachFile from "@/components/ChatBot/ChatBotAttachFile.vue";
import HelperMarkdown from "@/helpers/HelperMarkdown";
import HelperStorage from "@/helpers/HelperStorage";

const canvasData = ref('');
const editorActions = ref<any[]>([]);
const isLoading = ref(false);
const assistantStore = useAssistantStore();
const emit = defineEmits(['answer']);
const chatBotAttachFileRef = useTemplateRef('chatBotAttachFileRef');
const currentFile = ref(null);
const isResizing = ref(false);
const helperStorage = new HelperStorage();
const chatBotEditorWidth = helperStorage.get('сhatBotEditorWidth', {});
const editorWidth = ref(chatBotEditorWidth.editorWidth || '50%');

const props = withDefaults(defineProps<{
  technicalId: string,
  isShowMarkdown: boolean
}>(), {
  isShowMarkdown: false,
});

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
  if (!props.isShowMarkdown) return null;

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

function startResize(event) {
  isResizing.value = true;
  const startX = event.clientX;
  const startEditorWidth = document.querySelector('.chat-bot-editor__editor').clientWidth;
  const parentWidth = document.querySelector('.chat-bot-canvas').clientWidth -20;
  const minWidth = (parseFloat('20%') / 100) * parentWidth;
  const maxWidth = (parseFloat('60%') / 100) * parentWidth;

  const onMouseMove = (e) => {
    let newEditorWidth = Math.max(100, startEditorWidth + (e.clientX - startX));

    if (newEditorWidth > maxWidth) newEditorWidth = maxWidth;
    if (newEditorWidth < minWidth) newEditorWidth = minWidth;

    editorWidth.value = `${newEditorWidth}px`;

    helperStorage.set('сhatBotEditorWidth', {
      editorWidth: editorWidth.value,
    });
  };

  const onMouseUp = () => {
    isResizing.value = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

const editorStyle = computed(() => {
  if (!props.isShowMarkdown) return null;

  return {
    width: editorWidth.value
  }
});
</script>

<style lang="scss">
.chat-bot-editor {
  position: relative;
  height: calc(100vh - 70px);

  &.resizing * {
    user-select: none;
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
    flex-direction: column;
    justify-content: end;
    align-items: center;
    height: 50px;
    overflow: hidden;
    transition: height 0.5s;
    width: 60px;

    .btn-block {
      opacity: 0;
      transition: opacity 0.5s;
    }

    &:hover {
      height: 250px;
      transition-delay: 0s;
      transition-duration: 0s;
    }

    &:not(:hover) {
      transition-delay: 0.5s;
    }

    &:hover .btn-block {
      opacity: 1;
    }

    svg {
      fill: #0d8484 !important;
    }

    button {
      margin: 0 !important;
    }

    .btn-action + .btn-action {
      margin-top: 24px !important;
    }
  }

  &__wrap-editor {
    display: flex;
    width: 100%;
    min-height: 100%;
  }

  &__editor {
    width: 100%;
    min-height: 100%;
    position: relative;
  }

  &__markdown--show &__editor {
    width: 50%;
    padding-right: 15px;
  }

  &__markdown {
    flex: 1;
    border-left: 1px solid var(--border-color-darken);
    position: relative;
    color: var(--text-color-regular);
    height: calc(100vh - 70px);
    padding: 0 0 10px 15px;
  }

  &__markdown-inner p:first-child{
    margin-top: 8px;
  }

  &__markdown-inner {
    height: 100%;
    overflow-y: auto;
  }

  &__drag {
    position: absolute;
    width: 10px;
    height: 100%;
    background: transparent;
    top: 0;
    left: -4px;
    cursor: ew-resize;
  }
}
</style>
