# Workflow Implementation Guide

## Quick Start

This guide provides code examples and implementation patterns for building the workflow management system in the web package.

---

## 1. Store Implementation (Zustand)

### File: `src/stores/workflows.ts`

```typescript
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import HelperWorkflowStorage from '@/helpers/HelperWorkflowStorage';

export interface Workflow {
  technical_id: string;
  name: string;
  description: string;
  date: string;
  workflowMetaData: string | object;
  canvasData: string | object;
}

interface WorkflowState {
  workflowList: Workflow[];
  selectedWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;
}

interface WorkflowActions {
  getAll: () => Promise<void>;
  createWorkflow: (data: Partial<Workflow>) => Promise<Workflow>;
  updateWorkflow: (data: Partial<Workflow> & { technical_id: string }) => Promise<void>;
  deleteWorkflowById: (technical_id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  setSelectedWorkflow: (workflow: Workflow | null) => void;
}

export const useWorkflowStore = create<WorkflowState & WorkflowActions>((set, get) => ({
  // State
  workflowList: [],
  selectedWorkflow: null,
  isLoading: false,
  error: null,

  // Actions
  getAll: async () => {
    try {
      set({ isLoading: true, error: null });
      const workflows = await HelperWorkflowStorage.getWorkflows();
      set({ workflowList: workflows, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load workflows', isLoading: false });
      console.error('Error loading workflows:', error);
    }
  },

  createWorkflow: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const workflows = await HelperWorkflowStorage.getWorkflows();
      
      const newWorkflow: Workflow = {
        name: data.name?.trim() || 'Untitled Workflow',
        description: data.description?.trim() || '',
        technical_id: data.technical_id || uuidv4(),
        date: new Date().toISOString(),
        workflowMetaData: data.workflowMetaData || '',
        canvasData: data.canvasData || '',
      };

      workflows.unshift(newWorkflow);
      await HelperWorkflowStorage.setWorkflows(workflows);
      
      set({ workflowList: workflows, isLoading: false });
      return newWorkflow;
    } catch (error) {
      set({ error: 'Failed to create workflow', isLoading: false });
      throw error;
    }
  },

  updateWorkflow: async (data) => {
    try {
      const workflows = await HelperWorkflowStorage.getWorkflows();
      const existingWorkflow = workflows.find(w => w.technical_id === data.technical_id);

      if (!existingWorkflow) {
        throw new Error('Workflow not found');
      }

      // Update fields
      if ('name' in data) existingWorkflow.name = data.name!.trim();
      if ('description' in data) existingWorkflow.description = data.description!.trim();

      // Serialize complex objects
      if ('workflowMetaData' in data) {
        existingWorkflow.workflowMetaData = typeof data.workflowMetaData === 'string'
          ? data.workflowMetaData
          : JSON.stringify(data.workflowMetaData);
      }

      if ('canvasData' in data) {
        existingWorkflow.canvasData = typeof data.canvasData === 'string'
          ? data.canvasData
          : JSON.stringify(data.canvasData);
      }

      await HelperWorkflowStorage.setWorkflows(workflows);
      set({ workflowList: workflows });
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  },

  deleteWorkflowById: async (technical_id) => {
    try {
      const workflows = await HelperWorkflowStorage.getWorkflows();
      const filtered = workflows.filter(w => w.technical_id !== technical_id);
      await HelperWorkflowStorage.setWorkflows(filtered);
      
      const { selectedWorkflow } = get();
      if (selectedWorkflow?.technical_id === technical_id) {
        set({ selectedWorkflow: null });
      }
      
      set({ workflowList: filtered });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  },

  deleteAll: async () => {
    try {
      await HelperWorkflowStorage.setWorkflows([]);
      set({ workflowList: [], selectedWorkflow: null });
    } catch (error) {
      console.error('Error deleting all workflows:', error);
      throw error;
    }
  },

  setSelectedWorkflow: (workflow) => {
    set({ selectedWorkflow: workflow });
  },
}));
```

---

## 2. Storage Helper

### File: `src/helpers/HelperWorkflowStorage.ts`

```typescript
const WORKFLOW_STORAGE_KEY = 'WORKFLOW_LIST';

export interface Workflow {
  technical_id: string;
  name: string;
  description: string;
  date: string;
  workflowMetaData: string | object;
  canvasData: string | object;
}

class HelperWorkflowStorage {
  static async getWorkflows(): Promise<Workflow[]> {
    try {
      const data = localStorage.getItem(WORKFLOW_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading workflows from storage:', error);
      return [];
    }
  }

  static async setWorkflows(workflows: Workflow[]): Promise<void> {
    try {
      localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(workflows));
    } catch (error) {
      console.error('Error saving workflows to storage:', error);
      throw error;
    }
  }

  static async clearWorkflows(): Promise<void> {
    try {
      localStorage.removeItem(WORKFLOW_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing workflows from storage:', error);
      throw error;
    }
  }
}

export default HelperWorkflowStorage;
```

