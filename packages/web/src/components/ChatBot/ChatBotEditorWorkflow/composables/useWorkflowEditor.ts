/**
 * Composable for workflow editor functionality
 */

import {ref, computed, provide, onMounted, onUnmounted, watch, nextTick} from 'vue';
import {useVueFlow} from '@vue-flow/core';
import {MarkerType} from '@vue-flow/core';
import {ElMessageBox, ElMessage} from 'element-plus';
import eventBus from '@/plugins/eventBus';
import HelperStorage from '@/helpers/HelperStorage';
import {NodePositionStorage} from '../utils/nodeUtils';
import {TransitionEdgePositionStorage} from '../utils/transitionEdgeStorage';
import {calculateSmartPosition, applyAutoLayout, NodePosition} from '../utils/smartLayout';
import {type EditorAction, createWorkflowEditorActions} from '@/utils/editorUtils';
import {useUndoRedo} from './useUndoRedo';

export interface WorkflowEditorProps {
    technicalId: string;
}

export interface WorkflowTransition {
    name: string;
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
        transitionId?: string;
        sourceOffset?: { x: number; y: number };
        targetOffset?: { x: number; y: number };
        labelOffset?: { x: number; y: number };
        allTransitions?: Array<{
            stateName: string;
            transition: WorkflowTransition;
        }>;
        isBidirectional?: boolean;
    };
}

