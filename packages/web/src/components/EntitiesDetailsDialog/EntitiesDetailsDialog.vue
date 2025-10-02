<template>
  <el-dialog
      v-model="dialogVisible"
      :width="dialogWidth"
      :close-on-click-modal="false"
      class="entities-details-dialog"
  >
    <template #header="{ titleId, titleClass }">
      <div class="my-header">
        <h4 :id="titleId" :class="titleClass">
          Entities Data
          <el-divider direction="vertical" />
          <el-button
              @click="onClickRollbackChat"
              :loading="isLoadingRollback"
              size="small"
              class="btn btn-primary"
          >
            Restart workflows
            <RollbackQuestionIcon class="icon"/>
          </el-button>
        </h4>
      </div>
    </template>
    <el-tabs>
      <el-tab-pane v-for="workflow in workflows" :key="workflow.id" :label="workflow.workflow_name">
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
import {useWindowSize} from "@vueuse/core";
import EntitiesDetailsDialogDetails from "@/components/EntitiesDetailsDialog/EntitiesDetailsDialogDetails.vue";
import RollbackQuestionIcon from "@/assets/images/icons/rollback-question.svg";
import eventBus from "@/plugins/eventBus";
import {ROLLBACK_CHAT} from "@/helpers/HelperConstants";
import {Ref} from "vue";

interface ChatDataType {
  chat_body?: {
    entities_data?: Record<string, {
      workflow_name: string;
      next_transitions: string[];
      entity_versions: Array<{date: string; state: string}>;
    }>;
  };
}

const dialogVisible = defineModel();
const {width} = useWindowSize();
const chatData = inject<Ref<ChatDataType>>('chatData');
const isLoadingRollback = inject('isLoadingRollback');

function onClickRollbackChat() {
  eventBus.$emit(ROLLBACK_CHAT);
}

const entitiesData = computed(() => {
  return chatData?.value?.chat_body?.entities_data || {};
})

const workflows = computed(() => {
  return Object.keys(entitiesData.value).map(id => {
    return {
      id,
      ...entitiesData.value[id]
    }
  })
})

const dialogWidth = computed(() => {
  return width.value <= 768 ? '95%' : '70%';
})

</script>

<style scoped lang="scss">
@use '@/assets/css/particular/breakpoints';

.icon{
  margin-left: 5px;
  position: relative;
  top: 2px;
}

.entities-details-dialog {
  :deep(.my-header) {
    h4 {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;

      @include breakpoints.respond-max('sm') {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .el-divider {
        @include breakpoints.respond-max('sm') {
          display: none;
        }
      }

      .el-button {
        @include breakpoints.respond-max('sm') {
          width: 100%;
        }
      }
    }
  }
}
</style>
