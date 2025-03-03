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
    </div>
  </div>
</template>

<script setup lang="ts">

const emit = defineEmits(['toggleCanvas']);
</script>

<style lang="scss" scoped>
.chat-bot-top-actions {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 15px 0;
}

.btn-toggle-canvas{
  position: absolute;
  top: 15px;
  right: 30px;
}
</style>
