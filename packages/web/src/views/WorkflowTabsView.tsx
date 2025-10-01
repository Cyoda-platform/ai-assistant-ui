import React from 'react';
import { WorkflowTabsContainer } from '@/components/WorkflowTabs';

const WorkflowTabsView: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900">
      <WorkflowTabsContainer />
    </div>
  );
};

export default WorkflowTabsView;

