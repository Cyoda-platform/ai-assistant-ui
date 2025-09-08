/**
 * Dagre-based layout utilities for workflow editor
 * Simpler alternative to ELK with better support for dynamic node sizing
 */

import dagre from 'dagre';
import { resolveTransitionCollisions } from './forceDirectedLayout';

export interface NodePosition {
  x: number;
  y: number;
}

// Explicit workflow types (same as in smartLayout.ts)
export interface Transition {
  next: string;
  condition?: unknown;
  criteria?: unknown;
  criterion?: unknown;
  name?: string;
  manual?: boolean;
  processors?: Array<{
    name: string;
    config?: Record<string, unknown>;
  }>;
}

export type Transitions = Array<Transition> | Record<string, Transition>;

export interface WorkflowState {
  transitions?: Transitions;
  [key: string]: unknown;
}

export type WorkflowStates = Record<string, WorkflowState>;

// Функция для расчета ширины узла на основе названия
function calculateNodeWidth(stateName: string, isVertical: boolean): number {
  const baseWidth = isVertical ? 160 : 200; // Уменьшаем базовую ширину
  
  if (isVertical) {
    // При вертикальном выравнивании учитываем длину названия состояния
    const textLength = stateName.length;
    // Более разумные коэффициенты: 8px на символ + 50px для отступов и кнопок
    const textWidth = textLength * 8 + 50;
    // Возвращаем максимум между базовой шириной и требуемой для текста
    return Math.max(baseWidth, textWidth);
  }
  
  return baseWidth;
}

function calculateNodeHeight(isVertical: boolean): number {
  return isVertical ? 60 : 80; // Уменьшаем высоту
}

