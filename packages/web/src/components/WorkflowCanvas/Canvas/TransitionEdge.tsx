import React from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { Edit, Filter, Zap } from 'lucide-react';
import type { UITransitionData } from '../types/workflow';
import type { ColorPalette } from '../themes/colorPalettes';

interface TransitionEdgeData {
  transition: UITransitionData;
  onEdit: (transitionId: string) => void;
  onUpdate: (transition: UITransitionData) => void;
  palette: ColorPalette;
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
  const { transition, onEdit, onUpdate, palette } = (data as unknown as TransitionEdgeData) || {};

  // Calculate edge path and label position (always centered on arrow)
  const [edgePath, finalLabelX, finalLabelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

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
  // If manual is undefined, treat as automated (false)
  const isManual = transition.definition.manual === true;
  const isAutomated = !isManual;

  // Define colors and thickness based on manual/automated state
  const getTransitionStyles = () => {
    const baseStrokeWidth = 2;
    const strokeColor = isManual ? palette.colors.transitionManual : palette.colors.transitionAutomated;

    return {
      style: {
        stroke: strokeColor,
        strokeWidth: baseStrokeWidth,
        opacity: selected ? 0.9 : 0.7
      }
    };
  };

  // Create unique marker ID for this transition
  const markerId = `arrow-${id}`;
  const styles = getTransitionStyles();
  const edgeColor = isManual ? palette.colors.transitionManual : palette.colors.transitionAutomated;
  const labelBgColor = edgeColor;



  return (
    <>
      <BaseEdge
        id={id as string}
        path={edgePath}
        style={{
          ...styles.style,
          strokeDasharray: isManual ? '8 4' : 'none',
          transition: 'stroke 300ms ease-in-out, stroke-width 300ms ease-in-out, stroke-dasharray 300ms ease-in-out'
        }}
        markerEnd={`url(#${markerId})`}
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
          title="Double-click to edit transition"
        >
          <div
            className={`border-0 rounded-full px-4 py-2 text-sm transition-all duration-300 ${
              selected
                ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0b0f1a]'
                : 'hover:scale-105'
            }`}
            style={{ backgroundColor: labelBgColor }}
          >
            <div className="flex items-center space-x-2">
              {/* Transition Name */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs text-white truncate">
                  {transition.definition.name || 'Unnamed'}
                </div>
              </div>

              {/* Compact Indicators */}
              <div className="flex items-center space-x-1">
                {hasCriterion && (
                  <div className="text-white/80" title="Has criterion">
                    <Filter size={10} />
                  </div>
                )}

                {hasProcessors && (
                  <div className="flex items-center space-x-0.5 text-white/80" title={`${transition.definition.processors!.length} processors`}>
                    <Zap size={10} />
                    <span className="text-xs">{transition.definition.processors!.length}</span>
                  </div>
                )}
              </div>



              {/* Edit Button */}
              <button
                onClick={handleDoubleClick}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-300 transition-colors"
                title="Click to edit transition"
              >
                <Edit size={10} />
              </button>
            </div>


          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Custom arrow marker with unique ID */}
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={edgeColor}
            className="transition-colors duration-200"
          />
        </marker>
      </defs>
    </>
  );
};
