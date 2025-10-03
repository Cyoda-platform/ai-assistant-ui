import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Edit, Play, Square } from 'lucide-react';
import type { UIStateData } from '../types/workflow';
import { InlineNameEditor } from '../Editors/InlineNameEditor';
import type { ColorPalette } from '../themes/colorPalettes';

// ABOUTME: This file contains the StateNode component that renders individual workflow states
// with 8 anchor points for flexible connection routing and support for loop-back transitions.

interface StateNodeData {
  label: string;
  state: UIStateData;
  onNameChange: (stateId: string, newName: string) => void;
  palette: ColorPalette;
}

// Define anchor point identifiers for the 8-point system
type AnchorPoint =
  | 'top-left' | 'top-center' | 'top-right'
  | 'left-center' | 'right-center'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

// Anchor point configuration with positions and CSS styles
const ANCHOR_POINTS: Record<AnchorPoint, {
  position: Position;
  style: React.CSSProperties;
  className: string;
}> = {
  'top-left': {
    position: Position.Top,
    style: { left: '25%', top: '-6px' },
    className: 'transform -translate-x-1/2'
  },
  'top-center': {
    position: Position.Top,
    style: { left: '50%', top: '-6px' },
    className: 'transform -translate-x-1/2'
  },
  'top-right': {
    position: Position.Top,
    style: { left: '75%', top: '-6px' },
    className: 'transform -translate-x-1/2'
  },
  'left-center': {
    position: Position.Left,
    style: { left: '-6px', top: '50%' },
    className: 'transform -translate-y-1/2'
  },
  'right-center': {
    position: Position.Right,
    style: { right: '-6px', top: '50%' },
    className: 'transform -translate-y-1/2'
  },
  'bottom-left': {
    position: Position.Bottom,
    style: { left: '25%', bottom: '-6px' },
    className: 'transform -translate-x-1/2'
  },
  'bottom-center': {
    position: Position.Bottom,
    style: { left: '50%', bottom: '-6px' },
    className: 'transform -translate-x-1/2'
  },
  'bottom-right': {
    position: Position.Bottom,
    style: { left: '75%', bottom: '-6px' },
    className: 'transform -translate-x-1/2'
  }
};

export const StateNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { state, onNameChange, palette } = data as unknown as StateNodeData;

  const handleNameChange = (newName: string) => {
    onNameChange(state.id, newName);
  };

  // Get handle color based on state type using theme palette
  const getHandleColor = () => {
    if (state.isInitial) return palette.colors.stateInitial;
    if (state.isFinal) return palette.colors.stateFinal;
    return palette.colors.stateNormal;
  };

  // Render anchor point handles with both source and target types
  // This allows connections in all directions
  const renderAnchorPoint = (anchorId: AnchorPoint) => {
    const config = ANCHOR_POINTS[anchorId];
    const handleColor = getHandleColor();

    return (
      <React.Fragment key={anchorId}>
        {/* Render source handle (outgoing connections) - matches state color */}
        <Handle
          type="source"
          position={config.position}
          id={`${anchorId}-source`}
          style={{ ...config.style, backgroundColor: handleColor }}
          className={`w-2.5 h-2.5 !border-0 opacity-60 hover:opacity-100 hover:scale-125 transition-all duration-200 ${config.className}`}
        />

        {/* Render target handle (incoming connections) - matches state color */}
        <Handle
          type="target"
          position={config.position}
          id={`${anchorId}-target`}
          style={{ ...config.style, backgroundColor: handleColor }}
          className={`w-2.5 h-2.5 !border-0 opacity-60 hover:opacity-100 hover:scale-125 transition-all duration-200 ${config.className}`}
          isConnectableStart={false}
        />
      </React.Fragment>
    );
  };

  const getNodeStyle = () => {
    // Base classes with smooth rounded corners and solid fill - NO GLOW
    const baseClasses = "px-5 py-3 rounded-xl transition-all duration-300 min-w-[180px] relative border-0";
    const selectedClasses = selected ? " ring-2 ring-white ring-offset-2 ring-offset-[#0b0f1a]" : "";

    return baseClasses + selectedClasses;
  };

  const getNodeBackgroundColor = () => {
    if (state.isInitial) return palette.colors.stateInitial;
    if (state.isFinal) return palette.colors.stateFinal;
    return palette.colors.stateNormal;
  };

  const getIconColor = () => {
    // White icons on solid colored backgrounds
    return "text-white";
  };

  const getBorderColor = () => {
    // Subtle white divider
    return "border-white/20";
  };

  const getTransitionCount = () => {
    // Count outgoing transitions from this state using transitionIds
    return state.transitionIds?.length || 0;
  };

  const transitionCount = getTransitionCount();

  return (
    <div className={getNodeStyle()} style={{ backgroundColor: getNodeBackgroundColor() }}>
      {/* Render all 8 anchor points */}
      {(Object.keys(ANCHOR_POINTS) as AnchorPoint[]).map(renderAnchorPoint)}

      {/* Node Content */}
      <div className="flex flex-col space-y-2">
        {/* Header with icon and name */}
        <div className="flex items-center space-x-2">
          {/* State Type Icon */}
          <div className={`flex-shrink-0 ${getIconColor()}`}>
            {state.isInitial ? (
              <Play size={14} fill="currentColor" />
            ) : state.isFinal ? (
              <Square size={14} fill="currentColor" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full border-2 border-current" />
            )}
          </div>

          {/* State Name with Inline Editing - Bold white text */}
          <div className="flex-1 min-w-0">
            <InlineNameEditor
              value={state.name}
              onSave={handleNameChange}
              className="min-w-0"
              inputClassName="text-sm font-semibold text-white"
            />
          </div>
        </div>

        {/* Additional Information - Subtle white sublabels with emojis */}
        <div className={`flex items-center justify-between text-xs text-white/70 pt-2 border-t ${getBorderColor()}`}>
          <div className="flex items-center space-x-2">
            {/* State Type Label with emoji */}
            <span className="font-normal">
              {state.isInitial ? '🚀 Start' : state.isFinal ? '🏁 End' : '⚡ State'}
            </span>

            {/* Always show transition count */}
            <span className="flex items-center space-x-1 font-normal">
              <span>•</span>
              <span>🔀 {transitionCount}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
