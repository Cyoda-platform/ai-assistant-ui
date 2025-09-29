# Workflow Implementation Requirements

## Overview
This document outlines the complete requirements for implementing a standalone workflow management system in the web package, based on the existing implementations in `desktop-workflow` and `ui-backup` packages.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Features](#core-features)
3. [Data Model](#data-model)
4. [Components](#components)
5. [State Management](#state-management)
6. [Storage](#storage)
7. [User Interface](#user-interface)
8. [Technical Requirements](#technical-requirements)

---

## Architecture Overview

### Technology Stack
- **Framework**: React 18+ with TypeScript
- **State Management**: Zustand (already in use)
- **Routing**: React Router v6
- **UI Library**: Element Plus (or React equivalent)
- **Workflow Visualization**: React Flow (@xyflow/react)
- **Code Editor**: Monaco Editor
- **Storage**: LocalStorage (browser-based)
- **Styling**: SCSS modules

### Application Structure
```
packages/web/
├── src/
│   ├── views/
│   │   └── WorkflowView.tsx          # Main workflow page
│   ├── components/
│   │   ├── Workflow/
│   │   │   ├── WorkflowHeader.tsx    # Export/Import controls
│   │   │   ├── WorkflowSidebar.tsx   # Workflow list sidebar
│   │   │   ├── WorkflowList.tsx      # Grouped workflow list
│   │   │   ├── WorkflowItem.tsx      # Individual workflow item
│   │   │   ├── CreateWorkflowDialog.tsx
│   │   │   ├── ExportDialog.tsx
│   │   │   └── ImportDialog.tsx
│   │   └── ChatBot/
│   │       └── ChatBotEditorWorkflow.tsx  # Already exists
│   ├── stores/
│   │   └── workflows.ts              # Workflow state management
│   ├── helpers/
│   │   └── HelperWorkflowStorage.ts  # LocalStorage wrapper
│   └── types/
│       └── workflow.d.ts             # TypeScript definitions
```

---

## Core Features

### 1. Workflow Management
- **Create** new workflows with name and description
- **Read/List** all workflows grouped by date (Today, Yesterday, Previous Week, Older)
- **Update** workflow metadata (name, description) and content (canvasData, workflowMetaData)
- **Delete** individual workflows or all workflows
- **Select** workflow to view/edit

### 2. Workflow Editor
- **Visual Editor**: React Flow-based canvas for state machine visualization
- **Code Editor**: Monaco editor for JSON editing
- **View Modes**:
  - `editor`: Code editor only
  - `preview`: Visual canvas only
  - `editorPreview`: Split view with both editors
- **Auto-save**: Debounced updates (500ms) when workflow changes
- **Undo/Redo**: History management for workflow changes

### 3. Import/Export
- **Export**:
  - Select multiple workflows from table
  - Export as JSON file with naming: `workflow_{name}_{date}.json` or `workflows_{count}_items_{date}.json`
  - Include all workflow data (metadata, canvas data, technical_id)
- **Import**:
  - Drag & drop or file selection
  - Support .json and .txt files
  - Option to skip existing workflows (by technical_id)
  - Progress tracking with results display
  - Validation of imported data structure

### 4. Workflow History/List
- **Grouping**: Automatic grouping by date
  - Today
  - Yesterday
  - Previous Week (last 7 days)
  - Older
- **Display**: Show workflow name, technical_id, creation date
- **Actions**: Rename, Delete, Select
- **Empty State**: Friendly message when no workflows exist

---

## Data Model

### Workflow Object
```typescript
interface Workflow {
  technical_id: string;        // UUID v4
  name: string;                // Max 100 characters
  description: string;         // Max 500 characters
  date: string;                // ISO date string
  workflowMetaData: string | object;  // JSON string or object
  canvasData: string | object;        // JSON string or object
}
```

### Workflow Metadata
```typescript
interface WorkflowMetaData {
  name?: string;
  description?: string;
  version?: string;
  // Additional metadata fields
}
```

### Canvas Data (Workflow Definition)
```typescript
interface WorkflowData {
  initial_state: string;
  states: {
    [stateId: string]: {
      transitions?: WorkflowTransition[];
      [key: string]: any;
    };
  };
}

interface WorkflowTransition {
  name: string;
  next: string;
  manual?: boolean;
  processors?: Array<{
    name: string;
    config?: Record<string, any>;
  }>;
  criteria?: Array<{
    type: string;
    function?: { name: string };
    name?: string;
    operator?: string;
    parameters?: any[];
  }>;
}
```

---

## Components

### 1. WorkflowView (Main Page)
**Location**: `src/views/WorkflowView.tsx`

**Responsibilities**:
- Main container for workflow management
- Display WorkflowHeader and WorkflowSidebar
- Show ChatBotEditorWorkflow when workflow is selected
- Show empty state when no workflow is selected
- Handle workflow selection changes
- Debounce workflow updates (500ms)

**Props**: None (uses store)

**State**:
- Selected workflow from store
- Reference to ChatBotEditorWorkflow component

**Layout**:
```
┌─────────────────────────────────────────┐
│ WorkflowHeader (Export/Import)          │
├──────────┬──────────────────────────────┤
│          │                              │
│ Workflow │  ChatBotEditorWorkflow       │
│ Sidebar  │  (or Empty State)            │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

### 2. WorkflowHeader
**Location**: `src/components/Workflow/WorkflowHeader.tsx`

**Responsibilities**:
- Display Export and Import buttons
- Open respective dialogs

**UI Elements**:
- Export button (primary)
- Import button (default)

### 3. WorkflowSidebar
**Location**: `src/components/Workflow/WorkflowSidebar.tsx`

**Responsibilities**:
- Display logo and version
- Show/hide toggle
- Display WorkflowList component
- "Add New Workflow" button
- "Delete All Workflows" button (with confirmation)
- Settings and About links

**Features**:
- Collapsible sidebar (64px collapsed, 296px expanded)
- Persistent state (localStorage)

### 4. WorkflowList
**Location**: `src/components/Workflow/WorkflowList.tsx`

**Responsibilities**:
- Fetch workflows from store on mount
- Group workflows by date
- Display WorkflowGroup components
- Show empty state if no workflows

**Grouping Logic**:
```typescript
function splitWorkflowsByDate(workflows: Workflow[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  // Group into: Today, Yesterday, Previous Week, Older
}
```

### 5. WorkflowItem
**Location**: `src/components/Workflow/WorkflowItem.tsx`

**Props**:
```typescript
interface WorkflowItemProps {
  workflow: Workflow;
}
```

**Features**:
- Display workflow name
- Active state styling when selected
- Three-dot menu (popover) with:
  - Workflow details (name, description, date)
  - Rename action
  - Delete action (with confirmation)
- Click to select workflow

### 6. CreateWorkflowDialog
**Location**: `src/components/Workflow/CreateWorkflowDialog.tsx`

**Modes**:
- Create new workflow
- Rename existing workflow (via event bus)

**Form Fields**:
- Name (required, 1-100 characters)
- Description (optional, max 500 characters)

**Validation**:
- Name is required
- Character limits enforced
- Show character count

**Actions**:
- Cancel: Close dialog, reset form
- Create/Update: Validate, save to store, show success message

### 7. ExportDialog
**Location**: `src/components/Workflow/ExportDialog.tsx`

**Features**:
- Table with selectable workflows
- Columns: Selection checkbox, Name, Technical ID, Created Date
- Select All / Clear Selection buttons
- Export button (disabled if no selection)
- Show selection count
- Generate JSON file with proper naming
- Use FileSaver.js for download

### 8. ImportDialog
**Location**: `src/components/Workflow/ImportDialog.tsx`

**Features**:
- Drag & drop zone
- File input (click to select)
- Support .json and .txt files
- Option: "Skip existing workflows" (checkbox with tooltip)
- Progress bar during import
- Results display:
  - Success/Error status per workflow
  - Message for each result
- Validation:
  - Check JSON structure
  - Verify required fields (technical_id, name, date)
  - Handle duplicate technical_ids

---

## State Management

### Workflow Store
**Location**: `src/stores/workflows.ts`

**State**:
```typescript
interface WorkflowState {
  workflowList: Workflow[];
  selectedWorkflow: Workflow | null;
}
```

**Actions**:
```typescript
interface WorkflowActions {
  // CRUD operations
  createWorkflow(data: Partial<Workflow>): Promise<Workflow>;
  updateWorkflow(data: Partial<Workflow> & { technical_id: string }): Promise<void>;
  deleteWorkflowById(technical_id: string): Promise<void>;
  deleteAll(): Promise<void>;
  
  // Read operations
  getAll(): Promise<void>;
  setSelectedWorkflow(workflow: Workflow | null): void;
}
```

**Implementation Details**:
- Use HelperWorkflowStorage for persistence
- Generate UUID v4 for new workflows
- Serialize workflowMetaData and canvasData as JSON strings
- Handle errors gracefully
- Update workflowList after mutations

---

## Storage

### HelperWorkflowStorage
**Location**: `src/helpers/HelperWorkflowStorage.ts`

**Purpose**: Wrapper around localStorage for workflow data

**Storage Key**: `WORKFLOW_LIST`

**Methods**:
```typescript
class HelperWorkflowStorage {
  static async set(key: string, value: any): Promise<void>;
  static async get(key: string, defaultValue?: any): Promise<any>;
  static async has(key: string): Promise<boolean>;
  static async remove(key: string): Promise<void>;
  static async clear(): Promise<void>;
}
```

**Data Format**:
- Store workflows as JSON array
- Handle serialization/deserialization
- Provide error handling for quota exceeded

---

## User Interface

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Header: [Export] [Import]                              │
├──────────────┬──────────────────────────────────────────┤
│ Sidebar      │ Main Content Area                        │
│ ┌──────────┐ │ ┌──────────────────────────────────────┐ │
│ │ Logo     │ │ │                                      │ │
│ │ Version  │ │ │   ChatBotEditorWorkflow              │ │
│ └──────────┘ │ │   - Editor/Preview modes             │ │
│              │ │   - React Flow canvas                │ │
│ History ▼    │ │   - Monaco editor                    │ │
│ ┌──────────┐ │ │                                      │ │
│ │ Today    │ │ │                                      │ │
│ │  - Item1 │ │ └──────────────────────────────────────┘ │
│ │  - Item2 │ │                                          │
│ │ Yesterday│ │ OR                                       │
│ │  - Item3 │ │                                          │
│ └──────────┘ │ ┌──────────────────────────────────────┐ │
│              │ │ Empty State                          │ │
│ [Settings]   │ │ "No Workflow Selected"               │ │
│ [About]      │ │ "Choose an existing workflow..."     │ │
│              │ └──────────────────────────────────────┘ │
│ [Add New]    │                                          │
│ [Delete All] │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### Empty State
**Display when**: No workflow is selected

**Content**:
- Title: "No Workflow Selected"
- Message: "Choose an existing workflow from the sidebar or create a new one to get started with your automation journey."
- Centered layout
- Subtle styling

### Styling Guidelines
- Use CSS variables for theming
- Maintain consistency with existing web package styles
- Responsive design (mobile-friendly)
- Smooth transitions and animations
- Accessible (ARIA labels, keyboard navigation)

---

## Technical Requirements

### Dependencies
```json
{
  "dependencies": {
    "@xyflow/react": "^12.x",
    "monaco-editor": "^0.53.0",
    "uuid": "^13.0.0",
    "file-saver": "^2.0.5",
    "lodash": "^4.17.21",
    "dayjs": "^1.11.18"
  }
}
```

### TypeScript Configuration
- Strict mode enabled
- Proper type definitions for all components
- No `any` types without justification

### Performance Considerations
- Debounce workflow updates (500ms)
- Lazy load Monaco editor
- Virtualize long workflow lists if needed
- Memoize expensive computations
- Use React.memo for pure components

### Error Handling
- Try-catch blocks for async operations
- User-friendly error messages
- Console logging for debugging
- Graceful degradation

### Testing Requirements
- Unit tests for store actions
- Component tests for UI elements
- Integration tests for workflows
- E2E tests for critical paths

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- ARIA labels and roles
- Focus management
- Color contrast compliance

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- LocalStorage support required

---

## Implementation Phases

### Phase 1: Core Infrastructure
1. Create workflow store with Zustand
2. Implement HelperWorkflowStorage
3. Define TypeScript types
4. Set up routing

### Phase 2: Basic UI
1. Create WorkflowView
2. Implement WorkflowSidebar
3. Build WorkflowList and WorkflowItem
4. Add CreateWorkflowDialog

### Phase 3: CRUD Operations
1. Implement create workflow
2. Implement update workflow
3. Implement delete workflow
4. Add workflow selection

### Phase 4: Import/Export
1. Build ExportDialog
2. Build ImportDialog
3. Implement file handling
4. Add validation

### Phase 5: Polish
1. Add empty states
2. Implement loading states
3. Add animations
4. Improve error handling
5. Add accessibility features

### Phase 6: Testing & Documentation
1. Write unit tests
2. Write integration tests
3. Update user documentation
4. Code review and refinement

---

## Migration Notes

### From Vue (ui-backup/desktop-workflow) to React (web)
- Replace Vue components with React functional components
- Replace Pinia stores with Zustand stores
- Replace Element Plus (Vue) with Ant Design or Material-UI (React)
- Replace Vue Router with React Router
- Replace `ref` and `computed` with `useState` and `useMemo`
- Replace `watch` with `useEffect`
- Replace event bus with props/callbacks or context

### Key Differences
- React uses JSX instead of template syntax
- State management is more explicit in React
- No two-way binding (use controlled components)
- Different lifecycle methods (useEffect vs mounted/unmounted)

---

## References

### Existing Implementations
- **Desktop Workflow**: `packages/desktop-workflow/`
- **UI Backup**: `packages/ui-backup/`
- **Web Package**: `packages/web/`

### Key Files to Reference
- `packages/desktop-workflow/src/stores/workflows.ts`
- `packages/desktop-workflow/src/views/Workflow.vue`
- `packages/ui-backup/src/components/ChatBot/ChatBotEditorWorkflow.vue`
- `packages/web/src/hooks/useWorkflowEditor.ts`
- `packages/web/src/components/ChatBot/ChatBotEditorWorkflow.tsx`

---

## Appendix

### Storage Constants
```typescript
export const WORKFLOW_STORAGE_KEY = 'WORKFLOW_LIST';
export const WORKFLOW_SIDEBAR_STATE_KEY = 'WORKFLOW_SIDEBAR_COLLAPSED';
```

### Event Names
```typescript
export const RENAME_WORKFLOW_START = 'RENAME_WORKFLOW_START';
export const WORKFLOW_CREATED = 'WORKFLOW_CREATED';
export const WORKFLOW_UPDATED = 'WORKFLOW_UPDATED';
export const WORKFLOW_DELETED = 'WORKFLOW_DELETED';
```

### Validation Rules
```typescript
export const WORKFLOW_NAME_MIN_LENGTH = 1;
export const WORKFLOW_NAME_MAX_LENGTH = 100;
export const WORKFLOW_DESCRIPTION_MAX_LENGTH = 500;
```

