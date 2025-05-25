<template>
  <div class="dashboard-view">
    <div class="dashboard-view__actions">
      <Support size="large"/>
      <AuthState/>
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
import {onBeforeUnmount, onMounted} from "vue";
import AuthState from "@/components/AuthState/AuthState.vue";
import Support from "@/components/Support/Support.vue";

const router = useRouter();

function onCreated(data: CreateChatResponse) {
  router.push(`/chat-bot/view/${data.technical_id}?isNew=true`);
}

const BODY_CLASS_NAME = 'body-dashboard-view';

onMounted(() => {
  document.body.classList.add(BODY_CLASS_NAME);
})

onBeforeUnmount(() => {
  document.body.classList.remove(BODY_CLASS_NAME);
})
</script>

<style lang="scss">
.dashboard-view {
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  &__actions {
    margin-left: auto;
    padding: 0 30px;
    display: flex;
    gap: 12px;
    align-items: center;
  }

  &__body {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
  }
}
</style>
