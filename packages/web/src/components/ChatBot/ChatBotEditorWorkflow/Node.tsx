import React, { memo, useCallback, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Button, Dropdown, Tooltip, Badge, Tag, Input } from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';

interface WorkflowNodeData {
  label: string;
  nodeId: string;
  isInitial?: boolean;
  isTerminal?: boolean;
  isSelected?: boolean;
  nodeType?: 'initial' | 'normal' | 'final';
  onNameChange?: (nodeId: string, newName: string) => void;
  transitions?: Array<{
    name: string;
    next: string;
    manual?: boolean;
    processors?: Array<{
      name: string;
      executionMode?: string;
    }>;
    criterion?: {
      type: string;
    };
  }>;
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
}> = {
  'top-left': {
    position: Position.Top,
    style: { left: '25%', top: '-6px', transform: 'translateX(-50%)' }
  },
  'top-center': {
    position: Position.Top,
    style: { left: '50%', top: '-6px', transform: 'translateX(-50%)' }
  },
  'top-right': {
    position: Position.Top,
    style: { left: '75%', top: '-6px', transform: 'translateX(-50%)' }
  },
  'left-center': {
    position: Position.Left,
    style: { left: '-6px', top: '50%', transform: 'translateY(-50%)' }
  },
  'right-center': {
    position: Position.Right,
    style: { right: '-6px', top: '50%', transform: 'translateY(-50%)' }
  },
  'bottom-left': {
    position: Position.Bottom,
    style: { left: '25%', bottom: '-6px', transform: 'translateX(-50%)' }
  },
  'bottom-center': {
    position: Position.Bottom,
    style: { left: '50%', bottom: '-6px', transform: 'translateX(-50%)' }
  },
  'bottom-right': {
    position: Position.Bottom,
    style: { left: '75%', bottom: '-6px', transform: 'translateX(-50%)' }
  }
};

const WorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({
  data,
  selected,
  id
}) => {
  const { label, nodeId, isInitial, isTerminal, nodeType = 'normal', transitions = [], onNameChange } = data;

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label || nodeId);

  // Determine node type and colors based on requirements
  const getNodeStyle = () => {
    let backgroundColor = '#3B82F6'; // Blue for normal states
    let borderColor = '#2563EB';
    let textColor = '#FFFFFF';

    if (isInitial || nodeType === 'initial') {
      backgroundColor = '#14B8A6'; // Teal for initial state
      borderColor = '#0D9488';
    } else if (isTerminal || nodeType === 'final' || transitions.length === 0) {
      backgroundColor = '#10B981'; // Green for terminal states
      borderColor = '#059669';
    }

    if (selected) {
      borderColor = '#F59E0B'; // Amber for selected
    }

    return {
      backgroundColor,
      borderColor,
      textColor
    };
  };

  const nodeStyle = getNodeStyle();

  // Inline editing handlers
  const handleStartEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(label || nodeId);
  }, [label, nodeId]);

  const handleSaveEdit = useCallback(() => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== label && onNameChange) {
      onNameChange(nodeId, trimmedValue);
    }
    setIsEditing(false);
  }, [editValue, label, nodeId, onNameChange]);

  const handleCancelEdit = useCallback(() => {
    setEditValue(label || nodeId);
    setIsEditing(false);
  }, [label, nodeId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  // Calculate statistics
  const hasProcessors = transitions.some(t => t.processors && t.processors.length > 0);
  const hasCriteria = transitions.some(t => t.criterion);
  const manualCount = transitions.filter(t => t.manual).length;
  const automaticCount = transitions.length - manualCount;

  const handleNodeClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    // Handle node selection logic here
  }, []);

  const handleEditNode = useCallback(() => {
    // Handle edit node logic
    console.log('Edit node:', nodeId);
  }, [nodeId]);

  const handleDeleteNode = useCallback(() => {
    // Handle delete node logic
    console.log('Delete node:', nodeId);
  }, [nodeId]);

  const handleDuplicateNode = useCallback(() => {
    // Handle duplicate node logic
    console.log('Duplicate node:', nodeId);
  }, [nodeId]);

  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit State',
      onClick: handleEditNode,
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: 'Duplicate State',
      onClick: handleDuplicateNode,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete State',
      onClick: handleDeleteNode,
      danger: true,
    },
  ];

  // Render anchor point handles with 8-point system
  const renderAnchorPoint = (anchorId: AnchorPoint) => {
    const config = ANCHOR_POINTS[anchorId];

    // Determine handle types based on position:
    // Top and Left = Target handles (incoming connections)
    // Bottom and Right = Source handles (outgoing connections)
    const isSourcePosition = config.position === Position.Bottom || config.position === Position.Right;
    const isTargetPosition = config.position === Position.Top || config.position === Position.Left;

    const handleStyle: React.CSSProperties = {
      ...config.style,
      width: '12px',
      height: '12px',
      background: '#3B82F6',
      border: '2px solid white',
      opacity: 0.6,
      transition: 'all 0.2s ease',
    };

    return (
      <React.Fragment key={anchorId}>
        {/* Render source handle for bottom and right positions */}
        {isSourcePosition && (
          <Handle
            type="source"
            position={config.position}
            id={`${anchorId}-source`}
            style={handleStyle}
            className="connection-handle hover:opacity-100 hover:scale-110"
          />
        )}

        {/* Render target handle for top and left positions */}
        {isTargetPosition && (
          <Handle
            type="target"
            position={config.position}
            id={`${anchorId}-target`}
            style={handleStyle}
            className="connection-handle hover:opacity-100 hover:scale-110"
          />
        )}
      </React.Fragment>
    );
  };

  return (
    <div
      className={`workflow-node ${selected ? 'selected' : ''}`}
      onClick={handleNodeClick}
      style={{
        background: nodeStyle.backgroundColor,
        border: `3px solid ${nodeStyle.borderColor}`,
        borderRadius: '12px',
        padding: '0',
        minWidth: '160px',
        maxWidth: '240px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: selected
          ? '0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(245, 158, 11, 0.3)'
          : '0 4px 8px rgba(0, 0, 0, 0.1)',
        color: nodeStyle.textColor,
      }}
    >
      {/* 8-Point Anchor System */}
      {(Object.keys(ANCHOR_POINTS) as AnchorPoint[]).map(renderAnchorPoint)}

      {/* Node Content */}
      <div className="workflow-node__content" style={{ padding: '12px 16px' }}>
        {/* Header */}
        <div className="workflow-node__header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <div className="workflow-node__title" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flex: 1,
            fontWeight: 600,
            fontSize: '14px'
          }}>
            {isInitial && (
              <Tooltip title="Initial State">
                <span style={{ fontSize: '16px' }}>⭐</span>
              </Tooltip>
            )}
            {isTerminal && (
              <Tooltip title="Terminal State">
                <CheckCircleOutlined style={{ fontSize: '14px' }} />
              </Tooltip>
            )}

            {/* Inline Name Editor */}
            {isEditing ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flex: 1
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              >
                <Input
                  size="small"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveEdit}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  autoFocus
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={handleSaveEdit}
                  style={{ color: '#52c41a', padding: '0 4px' }}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={handleCancelEdit}
                  style={{ color: '#ff4d4f', padding: '0 4px' }}
                />
              </div>
            ) : (
              <div
                className="workflow-node__label-container"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flex: 1,
                  cursor: 'text'
                }}
                onDoubleClick={handleStartEdit}
              >
                <span className="workflow-node__label" style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}>
                  {label || nodeId}
                </span>
                {onNameChange && (
                  <EditOutlined
                    style={{
                      fontSize: '12px',
                      opacity: 0.6,
                      cursor: 'pointer'
                    }}
                    onClick={handleStartEdit}
                    className="hover:opacity-100"
                  />
                )}
              </div>
            )}
          </div>

          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              className="workflow-node__menu-button"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: nodeStyle.textColor,
                opacity: 0.8
              }}
            />
          </Dropdown>
        </div>

        {/* Transitions Info */}
        {transitions.length > 0 && (
          <div className="workflow-node__transitions" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '12px',
            opacity: 0.9
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BranchesOutlined />
              <span>{transitions.length} transition{transitions.length !== 1 ? 's' : ''}</span>
            </div>

            {(manualCount > 0 || automaticCount > 0) && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {manualCount > 0 && (
                  <Tooltip title="Manual transitions">
                    <Tag
                      color="orange"
                      style={{
                        margin: 0,
                        fontSize: '11px',
                        padding: '0 6px',
                        lineHeight: '18px'
                      }}
                    >
                      {manualCount} manual
                    </Tag>
                  </Tooltip>
                )}
                {automaticCount > 0 && (
                  <Tooltip title="Automatic transitions">
                    <Tag
                      color="blue"
                      style={{
                        margin: 0,
                        fontSize: '11px',
                        padding: '0 6px',
                        lineHeight: '18px'
                      }}
                    >
                      {automaticCount} auto
                    </Tag>
                  </Tooltip>
                )}
              </div>
            )}

            {hasProcessors && (
              <Tooltip title="Has processors">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ThunderboltOutlined />
                  <span>Processors</span>
                </div>
              </Tooltip>
            )}

            {hasCriteria && (
              <Tooltip title="Has conditional criteria">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BranchesOutlined />
                  <span>Conditional</span>
                </div>
              </Tooltip>
            )}
          </div>
        )}

        {/* Terminal state indicator */}
        {isTerminal && (
          <div style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            fontSize: '11px',
            textAlign: 'center',
            fontWeight: 500
          }}>
            Terminal State
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(WorkflowNode);
