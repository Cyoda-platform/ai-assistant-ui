<template>
  <div class="menu-chat-list">
    <template v-if="isChatExists">
      <template v-for="group in chatsGroups">
        <MenuChatGroup
            class="menu-chat-list__chat-group"
            v-if="group.chats.length>0"
            :chats="group.chats"
            :title="group.title"
        />
      </template>
    </template>
    <template v-else>
      <h4 class="menu-chat-list__empty-title"> {{ t('menu_chat_list.empty.title') }} </h4>
      <div class="menu-chat-list__empty-description">
        {{ t('menu_chat_list.empty.description') }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import useAssistantStore from "@/stores/assistant";
import {computed, onMounted, watch, watchEffect} from "vue";
import MenuChatGroup from "./MenuChatGroup.vue";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import useWorkflowStore from "../../stores/workflows";

const {t} = useI18n();

const assistantStore = useAssistantStore();
const emit = defineEmits(['ready', 'active']);
const route = useRoute();
const workflowStore = useWorkflowStore();

onMounted(() => {
  workflowStore.getAll();
});

const allChats = computed(() => {
  return workflowStore.workflowList;
})

const chatsGroups = computed(() => {
  return splitChatsByDate(allChats.value);
})

const isChatExists = computed(() => {
  return chatsGroups.value.some((el) => el.chats.length > 0);
})


function splitChatsByDate(chatsData) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const isSameDay = (date1, date2) =>
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();

  const todayChats = [];
  const yesterdayChats = [];
  const previousWeekChats = [];
  const olderChats = [];

  chatsData.forEach(chat => {
    const chatDate = new Date(chat.date);

    if (isSameDay(chatDate, today)) {
      todayChats.push(chat);
    } else if (isSameDay(chatDate, yesterday)) {
      yesterdayChats.push(chat);
    } else if (chatDate >= sevenDaysAgo) {
      previousWeekChats.push(chat);
    } else {
      olderChats.push(chat);
    }
  });

  return [
    {
      title: 'Today',
      chats: todayChats,
    },
    {
      title: 'Yesterday',
      chats: yesterdayChats,
    },
    {
      title: 'Previous week',
      chats: previousWeekChats,
    },
    {
      title: 'Older',
      chats: olderChats,
    }
  ];
}

watchEffect(() => {
  const isSelected = allChats.value.some((el) => el.technical_id === route.params.technicalId);
  emit('active', isSelected);
});

watch(() => assistantStore.chatList, (value) => {
  if (value !== null) emit('ready');
}, {immediate: true});
</script>

<style scoped lang="scss">
.menu-chat-list {
  margin-left: 12px;
  margin-top: 12px;
  max-height: 256px;
  overflow-y: auto;

  &__empty-title {
    margin-top: 0;
    margin-bottom: 8px;
    font-weight: bold;
    color: var(--text-color-regular);
  }

  &__empty-description {
    font-size: 16px;
    line-height: 1.5;
    color: var(--text-color-secondary);
  }

  .menu-chat-list__chat-group + .menu-chat-list__chat-group {
    margin-top: 30px;
  }
}
</style>