export async function applyDagreLayout(
  states: WorkflowStates, 
  initialState: string, 
  isVertical: boolean = false
): Promise<{
  nodePositions: { [key: string]: NodePosition };
  transitionPositions: { [key: string]: {x: number, y: number} };
}> {
  console.log('🚀 applyDagreLayout called with:', {
    stateCount: Object.keys(states || {}).length,
    isVertical,
    initialState
  });
  
  const nodePositions: { [key: string]: NodePosition } = {};
  const transitionPositions: { [key: string]: {x: number, y: number} } = {};
  
  if (!states || typeof states !== 'object') {
    return { nodePositions, transitionPositions };
  }

  const stateNames = Object.keys(states);
  if (stateNames.length === 0) {
    return { nodePositions, transitionPositions };
  }

  // Создаем граф Dagre с поддержкой множественных рёбер
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({
    rankdir: isVertical ? 'TB' : 'LR',
    align: 'UL',
    nodesep: isVertical ? 100 : 150,
    ranksep: isVertical ? 150 : 200,
    marginx: 50,
    marginy: 50
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Преобразуем список переходов в массив для удобства
  function normalizeTransitions(transitions: Transitions | undefined): Transition[] {
    if (!transitions) return [];
    if (Array.isArray(transitions)) return transitions;
    return Object.values(transitions);
  }

  // Сбор всех переходов между состояниями
  const allTransitions: Array<{
    from: string;
    to: string;
    name?: string;
    transitionKey: string;
  }> = [];

  // Мониторинг размеров для узлов
  const nodeWidths = new Map<string, number>();
  const nodeHeights = new Map<string, number>();

  // Добавляем узлы и рёбра в граф
  for (const stateName of stateNames) {
    const state = states[stateName];
    const transitions = normalizeTransitions(state.transitions);
    
    const nodeWidth = calculateNodeWidth(stateName, isVertical);
    const nodeHeight = calculateNodeHeight(isVertical);
    
    nodeWidths.set(stateName, nodeWidth);
    nodeHeights.set(stateName, nodeHeight);
    
    g.setNode(stateName, { 
      width: nodeWidth, 
      height: nodeHeight,
      label: stateName
    });
    
    transitions.forEach((transition, idx) => {
      if (transition.next && states[transition.next]) {
        // Используем ||| как разделитель для pairKey (исправляем проблему с underscores)
        const transitionKey = `${stateName}|||${transition.next}|||${idx}`;
        
        allTransitions.push({
          from: stateName,
          to: transition.next,
          name: transition.name,
          transitionKey
        });

        // Добавляем ребро с уникальным именем для multigraph
        g.setEdge(stateName, transition.next, { 
          id: transitionKey,
          label: transition.name || ''
        }, transitionKey);
      }
    });
  }

  console.log('📝 Graph setup complete:', {
    nodes: g.nodes().length,
    edges: g.edges().length,
    allTransitions: allTransitions.length
  });

  // Применяем layout
  dagre.layout(g);

  console.log('✨ Dagre layout complete, extracting positions...');

  // Извлекаем позиции узлов
  g.nodes().forEach(nodeId => {
    const node = g.node(nodeId);
    nodePositions[nodeId] = { x: node.x, y: node.y };
    console.log(`📍 Node ${nodeId}: (${node.x}, ${node.y}), size: ${node.width}x${node.height}`);
  });

  // Создаем карту для связывания edge ID с transition key
  const transitionMap = new Map<string, string>();
  g.edges().forEach(edge => {
    const edgeData = g.edge(edge);
    if (edgeData.id) {
      transitionMap.set(edgeData.id, edgeData.id);
    }
  });

  console.log('🔗 TransitionMap entries:', Array.from(transitionMap.entries()));

  // Группируем transitions по парам состояний для размещения
  const pairTransitions = new Map<string, Array<{
    transitionKey: string;
    name?: string;
  }>>();

  allTransitions.forEach(transition => {
    const pairKey = `${transition.from}|||${transition.to}`;
    if (!pairTransitions.has(pairKey)) {
      pairTransitions.set(pairKey, []);
    }
    pairTransitions.get(pairKey)!.push({
      transitionKey: transition.transitionKey,
      name: transition.name
    });
  });

  console.log('👥 Transition pairs:', Array.from(pairTransitions.entries()).map(([key, transitions]) => ({
    pair: key,
    count: transitions.length
  })));

  // Собираем все позиции transitions для алгоритма collision resolution
  const allTransitionPositions: Array<{
    transitionKey: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }> = [];

  // Размещаем transitions для каждой пары состояний
  for (const [pairKey, transitionGroup] of pairTransitions.entries()) {
    const [fromState, toState] = pairKey.split('|||');
    
    const fromNode = g.node(fromState);
    const toNode = g.node(toState);
    
    if (!fromNode || !toNode) {
      console.warn(`⚠️ Missing node data for pair ${pairKey}`);
      continue;
    }
    
    // Центральная точка ребра
    const baseLabelX = (fromNode.x + toNode.x) / 2;
    const baseLabelY = (fromNode.y + toNode.y) / 2;
    
    console.log(`🎯 Processing transition group for ${pairKey}:`, {
      count: transitionGroup.length,
      baseLabelX,
      baseLabelY,
      fromNode: { x: fromNode.x, y: fromNode.y },
      toNode: { x: toNode.x, y: toNode.y }
    });
    
    if (transitionGroup.length > 1) {
      // Множественные transitions между парой состояний
      const edgeVectorX = toNode.x - fromNode.x;
      const edgeVectorY = toNode.y - fromNode.y;
      const edgeLength = Math.sqrt(edgeVectorX * edgeVectorX + edgeVectorY * edgeVectorY);
      
      let perpX = 0;
      let perpY = 0;
      
      if (edgeLength > 0) {
        // Нормализованный перпендикулярный вектор
        perpX = -edgeVectorY / edgeLength;
        perpY = edgeVectorX / edgeLength;
      }
      
      // Увеличенное расстояние между labels
      const labelSpacing = 50; // Увеличено с 35 до 50
      const totalWidth = (transitionGroup.length - 1) * labelSpacing;
      const startOffset = -totalWidth / 2;
      
      transitionGroup.forEach((item, idx) => {
        const offset = startOffset + idx * labelSpacing;
        const finalLabelX = baseLabelX + perpX * offset;
        const finalLabelY = baseLabelY + perpY * offset;
        
        // Оценочные размеры transition label
        const labelWidth = 80; // Примерная ширина label
        const labelHeight = 25; // Примерная высота label
        
        allTransitionPositions.push({
          transitionKey: item.transitionKey,
          x: finalLabelX,
          y: finalLabelY,
          width: labelWidth,
          height: labelHeight
        });
        
        console.log(`➕ Added multiple transition position for ${item.transitionKey}`);
      });
    } else {
      // Одиночный transition
      const item = transitionGroup[0];
      const labelWidth = 80;
      const labelHeight = 25;
      
      allTransitionPositions.push({
        transitionKey: item.transitionKey,
        x: baseLabelX,
        y: baseLabelY,
        width: labelWidth,
        height: labelHeight
      });
      
      console.log(`➕ Added single transition position for ${item.transitionKey}`);
    }
  }

  // Алгоритм разрешения коллизий для всех transitions
  const resolvedPositions = resolveTransitionCollisions(
    allTransitionPositions, 
    nodePositions, 
    nodeWidths, 
    nodeHeights
  );
  
  // Преобразуем в финальный формат
  for (const position of resolvedPositions) {
    const edgeInfo = g.edges().find(edge => {
      const edgeData = g.edge(edge);
      return transitionMap.get(edgeData.id) === position.transitionKey;
    });
    
    let edgeMidX = 0;
    let edgeMidY = 0;
    
    if (edgeInfo) {
      const sourceNode = g.node(edgeInfo.v);
      const targetNode = g.node(edgeInfo.w);
      edgeMidX = (sourceNode.x + targetNode.x) / 2;
      edgeMidY = (sourceNode.y + targetNode.y) / 2;
    }
    
    transitionPositions[position.transitionKey] = {
      x: Math.round(position.x - edgeMidX),
      y: Math.round(position.y - edgeMidY)
    };
  }

  console.log('🎯 Dagre Layout Results:');
  console.log('📊 Node positions:', nodePositions);
  console.log('🏷️ Transition positions:', transitionPositions);
  console.log('👥 Transition groups:', Array.from(pairTransitions.entries()).map(([key, transitions]) => ({
    pair: key,
    count: transitions.length,
    transitions: transitions.map(t => t.transitionKey)
  })));
  console.log('🔧 Collision resolution applied for', allTransitionPositions.length, 'transitions');
  console.log('📏 Final transition positions after collision resolution:', resolvedPositions.length, 'positions');

  return { nodePositions, transitionPositions };
}
