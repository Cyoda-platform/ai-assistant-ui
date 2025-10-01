import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Edit, Play, Square } from 'lucide-react';
import type { UIStateData } from '../types/workflow';
import { InlineNameEditor } from '../Editors/InlineNameEditor';

// ABOUTME: This file contains the StateNode component that renders individual workflow states
// with 8 anchor points for flexible connection routing and support for loop-back transitions.

interface StateNodeData {
  label: string;
  state: UIStateData;
  onNameChange: (stateId: string, newName: string) => void;
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
  const { state, onNameChange } = data as unknown as StateNodeData;

  const handleNameChange = (newName: string) => {
    onNameChange(state.id, newName);
  };

  // Render anchor point handles with logical directional types
  const renderAnchorPoint = (anchorId: AnchorPoint) => {
    const config = ANCHOR_POINTS[anchorId];

    // Determine handle types based on position:
    // Top and Left = Target handles (incoming connections)
    // Bottom and Right = Source handles (outgoing connections)
    const isSourcePosition = config.position === Position.Bottom || config.position === Position.Right;
    const isTargetPosition = config.position === Position.Top || config.position === Position.Left;

    return (
      <React.Fragment key={anchorId}>
        {/* Render source handle for bottom and right positions */}
        {isSourcePosition && (
          <Handle
            type="source"
            position={config.position}
            id={`${anchorId}-source`}
            style={config.style}
            className={`w-3.5 h-3.5 !bg-gradient-to-br !from-pink-500 !to-fuchsia-600 !border-2 !border-white dark:!border-gray-900 opacity-70 hover:opacity-100 hover:scale-125 transition-all duration-300 shadow-md hover:shadow-lg ${config.className}`}
          />
        )}

        {/* Render target handle for top and left positions */}
        {isTargetPosition && (
          <Handle
            type="target"
            position={config.position}
            id={`${anchorId}-target`}
            style={config.style}
            className={`w-3.5 h-3.5 !bg-gradient-to-br !from-lime-500 !to-emerald-600 !border-2 !border-white dark:!border-gray-900 opacity-70 hover:opacity-100 hover:scale-125 transition-all duration-300 shadow-md hover:shadow-lg ${config.className}`}
          />
        )}
      </React.Fragment>
    );
  };

  const getNodeStyle = () => {
    let baseClasses = "px-4 py-3 rounded-xl border-2 shadow-lg transition-all duration-300 min-w-[120px] relative backdrop-blur-sm";

    if (selected) {
      baseClasses += " ring-4 ring-offset-2 dark:ring-offset-gray-900";
    }

    if (state.isInitial) {
      // Super fashionable: Lime to Emerald to Green
      baseClasses += " border-lime-400 dark:border-lime-500 bg-gradient-to-br from-lime-50 via-emerald-50 to-green-50 dark:from-lime-950/40 dark:via-emerald-950/40 dark:to-green-950/40";
      if (selected) {
        baseClasses += " ring-lime-400 dark:ring-lime-500";
      }
    } else if (state.isFinal) {
      // Super fashionable: Hot Pink to Fuchsia to Rose
      baseClasses += " border-pink-400 dark:border-pink-500 bg-gradient-to-br from-pink-50 via-fuchsia-50 to-rose-50 dark:from-pink-950/40 dark:via-fuchsia-950/40 dark:to-rose-950/40";
      if (selected) {
        baseClasses += " ring-pink-400 dark:ring-pink-500";
      }
    } else {
      // Super fashionable: Green to Pink gradient
      baseClasses += " border-emerald-300 dark:border-emerald-600 bg-gradient-to-br from-green-50 via-emerald-50 to-pink-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-pink-950/30 hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-xl hover:scale-[1.02]";
      if (selected) {
        baseClasses += " ring-pink-400 dark:ring-pink-500";
      }
    }

    return baseClasses;
  };

  const getIconColor = () => {
    if (state.isInitial) return "text-lime-600 dark:text-lime-400";
    if (state.isFinal) return "text-pink-600 dark:text-pink-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  return (
    <div className={getNodeStyle()}>
      {/* Render all 8 anchor points */}
      {(Object.keys(ANCHOR_POINTS) as AnchorPoint[]).map(renderAnchorPoint)}

      {/* Node Content */}
      <div className="flex items-center space-x-2">
        {/* State Type Icon */}
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {state.isInitial ? (
            <Play size={14} fill="currentColor" />
          ) : state.isFinal ? (
            <Square size={14} fill="currentColor" />
          ) : (
            <div className="w-3 h-3 rounded-full border-2 border-current" />
          )}
        </div>

        {/* State Name with Inline Editing */}
        <div className="flex-1 min-w-0">
          <InlineNameEditor
            value={state.name}
            onSave={handleNameChange}
            className="min-w-0"
            inputClassName="text-sm font-medium"
          />
        </div>
      </div>
    </div>
  );
};
