<template>
  <component :is="icon"></component>
</template>

<script setup lang="ts">
import HomeIcon from '@/assets/images/icons/home.svg';
import HistoryIcon from '@/assets/images/icons/history.svg';
import {computed} from "vue";

const props = defineProps<{
  icon?: string
}>()

const icon = computed(() => {
  switch (props.icon) {
    case 'home':
      return HomeIcon
    case 'history':
      return HistoryIcon
  }
})
</script>
