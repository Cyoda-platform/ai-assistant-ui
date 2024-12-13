<template>
  <el-form label-position="top" :model="form" :rules="rules" ref="formRef" label-width="auto"
           class="chat-bot-create-new">
    <h2 class="chat-bot-create-new__title">New Chat</h2>
    <el-form-item label="Name" prop="name">
      <el-input v-model="form.name"/>
    </el-form-item>

    <el-form-item label="Description" prop="description">
      <el-input v-model="form.description"/>
    </el-form-item>

    <div class="chat-bot-create-new__actions">
      <el-button class="chat-bot-create-new__button btn btn-primary" :loading="isLoading" size="large" type="primary"
                 @click="onClickSubmit">
        Create
      </el-button>
    </div>
  </el-form>
</template>

<script lang="ts" setup>
import {reactive, ref, useTemplateRef} from "vue";
import useAssistantStore from "@/stores/assistant.ts";
import type {CreateChatResponse} from "@/types/chat";

const assistantStore = useAssistantStore();
const formRef = useTemplateRef('formRef');
const isLoading = ref(false);
const emit = defineEmits<{
  created: [value: CreateChatResponse]
}>()
const form = ref({
  name: "",
  description: ""
})

const rules = reactive({
  name: [
    {required: true, message: 'Please input name', trigger: 'blur'},
  ],
  description: [
    {required: true, message: 'Please input description', trigger: 'blur'},
  ],
})

function onClickSubmit() {
  formRef.value.validate(async (valid) => {
    if (valid) {
      isLoading.value = true;
      const {data} = await assistantStore.chats(form.value);
      isLoading.value = false;
      emit('created', data);
      formRef.value.resetFields();
    }
  })
}
</script>

<style lang="scss">
.chat-bot-create-new {
  &__title {
    text-align: center;
  }

  &__actions {
    text-align: center;
  }

  &__button {
    width: 200px;
  }
}
</style>
