<template>
  <el-dialog
      modal-class="confirmation-dialog"
      v-model="dialogVisible"
      title="Consent Dialog"
      width="500"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
  >
    <div class="confirmation-dialog__text">
      <el-checkbox v-model="checkbox">
        By using this service, you confirm that you have read and agree to our
        <a target="_blank" href="https://www.cyoda.com/terms-of-service">Terms & Conditions</a> and <a target="_blank"
                                                                                                       href="https://www.cyoda.com/privacy-policy">Privacy
        Policy</a>.
      </el-checkbox>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onClickClose" :disabled="!checkbox" class="btn btn-primary" type="primary">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {ref} from "vue";
import useAppStore from "@/stores/app";

const appStore = useAppStore();
const dialogVisible = ref(appStore.consentDialog);
const checkbox = ref(false);

function onClickClose() {
  dialogVisible.value = false;
  appStore.setConsentDialog(false);
}
</script>

<style lang="scss">
.confirmation-dialog {
  .el-checkbox__label {
    white-space: wrap;
    line-height: 1.2;
    color: var(--text-color-regular) !important;
  }
}
</style>