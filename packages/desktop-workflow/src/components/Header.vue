<template>
  <div class="header">
    <img alt="logo" class="header__logo" :src="LogoUrl"/>
    <VersionApp :small="true"/>
  </div>
</template>

<script setup lang="ts">
import LogoUrl from '@/assets/images/logo.svg?url'
import VersionApp from "@/components/VersionApp/VersionApp.vue";
</script>

<style scoped lang="scss">
.header {
  min-height: 40px;
  align-items: center;
  padding: 12px 32px 12px 15px;
  background-color: var(--bg-sidebar);
  box-sizing: content-box;
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: nowrap;
  display: flex;

  &__logo {
    width: 160px;
    height: auto;
  }
}
</style>