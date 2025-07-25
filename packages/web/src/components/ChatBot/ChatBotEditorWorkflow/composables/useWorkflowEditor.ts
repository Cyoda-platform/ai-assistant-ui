/**
 * Composable for workflow editor functionality
 */

import {ref, computed, provide, onMounted, onUnmounted, watch, nextTick} from 'vue';
import {useVueFlow} from '@vue-flow/core';
import {MarkerType} from '@vue-flow/core';
import {ElMessageBox} from 'element-plus';
import eventBus from '@/plugins/eventBus';
import HelperStorage from '@/helpers/HelperStorage';
import {NodePositionStorage} from '../utils/nodeUtils';
import {calculateSmartPosition, applyAutoLayout, NodePosition} from '../utils/smartLayout';
import {type EditorAction, createWorkflowEditorActions} from '@/utils/editorUtils';
import {useUndoRedo} from './useUndoRedo';

export interface WorkflowEditorProps {
    technicalId: string;
}

export interface WorkflowTransition {
    id: string;
    next: string;
    manual?: boolean;
    processors?: Array<{
        name: string;
        config?: Record<string, any>;
    }>;
    criteria?: Array<{
        type: string;
        function?: {
            name: string;
        };
        name?: string;
        operator?: string;
        parameters?: Array<{
            jsonPath: string;
            operatorType: string;
            value: any;
            type: string;
        }>;
    }>;
}

export interface WorkflowState {
    transitions?: WorkflowTransition[];

    [key: string]: any;
}

export interface WorkflowData {
    version?: string;
    description?: string;
    initialState?: string;
    workflow_name?: string;
    states: Record<string, WorkflowState>;
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
    markerStart?: {
        type: MarkerType;
        width: number;
        height: number;
        color: string;
    };
    data: {
        transitionData: any;
        stateName: string;
        transitionName: string;
        allTransitions?: Array<{
            stateName: string;
            transition: WorkflowTransition;
        }>;
        isBidirectional?: boolean;
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

    const {
        history,
        currentIndex,
        canUndo,
        canRedo,
        saveState,
        undo,
        redo,
        initialize
    } = useUndoRedo();

    initialize('');

    const isDraggingConnection = ref(false);

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

        const edgeGroups = new Map<string, Array<{
            stateName: string;
            transition: WorkflowTransition;
        }>>();

        for (const [stateName, stateData] of Object.entries(states)) {
            const state = stateData as WorkflowState;
            if (state.transitions && Array.isArray(state.transitions)) {
                for (const transition of state.transitions) {
                    if (transition && transition.next) {
                        const nodeA = stateName;
                        const nodeB = transition.next;
                        const normalizedKey = nodeA < nodeB ? `${nodeA}<->${nodeB}` : `${nodeB}<->${nodeA}`;

                        if (!edgeGroups.has(normalizedKey)) {
                            edgeGroups.set(normalizedKey, []);
                        }

                        edgeGroups.get(normalizedKey)!.push({
                            stateName,
                            transition
                        });
                    }
                }
            }
        }

        for (const [normalizedKey, transitions] of edgeGroups.entries()) {
            const [nodeA, nodeB] = normalizedKey.split('<->');

            const transitionsAtoB = transitions.filter(t => t.stateName === nodeA && t.transition.next === nodeB);
            const transitionsBtoA = transitions.filter(t => t.stateName === nodeB && t.transition.next === nodeA);

            let source: string, target: string, mainTransitions: Array<{stateName: string; transition: WorkflowTransition}>;
            
            if (transitionsAtoB.length > 0) {
                source = nodeA;
                target = nodeB;
                mainTransitions = transitionsAtoB;
            } else {
                source = nodeB;
                target = nodeA;
                mainTransitions = transitionsBtoA;
            }

            const sourceNode = nodes.value.find(n => n.id === source);
            const targetNode = nodes.value.find(n => n.id === target);

            let sourceHandle = 'right-source';
            let targetHandle = 'left-target';

            if (sourceNode && targetNode) {
                if (source === target) {
                    sourceHandle = 'right-source';
                    targetHandle = 'left-target';
                } else {
                    const sourceY = sourceNode.position.y;
                    const targetY = targetNode.position.y;
                    const sourceX = sourceNode.position.x;
                    const targetX = targetNode.position.x;

                    const deltaY = Math.abs(targetY - sourceY);

                    if (deltaY > 30) {
                        if (targetY > sourceY) {
                            sourceHandle = 'bottom-source';
                            targetHandle = 'top-target';
                        } else {
                            sourceHandle = 'top-source';
                            targetHandle = 'bottom-target';
                        }
                    } else {
                        if (targetX > sourceX) {
                            sourceHandle = 'right-source';
                            targetHandle = 'left-target';
                        } else {
                            sourceHandle = 'left-source';
                            targetHandle = 'right-target';
                        }
                    }
                }
            }

            let edgeLabel = '';
            const isBidirectional = transitionsAtoB.length > 0 && transitionsBtoA.length > 0;
            
            if (isBidirectional) {
                const labelA = transitionsAtoB.length === 1 ? transitionsAtoB[0].transition.id : `${transitionsAtoB[0].transition.id}+${transitionsAtoB.length-1}`;
                const labelB = transitionsBtoA.length === 1 ? transitionsBtoA[0].transition.id : `${transitionsBtoA[0].transition.id}+${transitionsBtoA.length-1}`;
                edgeLabel = `${labelA} ⇄ ${labelB}`;
            } else {
                if (mainTransitions.length === 1) {
                    edgeLabel = mainTransitions[0].transition.id;
                } else if (mainTransitions.length === 2) {
                    edgeLabel = `${mainTransitions[0].transition.id}, ${mainTransitions[1].transition.id}`;
                } else {
                    edgeLabel = `${mainTransitions[0].transition.id}, ${mainTransitions[1].transition.id}...`;
                }
            }

            const edge: WorkflowEdge = {
                id: normalizedKey,
                source,
                target,
                sourceHandle,
                targetHandle,
                label: edgeLabel,
                animated: true,
                type: 'custom',
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#333',
                },
                data: {
                    transitionData: mainTransitions[0].transition,
                    stateName: source,
                    transitionName: mainTransitions[0].transition.id,
                    allTransitions: transitions,
                    isBidirectional,
                },
            };

            if (isBidirectional) {
                edge.markerStart = {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#333',
                };
            }

            result.push(edge);
        }

