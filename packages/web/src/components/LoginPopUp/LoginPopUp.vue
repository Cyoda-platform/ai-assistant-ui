<template>
  <el-dialog
    v-model="dialogVisible"
    title="You are out of credits"
    width="400"
    :close-on-click-modal="false"
  >
    <span>Log in to continue building beautifully for free.</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible=false">
          Cancel
        </el-button>
        <el-button @click="onClickLogin" class="btn btn-primary" type="primary">
          Login
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from "vue";
import eventBus from "@/plugins/eventBus";
import {SHOW_LOGIN_POPUP} from "@/helpers/HelperConstants";
import {useAuth0} from "@auth0/auth0-vue";

const {loginWithRedirect} = useAuth0();

const dialogVisible = ref(false);

onMounted(() => {
  eventBus.$on(SHOW_LOGIN_POPUP, showLogin)
})

onBeforeUnmount(() => {
  eventBus.$off(SHOW_LOGIN_POPUP, showLogin);
})

function showLogin() {
  dialogVisible.value = true;
}

function onClickLogin() {
  loginWithRedirect({authorizationParams: { prompt: 'login' }});
}
</script>

<style scoped lang="scss">
.dialog-footer {
  text-align: center;
  display: flex;
  justify-content: space-between;

  button {
    flex: 1;
  }
}
</style>
