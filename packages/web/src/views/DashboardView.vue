<template>
  <div class="dashboard-view">
    <div class="dashboard-view__actions">
      <div class="dashboard-view__actions-left-part">
        <el-button @click="onClickDrawerSideBar" class="btn btn-default btn-icon hidden-above-md large">
          <MenuIcon/>
        </el-button>
      </div>
      <div class="dashboard-view__actions-right-part">
        <Support size="large"/>
        <AuthState/>
      </div>
    </div>
    <div class="dashboard-view__body">
      <NewChat @created="onCreated"/>
    </div>
    <DrawerSidebar ref="drawerSidebarRef"/>
  </div>
</template>

<script setup lang="ts">
import type {CreateChatResponse} from "@/types/chat";
import {useRouter} from "vue-router";
import NewChat from "@/components/NewChat/NewChat.vue";
import {onBeforeUnmount, onMounted} from "vue";
import AuthState from "@/components/AuthState/AuthState.vue";
import Support from "@/components/Support/Support.vue";
import DrawerSidebar from "@/components/DrawerSidebar/DrawerSidebar.vue";
import {templateRef} from "@vueuse/core";
import MenuIcon from "@/assets/images/icons/menu.svg";

const router = useRouter();
const drawerSidebarRef = templateRef('drawerSidebarRef');

function onCreated(data: CreateChatResponse) {
  router.push(`/chat-bot/view/${data.technical_id}?isNew=true`);
}

const BODY_CLASS_NAME = 'body-dashboard-view';

onMounted(() => {
  document.body.classList.add(BODY_CLASS_NAME);
})

onBeforeUnmount(() => {
  document.body.classList.remove(BODY_CLASS_NAME);
})

function onClickDrawerSideBar() {
  drawerSidebarRef.value.drawerVisible = true;
}
</script>

<style lang="scss">
@use '@/assets/css/particular/breakpoints';
.dashboard-view {
  padding-top: 24px;
  padding-left: 29px;
  padding-right: 29px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 60px);

  &__actions {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    @include breakpoints.respond-max('sm') {
      margin-bottom: 36px;
    }
  }

  &__actions-right-part{
    display: flex;
    gap: 12px;
    align-items: center;
  }

  &__body {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
  }
}
</style>
