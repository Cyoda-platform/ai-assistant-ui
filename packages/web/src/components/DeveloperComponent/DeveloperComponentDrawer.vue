<template>
  <el-drawer
    v-model="drawer"
    size="300px"
    title="Developer Tools"
    direction="btt"
  >
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane label="Translations" name="translations">
        <DeveloperComponentTabTranslations />
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>

<script setup lang="ts">
import DeveloperIcon from "@/assets/images/icons/developer.svg";
import {ref} from "vue";
import DeveloperComponentTabTranslations from "./tabs/DeveloperComponentTabTranslations.vue";

const drawer = defineModel();

const activeName = ref('translations')
</script>

<style lang="scss">
.developer-component-icon {
  &__button-wrapper {
    position: fixed;
    right: 20px;
    bottom: 20px;
  }

  &__button {
    padding: 10px 5px;
  }
}
</style>
