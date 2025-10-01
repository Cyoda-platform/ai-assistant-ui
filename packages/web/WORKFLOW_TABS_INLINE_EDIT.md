# Workflow Tabs - Inline Edit Feature

## Overview

Removed the modal dialog for creating new workflows. Now clicking the "+" button creates a new tab immediately with default values, and users can edit the model name, version, and display name through a right-click context menu.

## Changes Made

### 1. WorkflowTabsContainer Component

**File**: `packages/web/src/components/WorkflowTabs/WorkflowTabsContainer.tsx`

#### Removed Modal Dialog

**Before**: Showed modal with form to enter model name, version, and display name
```typescript
const handleNewTab = useCallback(() => {
  setIsNewWorkflowModalOpen(true);
}, []);

const handleCreateWorkflow = useCallback(() => {
  form.validateFields().then((values) => {
    // ... create tab with form values
  });
}, [form, openTab]);
```

**After**: Creates tab immediately with default values
```typescript
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
```

**Default Values**:
- Model Name: `new-workflow-1`, `new-workflow-2`, etc.
- Model Version: `1`
- Display Name: `New Workflow 1`, `New Workflow 2`, etc.
- Technical ID: `{modelName}_v{modelVersion}_{timestamp}`

#### Removed Modal UI

Removed the entire Modal component with Form fields (lines 86-134 in old version).

### 2. WorkflowTabs Component

**File**: `packages/web/src/components/WorkflowTabs/WorkflowTabs.tsx`

#### Added Edit Functionality

**New State**:
```typescript
const [editingTabId, setEditingTabId] = useState<string | null>(null);
const [editDisplayName, setEditDisplayName] = useState('');
const [editModelName, setEditModelName] = useState('');
const [editModelVersion, setEditModelVersion] = useState(1);
```

**New Handlers**:
```typescript
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
    Modal.error({ title: 'Invalid Model Name', content: 'Model name cannot be empty' });
    return;
  }

  if (editModelVersion < 1) {
    Modal.error({ title: 'Invalid Version', content: 'Version must be at least 1' });
    return;
  }

  // Update the tab
  const newId = `${editModelName}_v${editModelVersion}`;
  const technicalId = `${editModelName}_v${editModelVersion}_${Date.now()}`;
  
  updateTab(editingTabId, {
    id: newId,
    modelName: editModelName,
    modelVersion: editModelVersion,
    displayName: editDisplayName || `${editModelName} v${editModelVersion}`,
    technicalId,
  });

  setEditingTabId(null);
};

const handleCancelEdit = () => {
  setEditingTabId(null);
};
```

#### Updated Context Menu

Added "Edit" option to the right-click context menu:

```typescript
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
```

#### Added Edit Modal

```typescript
<Modal
  title="Edit Workflow Tab"
  open={editingTabId !== null}
  onOk={handleSaveEdit}
  onCancel={handleCancelEdit}
  okText="Save"
  cancelText="Cancel"
>
  <div className="space-y-4">
    <div>
      <label>Display Name</label>
      <Input
        value={editDisplayName}
        onChange={(e) => setEditDisplayName(e.target.value)}
        placeholder="e.g., User Registration Workflow"
      />
    </div>

    <div>
      <label>Model Name <span className="text-red-500">*</span></label>
      <Input
        value={editModelName}
        onChange={(e) => setEditModelName(e.target.value)}
        placeholder="e.g., user-registration"
      />
    </div>

    <div>
      <label>Model Version <span className="text-red-500">*</span></label>
      <Input
        type="number"
        min={1}
        value={editModelVersion}
        onChange={(e) => setEditModelVersion(parseInt(e.target.value) || 1)}
        placeholder="1"
      />
    </div>
  </div>
</Modal>
```

### 3. WorkflowTabs Store

**File**: `packages/web/src/stores/workflowTabs.ts`

#### Updated `updateTab` Function

Enhanced to handle ID changes when model name or version is updated:

```typescript
updateTab: (tabId, updates) => {
  const { tabs, activeTabId } = get();
  
  // Check if the ID is being changed
  const isIdChanging = updates.id && updates.id !== tabId;
  
  const updatedTabs = tabs.map(tab =>
    tab.id === tabId ? { ...tab, ...updates } : tab
  );
  
  // If the active tab's ID changed, update activeTabId
  const newActiveTabId = isIdChanging && activeTabId === tabId 
    ? updates.id 
    : activeTabId;
  
  set({ 
    tabs: updatedTabs,
    activeTabId: newActiveTabId
  });
},
```

**Key Feature**: When the tab ID changes (due to model name/version change), the active tab ID is also updated to maintain the correct active state.

## User Experience

### Creating a New Workflow

**Before**:
1. Click "+" button
2. Modal appears
3. Fill in model name (required)
4. Fill in version (required)
5. Fill in display name (optional)
6. Click "Open"
7. Tab is created

**After**:
1. Click "+" button
2. Tab is created immediately with default values
3. Start working right away
4. Edit name/version later if needed

### Editing a Workflow Tab

**Steps**:
1. Right-click on any tab
2. Select "Edit" from context menu
3. Edit modal appears with current values
4. Modify display name, model name, or version
5. Click "Save"
6. Tab updates with new values

### Context Menu Options

Right-click on any tab to see:
- ✏️ **Edit** - Edit tab properties
- ➖ (divider)
- ❌ **Close** - Close this tab
- ❌ **Close Others** - Close all other tabs
- ❌ **Close All** - Close all tabs

## Benefits

### 1. **Faster Workflow Creation**
- No modal interruption
- Start working immediately
- Edit details later if needed

