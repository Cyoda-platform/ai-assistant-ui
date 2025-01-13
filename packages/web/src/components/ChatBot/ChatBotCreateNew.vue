<template>
  <div class="chat-bot-create-new">
    <h1 class="chat-bot-create-new__title">What do you want to do?</h1>
    <div class="chat-bot-create-new__description">
      The fastest way to build <span class="color-green">YOUR</span> complex,
      data intensive system <span class="color-green">STARTS</span> here
    </div>
    <el-form label-position="top" :model="form" :rules="rules" ref="formRef" label-width="auto"
             class="chat-bot-create-new__form">
      <el-form-item label="Create name for your request" prop="name">
        <el-input placeholder="Financial app" v-model="form.name"/>
      </el-form-item>

      <el-form-item label="Create description for your request" prop="description">
        <el-input placeholder="Database from 12 December" type="textarea" :rows="4" resize="none" v-model="form.description"/>
      </el-form-item>

      <div class="chat-bot-create-new__actions">
        <el-button class="chat-bot-create-new__button btn btn-primary" :loading="isLoading" size="large" type="primary"
                   @click="onClickSubmit">
          Save and continue
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import {reactive, ref, useTemplateRef} from "vue";
import useAssistantStore from "@/stores/assistant.ts";
import type {CreateChatResponse} from "@/types/chat";
import eventBus from "@/plugins/eventBus";
import {UPDATE_CHAT_LIST} from "@/helpers/HelperConstants";

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
})

function onClickSubmit() {
  formRef.value.validate(async (valid) => {
    if (valid) {
      isLoading.value = true;
      const {data} = await assistantStore.chats(form.value);
      isLoading.value = false;
      emit('created', data);
      eventBus.$emit(UPDATE_CHAT_LIST);
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

  &__description {
    font-size: 24px;
    color: #606266;
    line-height: 160%;
  }

  &__form {
    margin-top: 80px;
  }

  &__button {
    width: 300px;
  }

  &__actions {
    margin-bottom: 15px;
  }

  .el-form-item {
    margin-bottom: 40px;
  }
}
</style>
