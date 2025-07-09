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

    // Initialize node position storage
    const nodePositionStorage = new NodePositionStorage(helperStorage, props.technicalId);
    const workflowMetaData = ref(nodePositionStorage.loadPositions());

    // Computed edges
    const edges = computed<WorkflowEdge[]>(() => {
        if (!canvasData.value) return;
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

        // Check if we have saved positions, if so use them
        const hasSavedPositions = Object.keys(savedPositions).length > 0;

        for (const [stateName, stateData] of Object.entries(states)) {
            const state = stateData as WorkflowState;
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

        state.transitions[transitionName] = transitionData;
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

        // Apply smart positioning to all nodes
        for (const stateName of Object.keys(states)) {
            positions[stateName] = calculateSmartPosition(stateName, states, initialState);
        }

        // Apply force-directed adjustments for better spacing
        optimizePositions(positions);

        // Update node positions
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
        fitView();
    }

    // Setup event listeners
    onMounted(() => {
        eventBus.$on('save-transition', handleSaveCondition);
        generateNodes();
    });

    onUnmounted(() => {
        eventBus.$off('save-transition', handleSaveCondition);
        
        // Clear debounce timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
    });

    // Watch for changes in canvasData and regenerate nodes/edges
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    watch(canvasData, () => {
        // Clear previous timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        // Set new timer with 300ms debounce
        debounceTimer = setTimeout(() => {
            generateNodes();
        }, 300);
    });

    // Provide condition change handler
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
