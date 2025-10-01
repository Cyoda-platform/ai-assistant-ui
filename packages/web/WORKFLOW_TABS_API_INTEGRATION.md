# Workflow Tabs API Integration

## Overview

The workflow tabs feature now uses the tab's model name and version for all import/export operations (both file and API), instead of hardcoded values.

## Changes Made

### 1. WorkflowCanvas Component

**File**: `packages/web/src/components/WorkflowCanvas/Canvas/WorkflowCanvas.tsx`

#### Props Updated
Added two new optional props to `WorkflowCanvasProps`:
```typescript
interface WorkflowCanvasProps {
  workflow: UIWorkflowData | null;
  onWorkflowUpdate: (workflow: UIWorkflowData, description?: string) => void;
  onStateEdit: (stateId: string) => void;
  onTransitionEdit: (transitionId: string) => void;
  darkMode: boolean;
  technicalId?: string;
  modelName?: string;      // NEW
  modelVersion?: number;   // NEW
}
```

#### File Export (JSON)
**Function**: `handleExportJSON`

**Before**:
```typescript
const safeName = (cleanedWorkflow.configuration.name || 'workflow')
  .replace(/[^a-z0-9_-]/gi, '_')
  .toLowerCase();
link.download = `${safeName}.json`;
```

**After**:
```typescript
let filename: string;
if (modelName && modelVersion) {
  filename = `${modelName}_v${modelVersion}.json`;
} else {
  // Fallback: sanitize workflow name
  const safeName = (cleanedWorkflow.configuration.name || 'workflow')
    .replace(/[^a-z0-9_-]/gi, '_')
    .toLowerCase();
  filename = `${safeName}.json`;
}
link.download = filename;
```

**Example**: 
- Tab: `user-registration` v`1` → File: `user-registration_v1.json`
- Tab: `order-process` v`2` → File: `order-process_v2.json`

#### API Export
**Function**: `handleExportToEnvironment`

**Before**:
```typescript
// Hardcoded for now
const entityName = 'entity1';
const modelVersion = 1;

const url = buildEnvironmentUrl(`/model/${entityName}/${modelVersion}/workflow/import`);
```

**After**:
```typescript
// Check if modelName and modelVersion are provided
if (!modelName || !modelVersion) {
  showError(
    'Missing Model Information',
    'Model name and version are required for API export.'
  );
  return;
}

const url = buildEnvironmentUrl(`/model/${modelName}/${modelVersion}/workflow/import`);
```

**API Endpoint**: `POST /model/{modelName}/{modelVersion}/workflow/import`

**Example**:
- Tab: `user-registration` v`1` → API: `POST /model/user-registration/1/workflow/import`
- Tab: `order-process` v`2` → API: `POST /model/order-process/2/workflow/import`

#### API Import
**Function**: `handleImportFromEnvironment`

**Before**:
```typescript
// Hardcoded for now
const entityName = 'entity1';
const modelVersion = 1;

const exportUrl = buildEnvironmentUrl(`/model/${entityName}/${modelVersion}/workflow/export`);
```

**After**:
```typescript
// Check if modelName and modelVersion are provided
if (!modelName || !modelVersion) {
  showError(
    'Missing Model Information',
    'Model name and version are required for API import.'
  );
  return;
}

const exportUrl = buildEnvironmentUrl(`/model/${modelName}/${modelVersion}/workflow/export`);
```

**API Endpoint**: `GET /model/{modelName}/{modelVersion}/workflow/export`

**Example**:
- Tab: `user-registration` v`1` → API: `GET /model/user-registration/1/workflow/export`
- Tab: `order-process` v`2` → API: `GET /model/order-process/2/workflow/export`

### 2. ChatBotEditorWorkflowNew Component

**File**: `packages/web/src/components/ChatBot/ChatBotEditorWorkflowNew.tsx`

#### Props Updated
```typescript
interface ChatBotEditorWorkflowNewProps {
  technicalId: string;
  modelName?: string;      // NEW
  modelVersion?: number;   // NEW
  onAnswer?: (data: { answer: string; file?: File }) => void;
  onUpdate?: (data: { canvasData: string; workflowMetaData: any }) => void;
}
```

#### Props Passed to WorkflowCanvas
```typescript
<WorkflowCanvas
  workflow={currentWorkflow}
  onWorkflowUpdate={handleWorkflowUpdate}
  onStateEdit={handleStateEdit}
  onTransitionEdit={handleTransitionEdit}
  darkMode={true}
  technicalId={technicalId}
  modelName={modelName}        // NEW
  modelVersion={modelVersion}  // NEW
/>
```

### 3. ChatBotCanvas Component

