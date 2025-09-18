<template>
  <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :before-close="handleClose"
      class="workflow-create-dialog"
  >
    <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
    >
      <el-form-item label="Workflow Name" prop="name" required>
        <el-input
            v-model="formData.name"
            placeholder="Enter workflow name..."
            clearable
            maxlength="100"
            show-word-limit
        />
      </el-form-item>

      <el-form-item label="Description" prop="description">
        <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="Enter workflow description..."
            :rows="4"
            resize="none"
            maxlength="500"
            show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button
            class="btn-primary"
            type="primary"
            @click="handleSubmit"
            :loading="loading"
        >
          {{ formData.technical_id ? 'Update' : 'Create' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {ref, onMounted, onBeforeUnmount, computed} from 'vue';
import {ElMessage, type FormInstance, type FormRules} from 'element-plus';
import HelperStorageElectron from '../../helpers/HelperStorageElectron';
import {MENU_WORKFLOW_CHAT_LIST, RENAME_WORKFLOW_START} from '../../helpers/HelperConstantsElectron';
import eventBus from "@/plugins/eventBus";
import useWorkflowStore from "../../stores/workflows";

interface Emits {
  (e: 'update:modelValue', value: boolean): void;

  (e: 'workflow-created', workflow: any): void;
}

const emit = defineEmits<Emits>();
const workflowStore = useWorkflowStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const dialogVisible = ref(false);

const formDataDefault = {
  technical_id: null,
  name: '',
  description: '',
};

const formData = ref(JSON.parse(JSON.stringify(formDataDefault)));

const rules: FormRules = {
  name: [
    {required: true, message: 'Workflow name is required', trigger: 'blur'},
    {min: 1, max: 100, message: 'Name should be 1-100 characters', trigger: 'blur'}
  ]
};

onMounted(() => {
  eventBus.$on(RENAME_WORKFLOW_START, openDialog)
})

onBeforeUnmount(() => {
  eventBus.$off(RENAME_WORKFLOW_START, openDialog);
})


function openDialog(data) {
  dialogVisible.value = true;
  formData.value = {
    technical_id: data.technical_id,
    name: data.name,
    description: data.description,
  };
}

const resetForm = () => {
  formData.value = JSON.parse(JSON.stringify(formDataDefault));
  formRef.value?.clearValidate();
};

const handleClose = () => {
  resetForm();
  dialogVisible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    loading.value = true;

    const allMenus = await HelperStorageElectron.get(MENU_WORKFLOW_CHAT_LIST, []);

    if (formData.value.technical_id) {
      await workflowStore.updateWorkflow(formData.value);
      ElMessage.success(`Workflow "${formData.value.name}" updated successfully`);
    } else {
      const newWorkflow = await workflowStore.createWorkflow(formData.value);
      workflowStore.setSelectedWorkflow(newWorkflow);
      // Emit events
      ElMessage.success(`Workflow "${formData.value.name}" created successfully`);
    }
    handleClose();

  } catch (error) {
    console.error('Error creating workflow:', error);
    ElMessage.error('Failed to create workflow');
  } finally {
    loading.value = false;
  }
}

const dialogTitle = computed(() => {
  if (formData.value.technical_id) {
    return 'Update Workflow'
  }
  return 'Add New Workflow'
})

defineExpose({dialogVisible, formData})
</script>

<style lang="scss" scoped>
.workflow-create-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 20px 10px;
  }

  :deep(.el-dialog__body) {
    padding: 10px 20px 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 10px 20px 20px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
    margin-bottom: 8px;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-input__count) {
    color: #909399;
    font-size: 12px;
  }
}
</style>