---

## 3. Main Workflow View

### File: `src/views/WorkflowView.tsx`

```typescript
import React, { useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';
import { useWorkflowStore } from '@/stores/workflows';
import WorkflowHeader from '@/components/Workflow/WorkflowHeader';
import WorkflowSidebar from '@/components/Workflow/WorkflowSidebar';
import ChatBotEditorWorkflow from '@/components/ChatBot/ChatBotEditorWorkflow';
import './WorkflowView.scss';

const WorkflowView: React.FC = () => {
  const { selectedWorkflow, updateWorkflow } = useWorkflowStore();
  const editorRef = useRef<any>(null);

  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce(
      ({ workflowMetaData, canvasData }: { workflowMetaData: any; canvasData: any }) => {
        if (!selectedWorkflow) return;

        const cleanMetaData = workflowMetaData ? JSON.parse(JSON.stringify(workflowMetaData)) : null;
        const cleanCanvasData = canvasData ? JSON.parse(JSON.stringify(canvasData)) : null;

        updateWorkflow({
          technical_id: selectedWorkflow.technical_id,
          workflowMetaData: cleanMetaData,
          canvasData: cleanCanvasData,
        });
      },
      500
    ),
    [selectedWorkflow, updateWorkflow]
  );

  // Update editor when selected workflow changes
  useEffect(() => {
    if (editorRef.current && selectedWorkflow) {
      editorRef.current.setWorkflowData({
        workflowMetaData: selectedWorkflow.workflowMetaData,
        canvasData: selectedWorkflow.canvasData,
      });
    }
  }, [selectedWorkflow]);

  return (
    <div className="workflow-view">
      <WorkflowSidebar />
      <div className="workflow-view__content">
        <WorkflowHeader />
        {selectedWorkflow ? (
          <ChatBotEditorWorkflow
            ref={editorRef}
            technicalId={selectedWorkflow.technical_id}
            onUpdate={debouncedUpdate}
            onAnswer={() => {}}
          />
        ) : (
          <div className="workflow-view__empty-state">
            <div className="workflow-view__empty-state-content">
              <h2 className="workflow-view__empty-state-title">
                No Workflow Selected
              </h2>
              <p className="workflow-view__empty-state-message">
                Choose an existing workflow from the sidebar or create a new one to get started
                with your automation journey.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowView;
```

---

## 4. Workflow List Component

### File: `src/components/Workflow/WorkflowList.tsx`

```typescript
import React, { useEffect, useMemo } from 'react';
import { useWorkflowStore, Workflow } from '@/stores/workflows';
import WorkflowGroup from './WorkflowGroup';
import './WorkflowList.scss';

interface WorkflowGroup {
  title: string;
  workflows: Workflow[];
}

const WorkflowList: React.FC = () => {
  const { workflowList, getAll } = useWorkflowStore();

  useEffect(() => {
    getAll();
  }, [getAll]);

  const groupedWorkflows = useMemo(() => {
    return splitWorkflowsByDate(workflowList);
  }, [workflowList]);

  const hasWorkflows = groupedWorkflows.some(group => group.workflows.length > 0);

  if (!hasWorkflows) {
    return (
      <div className="workflow-list__empty">
        <h4 className="workflow-list__empty-title">No Workflows Yet</h4>
        <div className="workflow-list__empty-description">
          Create your first workflow to get started
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-list">
      {groupedWorkflows.map(
        (group) =>
          group.workflows.length > 0 && (
            <WorkflowGroup
              key={group.title}
              title={group.title}
              workflows={group.workflows}
            />
          )
      )}
    </div>
  );
};

function splitWorkflowsByDate(workflows: Workflow[]): WorkflowGroup[] {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const isSameDay = (date1: Date, date2: Date) =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

  const groups = {
    today: [] as Workflow[],
    yesterday: [] as Workflow[],
    previousWeek: [] as Workflow[],
    older: [] as Workflow[],
  };

  workflows.forEach((workflow) => {
    const workflowDate = new Date(workflow.date);

    if (isSameDay(workflowDate, today)) {
      groups.today.push(workflow);
    } else if (isSameDay(workflowDate, yesterday)) {
      groups.yesterday.push(workflow);
    } else if (workflowDate >= sevenDaysAgo) {
      groups.previousWeek.push(workflow);
    } else {
      groups.older.push(workflow);
    }
  });

  return [
    { title: 'Today', workflows: groups.today },
    { title: 'Yesterday', workflows: groups.yesterday },
    { title: 'Previous Week', workflows: groups.previousWeek },
    { title: 'Older', workflows: groups.older },
  ];
}

export default WorkflowList;
```

