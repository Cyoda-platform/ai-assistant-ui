<template>
  <div ref="rootRef" class="editor" :class="{
    'editor-disable': !editable
  }" style="height: 400px; width: 100%;"></div>
</template>

<script setup lang="ts">
import {ref, watch, onMounted, onBeforeUnmount, nextTick} from "vue";
import * as monaco from 'monaco-editor';

// Configure Monaco environment for Vite - without worker imports
if (typeof window !== 'undefined') {
  (window as any).MonacoEnvironment = {
    getWorkerUrl: function (moduleId: string, label: string) {
      return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
        self.MonacoEnvironment = {
          baseUrl: '/monaco-editor/esm/'
        };
        self.importScripts = function() {};
        self.require = function() {};
        self.define = function() {};
      `)}`;
    }
  };
}

type EditorAction = {
  id: string;
  label: string;
  run: () => void;
  keybindings?: number[];
};

const emit = defineEmits(["update:modelValue", "ready"]);
const rootRef = ref<HTMLElement | null>(null);
const props = withDefaults(defineProps<{
  modelValue?: string
  language?: string
  editable?: boolean
  actions?: EditorAction[]
}>(), {
  modelValue: '',
  language: 'text/plain',
  editable: true,
  actions: () => ([])
});

let editor: monaco.editor.IStandaloneCodeEditor | null = null;

onMounted(async () => {
  if (!rootRef.value) return;

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

  editor.getModel()?.onDidChangeContent(() => {
    updateListenerExtension(editor);
  })

  if (props.actions.length > 0) {
    props.actions.forEach((el) => editor?.addAction(el));
  }

  nextTick(() => {
    emit('ready');
  })
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
});

function updateListenerExtension(editor: monaco.editor.IStandaloneCodeEditor | null) {
  if (!editor) return;
  const value = editor.getValue();
  emit("update:modelValue", value);
}

watch(
  () => props.modelValue,
  (modelValue) => {
    const newValue = modelValue;
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
  const model = editor.getModel();
  if (model) {
    monaco.editor.setModelLanguage(model, props.language);
  }
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
