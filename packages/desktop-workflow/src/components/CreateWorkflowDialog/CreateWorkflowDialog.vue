<template>
  <el-dialog
    v-model="dialogVisible"
    title="Add New Workflow"
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
          type="primary" 
          @click="handleSubmit"
          :loading="loading"
        >
          Create
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { v4 as uuidv4 } from 'uuid';
import HelperStorageElectron from '../../helpers/HelperStorageElectron';
import { MENU_WORKFLOW_CHAT_LIST } from '../../helpers/HelperConstantsElectron';
import eventBus from "@/plugins/eventBus";
import {UPDATE_CHAT_LIST} from "@/helpers/HelperConstants";

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'workflow-created', workflow: any): void;
}
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();
const loading = ref(false);
const dialogVisible = ref(false);

const formData = reactive({
  name: '',
  description: ''
});

const rules: FormRules = {
  name: [
    { required: true, message: 'Workflow name is required', trigger: 'blur' },
    { min: 1, max: 100, message: 'Name should be 1-100 characters', trigger: 'blur' }
  ]
};

// Methods
const resetForm = () => {
  formData.name = '';
  formData.description = '';
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
    const newWorkflow = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      technicalId: uuidv4(),
      date: new Date().toString(),
    };

    const allMenus = await HelperStorageElectron.get(MENU_WORKFLOW_CHAT_LIST, []);
    allMenus.unshift(newWorkflow);
    await HelperStorageElectron.set(MENU_WORKFLOW_CHAT_LIST, allMenus);

    // Emit events
    eventBus.$emit(UPDATE_CHAT_LIST);

    ElMessage.success(`Workflow "${newWorkflow.name}" created successfully`);
    handleClose();
    
  } catch (error) {
    console.error('Error creating workflow:', error);
    ElMessage.error('Failed to create workflow');
  } finally {
    loading.value = false;
  }
};

// Auto-focus when dialog opens
watch(dialogVisible, (newValue) => {
  if (newValue) {
    resetForm();
  }
});

defineExpose({dialogVisible})
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