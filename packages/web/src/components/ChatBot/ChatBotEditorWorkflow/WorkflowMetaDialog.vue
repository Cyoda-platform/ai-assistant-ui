<template>
  <el-dialog
      :close-on-click-modal="false"
      v-model="dialogVisible"
      title="Workflow Meta Data"
      width="600px"
  >
    <div class="condition-editor">
      <el-input
          v-model="localData"
          type="textarea"
          :rows="10"
          placeholder="Enter condition in JSON format"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onCancel">Cancel</el-button>
        <el-button class="btn btn-primary" type="primary" @click="onSave">
          Save
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {ref} from "vue";

const localData = ref(null);
const dialogVisible = ref(false);

const emit = defineEmits(['update'])

function openDialog(data) {
  localData.value = JSON.stringify(data, null, 2);
  dialogVisible.value = true;
}

function onCancel() {
  dialogVisible.value = false;
}

function onSave() {
  emit('update', JSON.parse(localData.value));
  dialogVisible.value = false;
}

defineExpose({openDialog})
</script>