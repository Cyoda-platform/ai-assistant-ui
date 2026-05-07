import React, { useState } from 'react';
import { X, FileCode2, Trash2, Edit2 } from 'lucide-react';
import { useAppsTabsStore, AppTab } from '@/stores/appsTabs';
import { Dropdown, Modal, Input } from 'antd';
import type { MenuProps } from 'antd';

interface AppTabsProps {
  // onNewTab removed - one app per chat
}

export const AppsTabs: React.FC<AppTabsProps> = () => {
  const { tabs, activeTabId, setActiveTab, closeTab, closeOtherTabs, closeAllTabs, updateTab } = useAppsTabsStore();
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
      content: 'Are you sure you want to close all app tabs? Any unsaved changes will be lost.',
      okText: 'Close All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        closeAllTabs();
      },
    });
  };

  const handleEditTab = (tab: AppTab) => {
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

    // Update the tab - keep the same ID and technicalId to preserve app data
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

  const getContextMenuItems = (tab: AppTab): MenuProps['items'] => [
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
    <div className="flex items-center bg-white border-b border-slate-200 overflow-x-auto min-h-[48px]">
      {/* Tabs */}
      <div className="flex items-center flex-1 overflow-x-auto min-h-[48px]">
        {tabs.length === 0 && (
          <div className="px-4 py-2.5 text-sm text-slate-500">
            No apps open
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
                  border-r border-slate-200 min-w-[180px] max-w-[240px]
                  transition-colors relative
                  ${isActive
                    ? 'bg-slate-50 text-slate-900'
                    : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-teal-600" />
                )}

                {/* Icon */}
                <FileCode2 size={16} className={isActive ? 'text-teal-600' : 'text-slate-400'} />

                {/* Tab content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {tab.displayName}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
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
                    p-1 rounded hover:bg-slate-100 transition-colors
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

      {/* New tab button removed - one app per chat */}

      {/* Edit Tab Modal */}
      <Modal
        title="Edit App Tab"
        open={editingTabId !== null}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        okText="Save"
        cancelButtonProps={{ style: { display: 'none' } }}
        className="app-edit-modal"
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
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Model Name <span className="text-pink-400">*</span>
            </label>
            <Input
              value={editModelName}
              onChange={(e) => setEditModelName(e.target.value)}
              placeholder="e.g., user-registration"
              className="bg-white border-slate-300 text-slate-900"
            />
            <p className="text-xs text-slate-500 mt-1">
              Entity model name (alphanumeric, hyphens, underscores)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Model Version <span className="text-pink-400">*</span>
            </label>
            <Input
              type="number"
              min={1}
              value={editModelVersion}
              onChange={(e) => setEditModelVersion(parseInt(e.target.value) || 1)}
              placeholder="1"
              className="bg-white border-slate-300 text-slate-900"
            />
            <p className="text-xs text-slate-500 mt-1">
              Version number (must be at least 1)
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

