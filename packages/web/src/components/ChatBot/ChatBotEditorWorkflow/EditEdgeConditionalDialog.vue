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
          <div v-if="hasJsonError" class="edit-edge-conditional-dialog__error-message">
            Error in JSON: {{ jsonError }}
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

const originalConditionText = ref('')
const dialogVisible = ref(false)
const conditionText = ref('')
const jsonError = ref('')

const currentEdgeData = ref(null)

const hasJsonError = computed(() => {
  return jsonError.value !== ''
})

onMounted(() => {
  eventBus.$on('show-condition-popup', openDialog)
})

onUnmounted(() => {
  eventBus.$off('show-condition-popup', openDialog)
})

function openDialog(data: any) {
  currentEdgeData.value = data

  const defaultTransition = {
    id: data.transitionName || "",
    next: ""
  }

  const transitionToEdit = data.transitionData || defaultTransition

  conditionText.value = JSON.stringify(transitionToEdit, null, 2)
  originalConditionText.value = conditionText.value
  dialogVisible.value = true
}

function cancelEdit() {
  handleClosePopup()
}

function saveCondition() {
  if (hasJsonError.value) {
    return
  }

  let parsedTransitionData = null

  if (conditionText.value.trim() !== '') {
    try {
      parsedTransitionData = JSON.parse(conditionText.value)
    } catch (error: unknown) {
      jsonError.value = (error as Error).message
      return
    }
  }

  // Проверяем, что в JSON есть поле id
  if (!parsedTransitionData || typeof parsedTransitionData !== 'object' || !parsedTransitionData.id) {
    jsonError.value = 'Transition data must contain an "id" field'
    return
  }

  const originalTransitionName = (currentEdgeData.value as any)?.transitionName
  const newTransitionName = parsedTransitionData.id

  eventBus.$emit('save-transition', {
    stateName: (currentEdgeData.value as any)?.stateName,
    transitionName: newTransitionName,
    transitionData: parsedTransitionData,
    oldTransitionName: originalTransitionName !== newTransitionName ? originalTransitionName : undefined,
    isNewTransition: (currentEdgeData.value as any)?.isNewTransition || false
  })

  dialogVisible.value = false
}

function handleClosePopup() {
  dialogVisible.value = false
  conditionText.value = originalConditionText.value
  jsonError.value = ''
}

watch(conditionText, (newValue) => {
  if (newValue.trim() === '') {
    jsonError.value = ''
    return
  }

  try {
    const parsed = JSON.parse(newValue)
    if (!parsed || typeof parsed !== 'object' || !parsed.id) {
      jsonError.value = 'Transition data must contain an "id" field'
    } else {
      jsonError.value = ''
    }
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
    color: #333;
  }

  &__editor {
    min-height: 200px;
  }

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
