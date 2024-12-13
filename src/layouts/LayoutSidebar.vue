<template>
  <el-row class="layout-sidebar">
    <el-col :span="6" class="layout-sidebar__sidebar">
      <SideBar/>
    </el-col>
    <el-col :span="18" class="layout-sidebar__main">
      <slot/>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import SideBar from "@/components/SideBar/SideBar.vue";
</script>

<style scoped lang="scss">
.layout-sidebar {
  &__sidebar {
    min-height: 100vh;
    height: auto;
    background: #fff;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    border-right: 2px solid rgba(20, 135, 81, 0.5);
  }

  &__main {
    min-height: 100vh;
    height: auto;
    padding: 0 30px;
  }
}
</style>
