<template>
  <div class="side-bar" :class="{'side-bar--hidden': isSidebarHidden, 'side-bar--drawer': mode === 'drawer'}">
    <div class="side-bar__wrapper-logo">
      <template v-if="isSidebarHidden">
        <img alt="logo" class="side-bar__logo" :src="LogoSmallUrl"/>
      </template>
      <template v-else>
        <img alt="logo" class="side-bar__logo" :src="LogoUrl"/>
        <template v-if="slots.toggle">
          <slot name="toggle"></slot>
        </template>
        <template v-else>
          <ToggleCloseIcon @click="onClickToggleSidebar" class="side-bar__toggle-close"/>
        </template>
      </template>
    </div>
    <ul class="side-bar__nav">
      <li v-if="isSidebarHidden" class="side-bar__li">
        <a @click="onClickToggleSidebar" class="side-bar__link">
          <ToggleOpenIcon class="side-bar__toggle-close main-icon"/>
        </a>
      </li>
      <li class="side-bar__li" :class="{
              active: isActiveMenu('/home')
            }">
        <router-link class="side-bar__link" to="/home">
          <HomeIcon class="main-icon"/>
          <span v-if="!isSidebarHidden">Home</span>
        </router-link>
      </li>

      <li class="side-bar__li" :class="{
              active: isHistoryMenuActive
            }">
        <a @click.prevent="onClickToggleHistory" class="side-bar__link" href="#">
          <template v-if="!isSidebarHidden">
            <HistoryOpenIcon v-if="isHistoryMenuVisible" class="main-icon"/>
            <HistoryIcon v-else class="main-icon"/>
          </template>
          <span v-if="!isSidebarHidden">
            History
             <template v-if="!isHistoryMenuReady">
              (<LoadingText/>)
            </template>
          </span>
          <ArrowDownIcon class="arrow-down-icon" v-if="!isSidebarHidden"/>
        </a>
        <el-collapse-transition>
          <MenuChatList @ready="onHistoryMenuReady" @active="onHistoryMenuActive" v-show="isHistoryMenuVisible"/>
        </el-collapse-transition>
      </li>
      <li class="side-bar__li">
        <a @click="onClickSettings" class="side-bar__link" href="#">
          <SettingsIcon class="main-icon"/>
          <span v-if="!isSidebarHidden">Settings</span>
        </a>
      </li>
      <template v-if="isSidebarHidden">
        <li class="side-bar__li">
          <a class="side-bar__link side-bar__link" href="#" @click.prevent="onClickCreate">
            <CreateNewRequestIcon class="main-icon main-icon-create-new"/>
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
      <a v-if="isLogoutVisible" @click="onClickLogout" href="#" class="side-bar__logout">
        <LogoutIcon/>
        <span>
          Log out
        </span>
      </a>
    </div>
    <SettingsDialog ref="settingsDialogRef"/>
  </div>
</template>

<script setup lang="ts">
import MenuChatList from "@/components/MenuChatList/MenuChatList.vue";
import {useRoute, useRouter} from "vue-router";
import LogoutIcon from '@/assets/images/icons/logout.svg';
import ToggleCloseIcon from '@/assets/images/icons/toggle-close.svg';
import ToggleOpenIcon from '@/assets/images/icons/toggle-open.svg';
import useAuthStore from "@/stores/auth.ts";
import useAppStore from "@/stores/app.ts";
import {computed, ref, useSlots, useTemplateRef} from "vue";
import LogoSmallUrl from '@/assets/images/logo-small.svg?url'
import LogoUrl from '@/assets/images/logo.svg?url'
import LoadingText from "@/components/LoadingText.vue";
import ArrowDownIcon from '@/assets/images/icons/arrow-down.svg';
import CreateNewRequestIcon from '@/assets/images/icons/create-new-request.svg';
import HomeIcon from '@/assets/images/icons/home.svg';
import HistoryIcon from '@/assets/images/icons/history.svg';
import HistoryOpenIcon from '@/assets/images/icons/history-open.svg';
import SettingsIcon from '@/assets/images/icons/settings.svg';
import SettingsDialog from "@/components/SettingsDialog/SettingsDialog.vue";
import {useAuth0} from "@auth0/auth0-vue";

const authStore = useAuthStore();
const appStore = useAppStore();
const router = useRouter();
const route = useRoute();
const slots = useSlots();
const {logout} = useAuth0();
const settingsDialogRef = useTemplateRef('settingsDialogRef');

withDefaults(defineProps<{
  mode: string,
}>(), {
  mode: 'default',
});

const isHistoryMenuVisible = ref(false);
const isHistoryMenuReady = ref(false);
const isHistoryMenuActive = ref(false);

function onClickToggleHistory() {
  isHistoryMenuVisible.value = !isHistoryMenuVisible.value;
}

function isActiveMenu(link) {
  return route.path === link;
}

function onHistoryMenuReady() {
  isHistoryMenuReady.value = true;
}

function onHistoryMenuActive(event) {
  isHistoryMenuActive.value = event;
}

function onClickLogout() {
  authStore.logout(() => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  });
  router.push('/');
}

function onClickToggleSidebar() {
  closeAllMenus();
  appStore.isCanvasHidden ? appStore.toggleSidebarCanvas() : appStore.toggleSidebar();
}

function closeAllMenus() {
  isHistoryMenuActive.value = false;
}

const isSidebarHidden = computed(() => {
  return appStore.isSidebarHidden;
})

const isLogoutVisible = computed(() => {
  return !appStore.isSidebarHidden && authStore.isLoggedIn;
})

function onClickCreate() {
  router.push('/home');
}

function onClickSettings() {
  settingsDialogRef.value.openDialog();
}
</script>

<style lang="scss">
.side-bar {
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
    fill: var(--text-color-regular) !important;
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
    color: var(--text-color-regular);
    text-decoration: none;

    .main-icon {
      margin-right: 16px;
      fill: var(--text-color-regular);
    }

    .arrow-down-icon {
      margin-left: auto;
      transition: all 0.5s;
      fill: var(--text-color-regular);
    }
  }

  &__li.active > a {
    color: var(--text-header);
    font-weight: bold;

    svg {
      fill: var(--text-header)
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
    color: var(--text-color-regular);
    text-decoration: none;
    align-items: center;
    margin-left: 5px;

    &:hover {
      text-decoration: underline;
    }

    svg {
      margin-right: 16px;

      g {
        stroke: var(--text-color-regular);
      }
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

  &--hidden &__nav {
    padding-right: 0;
  }

  &--drawer {
    background-color: var(--bg-sidebar);

    .side-bar__logo {
      max-width: 160px;
    }

    .side-bar__wrapper-logo {
      padding-top: 24px;
      padding-right: 20px;
    }
  }

  .main-icon-create-new {
    fill: var(--bg-button-create-new);
  }
}
</style>
