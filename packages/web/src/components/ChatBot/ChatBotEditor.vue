<template>
  <div v-loading="isLoading" class="chat-bot-editor">
    <Editor v-model="canvasData" class="chat-bot-editor__editor" :actions="editorActions"/>
    <div class="chat-bot-editor__actions">
      <div class="btn-action">
        <el-tooltip
          class="box-item"
          effect="dark"
          content="Attach File"
          placement="left"
        >
          <el-badge :show-zero="false" :value="countFiles" class="item" color="green">
            <el-button @click="onAttachFile" class="btn-default btn-icon btn-border">
              <AttachIcon/>
            </el-button>
          </el-badge>
        </el-tooltip>
      </div>

      <div class="btn-action">
        <el-tooltip
          class="box-item"
          effect="dark"
          content="Ask CYODA AI"
          placement="left"
        >
          <el-button @click="onSubmitQuestion" class="btn-default btn-icon btn-border">
            <ChatIcon/>
          </el-button>
        </el-tooltip>
      </div>

      <div class="btn-action">
        <el-tooltip
          class="box-item"
          effect="dark"
          content="Send Answer"
          placement="left"
        >
          <el-button @click="onSubmitAnswer" class="btn-default btn-icon btn-border">
            <SendIcon/>
          </el-button>
        </el-tooltip>
      </div>
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
import ChatIcon from "@/assets/images/icons/chat.svg";
import {computed, ref, useTemplateRef} from "vue";
import * as monaco from 'monaco-editor';
import {ElMessageBox, ElNotification} from "element-plus";
import useAssistantStore from "@/stores/assistant.ts";
import ChatBotAttachFile from "@/components/ChatBot/ChatBotAttachFile.vue";

const canvasData = ref('');
const editorActions = ref<any[]>([]);
const isLoading = ref(false);
const assistantStore = useAssistantStore();
const emit = defineEmits(['answer']);
const chatBotAttachFileRef = useTemplateRef('chatBotAttachFileRef');
const currentFile = ref(null);

const props = defineProps<{
  technicalId: string
}>()

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
</script>

<style lang="scss">
.chat-bot-editor {
  position: relative;
  padding-right: 70px;
  height: calc(100vh - 70px);

  &__editor {
    min-height: 100%;
  }

  &__actions {
    position: absolute;
    right: 5px;
    bottom: 20px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    svg {
      fill: #0d8484;
    }

    button {
      margin: 0 !important;
    }

    .btn-action {
      margin-top: 24px !important;
    }
  }
}
</style>
