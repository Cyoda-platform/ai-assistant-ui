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
      <h4 class="menu-chat-list__empty-title">Nothing to see yet.</h4>
      <div class="menu-chat-list__empty-description">
        Create your first request to start and keep track on your history here anytime.
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import useAssistantStore from "@/stores/assistant";
import {computed, onBeforeUnmount, onMounted, ref, watch, watchEffect} from "vue";
import MenuChatGroup from "@/components/MenuChatList/MenuChatGroup.vue";
import eventBus from "@/plugins/eventBus";
import {UPDATE_CHAT_LIST} from "@/helpers/HelperConstants";
import {useRoute} from "vue-router";
import useAuthStore from "@/stores/auth";

const assistantStore = useAssistantStore();
const authStore = useAuthStore()
const emit = defineEmits(['ready', 'active']);
const allChats = ref([]);
const route = useRoute();

onMounted(() => {
  loadChats();
  eventBus.$on(UPDATE_CHAT_LIST, loadChats);
});

onBeforeUnmount(() => {
  eventBus.$off(UPDATE_CHAT_LIST, loadChats);
})

async function loadChats() {
  const {data} = await assistantStore.getChats();
  allChats.value = data.chats;
  emit('ready');
}

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

  const isSameDay = (date1, date2) =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

  const todayChats = [];
  const yesterdayChats = [];
  const previousChats = [];

  chatsData.forEach(chat => {
    const chatDate = new Date(chat.date);

    if (isSameDay(chatDate, today)) {
      todayChats.push(chat);
    } else if (isSameDay(chatDate, yesterday)) {
      yesterdayChats.push(chat);
    } else {
      previousChats.push(chat);
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
      chats: previousChats,
    }];
}

watchEffect(() => {
  const isSelected = allChats.value.some((el) => el.chat_id === route.params.technicalId);
  emit('active', isSelected);
});
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
    margin-top: 40px;
  }
}
</style>
