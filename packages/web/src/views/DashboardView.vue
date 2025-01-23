<template>
  <div class="dashboard-view">
    <ChatBotCreateNew class="dashboard-view__new-chat" @created="onCreated"/>
  </div>
</template>

<script setup lang="ts">
import ChatBotCreateNew from "@/components/ChatBot/ChatBotCreateNew.vue";
import type {CreateChatResponse} from "@/types/chat";
import {useRouter} from "vue-router";

const router = useRouter();

function onCreated(data: CreateChatResponse) {
  router.push(`/chat-bot/view/${data.technical_id}?isNew=true`);
}
</script>

<style lang="scss">
.dashboard-view {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;

  &__new-chat {
    align-self: center;
    width: 50%;
  }
}
</style>
