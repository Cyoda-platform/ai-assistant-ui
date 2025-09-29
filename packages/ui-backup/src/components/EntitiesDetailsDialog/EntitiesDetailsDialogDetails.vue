<template>
  <div class="entities-details-dialog-details">
    <el-descriptions
      :column="1"
      :size="size"
      border
    >
      <el-descriptions-item label-width="300px">
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
const props = defineProps<{
  workflow: any[],
}>();

</script>

<style scoped lang="scss">
.entities-details-dialog-details {

}
</style>
