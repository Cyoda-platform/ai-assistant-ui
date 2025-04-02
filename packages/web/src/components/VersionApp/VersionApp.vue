<template>
  <div
    class="version-app"
    :class="{'small': small}"
  >
    {{ versionApp }}
  </div>
</template>

<script setup lang="ts">
import {APP_VERSION} from "@/helpers/HelperConstants";

const props = withDefaults(defineProps<{
  small: boolean,
}>(), {
  small: false,
});

const versionApp = APP_VERSION;
</script>

<style scoped lang="scss">
.version-app {
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--input-border-color);
  background-color: var(--version-app-background);
  color: var(--text-color-regular);
  padding: 9px;
  border-radius: 16px;

  &.small {
    padding: 7px;
  }
}
</style>
