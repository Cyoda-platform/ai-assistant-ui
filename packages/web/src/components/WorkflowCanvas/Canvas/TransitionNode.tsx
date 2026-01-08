import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Filter, Zap } from 'lucide-react';
import { Tooltip } from 'antd';
import type { UITransitionData } from '../types/workflow';
import type { ColorPalette } from '../themes/colorPalettes';

// ABOUTME: This file contains the TransitionNode component that renders transitions as draggable nodes
// instead of edges, solving the React Flow edge dragging limitation.
// Features 8 anchor points for flexible connection routing.

interface TransitionNodeData {
  transition: UITransitionData;
  onEdit: (transitionId: string) => void;
  onSendToChat?: (transitionData: UITransitionData) => void;
  isLoopback: boolean;
  palette: ColorPalette;
}

// Define all 10 anchor points with their positions and styles
type AnchorPoint = 'top-left' | 'top-center' | 'top-right' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom' | 'bottom-left' | 'bottom-center' | 'bottom-right';

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
  'left-top': {
    position: Position.Left,
    style: { left: '-6px', top: '33%' },
    className: 'transform -translate-y-1/2'
  },
  'left-bottom': {
    position: Position.Left,
    style: { left: '-6px', top: '67%' },
    className: 'transform -translate-y-1/2'
  },
  'right-top': {
    position: Position.Right,
    style: { right: '-6px', top: '33%' },
    className: 'transform -translate-y-1/2'
  },
  'right-bottom': {
    position: Position.Right,
    style: { right: '-6px', top: '67%' },
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
  const { transition, onEdit, onSendToChat, isLoopback, palette } = data as unknown as TransitionNodeData;

  const handleDoubleClick = (e: React.MouseEvent) => {
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

  // Format criterion information for tooltip
  const getCriterionTooltip = () => {
    if (!transition.definition.criterion) return null;

    const criterion = transition.definition.criterion;
    const lines: string[] = [];

    if (criterion.type) {
      lines.push(`Type: ${criterion.type}`);
    }

    if ('jsonPath' in criterion && criterion.jsonPath) {
      lines.push(`Path: ${criterion.jsonPath}`);
    }

    if ('operation' in criterion && criterion.operation) {
      lines.push(`Operation: ${criterion.operation}`);
    }

    if ('value' in criterion && criterion.value !== undefined) {
      lines.push(`Value: ${criterion.value}`);
    }

    if ('operator' in criterion && criterion.operator) {
      lines.push(`Operator: ${criterion.operator}`);
    }

    return lines.length > 0 ? lines.join('\n') : 'Criterion';
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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        backgroundColor: 'transparent',
        border: 'none',
      }}
    >
      {/* Render all 8 anchor points */}
      {(Object.keys(ANCHOR_POINTS) as AnchorPoint[]).map(renderAnchorPoint)}

      {/* Indicators - Criterion Diamond and Processors Badge */}
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
              }}
            >
              <Zap size={16} color="white" />
            </div>
          </Tooltip>
        )}
      </div>

      {/* Label with transition name - transparent background */}
      <div
        className="text-xl font-medium text-white/90 whitespace-nowrap px-2 py-1 rounded cursor-pointer"
        onDoubleClick={handleDoubleClick}
        title="Double-click to edit transition"
        style={{ backgroundColor: 'transparent' }}
      >
        {transition.definition.name || 'Unnamed'}
      </div>
    </div>
  );
};

