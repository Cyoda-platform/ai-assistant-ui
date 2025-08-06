/**
 * Smart node positioning algorithm inspired by Cytoscape.js
 * Handles automatic layout generation for workflow nodes
 */

export interface NodePosition {
  x: number;
  y: number;
}

export interface GraphNode {
  [key: string]: string[];
}

export interface NodesByLevel {
  [key: number]: string[];
}

export interface NodeLevels {
  [key: string]: number;
}

const LAYOUT_CONFIG = {
  LEVEL_SPACING: 400, // Увеличено для лучшей читаемости
  NODE_SPACING: 200,  // Увеличено расстояние между узлами
  VERTICAL_SPREAD: 250, // Больше вертикального пространства
  MIN_DISTANCE: 150,  // Минимальное расстояние между узлами
  PREFERRED_DISTANCE: 220, // Предпочтительное расстояние
  OPTIMIZATION_PASSES: 5, // Больше проходов оптимизации
  CENTER_PULL_FORCE: 0.2, // Меньшая сила притяжения к центру
  MAX_CENTER_DISTANCE: 400, // Больше допустимое расстояние от центра
  RANDOM_OFFSET_RANGE: 30, // Меньше случайных смещений
  SELF_LOOP_OFFSET: 40, // Больше отступ для self-loops
  TERMINAL_MIN_LEVEL: 4,
  EDGE_SEPARATION: 80, // Новый параметр для разделения рёбер
};

export function calculateSmartPosition(
  stateName: string,
  states: any,
  initialState: string
): NodePosition {
  const graph = buildGraph(states);

  const levels = calculateLevels(graph, initialState);

  const nodesByLevel = groupNodesByLevel(levels, states);

  const nodeLevel = levels[stateName] || 0;
  const nodesInLevel = nodesByLevel[nodeLevel] || [];
  const nodeIndexInLevel = nodesInLevel.indexOf(stateName);

  let x = nodeLevel * LAYOUT_CONFIG.LEVEL_SPACING;

  if (stateName === initialState) {
    x = 0;
  } else if (stateName === 'state_terminal') {
    x = Math.max(
      nodeLevel * LAYOUT_CONFIG.LEVEL_SPACING,
      (Math.max(...Object.values(levels)) + 1) * LAYOUT_CONFIG.LEVEL_SPACING
    );
  }

  let y = 0;

  if (nodesInLevel.length === 1) {
    y = 0;
  } else {
    const totalHeight = (nodesInLevel.length - 1) * LAYOUT_CONFIG.NODE_SPACING;
    const startY = -totalHeight / 2;
    y = startY + nodeIndexInLevel * LAYOUT_CONFIG.NODE_SPACING;

    const randomOffset = (Math.random() - 0.5) * LAYOUT_CONFIG.RANDOM_OFFSET_RANGE;
    y += randomOffset;
  }

  const currentState = states[stateName];
  if (currentState?.transitions) {
    const transitions = Array.isArray(currentState.transitions)
      ? currentState.transitions
      : Object.values(currentState.transitions);

    const hasSelfLoop = transitions.some((t: any) => t.next === stateName);
    const hasBackwardTransition = transitions.some((t: any) => {
      const targetLevel = levels[t.next];
      return targetLevel !== undefined && targetLevel <= nodeLevel;
    });

    if (hasSelfLoop) {
      y += LAYOUT_CONFIG.SELF_LOOP_OFFSET;
    }

    if (hasBackwardTransition && stateName !== initialState) {
      y += nodeIndexInLevel % 2 === 0
        ? -LAYOUT_CONFIG.VERTICAL_SPREAD
        : LAYOUT_CONFIG.VERTICAL_SPREAD;
    }
  }

  return { x, y };
}

export function buildGraph(states: any): GraphNode {
  const graph: GraphNode = {};

  for (const [stateName, stateData] of Object.entries(states)) {
    const state = stateData as any;
    graph[stateName] = [];

    if (state && state.transitions) {
      let transitionsArray: any[] = [];

      if (Array.isArray(state.transitions)) {
        transitionsArray = state.transitions;
      } else if (typeof state.transitions === 'object') {
        transitionsArray = Object.values(state.transitions);
      }

      for (const transition of transitionsArray) {
        if (transition && transition.next && transition.next !== stateName) {
          graph[stateName].push(transition.next);
        }
      }
    }
  }

  return graph;
}

