<template>
  <div class="chat-bot">
    <ChatBotTopActions @toggleCanvas="emit('toggleCanvas')">
      <template #chat-name>
        <ChatBotName v-if="chatName" :chatName="chatName" :technicalId="technicalId"/>
      </template>
    </ChatBotTopActions>

    <div class="chat-bot__body">
      <div class="chat-bot__messages">
        <div class="chat-bot__inner-messages">
          <template v-for="message in messages">
            <el-row>
              <el-col class="chat-bot__inner-messages-col" :offset="getOffset(message.type)" :span="getSpan(message.type)">
                <ChatBotMessageQuestion
                    v-if="message.type === 'question'"
                    :message="message"
                    :isLoading="isLoading"
                    @rollbackQuestion="emit('rollbackQuestion', $event)"
                    @approveQuestion="emit('approveQuestion', $event)"
                />
                <ChatBotMessageNotification
                    v-if="message.type === 'notification'"
                    @updateNotification="emit('updateNotification', $event)"
                    :message="message"
                />
                <ChatBotMessageAnswer
                    v-if="message.type === 'answer'"
                    :message="message"/>
              </el-col>
            </el-row>
          </template>
          <ChatLoader v-if="isLoading"/>
          <div ref="chatBotPlaceholderRef" class="chat-bot__placeholder" :style="{
                minHeight: `${chatBotPlaceholderHeight}px`
                }"></div>
        </div>
        <div class="chat-bot__form">
          <ChatBotSubmitForm :disabled="disabled" @answer="emit('answer', $event)"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, ref, watch} from "vue";
import ChatBotSubmitForm from "@/components/ChatBot/ChatBotSubmitForm.vue";
import ChatLoader from "@/components/ChatBot/ChatLoader.vue";
import ChatBotMessageQuestion from "@/components/ChatBot/ChatBotMessageQuestion.vue";
import ChatBotMessageNotification from "@/components/ChatBot/ChatBotMessageNotification.vue";
import ChatBotMessageAnswer from "@/components/ChatBot/ChatBotMessageAnswer.vue";
import ChatBotTopActions from "@/components/ChatBot/ChatBotTopActions.vue";
import ChatBotName from "@/components/ChatBot/ChatBotName.vue";

const emit = defineEmits([
  'answer',
  'rollbackQuestion',
  'approveQuestion',
  'updateNotification',
  'toggleCanvas'
]);

const props = defineProps<{
  isLoading: boolean,
  disabled: boolean,
  messages: any[],
  technicalId: string,
  chatName: string | null,
}>();

let lastAnswerEl = null;
let chatLoaderHeight = null;
const chatBotPlaceholderHeight = ref(0);

function scrollDownMessages() {
  const messagesHtml = document.querySelector('.chat-bot__inner-messages');
  messagesHtml.scrollTo(0, messagesHtml.scrollHeight);
}

function getOffset(type) {
  if (type === 'answer') return 9;
  return ['question', 'notification'].includes(type) ? 1 : 8;
}

function getSpan(type) {
  return ['question', 'notification'].includes(type) ? 22 : 14;
}

const isLastMessageAnswer = computed(() => {
  const last = props.messages[props.messages.length - 1];
  if (!last) return false;
  return last.type === 'answer';
})

watch(() => props.isLoading, () => {
  if (props.isLoading) return;
  setTimeout(() => {
    scrollDownMessages();
    window.getSelection().removeAllRanges();
  }, 500)
})

watch(isLastMessageAnswer, async (value) => {
  if (value) {
    updatePlaceholderHeightForAnswer();
  } else {
    updatePlaceholderHeightForNoneAnswers();
  }
});

async function updatePlaceholderHeightForAnswer() {
  await nextTick();

  const messagesContainer = document.querySelector('.chat-bot__inner-messages');
  chatLoaderHeight = getFullHeight(document.querySelector('.chat-loader'));
  const answers = messagesContainer.querySelectorAll('.chat-bot-message-answer');
  const lastAnswer = answers[answers.length - 1];

  if (!lastAnswer) return;
  lastAnswerEl = lastAnswer;

  const messagesHeight = messagesContainer.clientHeight;
  const lastAnswerHeight = getFullHeight(lastAnswer);
  let placeholderHeight = messagesHeight - lastAnswerHeight - chatLoaderHeight;
  if (placeholderHeight < 0) placeholderHeight = 0;
  chatBotPlaceholderHeight.value = placeholderHeight;

  await nextTick();
  lastAnswer.scrollIntoView({behavior: 'smooth', block: 'start'});
}

async function updatePlaceholderHeightForNoneAnswers() {
  if (!lastAnswerEl) return;
  await nextTick();
  const startEl = lastAnswerEl.closest('.el-row');
  const nextEls = getNextElements(startEl);
  nextEls.forEach((el) => {
    const height = getFullHeight(el);
    chatBotPlaceholderHeight.value -= height;
  })

  if (chatLoaderHeight) {
    chatBotPlaceholderHeight.value += chatLoaderHeight;
    chatLoaderHeight = 0;
  }

  if (chatBotPlaceholderHeight.value < 0) chatBotPlaceholderHeight.value = 0;
}

function getNextElements(el) {
  let followingElements = [];
  let node = el.nextElementSibling;

  while (node) {
    if (!node.classList.contains('chat-bot__placeholder')) {
      followingElements.push(node);
    }
    node = node.nextElementSibling;
  }

  return followingElements;
}

function getFullHeight(el) {
  if (!el) return 0;
  const style = window.getComputedStyle(el);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  return el.offsetHeight + marginTop + marginBottom;
}
</script>

<style scoped lang="scss">
.layout-sidebar {
  display: flex;

  &__sidebar {
    min-height: 100vh;
    height: auto;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    border-right: 1px solid var(--sidebar-border);
    background-color: var(--bg-sidebar);
    width: 296px;

    &.hidden {
      width: 64px;
    }
  }

  &__main {
    flex: 1;
    min-height: 100vh;
    height: auto;
    background-color: var(--bg-sidebar-canvas);
  }
}
</style>

<style lang="scss">
@use '@/assets/css/particular/breakpoints';
.chat-bot {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;

  &__body {
    flex-grow: 1;
    margin-bottom: 20px;
    display: flex;
    overflow: hidden;
  }

  &__messages {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  &__inner-messages {
    flex-grow: 1;
    flex-direction: column;
    display: flex;
    overflow-y: auto;
    @include breakpoints.respond-max('md') {
      width: 100vw;
    }
    //padding-left: 5px;
  }

  &__inner-messages-col{
    @include breakpoints.respond-max('md') {
      margin-left: auto !important;
      margin-right: auto !important;
      width: 90% !important;
      max-width: unset;
      flex: unset;
    }
  }

  .chat-bot-submit-form {
    width: 91.6666666667%;
    margin: 0 auto;
  }

  &__form {
    margin-top: 20px;
  }

  &__body--canvas {
    display: flex;
    gap: 30px;

    .chat-bot__messages, .chat-bot__canvas {
      flex: 1;

      .chat-bot-submit-form {
        width: 100%;
      }
    }
  }

  .btn-wrapper {
    margin-left: 12px;
  }

  .bell-icon {
    position: relative;
    top: 4px;
  }

  .bell-icon--active {
    fill: rgb(230, 162, 60);
  }

  &__placeholder {
    //transition: all 1s linear;
  }
}
</style>
