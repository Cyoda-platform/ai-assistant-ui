<template>
  <el-dialog
    class="chat-bot-attach-file"
    v-model="dialogVisible"
    :title="computedTitle"
    width="500"
  >
    <div class="chat-bot-attach-file__content">
      {{ message }}
    </div>

    <input
      ref="fileInput"
      type="file"
      style="display: none;"
      @change="handleFileSelect"
      accept=".pdf,.docx,.xlsx,.pptx,.xml,.json,text/*,image/*"
    />

    <div class="chat-bot-attach-file__attachment">
      <div @click="onClickAttachFile" class="chat-bot-attach-file__attachment-input">
        {{ fileData.fileName }}
      </div>
      <div class="chat-bot-attach-file__attachment-submit">
        <template v-if="currentFile">
          <el-button @click="onDeleteFile" class="btn-default btn-icon">
            <TrashIcon class="chat-bot-attach-file__trash-icon"/>
          </el-button>
        </template>
        <template v-else>
          <el-button @click="onClickAttachFile" class="btn-default btn-icon">
            <AttachIcon/>
          </el-button>
        </template>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button class="btn-primary" type="primary" @click="onSubmit">
          Submit
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import AttachIcon from '@/assets/images/icons/attach.svg';
import TrashIcon from '@/assets/images/icons/trash.svg';
import {computed, ref, useTemplateRef} from "vue";
import HelperUpload from "@/helpers/HelperUpload";
import {ElMessageBox} from "element-plus";

const dialogVisible = ref(false);
const message = ref("");
const type = ref<'answer' | 'question' | null>(null);
const fileInput = useTemplateRef('fileInput');
const currentFile = ref(null);
const emit = defineEmits(['question', 'answer']);

function openDialog(msg: string, mode: string): void {
  message.value = msg;
  type.value = mode;
  dialogVisible.value = true;
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
  fileInput.value.click();
}

function onDeleteFile() {
  currentFile.value = null;
}

function reset() {
  currentFile.value = null;
  message.value = '';
}

function onSubmit() {
  dialogVisible.value = false;
  const data = {
    file: currentFile.value
  };
  data[type.value] = message.value;
  emit(type.value, data);
  reset();
}

const computedTitle = computed(() => {
  const titles = {
    answer: 'Attach File for Answer',
    question: 'Attach File for Question',
  };
  return titles[type.value] || 'Attach File';
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

defineExpose({openDialog});
</script>

<style scoped lang="scss">
.chat-bot-attach-file {
  &__content {
    margin-bottom: 10px;
  }

  &__attachment {
    display: flex;
    border: 1px solid #CDD0D6;
    border-radius: 8px;
    height: 40px;
    overflow: hidden;
  }

  &__attachment-input {
    flex: 1;
    cursor: not-allowed;
    line-height: 40px;
    padding-left: 15px;
  }

  &__attachment-submit {
    margin-left: auto;

    button {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }

  &__trash-icon {
    width: 18px;
  }
}
</style>
