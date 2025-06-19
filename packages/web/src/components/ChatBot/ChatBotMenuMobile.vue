<template>
  <div class="chat-bot-mobile-menu">
    <el-dropdown popperClass="chat-bot-mobile-menu__dropdown" @command="handleCommand">
      <VerticalDotsIcon/>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item :disabled="!chatName" command="rename">
            <EditIcon/>
            Rename Chat
          </el-dropdown-item>
          <el-dropdown-item command="delete">
            <TrashSmallIcon/>
            Delete Chat
          </el-dropdown-item>
          <el-dropdown-item command="toggleCanvas">
            <ToggleCanvasIcon/>
            {{ toggleCanvasTitle }}
          </el-dropdown-item>
          <el-dropdown-item command="entitiesDetails">
            <EntitiesDataIcon class="icon"/>
            Entities Data
          </el-dropdown-item>
          <el-dropdown-item command="support">
            <SupportIcon/>
            Contact Support
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import VerticalDotsIcon from "@/assets/images/icons/vertical-dots.svg";
import EntitiesDataIcon from "@/assets/images/icons/entities-data.svg";
import TrashSmallIcon from "@/assets/images/icons/trash-small.svg";
import SupportIcon from '@/assets/images/icons/support.svg';
import ToggleCanvasIcon from "@/assets/images/icons/toggle-canvas.svg";
import EditIcon from '@/assets/images/icons/edit.svg';
import {computed, inject} from "vue";

const emit = defineEmits(['delete', 'toggleCanvas', 'entitiesDetails', 'support', 'rename']);
const chatName = inject('chatName');

const handleCommand = (command: string | number | object) => {
  emit(command);
}

const canvasVisible = inject('canvasVisible');

const toggleCanvasTitle = computed(() => {
  return canvasVisible.value ? 'Close Canvas' : 'Open Canvas';
})
</script>

<style lang="scss">
.chat-bot-mobile-menu__dropdown {
  .el-dropdown-menu__item {
    svg {
      margin-right: 12px;
    }
  }
}
</style>