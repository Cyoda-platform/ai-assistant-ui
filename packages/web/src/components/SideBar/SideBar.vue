<template>
  <div class="side-bar" :class="{'side-bar--hidden': isSidebarHidden}">
    <div class="side-bar__wrapper-logo">
      <template v-if="isSidebarHidden">
        <img alt="logo" class="side-bar__logo" :src="LogoSmallUrl"/>
      </template>
      <template v-else>
        <img alt="logo" class="side-bar__logo" :src="LogoUrl"/>
        <ToggleCloseIcon @click="onClickToggleSidebar" class="side-bar__toggle-close"/>
      </template>
    </div>
    <ul class="side-bar__nav">
      <li v-if="isSidebarHidden" class="side-bar__li">
        <a @click="onClickToggleSidebar" class="side-bar__link">
          <ToggleOpenIcon class="side-bar__toggle-close main-icon"/>
        </a>
      </li>
      <li
        class="side-bar__li"
        v-for="(menu, index) in menus"
        :key="index"
        :class="{
              active: getIsActive(menu)
            }"
      >
        <a
          @click.stop="onClickMenu(menu)"
          href="#"
          class="side-bar__link"
          :class="{
            'side-bar__link--active': menu.isShow
          }"
        >
          <Icon :icon="menu.isShow? menu.iconOpen: menu.icon" class="main-icon"/>
          <span v-if="!isSidebarHidden">
              {{ menu.name }}
            <template v-if="!isMenuReady(menu)">
              (<LoadingText/>)
            </template>
          </span>
          <ArrowDownIcon class="arrow-down-icon" v-if="menu.component && !isSidebarHidden"/>
        </a>
        <template v-if="menu.component">
          <el-collapse-transition>
            <component @ready="onReady(menu)" v-show="menu.isShow" :is="getComponent(menu.component)"/>
          </el-collapse-transition>
        </template>
      </li>
      <template v-if="isSidebarHidden">
        <li class="side-bar__li">
          <a class="side-bar__link side-bar__link" href="#" @click.prevent="onClickCreate">
            <CreateNewRequestIcon class="main-icon"/>
          </a>
        </li>
      </template>
      <template v-else>
        <li class="side-bar__li">
          <el-button @click="onClickCreate" class="btn-primary side-bar__create_new">Create new request</el-button>
        </li>
      </template>
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
import MenuChatList from "@/components/MenuChatList/MenuChatList.vue";
import {useRoute, useRouter} from "vue-router";
import LogoutIcon from '@/assets/images/icons/logout.svg';
import ToggleCloseIcon from '@/assets/images/icons/toggle-close.svg';
import ToggleOpenIcon from '@/assets/images/icons/toggle-open.svg';
import useAuthStore from "@/stores/auth.ts";
import useAppStore from "@/stores/app.ts";
import {computed, ref} from "vue";
import LogoSmallUrl from '@/assets/images/logo-small.svg?url'
import LogoUrl from '@/assets/images/logo.svg?url'
import LoadingText from "@/components/LoadingText.vue";
import ArrowDownIcon from '@/assets/images/icons/arrow-down.svg';
import CreateNewRequestIcon from '@/assets/images/icons/create-new-request.svg';

const authStore = useAuthStore();
const appStore = useAppStore();
const router = useRouter();
const route = useRoute();

const menus = ref(menusJson);

const getIsActive = (menu) => {
  return route.path === menu.link || route.meta.baseUrl === menu.link;
}

function onClickLogout() {
  authStore.logout();
  router.push('/');
}

function onClickToggleSidebar() {
  closeAllMenus();
  appStore.isCanvasHidden ? appStore.toggleSidebarCanvas() : appStore.toggleSidebar();
}

function closeAllMenus() {
  menus.value.map((el) => el.isShow = false);
}

const isSidebarHidden = computed(() => {
  return appStore.isSidebarHidden;
})

function getComponent(componentName: string) {
  switch (componentName) {
    case 'MenuChatList':
      return MenuChatList
  }
}

function onClickMenu(menu) {
  if (menu.link) {
    return router.push(menu.link);
  } else if (!isMenuReady(menu)) {
    return;
  } else if (menu.component) {
    if (isSidebarHidden.value) appStore.toggleSidebar(false);
    menu.isShow = !menu.isShow;
  }
}

function isMenuReady(menu) {
  if (!Object.hasOwn(menu, 'ready')) return true;

  return menu.ready;
}

function onReady(menu) {
  menu.ready = true;
}

function onClickCreate() {
  router.push('/home');
}
</script>

<style lang="scss">
.side-bar {
  background-color: #FEFFFC;;
  padding: 0 20px 0 40px;
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
    padding: 9vh 20px 0 0;
    overflow-y: auto;
    margin: 15px 0;
  }

  &__li {
    padding-bottom: 40px;
  }

  &__link {
    display: flex;
    align-items: center;
    font-size: 16px;
    color: #000;
    text-decoration: none;

    .main-icon {
      margin-right: 16px;
    }

    .arrow-down-icon {
      margin-left: auto;
      transition: all 0.5s;
    }
  }

  &__link--active {
    .arrow-down-icon {
      transform: rotate(180deg);
    }
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

  &__create_new {
    width: 100%;
  }

  &--hidden &__link {
    justify-content: center;
  }

  &--hidden &__logout {
    justify-content: center;

    svg {
      margin-right: 0;
    }
  }

  &--hidden &__wrapper-logo {
    justify-content: center;
  }

  &--hidden &__li .main-icon {
    margin-right: 0;
  }

  &--hidden &__nav{
    padding-right: 0;
  }
}
</style>
