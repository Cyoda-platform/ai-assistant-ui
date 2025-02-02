<template>
  <div class="chat-bot-top-actions">
    <div>
      <el-button @click="emit('toggleCanvas')" class="btn btn-default btn-icon">
        <slot name="toggle-canvas-icon"></slot>
      </el-button>
    </div>
    <div>
      <el-tooltip
        class="box-item"
        effect="dark"
        content="Push"
        placement="top"
      >
        <el-button @click="emit('push')" class="btn btn-default btn-icon">
          <PushIcon class="icon"/>
        </el-button>
      </el-tooltip>
      <el-tooltip
        class="box-item"
        effect="dark"
        content="Approve"
        placement="top"
      >
        <el-button @click="emit('approve')" class="btn btn-default btn-icon">
          <ApproveIcon class="icon"/>
        </el-button>
      </el-tooltip>
      <el-tooltip
        class="box-item"
        effect="dark"
        content="Rollback"
        placement="top"
      >
        <el-button @click="emit('rollback')" class="btn btn-default btn-icon">
          <RollbackIcon class="icon"/>
        </el-button>
      </el-tooltip>
      <el-button class="btn btn-default btn-icon">
        <BellIcon style="height: 2rem; color: #000000" class="bell-icon"
                  :class="{'bell-icon--active': isEnvelopeActive}"/>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import PushIcon from "@/assets/images/icons/push.svg";
import ApproveIcon from "@/assets/images/icons/approve.svg";
import RollbackIcon from "@/assets/images/icons/rollback.svg";
import BellIcon from "@/assets/images/icons/bell.svg";
import {ref} from "vue";

const isEnvelopeActive = ref(false);

const emit = defineEmits(['toggleCanvas', 'push', 'approve', 'rollback']);
</script>

<style lang="scss" scoped>
.chat-bot-top-actions {
  height: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 15px 0;
}
</style>
