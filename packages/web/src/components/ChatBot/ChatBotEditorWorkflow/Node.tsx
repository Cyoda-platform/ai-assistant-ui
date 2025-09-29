import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Button, Dropdown, Tooltip, Badge, Tag } from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

interface WorkflowNodeData {
  label: string;
  nodeId: string;
  isInitial?: boolean;
  isTerminal?: boolean;
  isSelected?: boolean;
  nodeType?: 'initial' | 'normal' | 'final';
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

const WorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({
  data,
  selected,
  id
}) => {
  const { label, nodeId, isInitial, isTerminal, nodeType = 'normal', transitions = [] } = data;

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
      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="connection-handle universal-handle"
        style={{ left: '-8px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="connection-handle universal-handle"
        style={{ right: '-8px' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="connection-handle universal-handle"
        style={{ top: '-8px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="connection-handle universal-handle"
        style={{ bottom: '-8px' }}
      />

      {/* Target Handles (invisible) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="connection-handle target-invisible"
        style={{ left: '-8px', opacity: 0 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="connection-handle target-invisible"
        style={{ right: '-8px', opacity: 0 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="connection-handle target-invisible"
        style={{ top: '-8px', opacity: 0 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="connection-handle target-invisible"
        style={{ bottom: '-8px', opacity: 0 }}
      />

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
            <span className="workflow-node__label" style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {label || nodeId}
            </span>
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
