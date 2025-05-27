<template>
  <div class="chat-bot-top-actions">
    <slot name="chat-name"></slot>
    <div>
      &nbsp;<slot name="actions"></slot>
    </div>
    <div class="chat-bot-top-actions__right-part">
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
import {computed, ref} from "vue";
import useAuthStore from "@/stores/auth";
import EntitiesDataIcon from "@/assets/images/icons/entities-data.svg";
import EntitiesDetailsDialog from "@/components/EntitiesDetailsDialog/EntitiesDetailsDialog.vue";
import AuthState from "@/components/AuthState/AuthState.vue";
import Support from "@/components/Support/Support.vue";

const emit = defineEmits(['toggleCanvas']);

const authStore = useAuthStore();
const isLoggedIn = computed(() => {
  return authStore.isLoggedIn;
})

const entitiesDetailsDialogVisible = ref(false);

function onClickEntitiesDetails() {
  entitiesDetailsDialogVisible.value = true;
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
