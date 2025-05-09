<template>
  <div class="developer-component-icon">
    <div class="developer-component-icon__button-wrapper">
      <el-button @click="onClick" class="developer-component-icon__button">
        <DeveloperIcon/>
      </el-button>
    </div>
    <DeveloperComponentDrawer v-model="drawer"/>
  </div>
</template>

<script setup lang="ts">
import DeveloperIcon from "@/assets/images/icons/developer.svg";
import {ref} from "vue";
import DeveloperComponentDrawer from "@/components/DeveloperComponent/DeveloperComponentDrawer.vue";

const drawer = ref(false);

function onClick() {
  drawer.value = !drawer.value;
}
</script>

<style lang="scss">
.developer-component-icon {
  &__button-wrapper {
    position: fixed;
    right: 20px;
    bottom: 20px;
  }

  &__button {
    padding: 10px 5px !important;
  }
}
</style>
