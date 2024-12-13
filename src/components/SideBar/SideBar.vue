<template>
  <div class="side-bar">
    <div class="side-bar__wrapper-logo">
      <img alt="logo" class="side-bar__logo" src="../../assets/images/logo.svg"/>
    </div>
    <ul class="side-bar__nav">
      <li
        v-for="(menu, index) in menusJson"
        :key="index"
        :class="{
              active: getIsActive(menu)
            }"
      >
        <router-link class="side-bar__link" :to="menu.link">
          <Icon :icon="menu.icon"/>
          <span>{{ menu.name }}</span>
        </router-link>
      </li>
    </ul>
    <div class="side-bar__footer">
      <a @click="onClickLogout" href="#" class="side-bar__logout">
        <LogoutIcon/>
        Log out
      </a>

      <div class="side-bar__user">
        <div>
          <img src="@/assets/images/avatar.png"/>
        </div>
        <div>
          <span>Steve Smith</span>
          <span class="side-bar__user-city">New York Group</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import menusJson from "./menu.json";
import Icon from "@/components/Icon.vue";
import {useRoute, useRouter} from "vue-router";
import LogoutIcon from '@/assets/images/icons/logout.svg';
import useAuthStore from "@/stores/auth.ts";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const getIsActive = (menu) => {
  return route.path === menu.link || route.meta.baseUrl === menu.link;
}

function onClickLogout() {
  authStore.logout();
  router.push('/');
}
</script>

<style lang="scss">
.side-bar {
  padding: 0 52px 0 40px;
  display: flex;
  flex-direction: column;
  height: 100vh;

  &__wrapper-logo {
    padding-top: 15vh;
    display: flex;
    align-items: center;
  }

  &__logo {
    height: 36px;
    width: auto;
  }

  &__nav {
    flex-grow: 1;
    list-style: none;
    padding: 10vh 0 0 0;
    margin: 0;
  }

  &__link {
    display: flex;
    align-items: center;
    font-size: 16px;
    color: #000;
    text-decoration: none;

    svg {
      margin-right: 16px;
    }
  }

  &__footer {
    margin-top: 15px;
  }

  &__logout {
    display: flex;
    font-size: 16px;
    color: #000000;
    text-decoration: none;
    align-items: center;
    margin-left: 5px;

    &:hover {
      text-decoration: underline;
    }

    svg {
      margin-right: 16px;
    }
  }

  &__user {
    display: flex;
    align-items: center;
    margin-top: 40px;
    margin-bottom: 20px;

    img {
      width: 42px;
      height: 42px;
      margin-right: 13px;
    }

    span {
      display: block;
    }
  }

  &__user-city {
    font-size: 12px;
  }
}
</style>
