<template>
  <div v-loading="isLoading" class="chat-bot-editor-workflow">
    <el-splitter @resize="onResize">
      <el-splitter-panel v-model:size="editorSize" class="chat-bot-editor-workflow__editor-wrapper">
        <Editor v-model="canvasData" language="javascript" class="chat-bot-editor-workflow__editor-inner"
                :actions="editorActions"/>
      </el-splitter-panel>
      <el-splitter-panel class="chat-bot-editor-workflow__flow-wrapper">
        <VueFlow
            class="chat-bot-editor-workflow__vue-flow"
            :fit-view-on-init="true"
            :zoom-on-scroll="false"
            @nodeDragStop="onNodeDragStop"
            v-model:nodes="nodes"
            v-model:edges="edges"
            :edge-types="edgeTypes"
            :default-viewport="{ zoom: 1.5 }"
            :min-zoom="0.2"
            :max-zoom="4"
        >
          <Controls position="top-left">
            <ControlButton @click="resetTransform">
              <Icon name="reset"/>
            </ControlButton>

            <ControlButton @click="autoLayout">
              <Icon name="update"/>
            </ControlButton>

            <ControlButton @click="workflowMeta">
              <Icon name="cogs"/>
            </ControlButton>
          </Controls>
          <Background pattern-color="#aaa" :gap="16"/>
          <template #node-default="{ data }">
            <Node :data="data"/>
          </template>
        </VueFlow>
      </el-splitter-panel>
    </el-splitter>
    <EditEdgeConditionalDialog/>
    <WorkflowMetaDialog @update="onUpdateWorkflowMetaDialog" ref="workflowMetaDialogRef"
                        :workflowMetaData="workflowMetaData"/>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, watch, provide, onMounted, onUnmounted} from 'vue'
import {VueFlow, useVueFlow, MarkerType} from '@vue-flow/core'
import {Background} from '@vue-flow/background'
import {ControlButton, Controls} from '@vue-flow/controls'
import Editor from "@/components/Editor/Editor.vue";
import workflowData from "./workflow.json";
import HelperStorage from "@/helpers/HelperStorage";
import Icon from "@/components/ChatBot/ChatBotEditorWorkflow/Icon.vue";
import Node from "@/components/ChatBot/ChatBotEditorWorkflow/Node.vue";
import EdgeWithTooltip from "@/components/ChatBot/ChatBotEditorWorkflow/EdgeWithTooltip.vue";
import eventBus from "@/plugins/eventBus";
import EditEdgeConditionalDialog from "@/components/ChatBot/ChatBotEditorWorkflow/EditEdgeConditionalDialog.vue";
import {templateRef} from "@vueuse/core";
import WorkflowMetaDialog from "@/components/ChatBot/ChatBotEditorWorkflow/WorkflowMetaDialog.vue";
import * as monaco from "monaco-editor";
import {ElMessageBox, ElNotification} from "element-plus";
import useAssistantStore from "@/stores/assistant";

const props = defineProps<{
  technicalId: string,
}>();

const EDITOR_WIDTH = 'chatBotEditorWorkflow:width';

const canvasData = ref(JSON.stringify(workflowData, null, 2));
const helperStorage = new HelperStorage();
const editorSize = ref(helperStorage.get(EDITOR_WIDTH, '50%'));
const workflowMetaDialogRef = templateRef('workflowMetaDialogRef');

const {setViewport, fitView} = useVueFlow();

const nodePositionKey = computed(() => {
  return `workflow-node-positions${props.technicalId}`;
})

const workflowMetaData = ref(helperStorage.get(nodePositionKey.value, {}));
const editorActions = ref<any[]>([]);
const isLoading = ref(false);
const assistantStore = useAssistantStore();

function loadNodePositions() {
  return workflowMetaData.value;
}

function saveNodePositions(positions) {
  helperStorage.set(nodePositionKey.value, positions);
}

onMounted(() => {
  eventBus.$on('save-condition', handleSaveCondition);
})

onUnmounted(() => {
  eventBus.$off('save-condition', handleSaveCondition);
})

