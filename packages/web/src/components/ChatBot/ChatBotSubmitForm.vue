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
      <div class="chat-bot-submit-form__wrap-input">
        <div class="chat-bot-submit-form__input">
          <FileSubmitPreview class="chat-bot-submit-form__file-submit-preview" v-if="currentFile" :file="currentFile"
                             @delete="currentFile=null"/>
          <div class="chat-bot-submit-form__input-inner">
            <el-input
              v-model="form.answer"
              type="textarea"
              resize="none"
              :autosize="{ minRows: 1 }"
              :placeholder="placeholderComputed"
              @keydown.enter="onClickTextAnswer"
            />
            <div class="chat-bot-submit-form__btn-submit">
              <button class="btn btn-primary btn-icon"
                      @click.prevent="onClickTextAnswer">
                <SendIcon/>
              </button>
            </div>
          </div>
        </div>
        <div class="chat-bot-submit-form__actions">
          <el-button @click="onClickAttachFile" class="btn-default btn-icon">
            <AttachIcon/>
            <input
              ref="fileInput"
              type="file"
              style="display: none;"
              @change="handleFileSelect"
              accept=".pdf,.docx,.xlsx,.pptx,.xml,.json,text/*,image/*"
            />
          </el-button>
          <el-button disabled class="btn-default btn-icon">
            <PencilIcon/>
          </el-button>
          <el-button disabled class="btn-default btn-icon">
            <LinkIcon/>
          </el-button>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import {computed, ref, useTemplateRef} from "vue";
import SendIcon from '@/assets/images/icons/send.svg';
import LinkIcon from '@/assets/images/icons/link.svg';
import AttachIcon from '@/assets/images/icons/attach.svg';
import PencilIcon from '@/assets/images/icons/pencil.svg';
import FileSubmitPreview from "@/components/FileSubmitPreview/FileSubmitPreview.vue";
import HelperUpload from "@/helpers/HelperUpload";
import {ElMessageBox} from "element-plus";

const props = withDefaults(defineProps<{ layout: 'default' | 'canvas' }>(), {
  layout: 'default'
})

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
  return 'Use icons on  the right side or simply type';
});

</script>

<style lang="scss">
@use "@/assets/css/particular/variables";

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
    color: variables.$color-primary;
    align-items: center;
    z-index: 1;
    border: 1px dashed variables.$color-primary;
    display: none;
    border-radius: 8px;
  }

  &__drag-started &__drag-and-drop {
    display: flex;
  }

  &__wrap-input {
    display: flex;
    align-items: end;
  }

  &__input {
    border: 1px solid #CDD0D6;
    border-radius: 8px;
    flex: 1;
    overflow: hidden;
  }

  &__input-inner {
    display: flex;
    margin: 0;
    align-items: end;
    min-height: 54px;
  }

  &__btn-submit {
    margin-right: 16px;
    margin-bottom: 6px;

    button {
      cursor: pointer;
      border: none;
      border-radius: 4px;
    }

    svg {
      position: relative;
      top: 2px;
      fill: #fff;
    }
  }

  &__actions {
    margin-left: 15px;
    display: flex;
    gap: 10px;
    margin-bottom: 6px;
  }

  .el-textarea__inner {
    box-shadow: none;
    min-height: 40px !important;
  }

  .el-textarea__inner::placeholder {
    color: #A8ABB2;
    position: absolute;
    top: 5px;
  }

  &__layout_canvas {
    padding-top: 8px;
    border-top: 1px solid #EBEBEB;
  }

  &__layout_canvas &__wrap-input {
    flex-direction: column;
  }

  &__layout_canvas &__actions {
    order: 1;
  }

  &__layout_canvas &__input {
    border-color: #EBEBEB;
    order: 2;
    width: 100%;
  }

  &__layout_canvas &__input-inner {
    background-color: #fff;
    min-height: 70px !important;

    .el-textarea__inner {
      min-height: 70px !important;
    }
  }

  &__layout_canvas &__btn-submit {
    margin-bottom: 16px;
  }

  &__layout_canvas &__file-submit-preview {
    margin-bottom: 8px;
  }
}
</style>
