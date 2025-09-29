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
    
    <div class="settings-dialog__row">
      <div class="settings-dialog__category">
      </div>
      <div class="settings-dialog__name">
        Workflow Layout
      </div>
      <div class="settings-dialog__content">
        <el-dropdown trigger="click" @command="handleWorkflowLayoutCommand">
    <span class="el-dropdown-link">
      {{ selectedWorkflowLayout }}<ArrowDownSmallIcon/>
    </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="vertical">Vertical</el-dropdown-item>
              <el-dropdown-item command="horizontal">Horizontal</el-dropdown-item>
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

function handleWorkflowLayoutCommand(layout: 'horizontal' | 'vertical') {
  appStore.setWorkflowLayout(layout);
}

const selectedTheme = computed(() => {
  switch (appStore.theme) {
    case "system":
      return "System";
    case "light":
      return "Light Mode";
    case "dark":
      return "Dark Mode";
    default:
      return "System";
  }
})

const selectedWorkflowLayout = computed(() => {
  switch (appStore.workflowLayout) {
    case "horizontal":
      return "Horizontal";
    case "vertical":
      return "Vertical";
    default:
      return "Vertical";
  }
})

const widthComputed = computed(() => {
  if (helperBreakpoints.smaller('md').value) {
    return '95%';
  }
  if (helperBreakpoints.smaller('lg').value) {
    return '80%';
  }
  return '620px';
})

defineExpose({
  openDialog,
})
</script>

<style lang="scss" scoped>
@use '@/assets/css/particular/breakpoints';

  .settings-dialog {
  min-height: 148px;
  padding: 24px !important;

  @include breakpoints.respond-max(sm) {
    padding: 16px !important;
  }

  @include breakpoints.respond-max(xs) {
    padding: 12px !important;
  }

  .el-dialog__header {
    padding-bottom: 40px;

    @include breakpoints.respond-max(sm) {
      padding-bottom: 24px;
    }

    .el-dialog__title {
      @include breakpoints.respond-max(sm) {
        font-size: 18px;
      }
    }
  }

  &__row {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    @include breakpoints.respond-max(sm) {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 24px;
    }
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

    @include breakpoints.respond-max(sm) {
      min-width: unset;
      max-width: unset;
      width: 100%;
      margin-right: 0;
      border-right: none;
      border-bottom: 1px solid var(--input-border-color);
      padding-bottom: 8px;
    }

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
    max-width: 150px;

    @include breakpoints.respond-max(sm) {
      min-width: unset;
      max-width: unset;
      width: 100%;
      font-size: 14px;
    }
  }

  &__content {
    margin-left: auto;

    @include breakpoints.respond-max(sm) {
      margin-left: 0;
      width: 100%;
    }

    .el-dropdown-link {
      font-size: 16px;
      font-weight: 400;
      white-space: nowrap;
      color: var(--color-settings-text);

      @include breakpoints.respond-max(sm) {
        font-size: 14px;
        white-space: normal;
        width: 100%;
        min-height: 40px;
      }

      @include breakpoints.respond-max(xs) {
        padding: 6px 10px;
        font-size: 13px;
      }

      svg {
        fill: var(--color-settings-text);
        margin-left: 8px;
        flex-shrink: 0;
      }
    }

    .el-dropdown-menu {
      @include breakpoints.respond-max(sm) {
        min-width: 200px;
      }

      .el-dropdown-menu__item {
        @include breakpoints.respond-max(sm) {
          font-size: 14px;
          padding: 12px 16px;
        }

        @include breakpoints.respond-max(xs) {
          font-size: 13px;
          padding: 10px 14px;
        }
      }
    }
  }
}
</style>
