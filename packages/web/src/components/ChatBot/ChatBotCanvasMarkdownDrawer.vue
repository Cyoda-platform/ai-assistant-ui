<template>
  <el-drawer
      class="chat-bot-canvas-markdown-drawer"
      title="Markdown"
      v-model="drawerVisible"
      direction="ltr"
      size="80%"
  >
    <div class="chat-bot-canvas-markdown-drawer__markdown-inner" v-html="canvasDataWithMarkdown"></div>
  </el-drawer>
</template>

<script setup lang="ts">
import {ref} from "vue";

defineProps<{
  canvasDataWithMarkdown: string,
}>();

const drawerVisible = ref(false);

defineExpose({drawerVisible});
</script>

<style lang="scss">
.chat-bot-canvas-markdown-drawer {
  background-color: var(--bg-sidebar);
  &__markdown-inner p:first-child {
    margin-top: 8px;
  }

  &__markdown-inner {
    height: 100%;
    overflow-y: auto;
  }

  .el-drawer__header {
    margin-bottom: 0;
  }
}
</style>