export function calculateLevels(graph: GraphNode, initialState: string): NodeLevels {
  const levels: NodeLevels = {};
  const visited = new Set<string>();
  const queue: { node: string; level: number }[] = [];

  if (initialState && graph[initialState] !== undefined) {
    queue.push({ node: initialState, level: 0 });
    levels[initialState] = 0;
  } else {
    const firstNode = Object.keys(graph)[0];
    if (firstNode) {
      queue.push({ node: firstNode, level: 0 });
      levels[firstNode] = 0;
    }
  }

  while (queue.length > 0) {
    const { node, level } = queue.shift()!;

    if (visited.has(node)) {
      continue;
    }
    visited.add(node);

    const neighbors = graph[node] || [];

    for (const neighbor of neighbors) {
      if (neighbor === node) continue;

      if (!visited.has(neighbor)) {
        let newLevel = level + 1;

        if (neighbor.includes('terminal')) {
          newLevel = Math.max(newLevel, LAYOUT_CONFIG.TERMINAL_MIN_LEVEL);
        }

        if (levels[neighbor] !== undefined && levels[neighbor] <= level) {
          continue;
        }

        if (levels[neighbor] === undefined || levels[neighbor] > newLevel) {
          levels[neighbor] = newLevel;
          queue.push({ node: neighbor, level: newLevel });
        }
      }
    }
  }

  let maxLevel = Math.max(...Object.values(levels));

  for (const nodeName of Object.keys(graph)) {
    if (levels[nodeName] === undefined) {
      maxLevel += 1;
      levels[nodeName] = maxLevel;
    }
  }

  return levels;
}

export function groupNodesByLevel(levels: NodeLevels, states: any): NodesByLevel {
  const nodesByLevel: NodesByLevel = {};

  for (const [stateName, level] of Object.entries(levels)) {
    if (!nodesByLevel[level]) {
      nodesByLevel[level] = [];
    }
    nodesByLevel[level].push(stateName);
  }

  for (const level of Object.keys(nodesByLevel)) {
      if(!nodesByLevel[parseInt(level)]) continue;
    nodesByLevel[parseInt(level)].sort((a, b) => {
      const stateA = states && states[a] as any;
      const stateB = states && states[b] as any;

      const getNodePriority = (stateName: string, state: any) => {
        if (stateName.includes('terminal')) return 0;

        if (stateName.includes('initial')) return 100;

        // Добавляем защиту от null/undefined состояний
        if (!state) return 40;

        if (state.transitions) {
          const transitionsArray = Array.isArray(state.transitions)
            ? state.transitions
            : Object.values(state.transitions);

          const hasCondition = transitionsArray.some((t: any) => t.condition || t.criteria || t.criterion);
          if (hasCondition) return 80;
        }

        if (state.transitions) {
          const transitionsArray = Array.isArray(state.transitions)
            ? state.transitions
            : Object.values(state.transitions);

          const hasSelfLoop = transitionsArray.some((t: any) => t.next === stateName);
          if (hasSelfLoop) return 60;
        }

        return 40;
      };

      const priorityA = getNodePriority(a, stateA);
      const priorityB = getNodePriority(b, stateB);

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      const getTransitionsCount = (state: any) => {
        // Добавляем защиту от null/undefined состояний
        if (!state || !state.transitions) return 0;
        return Array.isArray(state.transitions)
          ? state.transitions.length
          : Object.keys(state.transitions).length;
      };

      const transitionsA = getTransitionsCount(stateA);
      const transitionsB = getTransitionsCount(stateB);

      if (transitionsA !== transitionsB) {
        return transitionsB - transitionsA;
      }

      return a.localeCompare(b);
    });
  }

  return nodesByLevel;
}

export function optimizePositions(positions: { [key: string]: NodePosition }): void {
  const positionArray = Object.entries(positions);

  for (let pass = 0; pass < LAYOUT_CONFIG.OPTIMIZATION_PASSES; pass++) {
    for (let i = 0; i < positionArray.length; i++) {
      for (let j = i + 1; j < positionArray.length; j++) {
        const [, pos1] = positionArray[i];
        const [, pos2] = positionArray[j];

        const distance = Math.sqrt(
          Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
        );

        if (distance < LAYOUT_CONFIG.MIN_DISTANCE) {
          const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
          const moveDistance = (LAYOUT_CONFIG.MIN_DISTANCE - distance) / 2;

          pos1.x -= Math.cos(angle) * moveDistance;
          pos1.y -= Math.sin(angle) * moveDistance;
          pos2.x += Math.cos(angle) * moveDistance;
          pos2.y += Math.sin(angle) * moveDistance;
        } else if (distance < LAYOUT_CONFIG.PREFERRED_DISTANCE) {
          const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
          const moveDistance = (LAYOUT_CONFIG.PREFERRED_DISTANCE - distance) / 8;

          pos1.x -= Math.cos(angle) * moveDistance;
          pos1.y -= Math.sin(angle) * moveDistance;
          pos2.x += Math.cos(angle) * moveDistance;
          pos2.y += Math.sin(angle) * moveDistance;
        }
      }
    }
  }

  const states = Object.keys(positions);
  const centerY = states.reduce((sum, state) => sum + positions[state].y, 0) / states.length;

  for (const state of states) {
    const currentY = positions[state].y;
    const distanceFromCenter = Math.abs(currentY - centerY);

    if (distanceFromCenter > LAYOUT_CONFIG.MAX_CENTER_DISTANCE) {
      positions[state].y = currentY + (centerY - currentY) * LAYOUT_CONFIG.CENTER_PULL_FORCE;
    }
  }
}

