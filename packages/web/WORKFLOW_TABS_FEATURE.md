# Workflow Tabs Feature

## Overview

The Workflow Tabs feature provides an IDE-like tabbed interface for managing multiple workflows simultaneously. Each tab represents a unique combination of entity model name and version, allowing users to work on multiple workflows without losing context.

## Features

### 1. Multiple Workflow Tabs
- Open multiple workflows simultaneously
- Each tab is identified by entity model name and version
- Switch between workflows instantly
- Visual indication of active tab

### 2. Tab Management
- **Open New Tab**: Create a new workflow tab with custom entity model name and version
- **Close Tab**: Close individual tabs with a click
- **Close Others**: Close all tabs except the current one (via context menu)
- **Close All**: Close all open tabs (via context menu)
- **Context Menu**: Right-click on any tab for additional options

### 3. Unsaved Changes Tracking
- Orange dot indicator on tabs with unsaved changes
- Prevents accidental data loss
- Visual feedback for workflow state

### 4. Tab Display
- **Primary Label**: Display name or auto-generated name
- **Secondary Label**: Entity model name and version
- **Icon**: File icon for visual consistency
- **Active Indicator**: Blue line at the top of active tab
- **Close Button**: Appears on hover or when tab is active

## Architecture

### Components

#### 1. WorkflowTabsStore (`src/stores/workflowTabs.ts`)
Zustand store managing tab state:
- `tabs`: Array of open workflow tabs
- `activeTabId`: Currently active tab ID
- `openTab()`: Open a new tab or activate existing
- `closeTab()`: Close a specific tab
- `setActiveTab()`: Switch to a different tab
- `updateTab()`: Update tab properties (e.g., isDirty flag)
- `closeAllTabs()`: Close all tabs
- `closeOtherTabs()`: Close all except specified tab
- `getActiveTab()`: Get currently active tab
- `hasUnsavedChanges()`: Check if any tab has unsaved changes

#### 2. WorkflowTabs Component (`src/components/WorkflowTabs/WorkflowTabs.tsx`)
Tab bar UI component:
- Renders all open tabs
- Handles tab switching
- Displays tab close buttons
- Shows unsaved changes indicator
- Provides context menu for tab operations
- New tab button

#### 3. WorkflowTabsContainer (`src/components/WorkflowTabs/WorkflowTabsContainer.tsx`)
Container managing tabs and workflow editors:
- Renders WorkflowTabs component
- Manages active workflow editor
- Handles new workflow modal
- Coordinates tab updates with workflow changes
- Shows empty state when no tabs are open

#### 4. WorkflowTabsView (`src/views/WorkflowTabsView.tsx`)
Full-page view for tabbed workflow interface:
- Entry point for the feature
- Full-screen layout
- Accessible via `/workflows` route

## Usage

### Opening the Tabbed Workflow Interface

Navigate to `/workflows` in your browser:
```
http://localhost:5173/workflows
```

### Creating a New Workflow Tab

1. Click the "+" button in the tab bar
2. Fill in the form:
   - **Entity Model Name**: Alphanumeric name (e.g., `user-registration`)
   - **Model Version**: Numeric version (e.g., `1`)
   - **Display Name** (optional): Friendly name for the tab
3. Click "Open"

### Working with Tabs

- **Switch Tabs**: Click on any tab to activate it
- **Close Tab**: Click the X button on the tab
- **Context Menu**: Right-click on a tab for more options
- **Unsaved Changes**: Orange dot appears when workflow is modified

### Tab Identification

Each tab is uniquely identified by:
```
{modelName}_v{modelVersion}
```

Example: `user-registration_v1`

This ensures that:
- Same entity model + version = same tab (no duplicates)
- Different versions = different tabs
- Consistent identification across sessions

## Data Storage

Each workflow tab stores its data using a unique technical ID:
```
{modelName}_v{modelVersion}_{timestamp}
```

