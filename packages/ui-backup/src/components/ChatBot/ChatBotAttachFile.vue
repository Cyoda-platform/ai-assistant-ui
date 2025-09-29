<template>
  <el-dialog
    class="chat-bot-attach-file"
    v-model="dialogVisible"
    :title="computedTitle"
    width="400"
    :close-on-click-modal="false"
  >

    <input
      ref="fileInput"
      type="file"
      style="display: none;"
      @change="handleFileSelect"
      accept=".pdf,.docx,.xlsx,.pptx,.xml,.json,text/*,image/*"
    />

    <div
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @dragover.prevent
      class="chat-bot-attach-file__attachment"
      @click="onClickAttachFile"
      :class="{
      'chat-bot-attach-file__drag-started': isDragging,
      empty: !currentFile
    }">
      <template v-if="currentFile">
        <FileSubmitPreview
          :file="currentFile"
          @delete="currentFile=null"
          width="220px"
          height="220px"
        />
      </template>
      <template v-else>
        <div class="chat-bot-attach-file__attachment-empty">
          <div class="chat-bot-attach-file__attachment-empty-title">
            Drag and drop a file here or click to upload
          </div>
          <div class="chat-bot-attach-file__attachment-empty-icon">
            <ImageIcon/>
          </div>
        </div>
      </template>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <template v-if="mode === 'new'">
          <el-button @click="dialogVisible = false">
            Cancel
          </el-button>

          <el-button @click="onSubmit" :disabled="!currentFile" class="btn-primary" type="primary">
            Attach
          </el-button>
        </template>
        <template v-else>
          <el-button @click="onDeleteFile">
            Delete
          </el-button>

          <el-button @click="onSubmit" class="btn-primary" type="primary">
            Save
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import ImageIcon from '@/assets/images/icons/image.svg';
import {computed, ref, useTemplateRef} from "vue";
import HelperUpload from "@/helpers/HelperUpload";
import {ElMessageBox} from "element-plus";
import FileSubmitPreview from "@/components/FileSubmitPreview/FileSubmitPreview.vue";

const dialogVisible = ref(false);
const fileInput = useTemplateRef('fileInput');
const currentFile = ref(null);
const emit = defineEmits(['file']);
const mode = ref<'new' | 'delete' | null>(null);
const isDragging = ref(false);

function openDialog(file: File): void {
  dialogVisible.value = true;
  currentFile.value = file;
  mode.value = file ? 'delete' : 'new';
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

function onClickAttachFile() {
  if (currentFile.value) return;
  fileInput.value.click();
}

function onDeleteFile() {
  currentFile.value = null;
}

function reset() {
  currentFile.value = null;
}

function onSubmit() {
  dialogVisible.value = false;
  emit('file', currentFile.value);
  reset();
}

const computedTitle = computed(() => {
  return mode.value === 'new' ? 'Attach file or image' : 'Check uploaded file';
});

const fileData = computed(() => {
  if (currentFile.value) {
    const fileName = currentFile.value.name;
    return {
      fileName,
    }
  }

  return {};
})

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

defineExpose({openDialog});
</script>

<style lang="scss">
.chat-bot-attach-file {
  padding-left: 24px !important;
  padding-right: 24px !important;

  &__content {
    margin-bottom: 10px;
  }

  &__attachment {
    display: flex;
    overflow: hidden;
    width: 352px;
    height: 264px;
    background: var(--bg-attachment);
    border: 1px solid var(--border-attachment-file);
    border-radius: 6px;
    margin: 0 auto;

    align-items: center;
    flex-direction: column;
    justify-content: center;

    &.empty {
      cursor: pointer;
    }
  }

  &__attachment-empty {
    text-align: center;
  }

  &__attachment-empty-title {
    margin-bottom: 24px;
    font-size: 16px;
    color: var(--text-color-secondary);
    font-weight: 400;
  }

  &__drag-started {
    background-color: rgb(235.9,245.3,255);
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    gap: 24px;

    button {
      flex: 1;
      margin: 0;
    }
  }
}
</style>
