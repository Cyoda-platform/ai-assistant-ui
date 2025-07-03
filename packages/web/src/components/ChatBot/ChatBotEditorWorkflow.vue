<template>
  <div class="chat-bot-editor-workflow">
    <el-splitter @resize="onResize">
      <el-splitter-panel v-model:size="editorSize" class="chat-bot-editor-workflow__editor-wrapper">
        <Editor v-model="canvasData" class="chat-bot-editor-workflow__editor-inner"/>
      </el-splitter-panel>
      <el-splitter-panel class="chat-bot-editor-workflow__flow-wrapper">
        <VueFlow
            class="chat-bot-editor-workflow__vue-flow"
            :fit-view-on-init="true"
            :zoom-on-scroll="false"
            @nodeDragStop="onNodeDragStop"
            v-model:nodes="nodes"
            v-model:edges="edges"
            :default-viewport="{ zoom: 1.5 }"
            :min-zoom="0.2"
            :max-zoom="4"
        >
          <Controls position="top-left">
            <ControlButton title="Reset Transform" @click="resetTransform">
              <Icon name="reset"/>
            </ControlButton>

            <ControlButton title="Shuffle Node Positions" @click="updatePos">
              <Icon name="update"/>
            </ControlButton>
          </Controls>
          <Background pattern-color="#aaa" :gap="16"/>
          <template #node-default="{ data }">
            <Node @conditionChange="onConditionChange($event, data)" :data="data"/>
          </template>
        </VueFlow>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {VueFlow, useVueFlow} from '@vue-flow/core'
import {Background} from '@vue-flow/background'
import {ControlButton, Controls} from '@vue-flow/controls'
import Editor from "@/components/Editor/Editor.vue";
import workflowData from "./workflow.json";
import HelperStorage from "@/helpers/HelperStorage";
import Icon from "@/components/ChatBot/ChatBotEditorWorkflow/Icon.vue";
import Node from "@/components/ChatBot/ChatBotEditorWorkflow/Node.vue";

const props = defineProps<{
  technicalId: string,
}>();

const EDITOR_WIDTH = 'chatBotEditorWorkflow:width';

const canvasData = ref(JSON.stringify(workflowData, null, 2));
const helperStorage = new HelperStorage();
const editorSize = ref(helperStorage.get(EDITOR_WIDTH, '50%'));

const {setViewport, onInit} = useVueFlow();

const nodePositionKey = computed(() => {
  return `workflow-node-positions${props.technicalId}`;
})

function loadNodePositions() {
  return helperStorage.get(nodePositionKey.value, {});
}

function saveNodePositions(positions) {
  helperStorage.set(nodePositionKey.value, positions);
}

let vueFlowInstance: any = null;

onInit((instance) => {
  vueFlowInstance = instance;
})

const nodes = ref([]);
const edges = computed(() => {
  const result = [];
  let parsed;

  try {
    parsed = JSON.parse(canvasData.value);
  } catch (e) {
    console.error('Invalid JSON in canvasData:', e);
    return [];
  }

  const states = parsed.states || {};

  for (const [stateName, stateData] of Object.entries(states)) {
    if (stateData.transitions) {
      for (const [transitionName, transitionData] of Object.entries(stateData.transitions)) {
        result.push({
          id: `${stateName}-${transitionName}`,
          source: stateName,
          target: transitionData.next,
          label: transitionName,
        });
      }
    }
  }

  return result;
});

function generateNodes() {
  const result = [];
  let parsed;
  const savedPositions = loadNodePositions();

  try {
    parsed = JSON.parse(canvasData.value);
  } catch (e) {
    console.error('Invalid JSON in canvasData:', e);
    nodes.value = [];
    return;
  }

  const states = parsed.states || {};
  let index = 0;
  const xDefault = 0;
  const ySpacing = 200;

  for (const [stateName, stateData] of Object.entries(states)) {
    let condition = null;
    let transitionNameWithCondition = null;

    for (const [transitionName, transition] of Object.entries(stateData.transitions || {})) {
      if (transition.condition) {
        condition = transition.condition;
        transitionNameWithCondition = transitionName;
        break;
      }
    }

    const position = savedPositions[stateName] || {x: xDefault, y: index * ySpacing};

    result.push({
      id: stateName,
      type: 'default',
      data: {
        label: stateName,
        editableCondition: condition ? JSON.stringify(condition, null, 2) : null,
        stateName,
        transitionName: transitionNameWithCondition,
      },
      position,
    });
    index++;
  }

  nodes.value = result;
}

generateNodes();

watch(canvasData, generateNodes);

function onConditionChange(event, data) {
  const newCondition = event.target.value;

  let parsed;
  try {
    parsed = JSON.parse(canvasData.value);
  } catch (e) {
    console.error('Invalid JSON in canvasData:', e);
    return;
  }

  const state = parsed.states[data.stateName];
  if (!state) return;

  const transition = state.transitions[data.transitionName];
  if (!transition) return;

  try {
    transition.condition = JSON.parse(newCondition);
  } catch (e) {
    console.error('Invalid JSON in condition textarea:', e);
    return;
  }

  canvasData.value = JSON.stringify(parsed, null, 2);
}

function onNodeDragStop(event) {
  const positions = loadNodePositions();

  event.nodes.forEach(node => {
    positions[node.id] = node.position;
  });

  saveNodePositions(positions);
}

function resetTransform() {
  setViewport({x: 0, y: 0, zoom: 1})
}

function updatePos() {
  nodes.value = nodes.value.map((node) => {
    const newPos = {
      x: Math.random() * 400,
      y: Math.random() * 400,
    }

    return {
      ...node,
      position: newPos,
    }
  })

  const positions = {};
  nodes.value.forEach(node => {
    positions[node.id] = node.position;
  });
  saveNodePositions(positions);
}

function onResize() {
  vueFlowInstance.fitView();
}

watch(editorSize, (value) => {
  helperStorage.set(EDITOR_WIDTH, value);
})
</script>

<style lang="scss">
.chat-bot-editor-workflow {
  width: 100%;
  height: calc(100vh - 81px);

  .vue-flow__controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center
  }

  &__editor-wrapper {
    padding-right: 15px;
  }

  &__flow-wrapper {
    padding-left: 15px;
  }

  &__editor-inner {
    min-height: 100%;
  }
}
</style>
