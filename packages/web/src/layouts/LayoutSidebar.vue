<template>
  <div class="layout-sidebar">
    <div class="layout-sidebar__sidebar" :class="{'hidden':isSidebarHidden}">
      <SideBar/>
    </div>
    <div class="layout-sidebar__main">
      <slot/>
    </div>
  </div>
</template>

<script setup lang="ts">
import SideBar from "@/components/SideBar/SideBar.vue";
import {computed, onMounted} from "vue";
import useAppStore from "@/stores/app";
import useAssistantStore from "@/stores/assistant";

const appStore = useAppStore();
const assistantStore = useAssistantStore();

onMounted(()=>{
  loadChats();
})

async function loadChats() {
  await assistantStore.getChats();
}

const isSidebarHidden = computed(() => appStore.isSidebarHidden);
</script>

<style scoped lang="scss">
.layout-sidebar {
  display: flex;
  &__sidebar {
    min-height: 100vh;
    height: auto;
    border-right: 1px solid var(--sidebar-border);
    background-color: var(--bg-sidebar);
    overflow: hidden;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 296px;

    &.hidden {
      width: 64px;
    }
  }

  &__main {
    flex: 1;
    min-height: 100vh;
    height: auto;
    background-color: var(--bg);
  }
}

.body-dashboard-view .layout-sidebar__main {
  background-color: var(--bg-new-chat);
}
</style>
