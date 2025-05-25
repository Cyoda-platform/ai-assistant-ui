<template>
  <div class="side-bar" :class="{'side-bar--hidden': isSidebarHidden}">
    <div class="side-bar__wrapper-logo">
      <template v-if="isSidebarHidden">
        <img alt="logo" class="side-bar__logo" :src="LogoSmallUrl"/>
      </template>
      <template v-else>
        <img alt="logo" class="side-bar__logo" :src="LogoUrl"/>
        <VersionApp :small="true"/>
        <ToggleCloseIcon @click="onClickToggleSidebar" class="side-bar__toggle-close"/>
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
          <span v-if="!isSidebarHidden">{{ t('side_bar.links.home')}}</span>
        </router-link>
      </li>

      <template v-if="!isSidebarHidden">
        <li class="side-bar__li" :class="{
              active: isHistoryMenuActive
            }">
          <a @click.prevent="onClickToggleHistory" class="side-bar__link" href="#">
            <HistoryOpenIcon v-if="isHistoryMenuVisible" class="main-icon"/>
            <HistoryIcon v-else class="main-icon"/>
            <span v-if="!isSidebarHidden">
            {{ t('side_bar.links.history')}}
             <template v-if="!isHistoryMenuReady">
              (<LoadingText/>)
            </template>
          </span>
            <ArrowDownIcon
              v-if="!isSidebarHidden"
              class="arrow-down-icon"
              :class="{
              'open': isHistoryMenuVisible
            }"
            />
          </a>
          <MenuChatList @ready="onHistoryMenuReady" @active="onHistoryMenuActive" v-show="isHistoryMenuVisible"/>
        </li>
      </template>
      <li class="side-bar__li side-bar__li-border">
        <a @click="onClickSettings" class="side-bar__link" href="#">
          <SettingsIcon class="main-icon"/>
          <span v-if="!isSidebarHidden">{{ t('side_bar.links.settings') }}</span>
        </a>
      </li>
      <li class="side-bar__li">
        <a @click="onClickAbout" class="side-bar__link" href="#">
          <AboutIcon class="main-icon"/>
          <span v-if="!isSidebarHidden">{{ t('side_bar.links.about') }}</span>
        </a>
      </li>
      <template v-if="isSidebarHidden">
        <li class="side-bar__li">
          <router-link class="side-bar__link side-bar__link" to="/home">
            <CreateNewRequestIcon class="main-icon main-icon-create-new"/>
          </router-link>
        </li>
      </template>
      <template v-else>
        <li class="side-bar__li side-bar__li-action">
          <el-button @click="onClickCreate" class="btn-primary side-bar__create_new">{{ t('side_bar.create_new') }}</el-button>
        </li>
      </template>
    </ul>
    <div class="side-bar__footer">
      <a v-if="isLogoutVisible" @click="onClickLogout" href="#" class="side-bar__logout">
        <LogoutIcon/>
        <span v-if="!isSidebarHidden">
          {{ t('side_bar.logout') }}
        </span>
      </a>
    </div>
    <SettingsDialog ref="settingsDialogRef"/>
    <AboutDialog ref="aboutDialogRef"/>
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
import AboutIcon from '@/assets/images/icons/about.svg';
import SettingsDialog from "@/components/SettingsDialog/SettingsDialog.vue";
import {useAuth0} from "@auth0/auth0-vue";
import AboutDialog from "@/components/AboutDialog/AboutDialog.vue";
import VersionApp from "@/components/VersionApp/VersionApp.vue";
import {useI18n} from "vue-i18n";

const authStore = useAuthStore();
const appStore = useAppStore();
const router = useRouter();
const route = useRoute();
const {logout} = useAuth0();
const settingsDialogRef = useTemplateRef('settingsDialogRef');
const aboutDialogRef = useTemplateRef('aboutDialogRef');

const isHistoryMenuVisible = ref(false);
const isHistoryMenuReady = ref(false);
const isHistoryMenuActive = ref(false);
const { t } = useI18n();

function onClickToggleHistory() {
  isHistoryMenuVisible.value = !isHistoryMenuVisible.value;
}

function isActiveMenu(link) {
  return route.path === link;
}

function onHistoryMenuReady() {
  isHistoryMenuReady.value = true;
}

let isInit = false;

function onHistoryMenuActive(event) {
  isHistoryMenuActive.value = event;
  if (event && !isInit) {
    isInit = true;
    isHistoryMenuVisible.value = event;
  }
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
  return authStore.isLoggedIn;
})

function onClickCreate() {
  router.push('/home');
}

function onClickSettings() {
  settingsDialogRef.value.openDialog();
}

function onClickAbout() {
  aboutDialogRef.value.openDialog();
}
</script>

<style lang="scss">
.side-bar {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  height: 100vh;


  &__wrapper-logo {
    padding-top: 24px;
    display: flex;
    align-items: center;
  }

  &__logo {
    width: 160px;
    height: auto;
  }

  &__toggle-close {
    cursor: pointer;
    fill: var(--text-color-regular) !important;
    margin-left: auto;
  }

  &__toggle-slot {
    margin-left: auto;
  }

  &__nav {
    flex-grow: 1;
    list-style: none;
    padding: 0;
    margin: 56px 0 15px 0;
  }

  &__li {
    margin-bottom: 4px;
  }

  &__li-border {
    border-top: 1px solid var(--border-attachment-file);
    padding-top: 5px;
    margin-top: 5px;
  }

  &__li-action {
    margin-top: 32px;
  }

  &__link {
    display: flex;
    align-items: center;
    font-size: 16px;
    min-height: 40px;
    font-weight: 600;
    padding: 0 12px;
    color: var(--text-color-regular);
    text-decoration: none;

    .main-icon {
      margin-right: 8px;
      fill: var(--text-color-regular);
    }

    .arrow-down-icon {
      margin-left: auto;
      transition: all 0.5s;
      fill: var(--text-color-regular);

      &.open {
        transform: rotate(-180deg);
      }
    }
  }

  &__li.active > a {
    background-color: var(--bg-active-menu);
    border-radius: 6px;
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

  &--hidden {
    padding: 0 12px;
  }

  &--hidden &__logo {
    width: 32px;
    height: auto;
  }

  &--hidden &__toggle-close {
    margin-left: unset;
  }

  &--hidden &__link {
    justify-content: center;
    padding: 0;
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

  .main-icon-create-new {
    fill: var(--bg-button-create-new);
  }
}
</style>
