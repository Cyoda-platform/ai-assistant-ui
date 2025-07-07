<template>
  <el-dialog
      class="edit-edge-conditional-dialog"
      :close-on-click-modal="false"
      v-model="dialogVisible"
      title="Edit conditional"
      width="600px"
      :before-close="handleClosePopup"
  >
    <div class="edit-edge-conditional-dialog__editor">
      <Editor language="javascript" v-model="conditionText"/>
      <div v-if="hasJsonError" class="edit-edge-conditional-dialog__error-message">
        Error in JSON: {{ jsonError }}
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

function openDialog(data) {
  currentEdgeData.value = data
  conditionText.value = data.condition ? JSON.stringify(data.condition, null, 2) : ''
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
    JSON.parse(newValue)
    jsonError.value = ''
  } catch (error: any) {
    jsonError.value = error.message
  }
})
</script>

<style scoped lang="scss">
.edit-edge-conditional-dialog {
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