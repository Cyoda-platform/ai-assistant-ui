<template>
  <div class="chat-bot-mobile-menu">
    <el-dropdown popperClass="chat-bot-mobile-menu__dropdown" @command="handleCommand">
      <VerticalDotsIcon class="chat-bot-mobile-menu__icon"/>
      <template #dropdown>
        <el-dropdown-menu>
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
import SupportIcon from '@/assets/images/icons/support.svg';
import ToggleCanvasIcon from "@/assets/images/icons/toggle-canvas.svg";
import {computed, inject} from "vue";

const emit = defineEmits(['toggleCanvas', 'entitiesDetails', 'support']);
const chatData = inject('chatData');

const chatName = computed(() => {
  return chatData.value?.chat_body?.name || '';
})

const handleCommand = (command: string | number | object) => {
  emit(command);
}

const canvasVisible = inject('canvasVisible');

const toggleCanvasTitle = computed(() => {
  return canvasVisible.value ? 'Close Canvas' : 'Open Canvas';
})
</script>

<style lang="scss">
.chat-bot-mobile-menu {
  &__icon {
    cursor: pointer;
  }

  &__dropdown {

    .el-dropdown-menu__item {
      svg {
        margin-right: 12px;
      }
    }
  }
}
</style>