### 2. **Better UX**
- Less friction to create new workflows
- Inline editing feels more natural
- Context menu is discoverable

### 3. **Flexible Naming**
- Can start with default name
- Rename anytime
- No pressure to get it right first time

### 4. **Consistent Pattern**
- Similar to browser tabs
- Similar to code editor tabs
- Familiar interaction model

### 5. **Auto-Incrementing Names**
- New Workflow 1, 2, 3, etc.
- Prevents naming conflicts
- Easy to identify new tabs

## Technical Details

### Tab ID Generation

Tab ID is based on model name and version:
```typescript
const tabId = `${modelName}_v${modelVersion}`;
```

When editing, if model name or version changes, the ID changes too.

### Technical ID Generation

Technical ID includes timestamp for uniqueness:
```typescript
const technicalId = `${modelName}_v${modelVersion}_${Date.now()}`;
```

This ensures each tab has a unique technical ID even if model name/version are the same.

### Auto-Incrementing Counter

```typescript
const newTabCounter = tabs.filter(t => t.modelName.startsWith('new-workflow')).length + 1;
```

Counts existing tabs with "new-workflow" prefix and increments.

### Validation

**Model Name**:
- Cannot be empty
- Shows error modal if empty

**Model Version**:
- Must be at least 1
- Shows error modal if less than 1

**Display Name**:
- Optional
- Falls back to `{modelName} v{modelVersion}` if empty

### ID Update Handling

When tab ID changes:
1. Update tab in tabs array
2. Check if it's the active tab
3. If yes, update activeTabId to new ID
4. Maintains correct active state

## Usage Examples

### Example 1: Quick Start

1. User clicks "+" button
2. Tab appears: "New Workflow 1" (new-workflow-1 v1)
3. User starts building workflow
4. Later, right-click → Edit
5. Change to "user-registration" v1
6. Tab updates: "user-registration v1"

### Example 2: Multiple New Tabs

1. Click "+" → "New Workflow 1"
2. Click "+" → "New Workflow 2"
3. Click "+" → "New Workflow 3"
4. Each has unique name
5. Edit each one individually

### Example 3: Version Increment

1. Create tab: "order-process" v1
2. Right-click → Edit
3. Change version to 2
4. Tab updates: "order-process v2"
5. Tab ID changes: `order-process_v2`

### Example 4: Custom Display Name

1. Create tab: "New Workflow 1"
2. Right-click → Edit
3. Set display name: "Payment Processing"
4. Set model name: "payment-flow"
5. Set version: 1
6. Tab shows: "Payment Processing" (payment-flow v1)

## Error Handling

### Empty Model Name

```typescript
if (!editModelName.trim()) {
  Modal.error({
    title: 'Invalid Model Name',
    content: 'Model name cannot be empty'
  });
  return;
}
```

User sees error modal and can correct the input.

### Invalid Version

```typescript
if (editModelVersion < 1) {
  Modal.error({
    title: 'Invalid Version',
    content: 'Version must be at least 1'
  });
  return;
}
```

User sees error modal and can correct the input.

### Duplicate Tab IDs

If user edits a tab to have the same model name and version as another tab, the ID will conflict. This is currently not prevented but could be added as future enhancement.

## Testing

### Manual Testing Steps

1. **Test New Tab Creation**
   - Click "+" button
   - Verify tab appears immediately
   - Verify default name: "New Workflow 1"
   - Verify model name: "new-workflow-1"
   - Verify version: 1

2. **Test Multiple New Tabs**
   - Create 3 new tabs
   - Verify names: "New Workflow 1", "New Workflow 2", "New Workflow 3"
   - Verify each has unique model name

3. **Test Edit Functionality**
   - Right-click on tab
   - Select "Edit"
   - Verify modal opens with current values
   - Change display name
   - Click "Save"
   - Verify tab updates

4. **Test Model Name Edit**
   - Edit tab
   - Change model name
   - Click "Save"
   - Verify tab subtitle updates

5. **Test Version Edit**
   - Edit tab
   - Change version
   - Click "Save"
   - Verify tab subtitle updates

6. **Test Validation**
   - Edit tab
   - Clear model name
   - Click "Save"
   - Verify error modal appears
   - Set version to 0
   - Click "Save"
   - Verify error modal appears

7. **Test Cancel**
   - Edit tab
   - Make changes
   - Click "Cancel"
   - Verify changes are not saved

### Test Cases

- ✅ New tab created immediately on "+" click
- ✅ Default values populated correctly
- ✅ Auto-incrementing counter works
- ✅ Right-click shows context menu
- ✅ "Edit" option opens modal
- ✅ Modal shows current values
- ✅ Display name can be edited
- ✅ Model name can be edited
- ✅ Version can be edited
- ✅ Save updates tab
- ✅ Cancel discards changes
- ✅ Empty model name shows error
- ✅ Invalid version shows error
- ✅ Tab ID updates when model name/version changes
- ✅ Active tab ID updates correctly

## Related Files

- `packages/web/src/components/WorkflowTabs/WorkflowTabsContainer.tsx` - Container component
- `packages/web/src/components/WorkflowTabs/WorkflowTabs.tsx` - Tabs component with edit
- `packages/web/src/stores/workflowTabs.ts` - Tab state management

## Future Enhancements

Possible improvements:
- [ ] Prevent duplicate tab IDs
- [ ] Add inline editing (double-click tab to edit)
- [ ] Add tab templates
- [ ] Add tab duplication
- [ ] Add tab reordering (drag and drop)
- [ ] Add keyboard shortcuts for edit (e.g., F2)
- [ ] Add validation for model name format
- [ ] Add tab color customization

