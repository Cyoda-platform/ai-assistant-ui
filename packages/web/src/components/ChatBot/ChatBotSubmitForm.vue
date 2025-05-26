<template>
  <div
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    @dragover.prevent
    class="chat-bot-submit-form"
    :class="{
      'chat-bot-submit-form__drag-started': isDragging,
      'chat-bot-submit-form__layout_canvas': layout === 'canvas'
    }"
  >
    <div class="chat-bot-submit-form__drag-and-drop">
      <span>Drag & Drop</span>
    </div>
    <el-form :model="form" label-width="auto">
      <div class="chat-bot-submit-form__wrapper">
        <div class="chat-bot-submit-form__input-box">
          <div class="chat-bot-submit-form__input" :class="{disabled: isLoading}">
            <FileSubmitPreview class="chat-bot-submit-form__file-submit-preview" v-if="currentFile" :file="currentFile"
                               @delete="currentFile=null"/>
            <div class="chat-bot-submit-form__input-inner">
              <el-input
                v-model="form.answer"
                type="textarea"
                resize="none"
                :autosize="{ minRows: 1, maxRows: 10 }"
                :placeholder="placeholderComputed"
                @keydown="handleKeyDown"
                :disabled="isLoading"
              />
              <div class="chat-bot-submit-form__actions">
                <el-button @click="onClickAttachFile" class="btn-default btn-icon transparent">
                  <AttachIcon/>
                  <input
                    ref="fileInput"
                    type="file"
                    :disabled="isLoading"
                    style="display: none;"
                    @change="handleFileSelect"
                    accept=".pdf,.docx,.xlsx,.pptx,.xml,.json,text/*,image/*"
                  />
                </el-button>
                <button class="btn btn-primary btn-icon"
                        :disabled="isLoading"
                        @click.prevent="onClickTextAnswer">
                  <SendIcon/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import {computed, ref, useTemplateRef} from "vue";
import SendIcon from '@/assets/images/icons/send.svg';
import AttachIcon from '@/assets/images/icons/attach.svg';
import FileSubmitPreview from "@/components/FileSubmitPreview/FileSubmitPreview.vue";
import HelperUpload from "@/helpers/HelperUpload";
import {ElMessageBox} from "element-plus";

const props = withDefaults(defineProps<{
    layout?: 'default' | 'canvas',
    isLoading: boolean,
  }>(),
  {
    layout: 'default',
    isLoading: false,
  }
)

const form = ref({
  answer: ''
});

const currentFile = ref(null);
const fileInput = useTemplateRef('fileInput');
const isDragging = ref(false);

const emit = defineEmits(['answer']);

async function onClickTextAnswer() {
  emit('answer', {
    answer: form.value.answer,
    file: currentFile.value || undefined
  });
  form.value.answer = '';
  currentFile.value = null;
}

function onClickAttachFile() {
  fileInput.value.click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  const {isValid, message} = HelperUpload.validateFile(file);
  if (!isValid) {
    ElMessageBox.alert(message, 'Warning!', {
      type: 'warning',
    });
    return;
  }
  if (file) {
    currentFile.value = file;
  }
  event.target.value = '';
}

let dragCounter = 0;

function handleDragEnter() {
  dragCounter++;
  isDragging.value = true;
}

function handleDragLeave() {
  dragCounter--;
  if (dragCounter === 0) isDragging.value = false;
}

function handleDrop(event) {
  dragCounter = 0;
  isDragging.value = false;

  currentFile.value = event.dataTransfer.files[0];
}

const placeholderComputed = computed(() => {
  if (props.layout === 'canvas') return 'Type here';
  return 'Ask Cyoda AI Assistant...';
});

function handleKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    onClickTextAnswer();
  }
}

</script>

<style lang="scss">
.chat-bot-submit-form {
  position: relative;

  &__drag-and-drop {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    justify-content: center;
    background-color: #fff;
    color: var(--color-primary);
    align-items: center;
    z-index: 1;
    border: 1px dashed var(--color-primary);
    display: none;
    border-radius: 8px;
  }

  &__drag-started &__drag-and-drop {
    display: flex;
  }

  &__wrapper {
    display: flex;
    align-items: end;
  }

  &__input-box {
    flex: 1;
  }

  &__input {
    border: 1px solid var(--border-color-darken);
    border-radius: 8px;
    flex: 1;
    overflow: hidden;
    background-color: var(--input);

    &.disabled {
      background-color: var(--el-disabled-bg-color);
      cursor: not-allowed;
    }
  }

  &__input-inner {
    display: flex;
    margin: 0;
    align-items: end;
    min-height: 54px;
  }

  &__actions {
    margin-right: 16px;
    margin-left: 16px;
    margin-bottom: 18px;
    display: flex;
    gap: 8px;

    .transparent {
      background: none;
      position: relative;
      top: -2px;

      svg {
        fill: var(--text-color-regular) !important;
      }
    }

    button {
      cursor: pointer;
      border: none;
      border-radius: 4px;
    }

    svg {
      position: relative;
      top: 2px;
      fill: var(--color-icon-submit) !important;
    }
  }

  .el-textarea__inner {
    box-shadow: none !important;
    min-height: 40px !important;
    font-size: 16px;
    margin-bottom: 15px;
    margin-top: 15px;
    padding-bottom: 8px;
    padding-top: 8px;
    padding-left: 16px;
  }

  .el-textarea__inner::placeholder {
    color: #A8ABB2;
    font-size: 16px;
    line-height: 24px;
  }

  &__layout_canvas {
    padding-top: 8px;
  }

  &__layout_canvas &__input-box {
    width: 100%;
    order: 2;
  }

  &__layout_canvas &__wrapper {
    flex-direction: column;
  }

  &__layout_canvas &__actions {
    order: 1;
    margin-bottom: 12px;
  }

  &__layout_canvas &__input {
    border-color: var(--border-color-darken);
    background: var(--input);
  }

  &__layout_canvas &__input-inner {
    background-color: var(--input);
    min-height: 70px !important;

    .el-textarea__inner {
      margin-bottom: 15px;
      margin-top: 15px;
    }
  }

  &__layout_canvas &__actions {
    margin-bottom: 15px;
  }

  &__layout_canvas &__file-submit-preview {
    margin-bottom: 8px;
  }

  &__info {
    text-align: center;
    margin-top: 8px;
  }
}
</style>
