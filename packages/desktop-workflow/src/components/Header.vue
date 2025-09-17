<template>
  <div class="header">
    <div class="header__actions">
      <el-button @click="onExportAll" size="mini" type="primary" class="btn btn-primary">Export All</el-button>
      <el-button @click="showImportDialog = true" size="mini" type="primary" class="btn btn-default">Import All</el-button>
    </div>
  </div>

  <ImportAllDialog v-model="showImportDialog" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import FileSaver from "file-saver";
import dayjs from "dayjs";
import useWorkflowStore from "../stores/workflows";
import ImportAllDialog from "./ImportAllDialog/ImportAllDialog.vue";

const workflowStore = useWorkflowStore();

// Dialog state
const showImportDialog = ref(false);

function onExportAll() {
  const date = dayjs();
  const data = JSON.stringify(workflowStore.workflowList);
  const file = new File([JSON.stringify(data)], `workflows_${date.format('DD-MM-YYYY')}.txt`, {type: "text/plain;charset=utf-8"});
  FileSaver.saveAs(file);
}
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
    gap: 12px;
  }
}
</style>