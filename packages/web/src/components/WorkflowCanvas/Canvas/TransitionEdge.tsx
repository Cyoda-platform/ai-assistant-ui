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
    return transition.definition.processors
      .map((p, idx) => `${idx + 1}. ${p.name}${p.executionMode ? ` (${p.executionMode})` : ''}`)
      .join('\n');
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
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onDoubleClick={handleDoubleClick}
        >
          {/* Unified container with icons above text */}
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              padding: '4px 8px',
            }}
          >
            {/* Icons row - above the text */}
            {(hasCriterion || hasProcessors) && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Criterion - Pink Diamond with Filter icon */}
                {hasCriterion && (
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
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ transform: 'rotate(-45deg)' }}>
                        <Filter size={14} color="white" />
                      </div>
                    </div>
                  </Tooltip>
                )}

                {/* Processors - Blue Circle with Zap icon */}
                {hasProcessors && (
                  <Tooltip title={getProcessorsTooltip()} color="#1f2937">
                    <div
                      style={{
                        width: '37px',
                        height: '37px',
                        backgroundColor: '#3b82f6', // Blue-500
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <Zap size={16} color="white" />
                    </div>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Label with transition name - below icons */}
            <div
              className="text-xl font-medium text-white/90 whitespace-nowrap px-2 py-1 rounded cursor-pointer"
              style={{
                backgroundColor: 'transparent',
                flexShrink: 0,
              }}
              title="Double-click to edit transition"
            >
              {transition.definition.name || 'Unnamed'}
            </div>
          </div>
        </div>
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
