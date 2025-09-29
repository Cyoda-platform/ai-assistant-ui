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
import {computed, onMounted, onBeforeUnmount, reactive, ref} from "vue";
import helperBreakpoints from "@/helpers/HelperBreakpoints";
import useAssistantStore from "@/stores/assistant";
import {templateRef} from "@vueuse/core";
import eventBus from "@/plugins/eventBus";
import {LOAD_CHAT_HISTORY, RENAME_CHAT_START} from "@/helpers/HelperConstants";

const dialogVisible = ref(false);
const isLoading = ref(false);
const assistantStore = useAssistantStore();
const formRef = templateRef('formRef');
const technicalId = ref(null);

onMounted(() => {
  eventBus.$on(RENAME_CHAT_START, onRenameChat);
});

onBeforeUnmount(() => {
  eventBus.$off(RENAME_CHAT_START, onRenameChat);
});

function onRenameChat(data) {
  form.value = {
    chat_name: data.name,
    chat_description: data.description,
  }

  technicalId.value = data.technical_id;


  dialogVisible.value = true;
}

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
      await assistantStore.renameChatById(technicalId.value, form.value);
      eventBus.$emit(LOAD_CHAT_HISTORY, technicalId.value);
      await assistantStore.getChats();
      dialogVisible.value = false;
    } finally {
      isLoading.value = false;
    }
  })
}
</script>

<style scoped lang="scss">
.dialog-footer {
  ::v-deep(button + button) {
    margin-left: 10px;
  }
}
</style>