<template>
  <div class="entities-details-dialog-details">
    <el-descriptions
      :column="1"
      :label-style="labelStyle"
      border
    >
      <el-descriptions-item>
        <template #label>
          ID
        </template>
        {{ workflow.id }}
      </el-descriptions-item>
      <el-descriptions-item v-if="workflow.next_transitions.length > 0">
        <template #label>
          Next Transitions
        </template>
        {{ workflow.next_transitions.join(', ') }}
      </el-descriptions-item>
    </el-descriptions>

    <div v-if="workflow.entity_versions.length>0" class="entities-details-dialog-details__entity-versions">
      <h3>Entity Versions</h3>
      <el-table max-height="400" :data="workflow.entity_versions" style="width: 100%">
        <el-table-column type="index" width="50"/>
        <el-table-column prop="date" label="Date" width="250"/>
        <el-table-column prop="state" label="Name"/>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import {useWindowSize} from "@vueuse/core";

interface WorkflowType {
  id: string;
  next_transitions: string[];
  entity_versions: Array<{date: string; state: string}>;
  workflow_name: string;
}

const {workflow} = defineProps<{
  workflow: WorkflowType,
}>();

const {width} = useWindowSize();

const labelStyle = computed(() => {
  return {
    width: width.value <= 768 ? '100px' : '300px'
  };
});

</script>

<style scoped lang="scss">
@use '@/assets/css/particular/breakpoints';

.entities-details-dialog-details {
  &__entity-versions {
    margin-top: 20px;

    h3 {
      margin-bottom: 12px;
    }

    @include breakpoints.respond-max('sm') {
      overflow-x: auto;
      
      :deep(.el-table) {
        min-width: 500px;
        font-size: 12px;

        .el-table__cell {
          padding: 8px 4px;
        }
      }
    }
  }
}
</style>
