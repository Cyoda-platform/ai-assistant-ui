<template>
  <el-row class="chat-loader">
    <el-col :offset="1" :span="22">
      <div class="chat-loading">
        <div v-loading="true"></div>
      </div>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">

</script>

<style lang="scss">
.chat-loading {
  margin-top: 25px;
  height: 56px;

  .el-loading-spinner .path {
    stroke: var(--color-primary);
  }
}
</style>
