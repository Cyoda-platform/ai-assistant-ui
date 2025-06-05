<template>
  <div class="chat-bot-top-actions">
    <div class="chat-bot-top-actions__left-part">
      <el-button @click="onClickDrawerSideBar" class="btn btn-default btn-icon">
        <MenuIcon/>
      </el-button>
      <slot class="chat-bot-top-actions__chat-name" name="chat-name"></slot>
    </div>
    <div class="chat-bot-top-actions__right-part hidden-below-md">
      <el-tooltip
          class="box-item"
          effect="dark"
          content="Delete Chat"
          :show-after="1000"
          placement="top"
      >
        <el-button :loading="isLoadingDelete" @click="onClickDelete" class="btn btn-default btn-icon">
          <TrashSmallIcon/>
        </el-button>
      </el-tooltip>
      <slot name="secondary-actions"></slot>
      <el-tooltip
          class="box-item"
          effect="dark"
          content="Entities Data"
          :show-after="1000"
          placement="top"
      >
        <el-button @click="onClickEntitiesDetails" class="btn btn-default btn-icon btn-toggle-canvas">
          <EntitiesDataIcon/>
        </el-button>
      </el-tooltip>
      <Support/>
      <AuthState/>
    </div>
    <div class="chat-bot-top-actions__right-part hidden-above-md">
      <AuthState/>
      <ChatBotMobileMenu/>
    </div>
    <EntitiesDetailsDialog v-model="entitiesDetailsDialogVisible"/>
    <DrawerSidebar ref="drawerSidebarRef"/>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue";
import MenuIcon from "@/assets/images/icons/menu.svg";
import EntitiesDetailsDialog from "@/components/EntitiesDetailsDialog/EntitiesDetailsDialog.vue";
import AuthState from "@/components/AuthState/AuthState.vue";
import {ElMessageBox} from "element-plus";
import useAssistantStore from "@/stores/assistant";
import {useRoute} from "vue-router";
import router from "@/router";
import eventBus from "@/plugins/eventBus";
import {DELETE_CHAT_START} from "@/helpers/HelperConstants";
import DrawerSidebar from "@/components/DrawerSidebar/DrawerSidebar.vue";
import {templateRef} from "@vueuse/core";
import ChatBotMobileMenu from "@/components/ChatBot/ChatBotMobileMenu.vue";
import ChatActions from "@/components/ChatBot/ChatActions.vue";

const emit = defineEmits(['toggleCanvas']);
const isLoadingDelete = ref(false);

const assistantStore = useAssistantStore();
const route = useRoute();

const entitiesDetailsDialogVisible = ref(false);
const drawerSidebarRef = templateRef('drawerSidebarRef');

function onClickEntitiesDetails() {
  entitiesDetailsDialogVisible.value = true;
}

function onClickDrawerSideBar() {
  drawerSidebarRef.value.drawerVisiable = true;
}

function onClickDelete() {
  ElMessageBox.confirm("Do you really want to remove?", "Confirm!", {
    callback: async (action) => {
      if (action === "confirm") {
        try {
          eventBus.$emit(DELETE_CHAT_START);
          isLoadingDelete.value = true;
          await assistantStore.deleteChatById(route.params.technicalId);
          await assistantStore.getChats();
          router.push('/home');
        } finally {
          isLoadingDelete.value = false;
        }
      }
    }
  });
}
</script>

<style lang="scss" scoped>
@use '@/assets/css/particular/breakpoints';

.chat-bot-top-actions {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 32px 12px 4.1666666667%;
  background-color: var(--bg-sidebar);
  box-sizing: content-box;
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: nowrap;

  &__left-part {
    display: flex;
    gap: 12px;
    align-items: center;
    @include breakpoints.respond-max('md') {
      //width: 100vw;
      flex: 1;
      min-width: 0;
    }
  }

  &__right-part {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  ::v-deep(button) {
    margin: 0;
  }
}
</style>
