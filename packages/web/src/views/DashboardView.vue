<template>
  <div class="dashboard-view">
    <div class="dashboard-view__actions">
      <LoginButton v-if="!isLoggedIn"/>
    </div>
    <div class="dashboard-view__body">
      <NewChat @created="onCreated"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {CreateChatResponse} from "@/types/chat";
import {useRouter} from "vue-router";
import NewChat from "@/components/NewChat/NewChat.vue";
import {computed, onBeforeUnmount, onMounted} from "vue";
import useAuthStore from "@/stores/auth";
import LoginButton from "@/components/LoginButton/LoginButton.vue";

const router = useRouter();

function onCreated(data: CreateChatResponse) {
  router.push(`/chat-bot/view/${data.technical_id}?isNew=true`);
}

const BODY_CLASS_NAME = 'body-dashboard-view';

const authStore = useAuthStore();
const isLoggedIn = computed(() => {
  return authStore.isLoggedIn;
})

onMounted(() => {
  document.body.classList.add(BODY_CLASS_NAME);
})

onBeforeUnmount(() => {
  document.body.classList.remove(BODY_CLASS_NAME);
})
</script>

<style lang="scss">
.dashboard-view {
  padding-top: 48px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  &__actions {
    text-align: right;
    padding: 0 30px;
  }

  &__body {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
  }
}
</style>
