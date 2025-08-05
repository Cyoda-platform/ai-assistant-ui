<template>
  <el-dialog
      class="edit-edge-conditional-dialog"
      :close-on-click-modal="false"
      v-model="dialogVisible"
      title="Edit Transition Data"
      width="600px"
      :before-close="handleClosePopup"
  >
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

interface TransitionDataType {
  name: string;
  next?: string;
}

const originalConditionText = ref('')
const dialogVisible = ref(false)
const conditionText = ref('')
const jsonError = ref('')
const validationError = ref('')

const currentEdgeData = ref<any>(null)

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

function openDialog(data: any) {
  currentEdgeData.value = data

  const defaultTransition = {
    name: data.transitionName || "",
    next: ""
  }

  const transitionToEdit = data.transitionData || defaultTransition

  conditionText.value = JSON.stringify(transitionToEdit, null, 2)
  originalConditionText.value = conditionText.value
  validationError.value = ''
  dialogVisible.value = true
}

function cancelEdit() {
  handleClosePopup()
}

function handleValidationError(errorData: any) {
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
    return
  }

  try {
    const parsed = JSON.parse(newValue)
    if (!parsed || typeof parsed !== 'object' || !parsed.name) {
      jsonError.value = 'Transition data must contain a "name" field'
    } else {
      jsonError.value = ''
    }
    validationError.value = ''
  } catch (error: unknown) {
    jsonError.value = (error as Error).message
  }
})
</script>

<style scoped lang="scss">
.edit-edge-conditional-dialog {
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
