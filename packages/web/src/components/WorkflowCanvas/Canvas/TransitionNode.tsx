import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Edit, Filter, Zap, ArrowRight, RotateCcw } from 'lucide-react';
import type { UITransitionData } from '../types/workflow';

// ABOUTME: This file contains the TransitionNode component that renders transitions as draggable nodes
// instead of edges, solving the React Flow edge dragging limitation.
// Features 8 anchor points for flexible connection routing.

interface TransitionNodeData {
  transition: UITransitionData;
  onEdit: (transitionId: string) => void;
  isLoopback: boolean;
}

// Define all 8 anchor points with their positions and styles
type AnchorPoint = 'top-left' | 'top-center' | 'top-right' | 'left-center' | 'right-center' | 'bottom-left' | 'bottom-center' | 'bottom-right';

const ANCHOR_POINTS: Record<AnchorPoint, { position: Position; style: React.CSSProperties; className: string }> = {
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

export const TransitionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { transition, onEdit, isLoopback } = data as unknown as TransitionNodeData;

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (transition && onEdit) {
      onEdit(transition.id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (transition && onEdit) {
      onEdit(transition.id);
    }
  };

  if (!transition) {
    return null;
  }

  const hasCriterion = transition.definition.criterion !== undefined;
  const hasProcessors = transition.definition.processors && transition.definition.processors.length > 0;

  // Determine if transition is manual or automated
  const isManual = transition.definition.manual === true;

  const getNodeStyle = () => {
    let baseClasses = "px-3 py-2 rounded-lg border-2 shadow-lg transition-all duration-300 min-w-[100px] backdrop-blur-sm";

    if (selected) {
      baseClasses += " ring-4 ring-offset-2 ring-offset-gray-900";
    }

    if (isManual) {
      // Manual transitions: pink/fuchsia gradient
      return `${baseClasses} ${
        selected
          ? 'bg-gradient-to-br from-pink-900/60 via-fuchsia-900/60 to-rose-900/60 border-pink-400 ring-pink-400'
          : 'bg-gradient-to-br from-pink-950/40 via-fuchsia-950/40 to-rose-950/40 border-pink-600 hover:border-pink-400 hover:shadow-xl'
      }`;
    } else {
      // Automated transitions: lime/emerald gradient
      return `${baseClasses} ${
        selected
          ? 'bg-gradient-to-br from-lime-900/60 via-emerald-900/60 to-green-900/60 border-lime-400 ring-lime-400'
          : 'bg-gradient-to-br from-lime-950/40 via-emerald-950/40 to-green-950/40 border-lime-600 hover:border-lime-400 hover:shadow-xl'
      }`;
    }
  };

  const getIconColor = () => {
    if (isManual) {
      return selected ? 'text-pink-300' : 'text-pink-400';
    } else {
      return selected ? 'text-lime-300' : 'text-lime-400';
    }
  };

  // Render a single anchor point with both source and target handles
  const renderAnchorPoint = (anchorId: AnchorPoint) => {
    const config = ANCHOR_POINTS[anchorId];
    return (
      <React.Fragment key={anchorId}>
        {/* Render source handle (outgoing connections) */}
        <Handle
          type="source"
          position={config.position}
          id={`${anchorId}-source`}
          style={config.style}
          className={`w-3.5 h-3.5 !bg-gradient-to-br !from-purple-500 !to-pink-600 !border-2 !border-gray-900 opacity-70 hover:opacity-100 hover:scale-125 transition-all duration-300 shadow-md hover:shadow-lg ${config.className}`}
          isConnectable={true}
          isConnectableStart={true}
          isConnectableEnd={true}
        />

        {/* Render target handle (incoming connections) */}
        <Handle
          type="target"
          position={config.position}
          id={`${anchorId}-target`}
          style={config.style}
          className={`w-3.5 h-3.5 !bg-gradient-to-br !from-blue-500 !to-cyan-600 !border-2 !border-gray-900 opacity-70 hover:opacity-100 hover:scale-125 transition-all duration-300 shadow-md hover:shadow-lg ${config.className}`}
          isConnectable={true}
          isConnectableStart={true}
          isConnectableEnd={true}
        />
      </React.Fragment>
    );
  };

  return (
    <div
      className={getNodeStyle()}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit transition"
    >
      {/* Render all 8 anchor points */}
      {(Object.keys(ANCHOR_POINTS) as AnchorPoint[]).map(renderAnchorPoint)}

      {/* Node Content */}
      <div className="flex items-center space-x-2">
        {/* Transition Type Icon */}
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {isLoopback ? (
            <RotateCcw size={14} />
          ) : (
            <ArrowRight size={14} />
          )}
        </div>

        {/* Transition Name */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white truncate">
            {transition.definition.name || 'Unnamed'}
          </div>
        </div>

        {/* Indicators */}
        <div className="flex items-center space-x-1">
          {hasCriterion && (
            <div className="text-pink-400" title="Has criterion">
              <Filter size={10} />
            </div>
          )}

          {hasProcessors && (
            <div className="flex items-center space-x-0.5 text-green-400" title={`${transition.definition.processors!.length} processors`}>
              <Zap size={10} />
              <span className="text-xs">{transition.definition.processors!.length}</span>
            </div>
          )}
        </div>

        {/* Edit Button */}
        <button
          onClick={handleEditClick}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-300 transition-colors"
          title="Click to edit transition"
        >
          <Edit size={10} />
        </button>
      </div>
    </div>
  );
};

