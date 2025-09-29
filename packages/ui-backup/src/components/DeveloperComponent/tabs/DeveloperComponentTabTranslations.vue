<template>
  <div class="developer-component-tab-translations">
    <el-button @click="onClickRefreshTranslation">Refresh Translation</el-button>
  </div>
</template>

<script setup lang="ts">
import useTranslationsStore from "@/stores/translations";

const translationsStore = useTranslationsStore();

async function onClickRefreshTranslation() {
  await translationsStore.postLabelsConfigRefresh();
  window.location.reload();
}
</script>

<style lang="scss">
.developer-component-tab-translations {

}
</style>
