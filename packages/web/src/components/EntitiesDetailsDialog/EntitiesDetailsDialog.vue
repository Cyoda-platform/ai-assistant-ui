<template>
  <el-dialog
    v-model="dialogVisible"
    title="Entities Data"
    width="70%"
    :close-on-click-modal="false"
  >
    <el-tabs>
      <el-tab-pane v-for="workflow in workflows" :label="workflow.workflow_name">
      <EntitiesDetailsDialogDetails :workflow="workflow"/>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">Close</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {inject, computed} from "vue";
import EntitiesDetailsDialogDetails from "@/components/EntitiesDetailsDialog/EntitiesDetailsDialogDetails.vue";

const dialogVisible = defineModel();
const entitiesData = inject('entitiesData');

const workflows = computed(() => {
  return Object.keys(entitiesData.value).map(id => {
    return {
      id,
      ...entitiesData.value[id]
    }
  })
})

</script>

<style scoped lang="scss">

</style>