---

## 5. Create Workflow Dialog

### File: `src/components/Workflow/CreateWorkflowDialog.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/stores/workflows';
import eventBus from '@/plugins/eventBus';
import { RENAME_WORKFLOW_START } from '@/helpers/HelperConstants';
import './CreateWorkflowDialog.scss';

interface FormData {
  technical_id: string | null;
  name: string;
  description: string;
}

interface CreateWorkflowDialogProps {
  visible: boolean;
  onClose: () => void;
}

const CreateWorkflowDialog: React.FC<CreateWorkflowDialogProps> = ({ visible, onClose }) => {
  const { createWorkflow, updateWorkflow, setSelectedWorkflow } = useWorkflowStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    technical_id: null,
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    const handleRename = (workflow: any) => {
      setFormData({
        technical_id: workflow.technical_id,
        name: workflow.name,
        description: workflow.description,
      });
    };

    eventBus.on(RENAME_WORKFLOW_START, handleRename);
    return () => {
      eventBus.off(RENAME_WORKFLOW_START, handleRename);
    };
  }, []);

  const validate = () => {
    const newErrors: { name?: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Workflow name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name should be 1-100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      if (formData.technical_id) {
        await updateWorkflow(formData);
        // Show success message
      } else {
        const newWorkflow = await createWorkflow(formData);
        setSelectedWorkflow(newWorkflow);
        // Show success message
      }

      handleClose();
    } catch (error) {
      console.error('Error saving workflow:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ technical_id: null, name: '', description: '' });
    setErrors({});
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog__header">
          <h3>{formData.technical_id ? 'Update Workflow' : 'Add New Workflow'}</h3>
        </div>
        <div className="dialog__body">
          <div className="form-item">
            <label>Workflow Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter workflow name..."
              maxLength={100}
            />
            {errors.name && <span className="error">{errors.name}</span>}
            <span className="char-count">{formData.name.length}/100</span>
          </div>
          <div className="form-item">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter workflow description..."
              maxLength={500}
              rows={4}
            />
            <span className="char-count">{formData.description.length}/500</span>
          </div>
        </div>
        <div className="dialog__footer">
          <button onClick={handleClose} disabled={loading}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : formData.technical_id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkflowDialog;
```

---

## 6. Routing Configuration

### File: `src/router/index.tsx`

Add workflow route:

```typescript
import WorkflowView from '@/views/WorkflowView';

const routes = [
  // ... existing routes
  {
    path: '/workflow',
    element: <WorkflowView />,
  },
];
```

---

## 7. Type Definitions

### File: `src/types/workflow.d.ts`

```typescript
export interface Workflow {
  technical_id: string;
  name: string;
  description: string;
  date: string;
  workflowMetaData: string | object;
  canvasData: string | object;
}

export interface WorkflowMetaData {
  name?: string;
  description?: string;
  version?: string;
  [key: string]: any;
}

export interface WorkflowState {
  transitions?: WorkflowTransition[];
  [key: string]: any;
}

export interface WorkflowTransition {
  name: string;
  next: string;
  manual?: boolean;
  processors?: WorkflowProcessor[];
  criteria?: WorkflowCriteria[];
}

export interface WorkflowProcessor {
  name: string;
  config?: Record<string, any>;
}

export interface WorkflowCriteria {
  type: string;
  function?: { name: string };
  name?: string;
  operator?: string;
  parameters?: any[];
}

export interface WorkflowData {
  initial_state: string;
  states: {
    [stateId: string]: WorkflowState;
  };
}
```

---

## Implementation Checklist

- [ ] Create workflow store with Zustand
- [ ] Implement HelperWorkflowStorage
- [ ] Create WorkflowView component
- [ ] Create WorkflowSidebar component
- [ ] Create WorkflowList component
- [ ] Create WorkflowItem component
- [ ] Create CreateWorkflowDialog
- [ ] Create ExportDialog
- [ ] Create ImportDialog
- [ ] Add routing configuration
- [ ] Implement CRUD operations
- [ ] Add debounced auto-save
- [ ] Implement date grouping
- [ ] Add empty states
- [ ] Add loading states
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Add accessibility features
- [ ] Update documentation

---

## Testing Examples

```typescript
// Example test for workflow store
describe('useWorkflowStore', () => {
  it('should create a new workflow', async () => {
    const { result } = renderHook(() => useWorkflowStore());
    
    const workflow = await result.current.createWorkflow({
      name: 'Test Workflow',
      description: 'Test Description',
    });

    expect(workflow.name).toBe('Test Workflow');
    expect(workflow.technical_id).toBeDefined();
  });
});
```

