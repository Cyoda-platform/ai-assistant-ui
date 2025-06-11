<template>
  <el-drawer
      class="drawer-sidebar"
      v-model="drawerVisible"
      direction="ltr"
      size="80%"
      :withHeader="false"
  >
    <SideBar mode="drawer" @drawer="drawerVisible=false"/>
  </el-drawer>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from "vue";
import SideBar from "@/components/SideBar/SideBar.vue";
import {templateRef} from "@vueuse/core";

const drawerVisible = ref(false);

defineExpose({drawerVisible});
</script>

<style lang="scss">
.drawer-sidebar {
  background-color: var(--bg-sidebar);
  .el-drawer__body {
    padding: 0 !important;
  }
}
</style>