Storage keys:
- `workflow_canvas_data_{technicalId}`: Workflow configuration and layout
- `workflow_metadata_{technicalId}`: Workflow metadata

## Integration with Existing Features

### Workflow Editor
- Each tab renders a `ChatBotEditorWorkflowNew` component
- Full workflow editing capabilities per tab
- Independent undo/redo history per workflow
- AI Assistant support per workflow

### Keyboard Shortcuts
All existing keyboard shortcuts work within each tab:
- Undo/Redo
- AI Assistant (Cmd/Ctrl + K)
- Layout operations

### Export/Import
- Export/Import operations work on the active tab
- Each workflow maintains its own configuration

## Styling

The tabs use a dark theme consistent with the IDE aesthetic:
- **Background**: Gray-900 (#111827)
- **Active Tab**: Gray-800 (#1F2937)
- **Inactive Tab**: Gray-900 with hover effect
- **Active Indicator**: Blue-500 (#3B82F6)
- **Text**: White for active, Gray-400 for inactive
- **Borders**: Gray-700 (#374151)

## Future Enhancements

### Potential Features
1. **Tab Reordering**: Drag and drop to reorder tabs
2. **Tab Pinning**: Pin frequently used workflows
3. **Tab Groups**: Group related workflows
4. **Split View**: View multiple workflows side-by-side
5. **Tab Search**: Quick search/filter for open tabs
6. **Recent Tabs**: Quick access to recently closed tabs
7. **Tab Persistence**: Save and restore tab sessions
8. **Keyboard Navigation**: Cmd/Ctrl + Tab to switch tabs
9. **Tab Overflow**: Better handling of many open tabs
10. **Duplicate Tab**: Clone a workflow to a new tab

## Technical Details

### State Management
- Uses Zustand for global tab state
- Each workflow editor maintains its own local state
- Tab state is separate from workflow data

### Performance
- Lazy rendering: Only active tab's workflow is fully rendered
- Efficient tab switching with React keys
- Minimal re-renders on tab operations

### Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- Focus management on tab switching

## Troubleshooting

### Tabs Not Appearing
- Check that you're on the `/workflows` route
- Verify WorkflowTabsView is properly imported in router

### Workflow Not Loading
- Check browser console for errors
- Verify technicalId is correctly generated
- Check localStorage for workflow data

### Unsaved Changes Not Showing
- Ensure `updateTab()` is called with `isDirty: true`
- Check that workflow update callback is properly connected

## Example Code

### Opening a Tab Programmatically
```typescript
import { useWorkflowTabsStore } from '@/stores/workflowTabs';

const { openTab } = useWorkflowTabsStore();

openTab({
  modelName: 'user-registration',
  modelVersion: 1,
  displayName: 'User Registration',
  isDirty: false,
  technicalId: 'user-registration_v1_1234567890',
});
```

### Checking for Unsaved Changes
```typescript
import { useWorkflowTabsStore } from '@/stores/workflowTabs';

const { hasUnsavedChanges } = useWorkflowTabsStore();

if (hasUnsavedChanges()) {
  // Prompt user before closing window
  window.onbeforeunload = () => 'You have unsaved changes';
}
```

## Related Files

- `src/stores/workflowTabs.ts` - Tab state management
- `src/components/WorkflowTabs/WorkflowTabs.tsx` - Tab bar UI
- `src/components/WorkflowTabs/WorkflowTabsContainer.tsx` - Container component
- `src/views/WorkflowTabsView.tsx` - Full-page view
- `src/router/index.tsx` - Route configuration
- `src/components/ChatBot/ChatBotEditorWorkflowNew.tsx` - Workflow editor

## Summary

The Workflow Tabs feature brings IDE-like multi-document editing to the workflow management system, enabling users to work more efficiently with multiple workflows. The feature is built with modern React patterns, uses Zustand for state management, and integrates seamlessly with existing workflow editing capabilities.

