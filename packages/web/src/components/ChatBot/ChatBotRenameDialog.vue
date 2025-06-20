<template>
  <el-dialog
      v-model="dialogVisible"
      title="Rename Chat"
      :width="widthComputed"
      :close-on-click-modal="false"
  >
    <el-form ref="formRef" :rules="rules" label-position="top" :model="form" label-width="auto">
      <el-form-item label="Name" prop="chat_name">
        <el-input v-model="form.chat_name"/>
      </el-form-item>
      <el-form-item label="Description" prop="chat_description">
        <el-input v-model="form.chat_description" rows="5" resize="none" type="textarea"/>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button :loading="isLoading" class="btn-primary" type="primary" @click="onClickSubmit">
          Submit
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {computed, reactive, ref} from "vue";
import helperBreakpoints from "@/helpers/HelperBreakpoints";
import useAssistantStore from "@/stores/assistant";
import {templateRef} from "@vueuse/core";

const dialogVisible = ref(false);
const isLoading = ref(false);
const assistantStore = useAssistantStore();
const formRef = templateRef('formRef');

const props = defineProps<{
  technicalId: string,
  loadChatHistoryFn: any
}>();

const form = ref({
  chat_name: '',
  chat_description: '',
})

const widthComputed = computed(() => {
  if (helperBreakpoints.smaller('md').value) {
    return '90%';
  }
  return '500px';
})

const rules = reactive({
  chat_name: [
    {required: true, message: 'Please input Name', trigger: 'blur'},
  ],
})

function onClickSubmit() {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      isLoading.value = true;
      await assistantStore.renameChatById(props.technicalId, form.value);
      await Promise.all([assistantStore.getChats(), props.loadChatHistoryFn()]);
      dialogVisible.value = false;
    } finally {
      isLoading.value = false;
    }
  })
}

defineExpose({dialogVisible, form});
</script>

<style scoped lang="scss">
.dialog-footer {
  ::v-deep(button + button) {
    margin-left: 10px;
  }
}
</style>