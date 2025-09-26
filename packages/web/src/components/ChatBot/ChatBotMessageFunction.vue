<template>
  <div class="chat-bot-message-function" :class="{
    'chat-bot-message-function--editable': message.editable
  }">
    <div class="chat-bot-message-function__title">
         <span class="chat-bot-message-function__cyoda-wrapper-icon">
          <FunctinonIcon/>
        </span>
      <span>Function | <small class="chat-bot-message-function__date">{{ date }}</small></span>
    </div>
    <div class="chat-bot-message-function__item">
      <ChatBotMessageFunctionItem
          @click="onClick"
          :isLoading="isLoading"
          :item="computedMessage"
      />
    </div>

    <div v-if="serverResponse" class="chat-bot-message-function__body">
      <h4>Response:</h4>
      <div>
        {{ serverResponse }}
      </div>
    </div>
    <div class="chat-bot-message-function__bottom-actions">
      <el-tooltip
          v-if="message.approve"
          class="box-item"
          effect="dark"
          content="Approve"
          placement="top"
          :show-after="1000"
      >
        <el-button
            @click="onClickApproveQuestion"
            size="small"
            :disabled="isLoading"
            class="btn btn-primary btn-icon"
            :loading="isLoadingApprove"
        >
          <CheckIcon class="fill-stroke"/>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import FunctinonIcon from "@/assets/images/icons/function.svg";
import {computed, ref} from "vue";
import useAuthStore from "@/stores/auth";
import ChatBotMessageFunctionItem from "@/components/ChatBot/ChatBotMessageFunction/ChatBotMessageFunctionItem.vue";
import privateClient from "@/clients/private";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import {ElMessage} from "element-plus";
import CheckIcon from "@/assets/images/icons/check.svg";

const props = defineProps<{
  message: any,
}>()

const computedMessage = computed(() => {
  return JSON.parse(props.message.text.replaceAll("'", '"'));
});

const serverResponse = ref(null);
const authStore = useAuthStore();
const isLoading = ref(false);
const isLoadingApprove = ref(false);

const emit = defineEmits(['updateNotification', 'approveQuestion']);

const endpointUrl = computed(() => {
  return `https://${import.meta.env.VITE_APP_CYODA_CLIENT_ENV_PREFIX}${authStore.parsedToken.caas_org_id}.${import.meta.env.VITE_APP_CYODA_CLIENT_HOST}${computedMessage.value.path}`;
});

const date = computed(() => {
  return dayjs(props.message.raw.last_modified).format('DD/MM/YYYY HH:mm:ss')
})

async function onClick() {
  try {
    isLoading.value = true;
    const {data} = await privateClient[computedMessage.value.method.toLowerCase()](endpointUrl.value);
    responseHandler(data);
    ElMessage('File has been received')
  } finally {
    isLoading.value = false;
  }
}

function responseHandler(data) {
  if (computedMessage.value.response_format === 'file') {
    const date = dayjs();
    const file = new File([JSON.stringify(data)], `file_${date.format('DD-MM-YYYY')}.txt`, {type: "text/plain;charset=utf-8"});
    FileSaver.saveAs(file);
    return;
  }

  serverResponse.value = data;
}

function onClickApproveQuestion() {
  isLoadingApprove.value = true;
  emit('approveQuestion', props.message.raw);
  setTimeout(() => {
    isLoadingApprove.value = false;
  }, 2000);
}

</script>

<style lang="scss">
@use '@/assets/css/particular/mixins';
@use '@/assets/css/particular/breakpoints';

.chat-bot-message-function {
  background: var(--bubble-notification-bg-color);
  border: 1px solid var(--bubble-border-color);
  border-radius: 16px;
  min-height: 100px;
  padding: 24px 16px 24px 68px;
  position: relative;
  margin-bottom: 25px;
  box-shadow: -1px 1px 20px var(--bubble-box-shadow-color);
  @include breakpoints.respond-max('md') {
    padding-right: 16px;
  }

  &__date {
    font-size: 12px;
  }

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
      color: var(--color-primary);
      font-weight: 500;
      font-size: 16px;
    }

    svg {
      fill: var(--color-primary);
    }
  }

  &__bottom-actions {
    text-align: right;
    .btn-primary svg{
      stroke: var(--color-icon-submit) !important;
    }
  }

  &__item {
    margin-top: 12px;
    @include mixins.bubble_body;
  }
}
</style>
