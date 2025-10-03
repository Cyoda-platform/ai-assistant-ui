import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Edit, Filter, Zap, ArrowRight, RotateCcw } from 'lucide-react';
import type { UITransitionData } from '../types/workflow';
import type { ColorPalette } from '../themes/colorPalettes';

// ABOUTME: This file contains the TransitionNode component that renders transitions as draggable nodes
// instead of edges, solving the React Flow edge dragging limitation.
// Features 8 anchor points for flexible connection routing.

interface TransitionNodeData {
  transition: UITransitionData;
  onEdit: (transitionId: string) => void;
  isLoopback: boolean;
  palette: ColorPalette;
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
  const { transition, onEdit, isLoopback, palette } = data as unknown as TransitionNodeData;

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
    const baseClasses = "px-3 py-2 rounded-lg border-0 transition-all duration-300 min-w-[100px]";
    const selectedClasses = selected ? " ring-2 ring-white ring-offset-2 ring-offset-[#0b0f1a]" : "";

    return baseClasses + selectedClasses;
  };

  const getNodeBackgroundColor = () => {
    return isManual ? palette.colors.transitionManual : palette.colors.transitionAutomated;
  };

  const getIconColor = () => {
    // White icons on colored backgrounds
    return 'text-white';
  };

  // Render a single anchor point with both source and target handles
  const renderAnchorPoint = (anchorId: AnchorPoint) => {
    const config = ANCHOR_POINTS[anchorId];
    return (
      <React.Fragment key={anchorId}>
        {/* Render source handle (outgoing connections) - invisible */}
        <Handle
          type="source"
          position={config.position}
          id={`${anchorId}-source`}
          style={config.style}
          className={`w-2.5 h-2.5 !bg-transparent !border-0 opacity-0 ${config.className}`}
          isConnectable={true}
          isConnectableStart={true}
          isConnectableEnd={true}
        />

        {/* Render target handle (incoming connections) - invisible */}
        <Handle
          type="target"
          position={config.position}
          id={`${anchorId}-target`}
          style={config.style}
          className={`w-2.5 h-2.5 !bg-transparent !border-0 opacity-0 ${config.className}`}
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
      style={{ backgroundColor: getNodeBackgroundColor() }}
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

