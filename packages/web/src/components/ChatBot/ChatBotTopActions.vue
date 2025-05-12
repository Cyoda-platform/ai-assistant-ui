<template>
  <div class="chat-bot-top-actions">
    <slot name="chat-name"></slot>
    <div>
      &nbsp;<slot name="actions"></slot>
    </div>
    <div>
      <el-button @click="onClickEntitiesDetails" class="btn btn-default btn-icon btn-toggle-canvas">
        <CheckboxListDetailIcon/>
      </el-button>
      <slot name="secondary-actions"></slot>
      <LoginButton v-if="!isLoggedIn"/>
    </div>
    <EntitiesDetailsDialog v-model="entitiesDetailsDialogVisible"/>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import useAuthStore from "@/stores/auth";
import LoginButton from "@/components/LoginButton/LoginButton.vue";
import CheckboxListDetailIcon from "@/assets/images/icons/checkbox-list-detail.svg";
import EntitiesDetailsDialog from "@/components/EntitiesDetailsDialog/EntitiesDetailsDialog.vue";

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
}
</style>
