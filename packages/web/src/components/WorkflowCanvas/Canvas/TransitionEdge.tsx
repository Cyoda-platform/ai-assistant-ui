import React from 'react';
import {
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { Filter, Zap } from 'lucide-react';
import { Tooltip } from 'antd';
import type { UITransitionData } from '../types/workflow';
import type { ColorPalette } from '../themes/colorPalettes';

interface TransitionEdgeData {
  transition: UITransitionData;
  onEdit: (transitionId: string) => void;
  onUpdate: (transition: UITransitionData) => void;
  palette: ColorPalette;
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep';
}

export const TransitionEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const { transition, onEdit, onUpdate, palette, edgeType = 'default' } = (data as unknown as TransitionEdgeData) || {};

  // Calculate edge path and label position based on edge type
  let edgePath: string;
  let finalLabelX: number;
  let finalLabelY: number;

  switch (edgeType) {
    case 'straight':
      [edgePath, finalLabelX, finalLabelY] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
      break;
    case 'step':
    case 'smoothstep':
      [edgePath, finalLabelX, finalLabelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: edgeType === 'smoothstep' ? 20 : 0,
      });
      break;
    case 'default':
    default:
      // Use slightly higher curvature (0.35) for Bezier to create more pronounced curves
      [edgePath, finalLabelX, finalLabelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.35, // Increased from default 0.25 for more curved paths
      });
      break;
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (transition && onEdit) {
      onEdit(transition.id);
    }
  };



  if (!transition) {
    return <BaseEdge id={id as string} path={edgePath} />;
  }

  const hasCriterion = transition.definition.criterion !== undefined;
  const hasProcessors = transition.definition.processors && transition.definition.processors.length > 0;

  // Determine if transition is manual or automated
  const isManual = transition.definition.manual === true;

  // Define colors based on manual/automated state
  const edgeColor = isManual ? palette.colors.transitionManual : palette.colors.transitionAutomated;

  // Calculate position for criterion badge near source node
  const getCriterionBadgePosition = () => {
    // Offset from source based on source position
    let offsetX = 0;
    let offsetY = 0;

    switch (sourcePosition) {
      case 'top':
        offsetY = -20; // Above the source node
        break;
      case 'bottom':
        offsetY = 20; // Below the source node
        break;
      case 'left':
        offsetX = -20; // Left of the source node
        break;
      case 'right':
        offsetX = 20; // Right of the source node
        break;
    }

    return {
      x: sourceX + offsetX,
      y: sourceY + offsetY,
    };
  };

  // Calculate position for process badge near target node
  const getProcessBadgePosition = () => {
    // Offset from target based on target position
    // Balanced offset to separate badge from arrow without being too far
    let offsetX = 0;
    let offsetY = 0;

    switch (targetPosition) {
      case 'top':
        offsetY = -40; // Above the target node
        break;
      case 'bottom':
        offsetY = 40; // Below the target node
        break;
      case 'left':
        offsetX = -40; // Left of the target node
        break;
      case 'right':
        offsetX = 40; // Right of the target node
        break;
    }

    return {
      x: targetX + offsetX,
      y: targetY + offsetY,
    };
  };

  const processBadgePos = getProcessBadgePosition();
  const criterionBadgePos = getCriterionBadgePosition();

  // Format criterion information for tooltip
  const getCriterionTooltip = () => {
    if (!transition.definition.criterion) return null;
    const criterion = transition.definition.criterion;
    const lines: string[] = [];
    if (criterion.type) lines.push(`Type: ${criterion.type}`);
    if (criterion.field) lines.push(`Field: ${criterion.field}`);
    if (criterion.operator) lines.push(`Operator: ${criterion.operator}`);
    if (criterion.value !== undefined) lines.push(`Value: ${JSON.stringify(criterion.value)}`);
    return lines.join('\n') || 'Has criterion';
  };

  // Format processors information for tooltip
  const getProcessorsTooltip = () => {
    if (!transition.definition.processors || transition.definition.processors.length === 0) {
      return null;
    }
    return (
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {transition.definition.processors.map((p, idx) => (
          <div key={idx}>
            {idx + 1}. {p.name}{p.executionMode ? ` (${p.executionMode})` : ''}
          </div>
        ))}
      </div>
    );
  };



  // Create unique marker ID for this transition
  const markerId = `arrow-${id}`;

  return (
    <>
      <BaseEdge
        id={id as string}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: 2,
          strokeDasharray: isManual ? '8 4' : 'none',
          opacity: selected ? 0.9 : 0.7,
        }}
        markerEnd={`url(#${markerId})`}
        interactionWidth={20}
      />

      <EdgeLabelRenderer>
        {/* Primary Label - Center of the edge (Transition name) */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onDoubleClick={handleDoubleClick}
        >
          {/* Label with transition name */}
          <div
            className="text-xl font-medium text-white/90 whitespace-nowrap px-2 py-1 rounded cursor-pointer"
            style={{
              backgroundColor: 'transparent',
            }}
            title="Double-click to edit transition"
          >
            {transition.definition.name || 'Unnamed'}
          </div>
        </div>

        {/* Criterion Badge - Near source node (start of edge) */}
        {hasCriterion && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${criterionBadgePos.x}px,${criterionBadgePos.y}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <Tooltip title={getCriterionTooltip()} color="#1f2937">
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: '#ec4899', // Pink-500
                  transform: 'rotate(45deg)',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(236, 72, 153, 0.5)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ transform: 'rotate(-45deg)' }}>
                  <Filter size={14} color="white" />
                </div>
              </div>
            </Tooltip>
          </div>
        )}

        {/* Process Badge - Near target node (end of edge) */}
        {hasProcessors && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${processBadgePos.x}px,${processBadgePos.y}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <Tooltip title={getProcessorsTooltip()} color="#1f2937">
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#3b82f6', // Blue-500
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)',
                  cursor: 'pointer',
                }}
              >
                <Zap size={16} color="white" />
              </div>
            </Tooltip>
          </div>
        )}
      </EdgeLabelRenderer>

      {/* Custom arrow marker with unique ID */}
      <defs>
        <marker
          id={markerId}
          markerWidth="20"
          markerHeight="30"
          refX="18"
          refY="9"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M0,0 L0,18 L18,9 z"
            fill={edgeColor}
            className="transition-colors duration-200"
          />
        </marker>
      </defs>
    </>
  );
};
