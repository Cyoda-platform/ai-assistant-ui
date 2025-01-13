<template>
  <div class="menu-chat-group">
    <h4>{{ title }}</h4>
    <ul>
      <li v-for="chat in chats" :key="chat.chat_id">
        <MenuChatItem :chat="chat"/>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import MenuChatItem from "@/components/MenuChatList/MenuChatItem.vue";

withDefaults(defineProps<{
  chats: any[],
  title: string,
}>(), {
  chats: () => [],
  title: ''
})
</script>

<style scoped>
h4 {
  margin-top: 32px;
  margin-bottom: 8px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
