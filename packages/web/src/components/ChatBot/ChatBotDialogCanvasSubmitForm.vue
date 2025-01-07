<template>
  <div class="chat-bot-dialog-canvas-submit-form">
    <el-form :model="form" label-width="auto">
      <div class="chat-bot-dialog-canvas-submit-form__wrap_input">
        <el-form-item label="">
          <div class="chat-bot-dialog-canvas-submit-form__input">
            <el-input v-model="form.answer" placeholder="Type here" type="textarea" resize="none"
                      :autosize="{ minRows: 2}"/>
            <div class="chat-bot-dialog-canvas-submit-form__btn-submit">
              <button class="btn btn-primary btn-icon"
                      @click.prevent="onClickTextAnswer">
                <SendIcon/>
              </button>
            </div>
          </div>
        </el-form-item>
        <!--        <div class="chat-bot-dialog-canvas-submit-form__actions">-->
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

const emit = defineEmits(['answer']);

async function onClickTextAnswer() {
  emit('answer', form.value.answer);
  form.value.answer = '';
}
</script>

<style lang="scss">
.chat-bot-dialog-canvas-submit-form {
  &__wrap_input {
    display: flex;
    align-items: center;

    border: 1px solid #EBEBEB;
    box-shadow: none !important;
    border-radius: 8px;
    background-color: #fff;
    overflow: hidden;

    .el-form-item {
      width: 100%;
      margin-bottom: 0;
    }

    .el-form-item__content {
      flex: unset;
      width: 100%;
    }

    .el-textarea__inner {
      box-shadow: none;
    }
  }

  &__input {
    display: flex;
    align-items: end;
    width: 100%;

    .el-textarea {
      flex: 1;
    }

  }

  &__btn-submit {
    padding-right: 10px;
    padding-left: 15px;
    button {
      cursor: pointer;
      border: none;
      border-radius: 4px;
    }

    svg {
      position: relative;
      top: 2px;
      fill: #fff;
    }
  }

  &__actions {
    margin-left: 15px;
    display: flex;
    gap: 10px;
  }

  .el-input__inner {
    font-size: 20px;
    height: 70px;
  }

  .el-input__inner::placeholder {
    color: #A8ABB2;
  }

}
</style>
