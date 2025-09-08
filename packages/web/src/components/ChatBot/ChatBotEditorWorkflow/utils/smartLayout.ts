/**
 * Layout utilities. Now powered by ELK for deterministic hierarchical layouts.
 * Also includes Dagre as an alternative layout engine.
 */
// ELK in-browser bundle
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - elkjs has no bundled types for the default export path
import ELK from 'elkjs/lib/elk.bundled.js';

// Import Dagre as alternative
import { applyDagreLayout } from './dagreLayout';

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

// Explicit workflow types
export interface Transition {
  next: string;
  condition?: unknown;
  criteria?: unknown;
  criterion?: unknown;
}

export type Transitions = Array<Transition> | Record<string, Transition>;

export interface WorkflowState {
  transitions?: Transitions;
}

export type WorkflowStates = Record<string, WorkflowState>;

export function calculateSmartPosition(
    stateName: string,
    states: WorkflowStates,
    initialState: string
): NodePosition {
  // Simple fallback positioning - spread nodes in a basic grid
  const stateNames = Object.keys(states);
  const index = stateNames.indexOf(stateName);
  
  if (stateName === initialState) {
    return { x: 0, y: 0 };
  }
  
  // Basic grid layout as fallback
  const col = Math.floor(index / 3);
  const row = index % 3;
  
  return {
    x: col * 250,
    y: row * 150 - 150 // Center around 0
  };
}

