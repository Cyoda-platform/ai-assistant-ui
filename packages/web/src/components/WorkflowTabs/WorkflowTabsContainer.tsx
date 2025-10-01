import React, { useState, useCallback } from 'react';
import { WorkflowTabs } from './WorkflowTabs';
import { useWorkflowTabsStore } from '@/stores/workflowTabs';
import ChatBotEditorWorkflowNew from '../ChatBot/ChatBotEditorWorkflowNew';
import { Modal, Form, Input, InputNumber, Button } from 'antd';
import { FileCode2 } from 'lucide-react';

export const WorkflowTabsContainer: React.FC = () => {
  const { tabs, activeTabId, openTab, updateTab, getActiveTab } = useWorkflowTabsStore();

  const activeTab = getActiveTab();

  // Note: Removed auto-open sample workflow to avoid conflicts with URL parameters
  // The WorkflowTabsView will handle auto-opening from URL params

  // Create a new empty tab directly without modal
  const handleNewTab = useCallback(() => {
    // Generate a unique counter for new tabs
    const newTabCounter = tabs.filter(t => t.modelName.startsWith('new-workflow')).length + 1;
    const modelName = `new-workflow-${newTabCounter}`;
    const modelVersion = 1;
    const technicalId = `${modelName}_v${modelVersion}_${Date.now()}`;

    openTab({
      modelName,
      modelVersion,
      displayName: `New Workflow ${newTabCounter}`,
      isDirty: false,
      technicalId,
    });
  }, [openTab, tabs]);

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
              modelName={activeTab.modelName}
              modelVersion={activeTab.modelVersion}
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
                Click the + button to create a new workflow
              </p>
              <Button
                type="primary"
                size="large"
                onClick={handleNewTab}
                className="bg-blue-600 hover:bg-blue-700"
              >
                New Workflow
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

