<template>
  <div class="chat-bot-desktop-menu">
    <el-tooltip
        class="box-item"
        effect="dark"
        :content="toggleCanvasTitle"
        :show-after="1000"
        placement="top"
    >
      <el-button @click="emit('toggleCanvas')" class="btn btn-default btn-icon btn-toggle-canvas">
        <ToggleCanvasIcon/>
      </el-button>
    </el-tooltip>
    <el-tooltip
        class="box-item"
        effect="dark"
        content="Entities Data"
        :show-after="1000"
        placement="top"
    >
      <el-button @click="emit('entitiesDetails')" class="btn btn-default btn-icon btn-toggle-canvas">
        <EntitiesDataIcon/>
      </el-button>
    </el-tooltip>
    <el-tooltip
        class="box-item"
        effect="dark"
        content="Contact Support"
        :show-after="1000"
        placement="top"
    >
      <el-button @click="emit('support')" class="btn btn-default btn-icon">
        <SupportIcon class="fill-stroke"/>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import EntitiesDataIcon from "@/assets/images/icons/entities-data.svg";
import TrashSmallIcon from "@/assets/images/icons/trash-small.svg";
import SupportIcon from '@/assets/images/icons/support.svg';
import EditIcon from '@/assets/images/icons/edit.svg';
import ToggleCanvasIcon from "@/assets/images/icons/toggle-canvas.svg";
import {computed, inject, provide} from "vue";

defineProps<{
  isLoadingDelete: boolean,
}>();

const emit = defineEmits(['toggleCanvas', 'entitiesDetails', 'support']);

const canvasVisible = inject('canvasVisible');
const chatData = inject('chatData');

const chatName = computed(() => {
  return chatData.value?.chat_body?.name || '';
})

const toggleCanvasTitle = computed(() => {
  return canvasVisible.value ? 'Close Canvas' : 'Open Canvas';
})
</script>

<style lang="scss" scoped>
.chat-bot-desktop-menu {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>