// Функция для предотвращения пересечения рёбер
function avoidEdgeCrossings(positions: { [key: string]: NodePosition }, graph: GraphNode): void {
  const stateNames = Object.keys(positions);
  
  // Проходим несколько раз для оптимизации
  for (let pass = 0; pass < 3; pass++) {
    for (const stateName of stateNames) {
      const connections = graph[stateName] || [];
      
      // Если у узла есть соединения, стараемся расположить их так, чтобы избежать пересечений
      if (connections.length > 1) {
        // Сортируем целевые узлы по их Y координатам
        const sortedConnections = connections
          .filter(target => positions[target])
          .sort((a, b) => positions[a].y - positions[b].y);
        
        // Распределяем узлы равномерно по вертикали
        const currentPos = positions[stateName];
        if (!currentPos) continue; // Защита от отсутствия позиции
        
        const spread = LAYOUT_CONFIG.EDGE_SEPARATION * (sortedConnections.length - 1);
        
        sortedConnections.forEach((target, index) => {
          const targetPos = positions[target];
          if (!targetPos) return; // Защита от отсутствия позиции цели
          
          const desiredY = currentPos.y - spread/2 + index * LAYOUT_CONFIG.EDGE_SEPARATION;
          
          // Плавное смещение к желаемой позиции
          positions[target].y = targetPos.y * 0.7 + desiredY * 0.3;
        });
      }
    }
  }
}

// Улучшенная функция размещения в форме дерева
function arrangeAsTree(positions: { [key: string]: NodePosition }, graph: GraphNode, levels: NodeLevels): void {
  // Создаем локальную версию groupNodesByLevel без зависимости от states
  const nodesByLevel: NodesByLevel = {};
  
  for (const [stateName, level] of Object.entries(levels)) {
    if (!nodesByLevel[level]) {
      nodesByLevel[level] = [];
    }
    nodesByLevel[level].push(stateName);
  }
  
  Object.keys(nodesByLevel).forEach(levelStr => {
    const level = parseInt(levelStr);
    const nodesInLevel = nodesByLevel[level];
    
    if (!nodesInLevel || nodesInLevel.length <= 1) return;
    
    // Сортируем узлы в уровне по количеству соединений (больше соединений - ближе к центру)
    const sortedNodes = nodesInLevel.sort((a, b) => {
      const connectionsA = (graph[a] || []).length;
      const connectionsB = (graph[b] || []).length;
      return connectionsB - connectionsA;
    });
    
    // Размещаем узлы равномерно по вертикали
    const totalHeight = (sortedNodes.length - 1) * LAYOUT_CONFIG.NODE_SPACING;
    const startY = -totalHeight / 2;
    
    sortedNodes.forEach((nodeName, index) => {
      if (positions[nodeName]) {
        positions[nodeName].y = startY + index * LAYOUT_CONFIG.NODE_SPACING;
      }
    });
  });
}

export function applyAutoLayout(states: any, initialState: string): { [key: string]: NodePosition } {
  const positions: { [key: string]: NodePosition } = {};
  
  // Защита от null/undefined states
  if (!states || typeof states !== 'object') {
    return positions;
  }
  
  const stateNames = Object.keys(states);
  
  // Защита от пустого списка состояний
  if (stateNames.length === 0) {
    return positions;
  }

  let actualInitialState = initialState;
  if (!actualInitialState || !states[actualInitialState]) {
    actualInitialState = stateNames[0];
  }

  const graph = buildGraph(states);
  const levels = calculateLevels(graph, actualInitialState);

  const hasValidLevels = Object.values(levels).some(level => level > 0);

  if (!hasValidLevels) {
    // Линейное размещение если нет уровней
    stateNames.forEach((stateName, index) => {
      positions[stateName] = {
        x: index * LAYOUT_CONFIG.LEVEL_SPACING,
        y: 0
      };
    });
  } else {
    // Размещение на основе уровней
    for (const stateName of stateNames) {
      positions[stateName] = calculateSmartPosition(stateName, states, actualInitialState);
    }

    // Применяем улучшения для лучшей читаемости
    arrangeAsTree(positions, graph, levels);
    avoidEdgeCrossings(positions, graph);
    optimizePositions(positions);
  }

  return positions;
}
