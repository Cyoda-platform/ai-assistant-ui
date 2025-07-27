<template>
  <div class="editor-view-mode">
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

const mode = defineModel();

const isShowEditorPreview = computed(() => {
  return !helperBreakpoints.smaller('md').value;
})

watch(isShowEditorPreview, () => {
  mode.value = 'editor';
})
</script>

<style scoped lang="scss">
.editor-view-mode {
  text-align: right;
  padding: 0 32px 16px;
}
</style>