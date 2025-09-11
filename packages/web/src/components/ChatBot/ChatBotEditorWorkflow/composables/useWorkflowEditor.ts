/**
 * Composable for workflow editor functionality
 */

import {ref, computed, provide, onMounted, onUnmounted, watch, nextTick} from 'vue';
import {useVueFlow} from '@vue-flow/core';
import {MarkerType} from '@vue-flow/core';
import {ElMessageBox, ElMessage} from 'element-plus';
import eventBus from '@/plugins/eventBus';
import HelperStorage from '@/helpers/HelperStorage';
import {
    calculateSmartPosition,
    applyAutoLayout,
    NodePosition
} from '../utils/smartLayout';
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
        layoutMode?: 'horizontal' | 'vertical';
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
        layoutMode?: 'horizontal' | 'vertical';
        sourceStateName?: string;
        targetStateName?: string;
        allTransitions?: Array<{
            stateName: string;
            transition: WorkflowTransition;
        }>;
        isBidirectional?: boolean;
        isSingleBetweenPair?: boolean; // Флаг для единственного перехода между парой
    };
}

export function useWorkflowEditor(props: WorkflowEditorProps, assistantStore?: any, emit?: any) {
    const EDITOR_WIDTH = 'chatBotEditorWorkflow:width';
    const EDITOR_MODE = 'chatBotEditorWorkflow:editorMode';
    const LAYOUT_DIRECTION = 'chatBotEditorWorkflow:layoutDirection';

    // Reactive keys for localStorage, updated when technicalId changes
    const workflowCanvasDataKey = computed(() => `chatBotEditorWorkflow:canvasData:${props.technicalId}`);
    const workflowMetaDataKey = computed(() => `chatBotEditorWorkflow:metaData:${props.technicalId}`);
    const workflowViewportKey = computed(() => `chatBotEditorWorkflow:viewport:${props.technicalId}`);

    const helperStorage = new HelperStorage();

    // Function to load data for current technicalId
    const loadDataForCurrentId = () => {
        const canvasDataFromStorage = helperStorage.get(workflowCanvasDataKey.value, null);
        const metaDataFromStorage = helperStorage.get(workflowMetaDataKey.value, null);

        // If canvasDataFromStorage is already a string - use as is, otherwise stringify
        const canvasDataString = typeof canvasDataFromStorage === 'string'
            ? canvasDataFromStorage
            : (canvasDataFromStorage ? JSON.stringify(canvasDataFromStorage, null, 2) : null);

        // Set loading flag to prevent unnecessary saves during data loading
        isLoadingData = true;
        
        canvasData.value = canvasDataString || '';
        workflowMetaData.value = metaDataFromStorage || '';
        
        // Reset loading flag after assignment
        isLoadingData = false;

        // Clear undo/redo history when switching chat - initialize with current data
        initialize(createSnapshot());

        // Clear positions for new chat
        initialPositions.value = {};
        initialTransitionLabels.value = {};
    };

    // Initialize with empty data - will be loaded in onMounted or when technicalId changes
    const canvasData = ref('');
    const editorSize = ref(helperStorage.get(EDITOR_WIDTH, '50%'));
    const editorMode = ref(helperStorage.get(EDITOR_MODE, 'editorPreview'));
    const layoutDirection = ref<'horizontal' | 'vertical'>(helperStorage.get(LAYOUT_DIRECTION, 'vertical'));
    const isLoading = ref(false);
    const editorActions = ref<EditorAction[]>([]);

    // Initialize editor actions
    function initializeEditorActions() {
        if (import.meta.env.VITE_IS_WORKFLOW_ELECTRON) return false;
        if (!assistantStore) {
            editorActions.value = [];
            return;
        }

        const actions = createWorkflowEditorActions({
            technicalId: props.technicalId,
            assistantStore,
            isLoading,
            currentFile: ref(null), // Workflow editor doesn't support file attachments yet
            onAnswer: emit ? (data) => {
                emit('answer', data);
            } : undefined
        });

        editorActions.value = actions;
    }

    initializeEditorActions();
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

    const isDraggingConnection = ref(false);
    const pendingHandleConnections = ref<Record<string, { sourceHandle: string; targetHandle: string }>>({});

    const {setViewport, fitView, getViewport, vueFlowRef} = useVueFlow();

    const workflowMetaData = ref<any>({});

    // Initialize undo/redo with current canvasData instead of empty string - moved after workflowMetaData declaration
    initialize(createSnapshot());

    // Custom fitView that includes transition labels - with proper boundary calculation
    function fitViewIncludingTransitions(options: { padding?: number } = {}) {
        if (!vueFlowRef.value) return;

        // Layout-specific padding to handle different arrangements
        let padding;
        if (layoutDirection.value === 'horizontal') {
            // Horizontal layout needs more padding due to wider spread and transition labels
            padding = Math.min((options.padding || 100) / 1000, 0.1);
        } else {
            // Vertical layout uses standard padding
            padding = Math.min((options.padding || 50) / 1000, 0.05);
        }

        // Get all node positions with dynamic sizing
        const isVertical = layoutDirection.value === 'vertical';
        const nodeRects = nodes.value.map(node => ({
            x: node.position.x,
            y: node.position.y,
            width: 200, // Примерная ширина для расчетов коллизий
            height: isVertical ? 80 : 100
        }));

        // Get transition label positions from metadata
        const transitionLabels = workflowMetaData.value?.transitionLabels || {};
        const labelRects: Array<{x: number, y: number, width: number, height: number}> = [];

        for (const [transitionId, labelOffset] of Object.entries(transitionLabels)) {
            // Find the corresponding edge to get the base position
            const edge = edges.value.find(e => e.data?.transitionId === transitionId);
            if (edge) {
                const sourceNode = nodes.value.find(n => n.id === edge.source);
                const targetNode = nodes.value.find(n => n.id === edge.target);

                if (sourceNode && targetNode) {
                    // Calculate the edge midpoint
                    const midX = (sourceNode.position.x + targetNode.position.x) / 2;
                    const midY = (sourceNode.position.y + targetNode.position.y) / 2;

                    // Add the label offset
                    const offset = labelOffset as { x: number; y: number };
                    const labelX = midX + offset.x;
                    const labelY = midY + offset.y;

                    // Estimate label size based on transition name length
                    const transitionName = transitionId.split('-').pop() || 'transition';
                    const labelWidth = Math.max(transitionName.length * 8 + 40, 100);
                    const labelHeight = 30;

                    labelRects.push({
                        x: labelX - labelWidth / 2,
                        y: labelY - labelHeight / 2,
                        width: labelWidth,
                        height: labelHeight
                    });
                }
            }
        }

        // Combine all rectangles (nodes + transition labels)
        const allRects = [...nodeRects, ...labelRects];

        if (allRects.length === 0) {
            fitView({
                minZoom: 0.7,
                maxZoom: 2.0,
                duration: 0
            });
            return;
        }

        // Calculate bounding box that includes both nodes and transition labels
        const minX = Math.min(...allRects.map(r => r.x));
        const minY = Math.min(...allRects.map(r => r.y));
        const maxX = Math.max(...allRects.map(r => r.x + r.width));
        const maxY = Math.max(...allRects.map(r => r.y + r.height));

        const bounds = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };

        // Apply minimal padding
        const paddingX = bounds.width * padding;
        const paddingY = bounds.height * padding;

        const paddedBounds = {
            x: bounds.x - paddingX / 2,
            y: bounds.y - paddingY / 2,
            width: bounds.width + paddingX,
            height: bounds.height + paddingY
        };

        // Use fitBounds but with controlled zoom constraints
        const containerWidth = vueFlowRef.value.offsetWidth;
        const containerHeight = vueFlowRef.value.offsetHeight;

        // Account for toolbar height - EditorViewMode (~50px) and any other top elements
        const toolbarHeight = 60; // Estimated height for toolbar and padding
        const availableHeight = containerHeight - toolbarHeight;

        // Calculate zoom to fit the padded bounds with layout-specific adjustments
        const zoomX = containerWidth / paddedBounds.width;
        const zoomY = availableHeight / paddedBounds.height;
        let targetZoom = Math.min(zoomX, zoomY);

        // Apply different zoom constraints based on layout direction
        if (layoutDirection.value === 'horizontal') {
            // Horizontal layout can be very wide, allow very small zoom for complete fit
            targetZoom = Math.max(0.2, Math.min(1.5, targetZoom));
        } else {
            // Vertical layout is more compact, use standard zoom range
            targetZoom = Math.max(0.7, Math.min(2.0, targetZoom));
        }

        // Calculate center position, accounting for toolbar offset
        const centerX = paddedBounds.x + paddedBounds.width / 2;
        const centerY = paddedBounds.y + paddedBounds.height / 2;

        // Adjust Y position to account for toolbar height - center content in available space
        const availableCenterY = (containerHeight - toolbarHeight) / 2 + toolbarHeight;

        // Set viewport directly without animation
        setViewport({
            x: -centerX * targetZoom + containerWidth / 2,
            y: -centerY * targetZoom + availableCenterY,
            zoom: targetZoom
        });
    }

    // Save and restore viewport (zoom and position)
    const saveViewport = () => {
        const viewport = getViewport();
        helperStorage.set(workflowViewportKey.value, viewport);
    };

    const restoreViewport = () => {
        const savedViewport = helperStorage.get(workflowViewportKey.value, null);
        if (savedViewport && vueFlowRef.value) {
            // Instant restore without animation to prevent jerks
            setViewport(savedViewport);
        }
    };

    // Initialize layoutDirection from metadata, if available
    const metaLayoutDirection = workflowMetaData.value?.layoutDirection;
    if (metaLayoutDirection && (metaLayoutDirection === 'horizontal' || metaLayoutDirection === 'vertical')) {
        layoutDirection.value = metaLayoutDirection;
        helperStorage.set(LAYOUT_DIRECTION, metaLayoutDirection);
    }

    const initialPositions = ref<{ [key: string]: NodePosition }>({});
    const initialTransitionLabels = ref<{ [key: string]: { x: number; y: number } }>({});

    // Helper function to update metadata while preserving layoutDirection
    const updateWorkflowMetaData = (newData: any) => {
        const updatedData = {
            ...workflowMetaData.value,
            ...newData,
            layoutDirection: layoutDirection.value
        };
        workflowMetaData.value = updatedData;
        return updatedData;
    };

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
            const pairCount = transitions.length;
            transitions.forEach((transitionInfo, index) => {
                const {transitionId, source, target, transitionData} = transitionInfo;
                const internalTransitionId = `${source}-${transitionId}`;

                const sourceNode = nodes.value.find(n => n.id === source);
                const targetNode = nodes.value.find(n => n.id === target);
                
                // Skip edge creation if source or target node doesn't exist
                if (!sourceNode || !targetNode) {
                    return;
                }

                // Start with auto-detected handles based on relative positions
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

                // Then override individually with any saved handles
                const savedHandles = (workflowMetaData.value as any)?.handleConnectionsByTransition?.[internalTransitionId];
                if (savedHandles) {
                    if (savedHandles.sourceHandle) sourceHandle = savedHandles.sourceHandle;
                    if (savedHandles.targetHandle) targetHandle = savedHandles.targetHandle;
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
                    id: internalTransitionId,
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
                        layoutMode: layoutDirection.value, // Добавляем информацию о режиме layout
                        sourceStateName: source, // Добавляем названия состояний для расчета размеров
                        targetStateName: target,
                        isSingleBetweenPair: pairCount === 1, // Флаг для единственного перехода между парой
                    },
                };

                result.push(edge);
            });
        }

        return result;
    });

    function cleanupStaleMetadata(currentStates: Record<string, any>) {
        const currentMetaData = workflowMetaData.value || {};
        let hasChanges = false;
        const cleanedMetaData = {...currentMetaData};

        // Get all current states and their transitions
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

        // Clear positions of non-existent states (preserve special meta sections)
        for (const stateKey of Object.keys(cleanedMetaData)) {
            if (stateKey === 'transitionLabels' || stateKey === 'handleConnectionsByTransition' || stateKey === 'layoutDirection') continue;
            if (!currentStateNames.has(stateKey)) {
                delete cleanedMetaData[stateKey];
                hasChanges = true;
            }
        }

        // Clear metadata of non-existent transitions
        if (cleanedMetaData.transitionLabels) {
            const cleanedTransitionLabels = {...cleanedMetaData.transitionLabels};
            for (const transitionId of Object.keys(cleanedTransitionLabels)) {
                // Удаляем старые Dagre-ключи с |||
                if (transitionId.includes('|||')) {
                    delete cleanedTransitionLabels[transitionId];
                    hasChanges = true;
                    continue;
                }

                // Удаляем несуществующие transitions
                if (!currentTransitionIds.has(transitionId)) {
                    delete cleanedTransitionLabels[transitionId];
                    hasChanges = true;
                }
            }
            cleanedMetaData.transitionLabels = cleanedTransitionLabels;
        }

        // Prune saved handle connections for transitions that no longer exist
        if (cleanedMetaData.handleConnectionsByTransition) {
            const cleanedHandles = {...cleanedMetaData.handleConnectionsByTransition};
            for (const transitionId of Object.keys(cleanedHandles)) {
                if (!currentTransitionIds.has(transitionId)) {
                    delete cleanedHandles[transitionId];
                    hasChanges = true;
                }
            }
            cleanedMetaData.handleConnectionsByTransition = cleanedHandles;
        }

        // Update metadata if there were changes
        if (hasChanges) {
            workflowMetaData.value = Object.keys(cleanedMetaData).length > 0 ? cleanedMetaData : null;
            helperStorage.set(workflowMetaDataKey.value, workflowMetaData.value);
        }
    }

    async function generateNodes(options: { skipFitView?: boolean } = {}) {
        if (!canvasData.value || canvasData.value.trim() === '') {
            nodes.value = [];
            // Clear metadata when editor is empty
            if (workflowMetaData.value) {
                workflowMetaData.value = null;
                helperStorage.set(workflowMetaDataKey.value, null);
            }
            return;
        }

    const result: WorkflowNode[] = [];
    let parsed: WorkflowData;

    const savedMeta = workflowMetaData.value || {};

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

        // Clear outdated metadata
        cleanupStaleMetadata(states);

        const initialState = parsed.initialState;

        // Decide if we need to compute fresh layout (on paste or when layoutDirection changed)
        const stateNames = Object.keys(states);
        const meta = savedMeta;
        const existingStateNames = Object.keys(meta).filter(k =>
            k !== 'transitionLabels' && 
            k !== 'handleConnectionsByTransition' && 
            k !== 'layoutDirection' &&
            k !== 'initialState' &&
            k !== 'usingDagre'
        );

        // Check if we have any saved positioning data (node positions OR transition labels)
        const hasNodePositions = existingStateNames.length > 0;
        const hasTransitionPositions = meta.transitionLabels && Object.keys(meta.transitionLabels).length > 0;
        const hasExistingPositions = hasNodePositions || hasTransitionPositions;

        // Only trigger fresh layout if:
        // 1. No existing positions at all (first time)
        // 2. Layout direction changed
        // 3. Major structural changes (not just adding/removing one state)
        // 4. Complete workflow replacement (when user pastes new workflow)
        const layoutDirectionChanged = meta.layoutDirection && meta.layoutDirection !== layoutDirection.value;
        const isAddingNewState = stateNames.length === existingStateNames.length + 1 &&
                                 existingStateNames.every(name => stateNames.includes(name));
        const isRemovingState = stateNames.length === existingStateNames.length - 1 &&
                               stateNames.every(name => existingStateNames.includes(name));
                               stateNames.every(name => existingStateNames.includes(name));

        // Check if this is a complete workflow replacement (major structural change)
        const commonStates = stateNames.filter(name => existingStateNames.includes(name));
        const isCompleteReplacement = hasNodePositions &&
                                    (commonStates.length < Math.min(stateNames.length, existingStateNames.length) * 0.5 ||
                                     (meta.initialState && parsed.initialState && meta.initialState !== parsed.initialState));

        // Preserve positions for single node additions/removals, but force layout for major changes
        // Only check state count differences if we have existing node positions (not just transition positions)
        const stateCountChanged = hasNodePositions && 
                                 (!isAddingNewState && !isRemovingState && stateNames.length !== existingStateNames.length);
        
        const needFreshLayout = !hasExistingPositions || layoutDirectionChanged || isCompleteReplacement || stateCountChanged;

        // Mark metadata as using Dagre if not already marked, but don't force layout reset
        if (hasExistingPositions && !meta.usingDagre && !needFreshLayout) {
            workflowMetaData.value = {
                ...(workflowMetaData.value || {}),
                usingDagre: true
            };
            helperStorage.set(workflowMetaDataKey.value, workflowMetaData.value);
        }

        if (needFreshLayout) {
            const isVertical = layoutDirection.value === 'vertical';
            const elk = await applyAutoLayout(states, initialState || 'state_initial', isVertical);
            // Persist into meta
            const newMeta: Record<string, { x: number; y: number }> = {};
            for (const k of Object.keys(elk.nodePositions)) newMeta[k] = elk.nodePositions[k];
            
            workflowMetaData.value = {
                ...(workflowMetaData.value || {}),
                ...newMeta,
                transitionLabels: {
                    ...(workflowMetaData.value?.transitionLabels || {}),
                    ...elk.transitionPositions,
                },
                layoutDirection: layoutDirection.value,
                initialState: initialState, // Сохраняем initialState для отслеживания изменений
                usingDagre: true, // Маркер для отслеживания что используется Dagre
            };
            helperStorage.set(workflowMetaDataKey.value, workflowMetaData.value);
        }

        const savedPositions = workflowMetaData.value || {};

        const shouldSaveInitialState = Object.keys(initialPositions.value).length === 0;

        if (shouldSaveInitialState) {
            const metaData: any = workflowMetaData.value || {};
            if (metaData?.transitionLabels) {
                initialTransitionLabels.value = {...metaData.transitionLabels};
            }
        }

        const nodesResult: WorkflowNode[] = [];

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

            const hasSavedPositions = Object.keys(savedPositions).length > 0;
            const position = hasSavedPositions
                ? savedPositions[stateName] || calculateSmartPosition(nodesResult)
                : calculateSmartPosition(nodesResult);

            if (shouldSaveInitialState) {
                initialPositions.value[stateName] = {...position};
            }

            // Вычисляем ширину узла для текущего layout mode - убираем, теперь CSS сам подстраивается
            // const nodeWidth = calculateNodeWidth(stateName);

            nodesResult.push({
                id: stateName,
                type: 'default',
                data: {
                    label: stateName,
                    stateName,
                    transitionCount,
                    transitions,
                    isInitial: stateName === initialState,
                    isTerminal,
                    layoutMode: layoutDirection.value, // Добавляем информацию о режиме layout
                },
                position,
            });
        }

        nodes.value = nodesResult;

        // Apply label separation after node generation to prevent sticking when inserting JSON
        nextTick(() => {
            // Transition positions will be calculated automatically when using ELK auto-layout

            // Fit view to show all nodes and transitions after JSON paste
            // Skip fitView if explicitly requested (e.g., when adding new state) or during undo/redo operations
            if (!options.skipFitView && !isUndoRedoOperation) {
                setTimeout(() => {
                    fitViewIncludingTransitions({ padding: 50 });
                }, 300); // Increased timeout to allow toolbar to render completely
            } else {
                // Skipping fitView due to skipFitView flag or undo/redo operation
            }
        });
    }

    function handleSaveCondition(eventData: any) {
        const {stateName, transitionName, transitionData, oldTransitionName, isNewTransition} = eventData;

        // Set flag to prevent fitView in watcher
        isSavingTransition = true;

        try {
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
                    name: transitionName,
                    ...transitionData
                } as WorkflowTransition;

                if (newTransition.next && !parsed.states[newTransition.next]) {
                    console.error('Target state does not exist:', newTransition.next);
                    eventBus.$emit('validation-error', {
                        message: `Target state "${newTransition.next}" does not exist. Available states: ${Object.keys(parsed.states).join(', ')}`
                    });
                    return;
                }

                state.transitions.push(newTransition);
            }
        } else {
            const searchName = oldTransitionName && oldTransitionName !== transitionName ? oldTransitionName : transitionName;
            const transitionIndex = state.transitions.findIndex(t => t.name === searchName);

            if (transitionData && typeof transitionData === 'object') {
                const updatedTransition = {
                    name: transitionName,
                    ...transitionData
                } as WorkflowTransition;

                if (updatedTransition.next && !parsed.states[updatedTransition.next]) {
                    console.error('Target state does not exist:', updatedTransition.next);
                    eventBus.$emit('validation-error', {
                        message: `Target state "${updatedTransition.next}" does not exist. Available states: ${Object.keys(parsed.states).join(', ')}`
                    });
                    return;
                }

                if (transitionIndex !== -1) {
                    state.transitions[transitionIndex] = updatedTransition;
                } else {
                    state.transitions.push(updatedTransition);
                }
            }
        }


        // If this is a newly created transition, persist the chosen handle points (if captured during connect)
        if (isNewTransition && transitionData?.next) {
            const connectionKey = `${stateName}-${transitionData.next}`;
            const pending = pendingHandleConnections.value[connectionKey];
            if (pending) {
                const meta = (workflowMetaData.value || {}) as any;
                if (!meta.handleConnectionsByTransition) meta.handleConnectionsByTransition = {};
                const internalTransitionId = `${stateName}-${transitionName}`;
                meta.handleConnectionsByTransition[internalTransitionId] = {
                    sourceHandle: pending.sourceHandle,
                    targetHandle: pending.targetHandle,
                };
                // assign back
                workflowMetaData.value = meta;
                // clear pending
                delete pendingHandleConnections.value[connectionKey];
            }
        }

        // Save current node positions too
        workflowMetaData.value = {...(workflowMetaData.value || {}), ...currentPositions};

        // Update transitionLabels when renaming transition
        if (!isNewTransition && oldTransitionName && oldTransitionName !== transitionName) {
            const currentMetaData = workflowMetaData.value || {};
            if (currentMetaData.transitionLabels) {
                const oldTransitionId = `${stateName}-${oldTransitionName}`;
                const newTransitionId = `${stateName}-${transitionName}`;

                if (currentMetaData.transitionLabels[oldTransitionId]) {
                    // Transfer position to new key
                    currentMetaData.transitionLabels[newTransitionId] = currentMetaData.transitionLabels[oldTransitionId];
                    delete currentMetaData.transitionLabels[oldTransitionId];
                    workflowMetaData.value = currentMetaData;
                    // Metadata will be saved automatically via watch
                }
            }
        }

        canvasData.value = JSON.stringify(parsed, null, 2);

        // Immediately regenerate nodes without fitView to prevent viewport changes
        generateNodes({ skipFitView: true });

        if (assistantStore && assistantStore.selectedAssistant) {
            assistantStore.selectedAssistant.workflow_data = canvasData.value;
        }

        eventBus.$emit('transition-saved-successfully');

        setTimeout(() => saveState(createSnapshot()), 0);
        } finally {
            // Reset flag with delay to ensure watcher doesn't trigger fitView
            setTimeout(() => {
                isSavingTransition = false;
            }, 500);
        }
    }

    function handleDeleteTransition(eventData: any) {
        const {stateName, transitionName} = eventData;

        // Set flag to prevent fitView in watcher
        isSavingTransition = true;

        try {
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

                // Immediately regenerate nodes without fitView to prevent viewport changes
                generateNodes({ skipFitView: true });

                saveState(createSnapshot());
            } else {
                console.warn('Transition not found:', transitionName, 'in state:', stateName);
            }
        } finally {
            // Reset flag with delay to ensure watcher doesn't trigger fitView
            setTimeout(() => {
                isSavingTransition = false;
            }, 500);
        }
    }

    function handleDeleteState(eventData: any) {
        const {stateName} = eventData;

        // Set flag to prevent fitView in watcher
        isDeletingState = true;

        try {
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

            // Immediately regenerate nodes without fitView to prevent viewport changes
            generateNodes({ skipFitView: true });

            if (assistantStore && assistantStore.selectedAssistant) {
                assistantStore.selectedAssistant.workflow_data = canvasData.value;
            }

            saveState(createSnapshot());
        } finally {
            // Reset flag with delay to ensure watcher doesn't trigger fitView
            setTimeout(() => {
                isDeletingState = false;
            }, 500);
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

        // Set flag to prevent fitView in watcher (using same flag as state deletion since it's structural change)
        isDeletingState = true;

        try {
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

            // Create new states object while preserving order
            const newStates = {};
            Object.keys(parsed.states).forEach(stateName => {
                if (stateName === oldName) {
                    // Replace old name with new one in the same position
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

            // Immediately regenerate nodes without fitView to prevent viewport changes
            generateNodes({ skipFitView: true });

            if (assistantStore && assistantStore.selectedAssistant) {
                assistantStore.selectedAssistant.workflow_data = canvasData.value;
            }

            saveState(createSnapshot());
        } finally {
            // Reset flag with delay to ensure watcher doesn't trigger fitView
            setTimeout(() => {
                isDeletingState = false;
            }, 500);
        }
    }

    function handleChangeTransitionTarget(eventData: any) {
        const {stateName, transitionName, newTarget} = eventData;

        // Set flag to prevent fitView in watcher
        isSavingTransition = true;

        try {
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

                // Immediately regenerate nodes without fitView to prevent viewport changes
                generateNodes({ skipFitView: true });

                saveState(createSnapshot());
            } else {
                console.warn('Transition not found:', transitionName, 'in state:', stateName);
            }
        } finally {
            // Reset flag with delay to ensure watcher doesn't trigger fitView
            setTimeout(() => {
                isSavingTransition = false;
            }, 500);
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

        // First, try to detect an exact handle (side + kind) under cursor
        const handleInfo = findHandleAtPosition(eventData.mouseX, eventData.mouseY);
        if (handleInfo) {
            const { nodeId: dropNodeId, side, kind } = handleInfo;
            const internalTransitionId = currentDraggedTransition.value.transitionId;
            const sourceNode = currentDraggedTransition.value.sourceNode;
            const currentTargetNode = currentDraggedTransition.value.targetNode;

            // If dropped on same target node (any handle), update only target handle
            if (dropNodeId === currentTargetNode) {
                const targetHandle = `${side}-target` as const;
                upsertTransitionHandles(internalTransitionId, { targetHandle });
                generateNodes({ skipFitView: true });
                ElMessage.success(`Target handle set to ${targetHandle}`);
            } else if (dropNodeId === sourceNode) {
                // Dropped on the source node (any handle) -> update only source handle
                const sourceHandle = `${side}-source` as const;
                upsertTransitionHandles(internalTransitionId, { sourceHandle });
                generateNodes({ skipFitView: true });
                ElMessage.success(`Source handle set to ${sourceHandle}`);
            } else if (dropNodeId !== sourceNode && (kind === 'target' || kind === 'source')) {
                // Dropped on another node's target handle -> move transition AND persist chosen side
                const targetHandle = `${side}-target` as const;
                upsertTransitionHandles(internalTransitionId, { targetHandle });
                moveTransitionToNode(internalTransitionId, sourceNode, dropNodeId);
            } else {
                console.log('⚠️ Ignored drop: either same as source node or non-target handle');
            }
        } else {
            // Fallback: try to resolve just a node under cursor and deduce side by geometry
            const nodeUnderCursor = findNodeAtPosition(eventData.mouseX, eventData.mouseY);

            const internalTransitionId = currentDraggedTransition.value.transitionId;
            const sourceNode = currentDraggedTransition.value.sourceNode;
            const currentTargetNode = currentDraggedTransition.value.targetNode;

            if (nodeUnderCursor === currentTargetNode) {
                const side = computeDropSideForNode(eventData.mouseX, eventData.mouseY, nodeUnderCursor);
                if (side) {
                    const targetHandle = `${side}-target` as const;
                    upsertTransitionHandles(internalTransitionId, { targetHandle });
                    generateNodes({ skipFitView: true });
                    ElMessage.success(`Target handle set to ${targetHandle}`);
                } else {
                    console.log('⚠️ Could not determine side for target node');
                }
            } else if (nodeUnderCursor === sourceNode) {
                const side = computeDropSideForNode(eventData.mouseX, eventData.mouseY, nodeUnderCursor);
                if (side) {
                    const sourceHandle = `${side}-source` as const;
                    upsertTransitionHandles(internalTransitionId, { sourceHandle });
                    generateNodes({ skipFitView: true });
                    ElMessage.success(`Source handle set to ${sourceHandle}`);
                } else {
                    console.log('⚠️ Could not determine side for source node');
                }
            } else if (nodeUnderCursor && nodeUnderCursor !== sourceNode) {
                // Also try to determine side and persist for target
                const side = computeDropSideForNode(eventData.mouseX, eventData.mouseY, nodeUnderCursor);
                if (side) {
                    const targetHandle = `${side}-target` as const;
                    upsertTransitionHandles(internalTransitionId, { targetHandle });
                }
                moveTransitionToNode(internalTransitionId, sourceNode, nodeUnderCursor);
            } else {
                console.log('❌ Cannot move transition - same node or no target. NodeUnderCursor:', nodeUnderCursor, 'SourceNode:', sourceNode);
            }
        }

        currentDraggedTransition.value = null;
    }

    // Compute closest side of a node based on mouse position relative to its bounding rect/center
    function computeDropSideForNode(mouseX: number, mouseY: number, nodeId: string): 'left'|'right'|'top'|'bottom' | null {
        // Find the DOM element representing the node
        const candidates = Array.from(document.querySelectorAll('[data-id]')) as HTMLElement[];
        let nodeEl: HTMLElement | null = null;
        for (const el of candidates) {
            const id = el.getAttribute('data-id') || '';
            if (extractStateNameFromNodeId(id) === nodeId) {
                // Prefer the higher-level node element if possible
                if (el.classList.contains('vue-flow__node')) {
                    nodeEl = el;
                    break;
                }
                nodeEl = el;
            }
        }
        if (!nodeEl) return null;

        const rect = nodeEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'bottom' : 'top';
        }
    }

    // Detect exact handle (side and kind) under cursor
    function findHandleAtPosition(mouseX: number, mouseY: number): { nodeId: string; side: 'left'|'right'|'top'|'bottom'; kind: 'source'|'target' } | null {
        const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);
        if (!elementUnderCursor) return null;

        const handlerElement = elementUnderCursor.closest('.vue-flow__handle') as HTMLElement | null;
        if (!handlerElement) return null;

        const nodeElement = handlerElement.closest('[data-id]') as HTMLElement | null;
        if (!nodeElement) return null;

        const fullNodeId = nodeElement.getAttribute('data-id') || '';
        const nodeId = extractStateNameFromNodeId(fullNodeId);

        // Determine side from class or id
        const classList = Array.from(handlerElement.classList);
        let side: 'left'|'right'|'top'|'bottom' | null = null;
        if (classList.some(c => c.includes('vue-flow__handle-left'))) side = 'left';
        else if (classList.some(c => c.includes('vue-flow__handle-right'))) side = 'right';
        else if (classList.some(c => c.includes('vue-flow__handle-top'))) side = 'top';
        else if (classList.some(c => c.includes('vue-flow__handle-bottom'))) side = 'bottom';

        if (!side) {
            const idAttr = handlerElement.getAttribute('id') || '';
            if (idAttr.startsWith('left-')) side = 'left';
            else if (idAttr.startsWith('right-')) side = 'right';
            else if (idAttr.startsWith('top-')) side = 'top';
            else if (idAttr.startsWith('bottom-')) side = 'bottom';
        }

        if (!side) return null;

        // Determine kind (source/target)
        let kind: 'source'|'target' = 'target';
        const idAttr = handlerElement.getAttribute('id') || '';
        if (idAttr.endsWith('-source')) kind = 'source';
        else if (idAttr.endsWith('-target')) kind = 'target';
        else if (classList.includes('target-invisible')) kind = 'target';
        else if (classList.includes('universal-handle')) kind = 'source';

        return { nodeId, side, kind };
    }

    // Upsert saved handles for a transition in metadata
    function upsertTransitionHandles(internalTransitionId: string, partial: { sourceHandle?: string; targetHandle?: string }) {
        const meta = (workflowMetaData.value || {}) as any;
        if (!meta.handleConnectionsByTransition) meta.handleConnectionsByTransition = {};
        const existing = meta.handleConnectionsByTransition[internalTransitionId] || {};
        meta.handleConnectionsByTransition[internalTransitionId] = {
            ...existing,
            ...partial,
        };
        workflowMetaData.value = meta;
        saveState(createSnapshot());
    }

    function findNodeAtPosition(mouseX: number, mouseY: number): string | null {
        const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);

        if (elementUnderCursor) {
            const handlerElement = elementUnderCursor.closest('.vue-flow__handle');
            if (handlerElement) {
                const nodeElement = handlerElement.closest('[data-id]');
                if (nodeElement) {
                    const fullNodeId = nodeElement.getAttribute('data-id');

                    // Извлекаем имя состояния из полного ID handle
                    // Формат: "vue-flow-1-STATE_NAME-handle-type"
                    if (fullNodeId) {
                        const nodeId = extractStateNameFromNodeId(fullNodeId);
                        return nodeId;
                    }
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
                const fullNodeId = nodeElement.getAttribute('data-id');

                if (fullNodeId) {
                    const nodeId = extractStateNameFromNodeId(fullNodeId);
                    return nodeId;
                }
            }
        }
        return null;
    }

    // Вспомогательная функция для извлечения имени состояния из полного ID
    function extractStateNameFromNodeId(fullNodeId: string): string {
        // Обрабатываем разные форматы ID:
        // 1. "vue-flow-1-STATE_NAME-handle-type" (для handles)
        // 2. "STATE_NAME" (для узлов)

        if (fullNodeId.includes('-')) {
            // Для handles типа "vue-flow-1-initialized_chat-bottom-source-source"
            const parts = fullNodeId.split('-');
            if (parts.length >= 3 && parts[0] === 'vue' && parts[1] === 'flow') {
                // Найдем индекс после "vue-flow-N-"
                const stateNameParts: string[] = [];
                let foundStateStart = false;

                for (let i = 3; i < parts.length; i++) {
                    const part = parts[i];
                    // Остановимся когда дойдем до handle-типов
                    if (['top', 'bottom', 'left', 'right', 'source', 'target'].includes(part)) {
                        break;
                    }
                    stateNameParts.push(part);
                    foundStateStart = true;
                }

                if (foundStateStart && stateNameParts.length > 0) {
                    return stateNameParts.join('-');
                }
            }
        }

        // Если не handle, возвращаем как есть
        return fullNodeId;
    }

    function moveTransitionToNode(transitionId: string, sourceNode: string, targetNode: string) {
        // Set flag to prevent fitView in watcher
        isSavingTransition = true;

        try {
            // Сохраняем текущие позиции узлов перед изменением
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

            const sourceState = parsed.states[sourceNode];
            const targetState = parsed.states[targetNode];

            if (!sourceState || !targetState) {
                console.error('Source or target state not found');
                return;
            }

            if (sourceState.transitions) {
                // transitionId в формате "sourceState-transitionName", извлекаем имя transition
                let actualTransitionName: string;
                if (transitionId.includes('-') && transitionId.startsWith(sourceNode + '-')) {
                    // Формат: "sourceState-transitionName"
                    actualTransitionName = transitionId.substring(sourceNode.length + 1);
                } else {
                    // Fallback: используем transitionId как есть
                    actualTransitionName = transitionId;
                }

                const transitionIndex = sourceState.transitions.findIndex(t => t.name === actualTransitionName);

                if (transitionIndex !== -1) {
                    sourceState.transitions[transitionIndex].next = targetNode;

                    // Сохраняем текущие позиции в метаданных чтобы не потерять расположение
                    workflowMetaData.value = {...(workflowMetaData.value || {}), ...currentPositions};

                    canvasData.value = JSON.stringify(parsed, null, 2);

                    if (assistantStore && assistantStore.selectedAssistant) {
                        assistantStore.selectedAssistant.workflow_data = canvasData.value;
                    }

                    // Regenerate nodes preserving current positions, without fitView
                    generateNodes({ skipFitView: true });

                    ElMessage.success(`Transition "${actualTransitionName}" reassigned from "${sourceNode}" to "${targetNode}"`);

                    saveState(createSnapshot());
                } else {
                    console.error(`Transition "${actualTransitionName}" not found in source state`);
                    console.error('Available transitions in state:', sourceState.transitions);
                    return;
                }
            } else {
                console.error('Source state has no transitions');
                return;
            }
        } finally {
            // Reset flag with delay to ensure watcher doesn't trigger fitView
            setTimeout(() => {
                isSavingTransition = false;
            }, 500);
        }
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
        const {source, target, sourceHandle, targetHandle} = params;

        if (!source || !target) {
            return;
        }

        // Cache the handle pair used during this drag-connect so we can persist it on save
        const key = `${source}-${target}`;
        pendingHandleConnections.value[key] = {
            sourceHandle: sourceHandle || 'right-source',
            targetHandle: targetHandle || 'left-target',
        };

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

    async function resetTransform() {
        // Используем текущее направление layout вместо принудительного сброса
        const currentDirection = layoutDirection.value;

        // Clear in-memory caches for initial positions/labels
        initialPositions.value = {};
        initialTransitionLabels.value = {};

        // Очищаем старые Dagre-ключи из существующих метаданных
        const currentMeta = workflowMetaData.value || {};
        if (currentMeta.transitionLabels) {
            const cleanedLabels = { ...currentMeta.transitionLabels };
            let hasOldKeys = false;
            for (const key of Object.keys(cleanedLabels)) {
                if (key.includes('|||')) {
                    delete cleanedLabels[key];
                    hasOldKeys = true;
                }
            }
            if (hasOldKeys) {
                console.log('🧹 resetTransform: Removed old Dagre keys from metadata');
            }
        }

        // Parse current workflow
        let parsed: WorkflowData = { states: {} } as WorkflowData;
        try {
            parsed = JSON.parse(canvasData.value || '{}');
        } catch {
            parsed = { states: {} } as WorkflowData;
        }
        const states = parsed.states || {};
        const initialState = parsed.initialState;

        // Применяем layout в текущем направлении
        const isVertical = currentDirection === 'vertical';
        const result = await applyAutoLayout(states, initialState || 'state_initial', isVertical);

        // Persist positions and label offsets in meta so generateNodes picks them up
        const metaPositions: Record<string, { x: number; y: number }> = {};
        Object.keys(result.nodePositions).forEach((id) => {
            metaPositions[id] = { ...result.nodePositions[id] };
        });

        workflowMetaData.value = {
            ...metaPositions,
            layoutDirection: currentDirection, // Сохраняем текущее направление
            transitionLabels: { ...result.transitionPositions },
        };

        helperStorage.set(workflowMetaDataKey.value, workflowMetaData.value);

        // Re-generate nodes/edges using saved positions and labels
        generateNodes();

        // Fit the view after nodes are updated
        nextTick(() => {
            fitViewIncludingTransitions();
        });

        // Save state for undo/redo after reset
        saveState(createSnapshot());
    }

    async function addNewState(clickPosition?: { x: number; y: number }) {
        try {
            // Парсим текущие данные один раз для получения списка существующих состояний
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

            const {value: stateName} = await ElMessageBox.prompt('Enter state name:', 'Add New State', {
                confirmButtonText: 'OK',
                cancelButtonText: 'Cancel',
                inputPattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                inputErrorMessage: 'State name should be alphanumeric and start with a letter or underscore',
                inputValidator: (value: string) => {
                    // Сначала проверяем базовый паттерн
                    if (!value || !value.trim()) {
                        return 'State name is required';
                    }
                    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value.trim())) {
                        return 'State name should be alphanumeric and start with a letter or underscore';
                    }
                    // Затем проверяем на дублирование
                    if (parsed.states[value.trim()]) {
                        return `State "${value.trim()}" already exists! Please choose a different name.`;
                    }
                    return true;
                }
            });

            if (!stateName || stateName.trim() === '') {
                return;
            }

            parsed.states[stateName] = {
                transitions: []
            };

            if (Object.keys(parsed.states).length === 1 && !parsed.initialState) {
                parsed.initialState = stateName;
            }

            // Set flag to prevent fitView in watcher
            isAddingNewState = true;

            // Save current viewport to restore after node generation
            const currentViewport = getViewport();

            // For new state, add it to existing metadata without regenerating everything
            const currentMeta = workflowMetaData.value || {};

            // Find a good position for the new state based on current layout direction
            const existingPositions = Object.entries(currentMeta).filter(([key]) =>
                key !== 'transitionLabels' && key !== 'handleConnectionsByTransition' && key !== 'layoutDirection' && key !== 'usingDagre'
            );

            let newStatePosition = { x: 0, y: 0 };
            
            // Use click position if provided, otherwise use automatic positioning
            if (clickPosition) {
                newStatePosition = { x: clickPosition.x, y: clickPosition.y };
            } else if (existingPositions.length > 0) {
                const positions = existingPositions.map(([, pos]) => pos as { x?: number; y?: number });
                const isVertical = layoutDirection.value === 'vertical';

                if (isVertical) {
                    // In vertical layout, place below the bottommost node with smaller step
                    const bottomY = Math.max(...positions.map(pos => (pos.y || 0)));
                    const avgX = positions.reduce((sum, pos) => sum + (pos.x || 0), 0) / positions.length;
                    newStatePosition = { x: avgX, y: bottomY + 100 };
                } else {
                    // In horizontal layout, place to the right of the rightmost node
                    const rightX = Math.max(...positions.map(pos => (pos.x || 0)));
                    const avgY = positions.reduce((sum, pos) => sum + (pos.y || 0), 0) / positions.length;
                    newStatePosition = { x: rightX + 250, y: avgY };
                }
            }

            // Add new state position to metadata
            workflowMetaData.value = {
                ...currentMeta,
                [stateName]: newStatePosition
            };

            helperStorage.set(workflowMetaDataKey.value, workflowMetaData.value);

            canvasData.value = JSON.stringify(parsed, null, 2);

            // Regenerate nodes to include the new state without triggering fitView
            generateNodes({ skipFitView: true });

            // Restore viewport after node generation
            nextTick(() => {
                setViewport(currentViewport);
                // Reset flag after watcher has had time to process (400ms > 300ms debounce)
                setTimeout(() => {
                    isAddingNewState = false;
                }, 400);
            });

            saveState(createSnapshot());

        } catch (error: unknown) {
            // Проверяем, была ли отмена пользователем
            if (error === 'cancel' || (typeof error === 'object' && error !== null && 'action' in error && (error as {action: string}).action === 'cancel')) {
                console.log('User cancelled state creation');
            } else {
                // Неожиданная ошибка - показываем уведомление
                console.error('Unexpected error during state creation:', error);
                ElMessage.error('An error occurred while creating the state');
            }

            // Reset flag in case of error with delay to handle any pending watcher calls
            setTimeout(() => {
                isAddingNewState = false;
            }, 400);
        }
    }

    async function autoLayout() {
        // Toggle direction on each autoLayout call
        layoutDirection.value = layoutDirection.value === 'horizontal' ? 'vertical' : 'horizontal';
        helperStorage.set(LAYOUT_DIRECTION, layoutDirection.value);

        const parsed = JSON.parse(canvasData.value);
        const states = parsed.states || {};
        const initialState = parsed.initialState;
        const isVertical = layoutDirection.value === 'vertical';

    const finalPositions: Record<string, { x: number; y: number }> = {};
    let allTransitionPositions: Record<string, {x: number, y: number}> = {};

        if (isVertical) {
            // Vertical mode: Dagre vertical
            const result = await applyAutoLayout(states, initialState, true);
            Object.keys(result.nodePositions).forEach(nodeId => {
                const basePosition = result.nodePositions[nodeId];
                finalPositions[nodeId] = {
                    x: basePosition.x,
                    y: basePosition.y
                };
            });
            allTransitionPositions = result.transitionPositions;
        } else {
            // Horizontal mode: Dagre horizontal
            const result = await applyAutoLayout(states, initialState, false);
            Object.keys(result.nodePositions).forEach(nodeId => {
                finalPositions[nodeId] = result.nodePositions[nodeId];
            });
            allTransitionPositions = result.transitionPositions;
        }

        nodes.value = nodes.value.map((node: WorkflowNode) => ({
            ...node,
            position: finalPositions[node.id] || node.position
        }));

        workflowMetaData.value = {
            ...(workflowMetaData.value || {}), ...finalPositions,
            layoutDirection: layoutDirection.value,
            usingDagre: true, // Маркер для отслеживания что используется Dagre
            transitionLabels: {
                ...(workflowMetaData.value?.transitionLabels || {}),
                ...allTransitionPositions
            }
        };

        saveState(createSnapshot());

        nextTick(() => {
            fitViewIncludingTransitions()
        })
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
        // Load data from localStorage first, before setting canvasData from store
        loadDataForCurrentId();
        
        // Only set from store if no data found in localStorage
        if (!canvasData.value && assistantStore && assistantStore.selectedAssistant && assistantStore.selectedAssistant.workflow_data) {
            canvasData.value = assistantStore.selectedAssistant.workflow_data;
        } else {
            console.log('🔄 Using data from localStorage, skipping store data');
        }

        // Restore saved viewport after mounting
        nextTick(() => {
            if (['preview', 'editorPreview'].includes(editorMode.value)) {
                const savedViewport = helperStorage.get(workflowViewportKey.value, null);
                if (savedViewport) {
                    restoreViewport();
                } else {
                    // If no saved viewport, apply our custom fitView with toolbar consideration
                    setTimeout(() => {
                        if (canvasData.value && canvasData.value.trim() !== '') {
                            fitViewIncludingTransitions({ padding: 50 });
                        }
                    }, 500);
                }
            }
        });

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
        if (viewportSaveTimeout) {
            clearTimeout(viewportSaveTimeout);
        }
    });

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let metaDataDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isUndoRedoOperation = false;
    let isMetaDataSaving = false;
    let isLoadingData = false;
    let isAddingNewState = false;
    let isSavingTransition = false;
    let isDeletingState = false;

    function createSnapshot(): string {
        const snapshot = JSON.stringify({
            canvas: canvasData.value || '',
            meta: workflowMetaData?.value || {}
        });

        return snapshot;
    }

    function loadSnapshot(snapshot: string) {
        try {
            isUndoRedoOperation = true;
            isMetaDataSaving = true;
            const parsed = JSON.parse(snapshot);

            // Check if this is a new format snapshot (with canvas/meta) or old format (direct workflow JSON)
            if (parsed.canvas !== undefined || parsed.meta !== undefined) {
                // New format: {canvas: ..., meta: ...}
                canvasData.value = parsed.canvas || '';
                workflowMetaData.value = parsed.meta || {};
            } else {
                // Old format: direct workflow JSON - treat as canvas data
                canvasData.value = snapshot;
                // Keep existing metadata when loading old format
            }

            generateNodes({ skipFitView: true });
            nextTick(() => {
                isUndoRedoOperation = false;
                isMetaDataSaving = false;
            });
        } catch (e) {
            console.error('❌ Failed to load snapshot', e);
            isUndoRedoOperation = false;
            isMetaDataSaving = false;
        }
    }

    watch(canvasData, (newValue) => {
        if (!isUndoRedoOperation) {
            // Save state for undo/redo when canvas changes (like JSON paste)
            saveState(createSnapshot());
        }

        // Skip watcher completely when saving transitions or deleting states since we handle it manually
        if (isSavingTransition || isDeletingState) {
            if (!isUndoRedoOperation) {
                helperStorage.set(workflowCanvasDataKey.value, newValue);
            }
            return;
        }

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            // Skip automatic fitView when adding new state, saving transitions, or deleting states
            const skipFitView = isAddingNewState || isSavingTransition || isDeletingState;
            generateNodes({ skipFitView });
        }, 300);

        if (!isUndoRedoOperation) {
            helperStorage.set(workflowCanvasDataKey.value, newValue);
        }
    });

    watch(workflowMetaData, (newValue) => {
        if (isUndoRedoOperation || isMetaDataSaving || isLoadingData) {
            console.log('🚫 Skipping workflowMetaData save due to flags:', { isUndoRedoOperation, isMetaDataSaving, isLoadingData });
            return;
        }

        if (metaDataDebounceTimer) clearTimeout(metaDataDebounceTimer);
        metaDataDebounceTimer = setTimeout(() => {
            isMetaDataSaving = true;
            helperStorage.set(workflowMetaDataKey.value, newValue);
            isMetaDataSaving = false;
        }, 100);
    }, {deep: true})

    // Watch for technicalId changes to load corresponding chat data
    watch(() => props.technicalId, (newTechnicalId, oldTechnicalId) => {
        if (newTechnicalId !== oldTechnicalId) {
            loadDataForCurrentId();
            // Regenerate nodes after data loading
            nextTick(() => {
                generateNodes();
            });
        }
    }, {immediate: false})

    function undoAction() {
        const previousState = undo();

        if (previousState !== null) {
            isUndoRedoOperation = true;
            loadSnapshot(previousState);
            nextTick(() => {
                isUndoRedoOperation = false;
            });
        } else {
            console.log('❌ No previous state to undo to');
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
        } else {
            console.log('❌ No next state to redo to');
        }
    }

    watch(editorSize, (value) => {
        helperStorage.set(EDITOR_WIDTH, value);
    })

    watch(editorMode, (value, oldValue) => {
        // Save current viewport before mode change
        if (oldValue && ['preview', 'editorPreview'].includes(oldValue)) {
            saveViewport();
        }

        helperStorage.set(EDITOR_MODE, value);

        // Restore viewport after mode change
        if (['preview', 'editorPreview'].includes(value)) {
            nextTick(() => {
                restoreViewport();
            });
        }
    })

    function resetAllTransitionPositions() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metaData: Record<string, any> = {...(workflowMetaData.value || {})};
        if (metaData.transitionLabels) {
            delete metaData.transitionLabels;
            workflowMetaData.value = metaData;
        }

        eventBus.$emit('reset-edge-positions');
    }

    provide('onConditionChange', onEdgeConditionChange);

    // Viewport change handler (zoom, pan)
    const onViewportChange = () => {
        // Save viewport with a small delay to avoid spamming localStorage
        clearTimeout(viewportSaveTimeout);
        viewportSaveTimeout = setTimeout(() => {
            saveViewport();
        }, 500);
    };

    let viewportSaveTimeout: NodeJS.Timeout;

    async function onSubmitQuestion() {
        try {
            isLoading.value = true;

            const dataRequest = {
                question: canvasData.value
            };

            const {data} = await assistantStore.postTextQuestions(props.technicalId, dataRequest);
            canvasData.value += `\n/*\n${data.message}\n*/`;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        canvasData,
        editorSize,
        editorMode,
        isLoading,
        editorActions,
        nodes,
        edges,
        workflowMetaData,
        layoutDirection,
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
        fitView: fitViewIncludingTransitions,
        onViewportChange,
        saveViewport,
        restoreViewport,
        canUndo,
        canRedo,
        undoAction,
        redoAction,
        isDraggingConnection,
        createSnapshot,
        loadSnapshot,
        onSubmitQuestion,
    };
}
