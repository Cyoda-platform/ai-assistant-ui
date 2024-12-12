<template>
  <component :is="layout">
    <RouterView/>
  </component>
</template>

<script setup lang="ts">
import {useRoute, RouterView} from "vue-router";
import {computed} from "vue";

const defaultLayout = "default";

const route = useRoute();
const layout = computed(() => {
  return `layout-${route.meta.layout || defaultLayout}`;
});
</script>
