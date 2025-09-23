<template>
  <el-dialog
      v-model="isVisible"
      title="Export Workflows"
      width="800px"
      :before-close="handleClose"
  >
    <div class="export-select-dialog">
      <div class="export-select-dialog__info">
        <p>Select workflows to export:</p>
      </div>

      <el-table
          ref="tableRef"
          :data="workflowList"
          @selection-change="handleSelectionChange"
          class="export-select-dialog__table"
          max-height="400px"
      >
        <el-table-column type="selection" width="55"/>

        <el-table-column
            prop="name"
            label="Workflow Name"
        >
        </el-table-column>

        <el-table-column
            prop="technical_id"
            label="Technical ID"
            min-width="150"
            show-overflow-tooltip
        />

        <el-table-column
            prop="date"
            label="Created at"
            width="160"
        >
          <template #default="{ row }">
            <span>{{ formatDate(row.date) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="export-select-dialog__selection-info" v-if="selectedWorkflows.length > 0">
        Selected: {{ selectedWorkflows.length }} of {{ workflowList.length }} workflows
      </div>
    </div>

    <template #footer>
      <div class="export-select-dialog__footer">
        <el-button @click="selectAll" size="default">
          Select All
        </el-button>
        <el-button @click="clearSelection" size="default">
          Clear Selection
        </el-button>
        <div class="export-select-dialog__actions">
          <el-button @click="handleClose" size="default">
            Cancel
          </el-button>
          <el-button
              type="primary"
              @click="handleExport"
              :disabled="selectedWorkflows.length === 0"
              size="default"
          >
            Export Selected ({{ selectedWorkflows.length }})
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {ref, computed, watch, nextTick} from 'vue';
import {ElMessage} from 'element-plus';
import type {ElTable} from 'element-plus';
import FileSaver from 'file-saver';
import dayjs from 'dayjs';
import useWorkflowStore from '../../stores/workflows';

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const workflowStore = useWorkflowStore();
const tableRef = ref<InstanceType<typeof ElTable>>();
const selectedWorkflows = ref<any[]>([]);

const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const workflowList = computed(() => workflowStore.workflowList || []);

const handleSelectionChange = (selection: any[]) => {
  selectedWorkflows.value = selection;
};

const selectAll = () => {
  nextTick(() => {
    workflowList.value.forEach(row => {
      tableRef.value?.toggleRowSelection(row, true);
    });
  });
};

const clearSelection = () => {
  tableRef.value?.clearSelection();
};

const handleClose = () => {
  clearSelection();
  isVisible.value = false;
};

const handleExport = async () => {
  if (selectedWorkflows.value.length === 0) {
    ElMessage.warning('Please select at least one workflow to export');
    return;
  }

  try {
    const date = dayjs();
    const exportData = selectedWorkflows.value;
    const dataString = JSON.stringify(exportData, null, 2);

    const filename = selectedWorkflows.value.length === 1
        ? `workflow_${selectedWorkflows.value[0].workflow_name || 'untitled'}_${date.format('DD-MM-YYYY')}.json`
        : `workflows_${selectedWorkflows.value.length}_items_${date.format('DD-MM-YYYY')}.json`;

    const file = new File([dataString], filename, {type: 'application/json;charset=utf-8'});
    FileSaver.saveAs(file);
  } catch (error) {
    console.error('Export failed:', error);
    ElMessage.error('Failed to export workflows');
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Never';
  return dayjs(dateString).format('DD/MM/YYYY HH:mm');
};

// Clear selection when dialog opens
watch(isVisible, (newValue) => {
  if (newValue) {
    nextTick(() => {
      clearSelection();
    });
  }
});
</script>

<style scoped lang="scss">
.export-select-dialog {
  &__info {
    margin-bottom: 16px;

    p {
      margin: 0;
      color: var(--text-color-regular);
      font-size: 14px;
    }
  }

  &__table {
    margin-bottom: 16px;
  }

  &__selection-info {
    padding: 8px 12px;
    background-color: var(--bg-new-chat);
    border: 1px solid var(--input-border);
    border-radius: 4px;
    font-size: 13px;
    color: var(--text-color-regular);
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 12px;

    .el-button {
      margin: 0;
    }
  }

  &__actions {
    margin-left: auto;
    display: flex;
    gap: 12px;
  }
}
</style>