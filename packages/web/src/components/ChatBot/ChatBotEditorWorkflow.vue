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
  return `workflow-node-positions:${props.technicalId}`;
})

const workflowMetaData = ref(helperStorage.get(nodePositionKey.value, {}));
const editorActions = ref<any[]>([]);
const isLoading = ref(false);
const assistantStore = useAssistantStore();

function loadNodePositions() {
  return workflowMetaData.value;
}

function saveNodePositions(positions: any) {
  helperStorage.set(nodePositionKey.value, positions);
}

onMounted(() => {
  eventBus.$on('save-transition', handleSaveCondition);
})

onUnmounted(() => {
  eventBus.$off('save-transition', handleSaveCondition);
})

function handleSaveCondition(eventData: any) {
  const {stateName, transitionName, transitionData} = eventData;

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

  if (!state.transitions) {
    state.transitions = {};
  }

  state.transitions[transitionName] = transitionData;

  canvasData.value = JSON.stringify(parsed, null, 2);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodes = ref<any[]>([]);
const edgeTypes = {
  custom: EdgeWithTooltip
};
const edges = computed(() => {
  const result: any[] = [];
  let parsed: any;

  try {
    parsed = JSON.parse(canvasData.value);
  } catch (e) {
    console.error('Invalid JSON in canvasData:', e);
    return [];
  }

  const states = parsed.states || {};

  for (const [stateName, stateData] of Object.entries(states)) {
    const state = stateData as any;
    if (state.transitions) {
      for (const [transitionName, transitionData] of Object.entries(state.transitions)) {
        const transition = transitionData as any;
        const sourceNode = nodes.value.find(n => n.id === stateName);
        const targetNode = nodes.value.find(n => n.id === transition.next);

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
          target: transition.next,
          sourceHandle,
          targetHandle,
          label: transitionName,
          animated: true,
          type: transition ? 'custom' : 'default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#333',
          },
          data: {
            transitionData: transition,
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
  const result: any[] = [];
  let parsed: any;
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

  // Check if we have saved positions, if so use them
  const hasSavedPositions = Object.keys(savedPositions).length > 0;

  for (const [stateName, stateData] of Object.entries(states)) {
    const state = stateData as any;
    const transitionCount = Object.keys(state.transitions || {}).length;
    const isTerminal = transitionCount === 0;

    // Use saved positions if available, otherwise calculate smart layout
    const position = hasSavedPositions 
      ? savedPositions[stateName] || calculateSmartPosition(stateName, states, initialState)
      : calculateSmartPosition(stateName, states, initialState);

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
  }

  nodes.value = result;
}

// Smart positioning algorithm inspired by Cytoscape.js
function calculateSmartPosition(stateName: string, states: any, initialState: string) {
  const LEVEL_SPACING = 300;
  const NODE_SPACING = 150;
  const VERTICAL_SPREAD = 200; // Increased vertical spread
  
  // Build graph structure
  const graph = buildGraph(states);
  
  // Calculate levels using BFS from initial state
  const levels = calculateLevels(graph, initialState);
  
  // Group nodes by level
  const nodesByLevel = groupNodesByLevel(levels, states);
  
  // Calculate position for this specific node
  const nodeLevel = levels[stateName] || 0;
  const nodesInLevel = nodesByLevel[nodeLevel] || [];
  const nodeIndexInLevel = nodesInLevel.indexOf(stateName);
  
  // Calculate X position (level-based)
  let x = nodeLevel * LEVEL_SPACING;
  
  // Special handling for different node types
  if (stateName === initialState) {
    x = 0; // Initial state at origin
  } else if (stateName === 'state_terminal') {
    // Terminal states to the right
    x = Math.max(nodeLevel * LEVEL_SPACING, (Math.max(...Object.values(levels)) + 1) * LEVEL_SPACING);
  }
  
  // Calculate Y position with better distribution
  let y = 0;
  
  if (nodesInLevel.length === 1) {
    y = 0; // Single node centered
  } else {
    // Multiple nodes in level - spread them out
    const totalHeight = (nodesInLevel.length - 1) * NODE_SPACING;
    const startY = -totalHeight / 2;
    y = startY + nodeIndexInLevel * NODE_SPACING;
    
    // Add some randomness to avoid perfect lines
    const randomOffset = (Math.random() - 0.5) * 50;
    y += randomOffset;
  }
  
  // Special positioning for self-loops and backward transitions
  const currentState = states[stateName];
  if (currentState?.transitions) {
    const transitions = Object.values(currentState.transitions);
    const hasSelfLoop = transitions.some((t: any) => t.next === stateName);
    const hasBackwardTransition = transitions.some((t: any) => {
      const targetLevel = levels[t.next];
      return targetLevel !== undefined && targetLevel <= nodeLevel;
    });
    
    if (hasSelfLoop) {
      // Self-loop nodes slightly offset
      y += 30;
    }
    
    if (hasBackwardTransition && stateName !== initialState) {
      // Backward transition nodes get vertical offset
      y += nodeIndexInLevel % 2 === 0 ? -VERTICAL_SPREAD : VERTICAL_SPREAD;
    }
  }
  
  return { x, y };
}

function buildGraph(states: any) {
  const graph: { [key: string]: string[] } = {};
  
  for (const [stateName, stateData] of Object.entries(states)) {
    const state = stateData as any;
    graph[stateName] = [];
    
    if (state.transitions) {
      for (const [transitionName, transitionData] of Object.entries(state.transitions)) {
        const transition = transitionData as any;
        if (transition.next && transition.next !== stateName) {
          graph[stateName].push(transition.next);
        }
      }
    }
  }
  
  return graph;
}

function calculateLevels(graph: { [key: string]: string[] }, initialState: string) {
  const levels: { [key: string]: number } = {};
  const visited = new Set<string>();
  const queue: { node: string; level: number }[] = [];
  
  // Start with initial state at level 0
  if (initialState && graph[initialState]) {
    queue.push({ node: initialState, level: 0 });
    levels[initialState] = 0;
  }
  
  // BFS to assign levels, but handle cycles better
  while (queue.length > 0) {
    const { node, level } = queue.shift()!;
    
    if (visited.has(node)) continue;
    visited.add(node);
    
    const neighbors = graph[node] || [];
    for (const neighbor of neighbors) {
      // Skip self-loops for level calculation
      if (neighbor === node) continue;
      
      if (!visited.has(neighbor)) {
        let newLevel = level + 1;
        
        // Special handling for terminal states
        if (neighbor.includes('terminal')) {
          newLevel = Math.max(newLevel, 4); // Push terminal states to the right
        }
        
        // Special handling for backward transitions
        if (levels[neighbor] !== undefined && levels[neighbor] <= level) {
          // This is a backward transition, don't update level
          continue;
        }
        
        if (levels[neighbor] === undefined || levels[neighbor] > newLevel) {
          levels[neighbor] = newLevel;
          queue.push({ node: neighbor, level: newLevel });
        }
      }
    }
  }
  
  // Assign levels to remaining unvisited nodes
  let maxLevel = Math.max(...Object.values(levels));
  for (const nodeName of Object.keys(graph)) {
    if (levels[nodeName] === undefined) {
      maxLevel += 1;
      levels[nodeName] = maxLevel;
    }
  }
  
  return levels;
}

function groupNodesByLevel(levels: { [key: string]: number }, states: any) {
  const nodesByLevel: { [key: number]: string[] } = {};
  
  for (const [stateName, level] of Object.entries(levels)) {
    if (!nodesByLevel[level]) {
      nodesByLevel[level] = [];
    }
    nodesByLevel[level].push(stateName);
  }
  
  // Sort nodes within each level for better visual organization
  for (const level of Object.keys(nodesByLevel)) {
    nodesByLevel[parseInt(level)].sort((a, b) => {
      const stateA = states[a] as any;
      const stateB = states[b] as any;
      
      // Prioritize nodes by their role in the workflow
      const getNodePriority = (stateName: string, state: any) => {
        // Terminal states get lowest priority (bottom)
        if (stateName.includes('terminal')) return 0;
        
        // Initial state gets highest priority (top)
        if (stateName.includes('initial')) return 100;
        
        // Nodes with conditions get medium-high priority
        if (state.transitions) {
          const hasCondition = Object.values(state.transitions).some((t: any) => t.condition);
          if (hasCondition) return 80;
        }
        
        // Nodes with self-loops get medium priority
        if (state.transitions) {
          const hasSelfLoop = Object.values(state.transitions).some((t: any) => t.next === stateName);
          if (hasSelfLoop) return 60;
        }
        
        // Regular nodes get base priority
        return 40;
      };
      
      const priorityA = getNodePriority(a, stateA);
      const priorityB = getNodePriority(b, stateB);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      
      // Sort by number of transitions (more connected nodes first)
      const transitionsA = Object.keys(stateA.transitions || {}).length;
      const transitionsB = Object.keys(stateB.transitions || {}).length;
      
      if (transitionsA !== transitionsB) {
        return transitionsB - transitionsA;
      }
      
      // Finally by name for consistency
      return a.localeCompare(b);
    });
  }
  
  return nodesByLevel;
}

generateNodes();

watch(canvasData, generateNodes);

function onConditionChange(event: any, data: any) {
  const newTransitionData = event.target.value;

  let parsed;
  try {
    parsed = JSON.parse(canvasData.value);
  } catch (e) {
    console.error('Invalid JSON in canvasData:', e);
    return;
  }

  const state = parsed.states[data.stateName];
  if (!state) return;

  try {
    const transitionData = JSON.parse(newTransitionData);
    state.transitions[data.transitionName] = transitionData;
  } catch (e) {
    console.error('Invalid JSON in transition data:', e);
    return;
  }

  canvasData.value = JSON.stringify(parsed, null, 2);
}

function onEdgeConditionChange(event: any) {
  const {stateName, transitionName, transitionData} = event;

  let parsed;
  try {
    parsed = JSON.parse(canvasData.value);
  } catch (e) {
    console.error('Invalid JSON in canvasData:', e);
    return;
  }

  const state = parsed.states[stateName];
  if (!state) return;

  if (!state.transitions) {
    state.transitions = {};
  }

  state.transitions[transitionName] = transitionData;

  canvasData.value = JSON.stringify(parsed, null, 2);
}

provide('onConditionChange', onEdgeConditionChange);

function onNodeDragStop(event: any) {
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

  // Use the new smart positioning for auto layout
  const positions: any = {};
  
  // Apply smart positioning to all nodes
  for (const stateName of Object.keys(states)) {
    positions[stateName] = calculateSmartPosition(stateName, states, initialState);
  }

  // Apply force-directed adjustments for better spacing
  optimizePositions(positions);

  // Update node positions
  nodes.value = nodes.value.map((node: any) => ({
    ...node,
    position: positions[node.id] || node.position
  }));

  saveNodePositions(positions);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function optimizePositions(positions: any) {
  const MIN_DISTANCE = 120;
  const PREFERRED_DISTANCE = 180;
  const positionArray = Object.entries(positions);

  // Multiple passes for better distribution
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < positionArray.length; i++) {
      for (let j = i + 1; j < positionArray.length; j++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [stateName1, pos1] = positionArray[i] as [string, any];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [stateName2, pos2] = positionArray[j] as [string, any];

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
        } else if (distance < PREFERRED_DISTANCE) {
          // Gentle adjustment for preferred spacing
          const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
          const moveDistance = (PREFERRED_DISTANCE - distance) / 8;

          pos1.x -= Math.cos(angle) * moveDistance;
          pos1.y -= Math.sin(angle) * moveDistance;
          pos2.x += Math.cos(angle) * moveDistance;
          pos2.y += Math.sin(angle) * moveDistance;
        }
      }
    }
  }

  // Apply vertical clustering to reduce vertical spread
  const states = Object.keys(positions);
  const centerY = states.reduce((sum, state) => sum + positions[state].y, 0) / states.length;
  
  for (const state of states) {
    const currentY = positions[state].y;
    const distanceFromCenter = Math.abs(currentY - centerY);
    
    if (distanceFromCenter > 300) {
      // Gently pull extreme nodes towards center
      const pullForce = 0.3;
      positions[state].y = currentY + (centerY - currentY) * pullForce;
    }
  }
}

function workflowMeta() {
  workflowMetaDialogRef.value.openDialog(workflowMetaData.value);
}

function onUpdateWorkflowMetaDialog(data: any) {
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

async function questionRequest(data: any) {
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
