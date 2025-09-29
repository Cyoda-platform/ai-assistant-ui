<template>
  <div v-if="isLoggedIn">
    <AuthStateAvatar/>
  </div>
  <div v-else>
    <LoginButton/>
  </div>
</template>

<script setup lang="ts">
import LoginButton from "@/components/LoginButton/LoginButton.vue";

import useAuthStore from "@/stores/auth";
import {computed} from "vue";
import AuthStateAvatar from "@/components/AuthState/AuthStateAvatar.vue";

const authStore = useAuthStore();

const isLoggedIn = computed(() => {
  return authStore.isLoggedIn;
})

</script>

<style scoped lang="scss">
</style>
