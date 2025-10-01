import React, { useState, useCallback } from 'react';
import { WorkflowTabs } from './WorkflowTabs';
import { useWorkflowTabsStore } from '@/stores/workflowTabs';
import ChatBotEditorWorkflowNew from '../ChatBot/ChatBotEditorWorkflowNew';
import { Modal, Form, Input, InputNumber, Button } from 'antd';
import { FileCode2 } from 'lucide-react';

export const WorkflowTabsContainer: React.FC = () => {
  const { tabs, activeTabId, openTab, updateTab, getActiveTab } = useWorkflowTabsStore();
  const [isNewWorkflowModalOpen, setIsNewWorkflowModalOpen] = useState(false);
  const [form] = Form.useForm();

  const activeTab = getActiveTab();

  // Open a sample tab on first load for demo purposes
  React.useEffect(() => {
    if (tabs.length === 0) {
      // Automatically open a sample workflow tab
      openTab({
        modelName: 'sample-workflow',
        modelVersion: 1,
        displayName: 'Sample Workflow',
        isDirty: false,
        technicalId: `sample-workflow_v1_${Date.now()}`,
      });
    }
  }, []);

  const handleNewTab = useCallback(() => {
    setIsNewWorkflowModalOpen(true);
  }, []);

  const handleCreateWorkflow = useCallback(() => {
    form.validateFields().then((values) => {
      const { modelName, modelVersion, displayName } = values;

      // Generate technical ID for storage
      const technicalId = `${modelName}_v${modelVersion}_${Date.now()}`;

      openTab({
        modelName,
        modelVersion,
        displayName: displayName || `${modelName} v${modelVersion}`,
        isDirty: false,
        technicalId,
      });

      setIsNewWorkflowModalOpen(false);
      form.resetFields();
    });
  }, [form, openTab]);

  const handleWorkflowUpdate = useCallback((tabId: string, data: { canvasData: string; workflowMetaData: any }) => {
    // Mark tab as dirty when workflow is updated
    updateTab(tabId, { isDirty: true });
  }, [updateTab]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Tab Bar */}
      <WorkflowTabs onNewTab={handleNewTab} />

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab ? (
          <div key={activeTab.id} className="h-full">
            <ChatBotEditorWorkflowNew
              technicalId={activeTab.technicalId}
              onUpdate={(data) => handleWorkflowUpdate(activeTab.id, data)}
            />
          </div>
        ) : (
          // Empty state when no tabs are open
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileCode2 size={64} className="mx-auto mb-4 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-300 mb-2">
                No Workflow Open
              </h2>
              <p className="text-gray-500 mb-6">
                Open a workflow to start editing
              </p>
              <Button
                type="primary"
                size="large"
                onClick={handleNewTab}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Open New Workflow
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Workflow Modal */}
      <Modal
        title="Open New Workflow"
        open={isNewWorkflowModalOpen}
        onOk={handleCreateWorkflow}
        onCancel={() => {
          setIsNewWorkflowModalOpen(false);
          form.resetFields();
        }}
        okText="Open"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            modelVersion: 1,
          }}
        >
          <Form.Item
            name="modelName"
            label="Entity Model Name"
            rules={[
              { required: true, message: 'Please enter the entity model name' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Only alphanumeric characters, hyphens, and underscores allowed' }
            ]}
          >
            <Input placeholder="e.g., user-registration, order-processing" />
          </Form.Item>

          <Form.Item
            name="modelVersion"
            label="Model Version"
            rules={[
              { required: true, message: 'Please enter the model version' },
              { type: 'number', min: 1, message: 'Version must be at least 1' }
            ]}
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>

          <Form.Item
            name="displayName"
            label="Display Name (Optional)"
            tooltip="A friendly name for the tab. If not provided, will use 'ModelName vVersion'"
          >
            <Input placeholder="e.g., User Registration Workflow" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

