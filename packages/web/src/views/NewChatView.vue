<template>
  <div class="new-chat-view">
    <div class="new-chat-view__header">
      <div class="new-chat-view__header-logo">
        <img alt="logo" class="new-chat-view__header-logo hidden-below-xs" :src="LogoUrl"/>
        <img alt="logo" class="new-chat-view__header-logo-small hidden-above-xs" :src="LogoUrlSmall"/>
        <VersionApp/>
      </div>
      <div v-if="!isInIframe" class="new-chat-view__header-buttons">
        <Support class="hidden-below-sm" size="large"/>
        <el-tooltip
            class="box-item"
            effect="dark"
            content="GitHub Stars"
            :show-after="1000"
            placement="top"
        >
          <el-button class="btn-border-github hidden-below-sm" v-show="stars>0" @click="onClickGithub">
            <GithubIcon class="icon-github"/>
            {{ stars }}
          </el-button>
        </el-tooltip>
        <AuthState/>
      </div>
    </div>
    <div class="new-chat-view__body">
      <NewChat @created="onCreated"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import LogoUrl from '@/assets/images/logo.svg?url';
import LogoUrlSmall from '@/assets/images/logo-small.svg?url';
import GithubIcon from '@/assets/images/icons/github.svg';
import NewChat from "@/components/NewChat/NewChat.vue";
import {computed, onMounted, ref} from "vue";
import type {CreateChatResponse} from "@/types/chat.d";
import {useRouter, useRoute} from "vue-router";
import useAuthStore from "@/stores/auth";
import VersionApp from "@/components/VersionApp/VersionApp.vue";
import {isInIframe} from "@/helpers/HelperIframe";
import AuthState from "@/components/AuthState/AuthState.vue";
import Support from "@/components/Support/Support.vue";

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
  if (isInIframe) {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/chat-bot/view/${data.technical_id}?isNew=true&authState=${encodeURIComponent(JSON.stringify(authStore.$state))}`;
    window.open(link, '_blank').focus();
  } else {
    router.push(`/chat-bot/view/${data.technical_id}?isNew=true`);
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/css/particular/breakpoints';

.new-chat-view {
  background-color: var(--bg-new-chat);
  padding-top: 48px;
  padding-left: 58px;
  padding-right: 58px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  @include breakpoints.respond-max('sm') {
    padding-top: 24px;
    padding-left: 29px;
    padding-right: 29px;
  }

  &__header {
    gap: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    @include breakpoints.respond-max('sm') {
      margin-bottom: 36px;
    }

    .el-button + .el-button {
      margin-left: 24px;
    }
  }

  &__header-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__header-buttons {
    display: flex;
    gap: 15px;
    align-items: center;
  }

  .icon-github {
    margin-right: 12px;
    transition: none;
    height: 16px;
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
