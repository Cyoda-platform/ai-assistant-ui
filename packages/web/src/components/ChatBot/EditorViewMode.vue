<template>
  <div class="editor-view-mode">
    <el-button @click="onClear" class="btn-clear" size="small">
      <TrashSmallIcon/>
      Clear
    </el-button>
    <el-radio-group v-model="mode" size="small">
      <el-radio-button label="Editor" value="editor"/>
      <el-radio-button v-if="isShowEditorPreview" label="Editor and Preview" value="editorPreview"/>
      <el-radio-button label="Preview" value="preview"/>
    </el-radio-group>
  </div>
</template>

<script setup lang="ts">
import {computed, watch} from "vue";
import helperBreakpoints from "@/helpers/HelperBreakpoints";
import TrashSmallIcon from "@/assets/images/icons/trash-small.svg"
import {ElMessageBox} from "element-plus";

const mode = defineModel();
const emit = defineEmits(['clear']);

const isShowEditorPreview = computed(() => {
  return !helperBreakpoints.smaller('md').value;
})

function onClear() {
  ElMessageBox.confirm("Are you sure you want to clear the data?", "Confirm!", {
    callback: async (action) => {
      if (action === "confirm") {
        emit("clear");
      }
    }
  });
}

watch(isShowEditorPreview, () => {
  mode.value = 'editor';
})
</script>

<style lang="scss">
.editor-view-mode {
  text-align: right;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px 16px;

  .btn-clear {
    svg {
      margin-right: 5px;
      width: 15px;
    }
  }
}
</style>