**File**: `packages/web/src/components/ChatBot/ChatBotCanvas.tsx`

#### Props Passed to ChatBotEditorWorkflowNew
```typescript
{activeWorkflowTab ? (
  <ChatBotEditorWorkflowNew
    key={activeWorkflowTab.id}
    technicalId={activeWorkflowTab.technicalId}
    modelName={activeWorkflowTab.modelName}        // NEW
    modelVersion={activeWorkflowTab.modelVersion}  // NEW
    onAnswer={onAnswer}
    onUpdate={(data) => handleWorkflowUpdate(activeWorkflowTab.id, data)}
  />
) : (
  // Empty state
)}
```

## Data Flow

```
WorkflowTab (Zustand Store)
  ↓
  modelName: "user-registration"
  modelVersion: 1
  ↓
ChatBotCanvas
  ↓
  passes modelName & modelVersion
  ↓
ChatBotEditorWorkflowNew
  ↓
  passes modelName & modelVersion
  ↓
WorkflowCanvas
  ↓
  uses in export/import operations
  ↓
  ├─→ File Export: user-registration_v1.json
  ├─→ API Export: POST /model/user-registration/1/workflow/import
  └─→ API Import: GET /model/user-registration/1/workflow/export
```

## Usage Examples

### Creating a New Workflow Tab

1. Click the **"+"** button in the workflow tabs bar
2. Enter model information:
   - **Entity Model Name**: `user-registration`
   - **Model Version**: `1`
   - **Display Name**: `User Registration Workflow` (optional)
3. Click **"Open"**

### File Export

1. Open a workflow tab (e.g., `user-registration` v`1`)
2. Click the **Download** icon in the canvas toolbar
3. File is saved as: `user-registration_v1.json`

### API Export

1. Open a workflow tab (e.g., `user-registration` v`1`)
2. Click the **Cloud Upload** icon in the canvas toolbar
3. Workflow is exported to: `POST /model/user-registration/1/workflow/import`
4. Success notification shows: "Workflow exported to user-registration (v1)"

### API Import

1. Open a workflow tab (e.g., `user-registration` v`1`)
2. Click the **Cloud Download** icon in the canvas toolbar
3. Confirm the import action
4. Workflow is imported from: `GET /model/user-registration/1/workflow/export`
5. Success notification shows: "Workflow imported from user-registration (v1)"

## Error Handling

### Missing Model Information

If `modelName` or `modelVersion` is not provided when attempting API operations:

**Error Message**:
```
Title: Missing Model Information
Message: Model name and version are required for API export/import. 
         Please ensure the workflow tab has this information.
```

**Solution**: Ensure the workflow tab was created with proper model name and version.

### API Errors

All API errors are caught and displayed with:
- Error title
- Detailed error message from the API response
- Console logging for debugging

## Benefits

1. **Dynamic API Endpoints**: Each workflow tab uses its own model name/version for API calls
2. **Organized File Exports**: Files are named consistently: `{modelName}_v{modelVersion}.json`
3. **Multi-Environment Support**: Different tabs can target different entity models
4. **Clear Traceability**: File names and API endpoints clearly indicate which model they belong to
5. **No Hardcoding**: Removed all hardcoded entity names and versions

## Testing Checklist

- [ ] Create a new workflow tab with custom model name and version
- [ ] Export workflow to file - verify filename format
- [ ] Import workflow from file - verify it loads correctly
- [ ] Export workflow to API - verify correct endpoint is called
- [ ] Import workflow from API - verify correct endpoint is called
- [ ] Try API operations without model info - verify error message
- [ ] Create multiple tabs with different models - verify each uses correct values
- [ ] Switch between tabs - verify export/import uses active tab's values

## API Endpoints Reference

### Export Workflow (Import to Environment)
```
POST /model/{modelName}/{modelVersion}/workflow/import

Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "workflows": [
    {
      "version": "1.0",
      "name": "Workflow Name",
      "initialState": "INITIAL",
      "states": { ... }
    }
  ],
  "importMode": "REPLACE"
}
```

### Import Workflow (Export from Environment)
```
GET /model/{modelName}/{modelVersion}/workflow/export

Headers:
  Authorization: Bearer {token}

Response:
{
  "workflows": [
    {
      "version": "1.0",
      "name": "Workflow Name",
      "initialState": "INITIAL",
      "states": { ... }
    }
  ]
}
```

## Notes

- File import still uses the modal dialog to specify model name/version
- The `technicalId` is still used for local storage keys
- Model name and version are purely for API and file naming purposes
- Fallback behavior: If model info is missing, file export uses workflow name (sanitized)

