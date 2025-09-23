<template>
  <div class="header">
    <div class="header__actions">
      <el-button @click="showExportDialog = true" size="mini" type="primary" class="btn btn-primary">Export</el-button>
      <el-button @click="showImportDialog = true" size="mini" type="primary">Import</el-button>
    </div>
  </div>

  <ImportAllDialog v-model="showImportDialog" />
  <ExportSelectDialog v-model="showExportDialog" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import useWorkflowStore from "../stores/workflows";
import ImportAllDialog from "./ImportAllDialog/ImportAllDialog.vue";
import ExportSelectDialog from "./ExportSelectDialog/ExportSelectDialog.vue";

const workflowStore = useWorkflowStore();

// Dialog states
const showImportDialog = ref(false);
const showExportDialog = ref(false);
</script>

<style scoped lang="scss">
.header {
  min-height: 40px;
  align-items: center;
  padding: 12px 32px 12px 15px;
  background-color: var(--bg-sidebar);
  box-sizing: content-box;
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 16px;
  display: flex;
  justify-content: right;
  
  &__actions {
    display: flex;
    align-items: center;
  }
}
</style>