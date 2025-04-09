<template>
  <div class="chat-bot-top-actions">
    <slot name="chat-name"></slot>
    <div>
      &nbsp;<slot name="actions"></slot>
    </div>
    <div>
      <el-button @click="emit('toggleCanvas')" class="btn btn-default btn-icon btn-toggle-canvas">
        <slot name="toggle-canvas-icon"></slot>
      </el-button>
      <LoginButton v-if="!isLoggedIn"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import useAuthStore from "@/stores/auth";
import LoginButton from "@/components/LoginButton/LoginButton.vue";

const emit = defineEmits(['toggleCanvas']);

const authStore = useAuthStore();
const isLoggedIn = computed(() => {
  return authStore.isLoggedIn;
})
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
