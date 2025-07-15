/**
 * Composable for workflow editor functionality
 */

import {ref, computed, provide, onMounted, onUnmounted, watch} from 'vue';
import {useVueFlow} from '@vue-flow/core';
import {MarkerType} from '@vue-flow/core';
import eventBus from '@/plugins/eventBus';
import HelperStorage from '@/helpers/HelperStorage';
import {NodePositionStorage} from '../utils/nodeUtils';
import {optimizePositions, calculateSmartPosition} from '../utils/smartLayout';
import {type EditorAction, createWorkflowEditorActions} from '@/utils/editorUtils';

export interface WorkflowEditorProps {
    technicalId: string;
}

export interface WorkflowState {
    transitions: Record<string, any>;

    [key: string]: any;
}

export interface WorkflowData {
    states: Record<string, WorkflowState>;
    initial_state: string;
}

export interface WorkflowNode {
    id: string;
    type: string;
    data: {
        label: string;
        stateName: string;
        transitionCount: number;
        transitions: Array<{
            id: string;
            name: string;
            direction: string;
            fullData: any;
        }>;
        isInitial: boolean;
        isTerminal: boolean;
    };
    position: {
        x: number;
        y: number;
    };
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
    label: string;
    animated: boolean;
    type: string;
    markerEnd: {
        type: MarkerType;
        width: number;
        height: number;
        color: string;
    };
    data: {
        transitionData: any;
        stateName: string;
        transitionName: string;
    };
}

