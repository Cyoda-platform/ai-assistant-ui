/**
 * Dagre-based layout utilities for workflow editor
 * Simpler alternative to ELK with better support fo        if (hasGlobalOverlap(label1, label2)) {
          hasGlobalCollisions = true;

          // Проверяем, принадлежат ли transitions к одной паре состояний
          const parts1 = label1.transitionKey.split('|||');
          const parts2 = label2.transitionKey.split('|||');
          const samePair = parts1.length >= 2 && parts2.length >= 2 &&
                          parts1[0] === parts2[0] && parts1[1] === parts2[1];

          if (samePair) {
            // Для transitions одной пары используем умеренное расстояние
            const pairSeparation = 80; // было 120
            const centerY = (label1.y + label2.y) / 2;

            if (label1.transitionKey < label2.transitionKey) {
              label1.y = centerY - pairSeparation / 2;
              label2.y = centerY + pairSeparation / 2;
            } else {
              label1.y = centerY + pairSeparation / 2;
              label2.y = centerY - pairSeparation / 2;
            }

            console.log(`🚨 SAME PAIR separation: ${label1.transitionKey} -> Y=${label1.y}, ${label2.transitionKey} -> Y=${label2.y}`);
          } else {
            // Принудительно раздвигаем по вертикали с умеренным расстоянием
            const forcedSeparation = 100; // было 130
            const centerY = (label1.y + label2.y) / 2;

            if (label1.transitionKey < label2.transitionKey) {
              label1.y = centerY - forcedSeparation / 2;
              label2.y = centerY + forcedSeparation / 2;
            } else {
              label1.y = centerY + forcedSeparation / 2;
              label2.y = centerY - forcedSeparation / 2;
            }

            console.log(`🚨 DIFFERENT PAIR separation: ${label1.transitionKey} -> Y=${label1.y}, ${label2.transitionKey} -> Y=${label2.y}`);
          }
 */

import dagre from 'dagre';

type TransitionPosition = {
  transitionKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalX?: number;
  originalY?: number;
};

