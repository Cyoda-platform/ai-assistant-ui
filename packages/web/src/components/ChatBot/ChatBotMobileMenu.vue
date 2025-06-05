<template>
  <div class="chat-bot-mobile-menu">
    <el-button @click="onClickOpenMenu" class="btn btn-default btn-icon">
      <VerticalDotsIcon/>
    </el-button>

    <el-card v-if="showMenu" style="max-width: 480px">
      <ChatActions :isLoadingDelete="isLoadingDelete"/>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue";
import VerticalDotsIcon from "@/assets/images/icons/vertical-dots.svg";
import ChatActions from "@/components/ChatBot/ChatActions.vue";

const showMenu = ref(false);

defineProps<{
  isLoadingDelete: boolean,
}>();

function onClickOpenMenu() {
  showMenu.value = !showMenu.value;
}
</script>

<style lang="scss" scoped>
</style>