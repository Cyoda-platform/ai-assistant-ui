<template>
  <el-dialog
      v-model="dialogVisible"
      width="70%"
      :close-on-click-modal="false"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="my-header">
        <h4 :id="titleId" :class="titleClass">
          Entities Data
          <el-button
              @click="onClickRollbackChat"
              :loading="isLoadingRollback"
              size="small"
              class="btn btn-primary"
          >
            Rollback
            <RollbackQuestionIcon class="icon"/>
          </el-button>
        </h4>
      </div>
    </template>
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
import {inject, computed, ref} from "vue";
import EntitiesDetailsDialogDetails from "@/components/EntitiesDetailsDialog/EntitiesDetailsDialogDetails.vue";
import RollbackQuestionIcon from "@/assets/images/icons/rollback-question.svg";
import eventBus from "@/plugins/eventBus";
import {ROLLBACK_CHAT} from "@/helpers/HelperConstants";

const dialogVisible = defineModel();
const chatData = inject('chatData');
const isLoadingRollback = inject('isLoadingRollback');

function onClickRollbackChat() {
  eventBus.$emit(ROLLBACK_CHAT);
}

const entitiesData = computed(() => {
  return chatData.value?.chat_body?.entities_data || {};
})

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
.icon{
  margin-left: 5px;
  position: relative;
  top: 2px;
}
</style>
