# AppsCanvas Customization Guide

## ✅ You CAN Edit AppsCanvas Without Affecting WorkflowCanvas!

The adapter pattern gives you **complete freedom** to customize AppsCanvas while keeping WorkflowCanvas untouched.

## 🎯 What You Can Customize in AppsCanvas

### 1. ✅ Data Conversion Logic

**File**: `AppsCanvas.tsx` - `convertPortalDataToWorkflow()` function

You can modify:
- Node positioning algorithm
- Color schemes for different node types
- Which fields to include in metadata
- How transitions are created
- Layout spacing and arrangement

**Example**: Change node colors
```typescript
// In convertPortalDataToWorkflow()
layoutStates.push({
  id: env.id,
  position: { x: 100, y: yOffset + index * ySpacing },
  properties: {
    color: '#ff0000', // ← Change this to any color!
    type: 'environment',
    metadata: env
  }
});
```

**WorkflowCanvas**: ✅ Unaffected - it just renders whatever color you give it

---

### 2. ✅ Add Custom Node Types

You can create Portal-specific node rendering:

**Example**: Add custom rendering for App nodes
```typescript
// In AppsCanvas.tsx
import { CustomAppNode } from './nodes/CustomAppNode';

// Add to conversion
layoutStates.push({
  id: app.id,
  position: { x: 100 + xSpacing, y: yOffset + index * ySpacing },
  properties: {
    color: '#14b8a6',
    type: 'app',
    metadata: app,
    customRenderer: 'customApp' // ← Custom flag
  }
});
```

**WorkflowCanvas**: ✅ Unaffected - it passes properties through

---

### 3. ✅ Add Filtering

**Example**: Filter nodes by type
```typescript
export const AppsCanvas: React.FC<AppsCanvasProps> = ({
  data,
  onNavigate,
  onDataUpdate
}) => {
  // Add filter state
  const [filters, setFilters] = useState({
    showEnvironments: true,
    showApps: true,
    showRequirements: true,
    showEntityVersions: true,
    showWorkflows: true,
    showCode: true
  });

  // Filter data before conversion
  const filteredData = useMemo(() => ({
    environments: filters.showEnvironments ? data.environments : [],
    apps: filters.showApps ? data.apps : [],
    requirements: filters.showRequirements ? data.requirements : [],
    entityVersions: filters.showEntityVersions ? data.entityVersions : [],
    workflows: filters.showWorkflows ? data.workflows : [],
    code: filters.showCode ? data.code : []
  }), [data, filters]);

  const workflowData = useMemo(() => 
    convertPortalDataToWorkflow(filteredData), 
    [filteredData]
  );

  return (
    <div className="relative h-full">
      {/* Add filter UI */}
      <div className="absolute top-4 right-4 z-10 bg-slate-800 p-4 rounded">
        <label>
          <input 
            type="checkbox" 
            checked={filters.showEnvironments}
            onChange={(e) => setFilters({...filters, showEnvironments: e.target.checked})}
          />
          Environments
        </label>
        {/* More filters... */}
      </div>

      <WorkflowCanvas workflow={workflowData} {...props} />
    </div>
  );
};
```

**WorkflowCanvas**: ✅ Unaffected - it just renders what you give it

---

### 4. ✅ Add Custom Toolbar

**Example**: Add Portal-specific controls
```typescript
export const AppsCanvas: React.FC<AppsCanvasProps> = (props) => {
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="relative h-full">
      {/* Custom toolbar for Apps */}
      <div className="absolute top-4 left-4 z-10 bg-slate-800 p-2 rounded flex gap-2">
        <button onClick={() => setShowStats(!showStats)}>
          Show Stats
        </button>
        <button onClick={() => exportToExcel(props.data)}>
          Export to Excel
        </button>
        <button onClick={() => generateReport(props.data)}>
          Generate Report
        </button>
      </div>

      {/* Stats panel */}
      {showStats && (
        <div className="absolute top-16 left-4 z-10 bg-slate-800 p-4 rounded">
          <h3>Portal Statistics</h3>
          <p>Environments: {props.data.environments.length}</p>
          <p>Apps: {props.data.apps.length}</p>
          <p>Requirements: {props.data.requirements.length}</p>
        </div>
      )}

      <WorkflowCanvas {...workflowData} />
    </div>
  );
};
```

**WorkflowCanvas**: ✅ Unaffected - your UI is separate

---

### 5. ✅ Implement Reverse Conversion

**Example**: Convert workflow updates back to Portal data
```typescript
function convertWorkflowToPortalData(
  workflow: UIWorkflowData, 
  originalData: PortalData
): PortalData {
  // Extract updated positions and properties
  const updatedData = { ...originalData };

  workflow.layout.states.forEach(state => {
    const type = state.properties?.type;
    const metadata = state.properties?.metadata;

    if (type === 'environment') {
      const env = updatedData.environments.find(e => e.id === state.id);
      if (env && metadata) {
        // Update environment with new data
        Object.assign(env, metadata);
      }
    } else if (type === 'app') {
      const app = updatedData.apps.find(a => a.id === state.id);
      if (app && metadata) {
        Object.assign(app, metadata);
      }
    }
    // ... handle other types
  });

  return updatedData;
}

export const AppsCanvas: React.FC<AppsCanvasProps> = ({
  data,
  onDataUpdate,
  ...props
}) => {
  const workflowData = useMemo(() => convertPortalDataToWorkflow(data), [data]);

  const handleWorkflowUpdate = useCallback((updatedWorkflow: UIWorkflowData) => {
    // Convert back to Portal data
    const updatedPortalData = convertWorkflowToPortalData(updatedWorkflow, data);
    onDataUpdate?.(updatedPortalData);
  }, [data, onDataUpdate]);

  return (
    <WorkflowCanvas
      workflow={workflowData}
      onWorkflowUpdate={handleWorkflowUpdate}
      {...props}
    />
  );
};
```

