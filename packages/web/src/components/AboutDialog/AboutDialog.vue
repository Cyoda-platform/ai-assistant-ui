<template>
  <el-dialog
      class="about-dialog"
      v-model="dialogVisible"
      title="Cyoda AI Assistant"
      :width="widthComputed"
      :close-on-click-modal="false"
  >
    <div ref="bodyRef" class="about-dialog__body">
      <p>
        Some icons are still the property of Webalys LLC (<a href="https://streamlinehq.com" target="_blank">https://streamlinehq.com</a>)
        and can be used only in the context of the open-source project.
      </p>
      <p>Certain images used in this project are sourced from Freepik under their Premium License and are not covered by
        the project’s open-source license.</p>
      <p>
        By using this service, you confirm that you have read and agree to our<br/>
        <a target="_blank" href="https://www.cyoda.com/terms-of-service">
          Terms & Conditions
        </a>
        and
        <a target="_blank" href="https://www.cyoda.com/privacy-policy">
          Privacy Policy
        </a>
      </p>
      <p>Copyright © {{ year }} <a target="_blank" href="https://www.cyoda.com/">CYODA Ltd.</a></p>
    </div>
    <div class="about-dialog__actions">
      <el-button @click="dialogVisible=false" class="btn">Close</el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import {computed, ref, useTemplateRef} from "vue";
import HelperCopy from "@/helpers/HelperCopy";
import helperBreakpoints from "@/helpers/HelperBreakpoints";

const dialogVisible = ref(false);
const bodyRef = useTemplateRef('bodyRef');

const year = computed(() => {
  return new Date().getFullYear();
});

function openDialog() {
  dialogVisible.value = true;
}

function onCopyAndClose() {
  HelperCopy.copy(bodyRef.value.innerText);
  dialogVisible.value = false;
}

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
@use '@/assets/css/particular/breakpoints';

.about-dialog {
  &__body {
    font-size: 16px;

    p {
      margin: 27.5px 0;
    }
  }

  &__actions {
    display: flex;
    gap: 12px;
    @include breakpoints.respond-max('xs') {
      flex-direction: column;
    }

    button {
      flex: 1;
      margin: 0 !important;
    }
  }
}
</style>