export function useWorkflowEditor(props: WorkflowEditorProps, assistantStore?: any) {
    const EDITOR_WIDTH = 'chatBotEditorWorkflow:width';
    const EDITOR_MODE = 'chatBotEditorWorkflow:editorMode';

    const canvasData = ref('');
    const helperStorage = new HelperStorage();
    const editorSize = ref(helperStorage.get(EDITOR_WIDTH, '50%'));
    const editorMode = ref(helperStorage.get(EDITOR_MODE, 'preview'));
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
    const transitionEdgeStorage = new TransitionEdgePositionStorage(helperStorage, props.technicalId);
    // Инициализируем workflowMetaData как пустой объект - позиции теперь хранятся в Workflow Meta Data
    const workflowMetaData = ref({});
    
    // Сохраняем исходное состояние при загрузке JSON для восстановления через resetTransform
    const initialPositions = ref<{ [key: string]: NodePosition }>({});
    const initialTransitionLabels = ref<{ [key: string]: { x: number; y: number } }>({});

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

        const transitionGroups = new Map<string, Array<{
            transitionId: string;
            source: string;
            target: string;
            transitionData: WorkflowTransition;
        }>>();

        for (const [stateName, stateData] of Object.entries(states)) {
            const state = stateData as WorkflowState;
            if (state.transitions && Array.isArray(state.transitions)) {
                for (const transition of state.transitions) {
                    if (transition && transition.next) {
                        const source = stateName;
                        const target = transition.next;
                        const groupKey = `${source}->${target}`;

                        if (!transitionGroups.has(groupKey)) {
                            transitionGroups.set(groupKey, []);
                        }

                        transitionGroups.get(groupKey)!.push({
                            transitionId: transition.name,
                            source,
                            target,
                            transitionData: transition
                        });
                    }
                }
            }
        }

        for (const [groupKey, transitions] of transitionGroups.entries()) {
            transitions.forEach((transitionInfo, index) => {
                const {transitionId, source, target, transitionData} = transitionInfo;

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

                const savedPosition = transitionEdgeStorage.getTransitionPosition(transitionId);
                let sourceOffset = {x: 0, y: 0};
                let targetOffset = {x: 0, y: 0};

                if (savedPosition) {
                    sourceOffset = savedPosition.sourceOffset;
                    targetOffset = savedPosition.targetOffset;
                } else if (transitions.length > 1) {
                    const autoOffset = transitionEdgeStorage.generateAutoOffset(
                        source, target, index, transitions.length
                    );
                    sourceOffset = autoOffset.sourceOffset;
                    targetOffset = autoOffset.targetOffset;
                }

                // Получаем позицию метки из workflowMetaData
                const metaData: any = workflowMetaData.value;
                const labelOffset = metaData?.transitionLabels?.[transitionId] || { x: 0, y: 0 };

                const edge: WorkflowEdge = {
                    id: `${source}-${target}-${transitionId}`,
                    source,
                    target,
                    sourceHandle,
                    targetHandle,
                    label: '',
                    animated: true,
                    type: 'draggableTransition',
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: 'var(--text-color-regular)',
                    },
                    data: {
                        transitionId,
                        stateName: source,
                        transitionName: transitionId,
                        transitionData,
                        sourceOffset,
                        targetOffset,
                        labelOffset,
                    },
                };

                result.push(edge);
            });
        }

        console.log('Generated individual transition edges:', result.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            transitionId: e.data.transitionId
        })));
        return result;
    });

    function generateNodes() {
        if (!canvasData.value || canvasData.value.trim() === '') {
            nodes.value = [];
            return;
        }

        const result: WorkflowNode[] = [];
        let parsed: WorkflowData;
        // Используем workflowMetaData вместо loadPositions из localStorage
        const savedPositions = workflowMetaData.value;

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
        
        // Проверяем, нужно ли сохранить исходное состояние (при первой загрузке JSON)
        const shouldSaveInitialState = Object.keys(initialPositions.value).length === 0;
        
        // Сохраняем исходные transition labels, если они есть
        if (shouldSaveInitialState) {
            const metaData: any = workflowMetaData.value;
            if (metaData?.transitionLabels) {
                initialTransitionLabels.value = { ...metaData.transitionLabels };
            }
        }

        for (const [stateName, stateData] of Object.entries(states)) {
            const state = stateData as WorkflowState;
            const transitionCount = state.transitions ? state.transitions.length : 0;
            const isTerminal = transitionCount === 0;

            const transitions = state.transitions ? state.transitions.map((transition) => ({
                id: `${stateName}-${transition.name}`,
                name: transition.name,
                direction: transition.next || 'Unknown',
                fullData: transition
            })) : [];

            const position = hasSavedPositions
                ? savedPositions[stateName] || calculateSmartPosition(stateName, states, parsed.initialState || 'state_initial')
                : calculateSmartPosition(stateName, states, parsed.initialState || 'state_initial');

            // Сохраняем исходную позицию при первой загрузке
            if (shouldSaveInitialState) {
                initialPositions.value[stateName] = { ...position };
            }

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
        console.log('🔄 handleSaveCondition called with:', eventData);

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

        console.log('Current state.transitions:', state.transitions);
        console.log('Updating transition:', {transitionName, transitionData, oldTransitionName, isNewTransition});

        if (isNewTransition) {
            if (transitionData && typeof transitionData === 'object') {
                const newTransition = {
                    name: transitionName,
                    ...transitionData
                } as WorkflowTransition;

                // Проверяем, что целевое состояние существует
                if (newTransition.next && !parsed.states[newTransition.next]) {
                    console.error('Target state does not exist:', newTransition.next);
                    console.log('Available states:', Object.keys(parsed.states));
                    eventBus.$emit('validation-error', {
                        message: `Target state "${newTransition.next}" does not exist. Available states: ${Object.keys(parsed.states).join(', ')}`
                    });
                    return;
                }

                state.transitions.push(newTransition);
                console.log('Added new transition:', newTransition);
            }
        } else {
            const searchName = oldTransitionName && oldTransitionName !== transitionName ? oldTransitionName : transitionName;
            const transitionIndex = state.transitions.findIndex(t => t.name === searchName);

            console.log('Searching for transition with name:', searchName, 'found at index:', transitionIndex);

            if (transitionData && typeof transitionData === 'object') {
                const updatedTransition = {
                    name: transitionName,
                    ...transitionData
                } as WorkflowTransition;

                if (updatedTransition.next && !parsed.states[updatedTransition.next]) {
                    console.error('Target state does not exist:', updatedTransition.next);
                    console.log('Available states:', Object.keys(parsed.states));
                    eventBus.$emit('validation-error', {
                        message: `Target state "${updatedTransition.next}" does not exist. Available states: ${Object.keys(parsed.states).join(', ')}`
                    });
                    return;
                }

                if (transitionIndex !== -1) {
                    state.transitions[transitionIndex] = updatedTransition;
                    console.log('Updated existing transition at index', transitionIndex, ':', updatedTransition);
                } else {
                    state.transitions.push(updatedTransition);
                    console.log('Added transition (not found):', updatedTransition);
                }
            }
        }

        console.log('Final state.transitions:', state.transitions);

        // Обновляем workflowMetaData вместо localStorage
        workflowMetaData.value = { ...workflowMetaData.value, ...currentPositions };

        canvasData.value = JSON.stringify(parsed, null, 2);

        if (assistantStore && assistantStore.selectedAssistant) {
            assistantStore.selectedAssistant.workflow_data = canvasData.value;
            console.log('Updated assistantStore.selectedAssistant.workflow_data');
        }

        eventBus.$emit('transition-saved-successfully');
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

        const transitionIndex = state.transitions.findIndex(t => t.name === transitionName);
        if (transitionIndex !== -1) {
            state.transitions.splice(transitionIndex, 1);

            // Обновляем workflowMetaData вместо localStorage
            workflowMetaData.value = { ...workflowMetaData.value, ...currentPositions };

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
        // Обновляем workflowMetaData вместо localStorage
        workflowMetaData.value = { ...workflowMetaData.value, ...currentPositions };

        canvasData.value = JSON.stringify(parsed, null, 2);

        if (assistantStore && assistantStore.selectedAssistant) {
            assistantStore.selectedAssistant.workflow_data = canvasData.value;
        }
    }

    function handleGetTransitionData(eventData: any) {
        const {stateName, transitionName, callback} = eventData;

        let parsed: WorkflowData;
        try {
            parsed = JSON.parse(canvasData.value);
        } catch (e) {
            console.error('Invalid JSON in canvasData:', e);
            callback(null);
            return;
        }

        const state = parsed.states[stateName];
        if (!state || !state.transitions) {
            console.warn('State or transitions not found:', stateName);
            callback(null);
            return;
        }

        const transition = state.transitions.find(t => t.name === transitionName);
        callback(transition || null);
    }

    function handleRenameState(eventData: any) {
        const {oldName, newName} = eventData;

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

        if (!parsed.states[oldName]) {
            console.warn('State not found:', oldName);
            return;
        }

        if (parsed.states[newName]) {
            console.error('State with new name already exists:', newName);
            return;
        }

        const stateData = parsed.states[oldName];
        delete parsed.states[oldName];
        parsed.states[newName] = stateData;

        if (parsed.initialState === oldName) {
            parsed.initialState = newName;
        }

        Object.values(parsed.states).forEach((state: any) => {
            if (state.transitions) {
                state.transitions.forEach((transition: any) => {
                    if (transition.next === oldName) {
                        transition.next = newName;
                    }
                });
            }
        });

        if (currentPositions[oldName]) {
            currentPositions[newName] = currentPositions[oldName];
            delete currentPositions[oldName];
        }

        // Обновляем workflowMetaData вместо localStorage
        workflowMetaData.value = { ...workflowMetaData.value, ...currentPositions };
        canvasData.value = JSON.stringify(parsed, null, 2);

        if (assistantStore && assistantStore.selectedAssistant) {
            assistantStore.selectedAssistant.workflow_data = canvasData.value;
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

        const transitionIndex = state.transitions.findIndex(t => t.name === transitionName);
        if (transitionIndex !== -1) {
            state.transitions[transitionIndex].next = newTarget;

            // Обновляем workflowMetaData вместо localStorage
            workflowMetaData.value = { ...workflowMetaData.value, ...currentPositions };

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

    const currentDraggedTransition = ref<{
        transitionId: string;
        sourceNode: string;
        targetNode: string;
        transitionData: any;
    } | null>(null);

    function handleTransitionDragStart(eventData: any) {
        console.log('🔄 Transition drag started:', eventData);
        currentDraggedTransition.value = {
            transitionId: eventData.transitionId,
            sourceNode: eventData.sourceNode,
            targetNode: eventData.targetNode,
            transitionData: eventData.transitionData
        };

        eventBus.$emit('highlight-drop-targets', true);
    }

    function handleTransitionDragging(eventData: any) {
        // You can add visual feedback while dragging
        // For example, highlighting nodes under the cursor
    }

    function handleTransitionDragEnd(eventData: any) {
        console.log('🔄 Transition drag ended:', eventData);

        if (!currentDraggedTransition.value) {
            console.log('❌ No current dragged transition');
            return;
        }

        eventBus.$emit('highlight-drop-targets', false);

        const nodeUnderCursor = findNodeAtPosition(eventData.mouseX, eventData.mouseY);

        if (nodeUnderCursor && nodeUnderCursor !== currentDraggedTransition.value.sourceNode) {
            moveTransitionToNode(
                currentDraggedTransition.value.transitionId,
                currentDraggedTransition.value.sourceNode,
                nodeUnderCursor
            );
        } else {
            console.log('❌ Cannot move transition - same node or no target');
        }

        currentDraggedTransition.value = null;
    }

    function findNodeAtPosition(mouseX: number, mouseY: number): string | null {
        const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);

        if (elementUnderCursor) {
            const handlerElement = elementUnderCursor.closest('.vue-flow__handle');
            if (handlerElement) {
                const nodeElement = handlerElement.closest('[data-id]');
                if (nodeElement) {
                    const nodeId = nodeElement.getAttribute('data-id');
                    console.log('🎯 Found node via handler:', nodeId);
                    return nodeId;
                }
            }

            let nodeElement = elementUnderCursor.closest('[data-id]');

            if (!nodeElement) {
                nodeElement = elementUnderCursor.closest('.workflow-node');
                if (nodeElement) {
                    let parent = nodeElement.parentElement;
                    while (parent && !parent.hasAttribute('data-id')) {
                        parent = parent.parentElement;
                    }
                    if (parent) {
                        nodeElement = parent;
                    }
                }
            }

            if (!nodeElement) {
                nodeElement = elementUnderCursor.closest('.vue-flow__node');
            }

            if (nodeElement) {
                const nodeId = nodeElement.getAttribute('data-id');
                return nodeId;
            }
        }

        console.log('❌ No node found under cursor at position:', mouseX, mouseY);
        return null;
    }

    function moveTransitionToNode(transitionId: string, sourceNode: string, targetNode: string) {
        console.log(`🔄 Reassigning transition "${transitionId}" from state "${sourceNode}" to point to "${targetNode}"`);

        let parsed: WorkflowData;
        try {
            parsed = JSON.parse(canvasData.value);
        } catch (e) {
            console.error('Invalid JSON in canvasData:', e);
            return;
        }

        const sourceState = parsed.states[sourceNode];
        const targetState = parsed.states[targetNode];

        if (!sourceState || !targetState) {
            console.error('Source or target state not found');
            return;
        }

        if (sourceState.transitions) {
            const transitionIndex = sourceState.transitions.findIndex(t => t.name === transitionId);
            if (transitionIndex !== -1) {
                sourceState.transitions[transitionIndex].next = targetNode;

                console.log(`✅ Transition "${transitionId}" now points from "${sourceNode}" to "${targetNode}"`);
            } else {
                console.error('Transition not found in source state');
                return;
            }
        } else {
            console.error('Source state has no transitions');
            return;
        }

        canvasData.value = JSON.stringify(parsed, null, 2);

        if (assistantStore && assistantStore.selectedAssistant) {
            assistantStore.selectedAssistant.workflow_data = canvasData.value;
        }

        generateNodes();

        ElMessage.success(`Transition "${transitionId}" reassigned from "${sourceNode}" to "${targetNode}"`);
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

        const transitionIndex = state.transitions.findIndex(t => t.name === transitionName);
        if (transitionIndex !== -1) {
            state.transitions[transitionIndex] = {
                ...state.transitions[transitionIndex],
                ...transitionData
            } as WorkflowTransition;
        }

        canvasData.value = JSON.stringify(parsed, null, 2);
    }

    function onNodeDragStop(event: any) {
        // Обновляем workflowMetaData вместо localStorage
        const positions = {};
        event.nodes.forEach((node: WorkflowNode) => {
            positions[node.id] = node.position;
        });
        workflowMetaData.value = { ...workflowMetaData.value, ...positions };
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
        // Обновляем workflowMetaData вместо localStorage
        workflowMetaData.value = { ...workflowMetaData.value, ...currentPositions };

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
            name: newTransitionName,
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
        fitView();

        // Восстанавливаем исходные позиции узлов и transition labels
        if (Object.keys(initialPositions.value).length > 0) {
            console.log('Restoring initial positions:', initialPositions.value);
            console.log('Restoring initial transition labels:', initialTransitionLabels.value);
            
            nodes.value = nodes.value.map((node: WorkflowNode) => ({
                ...node,
                position: initialPositions.value[node.id] || node.position
            }));

            // Восстанавливаем исходное состояние workflowMetaData
            const restoredMetaData: any = { ...initialPositions.value };
            if (Object.keys(initialTransitionLabels.value).length > 0) {
                restoredMetaData.transitionLabels = { ...initialTransitionLabels.value };
            }
            
            workflowMetaData.value = restoredMetaData;
            
            // Уведомляем все рёбра о необходимости сброса их позиций
            eventBus.$emit('reset-edge-positions');
            
            console.log('Reset to initial state completed');
        } else {
            console.warn('No initial state saved');
        }
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

        // Обновляем workflowMetaData вместо localStorage
        workflowMetaData.value = { ...workflowMetaData.value, ...positions };
    }

    function handleUpdateTransitionLabelPosition(eventData: any) {
        const { transitionId, offset } = eventData;
        
        console.log(`📍 Updating transition label position: ${transitionId}`, offset);
        
        // Создаем копию workflowMetaData как any чтобы добавить transitionLabels
        const metaData: any = { ...workflowMetaData.value };
        
        if (!metaData.transitionLabels) {
            metaData.transitionLabels = {};
        }
        
        metaData.transitionLabels[transitionId] = offset;
        workflowMetaData.value = metaData;
        
        // Больше не сохраняем в localStorage
        console.log(`💾 Updated transition labels in workflowMetaData:`, metaData.transitionLabels);
    }

    function onUpdateWorkflowMetaDialog(data: any) {
        workflowMetaData.value = data;
        // Больше не сохраняем в localStorage
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
        eventBus.$on('rename-state', handleRenameState);
        eventBus.$on('get-transition-data', handleGetTransitionData);
        eventBus.$on('change-transition-target', handleChangeTransitionTarget);
        eventBus.$on('get-available-nodes', handleGetAvailableNodes);
        eventBus.$on('transition-drag-start', handleTransitionDragStart);
        eventBus.$on('transition-dragging', handleTransitionDragging);
        eventBus.$on('transition-drag-end', handleTransitionDragEnd);
        eventBus.$on('update-transition-label-position', handleUpdateTransitionLabelPosition);
        generateNodes();
    });

    if (assistantStore) {
        watch(
            () => assistantStore.selectedAssistant?.workflow_data,
            (newWorkflowData) => {
                if (newWorkflowData !== undefined && newWorkflowData !== canvasData.value) {
                    // Очищаем исходное состояние при загрузке нового workflow
                    initialPositions.value = {};
                    initialTransitionLabels.value = {};
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
        eventBus.$off('rename-state', handleRenameState);
        eventBus.$off('get-transition-data', handleGetTransitionData);
        eventBus.$off('change-transition-target', handleChangeTransitionTarget);
        eventBus.$off('get-available-nodes', handleGetAvailableNodes);
        eventBus.$off('transition-drag-start', handleTransitionDragStart);
        eventBus.$off('transition-dragging', handleTransitionDragging);
        eventBus.$off('transition-drag-end', handleTransitionDragEnd);

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

    watch(editorMode, (value) => {
        helperStorage.set(EDITOR_MODE, value);
    })

    function onUpdateTransitionPosition(transitionId: string, sourceOffset: { x: number; y: number }, targetOffset: {
        x: number;
        y: number
    }) {
        transitionEdgeStorage.saveTransitionPosition(transitionId, {
            sourceOffset,
            targetOffset
        });
        console.log('Updated transition position:', {transitionId, sourceOffset, targetOffset});
    }

    function resetAllTransitionPositions() {
        // Очищаем transition labels в workflowMetaData
        const metaData: any = { ...workflowMetaData.value };
        if (metaData.transitionLabels) {
            delete metaData.transitionLabels;
            workflowMetaData.value = metaData;
        }
        
        // Уведомляем все рёбра о необходимости сброса их позиций
        eventBus.$emit('reset-edge-positions');
        
        console.log('All transition positions and labels cleared');
    }

    provide('onConditionChange', onEdgeConditionChange);

    return {
        canvasData,
        editorSize,
        editorMode,
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
        onUpdateTransitionPosition,
        resetAllTransitionPositions,
        onResize,
        fitView,
        canUndo,
        canRedo,
        undoAction,
        redoAction,
        isDraggingConnection,
    };
}