**WorkflowCanvas**: ✅ Unaffected - it just calls your callback

---

### 6. ✅ Add Search/Highlighting

**Example**: Search and highlight nodes
```typescript
export const AppsCanvas: React.FC<AppsCanvasProps> = (props) => {
  const [searchTerm, setSearchTerm] = useState('');

  const workflowData = useMemo(() => {
    const converted = convertPortalDataToWorkflow(props.data);

    // Highlight matching nodes
    if (searchTerm) {
      converted.layout.states.forEach(state => {
        const metadata = state.properties?.metadata;
        const matches = metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (matches) {
          state.properties = {
            ...state.properties,
            color: '#fbbf24', // Highlight color
            highlighted: true
          };
        }
      });
    }

    return converted;
  }, [props.data, searchTerm]);

  return (
    <div className="relative h-full">
      {/* Search bar */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search nodes..."
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
      />

      <WorkflowCanvas workflow={workflowData} {...props} />
    </div>
  );
};
```

**WorkflowCanvas**: ✅ Unaffected - it just renders the colors you provide

---

### 7. ✅ Add Custom Context Menu

**Example**: Right-click menu for Portal nodes
```typescript
export const AppsCanvas: React.FC<AppsCanvasProps> = (props) => {
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, nodeId: string} | null>(null);

  const handleStateEdit = useCallback((stateId: string) => {
    // Show context menu instead of default action
    const state = workflowData.layout.states.find(s => s.id === stateId);
    const type = state?.properties?.type;

    if (type === 'app') {
      // Custom action for apps
      showAppEditor(stateId);
    } else if (type === 'requirement') {
      // Custom action for requirements
      showRequirementEditor(stateId);
    }
  }, [workflowData]);

  return (
    <div className="relative h-full">
      <WorkflowCanvas
        workflow={workflowData}
        onStateEdit={handleStateEdit}
        {...props}
      />

      {/* Custom context menu */}
      {contextMenu && (
        <div 
          className="absolute z-50 bg-slate-800 rounded shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={() => editNode(contextMenu.nodeId)}>Edit</button>
          <button onClick={() => deleteNode(contextMenu.nodeId)}>Delete</button>
          <button onClick={() => duplicateNode(contextMenu.nodeId)}>Duplicate</button>
        </div>
      )}
    </div>
  );
};
```

**WorkflowCanvas**: ✅ Unaffected - you intercept the callbacks

---

### 8. ✅ Add Validation

**Example**: Validate Portal data before rendering
```typescript
function validatePortalData(data: PortalData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for orphaned apps
  data.apps.forEach(app => {
    if (!data.environments.find(e => e.id === app.environmentId)) {
      errors.push(`App "${app.name}" references non-existent environment`);
    }
  });

  // Check for orphaned requirements
  data.requirements.forEach(req => {
    if (!data.apps.find(a => a.id === req.appId)) {
      errors.push(`Requirement "${req.title}" references non-existent app`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export const AppsCanvas: React.FC<AppsCanvasProps> = (props) => {
  const validation = useMemo(() => validatePortalData(props.data), [props.data]);

  if (!validation.valid) {
    return (
      <div className="p-4 bg-red-900 text-white">
        <h3>Data Validation Errors:</h3>
        <ul>
          {validation.errors.map((err, i) => <li key={i}>{err}</li>)}
        </ul>
      </div>
    );
  }

  const workflowData = useMemo(() => convertPortalDataToWorkflow(props.data), [props.data]);

  return <WorkflowCanvas workflow={workflowData} {...props} />;
};
```

**WorkflowCanvas**: ✅ Unaffected - validation happens before it sees the data

---

## 🚫 What You CANNOT Do (Without Touching WorkflowCanvas)

1. ❌ Change WorkflowCanvas internal rendering logic
2. ❌ Modify WorkflowCanvas state management
3. ❌ Change WorkflowCanvas keyboard shortcuts
4. ❌ Alter WorkflowCanvas theme system

**But you don't need to!** You can achieve everything through:
- Data conversion
- Wrapper components
- Callback interception
- Property injection

---

## 📁 File Structure

```
AppsCanvas/
├── AppsCanvas.tsx              ← Edit this freely!
├── types/
│   └── apps.ts                 ← Edit this freely!
├── nodes/                      ← Add custom nodes here!
│   ├── CustomAppNode.tsx
│   └── CustomRequirementNode.tsx
├── utils/                      ← Add utilities here!
│   ├── validation.ts
│   ├── export.ts
│   └── search.ts
├── hooks/                      ← Add custom hooks here!
│   ├── usePortalFilters.ts
│   └── usePortalSearch.ts
└── sampleData.ts               ← Edit this freely!

WorkflowCanvas/                 ← DON'T TOUCH!
├── Canvas/
├── Editors/
└── ...
```

---

## ✅ Summary

**You have complete freedom to customize AppsCanvas!**

### What You Can Do:
1. ✅ Modify data conversion logic
2. ✅ Add filtering and search
3. ✅ Add custom toolbars and UI
4. ✅ Implement reverse conversion
5. ✅ Add validation
6. ✅ Customize colors and styling
7. ✅ Add custom context menus
8. ✅ Intercept callbacks
9. ✅ Add custom node types
10. ✅ Wrap with additional components

### WorkflowCanvas:
- ✅ Remains completely untouched
- ✅ No risk of breaking it
- ✅ Continues to work for workflows
- ✅ Gets all updates automatically

**This is the power of the adapter pattern!** 🎉

You can customize AppsCanvas as much as you want, and WorkflowCanvas will never know or care!

