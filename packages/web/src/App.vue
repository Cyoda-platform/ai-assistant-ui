<template>
  <component v-loading="isLoading" :is="layout">
    <RouterView/>
    <LoginPopUp/>
  </component>
</template>

<script setup lang="ts">
import {useRoute, RouterView, useRouter} from "vue-router";
import {computed, onMounted, ref, watch, watchEffect} from "vue";
import useAppStore from "@/stores/app";
import LoginPopUp from "@/components/LoginPopUp/LoginPopUp.vue";
import {useAuth0} from "@auth0/auth0-vue";
import useAuthStore from "@/stores/auth";
import HelperStorage from "@/helpers/HelperStorage";
import {LOGIN_REDIRECT_URL} from "@/helpers/HelperConstants";
import {usePreferredDark} from '@vueuse/core';
import {isInIframe} from "@/helpers/HelperIframe";
import useAssistantStore from "@/stores/assistant";
import {setTokenGetter} from "@/helpers/HelperAuth";

const isDark = usePreferredDark()

const defaultLayout = "default";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();
const assistantStore = useAssistantStore();

onMounted(() => {
  const { getAccessTokenSilently } = useAuth0()
  setTokenGetter(() => getAccessTokenSilently())
})

const {user, getAccessTokenSilently, isAuthenticated} = useAuth0();
const isLoading = ref(false);
const layout = computed(() => {
  return `layout-${route.meta.layout || defaultLayout}`;
});

const theme = computed(() => {
  return appStore.theme;
})


watchEffect(() => {
  document.body.classList.remove(`theme-dark`);
  document.body.classList.remove(`theme-light`);
  if (isInIframe && !authStore.isLoggedIn) {
    document.body.classList.add('theme-light');
    return;
  }
  if (['dark', 'light'].includes(theme.value)) {
    document.body.classList.add(`theme-${theme.value}`);
  } else {
    document.body.classList.add(isDark.value ? 'theme-dark' : 'theme-light')
  }
});

const helperStorage = new HelperStorage();

watch(isAuthenticated, async (value) => {
  if (!value || authStore.isLoggedIn) return;
  isLoading.value = true;
  try {
    const oldToken = authStore.token;
    const token = await getAccessTokenSilently();
    authStore.saveData({
      token: token,
      tokenType: "private",
      refreshToken: null,
      userId: user.value.sub,
      username: user.value.name,
    })
    if (oldToken) {
      authStore.postTransferChats(oldToken, true);
    }

    assistantStore.setGuestChatsExist(false);
    const returnTo = helperStorage.get(LOGIN_REDIRECT_URL, '/home');
    helperStorage.removeItem(LOGIN_REDIRECT_URL)
    router.replace(returnTo);
  } finally {
    isLoading.value = false;
  }
}, {immediate: true});

</script>
