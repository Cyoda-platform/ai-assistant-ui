import React, { memo } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import { Tooltip, Tag } from 'antd';
import {
  ThunderboltOutlined,
  BranchesOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';

interface TransitionData {
  name: string;
  next: string;
  manual?: boolean;
  processors?: Array<{
    name: string;
    executionMode?: string;
  }>;
  criterion?: {
    type: string;
    jsonPath?: string;
    operation?: string;
    value?: any;
    operator?: string;
    conditions?: any[];
  };
}

interface CustomEdgeData {
  transition?: TransitionData;
  sourceState?: string;
  targetState?: string;
}

const CustomEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const transition = data?.transition;
  const hasProcessors = transition?.processors && transition.processors.length > 0;
  const hasCriterion = !!transition?.criterion;
  const isManual = transition?.manual;

  // Build tooltip content
  const getTooltipContent = () => {
    if (!transition) return null;

    return (
      <div style={{ maxWidth: '300px' }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
          {transition.name}
        </div>
        
        <div style={{ marginBottom: '6px' }}>
          <strong>Target:</strong> {transition.next}
        </div>

        <div style={{ marginBottom: '6px' }}>
          <strong>Type:</strong>{' '}
          <Tag color={isManual ? 'orange' : 'blue'} style={{ margin: 0 }}>
            {isManual ? 'Manual' : 'Automatic'}
          </Tag>
        </div>

        {hasProcessors && (
          <div style={{ marginBottom: '6px' }}>
            <strong>Processors ({transition.processors!.length}):</strong>
            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
              {transition.processors!.map((proc, idx) => (
                <li key={idx}>
                  {proc.name}
                  {proc.executionMode && (
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>
                      {' '}({proc.executionMode})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasCriterion && (
          <div>
            <strong>Criterion:</strong>
            <div style={{ marginTop: '4px', fontSize: '12px' }}>
              <div>Type: {transition.criterion!.type}</div>
              {transition.criterion!.jsonPath && (
                <div>Path: {transition.criterion!.jsonPath}</div>
              )}
              {transition.criterion!.operation && (
                <div>Operation: {transition.criterion!.operation}</div>
              )}
              {transition.criterion!.value !== undefined && (
                <div>Value: {JSON.stringify(transition.criterion!.value)}</div>
              )}
              {transition.criterion!.operator && (
                <div>Operator: {transition.criterion!.operator}</div>
              )}
              {transition.criterion!.conditions && (
                <div>Conditions: {transition.criterion!.conditions.length}</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Edge styling
  const edgeStyle = {
    ...style,
    stroke: selected ? '#F59E0B' : hasCriterion ? '#8B5CF6' : isManual ? '#F97316' : '#3B82F6',
    strokeWidth: selected ? 3 : 2,
    strokeDasharray: isManual ? '5,5' : undefined,
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <Tooltip title={getTooltipContent()} placement="top">
            <div
              style={{
                background: 'var(--bg-dialog-color)',
                border: `2px solid ${selected ? '#F59E0B' : hasCriterion ? '#8B5CF6' : isManual ? '#F97316' : '#3B82F6'}`,
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {/* Transition name */}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {transition?.name || 'Transition'}
              </span>

              {/* Icons for features */}
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {hasProcessors && (
                  <ThunderboltOutlined 
                    style={{ fontSize: '12px', color: '#F59E0B' }} 
                    title="Has processors"
                  />
                )}
                {hasCriterion && (
                  <BranchesOutlined 
                    style={{ fontSize: '12px', color: '#8B5CF6' }} 
                    title="Has criterion"
                  />
                )}
                {isManual && (
                  <CheckOutlined 
                    style={{ fontSize: '12px', color: '#F97316' }} 
                    title="Manual transition"
                  />
                )}
              </div>
            </div>
          </Tooltip>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(CustomEdge);

