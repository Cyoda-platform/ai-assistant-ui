<template>
  <span>{{ label }}</span>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
const { t } = useI18n();

const counter = ref(0);
let timeIntervalId = null;

const label = computed(() => {
  return `${t('common.loading')} ${'.'.repeat(counter.value)}`
});

onMounted(init);

function init() {
  timeIntervalId = setInterval(() => {
    counter.value += 1;
    if (counter.value > 3) counter.value = 0;
  }, 1000);
}

onBeforeUnmount(() => {
  if (timeIntervalId) clearInterval(timeIntervalId);
})
</script>

<style scoped lang="scss">

</style>
