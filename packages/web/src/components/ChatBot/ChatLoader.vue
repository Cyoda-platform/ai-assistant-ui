<template>
  <el-row>
    <el-col :span="14">
      <div class="chat-loading">
        <div v-loading="true"></div>
      </div>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">

</script>

<style lang="scss">
@use "@/assets/css/particular/variables";

.chat-loading {
  margin-top: 25px;
  height: 56px;

  .el-loading-spinner .path {
    stroke: variables.$color-primary;
  }
}
</style>
