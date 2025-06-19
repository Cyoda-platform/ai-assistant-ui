<template>
  <div class="chat-bot-top-actions">
    <div class="chat-bot-top-actions__left-part">
      <el-button @click="onClickDrawerSideBar" class="btn btn-default btn-icon hidden-above-md">
        <MenuIcon class="fill-stroke"/>
      </el-button>
      <slot class="chat-bot-top-actions__chat-name" name="chat-name"></slot>
    </div>
    <div class="chat-bot-top-actions__right-part hidden-below-md">
      <ChatBotMenuDesktop
          :isLoadingDelete="isLoadingDelete"
          @rename="onClickRename"
          @delete="onClickDelete"
          @toggleCanvas="emit('toggleCanvas')"
          @entitiesDetails="onClickEntitiesDetails"
          @support="onClickSupport"
      />
      <AuthState/>
    </div>
    <div class="chat-bot-top-actions__right-part hidden-above-md">
      <AuthState/>
      <el-button v-if="canvasVisible" @click="onClickMarkdownSideBar" class="btn btn-default btn-icon hidden-above-md">
        <MarkdownIcon/>
      </el-button>
      <ChatBotMenuMobile
          @rename="onClickRename"
          @delete="onClickDelete"
          @toggleCanvas="emit('toggleCanvas')"
          @entitiesDetails="onClickEntitiesDetails"
          @support="onClickSupport"
      />
    </div>
    <EntitiesDetailsDialog v-model="entitiesDetailsDialogVisible"/>
    <DrawerSidebar v-model="drawerSidebarVisible"/>
  </div>
</template>

<script setup lang="ts">
import {inject, ref} from "vue";
import MenuIcon from "@/assets/images/icons/menu.svg";
import MarkdownIcon from "@/assets/images/icons/markdown.svg";
import EntitiesDetailsDialog from "@/components/EntitiesDetailsDialog/EntitiesDetailsDialog.vue";
import AuthState from "@/components/AuthState/AuthState.vue";
import {ElMessageBox} from "element-plus";
import useAssistantStore from "@/stores/assistant";
import {useRoute} from "vue-router";
import router from "@/router";
import eventBus from "@/plugins/eventBus";
import {DELETE_CHAT_START, RENAME_CHAT, SHOW_MARKDOWN_DRAWER} from "@/helpers/HelperConstants";
import DrawerSidebar from "@/components/DrawerSidebar/DrawerSidebar.vue";
import ChatBotMenuMobile from "@/components/ChatBot/ChatBotMenuMobile.vue";
import ChatBotMenuDesktop from "@/components/ChatBot/ChatBotMenuDesktop.vue";

const emit = defineEmits(['toggleCanvas']);
const isLoadingDelete = ref(false);

const assistantStore = useAssistantStore();
const route = useRoute();

const entitiesDetailsDialogVisible = ref(false);
const drawerSidebarVisible = ref(false);
const canvasVisible = inject('canvasVisible');

function onClickEntitiesDetails() {
  entitiesDetailsDialogVisible.value = true;
}

function onClickDrawerSideBar() {
  drawerSidebarVisible.value = true;
}

function onClickMarkdownSideBar() {
  eventBus.$emit(SHOW_MARKDOWN_DRAWER);
}

function onClickRename() {
  eventBus.$emit(RENAME_CHAT)
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

function onClickSupport() {
  const url = "https://discord.com/invite/95rdAyBZr2";
  window.open(url, '_blank').focus();
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