function handleSaveCondition(eventData) {
  const {stateName, transitionName, condition} = eventData;

  let parsed;
  try {
    parsed = JSON.parse(canvasData.value);
  } catch (e) {
    console.error('Invalid JSON in canvasData:', e);
    return;
  }

  const state = parsed.states[stateName];
  if (!state) {
    console.error('State not found:', stateName);
    return;
  }

  const transition = state.transitions[transitionName];
  if (!transition) {
    console.error('Transition not found:', transitionName);
    return;
  }

  if (condition === null || condition === undefined) {
    delete transition.condition;
  } else {
    transition.condition = condition;
  }

  canvasData.value = JSON.stringify(parsed, null, 2);
}

const nodes = ref([]);
const edgeTypes = {
  custom: EdgeWithTooltip
};
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
        const sourceNode = nodes.value.find(n => n.id === stateName);
        const targetNode = nodes.value.find(n => n.id === transitionData.next);

        let sourceHandle = 'right';
        let targetHandle = 'left';

        if (sourceNode && targetNode) {
          const sourceY = sourceNode.position.y;
          const targetY = targetNode.position.y;
          const sourceX = sourceNode.position.x;
          const targetX = targetNode.position.x;

          const deltaY = Math.abs(targetY - sourceY);
          const deltaX = Math.abs(targetX - sourceX);

          if (deltaY > 80 && deltaX < 200) {
            if (targetY > sourceY) {
              sourceHandle = 'bottom';
              targetHandle = 'top';
            } else {
              sourceHandle = 'top-source';
              targetHandle = 'bottom-target';
            }
          } else if (targetX < sourceX) {
            if (targetY > sourceY + 50) {
              sourceHandle = 'bottom';
              targetHandle = 'top';
            } else if (targetY < sourceY - 50) {
              sourceHandle = 'top-source';
              targetHandle = 'bottom-target';
            } else {
              sourceHandle = 'left';
              targetHandle = 'right';
            }
          }
        }

        const edge = {
          id: `${stateName}-${transitionName}`,
          source: stateName,
          target: transitionData.next,
          sourceHandle,
          targetHandle,
          label: transitionName,
          animated: true,
          type: transitionData.condition ? 'custom' : 'default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#333',
          },
          data: {
            condition: transitionData.condition,
            stateName,
            transitionName,
          },
        };

        result.push(edge);
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
  const initialState = parsed.initial_state;
  let index = 0;
  const xDefault = 0;
  const ySpacing = 200;

  for (const [stateName, stateData] of Object.entries(states)) {
    const position = savedPositions[stateName] || {x: xDefault, y: index * ySpacing};
    const transitionCount = Object.keys(stateData.transitions || {}).length;
    const isTerminal = transitionCount === 0;

    result.push({
      id: stateName,
      type: 'default',
      data: {
        label: stateName,
        stateName,
        transitionCount,
        isInitial: stateName === initialState,
        isTerminal,
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

function onEdgeConditionChange(event) {
  const {stateName, transitionName, condition} = event;

  let parsed;
  try {
    parsed = JSON.parse(canvasData.value);
  } catch (e) {
    console.error('Invalid JSON in canvasData:', e);
    return;
  }

  const state = parsed.states[stateName];
  if (!state) return;

  const transition = state.transitions[transitionName];
  if (!transition) return;

  if (condition === null || condition === undefined) {
    delete transition.condition;
  } else {
    transition.condition = condition;
  }

  canvasData.value = JSON.stringify(parsed, null, 2);
}

provide('onConditionChange', onEdgeConditionChange);

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

function autoLayout() {
  const parsed = JSON.parse(canvasData.value);
  const states = parsed.states || {};
  const initialState = parsed.initial_state;

  const positions = {};
  const levels = {};
  const visited = new Set();
  const nodesByLevel = {};

  function assignMainLevels(stateName, level = 0) {
    if (visited.has(stateName) || level > 10) return;

    visited.add(stateName);
    levels[stateName] = level;

    if (!nodesByLevel[level]) nodesByLevel[level] = [];
    nodesByLevel[level].push(stateName);

    const state = states[stateName];
    if (state?.transitions) {
      const transitions = Object.values(state.transitions);

      const sortedTransitions = transitions.sort((a, b) => {
        if (a.condition && !b.condition) return 1;
        if (!a.condition && b.condition) return -1;
        return 0;
      });

      sortedTransitions.forEach(transition => {
        if (transition.next && !visited.has(transition.next)) {
          assignMainLevels(transition.next, level + 1);
        }
      });
    }
  }

  if (initialState) {
    assignMainLevels(initialState);
  }

  const remainingStates = Object.keys(states).filter(stateName => !visited.has(stateName));
  remainingStates.forEach((stateName, index) => {
    const level = Math.max(...Object.values(levels)) + 1 + Math.floor(index / 3);
    levels[stateName] = level;

    if (!nodesByLevel[level]) nodesByLevel[level] = [];
    nodesByLevel[level].push(stateName);
  });

  const LEVEL_WIDTH = 280;
  const NODE_HEIGHT = 100;

  Object.entries(nodesByLevel).forEach(([level, stateNames]) => {
    const levelNum = parseInt(level);
    const nodesCount = stateNames.length;

    const startY = -(nodesCount - 1) * NODE_HEIGHT / 2;

    stateNames.forEach((stateName, index) => {
      let x = levelNum * LEVEL_WIDTH;
      let y = startY + index * NODE_HEIGHT;

      if (stateName === 'state_terminal') {
        x = Math.max(levelNum * LEVEL_WIDTH, (Math.max(...Object.values(levels)) + 1) * LEVEL_WIDTH);
        y = 0;
      }

      const state = states[stateName];
      if (state?.transitions) {
        const hasBackwardTransition = Object.values(state.transitions).some(t =>
            t.next && levels[t.next] <= levels[stateName]
        );

        if (hasBackwardTransition && stateName !== initialState) {
          y += index % 2 === 0 ? -150 : 150;
        }
      }

      positions[stateName] = {x, y};
    });
  });

  optimizePositions(positions, states);

  nodes.value = nodes.value.map(node => ({
    ...node,
    position: positions[node.id] || node.position
  }));

  saveNodePositions(positions);
}

function optimizePositions(positions, states) {
  const MIN_DISTANCE = 120;
  const positionArray = Object.entries(positions);

  for (let i = 0; i < positionArray.length; i++) {
    for (let j = i + 1; j < positionArray.length; j++) {
      const [stateName1, pos1] = positionArray[i];
      const [stateName2, pos2] = positionArray[j];

      const distance = Math.sqrt(
          Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
      );

      if (distance < MIN_DISTANCE) {
        const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
        const moveDistance = (MIN_DISTANCE - distance) / 2;

        pos1.x -= Math.cos(angle) * moveDistance;
        pos1.y -= Math.sin(angle) * moveDistance;
        pos2.x += Math.cos(angle) * moveDistance;
        pos2.y += Math.sin(angle) * moveDistance;
      }
    }
  }
}

function workflowMeta() {
  workflowMetaDialogRef.value.openDialog(workflowMetaData.value);
}

function onUpdateWorkflowMetaDialog(data) {
  workflowMetaData.value = data;
  helperStorage.set(nodePositionKey.value, data);
  generateNodes();
}

function onResize() {
  fitView();
}

function addSubmitQuestionAction() {
  editorActions.value.push({
    id: "submitQuestion",
    label: "Submit Question",
    contextMenuGroupId: "chatbot",
    keybindings: [
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyQ,
    ],
    run: async (editor) => {
      const selectedValue = editor.getModel().getValueInRange(editor.getSelection());

      if (!selectedValue) {
        ElMessageBox.alert('Please select text before use it', 'Warning');
        return;
      }

      try {
        isLoading.value = true;

        const dataRequest = {
          question: selectedValue
        };

        const {data} = await questionRequest(dataRequest);

        const position = editor.getPosition();
        const lineCount = editor.getModel().getLineCount();
        const message = data.message.replaceAll('```javascript', '').replaceAll('```', '').trim();
        let textToInsert = `/*\n${message}\n*/`;
        if (position.lineNumber === lineCount) {
          textToInsert = '\n' + textToInsert;
        } else {
          textToInsert = textToInsert + '\n';
        }
        const range = new monaco.Range(
            position.lineNumber + 1,
            1,
            position.lineNumber + 1,
            1
        );
        editor.executeEdits('DialogContentScriptEditor', [
          {
            range,
            text: textToInsert,
          },
        ]);
        editor.setPosition({
          lineNumber: position.lineNumber + 1,
          column: textToInsert.length + 1
        });

        ElNotification({
          title: 'Success',
          message: 'The code was generated',
          type: 'success',
        })
      } finally {
        isLoading.value = false;
      }

    }
  })
}

async function questionRequest(data) {
  return assistantStore.postTextQuestions(props.technicalId, data);
}

addSubmitQuestionAction();
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