// Простой и эффективный алгоритм разрешения коллизий для вертикального выравнивания
function resolveVerticalTransitionCollisions(
  positions: Array<{
    transitionKey: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>,
  nodePositions?: { [key: string]: { x: number; y: number } },
  nodeWidths?: Map<string, number>,
  nodeHeights?: Map<string, number>
): TransitionPosition[] {
  console.log('🔧 Starting vertical collision resolution for', positions.length, 'transitions');

  const result = positions.map(p => ({
    ...p,
    originalX: p.x,
    originalY: p.y
  }));

  // Группируем по Y (почти один и тот же уровень) и разводим по X влево/вправо от центра
  const yThreshold = 12; // в одну группу, если близко по Y
  const groups = new Map<string, TransitionPosition[]>();

  result.forEach(label => {
    const groupKey = `y_${Math.round(label.y / yThreshold) * yThreshold}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push(label);
  });

  console.log('📊 Found', groups.size, 'vertical Y-groups');

  groups.forEach((groupLabels, key) => {
    if (groupLabels.length <= 1) return;

    // Стабильный порядок: по ключу
    groupLabels.sort((a, b) => a.transitionKey.localeCompare(b.transitionKey));

    // Центр по X: среднее от originalX, Y оставляем как есть (не двигаем по вертикали)
    const centerX = groupLabels.reduce((sum, l) => sum + (l.originalX ?? l.x), 0) / groupLabels.length;
    const maxWidth = Math.max(...groupLabels.map(l => Math.max(80, l.width || 80)));
    const spacing = Math.max(60, maxWidth + 24); // расстояние между лейблами по X
    const startX = centerX - spacing * (groupLabels.length - 1) / 2;

    console.log(`� Resolving ${groupLabels.length} overlaps in ${key}: centerX=${centerX}, spacing=${spacing}`);

    groupLabels.forEach((label, idx) => {
      const newX = Math.round(startX + idx * spacing);
      // Y фиксируем около originalY, чтобы не уезжать ниже/выше узлов
      const newY = Math.round(label.originalY ?? label.y);
      console.log(`  📍 ${label.transitionKey}: X ${label.x} -> ${newX}, Y stays ${newY}`);
      label.x = newX;
      label.y = newY;
    });
  });

  // Вспомогательные функции
  const intersects = (a: {left:number;right:number;top:number;bottom:number}, b: {left:number;right:number;top:number;bottom:number}) =>
    !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);

  // Глобальная раздвижка по X для оставшихся пересечений
  const margin = 10;
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const li = result[i];
        const lj = result[j];
        // Только если близки по Y (один уровень) и пересекаются
        if (Math.abs(li.y - lj.y) <= 14) {
          const ri = { left: li.x - (li.width||80)/2, right: li.x + (li.width||80)/2, top: li.y - (li.height||25)/2, bottom: li.y + (li.height||25)/2 };
          const rj = { left: lj.x - (lj.width||80)/2, right: lj.x + (lj.width||80)/2, top: lj.y - (lj.height||25)/2, bottom: lj.y + (lj.height||25)/2 };
          if (intersects(ri, rj)) {
            const desiredGap = ((li.width||80)/2 + (lj.width||80)/2) + margin;
            const dx = lj.x - li.x;
            const adjust = (desiredGap - Math.abs(dx)) / 2;
            if (dx >= 0) {
              li.x -= adjust;
              lj.x += adjust;
            } else {
              li.x += adjust;
              lj.x -= adjust;
            }
            moved = true;
          }
        }
      }
    }
    if (!moved) break;
  }

  // Избегаем наложения на узлы (если переданы)
  if (nodePositions && nodeWidths && nodeHeights) {
    const nodes = Object.keys(nodePositions).map(id => {
      const w = nodeWidths.get(id) || 160;
      const h = nodeHeights.get(id) || 60;
      const cx = nodePositions[id].x;
      const cy = nodePositions[id].y;
      return { left: cx - w/2, right: cx + w/2, top: cy - h/2, bottom: cy + h/2 };
    });

    result.forEach(l => {
      let rect = { left: l.x - (l.width||80)/2, right: l.x + (l.width||80)/2, top: l.y - (l.height||25)/2, bottom: l.y + (l.height||25)/2 };
      let attempts = 0;
      while (attempts < 10 && nodes.some(n => intersects(rect, n))) {
        // Сдвигаем по X от ближайшего узла
        const overlapping = nodes.filter(n => intersects(rect, n))[0];
        const centerX = (rect.left + rect.right) / 2;
        const nodeCenterX = (overlapping.left + overlapping.right) / 2;
        const dir = centerX < nodeCenterX ? -1 : 1;
        l.x += dir * 20;
        // Небольшой ограниченный сдвиг по Y при необходимости
        if (attempts > 4) {
          const dy = (attempts - 4) * 2;
          l.y = (l.originalY ?? l.y) + (attempts % 2 === 0 ? dy : -dy);
        }
        rect = { left: l.x - (l.width||80)/2, right: l.x + (l.width||80)/2, top: l.y - (l.height||25)/2, bottom: l.y + (l.height||25)/2 };
        attempts++;
      }
    });
  }

  console.log('✅ Vertical collision resolution completed (spread X, global de-overlap, node avoidance)');
  return result;
}

// Простой и эффективный алгоритм разрешения коллизий для горизонтального выравнивания
function resolveHorizontalTransitionCollisions(
  positions: Array<{
    transitionKey: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>
): TransitionPosition[] {
  console.log('🔧 Starting horizontal collision resolution for', positions.length, 'transitions');

  const result = positions.map(p => ({
    ...p,
    originalX: p.x,
    originalY: p.y
  }));

  // Простая группировка по одинаковым координатам (очень близким)
  const threshold = 10; // Если transitions ближе 10px, считаем их перекрывающимися
  const groups = new Map<string, TransitionPosition[]>();

  result.forEach(label => {
    // Создаем ключ группы на основе округленных координат с небольшим порогом
    const groupKey = `${Math.round(label.x / threshold) * threshold}_${Math.round(label.y / threshold) * threshold}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(label);
  });

  console.log('📊 Found', groups.size, 'transition groups');

  // Обрабатываем каждую группу
  groups.forEach((groupLabels, groupKey) => {
    if (groupLabels.length > 1) {
      console.log(`🔧 Resolving ${groupLabels.length} overlapping transitions in group ${groupKey}`);

      // Сортируем по transitionKey для стабильности
      groupLabels.sort((a, b) => a.transitionKey.localeCompare(b.transitionKey));

      // Размещаем transitions вертикально с умеренным интервалом
      const baseY = groupLabels[0].y;
      const verticalSpacing = 50; // Увеличиваем расстояние между labels
      const totalHeight = (groupLabels.length - 1) * verticalSpacing;
      const startY = baseY - totalHeight / 2;

      groupLabels.forEach((label, index) => {
        const newY = startY + index * verticalSpacing;
        console.log(`  📍 Moving ${label.transitionKey} from Y=${label.y} to Y=${newY} (spacing=${verticalSpacing})`);
        label.y = newY;
      });
    }
  });

  console.log('✅ Horizontal collision resolution completed with minimal spacing');
  return result;
}

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

// Оценка ширины лейбла по длине имени transition (учитываем кнопки и отступы)
function estimateLabelWidth(name?: string): number {
  const text = (name || '').trim();
  const charWidth = 9; // пикселей на символ (учитывая кириллицу)
  const actionsWidth = 60; // место под кнопки
  const padding = 24; // внутренние отступы
  const base = 100; // минимальная ширина
  const width = text.length > 0 ? text.length * charWidth + actionsWidth + padding : base;
  return Math.max(base, Math.min(width, 280)); // ограничим максимум, чтобы не улетали слишком далеко
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

  // Преобразуем список переходов в массив для удобства
  function normalizeTransitions(transitions: Transitions | undefined): Transition[] {
    if (!transitions) return [];
    if (Array.isArray(transitions)) return transitions;
    return Object.values(transitions);
  }

  // Создаем граф Dagre с поддержкой множественных рёбер
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({
    rankdir: isVertical ? 'TB' : 'LR',
    align: 'UL',
    nodesep: isVertical ? 60 : 150,
    ranksep: isVertical ? 90 : 250, // Умеренно увеличиваем для горизонтального режима
    marginx: 40,
    marginy: isVertical ? 20 : 50
  });
  g.setDefaultEdgeLabel(() => ({}));

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

    const nodeWidth = 200; // Фиксированная ширина для layout расчетов
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

  // Создаем карту для связывания edge ID с transition key и internalTransitionId
  const transitionMap = new Map<string, string>();
  const keyToInternalId = new Map<string, string>();

  // Связываем transitionKey с internalTransitionId
  allTransitions.forEach(transition => {
    // Улучшенная логика создания internalTransitionId
    let transitionName = transition.name;

    // Если имя transition пустое или неопределено, используем индекс из transitionKey
    if (!transitionName || transitionName.trim() === '') {
      const parts = transition.transitionKey.split('|||');
      const idx = parts[2] || '0';
      transitionName = `transition_${idx}`;
    }

    const internalTransitionId = `${transition.from}-${transitionName}`;
    keyToInternalId.set(transition.transitionKey, internalTransitionId);

    console.log(`🔗 Mapping: ${transition.transitionKey} -> ${internalTransitionId} (original name: "${transition.name}")`);
  });

  g.edges().forEach(edge => {
    const edgeData = g.edge(edge);
    if (edgeData.id) {
      transitionMap.set(edgeData.id, edgeData.id);
    }
  });

  console.log('🔗 TransitionMap entries:', Array.from(transitionMap.entries()));
  console.log('🗝️ KeyToInternalId mapping:', Array.from(keyToInternalId.entries()));

  // Группируем transitions по парам состояний для размещения
  // ВАЖНО: учитываем bidirectional связи (A->B и B->A считаем как одну пару)
  const pairTransitions = new Map<string, Array<{
    transitionKey: string;
    name?: string;
    from: string;
    to: string;
  }>>();

  allTransitions.forEach(transition => {
    // Создаем нормализованный ключ пары (сортируем по алфавиту)
    const nodeA = transition.from;
    const nodeB = transition.to;
    const normalizedPairKey = nodeA < nodeB ? `${nodeA}|||${nodeB}` : `${nodeB}|||${nodeA}`;

    if (!pairTransitions.has(normalizedPairKey)) {
      pairTransitions.set(normalizedPairKey, []);
    }

    pairTransitions.get(normalizedPairKey)!.push({
      transitionKey: transition.transitionKey,
      name: transition.name,
      from: transition.from,
      to: transition.to
    });
  });

  console.log('👥 Bidirectional transition pairs:', Array.from(pairTransitions.entries()).map(([key, transitions]) => ({
    pair: key,
    count: transitions.length,
    transitions: transitions.map(t => `${t.from}->${t.to}:${t.name}`)
  })));

  // Собираем все позиции transitions для алгоритма collision resolution
  const allTransitionPositions: Array<{
    transitionKey: string;
    x: number;
    y: number;
    width: number;
    height: number;
    targetNode: string;
  }> = [];

  // Размещаем transitions для каждой bidirectional пары состояний
  for (const [pairKey, transitionGroup] of pairTransitions.entries()) {
    console.log(`🎯 Processing bidirectional transition group for ${pairKey}:`, {
      count: transitionGroup.length,
      transitions: transitionGroup.map(t => `${t.from}->${t.to}:${t.name}`)
    });

    if (transitionGroup.length > 1) {
      // Множественные transitions между парой состояний (включая bidirectional)
      // Разносим их равномерно по перпендикуляру к средней линии между узлами
      const [nodeA, nodeB] = pairKey.split('|||');
      const nodeAData = g.node(nodeA);
      const nodeBData = g.node(nodeB);

      if (!nodeAData || !nodeBData) {
        console.warn(`⚠️ Missing node data for bidirectional pair ${pairKey}`);
        continue;
      }

      // Центральная точка между узлами
      const centerX = (nodeAData.x + nodeBData.x) / 2;
      const centerY = (nodeAData.y + nodeBData.y) / 2;

      // Перпендикулярный вектор для разнесения
      const edgeVectorX = nodeBData.x - nodeAData.x;
      const edgeVectorY = nodeBData.y - nodeAData.y;
      const edgeLength = Math.sqrt(edgeVectorX * edgeVectorX + edgeVectorY * edgeVectorY);

      let perpX = 0;
      let perpY = 0;

      if (edgeLength > 0) {
        // Нормализованный перпендикулярный вектор
        perpX = -edgeVectorY / edgeLength;
        perpY = edgeVectorX / edgeLength;
      }

      // Минимальное расстояние между labels
      const labelSpacing = 50;
      const totalWidth = (transitionGroup.length - 1) * labelSpacing;
      const startOffset = -totalWidth / 2;

      transitionGroup.forEach((item, idx) => {
        const offset = startOffset + idx * labelSpacing;
        const finalLabelX = centerX + perpX * offset;
        const finalLabelY = centerY + perpY * offset;

        // Оценочные размеры transition label
        const labelWidth = estimateLabelWidth(item.name);
        const labelHeight = 25;

        allTransitionPositions.push({
          transitionKey: item.transitionKey,
          x: finalLabelX,
          y: finalLabelY,
          width: labelWidth,
          height: labelHeight,
          targetNode: item.to
        });

        console.log(`➕ Added bidirectional transition position for ${item.transitionKey} (${item.from}->${item.to})`);
      });
    } else {
      // Одиночный transition
      const item = transitionGroup[0];
      const fromNode = g.node(item.from);
      const toNode = g.node(item.to);

      if (!fromNode || !toNode) {
        console.warn(`⚠️ Missing node data for single transition ${item.from}->${item.to}`);
        continue;
      }

      const baseLabelX = (fromNode.x + toNode.x) / 2;
      const baseLabelY = (fromNode.y + toNode.y) / 2;
      const labelWidth = estimateLabelWidth(item.name);
      const labelHeight = 25;

      allTransitionPositions.push({
        transitionKey: item.transitionKey,
        x: baseLabelX,
        y: baseLabelY,
        width: labelWidth,
        height: labelHeight,
        targetNode: item.to
      });

      console.log(`➕ Added single transition position for ${item.transitionKey}`);
    }
  }

  // Проверяем, есть ли реальные коллизии перед применением алгоритма
  // Простая проверка: если есть только одиночные переходы, коллизий быть не должно
  function hasRealCollisions(): boolean {
    const pairCounts = new Map<string, number>();

    // Считаем количество переходов для каждой пары состояний
    allTransitions.forEach(t => {
      const pairKey = `${t.from}→${t.to}`;
      pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
    });

    // Если есть пары с более чем одним переходом, могут быть коллизии
    return Array.from(pairCounts.values()).some(count => count > 1);
  }

  let resolvedPositions: TransitionPosition[];
  if (!hasRealCollisions()) {
    // Если коллизий нет (только одиночные переходы), оставляем позиции как есть
    console.log('✅ No real collisions detected, keeping original positions');
    resolvedPositions = allTransitionPositions;
  } else if (isVertical) {
    // Для вертикального выравнивания используем новый простой алгоритм с учетом геометрии узлов
    resolvedPositions = resolveVerticalTransitionCollisions(
      allTransitionPositions,
      nodePositions,
      nodeWidths,
      nodeHeights
    );
  } else {
    // Для горизонтального выравнивания используем простой алгоритм
    resolvedPositions = resolveHorizontalTransitionCollisions(allTransitionPositions);
  }

  // Преобразуем в финальный формат с правильными ключами
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

  // Преобразуем относительное смещение строго от центра ребра
  // Важно: используем геометрический центр ребра, а не pre-collision originalX/Y,
  // чтобы сохраненные offsets всегда отражали финальное разделение.
  const originalX = edgeMidX;
  const originalY = edgeMidY;

    const relativeOffset = {
      x: Math.round(position.x - originalX),
      y: Math.round(position.y - originalY)
    };

    // Сохраняем под обоими ключами для совместимости
    const internalTransitionId = keyToInternalId.get(position.transitionKey);
    if (internalTransitionId) {
      transitionPositions[internalTransitionId] = relativeOffset;
      console.log(`🎯 Mapped ${position.transitionKey} -> ${internalTransitionId}:`, relativeOffset);
    }

    // Также сохраняем под оригинальным ключом как fallback
    transitionPositions[position.transitionKey] = relativeOffset;
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
