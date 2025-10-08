# Node JSON Editor Feature

## Overview

Added separate window JSON editors to all non-group nodes in the AppsCanvas, allowing users to edit node data in a dedicated modal window without opening the main JSON editor.

## Changes Made

### 1. New Component: NodeJsonEditor

**File**: `packages/web/src/components/AppsCanvas/nodes/NodeJsonEditor.tsx`

A modal JSON editor component that:
- Opens in a separate window (modal overlay)
- Uses Monaco Editor for professional JSON editing
- Validates JSON on save
- Shows error messages for invalid JSON
- Full-screen overlay with centered modal (z-index: 9999)
- Backdrop blur effect for better focus
- Stops event propagation to prevent canvas interaction

**Features**:
- ✅ Modal window with backdrop blur
- ✅ 800px × 600px editor window
- ✅ Monaco Editor with syntax highlighting
- ✅ JSON validation with error display
- ✅ Save/Cancel buttons
- ✅ Dark theme matching the canvas
- ✅ Minimap for large JSON files
- ✅ Auto-formatting and line numbers

### 2. Updated Node Components

All non-group nodes now include the JSON editor modal:

#### AppNode (`nodes/AppNode.tsx`)
- Added `onUpdate` prop to data interface
- Added `isEditorOpen` state to manage modal visibility
- Added `handleJsonSave` function
- Added `handleOpenEditor` function
- Added Code icon button in header to open editor
- Wrapped in fragment to include modal outside node
- `NodeJsonEditor` component rendered as modal

#### EntityNode (`nodes/EntityNode.tsx`)
- Added `onUpdate` prop to data interface
- Added `isEditorOpen` state to manage modal visibility
- Added `handleJsonSave` function
- Added `handleOpenEditor` function
- Added Code icon button in header to open editor
- Wrapped in fragment to include modal outside node
- `NodeJsonEditor` component rendered as modal

#### WorkflowNode (`nodes/WorkflowNode.tsx`)
- Added `onUpdate` prop to data interface
- Added `isEditorOpen` state to manage modal visibility
- Added `handleJsonSave` function
- Added `handleOpenEditor` function
- Added Code icon button in header to open editor
- Wrapped in fragment to include modal outside node
- `NodeJsonEditor` component rendered as modal

#### EnvironmentNode (`nodes/EnvironmentNode.tsx`)
- Added `onUpdate` prop to data interface
- Added `isEditorOpen` state to manage modal visibility
- Added `handleJsonSave` function
- Added `handleOpenEditor` function
- Added Code icon button in header to open editor
- Wrapped in fragment to include modal outside node
- `NodeJsonEditor` component rendered as modal

### 3. Updated AppsCanvas Component

**File**: `packages/web/src/components/AppsCanvas/AppsCanvas.tsx`

Added `handleNodeUpdate` callback:
```typescript
const handleNodeUpdate = useCallback((nodeId: string, nodeType: string, updatedMetadata: any) => {
  // Updates the appropriate node in currentAppData based on nodeType
  // Supports: app, environment, entity, workflow
  // Triggers onAppDataUpdate callback
}, [currentAppData, onAppDataUpdate]);
```

Updated `workflowData` useMemo to pass `handleNodeUpdate`:
```typescript
return convertAppRootToWorkflow(currentAppData, handleAddNewInstance, handleNodeUpdate);
```

### 4. Updated Conversion Function

**File**: `packages/web/src/components/AppsCanvas/convertAppRootToWorkflow.ts`

Updated function signature:
```typescript
export function convertAppRootToWorkflow(
  appRoot: AppRoot,
  onAddNewInstance?: (groupType: string, entityId?: string) => void,
  onNodeUpdate?: (nodeId: string, nodeType: string, updatedMetadata: any) => void
): UIWorkflowData
```

