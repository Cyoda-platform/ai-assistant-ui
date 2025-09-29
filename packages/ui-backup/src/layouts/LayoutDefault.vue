<template>
  <el-row class="layout-default">
    <el-col :span="24" class="layout-default__main">
      <slot/>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
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
    border-right: 2px solid var(--accent-border);
  }

  &__main {
    min-height: 100vh;
    height: auto;
    padding: 0 30px;
  }
}
</style>
