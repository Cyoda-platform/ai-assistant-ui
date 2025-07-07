<template>
  <div ref="rootRef" class="editor" :class="{
    'editor-disable': !editable
  }" style="height: 400px; width: 100%;"></div>
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted, onBeforeUnmount, nextTick} from "vue";
import * as monaco from 'monaco-editor';

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    return new editorWorker()
  }
}

const emit = defineEmits(["update:modelValue", "ready"]);
const rootRef = ref(null);
const props = withDefaults(defineProps<{
  modelValue?: string
  language?: string
  editable?: boolean
  actions?: any[]
}>(), {
  modelValue: '',
  language: 'text/plain',
  editable: true,
  actions: () => ([])
});

let editor: any = null;

onMounted(() => {
  editor = monaco.editor.create(rootRef.value, {
    value: props.modelValue,
    language: props.language,
    automaticLayout: true,
    readOnly: !props.editable,
    renderLineHighlight: "none",
    overviewRulerBorder: false,
    minimap: {enabled: false},
    padding: {
      top: 10
    },
    wordWrap: 'on',
    wrappingStrategy: 'advanced',
  });

  editor.getModel().onDidChangeContent((e) => {
    updateListenerExtension(editor);
  })

  if (props.actions.length > 0) {
    props.actions.forEach((el) => editor.addAction(el));
  }

  nextTick(() => {
    emit('ready');
  })
  return;

});

function updateListenerExtension(editor) {
  let value = editor.getValue();
  emit("update:modelValue", value);
}

watch(
  () => props.modelValue,
  (modelValue) => {
    let newValue = modelValue;
    if (editor) {
      const editorValue = editor.getValue();
      if (newValue !== editorValue) {
        editor.setValue(newValue);
      }
    }
  },
  {immediate: true}
);

watch(() => props.language, () => {
  if (!editor) return;
  monaco.editor.setModelLanguage(editor.getModel(), props.language)
})

defineExpose({editor});
</script>

<style lang="scss">
.editor {
  outline: none;
  overflow: hidden;

  .lines-content.monaco-editor-background {
    padding-left: 5px !important;
  }

  &.editor-disable .monaco-editor-background, &.editor-disable .minimap {
    background-color: #F5F7FA !important;
  }

  .scroll-decoration {
    display: none;
  }
}
</style>
