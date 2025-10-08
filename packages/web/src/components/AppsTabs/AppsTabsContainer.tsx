import React, { useState, useCallback, useMemo } from 'react';
import { AppsTabs } from './AppsTabs';
import { useAppsTabsStore } from '@/stores/appsTabs';
import { AppsCanvas, sampleAppData } from '../AppsCanvas';
import { Modal, Form, Input, InputNumber, Button } from 'antd';
import { FileCode2 } from 'lucide-react';
import type { AppRoot } from '../AppsCanvas/types/appSchema';

export const AppsTabsContainer: React.FC = () => {
  const { tabs, activeTabId, openTab, updateTab, getActiveTab } = useAppsTabsStore();

  const activeTab = getActiveTab();

  // Use sample app data from app_config_example.json
  const appData = useMemo((): AppRoot => {
    return sampleAppData;
  }, []);

  // Note: Removed auto-open sample app to avoid conflicts with URL parameters
  // The AppTabsView will handle auto-opening from URL params

  // Create a new empty tab directly without modal
  const handleNewTab = useCallback(() => {
    // Generate a truly unique model name using timestamp
    const timestamp = Date.now();
    const modelName = `new-app-${timestamp}`;
    const modelVersion = 1;
    const technicalId = `${modelName}_v${modelVersion}_${timestamp}`;

    openTab({
      modelName,
      modelVersion,
      displayName: `${modelName}.${modelVersion}`,
      isDirty: false,
      technicalId,
    });
  }, [openTab]);

  const handleAppUpdate = useCallback((tabId: string, data: { canvasData: string; appMetaData: any }) => {
    // Mark tab as dirty when app is updated
    updateTab(tabId, { isDirty: true });
  }, [updateTab]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Tab Bar */}
      <AppsTabs onNewTab={handleNewTab} />

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab ? (
          <div key={activeTab.id} className="h-full">
            <AppsCanvas
              appData={appData}
              onNavigate={(tab, targetId) => {
                console.log('Navigate to:', tab, targetId);
              }}
              onAppDataUpdate={(updatedAppData) => {
                console.log('App data updated:', updatedAppData);
                updateTab(activeTab.id, { isDirty: true });
              }}
            />
          </div>
        ) : (
          // Empty state when no tabs are open
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileCode2 size={64} className="mx-auto mb-4 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-300 mb-2">
                No App Open
              </h2>
              <p className="text-gray-500 mb-6">
                Click the + button to create a new app
              </p>
              <Button
                type="primary"
                size="large"
                onClick={handleNewTab}
                className="bg-blue-600 hover:bg-blue-700"
              >
                New App
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