Added `onUpdate` callback to all node data:
- App node: `onUpdate: (updatedMetadata) => onNodeUpdate(appId, 'app', updatedMetadata)`
- Environment nodes: `onUpdate: (updatedMetadata) => onNodeUpdate(envId, 'environment', updatedMetadata)`
- Entity nodes: `onUpdate: (updatedMetadata) => onNodeUpdate(entityId, 'entity', updatedMetadata)`
- Workflow nodes: `onUpdate: (updatedMetadata) => onNodeUpdate(workflowId, 'workflow', updatedMetadata)`

## How It Works

### User Flow

1. **View Node**: User sees a node on the canvas
2. **Click Code Icon**: Code icon button in the header of each non-group node
3. **Modal Opens**: A full-screen modal overlay appears with the JSON editor
4. **Edit**: User can modify the JSON using Monaco Editor with:
   - Syntax highlighting
   - Auto-completion
   - Line numbers
   - Minimap
   - Format on paste/type
5. **Save**: Click "Save Changes" button
   - JSON is validated
   - If valid: node data is updated, modal closes
   - If invalid: error message is shown at the bottom
6. **Cancel**: Click "Cancel", "X", or click outside the modal to close without saving

### Data Flow

```
User clicks Code icon in node header
  ↓
Node sets isEditorOpen = true
  ↓
NodeJsonEditor modal renders with current metadata
  ↓
User edits JSON in Monaco Editor and clicks "Save Changes"
  ↓
NodeJsonEditor validates JSON
  ↓
If valid: calls onSave(updatedData) and onClose()
  ↓
Node's handleJsonSave calls data.onUpdate(updatedData)
  ↓
onUpdate callback from convertAppRootToWorkflow
  ↓
Calls handleNodeUpdate(nodeId, nodeType, updatedMetadata)
  ↓
AppsCanvas.handleNodeUpdate updates currentAppData
  ↓
Triggers onAppDataUpdate callback
  ↓
Canvas re-renders with updated data
  ↓
Modal closes (isEditorOpen = false)
```

## Benefits

1. **Quick Edits**: Edit node data without opening the main JSON editor
2. **Focused Editing**: Only see the data for the specific node in a dedicated window
3. **Professional Editor**: Monaco Editor provides IDE-like editing experience
4. **Visual Feedback**: See changes immediately on the canvas after saving
5. **Validation**: JSON validation prevents invalid data
6. **Non-Intrusive**: Modal only appears when explicitly opened
7. **Consistent UX**: Same dark theme and styling as the rest of the canvas
8. **Better Readability**: Large modal window with syntax highlighting
9. **Easy Navigation**: Minimap for large JSON structures
10. **Click Outside to Close**: Intuitive modal behavior

## Add Entity/Workflow Buttons

The add entity and add workflow buttons in GroupNode were already implemented and working. The `handleAddNewInstance` callback was properly wired through:

1. `AppsCanvas` defines `handleAddNewInstance`
2. Passed to `convertAppRootToWorkflow`
3. Attached to GroupNode's `onAddNew` callback
4. GroupNode renders the "+" button and calls `onAddNew` when clicked

## Testing

To test the feature:

1. Open AppsCanvas with sample data
2. Locate any non-group node (App, Environment, Entity, or Workflow)
3. Click the Code icon button in the node's header (top-right corner)
4. A modal window should appear with the node's JSON data
5. Modify the JSON (e.g., change a name or URL)
6. Click "Save Changes"
7. Verify the modal closes and the node updates on the canvas
8. Open the main JSON editor to verify the data was saved
9. Test canceling: Open editor, make changes, click "Cancel" or outside modal
10. Verify changes are not saved

## Future Enhancements

Potential improvements:
- ✅ Syntax highlighting (already implemented with Monaco)
- ✅ Line numbers (already implemented)
- ✅ Minimap (already implemented)
- Add schema validation with helpful error messages
- Add undo/redo for JSON edits within the modal
- Add keyboard shortcuts (Ctrl+S to save, Esc to cancel)
- Make the modal resizable/draggable
- Add a "Reset" button to revert to original values
- Add diff view to show what changed
- Add "Format JSON" button for manual formatting

