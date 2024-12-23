<template>
  <div v-loading="isLoading" class="chat-bot-canvas">
    <Editor v-model="canvasData" ref="editorRef" class="chat-bot-canvas__editor" :actions="editorActions"/>
    <div class="chat-bot-canvas__actions">
      <div @click="onSubmitAnswer" class="btn-action">
        <SendIcon/>
        A
      </div>
      <div @click="onSubmitQuestion" class="btn-action">
        <SendIcon/>
        Q
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Editor from "@/components/Editor/Editor.vue";
import SendIcon from "@/assets/images/icons/send.svg";
import {ref, useTemplateRef} from "vue";
import * as monaco from 'monaco-editor';
import {ElMessageBox, ElNotification} from "element-plus";
import useAssistantStore from "@/stores/assistant.ts";

const canvasData = ref('');
const editorRef = useTemplateRef('editorRef');
const editorActions = ref<any[]>([]);
const isLoading = ref(false);
const assistantStore = useAssistantStore();
const emit = defineEmits(['answer']);

const props = defineProps<{
  technicalId: string
}>()

async function onSubmitQuestion() {
  try {
    isLoading.value = true;
    const {data} = await assistantStore.postTextQuestions(props.technicalId, canvasData.value);
    canvasData.value += `\n/*\n${data.message}\n*/`;
  } finally {
    isLoading.value = false;
  }
}

async function onSubmitAnswer() {
  emit('answer', canvasData.value);
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
        const {data} = await assistantStore.postTextQuestions(props.technicalId, selectedValue);

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

      emit('answer', selectedValue);
    }
  })
}
</script>

<style lang="scss">
.chat-bot-canvas {
  position: relative;
  padding-right: 70px;
  height: 100%;

  &__editor {
    min-height: 100%;
  }

  &__actions {
    width: 56px;
    height: 56px;
    border-radius: 56px;
    position: absolute;
    right: 5px;
    bottom: 5px;
    border: 1px solid #e3e3e3;
    background: #fff;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    z-index: 100;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: end;
    transition: 0.5s all;
    overflow: hidden;

    &:hover {
      height: 112px;

      .btn-action {
        opacity: 1;
        height: 56px;
      }
    }

    .btn-action:last-child {
      opacity: 1;
      height: 56px;
    }
  }

  .btn-action {
    cursor: pointer;
    width: 56px;
    height: 0;
    display: flex;
    opacity: 0;
    justify-content: center;
    align-items: center;
    transition: 0.5s all;

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
