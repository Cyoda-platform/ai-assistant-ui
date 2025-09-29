<template>
  <el-dialog
      class="workflow-meta-dialog"
      :close-on-click-modal="false"
      v-model="dialogVisible"
      title="Workflow Meta Data"
      width="600px"
  >
    <div class="editor">
      <Editor v-model="localData" language="json"/>
      <div v-if="hasJsonError" class="workflow-meta-dialog__error-message">
        Error in JSON: {{ jsonError }}
      </div>
    </div>

    <template #footer>
      <div class="workflow-meta-dialog__dialog-footer">
        <el-button @click="onCancel">Cancel</el-button>
        <el-button class="btn btn-primary" type="primary" @click="onSave">
          Save
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {computed, ref, watch} from "vue";
import Editor from "@/components/Editor/Editor.vue";

const localData = ref(null);
const dialogVisible = ref(false);
const jsonError = ref('')

const emit = defineEmits(['update'])

function openDialog(data) {
  const dataStr = JSON.stringify(data, null, 2);
  if (['{}', 'null', '""'].includes(dataStr)) {
    localData.value = '';
  } else {
    localData.value = dataStr;
  }
  dialogVisible.value = true;
}

function onCancel() {
  dialogVisible.value = false;
}

function onSave() {
  emit('update', JSON.parse(localData.value));
  dialogVisible.value = false;
}

const hasJsonError = computed(() => {
  return jsonError.value !== ''
})

watch(localData, (newValue) => {
  if (newValue.trim() === '') {
    jsonError.value = ''
    return
  }

  try {
    JSON.parse(newValue)
    jsonError.value = ''
  } catch (error: any) {
    jsonError.value = error.message
  }
})

defineExpose({openDialog})
</script>

<style lang="scss">
.workflow-meta-dialog {
  &__error-message {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 8px;
  }

  &__dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>