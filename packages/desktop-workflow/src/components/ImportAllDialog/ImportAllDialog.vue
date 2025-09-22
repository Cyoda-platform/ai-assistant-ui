<template>
  <el-dialog
    v-model="visible"
    title="Import Workflows"
    width="600px"
    :before-close="handleDialogClose"
  >
    <div class="import-dialog-content">
      <!-- Drag & Drop Area -->
      <div 
        class="import-drop-zone" 
        :class="{ 'drag-over': isDragOver }"
        @drop="onDrop"
        @dragover="onDragOver"
        @dragenter="onDragEnter"
        @dragleave="onDragLeave"
        @click="onSelectFile"
      >
        <div class="drop-zone-content">
          <el-icon size="48" color="#409EFF">
            <Document />
          </el-icon>
          <div class="drop-zone-text">
            <div class="primary-text">Drag & Drop workflow file here</div>
            <div class="secondary-text">Or click to select file</div>
            <div class="format-text">Supported formats: .txt, .json</div>
          </div>
        </div>
      </div>

      <!-- Import Progress -->
      <div v-if="importProgress.show" class="import-progress">
        <el-progress 
          :percentage="importProgress.percentage" 
          :status="importProgress.status"
          :stroke-width="8"
        />
        <div class="progress-text">{{ importProgress.text }}</div>
      </div>

      <!-- Import Results -->
      <div v-if="importResults.length > 0" class="import-results">
        <h4>Import Results:</h4>
        <div class="results-list">
          <div 
            v-for="result in importResults" 
            :key="result.id"
            class="result-item"
            :class="result.status"
          >
            <el-icon>
              <Check v-if="result.status === 'success'" />
              <Close v-else />
            </el-icon>
            <span>{{ result.name }}</span>
            <span class="result-message">{{ result.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleDialogClose">
          {{ importProgress.show ? 'Cancel' : 'Close' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { Document, Check, Close } from "@element-plus/icons-vue";
import useWorkflowStore from "../../stores/workflows";

// Props
interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// Computed
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

// Store
const workflowStore = useWorkflowStore();

// State
const isDragOver = ref(false);

// Import progress tracking
const importProgress = reactive({
  show: false,
  percentage: 0,
  status: 'success' as 'success' | 'warning' | 'exception',
  text: ''
});

// Import results
const importResults = ref<Array<{
  id: string;
  name: string;
  status: 'success' | 'error';
  message: string;
}>>([]);

// Dialog handlers
function handleDialogClose() {
  if (importProgress.show) {
    // Cancel import if in progress
    importProgress.show = false;
    importProgress.percentage = 0;
    ElMessage.warning('Import cancelled');
  }
  
  visible.value = false;
  
  // Reset state after dialog closes
  setTimeout(() => {
    importResults.value = [];
    importProgress.show = false;
    importProgress.percentage = 0;
    isDragOver.value = false;
  }, 300);
}

function onSelectFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,.json';
  
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    await processImportFile(file);
  };
  
  input.click();
}

// Drag and Drop handlers
function onDragOver(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function onDragEnter(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = true;
}

function onDragLeave(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = false;
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = false;
  
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) {
    ElMessage.warning('File not found in drag & drop operation');
    return;
  }
  
  const file = files[0];
  
  // Check file type
  if (!file.name.toLowerCase().endsWith('.txt') && !file.name.toLowerCase().endsWith('.json')) {
    ElMessage.warning('Please drag and drop a file with .txt or .json extension');
    return;
  }
  
  // Use the same file processing logic
  processImportFile(file);
}

// Function for processing import file with progress in dialog
async function processImportFile(file: File) {
  try {
    // Show progress
    importProgress.show = true;
    importProgress.percentage = 10;
    importProgress.text = 'Reading file...';
    importResults.value = [];

    const text = await file.text();
    importProgress.percentage = 30;
    importProgress.text = 'Parsing data...';
    
    let importedData;
    
    try {
      // First parse outer JSON (from FileSaver)
      const outerData = JSON.parse(text);
      // Then parse inner JSON (actual workflow data)
      importedData = JSON.parse(outerData);
    } catch (parseError) {
      // If couldn't parse as double JSON, try as regular JSON
      try {
        importedData = JSON.parse(text);
      } catch (secondParseError) {
        console.error('Failed to parse imported file:', secondParseError);
        importProgress.show = false;
        ElMessage.error('Invalid file format. Please select a correct export file.');
        return;
      }
    }
    
    importProgress.percentage = 50;
    importProgress.text = 'Validating workflows...';
    
    // Validate that this is an array of workflows
    if (!Array.isArray(importedData)) {
      console.error('Imported data is not an array');
      importProgress.show = false;
      ElMessage.error('File does not contain valid workflow data.');
      return;
    }
    
    // Validate structure of each workflow
    const validWorkflows = importedData.filter((workflow: any) => {
      return workflow && 
             typeof workflow.technical_id === 'string' &&
             typeof workflow.name === 'string' &&
             typeof workflow.date === 'string';
    });
    
    if (validWorkflows.length === 0) {
      console.error('No valid workflows found in imported data');
      importProgress.show = false;
      ElMessage.error('No valid workflows found in file for import.');
      return;
    }
    
    importProgress.percentage = 60;
    importProgress.text = `Importing ${validWorkflows.length} workflows...`;

   await workflowStore.deleteAll();
    
    // Import workflows with progress
    for (let i = 0; i < validWorkflows.length; i++) {
      const workflow = validWorkflows[i];
      const progressStep = 30 / validWorkflows.length;
      
      try {
        // Create new workflow
        const newWorkflow = await workflowStore.createWorkflow({
          name: workflow.name,
          description: workflow.description || ''
        });
        
        // If workflow data exists, update it with correct technical_id
        if ((workflow.workflowMetaData || workflow.canvasData) && newWorkflow) {
          await workflowStore.updateWorkflow({
            technical_id: newWorkflow.technical_id,
            workflowMetaData: workflow.workflowMetaData,
            canvasData: workflow.canvasData
          });
        }
        
        // Add result
        importResults.value.push({
          id: workflow.technical_id,
          name: workflow.name,
          status: 'success',
          message: 'Successfully imported'
        });
        
      } catch (error) {
        console.error(`Error importing workflow ${workflow.name}:`, error);
        importResults.value.push({
          id: workflow.technical_id,
          name: workflow.name,
          status: 'error',
          message: 'Failed to import'
        });
      }
      
      importProgress.percentage = 60 + (i + 1) * progressStep;
    }
    
    importProgress.percentage = 100;
    importProgress.text = `Import completed! ${importResults.value.filter(r => r.status === 'success').length} of ${validWorkflows.length} workflows imported successfully.`;
    
    setTimeout(() => {
      importProgress.show = false;
    }, 2000);
    
    const successCount = importResults.value.filter(r => r.status === 'success').length;
    ElMessage.success(`Successfully imported ${successCount} workflows!`);
    
  } catch (error) {
    console.error('Error importing workflows:', error);
    importProgress.show = false;
    ElMessage.error('An error occurred while importing workflows.');
  }
}
</script>

<style scoped lang="scss">
// Import Dialog Styles
.import-dialog-content {
  padding: 20px 0;
}

.import-drop-zone {
  border: 3px dashed var(--input-border);
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: rgba(64, 158, 255, 0.05);
  margin-bottom: 20px;
  
  .drop-zone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .drop-zone-text {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .primary-text {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    
    .secondary-text {
      font-size: 14px;
      color: #6b7280;
    }
    
    .format-text {
      font-size: 12px;
      color: #9ca3af;
      font-style: italic;
    }
  }
  
  &:hover {
    border-color: #409EFF;
    background-color: rgba(64, 158, 255, 0.1);
    
    .primary-text {
      color: #409EFF;
    }
    
    .secondary-text {
      color: #409EFF;
    }
  }
  
  &.drag-over {
    border-color: #4b8f2d;
    background-color: rgba(103, 194, 58, 0.1);
    transform: translateY(-4px) scale(1.02);
    
    .primary-text {
      color: #4b8f2d;
      font-weight: 700;
    }
    
    .secondary-text {
      color: #4b8f2d;
    }
  }
}

.import-progress {
  margin: 20px 0;
  
  .progress-text {
    margin-top: 8px;
    font-size: 14px;
    color: #6b7280;
    text-align: center;
  }
}

.import-results {
  margin-top: 20px;
  
  h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #374151;
  }
  
  .results-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--input-border);
    border-radius: 8px;
    padding: 8px;
  }
  
  .result-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 4px;
    font-size: 14px;
    
    &.success {
      background-color: rgba(103, 194, 58, 0.1);
      color: #4b8f2d;
    }
    
    &.error {
      background-color: rgba(245, 108, 108, 0.1);
      color: #f56c6c;
    }
    
    .result-message {
      margin-left: auto;
      font-size: 12px;
      opacity: 0.8;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// Dark theme support
@media (prefers-color-scheme: dark) {
  .import-drop-zone {
    border-color: #4b5563;
    background-color: rgba(64, 158, 255, 0.1);
    
    .primary-text {
      color: #f9fafb;
    }
    
    .secondary-text {
      color: #d1d5db;
    }
    
    .format-text {
      color: #9ca3af;
    }
    
    &:hover {
      border-color: #60a5fa;
      background-color: rgba(96, 165, 250, 0.15);
      
      .primary-text {
        color: #60a5fa;
      }
      
      .secondary-text {
        color: #60a5fa;
      }
    }
    
    &.drag-over {
      border-color: #84cc16;
      background-color: rgba(132, 204, 22, 0.15);
      
      .primary-text {
        color: #84cc16;
      }
      
      .secondary-text {
        color: #84cc16;
      }
    }
  }
  
  .import-results {
    h4 {
      color: #f9fafb;
    }
    
    .results-list {
      border-color: #4b5563;
      background-color: rgba(17, 24, 39, 0.5);
    }
  }
}
</style>