<template>
  <div class="chat-bot-submit-form">
    <el-form :model="form" label-width="auto">
      <div class="chat-bot-submit-form__wrap_input">
        <el-form-item class="chat-bot-submit-form__input" label="">
          <el-input v-model="form.answer" placeholder="Use icons on  the right side or simply type">
            <template #suffix>
              <button class="chat-bot-submit-form__btn-submit" @click.prevent="onClickTextAnswer">
                <SendIcon/>
              </button>
            </template>
          </el-input>
        </el-form-item>
<!--        <div class="chat-bot-submit-form__actions">-->
<!--          <LinkIcon/>-->
<!--          <AttachIcon/>-->
<!--          <PencilIcon/>-->
<!--        </div>-->
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import SendIcon from '@/assets/images/icons/send.svg';
import LinkIcon from '@/assets/images/icons/link.svg';
import AttachIcon from '@/assets/images/icons/attach.svg';
import PencilIcon from '@/assets/images/icons/pencil.svg';
import useAssistantStore from "@/stores/assistant.ts";

const form = ref({
  answer: ''
});

const props = defineProps<{
  technicalId: string
}>()

const emit = defineEmits(['answer']);

async function onClickTextAnswer() {
  emit('answer', form.value.answer);
  const answer = form.value.answer;
  form.value.answer = '';
}
</script>

<style lang="scss">
.chat-bot-submit-form {
  &__wrap_input {
    display: flex;
    align-items: center;
  }

  &__input {
    flex: 1;
    margin: 0;
  }

  &__btn-submit {
    cursor: pointer;
    width: 38px;
    height: 38px;
    background-color: rgba(0, 0, 0, 0.2);
    border: none;
    border-radius: 4px;
    display: flex;
    justify-items: center;
    align-items: center;
  }

  &__actions {
    margin-left: 15px;
    display: flex;
    gap: 10px;
  }

  .el-input__wrapper {
    border: 1px solid #56575A;
    box-shadow: none !important;
    border-radius: 8px;
  }

  .el-input__inner {
    font-size: 20px;
    height: 54px;
  }

  .el-input__inner::placeholder {
    color: #56575A;
  }
}
</style>
