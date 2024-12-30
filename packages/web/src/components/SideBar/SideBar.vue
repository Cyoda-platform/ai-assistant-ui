<template>
  <div class="side-bar" :class="{'side-bar--hidden': isSidebarHidden}">
    <div class="side-bar__wrapper-logo">
      <template v-if="isSidebarHidden">
        <img alt="logo" class="side-bar__logo" :src="LogoSmallUrl"/>
        <ToggleOpenIcon @click="onClickToggleSidebar" class="side-bar__toggle-close"/>
      </template>
      <template v-else>
        <img alt="logo" class="side-bar__logo" :src="LogoUrl"/>
        <ToggleCloseIcon @click="onClickToggleSidebar" class="side-bar__toggle-close"/>
      </template>
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
          <span v-if="!isSidebarHidden">{{ menu.name }}</span>
        </router-link>
      </li>
    </ul>
    <div class="side-bar__footer">
      <a @click="onClickLogout" href="#" class="side-bar__logout">
        <LogoutIcon/>
        <span v-if="!isSidebarHidden">
          Log out
        </span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import menusJson from "./menu.json";
import Icon from "@/components/Icon.vue";
import {useRoute, useRouter} from "vue-router";
import LogoutIcon from '@/assets/images/icons/logout.svg';
import ToggleCloseIcon from '@/assets/images/icons/toggle-close.svg';
import ToggleOpenIcon from '@/assets/images/icons/toggle-open.svg';
import useAuthStore from "@/stores/auth.ts";
import useAppStore from "@/stores/app.ts";
import {computed} from "vue";
import LogoSmallUrl from '@/assets/images/logo-small.svg?url'
import LogoUrl from '@/assets/images/logo.svg?url'

const authStore = useAuthStore();
const appStore = useAppStore();
const router = useRouter();
const route = useRoute();

const getIsActive = (menu) => {
  return route.path === menu.link || route.meta.baseUrl === menu.link;
}

function onClickLogout() {
  authStore.logout();
  router.push('/');
}

function onClickToggleSidebar() {
  appStore.isCanvasHidden ? appStore.toggleSidebarCanvas() : appStore.toggleSidebar();
}

const isSidebarHidden = computed(() => {
  return appStore.isSidebarHidden;
})
</script>

<style lang="scss">
.side-bar {
  padding: 0 40px;
  display: flex;
  flex-direction: column;
  height: 100vh;

  &--hidden {
    padding: 0 20px;
  }


  &__wrapper-logo {
    padding-top: 15vh;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__logo {
    height: 36px;
    width: auto;
  }

  &__toggle-close {
    cursor: pointer;
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

  &--hidden &__link {
    justify-content: center;
  }

  &__footer {
    margin: 15px 0;
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

  &--hidden &__logout {
    justify-content: center;
  }
}
</style>
