import React, { useState } from 'react';
import { X, Plus, FileCode2, Trash2, Edit2 } from 'lucide-react';
import { useWorkflowTabsStore, WorkflowTab } from '@/stores/workflowTabs';
import { Dropdown, Modal, Input } from 'antd';
import type { MenuProps } from 'antd';

interface WorkflowTabsProps {
  onNewTab?: () => void;
}

export const WorkflowTabs: React.FC<WorkflowTabsProps> = ({ onNewTab }) => {
  const { tabs, activeTabId, setActiveTab, closeTab, closeOtherTabs, closeAllTabs, updateTab } = useWorkflowTabsStore();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editModelName, setEditModelName] = useState('');
  const [editModelVersion, setEditModelVersion] = useState(1);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const handleCloseAllTabs = () => {
    Modal.confirm({
      title: 'Close All Tabs?',
      content: 'Are you sure you want to close all workflow tabs? Any unsaved changes will be lost.',
      okText: 'Close All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        closeAllTabs();
      },
    });
  };

  const handleEditTab = (tab: WorkflowTab) => {
    setEditingTabId(tab.id);
    setEditDisplayName(tab.displayName);
    setEditModelName(tab.modelName);
    setEditModelVersion(tab.modelVersion);
  };

  const handleSaveEdit = () => {
    if (!editingTabId) return;

    // Validate inputs
    if (!editModelName.trim()) {
      Modal.error({
        title: 'Invalid Model Name',
        content: 'Model name cannot be empty',
      });
      return;
    }

    if (editModelVersion < 1) {
      Modal.error({
        title: 'Invalid Version',
        content: 'Version must be at least 1',
      });
      return;
    }

    // Update the tab - keep the same ID and technicalId to preserve workflow data
    updateTab(editingTabId, {
      modelName: editModelName,
      modelVersion: editModelVersion,
      displayName: `${editModelName}.${editModelVersion}`,
    });

    // Clear editing state
    setEditingTabId(null);
    setEditDisplayName('');
    setEditModelName('');
    setEditModelVersion(1);
  };

  const handleCancelEdit = () => {
    // Clear editing state
    setEditingTabId(null);
    setEditDisplayName('');
    setEditModelName('');
    setEditModelVersion(1);
  };

  const getContextMenuItems = (tab: WorkflowTab): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit2 size={14} />,
      onClick: () => handleEditTab(tab),
    },
    {
      type: 'divider',
    },
    {
      key: 'close',
      label: 'Close',
      onClick: () => closeTab(tab.id),
    },
    {
      key: 'close-others',
      label: 'Close Others',
      onClick: () => closeOtherTabs(tab.id),
      disabled: tabs.length <= 1,
    },
    {
      key: 'close-all',
      label: 'Close All',
      onClick: () => closeAllTabs(),
    },
  ];

  return (
    <div className="flex items-center bg-gray-900 border-b border-gray-700 overflow-x-auto min-h-[48px]">
      {/* Tabs */}
      <div className="flex items-center flex-1 overflow-x-auto min-h-[48px]">
        {tabs.length === 0 && (
          <div className="px-4 py-2.5 text-sm text-gray-500">
            No workflows open
          </div>
        )}
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          return (
            <Dropdown
              key={tab.id}
              menu={{ items: getContextMenuItems(tab) }}
              trigger={['contextMenu']}
            >
              <div
                onClick={() => handleTabClick(tab.id)}
                className={`
                  group flex items-center gap-2 px-4 py-2.5 cursor-pointer
                  border-r border-gray-700 min-w-[180px] max-w-[240px]
                  transition-colors relative
                  ${isActive
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                  }
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}

                {/* Icon */}
                <FileCode2 size={16} className={isActive ? 'text-blue-400' : 'text-gray-500'} />

                {/* Tab content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {tab.displayName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {tab.modelName} v{tab.modelVersion}
                  </div>
                </div>

                {/* Dirty indicator */}
                {tab.isDirty && (
                  <div className="w-2 h-2 rounded-full bg-orange-500" title="Unsaved changes" />
                )}

                {/* Close button */}
                <button
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className={`
                    p-1 rounded hover:bg-gray-700 transition-colors
                    ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  `}
                  title="Close tab"
                >
                  <X size={14} />
                </button>
              </div>
            </Dropdown>
          );
        })}
      </div>

      {/* New tab button */}
      {onNewTab && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onNewTab();
          }}
          className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border-l border-gray-700 relative z-10"
          title="Open new workflow"
        >
          <Plus size={16} />
        </button>
      )}

      {/* Edit Tab Modal */}
      <Modal
        title="Edit Workflow Tab"
        open={editingTabId !== null}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        okText="Save"
        cancelButtonProps={{ style: { display: 'none' } }}
        className="workflow-edit-modal"
        centered
        afterClose={() => {
          setEditDisplayName('');
          setEditModelName('');
          setEditModelVersion(1);
        }}
        maskClosable={true}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Model Name <span className="text-pink-400">*</span>
            </label>
            <Input
              value={editModelName}
              onChange={(e) => setEditModelName(e.target.value)}
              placeholder="e.g., user-registration"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Entity model name (alphanumeric, hyphens, underscores)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Model Version <span className="text-pink-400">*</span>
            </label>
            <Input
              type="number"
              min={1}
              value={editModelVersion}
              onChange={(e) => setEditModelVersion(parseInt(e.target.value) || 1)}
              placeholder="1"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Version number (must be at least 1)
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