// Функция для расчета ширины текста узла
function calculateNodeWidth(stateName: string, isVertical: boolean): number {
  // Базовая ширина узла
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

// Универсальная функция для автоматического layout с выбором движка
export async function applyAutoLayout(
  states: WorkflowStates, 
  initialState: string, 
  isVertical: boolean = false,
  engine: 'elk' | 'dagre' = 'dagre' // По умолчанию используем Dagre
): Promise<{
  nodePositions: { [key: string]: NodePosition };
  transitionPositions: { [key: string]: {x: number, y: number} };
}> {
  console.log('🚀 Using layout engine:', engine);
  
  if (engine === 'dagre') {
    return applyDagreLayout(states as unknown as import('./dagreLayout').WorkflowStates, initialState, isVertical);
  } else {
    return applyElkLayout(states, initialState, isVertical);
  }
}

// Удобная функция для явного использования Dagre
export async function applyAutoLayoutWithDagre(
  states: WorkflowStates, 
  initialState: string, 
  isVertical: boolean = false
): Promise<{
  nodePositions: { [key: string]: NodePosition };
  transitionPositions: { [key: string]: {x: number, y: number} };
}> {
  return applyDagreLayout(states as unknown as import('./dagreLayout').WorkflowStates, initialState, isVertical);
}

// Переименовываем старую функцию в applyElkLayout
async function applyElkLayout(states: WorkflowStates, initialState: string, isVertical: boolean = false): Promise<{
  nodePositions: { [key: string]: NodePosition };
  transitionPositions: { [key: string]: {x: number, y: number} };
}> {
  const nodePositions: { [key: string]: NodePosition } = {};
  if (!states || typeof states !== 'object') return { nodePositions, transitionPositions: {} };

  const stateNames = Object.keys(states);
  if (stateNames.length === 0) return { nodePositions, transitionPositions: {} };

  // Создаем карту размеров узлов для дальнейшего использования
  const nodeWidths = new Map<string, number>();
  const nodeHeights = new Map<string, number>();

  // Build ELK graph with transitions as intermediate nodes for perfect alignment
  const elk = new ELK();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elkGraph: any = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': isVertical ? 'DOWN' : 'RIGHT',
      'elk.padding': isVertical ? 20 : 20,
      'elk.spacing.nodeNode': isVertical ? 30 : 25,
      'elk.spacing.componentComponent': isVertical ? 20 : 20,
      'elk.layered.spacing.nodeNodeBetweenLayers': isVertical ? 40 : 50,
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.nodePlacement.strategy': isVertical ? 'SIMPLE' : 'SIMPLE',
      'elk.layered.nodePlacement.favorStraightEdges': true,
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.portConstraints': 'FIXED_SIDE',
      'elk.layered.nodePlacement.bk.fixedAlignment': isVertical ? 'LEFTMOST' : 'BALANCED',
      // Настройки для горизонтального выравнивания
      'elk.layered.layering.strategy': 'LONGEST_PATH',
      'elk.layered.thoroughness': '7',
      // Принудительно выравниваем по центру для горизонтального layout
      'elk.layered.nodePlacement.bk.edgeStraightening': isVertical ? 'NONE' : 'IMPROVE_STRAIGHTNESS',
      'elk.layered.spacing.edgeNodeBetweenLayers': isVertical ? 10 : 5,
      'elk.layered.spacing.edgeEdgeBetweenLayers': isVertical ? 10 : 5,
      // Дополнительные настройки для горизонтального выравнивания
      ...(isVertical ? {} : {
        'elk.alignment': 'CENTER',
        'elk.layered.compaction.postCompaction.strategy': 'LEFT',
        'elk.layered.compaction.postCompaction.constraints': 'NONE',
        'elk.layered.nodePlacement.linearSegments.deflectionDampening': '0.5',
      }),
    },
    children: [],
    edges: [],
  };

  // Add state nodes with dynamic width calculation
  for (const stateName of stateNames) {
    const nodeWidth = calculateNodeWidth(stateName, isVertical);
    const nodeHeight = isVertical ? 80 : 100;
    
    // Сохраняем размеры для дальнейшего использования
    nodeWidths.set(stateName, nodeWidth);
    nodeHeights.set(stateName, nodeHeight);
    
    elkGraph.children.push({
      id: stateName,
      width: nodeWidth,
      height: nodeHeight,
      layoutOptions: {
        'elk.nodeLabels.placement': 'INSIDE V_CENTER H_CENTER',
        // Даем основным нодам высокий приоритет для правильного выравнивания
        'elk.layered.priority': stateName === initialState ? '1' : '5'
      },
      ports: [
        { id: `${stateName}_IN`, properties: { 'org.eclipse.elk.port.side': isVertical ? 'NORTH' : 'WEST' } },
        { id: `${stateName}_OUT`, properties: { 'org.eclipse.elk.port.side': isVertical ? 'SOUTH' : 'EAST' } },
      ],
    });
  }

  // Add transition nodes as intermediate elements
  const transitionNodes: string[] = [];
  // Map ELK transition node id -> internal transition key used by UI ("${source}-${transitionName}")
  const transitionMap = new Map<string, string>();
  // Count transitions per source-target pair to spread labels
  const pairCounts = new Map<string, number>(); // `${source}_${target}` -> count
  // Track per-pair index (0..count-1) for symmetric staggering
  const pairIndexMap = new Map<string, number>(); // transitionId -> pairIndex
  
  for (const [source, state] of Object.entries(states)) {
    const t = state.transitions;
    if (!t) continue;
    const list = Array.isArray(t) ? t : Object.values(t);
    
    for (let i = 0; i < list.length; i++) {
      const transition = list[i];
      if (!transition?.next) continue;
      const target = transition.next as string;
      if (!stateNames.includes(target)) continue;
      
  const transitionId = `transition_${source}_${target}_${i}`;
  transitionNodes.push(transitionId);

      // Build internal transition key used in editor metadata
      let transitionName = `t${i}`;
      if (transition && typeof transition === 'object') {
        const rec = transition as unknown as Record<string, unknown>;
        const maybeName = rec.name as unknown;
        if (typeof maybeName === 'string' && maybeName.length > 0) {
          transitionName = maybeName;
        }
      }
      const internalKey = `${source}-${transitionName}`;
      transitionMap.set(transitionId, internalKey);

  // Count by pair for later staggering and store occurrence index
  const pairKey = `${source}_${target}`;
  const current = pairCounts.get(pairKey) || 0;
  pairIndexMap.set(transitionId, current);
  pairCounts.set(pairKey, current + 1);
      
      // Add transition as a small intermediate node
      elkGraph.children.push({
        id: transitionId,
        width: isVertical ? 60 : 80,
        height: isVertical ? 20 : 25,
        layoutOptions: {
          'elk.nodeLabels.placement': 'INSIDE V_CENTER H_CENTER',
          // Делаем transition nodes менее приоритетными для выравнивания
          'elk.layered.priority': '10'
        },
        ports: [
          { id: `${transitionId}_IN`, properties: { 'org.eclipse.elk.port.side': isVertical ? 'NORTH' : 'WEST' } },
          { id: `${transitionId}_OUT`, properties: { 'org.eclipse.elk.port.side': isVertical ? 'SOUTH' : 'EAST' } },
        ],
      });
      
      // Add edges: source -> transition -> target
      elkGraph.edges.push({
        id: `${source}->${transitionId}`,
        sources: [`${source}_OUT`],
        targets: [`${transitionId}_IN`],
      });
      
      elkGraph.edges.push({
        id: `${transitionId}->${target}`,
        sources: [`${transitionId}_OUT`],
        targets: [`${target}_IN`],
      });
    }
  }

  const layout = await elk.layout(elkGraph);
  
  // Debug what ELK generated
  console.log('🔍 ELK Layout Debug:');
  console.log('📊 All children:', layout.children?.map((c) => ({
    id: c.id,
    x: c.x,
    y: c.y,
    width: c.width,
    height: c.height
  })));
  
  console.log('🔗 Transition map:', Array.from(transitionMap.entries()));
  
  const debugTransitions = layout.children?.filter((c) => c.id.startsWith('transition_')) || [];
  console.log('🎯 Transition nodes:', debugTransitions.map((t) => ({
    id: t.id,
    x: t.x,
    y: t.y,
    mapped_to: transitionMap.get(t.id)
  })));
  
  // Normalize positions
  const xs = (layout.children as Array<{ x?: number }> | undefined)?.map((n) => n.x ?? 0) || [0];
  const ys = (layout.children as Array<{ y?: number }> | undefined)?.map((n) => n.y ?? 0) || [0];
  const minX = Math.min(...xs, 0);
  const minY = Math.min(...ys, 0);

  // Extract positions for both states and transitions
  const transitionPositions: { [key: string]: {x: number, y: number} } = {};

  // Pass 1: record all state node positions
  for (const child of layout.children || []) {
    if (stateNames.includes(child.id)) {
      nodePositions[child.id] = {
        x: Math.round(((child.x ?? 0) - minX)),
        y: Math.round(((child.y ?? 0) - minY)),
      };
    }
  }

  // Pass 2: compute transition label offsets relative to edge midpoint
  // Keep edge-aligned basis vectors to stagger reliably even for diagonal edges
  type TempLabel = {
    key: string;
    edgeMidX: number;
    edgeMidY: number;
    offX: number;
    offY: number;
    ux: number; // unit along-edge x
    uy: number; // unit along-edge y
    px: number; // unit perpendicular x
    py: number; // unit perpendicular y
  };
  const temp: TempLabel[] = [];

  for (const child of layout.children || []) {
    if (!child.id.startsWith('transition_')) continue;

    const transitionKey = transitionMap.get(child.id);
    if (!transitionKey) {
      console.log('⚠️ No transition key found for:', child.id, 'Available keys:', Array.from(transitionMap.keys()));
      continue;
    }

    // Transition absolute top-left
    const transitionX = Math.round(((child.x ?? 0) - minX));
    const transitionY = Math.round(((child.y ?? 0) - minY));

    // Parse source/target from transition node id
    const parts = child.id.split('_');
    if (parts.length < 4) continue;
    
    // Transition ID format: "transition_source_target_index"
    // But source and target can contain underscores, so we need to be smarter
    const transitionPrefix = 'transition_';
    const withoutPrefix = child.id.substring(transitionPrefix.length);
    const lastUnderscoreIndex = withoutPrefix.lastIndexOf('_');
    const beforeIndex = withoutPrefix.substring(0, lastUnderscoreIndex);
    
    // Now split beforeIndex to find where source ends and target begins
    // We need to match against actual state names
    let sourceId = '';
    let targetId = '';
    
    for (const stateName of stateNames) {
      if (beforeIndex.startsWith(stateName + '_')) {
        sourceId = stateName;
        targetId = beforeIndex.substring(stateName.length + 1);
        break;
      }
    }
    
    if (!sourceId || !targetId) {
      console.log('⚠️ Could not parse source/target from:', child.id, 'beforeIndex:', beforeIndex);
      continue;
    }
    
    const pairKey = `${sourceId}_${targetId}`;
    const count = pairCounts.get(pairKey) || 1;
  const pairIndex = pairIndexMap.get(child.id) ?? 0; // use occurrence index for symmetric spacing

    const sourcePos = nodePositions[sourceId];
    const targetPos = nodePositions[targetId];
    if (!sourcePos || !targetPos) {
      console.log('⚠️ Missing node positions for transition:', {
        transitionId: child.id,
        sourceId, targetId,
        sourcePos, targetPos,
        availableNodes: Object.keys(nodePositions)
      });
      continue;
    }

    // Edge midpoint estimating the same handle selection as in the editor
    const nodeW = nodeWidths.get(sourceId) || (isVertical ? 200 : 220);
    const nodeH = nodeHeights.get(sourceId) || (isVertical ? 80 : 100);
    const targetNodeW = nodeWidths.get(targetId) || (isVertical ? 200 : 220);
    const targetNodeH = nodeHeights.get(targetId) || (isVertical ? 80 : 100);
    
    const halfNodeW = nodeW / 2;
    const halfNodeH = nodeH / 2;
    const halfTargetNodeW = targetNodeW / 2;
    const halfTargetNodeH = targetNodeH / 2;

    // Node centers
    const sourceCenterX = sourcePos.x + halfNodeW;
    const sourceCenterY = sourcePos.y + halfNodeH;
    const targetCenterX = targetPos.x + halfTargetNodeW;
    const targetCenterY = targetPos.y + halfTargetNodeH;

    // Choose handles similar to useWorkflowEditor.ts
    let sX = sourceCenterX;
    let sY = sourceCenterY;
    let tX = targetCenterX;
    let tY = targetCenterY;
    if (sourceId !== targetId) {
      const deltaY = Math.abs(targetPos.y - sourcePos.y);
      if (deltaY > 30) {
        // vertical connection: bottom -> top or top -> bottom
        if (targetPos.y > sourcePos.y) {
          // source bottom
          sX = sourcePos.x + halfNodeW;
          sY = sourcePos.y + nodeH;
          // target top
          tX = targetPos.x + halfTargetNodeW;
          tY = targetPos.y;
        } else {
          // source top
          sX = sourcePos.x + halfNodeW;
          sY = sourcePos.y;
          // target bottom
          tX = targetPos.x + halfTargetNodeW;
          tY = targetPos.y + targetNodeH;
        }
      } else {
        // horizontal connection: right -> left or left -> right
        if (targetPos.x > sourcePos.x) {
          // source right
          sX = sourcePos.x + nodeW;
          sY = sourcePos.y + halfNodeH;
          // target left
          tX = targetPos.x;
          tY = targetPos.y + halfTargetNodeH;
        } else {
          // source left
          sX = sourcePos.x;
          sY = sourcePos.y + halfNodeH;
          // target right
          tX = targetPos.x + targetNodeW;
          tY = targetPos.y + halfTargetNodeH;
        }
      }
    }

    const edgeMidX = (sX + tX) / 2;
    const edgeMidY = (sY + tY) / 2;

    // Transition node center (60x20 on vertical, 80x25 on horizontal)
    const halfW = isVertical ? 30 : 40;
    const halfH = isVertical ? 10 : 12.5;
    const transitionCenterX = transitionX + halfW;
    const transitionCenterY = transitionY + halfH;

    // Offset from edge midpoint to transition center
    let offsetX = transitionCenterX - edgeMidX;
    let offsetY = transitionCenterY - edgeMidY;

    // Build edge-aligned basis (u: along edge, p: perpendicular)
  let vx = tX - sX;
  let vy = tY - sY;
    let vlen = Math.hypot(vx, vy);
    if (vlen < 1e-3) {
      // self-loop or zero-length; choose axis by layout direction
      vx = isVertical ? 0 : 1;
      vy = isVertical ? 1 : 0;
      vlen = 1;
    }
    const ux = vx / vlen;
    const uy = vy / vlen;
    const px = -uy;
    const py = ux;

    // Apply perpendicular staggering for multiple transitions between same pair
    if (count > 1) {
      const perpSpacing = 28; // px between labels perpendicular to edge
      const alongSpacing = 12; // slight spread along the edge to avoid stacking
      const start = -((count - 1) * perpSpacing) / 2;
      const perpBump = start + pairIndex * perpSpacing;
      const alongStart = -((count - 1) * alongSpacing) / 2;
      const alongBump = alongStart + pairIndex * alongSpacing;

      offsetX += px * perpBump + ux * alongBump;
      offsetY += py * perpBump + uy * alongBump;
    }

    temp.push({ key: transitionKey, edgeMidX, edgeMidY, offX: offsetX, offY: offsetY, ux, uy, px, py });
    
    console.log('✅ Processed transition:', {
      id: child.id,
      key: transitionKey,
      sourceId, targetId,
      offset: { x: offsetX, y: offsetY }
    });
  }

  // Pass 3: de-collision among labels sharing a similar midpoint and direction
  const groups = new Map<string, TempLabel[]>();
  for (const item of temp) {
    // Quantize midpoint and angle to build robust groups
    const qx = Math.round(item.edgeMidX / 20) * 20;
    const qy = Math.round(item.edgeMidY / 20) * 20;
    const angle = Math.atan2(item.uy, item.ux); // angle of along-edge unit vector
    const angleDeg = Math.round((angle * 180) / Math.PI);
    const angleBucket = Math.round(angleDeg / 15) * 15; // 15-degree buckets
    const lineKey = `${qx}:${qy}:${angleBucket}`;
    const arr = groups.get(lineKey) || [];
    arr.push(item);
    groups.set(lineKey, arr);
  }

  // Calculate final positions
  const finalPositions: { [key: string]: {x: number, y: number} } = {};
  
  for (const [, arr] of groups) {
    if (arr.length <= 1) {
      const only = arr[0];
      finalPositions[only.key] = { x: only.offX, y: only.offY };
      continue;
    }
    // Stable order by key
    arr.sort((a, b) => a.key.localeCompare(b.key));
    const groupSpacing = 24; // extra separation for crowded groups
    const start = -((arr.length - 1) * groupSpacing) / 2;
    arr.forEach((item, i) => {
      const bump = start + i * groupSpacing;
      const x = item.offX + item.px * bump;
      const y = item.offY + item.py * bump;
      finalPositions[item.key] = { x, y };
    });
  }

  
  // Минимальная пост-обработка для вертикального layout: только явные пересечения
  if (isVertical) {
    const transitionHeight = 20;
    const entries = Object.entries(finalPositions);
    
    // Простая проверка: если два transition имеют одинаковую Y, сдвигаем второй
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [, pos1] = entries[i];
        const [key2, pos2] = entries[j];
        
        // Если пересекаются по Y
        if (Math.abs(pos1.y - pos2.y) < transitionHeight) {
          finalPositions[key2].y = pos1.y + transitionHeight + 5;
          console.log('🔧 Fixed overlap:', key2, 'moved down to', finalPositions[key2].y);
        }
      }
    }
  }
  
  // Присваиваем finalPositions к transitionPositions
  for (const [key, pos] of Object.entries(finalPositions)) {
    transitionPositions[key] = { x: pos.x, y: pos.y };
  }

  console.log('📋 Final transition positions:', transitionPositions);
  return { nodePositions, transitionPositions };
}
