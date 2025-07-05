<template>
  <el-dialog
      append-to-body
      v-model="showConditionPopup"
      title="Редактировать условие"
      width="600px"
      :before-close="handleClosePopup"
  >
    <div class="condition-editor">
      <el-input
          v-model="conditionText"
          type="textarea"
          :rows="10"
          placeholder="Введите условие в формате JSON"
          :class="{ 'is-error': hasJsonError }"
      />
      <div v-if="hasJsonError" class="error-message">
        Ошибка в JSON: {{ jsonError }}
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancelEdit">Отмена</el-button>
        <el-button type="primary" @click="saveCondition" :disabled="hasJsonError">
          Сохранить
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import eventBus from "@/plugins/eventBus";

const originalConditionText = ref('')
const showConditionPopup = ref(false)
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

function openDialog(data) {
  currentEdgeData.value = data
  conditionText.value = data.condition ? JSON.stringify(data.condition, null, 2) : ''
  originalConditionText.value = conditionText.value
  showConditionPopup.value = true
}

function cancelEdit() {
  handleClosePopup()
}

function saveCondition() {
  if (hasJsonError.value) {
    return
  }

  let parsedCondition = null

  if (conditionText.value.trim() !== '') {
    try {
      parsedCondition = JSON.parse(conditionText.value)
    } catch (error: any) {
      jsonError.value = error.message
      return
    }
  }

  eventBus.$emit('save-condition', {
    ...currentEdgeData.value,
    condition: parsedCondition
  })

  showConditionPopup.value = false
}

function handleClosePopup() {
  showConditionPopup.value = false
  conditionText.value = originalConditionText.value
  jsonError.value = ''
}

watch(conditionText, (newValue) => {
  if (newValue.trim() === '') {
    jsonError.value = ''
    return
  }

  try {
    JSON.parse(newValue)
    jsonError.value = ''
  } catch (error: any) {
    jsonError.value = error.message
  }
})
</script>

<style scoped>
.condition-editor {
  margin-bottom: 16px;
}

.condition-editor :deep(.el-textarea.is-error .el-textarea__inner) {
  border-color: #f56c6c;
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>