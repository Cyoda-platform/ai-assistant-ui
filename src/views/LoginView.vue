<template>
  <div class="login-view">
    <div class="login-view__wrapper-logo">
      <img alt="logo" class="login-view__logo" src="../assets/images/logo.svg"/>
    </div>
    <div class="login-view__form">
      <el-form :rules="rules" label-position="top" ref="formRef" :model="form" label-width="120px">
        <el-form-item prop="username" label="Email Address">
          <el-input placeholder="Email" v-model.trim="form.username"/>
        </el-form-item>

        <el-form-item prop="password" label="Password">
          <el-input placeholder="Password" v-model.trim="form.password" show-password/>
        </el-form-item>

        <div class="login-view__actions">
          <el-button class="login-view__btn-login btn btn-primary" :loading="loading" @click="onLogin">Sign in</el-button>
        </div>
      </el-form>
    </div>
    <div class="login-view__footer">All Rights Reserved {{ yearComputed }}</div>
  </div>
</template>

<script setup lang="ts">
import {useRouter} from "vue-router";

import {ref, reactive, computed} from "vue";
import useAuthStore from "@/stores/auth.ts";

const router = useRouter();
const authStore = useAuthStore();
const formRef = ref(null);
const loading = ref<boolean>(false);

let form = reactive({
  username: "",
  password: ""
});

let rules = reactive({
  username: [{required: true, message: "Please input Email", trigger: "blur"}],
  password: [{required: true, message: "Please select Password", trigger: "blur"}]
});

function onLogin() {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        loading.value = true;
        await authStore.login(form);
        router.push("/");
      } finally {
        loading.value = false;
      }
    }
  });
}

const yearComputed = computed(() => {
  const date = new Date();
  return date.getFullYear();
});
</script>

<style lang="scss">
.login-view {
  padding: 0 52px 0 40px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: auto;

  &__wrapper-logo {
    padding-top: 15vh;
    display: flex;
    align-items: center;
  }

  &__logo {
    height: 36px;
    width: auto;
  }

  &__form {
    padding-top: 20vh;
    flex: 1;
  }

  .el-form-item__label::before {
    display: none;
  }

  &__actions {
    margin-top: 30px;
  }
  &__btn-login {
    width: 100%;
  }

  &__footer {
    color: #000;
    font-size: 12px;
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: right;
    right: -18px;
    position: relative;
    margin-top: 20px;
  }
}
</style>
