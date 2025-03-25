<template>
  <component :is="layout">
    <RouterView/>
    <LoginPopUp/>
  </component>
</template>

<script setup lang="ts">
import {useRoute, RouterView, useRouter} from "vue-router";
import {computed, watch} from "vue";
import useAppStore from "@/stores/app";
import LoginPopUp from "@/components/LoginPopUp/LoginPopUp.vue";
import {useAuth0} from "@auth0/auth0-vue";
import useAuthStore from "@/stores/auth";
import HelperStorage from "@/helpers/HelperStorage";
import {LOGIN_REDIRECT_URL} from "@/helpers/HelperConstants";

const defaultLayout = "default";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();
const {user, getAccessTokenSilently, isAuthenticated} = useAuth0();
const layout = computed(() => {
  return `layout-${route.meta.layout || defaultLayout}`;
});

const theme = computed(() => {
  return appStore.theme;
})

watch(theme, (value, oldValue) => {
  if (oldValue) {
    document.body.classList.remove(`theme-${oldValue}`);
  }
  document.body.classList.add(`theme-${value}`);
}, { immediate: true });

const helperStorage = new HelperStorage();

watch(isAuthenticated, async (value) => {
  if (!value) return;
  const token = await getAccessTokenSilently();
  authStore.saveData({
    token: token,
    tokenType: "private",
    refreshToken: null,
    userId: user.value.sub,
    username: user.value.name,
  })

  const returnTo = helperStorage.get(LOGIN_REDIRECT_URL, '/');
  helperStorage.removeItem(LOGIN_REDIRECT_URL)
  router.replace(returnTo);
},{immediate: true });

</script>
