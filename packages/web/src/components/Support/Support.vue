<template>
  <el-tooltip
      class="box-item"
      effect="dark"
      content="Contact Support"
      :show-after="1000"
      placement="top"
  >
    <div v-bind="$attrs" class="support">
      <el-button @click="onClick" class="btn btn-default btn-icon" :class="{large: size === 'large'}">
        <SupportIcon class="fill-stroke"/>
      </el-button>
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import SupportIcon from '@/assets/images/icons/support.svg';

defineProps<{
  size: string,
}>();

function onClick() {
  const url = "https://discord.com/invite/95rdAyBZr2";
  window.open(url, '_blank').focus();
}
</script>

<style scoped lang="scss">
.support {
  svg ::v-deep(path) {
    stroke: var(--text-color-regular);
  }
}
</style>
