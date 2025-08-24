<template>
  <el-button @click="onClick" class="btn btn-primary-darken new-chat-view__btn-login">Log in</el-button>
</template>

<script setup lang="ts">
import {useAuth0} from "@auth0/auth0-vue";
import HelperStorage from "@/helpers/HelperStorage";
import {LOGIN_REDIRECT_URL} from "@/helpers/HelperConstants";

const helperStorage = new HelperStorage();

const {loginWithRedirect, loginWithPopup} = useAuth0();

function onClick() {
  helperStorage.set(LOGIN_REDIRECT_URL, '/home');
  loginWithPopup({
    authorizationParams: {
      prompt: 'login',
      scope: 'openid profile email offline_access'
    }
  });
}
</script>

<style scoped lang="scss">

</style>