export function useWorkflowEditor(props: WorkflowEditorProps, assistantStore?: any) {
    const EDITOR_WIDTH = 'chatBotEditorWorkflow:width';

    const canvasData = ref('');
    const helperStorage = new HelperStorage();
    const editorSize = ref(helperStorage.get(EDITOR_WIDTH, '50%'));
    const isLoading = ref(false);
    const editorActions = ref<EditorAction[]>(
        assistantStore
            ? createWorkflowEditorActions(props.technicalId, assistantStore, isLoading)
            : []
    );
    const nodes = ref<WorkflowNode[]>([]);

    const {setViewport, fitView} = useVueFlow();

    const nodePositionStorage = new NodePositionStorage(helperStorage, props.technicalId);
    const workflowMetaData = ref(nodePositionStorage.loadPositions());

    const edges = computed<WorkflowEdge[]>(() => {
        if (!canvasData.value) return [];
        const result: WorkflowEdge[] = [];
        let parsed: WorkflowData;

        try {
            parsed = JSON.parse(canvasData.value);
        } catch (e) {
            console.error('Invalid JSON in canvasData:', e);
            return [];
        }

        const states = parsed.states || {};

        for (const [stateName, stateData] of Object.entries(states)) {
            const state = stateData as WorkflowState;
            if (state.transitions) {
                for (const [transitionName, transitionData] of Object.entries(state.transitions)) {
                    const transition = transitionData as any;
                    const sourceNode = nodes.value.find(n => n.id === stateName);
                    const targetNode = nodes.value.find(n => n.id === transition.next);

                    let sourceHandle = 'right';
                    let targetHandle = 'left';

                    if (sourceNode && targetNode) {
                        if (stateName === transition.next) {
                            sourceHandle = 'right-source';
                            targetHandle = 'left-target';
                        } else {
                            const sourceY = sourceNode.position.y;
                            const targetY = targetNode.position.y;
                            const sourceX = sourceNode.position.x;
                            const targetX = targetNode.position.x;

                            const deltaY = Math.abs(targetY - sourceY);
                            const deltaX = Math.abs(targetX - sourceX);

                            if (deltaY > deltaX && deltaY > 60) {
                                if (targetY > sourceY) {
                                    sourceHandle = 'bottom';
                                    targetHandle = 'top';
                                } else {
                                    sourceHandle = 'top';
                                    targetHandle = 'bottom';
                                }
                            } else {
                                if (targetX > sourceX) {
                                    sourceHandle = 'right';
                                    targetHandle = 'left';
                                } else {
                                    sourceHandle = 'left';
                                    targetHandle = 'right';
                                }
                            }
                        }
                    }

                    const edge: WorkflowEdge = {
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
        if (!canvasData.value) return;
        const result: WorkflowNode[] = [];
        let parsed: WorkflowData;
        const savedPositions = nodePositionStorage.loadPositions();

        try {
            parsed = JSON.parse(canvasData.value);
        } catch (e) {
            console.error('Invalid JSON in canvasData:', e);
            nodes.value = [];
            return;
        }

        const states = parsed.states || {};
        const initialState = parsed.initial_state;

        const hasSavedPositions = Object.keys(savedPositions).length > 0;

        for (const [stateName, stateData] of Object.entries(states)) {
            const state = stateData as WorkflowState;
            const transitionCount = Object.keys(state.transitions || {}).length;
            const isTerminal = transitionCount === 0;

            const transitions = state.transitions ? Object.entries(state.transitions).map(([transitionName, transitionData]: [string, any]) => ({
                id: `${stateName}-${transitionName}`,
                name: transitionName,
                direction: transitionData.next || 'Unknown',
                fullData: transitionData
            })) : [];

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
                    transitions,
                    isInitial: stateName === initialState,
                    isTerminal,
                },
                position,
            });
        }

        nodes.value = result;
    }

    function handleSaveCondition(eventData: any) {
        const {stateName, transitionName, transitionData} = eventData;

        let parsed: WorkflowData;
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

        const transitionEntries = Object.entries(state.transitions);
        const oldTransitionIndex = transitionEntries.findIndex(([key]) => key === transitionName);

        const newTransitions: Record<string, unknown> = {};
        
        if (transitionData && typeof transitionData === 'object') {
            const newTransitionEntries = Object.entries(transitionData);

            if (oldTransitionIndex !== -1) {
                for (let i = 0; i < oldTransitionIndex; i++) {
                    const [key, value] = transitionEntries[i];
                    newTransitions[key] = value;
                }

                for (const [key, value] of newTransitionEntries) {
                    newTransitions[key] = value;
                }

                for (let i = oldTransitionIndex + 1; i < transitionEntries.length; i++) {
                    const [key, value] = transitionEntries[i];
                    newTransitions[key] = value;
                }
            } else {
                Object.assign(newTransitions, state.transitions);
                Object.assign(newTransitions, transitionData);
            }
        }
        
        state.transitions = newTransitions;
        canvasData.value = JSON.stringify(parsed, null, 2);
    }

    function onEdgeConditionChange(event: any) {
        const {stateName, transitionName, transitionData} = event;

        let parsed: WorkflowData;
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

    function onNodeDragStop(event: any) {
        nodePositionStorage.updatePositionsFromDrag(event);
    }

    function resetTransform() {
        setViewport({x: 0, y: 0, zoom: 1});
    }

    function autoLayout() {
        const parsed = JSON.parse(canvasData.value);
        const states = parsed.states || {};
        const initialState = parsed.initial_state;

        const positions: Record<string, { x: number; y: number }> = {};

        for (const stateName of Object.keys(states)) {
            positions[stateName] = calculateSmartPosition(stateName, states, initialState);
        }

        optimizePositions(positions);

        nodes.value = nodes.value.map((node: WorkflowNode) => ({
            ...node,
            position: positions[node.id] || node.position
        }));

        nodePositionStorage.savePositions(positions);
    }

    function onUpdateWorkflowMetaDialog(data: any) {
        workflowMetaData.value = data;
        nodePositionStorage.savePositions(data);
        generateNodes();
    }

    function onResize() {
        // fitView();
    }

    onMounted(() => {
        eventBus.$on('save-transition', handleSaveCondition);
        generateNodes();
    });

    onUnmounted(() => {
        eventBus.$off('save-transition', handleSaveCondition);

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
    });

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    watch(canvasData, () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            generateNodes();
        }, 300);
    });

    provide('onConditionChange', onEdgeConditionChange);

    return {
        canvasData,
        editorSize,
        isLoading,
        editorActions,
        nodes,
        edges,
        workflowMetaData,
        generateNodes,
        onNodeDragStop,
        resetTransform,
        autoLayout,
        onUpdateWorkflowMetaDialog,
        onResize,
        fitView,
    };
}
