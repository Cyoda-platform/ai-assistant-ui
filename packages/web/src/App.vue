<template>
  <component v-loading="isLoading" :is="layout">
    <RouterView/>
    <LoginPopUp/>
    <ChatBotRenameDialog ref="chatBotRenameDialogRef" />
    <ConfirmationDialog/>
    <!--    <DeveloperComponentIcon v-if="isDev"/>-->
  </component>
</template>

<script setup lang="ts">
import {useRoute, RouterView, useRouter} from "vue-router";
import {computed, onMounted, ref, watch, watchEffect} from "vue";
import LoginPopUp from "@/components/LoginPopUp/LoginPopUp.vue";
import {useAuth0} from "@auth0/auth0-vue";
import useAuthStore from "@/stores/auth";
import HelperStorage from "@/helpers/HelperStorage";
import {LOGIN_REDIRECT_URL} from "@/helpers/HelperConstants";
import {isInIframe} from "@/helpers/HelperIframe";
import useAssistantStore from "@/stores/assistant";
import {setTokenGetter} from "@/helpers/HelperAuth";
import {useDetectTheme} from "@/helpers/HelperTheme";
import ChatBotRenameDialog from "@/components/ChatBot/ChatBotRenameDialog.vue";
import ConfirmationDialog from "@/components/ConfirmationDialog/ConfirmationDialog.vue";

const defaultLayout = "default";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const assistantStore = useAssistantStore();
const detectTheme = useDetectTheme();

onMounted(() => {
  console.log('localtion', window.location);
  const {getAccessTokenSilently} = useAuth0()

  setTokenGetter(async () => {
    try {
      return await getAccessTokenSilently({
        cacheMode: 'off'
      });
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  });
})

const {user, getAccessTokenSilently, isAuthenticated} = useAuth0();
const isLoading = ref(false);
const layout = computed(() => {
  return `layout-${route.meta.layout || defaultLayout}`;
});

watchEffect(() => {
  const root = document.documentElement;
  root.classList.remove(`theme-dark`);
  root.classList.remove(`theme-light`);
  if (isInIframe && !authStore.isLoggedIn) {
    root.classList.add('theme-light');
    return;
  }

  root.classList.add(`theme-${detectTheme.value}`);
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
      picture: user.value.picture,
      family_name: user.value.family_name,
      given_name: user.value.given_name,
      email: user.value.email,
    })
    if (oldToken) {
      try {
        await authStore.postTransferChats(oldToken, true);
      } catch {}
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

<style scoped lang="scss">
</style>