        console.log('Generated edges:', result.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label })));
        return result;
    });

    function generateNodes() {
        if (!canvasData.value || canvasData.value.trim() === '') {
            nodes.value = [];
            return;
        }

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
        if (Object.keys(states).length === 0) {
            nodes.value = [];
            return;
        }

        const initialState = parsed.initialState;

        const hasSavedPositions = Object.keys(savedPositions).length > 0;

        for (const [stateName, stateData] of Object.entries(states)) {
            const state = stateData as WorkflowState;
            const transitionCount = state.transitions ? state.transitions.length : 0;
            const isTerminal = transitionCount === 0;

            const transitions = state.transitions ? state.transitions.map((transition) => ({
                id: `${stateName}-${transition.id}`,
                name: transition.id,
                direction: transition.next || 'Unknown',
                fullData: transition
            })) : [];

            const position = hasSavedPositions
                ? savedPositions[stateName] || calculateSmartPosition(stateName, states, parsed.initialState || 'state_initial')
                : calculateSmartPosition(stateName, states, parsed.initialState || 'state_initial');

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
        const {stateName, transitionName, transitionData, oldTransitionName, isNewTransition} = eventData;

        const currentPositions: { [key: string]: NodePosition } = {};
        nodes.value.forEach(node => {
            currentPositions[node.id] = {x: node.position.x, y: node.position.y};
        });

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
            state.transitions = [];
        }

        if (isNewTransition) {
            if (transitionData && typeof transitionData === 'object') {
                const newTransition = {
                    id: transitionName,
                    ...transitionData
                } as WorkflowTransition;

                state.transitions.push(newTransition);
            }
        } else {
            const searchName = oldTransitionName && oldTransitionName !== transitionName ? oldTransitionName : transitionName;
            const transitionIndex = state.transitions.findIndex(t => t.id === searchName);

            if (transitionData && typeof transitionData === 'object') {
                const updatedTransition = {
                    id: transitionName,
                    ...transitionData
                } as WorkflowTransition;

                if (transitionIndex !== -1) {
                    state.transitions[transitionIndex] = updatedTransition;
                } else {
                    state.transitions.push(updatedTransition);
                }
            }
        }

        nodePositionStorage.savePositions(currentPositions);

        canvasData.value = JSON.stringify(parsed, null, 2);
    }

    function handleDeleteTransition(eventData: any) {
        const {stateName, transitionName} = eventData;

        const currentPositions: { [key: string]: NodePosition } = {};
        nodes.value.forEach(node => {
            currentPositions[node.id] = {x: node.position.x, y: node.position.y};
        });

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
            console.warn('No transitions found for state:', stateName);
            return;
        }

        const transitionIndex = state.transitions.findIndex(t => t.id === transitionName);
        if (transitionIndex !== -1) {
            state.transitions.splice(transitionIndex, 1);

            nodePositionStorage.savePositions(currentPositions);

            canvasData.value = JSON.stringify(parsed, null, 2);
        } else {
            console.warn('Transition not found:', transitionName, 'in state:', stateName);
        }
    }

    function handleDeleteState(eventData: any) {
        const {stateName} = eventData;

        const currentPositions: { [key: string]: NodePosition } = {};
        nodes.value.forEach(node => {
            currentPositions[node.id] = {x: node.position.x, y: node.position.y};
        });

        let parsed: WorkflowData;
        try {
            parsed = JSON.parse(canvasData.value);
        } catch (e) {
            console.error('Invalid JSON in canvasData:', e);
            return;
        }

        if (!parsed.states[stateName]) {
            console.warn('State not found:', stateName);
            return;
        }

        delete parsed.states[stateName];

        Object.values(parsed.states).forEach((state: any) => {
            if (state.transitions) {
                state.transitions = state.transitions.filter((t: any) => t.next !== stateName);
            }
        });

        if (parsed.initialState === stateName) {
            const remainingStates = Object.keys(parsed.states);
            if (remainingStates.length > 0) {
                parsed.initialState = remainingStates[0];
            } else {
                delete parsed.initialState;
            }
        }

        delete currentPositions[stateName];
        nodePositionStorage.savePositions(currentPositions);

        canvasData.value = JSON.stringify(parsed, null, 2);

        if (assistantStore) {
            assistantStore.setWorkflowData(canvasData.value);
        }
    }

    function handleChangeTransitionTarget(eventData: any) {
        const {stateName, transitionName, newTarget} = eventData;

        const currentPositions: { [key: string]: NodePosition } = {};
        nodes.value.forEach(node => {
            currentPositions[node.id] = {x: node.position.x, y: node.position.y};
        });

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
            console.warn('No transitions found for state:', stateName);
            return;
        }

        const transitionIndex = state.transitions.findIndex(t => t.id === transitionName);
        if (transitionIndex !== -1) {
            state.transitions[transitionIndex].next = newTarget;

            nodePositionStorage.savePositions(currentPositions);

            canvasData.value = JSON.stringify(parsed, null, 2);
        } else {
            console.warn('Transition not found:', transitionName, 'in state:', stateName);
        }
    }

    function handleGetAvailableNodes(eventData: any) {
        const {callback} = eventData;

        let parsed: WorkflowData;
        try {
            parsed = JSON.parse(canvasData.value);
        } catch (e) {
            console.error('Invalid JSON in canvasData:', e);
            callback([]);
            return;
        }

        const availableNodes = Object.keys(parsed.states || {});
        callback(availableNodes);
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
            state.transitions = [];
        }

        const transitionIndex = state.transitions.findIndex(t => t.id === transitionName);
        if (transitionIndex !== -1) {
            state.transitions[transitionIndex] = {
                ...state.transitions[transitionIndex],
                ...transitionData
            } as WorkflowTransition;
        }

        canvasData.value = JSON.stringify(parsed, null, 2);
    }

    function onNodeDragStop(event: any) {
        nodePositionStorage.updatePositionsFromDrag(event);
    }

    function onConnectStart() {
        isDraggingConnection.value = true;
    }

    function onConnectEnd() {
        isDraggingConnection.value = false;
    }

    function onConnect(params: any) {
        const {source, target} = params;

        if (!source || !target) {
            return;
        }

        const currentPositions: { [key: string]: NodePosition } = {};
        nodes.value.forEach(node => {
            currentPositions[node.id] = {x: node.position.x, y: node.position.y};
        });
        nodePositionStorage.savePositions(currentPositions);

        let parsed: WorkflowData;
        try {
            parsed = JSON.parse(canvasData.value);
        } catch (e) {
            console.error('Invalid JSON in canvasData:', e);
            return;
        }

        const sourceState = parsed.states[source];
        if (!sourceState) {
            console.error('Source state not found:', source);
            return;
        }

        if (!parsed.states[target]) {
            console.error('Target state not found:', target);
            return;
        }

        const timestamp = Date.now();
        const newTransitionName = `${source}_${target}_${timestamp}`;

        const proposedTransition = {
            id: newTransitionName,
            next: target,
            processors: []
        };

        setTimeout(() => {
            eventBus.$emit('show-condition-popup', {
                stateName: source,
                transitionName: newTransitionName,
                transitionData: proposedTransition,
                isNewTransition: true
            });
        }, 100);
    }

    function resetTransform() {
        setViewport({x: 0, y: 0, zoom: 1});
    }

    async function addNewState() {
        try {
            const {value: stateName} = await ElMessageBox.prompt('Enter state name:', 'Add New State', {
                confirmButtonText: 'OK',
                cancelButtonText: 'Cancel',
                inputPattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                inputErrorMessage: 'State name should be alphanumeric and start with a letter or underscore'
            });

            if (!stateName || stateName.trim() === '') {
                return;
            }

            let parsed: WorkflowData;
            try {
                if (!canvasData.value || canvasData.value.trim() === '' || canvasData.value.trim() === '{}') {
                    parsed = {
                        states: {}
                    };
                } else {
                    parsed = JSON.parse(canvasData.value);
                    if (!parsed.states) {
                        parsed.states = {};
                    }
                }
            } catch (e) {
                console.error('Invalid JSON in canvasData:', e);
                parsed = {
                    states: {}
                };
            }

            if (parsed.states[stateName]) {
                await ElMessageBox.alert(`State "${stateName}" already exists!`, 'Error', {
                    type: 'error'
                });
                return;
            }

            parsed.states[stateName] = {
                transitions: []
            };

            if (Object.keys(parsed.states).length === 1 && !parsed.initialState) {
                parsed.initialState = stateName;
            }

            canvasData.value = JSON.stringify(parsed, null, 2);

            generateNodes();

            setTimeout(() => {
                fitView();
            }, 300);

        } catch (error) {
            console.log('User cancelled state creation');
        }
    }

    function autoLayout() {
        const parsed = JSON.parse(canvasData.value);
        const states = parsed.states || {};
        const initialState = parsed.initialState;

        const positions = applyAutoLayout(states, initialState);

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
        if (assistantStore && assistantStore.selectedAssistant && assistantStore.selectedAssistant.workflow_data) {
            canvasData.value = assistantStore.selectedAssistant.workflow_data;
        }

        eventBus.$on('save-transition', handleSaveCondition);
        eventBus.$on('delete-transition', handleDeleteTransition);
        eventBus.$on('delete-state', handleDeleteState);
        eventBus.$on('change-transition-target', handleChangeTransitionTarget);
        eventBus.$on('get-available-nodes', handleGetAvailableNodes);
        generateNodes();
    });

    if (assistantStore) {
        watch(
            () => assistantStore.selectedAssistant?.workflow_data,
            (newWorkflowData) => {
                if (newWorkflowData !== undefined && newWorkflowData !== canvasData.value) {
                    canvasData.value = newWorkflowData;
                }
            },
            {immediate: true}
        );
    }

    onUnmounted(() => {
        eventBus.$off('save-transition', handleSaveCondition);
        eventBus.$off('delete-transition', handleDeleteTransition);
        eventBus.$off('delete-state', handleDeleteState);
        eventBus.$off('change-transition-target', handleChangeTransitionTarget);
        eventBus.$off('get-available-nodes', handleGetAvailableNodes);

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
    });

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isUndoRedoOperation = false;

    watch(canvasData, (newValue) => {
        if (!isUndoRedoOperation) {
            saveState(newValue || '');
        }

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
            generateNodes();
        }, 300);
    });

    function undoAction() {
        const previousState = undo();
        if (previousState !== null) {
            isUndoRedoOperation = true;
            canvasData.value = previousState;
            nextTick(() => {
                isUndoRedoOperation = false;
            });
        }
    }

    function redoAction() {
        const nextState = redo();
        if (nextState !== null) {
            isUndoRedoOperation = true;
            canvasData.value = nextState;
            nextTick(() => {
                isUndoRedoOperation = false;
            });
        }
    }

    watch(editorSize, (value) => {
        helperStorage.set(EDITOR_WIDTH, value);
    })

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
        onConnect,
        onConnectStart,
        onConnectEnd,
        resetTransform,
        addNewState,
        autoLayout,
        onUpdateWorkflowMetaDialog,
        onResize,
        fitView,
        canUndo,
        canRedo,
        undoAction,
        redoAction,
        isDraggingConnection,
    };
}
