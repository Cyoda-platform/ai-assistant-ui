<template>
  <div class="chat-bot-message-notification" :class="{
    'chat-bot-message-notification--editable': message.editable
  }">
    <div class="chat-bot-message-notification__title">
         <span class="chat-bot-message-notification__cyoda-wrapper-icon">
          <NotificationIcon/>
        </span>
      <span>Notification</span>
    </div>
    <div v-html="computedMessage" class="chat-bot-message-notification__body"/>
    <el-collapse-transition>
      <div v-show="isEditMode">
        <el-input
          v-model="form.message"
          style="width: 100%"
          :autosize="{ minRows: 4, maxRows: 6 }"
          :disabled="isLoading"
          resize="none"
          type="textarea"
          placeholder="Type here"
          class="chat-bot-message-notification__input_edit"
          @keydown.enter="onClickSave"
        />
        <div class="chat-bot-message-question__actions">
          <el-button
            @click="onClickCancel"
            size="small"
            :disabled="isLoading"
            class="btn-white"
            :class="{
          'is-loading': isLoading
        }"
          >
            Discard Changes
          </el-button>
          <el-button
            @click="onClickSave"
            size="small"
            :loading="isLoading"
            class="btn-primary"
            :class="{
          'is-loading': isLoading
        }"
          >
            Save Changes
          </el-button>
        </div>
      </div>
    </el-collapse-transition>
    <el-button
      @click="onClickEdit"
      v-if="isVisibleEditBtn"
      size="small"
      class="btn-default-lighter btn-icon chat-bot-message-notification__edit_icon_wrapper"
      :class="{
          'is-loading': isLoading
        }"
    >
      <EditIcon/>
    </el-button>
  </div>
</template>

<script lang="ts" setup>
import NotificationIcon from "@/assets/images/icons/notification.svg";
import {computed, ref} from "vue";
import HelperMarkdown from "@/helpers/HelperMarkdown";
import EditIcon from '@/assets/images/icons/edit.svg';

const props = defineProps<{
  message: any,
}>()

const isLoading = ref(false);
const isEditMode = ref(false);
const form = ref({
  message: ''
})
const computedMessage = computed(() => {
  const text = props.message.text;
  if (typeof text === 'object' && text !== null) {
    return JSON.stringify(text, null, 2);
  }

  return HelperMarkdown.parseMarkdown(text);
});

const isVisibleEditBtn = computed(() => {
  return props.message.editable && !isEditMode.value;
})

const emit = defineEmits(['updateNotification']);

function onClickEdit() {
  resetForm();
  isEditMode.value = true;
}

function onClickCancel() {
  isEditMode.value = false;
}

function onClickSave() {
  isLoading.value = true;
  emit('updateNotification', {
    ...props.message.raw,
    notification: form.value.message
  });
}

function resetForm() {
  form.value.message = '';
}

</script>

<style lang="scss">
@use '@/assets/css/particular/variables.scss';

.chat-bot-message-notification {
  background: #FDFEFE;
  border: 1px solid #F0F1F4;
  border-radius: 16px;
  min-height: 100px;
  padding: 24px 16px 8px 68px;
  position: relative;
  margin-bottom: 25px;
  box-shadow: -1px 1px 20px rgba(214, 219, 219, 0.6);

  &__edit_icon_wrapper {
    position: absolute;
    right: 10px;
    bottom: 10px;
    display: block;
  }

  &__cyoda-wrapper-icon {
    position: absolute;
    left: 24px;
    top: 19px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__title {
    display: flex;
    margin-bottom: 8px;
    font-size: 15px;
    letter-spacing: 2px;

    span {
      color: variables.$color-primary;
      font-weight: 500;
      font-size: 16px;
    }
  }

  &__body {
    font-size: 16px;
    line-height: 1.5;
    padding-right: 48px;
    padding-bottom: 0;
    overflow-wrap: break-word;
    ul, ol{
      padding: 0 0 0 20px;
    }

    * {
      margin: 8px 0;
    }
  }

  &__input_edit {
    margin-right: 48px;
    margin-bottom: 16px;

    .el-textarea__inner {
      box-shadow: none;
      border: 1px solid variables.$color-primary;
      border-radius: 8px;
    }
  }

  &__actions {
    text-align: right;
  }

  &__action-rollback {
    width: 28px;
    height: 28px;
    padding: 0;

    &.is-loading {
      span {
        display: none;
      }
    }
  }
}
</style>
