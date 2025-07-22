/**
 * Composable for workflow editor functionality
 */

import {ref, computed, provide, onMounted, onUnmounted, watch} from 'vue';
import {useVueFlow} from '@vue-flow/core';
import {MarkerType} from '@vue-flow/core';
import eventBus from '@/plugins/eventBus';
import HelperStorage from '@/helpers/HelperStorage';
import {NodePositionStorage} from '../utils/nodeUtils';
import {calculateSmartPosition, applyAutoLayout, NodePosition} from '../utils/smartLayout';
import {type EditorAction, createWorkflowEditorActions} from '@/utils/editorUtils';

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
    initial_state?: string;
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
    data: {
        transitionData: any;
        stateName: string;
        transitionName: string;
        allTransitions?: Array<{
            stateName: string;
            transition: WorkflowTransition;
        }>;
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

        const edgeGroups = new Map<string, Array<{
            stateName: string;
            transition: WorkflowTransition;
        }>>();

        for (const [stateName, stateData] of Object.entries(states)) {
            const state = stateData as WorkflowState;
            if (state.transitions && Array.isArray(state.transitions)) {
                for (const transition of state.transitions) {
                    if (transition && transition.next) {
                        const edgeKey = `${stateName}->${transition.next}`;

                        if (!edgeGroups.has(edgeKey)) {
                            edgeGroups.set(edgeKey, []);
                        }

                        edgeGroups.get(edgeKey)!.push({
                            stateName,
                            transition
                        });
                    }
                }
            }
        }

        for (const [, transitions] of edgeGroups.entries()) {
            const firstTransition = transitions[0];
            const stateName = firstTransition.stateName;
            const target = firstTransition.transition.next;

            const sourceNode = nodes.value.find(n => n.id === stateName);
            const targetNode = nodes.value.find(n => n.id === target);

            let sourceHandle = 'right-source';
            let targetHandle = 'left-target';

            if (sourceNode && targetNode) {
                if (stateName === target) {
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
            if (transitions.length === 1) {
                edgeLabel = transitions[0].transition.id;
            } else if (transitions.length === 2) {
                edgeLabel = `${transitions[0].transition.id}/${transitions[1].transition.id}`;
            } else {
                edgeLabel = `${transitions[0].transition.id}/${transitions[1].transition.id}...`;
            }

            const edge: WorkflowEdge = {
                id: `${stateName}-${target}`,
                source: stateName,
                target: target,
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
                    transitionData: firstTransition.transition,
                    stateName,
                    transitionName: firstTransition.transition.id,
                    allTransitions: transitions,
                },
            };

            result.push(edge);
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
            const transitionCount = state.transitions ? state.transitions.length : 0;
            const isTerminal = transitionCount === 0;

            const transitions = state.transitions ? state.transitions.map((transition) => ({
                id: `${stateName}-${transition.id}`,
                name: transition.id,
                direction: transition.next || 'Unknown',
                fullData: transition
            })) : [];

            const position = hasSavedPositions
                ? savedPositions[stateName] || calculateSmartPosition(stateName, states, parsed.initial_state || 'state_initial')
                : calculateSmartPosition(stateName, states, parsed.initial_state || 'state_initial');

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

        // Сохраняем текущие позиции узлов перед изменением данных
        const currentPositions: { [key: string]: NodePosition } = {};
        nodes.value.forEach(node => {
            currentPositions[node.id] = { x: node.position.x, y: node.position.y };
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
            // Это новый переход - просто добавляем его
            if (transitionData && typeof transitionData === 'object') {
                const newTransition = {
                    id: transitionName,
                    ...transitionData
                } as WorkflowTransition;

                state.transitions.push(newTransition);
            }
        } else {
            // Это существующий переход - обновляем его
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

        // Сохраняем текущие позиции в storage перед обновлением canvasData
        nodePositionStorage.savePositions(currentPositions);

        canvasData.value = JSON.stringify(parsed, null, 2);
    }

    function handleDeleteTransition(eventData: any) {
        const { stateName, transitionName } = eventData;

        // Сохраняем текущие позиции узлов перед изменением данных
        const currentPositions: { [key: string]: NodePosition } = {};
        nodes.value.forEach(node => {
            currentPositions[node.id] = { x: node.position.x, y: node.position.y };
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

        // Находим и удаляем переход
        const transitionIndex = state.transitions.findIndex(t => t.id === transitionName);
        if (transitionIndex !== -1) {
            state.transitions.splice(transitionIndex, 1);
            
            // Сохраняем текущие позиции в storage перед обновлением canvasData
            nodePositionStorage.savePositions(currentPositions);
            
            canvasData.value = JSON.stringify(parsed, null, 2);
        } else {
            console.warn('Transition not found:', transitionName, 'in state:', stateName);
        }
    }

    function handleChangeTransitionTarget(eventData: any) {
        const { stateName, transitionName, newTarget } = eventData;

        // Сохраняем текущие позиции узлов перед изменением данных
        const currentPositions: { [key: string]: NodePosition } = {};
        nodes.value.forEach(node => {
            currentPositions[node.id] = { x: node.position.x, y: node.position.y };
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

        // Находим и обновляем переход
        const transitionIndex = state.transitions.findIndex(t => t.id === transitionName);
        if (transitionIndex !== -1) {
            state.transitions[transitionIndex].next = newTarget;
            
            // Сохраняем текущие позиции в storage перед обновлением canvasData
            nodePositionStorage.savePositions(currentPositions);
            
            canvasData.value = JSON.stringify(parsed, null, 2);
        } else {
            console.warn('Transition not found:', transitionName, 'in state:', stateName);
        }
    }

    function handleGetAvailableNodes(eventData: any) {
        const { callback } = eventData;
        
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

    function onConnect(params: any) {
        const { source, target } = params;
        
        if (!source || !target) {
            return;
        }

        // Сохраняем текущие позиции узлов перед показом диалога
        const currentPositions: { [key: string]: NodePosition } = {};
        nodes.value.forEach(node => {
            currentPositions[node.id] = { x: node.position.x, y: node.position.y };
        });
        nodePositionStorage.savePositions(currentPositions);

        // Парсим текущие данные workflow для проверки существования состояний
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

        // Проверяем, что целевое состояние существует
        if (!parsed.states[target]) {
            console.error('Target state not found:', target);
            return;
        }

        // Генерируем уникальное имя для нового перехода с timestamp
        const timestamp = Date.now();
        const newTransitionName = `${source}_${target}_${timestamp}`;

        // Создаем предварительные данные перехода (НЕ добавляем в workflow)
        const proposedTransition = {
            id: newTransitionName,
            next: target,
            processors: []
        };

        // Показываем диалог редактирования для НОВОГО перехода
        setTimeout(() => {
            eventBus.$emit('show-condition-popup', {
                stateName: source,
                transitionName: newTransitionName,
                transitionData: proposedTransition,
                isNewTransition: true // Флаг для обозначения нового перехода
            });
        }, 100);
    }

    function resetTransform() {
        setViewport({x: 0, y: 0, zoom: 1});
    }

    function autoLayout() {
        const parsed = JSON.parse(canvasData.value);
        const states = parsed.states || {};
        const initialState = parsed.initial_state;

        // Используем новую функцию applyAutoLayout
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
        eventBus.$on('save-transition', handleSaveCondition);
        eventBus.$on('delete-transition', handleDeleteTransition);
        eventBus.$on('change-transition-target', handleChangeTransitionTarget);
        eventBus.$on('get-available-nodes', handleGetAvailableNodes);
        generateNodes();
    });

    onUnmounted(() => {
        eventBus.$off('save-transition', handleSaveCondition);
        eventBus.$off('delete-transition', handleDeleteTransition);
        eventBus.$off('change-transition-target', handleChangeTransitionTarget);
        eventBus.$off('get-available-nodes', handleGetAvailableNodes);

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
        onConnect,
        resetTransform,
        autoLayout,
        onUpdateWorkflowMetaDialog,
        onResize,
        fitView,
    };
}
