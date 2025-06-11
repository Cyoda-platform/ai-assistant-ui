<template>
  <el-dialog
      class="settings-dialog"
      v-model="dialogVisible"
      title="Settings"
      :width="widthComputed"
      :close-on-click-modal="false"
  >
    <div class="settings-dialog__row">
      <div class="settings-dialog__category">
        <SettingsIcon/>
        <span>
          General
        </span>
      </div>
      <div class="settings-dialog__name">
        Theme
      </div>
      <div class="settings-dialog__content">
        <el-dropdown trigger="click" @command="handleCommand">
    <span class="el-dropdown-link">
      {{ selectedTheme }}<ArrowDownSmallIcon/>
    </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="system">System</el-dropdown-item>
              <el-dropdown-item command="light">Light Mode</el-dropdown-item>
              <el-dropdown-item command="dark">Dark Mode</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import SettingsIcon from '@/assets/images/icons/settings.svg';
import ArrowDownSmallIcon from '@/assets/images/icons/arrow-down-small.svg';
import useAppStore from "@/stores/app";
import helperBreakpoints from "@/helpers/HelperBreakpoints";

const dialogVisible = ref(false);
const appStore = useAppStore();

function openDialog() {
  dialogVisible.value = true;
}

function handleCommand(theme: string) {
  appStore.setTheme(theme);
}

const selectedTheme = computed(() => {
  switch (appStore.theme) {
    case "system":
      return "System";
    case "light":
      return "Light Mode";
    case "dark":
      return "Dark Mode";
  }
})

const widthComputed = computed(() => {
  if (helperBreakpoints.smaller('md').value) {
    return '90%';
  }
  return '620px';
})

defineExpose({
  openDialog,
})
</script>

<style lang="scss">
.settings-dialog {
  min-height: 148px;
  padding: 24px !important;

  .el-dialog__header {
    padding-bottom: 40px;
  }

  &__row {
    display: flex;
    align-items: center;
  }

  &__category {
    display: flex;
    align-items: center;
    color: var(--color-primary);
    font-size: 16px;
    font-weight: 500;
    min-width: 100px;
    max-width: 150px;
    flex: 1;
    margin-right: 19px;
    height: 32px;
    border-right: 1px solid var(--input-border-color);

    svg {
      margin-right: 16px;
      fill: var(--color-primary);
    }
  }

  &__name {
    color: var(--color-settings-text);
    font-size: 16px;
    font-weight: 500;
    min-width: 80px;
    max-width: 100px;
  }

  &__content {
    margin-left: auto;

    .el-dropdown-link {
      font-size: 16px;
      font-weight: 400;
      white-space: nowrap;
      color: var(--color-settings-text);

      svg {
        fill: var(--color-settings-text);
        margin-left: 8px;
      }
    }
  }
}
</style>
