import React from 'react';
import {
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { UITransitionData } from '../types/workflow';
import type { ColorPalette } from '../themes/colorPalettes';

// ABOUTME: This file contains the LoopbackEdge component that renders self-connecting transitions
// with curved paths that loop around the state node for clear visual distinction.

interface LoopbackEdgeData {
  transition: UITransitionData;
  onEdit: (transitionId: string) => void;
  onUpdate: (transition: UITransitionData) => void;
  onLabelClick?: (transitionId: string, section?: 'criterion' | 'processors') => void;
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
  const { transition, onEdit, onUpdate, onLabelClick, palette } = (data as unknown as LoopbackEdgeData) || {};

  // Helper function to get handle direction based on handle ID
  const getHandleDirection = (handleId: string | null): { x: number; y: number } => {
    if (!handleId) return { x: 0, y: 0 };

    // Extract position from handle ID (remove -source/-target suffix)
    const position = handleId.replace(/-source$|-target$/, '');

    // Map handle positions to tangent directions
    switch (position) {
      // Top handles - loop goes up
      case 'top-left':
      case 'top-center':
      case 'top-right':
        return { x: 0, y: -1 }; // Upward direction
      // Bottom handles - loop goes down
      case 'bottom-left':
      case 'bottom-center':
      case 'bottom-right':
        return { x: 0, y: 1 }; // Downward direction
      // Left handles - loop goes left
      case 'left-top':
      case 'left-bottom':
        return { x: -1, y: 0 }; // Leftward direction
      // Right handles - loop goes right
      case 'right-top':
      case 'right-bottom':
        return { x: 1, y: 0 }; // Rightward direction
      default:
        return { x: 0, y: 0 };
    }
  };

  // Create a curved loop path for self-connections
  const createLoopPath = () => {
    // "Mickey Mouse Ears" algorithm for wide, expressive self-loops
    // Since source and target are the same point, we need to create an artificial loop
    const LOOP_WIDTH = 400; // How wide the loop is (horizontal spread)
    const LOOP_HEIGHT = 250; // How tall the loop is (vertical extension)

    const startX = sourceX;
    const startY = sourceY;
    const endX = targetX;
    const endY = targetY;

    // Get handle direction to determine loop orientation
    const sourceHandle = data?.sourceHandle || transition?.sourceHandle;
    const handleDirection = getHandleDirection(sourceHandle);

    // Create control points that form a smooth loop
    // For top handles: loop goes up and curves smoothly
    // Strategy: Both control points go UP, but spread horizontally

    let cp1X, cp1Y, cp2X, cp2Y;

    if (handleDirection.y !== 0) {
      // Vertical handle (top or bottom) - create smooth arc above/below
      // Both control points at the same height, spread horizontally
      // handleDirection.y = -1 for top (loop goes up), +1 for bottom (loop goes down)
      cp1X = startX - LOOP_WIDTH / 4;
      cp1Y = startY + handleDirection.y * LOOP_HEIGHT; // Adaptive: up or down based on handle
      cp2X = endX + LOOP_WIDTH / 4;
      cp2Y = endY + handleDirection.y * LOOP_HEIGHT; // Adaptive: up or down based on handle
    } else {
      // Horizontal handle (left or right) - create smooth arc to the side
      // handleDirection.x = -1 for left (loop goes left), +1 for right (loop goes right)
      // Both control points at the same horizontal distance, spread vertically
      cp1X = startX + handleDirection.x * LOOP_HEIGHT; // Extend left or right
      cp1Y = startY - LOOP_WIDTH / 4; // Spread vertically (up)
      cp2X = endX + handleDirection.x * LOOP_HEIGHT; // Extend left or right
      cp2Y = endY + LOOP_WIDTH / 4; // Spread vertically (down)
    }

    // Create the loop path using cubic bezier curve
    const path = `M ${startX},${startY} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${endX},${endY}`;

    // Calculate label position at the midpoint of the bezier curve (t=0.5)
    // Using the cubic bezier formula: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
    const t = 0.5;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    const labelX = mt3 * startX + 3 * mt2 * t * cp1X + 3 * mt * t2 * cp2X + t3 * endX;
    const labelY = mt3 * startY + 3 * mt2 * t * cp1Y + 3 * mt * t2 * cp2Y + t3 * endY;

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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (transition && onLabelClick) {
      onLabelClick(transition.id, undefined); // Explicitly pass undefined to reset section
    }
  };

  const handleCriterionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (transition && onLabelClick) {
      onLabelClick(transition.id, 'criterion');
    }
  };

  const handleProcessorsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (transition && onLabelClick) {
      onLabelClick(transition.id, 'processors');
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
        {/* Primary Label - Center of the loop (Transition name) */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {/* Label with transition name */}
          <div
            className="text-xl font-medium text-white/90 whitespace-nowrap px-2 py-1 rounded cursor-pointer"
            style={{
              backgroundColor: 'transparent',
            }}
            title="Click to highlight in JSON, double-click to edit transition"
          >
            {transition?.definition?.name || 'Loop-back'}
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
