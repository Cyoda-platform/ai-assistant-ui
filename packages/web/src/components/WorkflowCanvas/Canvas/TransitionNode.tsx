import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Filter, Zap } from 'lucide-react';
import { Tooltip } from 'antd';
import type { UITransitionData } from '../types/workflow';
import type { ColorPalette } from '../themes/colorPalettes';

// ABOUTME: This file contains the TransitionNode component that renders transitions as labels
// positioned at the center of the transition path. The line passes through the center of the label.
// Uses a single central handle for clean, straight line routing.

interface TransitionNodeData {
  transition: UITransitionData;
  onEdit: (transitionId: string) => void;
  onSendToChat?: (transitionData: UITransitionData) => void;
  isLoopback: boolean;
  palette: ColorPalette;
}

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

  return (
    <>
      {/* Single central handle - invisible, positioned at the exact center of the node */}
      <Handle
        type="source"
        position={Position.Left}
        id="center-source"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          pointerEvents: 'none',
        }}
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="center-target"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          pointerEvents: 'none',
        }}
        isConnectable={false}
      />

      {/* Unified container with all content - icons above text */}
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
          onDoubleClick={handleDoubleClick}
          title="Double-click to edit transition"
          style={{
            backgroundColor: 'transparent',
            flexShrink: 0,
          }}
        >
          {transition.definition.name || 'Unnamed'}
        </div>
      </div>
    </>
  );
};

