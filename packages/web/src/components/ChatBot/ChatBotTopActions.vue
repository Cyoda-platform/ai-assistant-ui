<template>
  <div class="chat-bot-top-actions">
    <slot name="chat-name"></slot>
    <div>
      &nbsp;<slot name="actions"></slot>
    </div>
    <div class="chat-bot-top-actions__right-part">
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
    <EntitiesDetailsDialog v-model="entitiesDetailsDialogVisible"/>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue";
import EntitiesDataIcon from "@/assets/images/icons/entities-data.svg";
import TrashSmallIcon from "@/assets/images/icons/trash-small.svg";
import EntitiesDetailsDialog from "@/components/EntitiesDetailsDialog/EntitiesDetailsDialog.vue";
import AuthState from "@/components/AuthState/AuthState.vue";
import Support from "@/components/Support/Support.vue";
import {ElMessageBox} from "element-plus";
import useAssistantStore from "@/stores/assistant";
import {useRoute} from "vue-router";
import router from "@/router";
import eventBus from "@/plugins/eventBus";
import {DELETE_CHAT_START} from "@/helpers/HelperConstants";

const emit = defineEmits(['toggleCanvas']);
const isLoadingDelete = ref(false);

const assistantStore = useAssistantStore();
const route = useRoute();

const entitiesDetailsDialogVisible = ref(false);

function onClickEntitiesDetails() {
  entitiesDetailsDialogVisible.value = true;
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
