<template>
  <el-row class="layout-sidebar">
    <el-col :span="sidebarSpan" class="layout-sidebar__sidebar">
      <SideBar/>
    </el-col>
    <el-col :span="mainSpan" class="layout-sidebar__main">
      <slot/>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import SideBar from "@/components/SideBar/SideBar.vue";
import {computed} from "vue";
import useAppStore from "@/stores/app.ts";

const appStore = useAppStore();

const sidebarSpan = computed(() => {
  return appStore.isSidebarHidden ? 2 : 5;
});

const mainSpan = computed(() => {
  return appStore.isSidebarHidden ? 22 : 19;
});
</script>

<style scoped lang="scss">
.layout-sidebar {
  &__sidebar {
    min-height: 100vh;
    height: auto;
    border-right: 1px solid var(--accent-border);
    background: var(--bg-sidebar);
    overflow: hidden;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  &__main {
    min-height: 100vh;
    height: auto;
    padding: 0 30px;
    background-color: var(--bg);
  }
}
</style>
