import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Button, Dropdown, Menu } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';

interface WorkflowNodeData {
  label: string;
  nodeId: string;
  isInitial?: boolean;
  isSelected?: boolean;
  nodeType?: 'initial' | 'normal' | 'final';
  transitions?: Array<{
    name: string;
    next: string;
    manual?: boolean;
  }>;
}

const WorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({ 
  data, 
  selected,
  id 
}) => {
  const { label, nodeId, isInitial, nodeType = 'normal', transitions = [] } = data;

  const getNodeTypeClass = () => {
    if (isInitial || nodeType === 'initial') return 'workflow-node--initial';
    if (nodeType === 'final') return 'workflow-node--final';
    return 'workflow-node--normal';
  };

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
      className={`workflow-node ${getNodeTypeClass()} ${selected ? 'selected' : ''}`}
      onClick={handleNodeClick}
      style={{
        background: 'var(--bg-dialog-color)',
        border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--accent-border)'}`,
        borderRadius: '8px',
        padding: '12px 16px',
        minWidth: '120px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
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
      <div className="workflow-node__content">
        <div className="workflow-node__header">
          <div className="workflow-node__title">
            {isInitial && <span className="workflow-node__initial-indicator">⭐</span>}
            <span className="workflow-node__label">{label || nodeId}</span>
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
            />
          </Dropdown>
        </div>

        {/* Transitions Info */}
        {transitions.length > 0 && (
          <div className="workflow-node__transitions">
            <div className="workflow-node__transitions-count">
              {transitions.length} transition{transitions.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(WorkflowNode);
