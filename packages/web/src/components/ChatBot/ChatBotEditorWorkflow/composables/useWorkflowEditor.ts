/**
 * Composable for workflow editor functionality
 */

import {ref, computed, provide, onMounted, onUnmounted, watch, nextTick} from 'vue';
import {useVueFlow} from '@vue-flow/core';
import {MarkerType} from '@vue-flow/core';
import {ElMessageBox, ElMessage} from 'element-plus';
import eventBus from '@/plugins/eventBus';
import HelperStorage from '@/helpers/HelperStorage';
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
    
    // Реактивные ключи для localStorage, обновляются при изменении technicalId
    const workflowCanvasDataKey = computed(() => `chatBotEditorWorkflow:canvasData:${props.technicalId}`);
    const workflowMetaDataKey = computed(() => `chatBotEditorWorkflow:metaData:${props.technicalId}`);

    const helperStorage = new HelperStorage();
    
    // Функция загрузки данных для текущего technicalId
    const loadDataForCurrentId = () => {
        const canvasDataFromStorage = helperStorage.get(workflowCanvasDataKey.value, null);
        const metaDataFromStorage = helperStorage.get(workflowMetaDataKey.value, null);
        
        // Если canvasDataFromStorage уже строка - используем как есть, иначе stringify
        const canvasDataString = typeof canvasDataFromStorage === 'string' 
            ? canvasDataFromStorage 
            : (canvasDataFromStorage ? JSON.stringify(canvasDataFromStorage, null, 2) : null);

        canvasData.value = canvasDataString || '';
        workflowMetaData.value = metaDataFromStorage || '';
        
        // Очищаем undo/redo историю при смене чата - инициализируем с текущими данными
        initialize(canvasData.value);
        
        // Очищаем позиции для нового чата
        initialPositions.value = {};
        initialTransitionLabels.value = {};
    };
    
    const initialCanvasData = helperStorage.get(workflowCanvasDataKey.value, null);
    const canvasData = ref(
        initialCanvasData ? JSON.stringify(initialCanvasData, null, 2) : ''
    );
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

    // Инициализируем undo/redo с текущими данными canvasData вместо пустой строки
    initialize(canvasData.value);

    const isDraggingConnection = ref(false);

    const {setViewport, fitView} = useVueFlow();

    const workflowMetaData = ref(helperStorage.get(workflowMetaDataKey.value, null) || {});

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
                const internalTransitionId = `${source}-${transitionId}`;

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

                const metaData: any = workflowMetaData.value || {};
                let sourceOffset = {x: 0, y: 0};
                let targetOffset = {x: 0, y: 0};

                if (transitions.length > 1) {
                    const baseOffset = 30;
                    const spacing = 20;
                    const totalOffset = (transitions.length - 1) * spacing;
                    const startOffset = -totalOffset / 2;

                    const randomVariationX = (Math.random() - 0.5) * 20; // ±10px
                    const randomVariationY = (Math.random() - 0.5) * 16; // ±8px

                    sourceOffset = {
                        x: startOffset + index * spacing + randomVariationX,
                        y: baseOffset + index * 10 + randomVariationY
                    };
                    targetOffset = {
                        x: startOffset + index * spacing + randomVariationX,
                        y: baseOffset + index * 10 + randomVariationY
                    };
                }

                const labelOffset = metaData?.transitionLabels?.[internalTransitionId] || {x: 0, y: 0};

                const edge: WorkflowEdge = {
                    id: `${source}-${target}-${internalTransitionId}`,
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
                        transitionId: internalTransitionId,
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

    function cleanupStaleMetadata(currentStates: Record<string, any>) {
        const currentMetaData = workflowMetaData.value || {};
        let hasChanges = false;
        const cleanedMetaData = {...currentMetaData};

        // Получаем все текущие состояния и их переходы
        const currentStateNames = new Set(Object.keys(currentStates));
        const currentTransitionIds = new Set<string>();
        
        for (const [stateName, stateData] of Object.entries(currentStates)) {
            const state = stateData as WorkflowState;
            if (state.transitions) {
                state.transitions.forEach(transition => {
                    currentTransitionIds.add(`${stateName}-${transition.name}`);
                });
            }
        }

        // Очищаем позиции несуществующих состояний
        for (const stateKey of Object.keys(cleanedMetaData)) {
            if (stateKey !== 'transitionLabels' && !currentStateNames.has(stateKey)) {
                delete cleanedMetaData[stateKey];
                hasChanges = true;
            }
        }

        // Очищаем позиции несуществующих переходов
        if (cleanedMetaData.transitionLabels) {
            const cleanedTransitionLabels = {...cleanedMetaData.transitionLabels};
            for (const transitionId of Object.keys(cleanedTransitionLabels)) {
                if (!currentTransitionIds.has(transitionId)) {
                    delete cleanedTransitionLabels[transitionId];
                    hasChanges = true;
                }
            }
            cleanedMetaData.transitionLabels = cleanedTransitionLabels;
        }

        // Обновляем метаданные если были изменения
        if (hasChanges) {
            workflowMetaData.value = Object.keys(cleanedMetaData).length > 0 ? cleanedMetaData : null;
            helperStorage.set(workflowMetaDataKey.value, workflowMetaData.value);
        }
    }

    function generateNodes() {
        if (!canvasData.value || canvasData.value.trim() === '') {
            nodes.value = [];
            // Очищаем метаданные при пустом редакторе
            if (workflowMetaData.value) {
                workflowMetaData.value = null;
                helperStorage.set(workflowMetaDataKey.value, null);
            }
            return;
        }

        const result: WorkflowNode[] = [];
        let parsed: WorkflowData;

        const savedPositions = workflowMetaData.value || {};

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

        // Очищаем устаревшие метаданные
        cleanupStaleMetadata(states);

        const initialState = parsed.initialState;

        const hasSavedPositions = Object.keys(savedPositions).length > 0;

        const shouldSaveInitialState = Object.keys(initialPositions.value).length === 0;

        if (shouldSaveInitialState) {
            const metaData: any = workflowMetaData.value || {};
            if (metaData?.transitionLabels) {
                initialTransitionLabels.value = {...metaData.transitionLabels};
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

            if (shouldSaveInitialState) {
                initialPositions.value[stateName] = {...position};
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

        workflowMetaData.value = {...(workflowMetaData.value || {}), ...currentPositions};

        // Обновляем transitionLabels при переименовании transition
        if (!isNewTransition && oldTransitionName && oldTransitionName !== transitionName) {
            const currentMetaData = workflowMetaData.value || {};
            if (currentMetaData.transitionLabels) {
                const oldTransitionId = `${stateName}-${oldTransitionName}`;
                const newTransitionId = `${stateName}-${transitionName}`;
                
                if (currentMetaData.transitionLabels[oldTransitionId]) {
                    // Переносим позицию на новый ключ
                    currentMetaData.transitionLabels[newTransitionId] = currentMetaData.transitionLabels[oldTransitionId];
                    delete currentMetaData.transitionLabels[oldTransitionId];
                    workflowMetaData.value = currentMetaData;
                    // Метаданные автоматически сохранятся через watch
                }
            }
        }

        canvasData.value = JSON.stringify(parsed, null, 2);

        if (assistantStore && assistantStore.selectedAssistant) {
            assistantStore.selectedAssistant.workflow_data = canvasData.value;
            console.log('Updated assistantStore.selectedAssistant.workflow_data');
        }

        eventBus.$emit('transition-saved-successfully');

        setTimeout(() => saveState(createSnapshot()), 0);
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

            workflowMetaData.value = {...(workflowMetaData.value || {}), ...currentPositions};

            canvasData.value = JSON.stringify(parsed, null, 2);

            saveState(createSnapshot());
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

        const updatedMetaData: any = {...(workflowMetaData.value || {}), ...currentPositions};

        if (updatedMetaData[stateName]) {
            delete updatedMetaData[stateName];
        }

        if (updatedMetaData.transitionLabels) {
            const updatedTransitionLabels = {};
            Object.keys(updatedMetaData.transitionLabels).forEach(transitionId => {
                if (!transitionId.includes(stateName)) {
                    updatedTransitionLabels[transitionId] = updatedMetaData.transitionLabels[transitionId];
                }
            });
            updatedMetaData.transitionLabels = updatedTransitionLabels;
        }

        workflowMetaData.value = updatedMetaData;

        canvasData.value = JSON.stringify(parsed, null, 2);

        if (assistantStore && assistantStore.selectedAssistant) {
            assistantStore.selectedAssistant.workflow_data = canvasData.value;
        }

        saveState(createSnapshot());
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
        
        // Создаем новый объект states с сохранением порядка
        const newStates = {};
        Object.keys(parsed.states).forEach(stateName => {
            if (stateName === oldName) {
                // Заменяем старое имя на новое в том же месте
                newStates[newName] = stateData;
            } else {
                newStates[stateName] = parsed.states[stateName];
            }
        });
        parsed.states = newStates;

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

        const updatedMetaData: any = {...(workflowMetaData.value || {}), ...currentPositions};

        if (updatedMetaData[oldName]) {
            updatedMetaData[newName] = updatedMetaData[oldName];
            delete updatedMetaData[oldName];
        }

        if (updatedMetaData.transitionLabels) {
            const updatedTransitionLabels = {};
            Object.keys(updatedMetaData.transitionLabels).forEach(transitionId => {
                const newTransitionId = transitionId.replace(new RegExp(`\\b${oldName}\\b`, 'g'), newName);
                updatedTransitionLabels[newTransitionId] = updatedMetaData.transitionLabels[transitionId];
            });
            updatedMetaData.transitionLabels = updatedTransitionLabels;
        }

        workflowMetaData.value = updatedMetaData;
        canvasData.value = JSON.stringify(parsed, null, 2);

        if (assistantStore && assistantStore.selectedAssistant) {
            assistantStore.selectedAssistant.workflow_data = canvasData.value;
        }

        saveState(createSnapshot());
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

            workflowMetaData.value = {...(workflowMetaData.value || {}), ...currentPositions};

            canvasData.value = JSON.stringify(parsed, null, 2);

            saveState(createSnapshot());
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

        saveState(createSnapshot());
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

        saveState(createSnapshot());
    }

    function onNodeDragStop(event: any) {
        const positions: Record<string, { x: number; y: number }> = {};
        event.nodes.forEach((node: WorkflowNode) => {
            positions[node.id] = {...node.position};
        });
        workflowMetaData.value = {...(workflowMetaData.value || {}), ...positions};
        saveState(createSnapshot());
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
        workflowMetaData.value = {...(workflowMetaData.value || {}), ...currentPositions};

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

        console.log('Clearing all meta information (positions and transition labels)');
        
        // Очищаем все meta данные - сбрасываем до null, а fallback в компонентах даст {}
        workflowMetaData.value = null;
        
        // Очищаем сохраненные исходные позиции
        initialPositions.value = {};
        initialTransitionLabels.value = {};
        
        // Перегенерируем nodes без сохраненных позиций
        generateNodes();

        // Уведомляем все рёбра о необходимости сброса позиций
        eventBus.$emit('reset-edge-positions');

        console.log('Reset to default state completed - all meta data cleared');
        
        // Сохраняем состояние для undo/redo после сброса
        saveState(createSnapshot());
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
                fitView({
                    padding: 0.5,
                    includeHiddenNodes: false,
                    minZoom: 0.5,
                    maxZoom: 1
                });
            }, 50);

            saveState(createSnapshot());

        } catch (error) {
            console.log('User cancelled state creation');
        }
    }

    function autoLayout() {
        const parsed = JSON.parse(canvasData.value);
        const states = parsed.states || {};
        const initialState = parsed.initialState;

        const positions = applyAutoLayout(states, initialState);

        const randomizedPositions = {};
        Object.keys(positions).forEach(nodeId => {
            const basePosition = positions[nodeId];

            const randomOffsetX = (Math.random() - 0.5) * 200; // ±100px
            const randomOffsetY = (Math.random() - 0.5) * 160; // ±80px

            randomizedPositions[nodeId] = {
                x: basePosition.x + randomOffsetX,
                y: basePosition.y + randomOffsetY
            };
        });

        nodes.value = nodes.value.map((node: WorkflowNode) => ({
            ...node,
            position: randomizedPositions[node.id] || node.position
        }));

        workflowMetaData.value = {...(workflowMetaData.value || {}), ...randomizedPositions};

        eventBus.$emit('reset-edge-positions');

        saveState(createSnapshot());
    }

    function handleUpdateTransitionLabelPosition(eventData: any) {
        const {transitionId, offset} = eventData;

        const metaData: any = {...(workflowMetaData.value || {})};

        if (!metaData.transitionLabels) {
            metaData.transitionLabels = {};
        }

        metaData.transitionLabels[transitionId] = offset;
        workflowMetaData.value = metaData;

        saveState(createSnapshot());
    }

    function onUpdateWorkflowMetaDialog(data: any) {
        workflowMetaData.value = data;
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
        if (metaDataDebounceTimer) {
            clearTimeout(metaDataDebounceTimer);
        }
    });

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let metaDataDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isUndoRedoOperation = false;
    let isMetaDataSaving = false;

    function createSnapshot(): string {
        return JSON.stringify({
            canvas: canvasData.value,
            meta: workflowMetaData.value
        });
    }

    function loadSnapshot(snapshot: string) {
        try {
            isUndoRedoOperation = true;
            isMetaDataSaving = true;
            const parsed = JSON.parse(snapshot);
            canvasData.value = parsed.canvas || '';
            workflowMetaData.value = parsed.meta || {};
            generateNodes();
            nextTick(() => {
                isUndoRedoOperation = false;
                isMetaDataSaving = false;
            });
        } catch (e) {
            console.error('Failed to load snapshot', e);
            isUndoRedoOperation = false;
            isMetaDataSaving = false;
        }
    }

    watch(canvasData, (newValue) => {
        if (!isUndoRedoOperation) {
            // не сохраняем тут snapshot, отдельные операции сохраняют
        }
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            generateNodes();
        }, 300);

        if (!isUndoRedoOperation) {
            helperStorage.set(workflowCanvasDataKey.value, newValue);
        }
    });

    watch(workflowMetaData, (newValue) => {
        if (isUndoRedoOperation || isMetaDataSaving) return;
        
        if (metaDataDebounceTimer) clearTimeout(metaDataDebounceTimer);
        metaDataDebounceTimer = setTimeout(() => {
            isMetaDataSaving = true;
            helperStorage.set(workflowMetaDataKey.value, newValue);
            isMetaDataSaving = false;
        }, 100);
    }, { deep: true })

    // Watch на изменение technicalId для загрузки данных соответствующего чата
    watch(() => props.technicalId, (newTechnicalId, oldTechnicalId) => {
        if (newTechnicalId !== oldTechnicalId) {
            console.log(`🔄 Switching chat from ${oldTechnicalId} to ${newTechnicalId}`);
            loadDataForCurrentId();
            // Перегенерируем nodes после загрузки данных
            nextTick(() => {
                generateNodes();
            });
        }
    }, { immediate: false })

    function undoAction() {
        const previousState = undo();
        if (previousState !== null) {
            isUndoRedoOperation = true;
            loadSnapshot(previousState);
            nextTick(() => {
                isUndoRedoOperation = false;
            });
        }
    }

    function redoAction() {
        const nextState = redo();
        if (nextState !== null) {
            isUndoRedoOperation = true;
            loadSnapshot(nextState);
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

    function resetAllTransitionPositions() {
        const metaData: any = {...(workflowMetaData.value || {})};
        if (metaData.transitionLabels) {
            delete metaData.transitionLabels;
            workflowMetaData.value = metaData;
        }

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
        resetAllTransitionPositions,
        onResize,
        fitView,
        canUndo,
        canRedo,
        undoAction,
        redoAction,
        isDraggingConnection,
        createSnapshot,
        loadSnapshot,
    };
}
