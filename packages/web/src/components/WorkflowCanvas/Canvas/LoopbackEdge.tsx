import React from 'react';
import {
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { Edit, Move, RotateCcw } from 'lucide-react';
import type { UITransitionData } from '../types/workflow';
import type { ColorPalette } from '../themes/colorPalettes';

// ABOUTME: This file contains the LoopbackEdge component that renders self-connecting transitions
// with curved paths that loop around the state node for clear visual distinction.

interface LoopbackEdgeData {
  transition: UITransitionData;
  onEdit: (transitionId: string) => void;
  onUpdate: (transition: UITransitionData) => void;
  isLoopback: boolean;
  palette: ColorPalette;
}

export const LoopbackEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}) => {
  const { transition, onEdit, onUpdate, palette } = (data as unknown as LoopbackEdgeData) || {};

  // Use labelPosition from transition layout if available, otherwise use default offset
  // This allows users to adjust loop position by dragging the label
  const dragOffset = transition?.labelPosition || { x: 0, y: 0 };

  // Helper function to get handle direction based on handle ID
  const getHandleDirection = (handleId: string | null): { x: number; y: number } => {
    if (!handleId) return { x: 0, y: 0 };

    // Extract position from handle ID (remove -source/-target suffix)
    const position = handleId.replace(/-source$|-target$/, '');

    // Map handle positions to tangent directions
    switch (position) {
      case 'top-left':
      case 'top-center':
      case 'top-right':
        return { x: 0, y: -1 }; // Upward direction
      case 'bottom-left':
      case 'bottom-center':
      case 'bottom-right':
        return { x: 0, y: 1 }; // Downward direction
      case 'left-center':
        return { x: -1, y: 0 }; // Leftward direction
      case 'right-center':
        return { x: 1, y: 0 }; // Rightward direction
      default:
        return { x: 0, y: 0 };
    }
  };

  // Create a curved loop path for self-connections
  const createLoopPath = () => {
    // React Flow provides the actual handle coordinates directly
    const startX = sourceX;
    const startY = sourceY;
    const endX = targetX;
    const endY = targetY;

    // Get handle directions for proper tangent angles
    const sourceDirection = getHandleDirection(transition?.sourceHandle);
    const targetDirection = getHandleDirection(transition?.targetHandle);

    // Calculate the base position for the loop (midpoint between handles)
    const baseMidX = (startX + endX) / 2;
    const baseMidY = (startY + endY) / 2;

    // Apply user's drag offset to the loop position
    // If no drag offset is set, use a much larger default offset to push the loop away from the node
    const defaultOffset = 120; // Large default offset
    const effectiveDragOffsetX = dragOffset.x !== 0 ? dragOffset.x : defaultOffset;
    const effectiveDragOffsetY = dragOffset.y !== 0 ? dragOffset.y : -defaultOffset;

    const loopCenterX = baseMidX + effectiveDragOffsetX;
    const loopCenterY = baseMidY + effectiveDragOffsetY;

    // Calculate loop size based on distance between handles and drag offset
    const handleDistance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const baseLoopSize = Math.max(180, handleDistance * 4); // Further increased for even more spacing
    const dragDistance = Math.sqrt(effectiveDragOffsetX * effectiveDragOffsetX + effectiveDragOffsetY * effectiveDragOffsetY);
    const loopSize = baseLoopSize + dragDistance * 0.3;

    // Create control points that respect handle directions
    // Control point 1: extends from source handle in its natural direction
    const controlPoint1Distance = loopSize * 2.0; // Significantly increased to 2.0 for very wide loops
    const controlPoint1X = startX + sourceDirection.x * controlPoint1Distance;
    const controlPoint1Y = startY + sourceDirection.y * controlPoint1Distance;

    // Control point 2: approaches target handle from its natural direction
    const controlPoint2Distance = loopSize * 2.0; // Significantly increased to 2.0 for very wide loops
    const controlPoint2X = endX + targetDirection.x * controlPoint2Distance;
    const controlPoint2Y = endY + targetDirection.y * controlPoint2Distance;

    // Adjust control points to create a proper loop that goes through the drag position
    // Blend the natural directions with the loop center position
    const blendFactor = 0.3; // Further reduced blend factor to keep loop much further from node
    const finalControlPoint1X = controlPoint1X * (1 - blendFactor) + loopCenterX * blendFactor;
    const finalControlPoint1Y = controlPoint1Y * (1 - blendFactor) + loopCenterY * blendFactor;
    const finalControlPoint2X = controlPoint2X * (1 - blendFactor) + loopCenterX * blendFactor;
    const finalControlPoint2Y = controlPoint2Y * (1 - blendFactor) + loopCenterY * blendFactor;

    // Create the loop path using cubic bezier curves with proper tangent directions
    const path = `M ${startX},${startY}
                  C ${finalControlPoint1X},${finalControlPoint1Y}
                    ${finalControlPoint2X},${finalControlPoint2Y}
                    ${endX},${endY}`;

    // Calculate label position at the midpoint of the bezier curve (t=0.5)
    // Using the cubic bezier formula: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
    const t = 0.5;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    const labelX = mt3 * startX + 3 * mt2 * t * finalControlPoint1X + 3 * mt * t2 * finalControlPoint2X + t3 * endX;
    const labelY = mt3 * startY + 3 * mt2 * t * finalControlPoint1Y + 3 * mt * t2 * finalControlPoint2Y + t3 * endY;

    return {
      path,
      labelX,
      labelY
    };
  };

  const { path: edgePath, labelX: finalLabelX, labelY: finalLabelY } = createLoopPath();

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (transition && onEdit) {
      onEdit(transition.id);
    }
  };





  // Determine if transition is manual or automated
  // If manual is undefined, treat as automated (false)
  const isManual = transition?.definition.manual === true;

  // Define colors and thickness based on manual/automated state
  const getLoopbackStyles = () => {
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

  // Create unique marker ID for this loopback transition
  const markerId = `arrow-loopback-${id}`;
  const styles = getLoopbackStyles();
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
                : ''
            }`}
            style={{ backgroundColor: labelBgColor }}
          >
            <div className="flex items-center space-x-2">
              {/* Drag Handle */}
              <div className="flex-shrink-0 text-white/70 hover:text-white">
                <Move size={10} />
              </div>

              {/* Loop Icon */}
              <div className="flex-shrink-0 text-white">
                <RotateCcw size={12} />
              </div>

              {/* Transition Name */}
              <span className="text-white font-medium">
                {transition?.definition?.name || 'Loop-back'}
              </span>

              {/* Edit Button */}
              <button
                onClick={handleDoubleClick}
                onMouseDown={(e) => {
                  e.stopPropagation(); // Prevent drag from starting
                }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
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
