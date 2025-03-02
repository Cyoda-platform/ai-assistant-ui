<template>
  <component :is="layout">
    <RouterView/>
  </component>
</template>

<script setup lang="ts">
import {useRoute, RouterView} from "vue-router";
import {computed, watch} from "vue";
import useAppStore from "@/stores/app";

const defaultLayout = "default";

const route = useRoute();
const appStore = useAppStore();
const layout = computed(() => {
  return `layout-${route.meta.layout || defaultLayout}`;
});

const theme = computed(() => {
  return appStore.theme;
})

watch(theme, (value, oldValue) => {
  if (oldValue) {
    document.body.classList.remove(`theme-${oldValue}`);
  }
  document.body.classList.add(`theme-${value}`);
}, { immediate: true });

</script>
