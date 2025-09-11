// Force-directed layout алгоритм для размещения transition labels
export function resolveTransitionCollisions(
  positions: Array<{
    transitionKey: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>,
  nodePositions: { [key: string]: { x: number; y: number } },
  nodeWidths: Map<string, number>,
  nodeHeights: Map<string, number>
): Array<{
  transitionKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
}> {
  const result = positions.map(p => ({
    ...p,
    vx: 0, // velocity x
    vy: 0, // velocity y
    originalX: p.x, // исходная позиция для притяжения
    originalY: p.y
  }));
  
  const iterations = 100;
  const damping = 0.8; // Затухание скорости
  const nodeRepulsionForce = 200; // Сила отталкивания от узлов
  const labelRepulsionForce = 50; // Сила отталкивания между labels
  const edgeAttractionForce = 0.1; // Сила притяжения к исходной позиции
  const minDistance = 40; // Минимальное расстояние
  
  console.log('⚡ Running force simulation...');
  
  for (let iteration = 0; iteration < iterations; iteration++) {
    // Обнуляем силы
    result.forEach(label => {
      label.vx = 0;
      label.vy = 0;
    });
    
    // 1. Силы отталкивания от узлов
    result.forEach(label => {
      for (const [nodeId, nodePos] of Object.entries(nodePositions)) {
        const nodeWidth = nodeWidths.get(nodeId) || 160;
        const nodeHeight = nodeHeights.get(nodeId) || 60;
        
        // Центр узла
        const nodeCenterX = nodePos.x + nodeWidth / 2;
        const nodeCenterY = nodePos.y + nodeHeight / 2;
        
        // Центр label
        const labelCenterX = label.x + label.width / 2;
        const labelCenterY = label.y + label.height / 2;
        
        const dx = labelCenterX - nodeCenterX;
        const dy = labelCenterY - nodeCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance < 150) { // Область влияния узла
          const force = nodeRepulsionForce / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          label.vx += fx;
          label.vy += fy;
        }
      }
    });
    
    // 2. Силы отталкивания между labels
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const labelA = result[i];
        const labelB = result[j];
        
        const centerAx = labelA.x + labelA.width / 2;
        const centerAy = labelA.y + labelA.height / 2;
        const centerBx = labelB.x + labelB.width / 2;
        const centerBy = labelB.y + labelB.height / 2;
        
        const dx = centerBx - centerAx;
        const dy = centerBy - centerAy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance < minDistance * 2) {
          const force = labelRepulsionForce / (distance * distance + 1);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          labelA.vx -= fx;
          labelA.vy -= fy;
          labelB.vx += fx;
          labelB.vy += fy;
        }
      }
    }
    
    // 3. Силы притяжения к исходным позициям (чтобы не улетали далеко)
    result.forEach(label => {
      const dx = label.originalX - label.x;
      const dy = label.originalY - label.y;
      
      label.vx += dx * edgeAttractionForce;
      label.vy += dy * edgeAttractionForce;
    });
    
    // 4. Применяем силы и обновляем позиции
    result.forEach(label => {
      // Ограничиваем максимальную скорость
      const maxVelocity = 5;
      const velocity = Math.sqrt(label.vx * label.vx + label.vy * label.vy);
      if (velocity > maxVelocity) {
        label.vx = (label.vx / velocity) * maxVelocity;
        label.vy = (label.vy / velocity) * maxVelocity;
      }
      
      // Обновляем позицию
      label.x += label.vx;
      label.y += label.vy;
      
      // Применяем затухание
      label.vx *= damping;
      label.vy *= damping;
    });
    
    // Логирование каждые 20 итераций
    if (iteration % 20 === 0) {
      const totalEnergy = result.reduce((sum, label) => 
        sum + Math.sqrt(label.vx * label.vx + label.vy * label.vy), 0);
      console.log(`⚡ Iteration ${iteration}: total energy = ${totalEnergy.toFixed(2)}`);
      
      // Если система стабилизировалась, выходим раньше
      if (totalEnergy < 0.1) {
        console.log(`✅ Force simulation converged at iteration ${iteration}`);
        break;
      }
    }
  }
  
  // Очистка результата от вспомогательных свойств
  const finalResult = result.map(label => ({
    transitionKey: label.transitionKey,
    x: Math.round(label.x),
    y: Math.round(label.y),
    width: label.width,
    height: label.height
  }));
  
  console.log('✅ Force-directed layout completed');
  
  // Финальная проверка на критические коллизии
  let hasOverlaps = false;
  for (let i = 0; i < finalResult.length; i++) {
    for (let j = i + 1; j < finalResult.length; j++) {
      const a = finalResult[i];
      const b = finalResult[j];
      const overlap = !(
        a.x + a.width < b.x ||
        b.x + b.width < a.x ||
        a.y + a.height < b.y ||
        b.y + b.height < a.y
      );
      if (overlap) {
        hasOverlaps = true;
        console.log(`⚠️ Still overlapping: ${a.transitionKey} and ${b.transitionKey}`);
      }
    }
  }
  
  if (!hasOverlaps) {
    console.log('✅ No overlaps detected in final result');
  }
  
  return finalResult;
}
