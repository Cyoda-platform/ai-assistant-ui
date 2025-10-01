import React from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { Edit, Filter, Zap } from 'lucide-react';
import type { UITransitionData } from '../types/workflow';

interface TransitionEdgeData {
  transition: UITransitionData;
  onEdit: (transitionId: string) => void;
  onUpdate: (transition: UITransitionData) => void;
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
  const { transition, onEdit, onUpdate } = (data as unknown as TransitionEdgeData) || {};

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
    const baseStrokeWidth = 2.5;
    const automatedStrokeWidth = 3.5;

    if (selected) {
      return {
        className: isManual
          ? 'stroke-pink-500 dark:stroke-pink-400'
          : 'stroke-lime-500 dark:stroke-lime-400',
        style: { strokeWidth: isManual ? baseStrokeWidth : automatedStrokeWidth }
      };
    }

    if (isManual) {
      // Manual transitions: pink/fuchsia gradient
      return {
        className: 'stroke-pink-400 dark:stroke-pink-500',
        style: { strokeWidth: baseStrokeWidth }
      };
    } else {
      // Automated transitions: lime/emerald gradient
      return {
        className: 'stroke-lime-500 dark:stroke-lime-400',
        style: { strokeWidth: automatedStrokeWidth }
      };
    }
  };

  // Create unique marker ID for this transition
  const markerId = `arrow-${id}`;
  const styles = getTransitionStyles();



  return (
    <>
      <BaseEdge
        id={id as string}
        path={edgePath}
        className={styles.className}
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
            className={`${
              isManual
                ? 'bg-gradient-to-r from-pink-50 via-fuchsia-50 to-rose-50 dark:from-pink-950/30 dark:via-fuchsia-950/30 dark:to-rose-950/30'
                : 'bg-gradient-to-r from-lime-50 via-emerald-50 to-green-50 dark:from-lime-950/30 dark:via-emerald-950/30 dark:to-green-950/30'
            } border-2 rounded-full shadow-lg px-4 py-2 text-sm transition-all duration-300 backdrop-blur-sm ${
              selected
                ? isManual
                  ? 'border-pink-400 ring-4 ring-pink-400 ring-opacity-30 bg-gradient-to-r from-pink-100 via-fuchsia-100 to-rose-100 dark:from-pink-900/40 dark:via-fuchsia-900/40 dark:to-rose-900/40'
                  : 'border-lime-400 ring-4 ring-lime-400 ring-opacity-30 bg-gradient-to-r from-lime-100 via-emerald-100 to-green-100 dark:from-lime-900/40 dark:via-emerald-900/40 dark:to-green-900/40'
                : isManual
                  ? 'border-pink-300 dark:border-pink-600 hover:border-pink-400 hover:shadow-xl hover:scale-105'
                  : 'border-lime-300 dark:border-lime-600 hover:border-lime-400 hover:shadow-xl hover:scale-105'
            }`}
          >
            <div className="flex items-center space-x-2">
              {/* Transition Name */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs text-gray-900 dark:text-white truncate">
                  {transition.definition.name || 'Unnamed'}
                </div>
              </div>

              {/* Compact Indicators */}
              <div className="flex items-center space-x-1">
                {hasCriterion && (
                  <div className="text-pink-600 dark:text-pink-400" title="Has criterion">
                    <Filter size={10} />
                  </div>
                )}

                {hasProcessors && (
                  <div className="flex items-center space-x-0.5 text-green-600 dark:text-green-400" title={`${transition.definition.processors!.length} processors`}>
                    <Zap size={10} />
                    <span className="text-xs">{transition.definition.processors!.length}</span>
                  </div>
                )}
              </div>



              {/* Edit Button */}
              <button
                onClick={handleDoubleClick}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
            fill={
              selected
                ? (isManual ? '#4b5563' : '#10b981') // match line colors when selected
                : isManual
                  ? '#4b5563' // dark grey for manual (gray-600)
                  : '#10b981' // green for automated (green-500)
            }
            className="transition-colors duration-200"
          />
        </marker>
      </defs>
    </>
  );
};
