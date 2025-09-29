import React, { useMemo } from 'react';
import { Modal, Tabs, Button, Descriptions, Table, Divider } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';

interface EntitiesDetailsDialogProps {
  visible: boolean;
  onClose: () => void;
  chatData: any;
  isLoadingRollback?: boolean;
  onRollbackChat?: () => void;
}

const EntitiesDetailsDialog: React.FC<EntitiesDetailsDialogProps> = ({
  visible,
  onClose,
  chatData,
  isLoadingRollback = false,
  onRollbackChat
}) => {
  const entitiesData = useMemo(() => {
    return chatData?.chat_body?.entities_data || {};
  }, [chatData]);

  const workflows = useMemo(() => {
    return Object.keys(entitiesData).map(id => ({
      id,
      ...entitiesData[id]
    }));
  }, [entitiesData]);

  const handleRollbackChat = () => {
    if (onRollbackChat) {
      onRollbackChat();
    }
  };

  const renderWorkflowDetails = (workflow: any) => {
    const columns = [
      {
        title: '#',
        dataIndex: 'index',
        key: 'index',
        width: 50,
        render: (_: any, __: any, index: number) => index + 1
      },
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        width: 250
      },
      {
        title: 'Name',
        dataIndex: 'state',
        key: 'state'
      }
    ];

    return (
      <div className="entities-details-dialog-details">
        <Descriptions
          column={1}
          size="small"
          bordered
        >
          <Descriptions.Item label="ID" labelStyle={{ width: '300px' }}>
            {workflow.id}
          </Descriptions.Item>
          {workflow.next_transitions && workflow.next_transitions.length > 0 && (
            <Descriptions.Item label="Next Transitions">
              {workflow.next_transitions.join(', ')}
            </Descriptions.Item>
          )}
        </Descriptions>

        {workflow.entity_versions && workflow.entity_versions.length > 0 && (
          <div className="entities-details-dialog-details__entity-versions" style={{ marginTop: '16px' }}>
            <h3>Entity Versions</h3>
            <Table
              dataSource={workflow.entity_versions}
              columns={columns}
              pagination={false}
              scroll={{ y: 400 }}
              size="small"
              rowKey={(record, index) => `${workflow.id}-${index}`}
            />
          </div>
        )}
      </div>
    );
  };

  const tabItems = workflows.map(workflow => ({
    key: workflow.id,
    label: workflow.workflow_name || workflow.id,
    children: renderWorkflowDetails(workflow)
  }));

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span>Entities Data</span>
          <Divider type="vertical" />
          <Button
            onClick={handleRollbackChat}
            loading={isLoadingRollback}
            size="small"
            type="primary"
            icon={<RollbackOutlined />}
          >
            Restart workflows
          </Button>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width="70%"
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      maskClosable={false}
    >
      {workflows.length > 0 ? (
        <Tabs items={tabItems} />
      ) : (
        <div>No entities data available</div>
      )}
    </Modal>
  );
};

export default EntitiesDetailsDialog;
