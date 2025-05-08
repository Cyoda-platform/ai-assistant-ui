<template>
  <div class="new-chat-view">
    <div class="new-chat-view__header">
      <img alt="logo" class="new-chat-view__header-logo" :src="LogoUrl"/>
      <VersionApp/>
      <div v-if="!isInIframe" class="new-chat-view__header-buttons">
        <el-button class="btn-border-github" v-show="stars>0" @click="onClickGithub()">
          <GithubIcon class="icon-github"/>
          {{ stars }}
        </el-button>
        <LoginButton v-if="!isLoggedIn"/>
      </div>
    </div>
    <div class="new-chat-view__body">
      <NewChat @created="onCreated"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import LogoUrl from '@/assets/images/logo.svg?url';
import GithubIcon from '@/assets/images/icons/github.svg';
import NewChat from "@/components/NewChat/NewChat.vue";
import {computed, onMounted, ref} from "vue";
import type {CreateChatResponse} from "@/types/chat.d";
import {useRouter, useRoute} from "vue-router";
import useAuthStore from "@/stores/auth";
import LoginButton from "@/components/LoginButton/LoginButton.vue";
import VersionApp from "@/components/VersionApp/VersionApp.vue";
import {isInIframe} from "@/helpers/HelperIframe";

const stars = ref(0);
const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  stars.value = await getStars();
})

async function getStars() {
  const response = await fetch(`https://api.github.com/repos/Cyoda-platform/cyoda-ai`);
  const data = await response.json();
  return data.stargazers_count;
}

function onClickGithub() {
  window.open('https://github.com/Cyoda-platform/cyoda-ai', '_blank').focus();
}

function onCreated(data: CreateChatResponse) {
  if(isInIframe) {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/chat-bot/view/${data.technical_id}?isNew=true&authState=${encodeURIComponent(JSON.stringify(authStore.$state))}`;
    window.open(link, '_blank').focus();
  } else {
    router.push(`/chat-bot/view/${data.technical_id}?isNew=true`);
  }
}

const isLoggedIn = computed(() => {
  return authStore.isLoggedIn;
})
</script>

<style scoped lang="scss">
.new-chat-view {
  background-color: var(--bg-new-chat);
  padding-top: 48px;
  padding-left: 58px;
  padding-right: 58px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  &__header-buttons {
    margin-left: auto;
  }

  .icon-github {
    margin-right: 12px;
    transition: none;
    height: 16px;
  }

  &__header {
    display: flex;
    align-items: center;

    .el-button + .el-button {
      margin-left: 24px;
    }
  }

  &__btn-login {
    width: 178px;
  }

  &__header-logo {
    width: 200px;
    height: auto;
  }

  &__body {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
  }
}
</style>
