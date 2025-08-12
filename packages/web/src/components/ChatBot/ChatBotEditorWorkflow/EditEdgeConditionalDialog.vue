<template>
  <el-dialog
      class="edit-edge-conditional-dialog"
      :close-on-click-modal="false"
      v-model="dialogVisible"
      width="600px"
      :before-close="handleClosePopup"
  >
    <template #header>
      <div class="edit-edge-conditional-dialog__header">
        <span class="edit-edge-conditional-dialog__title">Edit Transition Data</span>
        <div class="edit-edge-conditional-dialog__mode-toggle">
          <span class="edit-edge-conditional-dialog__mode-label">Mode:</span>
          <el-switch
              v-model="isManualMode"
              @change="onModeChange"
              active-text="Manual"
              inactive-text="Automatic"
              :active-value="true"
              :inactive-value="false"
              class="edit-edge-conditional-dialog__switch"
          />
        </div>
      </div>
    </template>
    <div class="edit-edge-conditional-dialog__form">
      <div class="edit-edge-conditional-dialog__field">
        <label class="edit-edge-conditional-dialog__label">Transition Data (JSON):</label>
        <div class="edit-edge-conditional-dialog__editor">
          <Editor language="json" v-model="conditionText"/>
          <div v-if="jsonError" class="edit-edge-conditional-dialog__error-message">
            JSON Error: {{ jsonError }}
          </div>
          <div v-if="validationError" class="edit-edge-conditional-dialog__error-message edit-edge-conditional-dialog__validation-error">
            Validation Error: {{ validationError }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="edit-edge-conditional-dialog__dialog-footer">
        <el-button @click="cancelEdit">Cancel</el-button>
        <el-button class="btn btn-primary" type="primary" @click="saveCondition" :disabled="hasJsonError">
          Save
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import eventBus from "@/plugins/eventBus";
import Editor from "@/components/Editor/Editor.vue";
import type { EdgeData } from "./utils/edgeUtils";

interface ExtendedEdgeData extends EdgeData {
  isNewTransition?: boolean;
}

interface ValidationErrorData {
  message?: string;
}

interface TransitionDataType {
  name: string;
  next?: string;
  manual?: boolean;
  [key: string]: unknown;
}

const originalConditionText = ref('')
const dialogVisible = ref(false)
const conditionText = ref('')
const jsonError = ref('')
const validationError = ref('')
const isManualMode = ref(false)

const currentEdgeData = ref<ExtendedEdgeData | null>(null)

const hasJsonError = computed(() => {
  return jsonError.value !== '' || validationError.value !== ''
})

onMounted(() => {
  eventBus.$on('show-condition-popup', openDialog)
  eventBus.$on('validation-error', handleValidationError)
  eventBus.$on('transition-saved-successfully', handleTransitionSaved)
})

onUnmounted(() => {
  eventBus.$off('show-condition-popup', openDialog)
  eventBus.$off('validation-error', handleValidationError)
  eventBus.$off('transition-saved-successfully', handleTransitionSaved)
})

function openDialog(data: ExtendedEdgeData) {
  currentEdgeData.value = data

  const defaultTransition: TransitionDataType = {
    name: data.transitionName || "",
    next: "",
    manual: false
  }

  const transitionToEdit: TransitionDataType = (data.transitionData as TransitionDataType) || defaultTransition

  // Ensure manual field exists with boolean value
  if (typeof transitionToEdit.manual === 'undefined') {
    transitionToEdit.manual = false
  }

  // Set manual mode based on existing data
  isManualMode.value = !!transitionToEdit.manual

  conditionText.value = JSON.stringify(transitionToEdit, null, 2)
  originalConditionText.value = conditionText.value
  validationError.value = ''
  dialogVisible.value = true
}

function onModeChange(isManual: boolean) {
  try {
    const currentData = JSON.parse(conditionText.value)
    
    // Always set manual field with boolean value
    currentData.manual = isManual
    
    conditionText.value = JSON.stringify(currentData, null, 2)
  } catch {
    // If JSON is invalid, create new object with the mode
    const transitionName = currentEdgeData.value?.transitionName || "transition"
    const newData = {
      name: transitionName,
      next: "",
      manual: isManual
    }
    conditionText.value = JSON.stringify(newData, null, 2)
  }
}

function cancelEdit() {
  handleClosePopup()
}

function handleValidationError(errorData: ValidationErrorData) {
  if (errorData && errorData.message) {
    validationError.value = errorData.message
  }
}

function handleTransitionSaved() {
  dialogVisible.value = false
}

function saveCondition() {
  if (hasJsonError.value) {
    return
  }

  let parsedTransitionData: TransitionDataType | null = null

  if (conditionText.value.trim() !== '') {
    try {
      parsedTransitionData = JSON.parse(conditionText.value)
    } catch (error: unknown) {
      jsonError.value = (error as Error).message
      return
    }
  }

  if (!parsedTransitionData || typeof parsedTransitionData !== 'object' || !parsedTransitionData.name) {
    jsonError.value = 'Transition data must contain a "name" field'
    return
  }

  const originalTransitionName = currentEdgeData.value?.transitionName
  const newTransitionName = parsedTransitionData.name

  eventBus.$emit('save-transition', {
    stateName: currentEdgeData.value?.stateName,
    transitionName: newTransitionName,
    transitionData: parsedTransitionData,
    oldTransitionName: originalTransitionName !== newTransitionName ? originalTransitionName : undefined,
    isNewTransition: currentEdgeData.value?.isNewTransition || false
  })
}

function handleClosePopup() {
  dialogVisible.value = false
  conditionText.value = originalConditionText.value
  jsonError.value = ''
  validationError.value = ''
}

watch(conditionText, (newValue) => {
  if (newValue.trim() === '') {
    jsonError.value = ''
    validationError.value = ''
    isManualMode.value = false
    return
  }

  try {
    const parsed = JSON.parse(newValue)
    if (!parsed || typeof parsed !== 'object' || !parsed.name) {
      jsonError.value = 'Transition data must contain a "name" field'
    } else {
      jsonError.value = ''
    }
    
    // Update manual mode based on parsed data - handle both boolean and undefined
    isManualMode.value = parsed.manual === true
    
    validationError.value = ''
  } catch (error: unknown) {
    jsonError.value = (error as Error).message
  }
})
</script>

<style scoped lang="scss">
.edit-edge-conditional-dialog {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0;
  }

  &__title {
    font-size: 18px;
    font-weight: 500;
    color: var(--text-color-regular);
  }

  &__mode-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__mode-label {
    font-size: 14px;
    color: var(--text-color-regular);
    font-weight: 500;
  }

  &__switch {
    --el-switch-on-color: var(--color-primary);
    --el-switch-off-color: #dcdfe6;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    font-weight: 500;
    font-size: 14px;
    color: var(--text-color-regular);
  }

  &__editor {
    min-height: 200px;
  }

  &__error-message {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 8px;
  }

  &__validation-error {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 8px;
    background-color: #fef0f0;
    border: 1px solid #fbc4c4;
    border-radius: 4px;
    padding: 8px;
  }

  &__dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
