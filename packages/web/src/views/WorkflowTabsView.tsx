import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WorkflowTabsContainer } from '@/components/WorkflowTabs';
import { useWorkflowTabsStore } from '@/stores/workflowTabs';
import { ArrowLeft, X, Minimize2 } from 'lucide-react';

const WorkflowTabsView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openTab, tabs } = useWorkflowTabsStore();

  // Auto-open workflow from query parameters
  useEffect(() => {
    const modelName = searchParams.get('model');
    const versionParam = searchParams.get('version');
    const displayName = searchParams.get('name');

    // Validate parameters
    if (!modelName || !versionParam) {
      return;
    }

    // Parse version as number
    const modelVersion = parseInt(versionParam, 10);

    // Validate version is a valid number
    if (isNaN(modelVersion) || modelVersion < 1) {
      console.error('Invalid version parameter:', versionParam);
      return;
    }

    // Check if this workflow is already open
    const existingTab = tabs.find(
      tab => tab.modelName === modelName && tab.modelVersion === modelVersion
    );

    // Only open if not already open
    if (!existingTab) {
      openTab({
        modelName,
        modelVersion,
        displayName: displayName || `${modelName}.${modelVersion}`,
        isDirty: false,
        technicalId: `${modelName}_v${modelVersion}`,
      });
    }
  }, [searchParams, openTab, tabs]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900">
      <WorkflowTabsContainer />
    </div>
  );
};

export default WorkflowTabsView;

