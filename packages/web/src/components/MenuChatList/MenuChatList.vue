<template>
  <div class="menu-chat-list">
    <template v-for="group in chatsGroups">
      <MenuChatGroup v-if="group.chats.length>0" :chats="group.chats" :title="group.title"/>
    </template>
  </div>
</template>

<script setup lang="ts">
import useAssistantStore from "@/stores/assistant";
import {onBeforeUnmount, onMounted, ref} from "vue";
import {ChatResponse} from "@/types/chat.d";
import MenuChatGroup from "@/components/MenuChatList/MenuChatGroup.vue";
import eventBus from "@/plugins/eventBus";
import {UPDATE_CHAT_LIST} from "@/helpers/HelperConstants";

const assistantStore = useAssistantStore();
const chatsGroups = ref<ChatResponse>([]);
const emit = defineEmits(['ready']);

onMounted(()=>{
  loadChats();
  eventBus.$on(UPDATE_CHAT_LIST, loadChats);
});

onBeforeUnmount(()=>{
  eventBus.$off(UPDATE_CHAT_LIST, loadChats);
})

async function loadChats() {
  const {data} = await assistantStore.getChats();
  chatsGroups.value = splitChatsByDate(data.chats);
  emit('ready');
}


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
</script>
