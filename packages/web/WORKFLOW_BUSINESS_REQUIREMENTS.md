# Workflow Canvas Implementation - Business Requirements Document

**Project**: Workflow Management System for Web Package  
**Location**: `/home/kseniia/IdeaProjects/ai-assistant-ui-new/packages/web`  
**Version**: 1.0  
**Date**: January 2025  
**Status**: Ready for Implementation

---

## Executive Summary

This document defines the complete business requirements for implementing a standalone workflow management system in the web package. The system will enable users to create, edit, visualize, and manage state machine workflows through an intuitive canvas-based interface.

### Business Objectives
1. Provide a visual workflow designer for creating state machine workflows
2. Enable workflow lifecycle management (CRUD operations)
3. Support import/export for workflow portability
4. Ensure data persistence using browser storage
5. Maintain compatibility with existing Cyoda workflow schema

### Success Criteria
- Users can create and edit workflows visually
- Workflows are automatically saved and persisted
- Import/export functionality works seamlessly
- System validates workflows against schema
- UI is responsive and intuitive

---

## 1. Business Context

### 1.1 Purpose
The workflow management system allows users to design and manage state machine workflows that define business process automation. These workflows consist of states and transitions with optional processors and criteria.

### 1.2 Target Users
- **Business Analysts**: Design workflow logic
- **Developers**: Implement and test workflows
- **System Administrators**: Manage workflow lifecycle

### 1.3 Use Cases

#### UC-1: Create New Workflow
**Actor**: User  
**Goal**: Create a new workflow from scratch  
**Steps**:
1. User clicks "Add New Workflow" button
2. System displays creation dialog
3. User enters workflow name and description
4. System creates workflow with empty canvas
5. User designs workflow using visual editor

#### UC-2: Edit Existing Workflow
**Actor**: User  
**Goal**: Modify an existing workflow  
**Steps**:
1. User selects workflow from sidebar
2. System loads workflow in canvas
3. User edits workflow (add/remove states, modify transitions)
4. System auto-saves changes (debounced)

#### UC-3: Import Workflows
**Actor**: User  
**Goal**: Import workflows from JSON file  
**Steps**:
1. User clicks "Import" button
2. User selects or drags JSON file
3. System validates file structure
4. System imports workflows (with option to skip duplicates)
5. System displays import results

#### UC-4: Export Workflows
**Actor**: User  
**Goal**: Export workflows for backup or sharing  
**Steps**:
1. User clicks "Export" button
2. User selects workflows from table
3. System generates JSON file
4. System downloads file to user's device

---

## 2. Functional Requirements

### 2.1 Workflow Management

#### FR-1.1: Create Workflow
- System SHALL allow users to create new workflows
- System SHALL require workflow name (1-100 characters)
- System SHALL allow optional description (max 500 characters)
- System SHALL generate unique technical_id (UUID v4)
- System SHALL set creation timestamp automatically

#### FR-1.2: Read/List Workflows
- System SHALL display all workflows in sidebar
- System SHALL group workflows by date:
  - Today
  - Yesterday
  - Previous Week (last 7 days)
  - Older
- System SHALL show workflow name, technical_id, and date
- System SHALL indicate selected workflow

#### FR-1.3: Update Workflow
- System SHALL allow renaming workflows
- System SHALL allow updating descriptions
- System SHALL auto-save canvas changes (500ms debounce)
- System SHALL serialize workflow data as JSON strings

#### FR-1.4: Delete Workflow
- System SHALL allow deleting individual workflows
- System SHALL require confirmation before deletion
- System SHALL allow deleting all workflows
- System SHALL clear selection after deletion

### 2.2 Workflow Canvas Editor

#### FR-2.1: Visual Canvas
- System SHALL render workflows using React Flow
- System SHALL display states as nodes
- System SHALL display transitions as edges
- System SHALL apply automatic layout (Dagre algorithm)
- System SHALL support zoom and pan operations

#### FR-2.2: Node Visualization
- System SHALL color-code nodes by type:
  - Initial state: Teal/Green (#14B8A6)
  - Normal state: Blue (#3B82F6)
  - Terminal state: Green (#10B981)
- System SHALL display state name on node
- System SHALL show transition count
- System SHALL indicate node type visually

#### FR-2.3: Edge Visualization
- System SHALL display transition names as edge labels
- System SHALL show arrows indicating direction
- System SHALL animate edges for active transitions
- System SHALL support edge tooltips with details

#### FR-2.4: Code Editor
- System SHALL provide Monaco editor for JSON editing
- System SHALL validate JSON syntax in real-time
- System SHALL support syntax highlighting
- System SHALL show line numbers and error indicators

#### FR-2.5: View Modes
- System SHALL support three view modes:
  - **Editor Only**: Code editor fills screen
  - **Preview Only**: Canvas fills screen
  - **Split View**: Both editor and canvas visible
- System SHALL allow switching between modes
- System SHALL persist view mode preference

### 2.3 Workflow Schema Compliance

#### FR-3.1: Required Fields
- System SHALL enforce required fields per schema:
  - `version` (string)
  - `name` (string)
  - `initialState` (string, must be "initial_state")
  - `states` (object)

#### FR-3.2: State Structure
- Each state SHALL have `transitions` array
- Terminal states SHALL have empty transitions array
- System SHALL validate state references

#### FR-3.3: Transition Structure
- Each transition SHALL have:
  - `name` (string, required)
  - `next` (string, required, must reference existing state)
  - `manual` (boolean, required)
- Each transition MAY have:
  - `processors` (array of processor objects)
  - `criterion` (criteria object)

#### FR-3.4: Processor Structure
- Each processor SHALL have:
  - `name` (string)
  - `executionMode` (enum: SYNC, ASYNC_NEW_TX, ASYNC_SAME_TX)
  - `config` (object with calculationNodesTags)

#### FR-3.5: Criterion Structure
- Criterion SHALL have `type` (enum: function, group, simple)
- Simple criterion SHALL have:
  - `jsonPath` (string)
  - `operation` (enum: EQUALS, GREATER_THAN, etc.)
  - `value` (string, number, or boolean)
- Group criterion SHALL have:
  - `operator` (enum: AND, OR)
  - `conditions` (array of simple criteria)

### 2.4 Import/Export

#### FR-4.1: Export Functionality
- System SHALL allow selecting multiple workflows
- System SHALL generate valid JSON file
- System SHALL name file: `workflow_{name}_{date}.json` (single) or `workflows_{count}_items_{date}.json` (multiple)
- System SHALL include all workflow data
- System SHALL use FileSaver.js for download

#### FR-4.2: Import Functionality
- System SHALL support drag & drop file upload
- System SHALL support click-to-select file upload
- System SHALL accept .json and .txt files
- System SHALL validate file structure
- System SHALL provide option to skip existing workflows
- System SHALL show progress during import
- System SHALL display results (success/error per workflow)

### 2.5 Data Persistence

#### FR-5.1: Storage
- System SHALL use browser localStorage
- System SHALL store workflows under key "WORKFLOW_LIST"
- System SHALL serialize data as JSON
- System SHALL handle storage quota errors gracefully

#### FR-5.2: Auto-Save
- System SHALL auto-save workflow changes
- System SHALL debounce saves (500ms delay)
- System SHALL save on workflow selection change
- System SHALL NOT save invalid workflows

---

## 3. Non-Functional Requirements

### 3.1 Performance
- NFR-1.1: Canvas SHALL render workflows with up to 50 states without lag
- NFR-1.2: Auto-save SHALL complete within 100ms
- NFR-1.3: Import SHALL process 100 workflows within 5 seconds

### 3.2 Usability
- NFR-2.1: UI SHALL be intuitive for non-technical users
- NFR-2.2: System SHALL provide helpful error messages
- NFR-2.3: System SHALL support keyboard navigation
- NFR-2.4: System SHALL be responsive (desktop and tablet)

### 3.3 Reliability
- NFR-3.1: System SHALL validate all user inputs
- NFR-3.2: System SHALL handle errors gracefully
- NFR-3.3: System SHALL prevent data loss during crashes
- NFR-3.4: System SHALL maintain data integrity

### 3.4 Maintainability
- NFR-4.1: Code SHALL follow TypeScript best practices
- NFR-4.2: Components SHALL be modular and reusable
- NFR-4.3: Code SHALL have 80%+ test coverage
- NFR-4.4: Documentation SHALL be comprehensive

### 3.5 Accessibility
- NFR-5.1: System SHALL meet WCAG 2.1 Level AA standards
- NFR-5.2: System SHALL support screen readers
- NFR-5.3: System SHALL provide keyboard shortcuts
- NFR-5.4: System SHALL maintain 4.5:1 color contrast

---

## 4. Data Model

### 4.1 Workflow Object
```typescript
interface Workflow {
  technical_id: string;        // UUID v4
  name: string;                // 1-100 characters
  description: string;         // 0-500 characters
  date: string;                // ISO 8601 timestamp
  workflowMetaData: object;    // Metadata per schema
  canvasData: object;          // Workflow definition per schema
}
```

### 4.2 Workflow Metadata
```typescript
interface WorkflowMetaData {
  version: string;             // Required
  name: string;                // Required
  desc?: string;               // Optional
  active?: boolean;            // Optional
}
```

### 4.3 Canvas Data (Workflow Definition)
```typescript
interface WorkflowData {
  version: string;             // Required
  name: string;                // Required
  initialState: "initial_state"; // Required, fixed value
  states: {
    [stateId: string]: {
      transitions: Transition[];
    };
  };
}
```

### 4.4 Transition
```typescript
interface Transition {
  name: string;                // Required
  next: string;                // Required, must reference existing state
  manual: boolean;             // Required
  processors?: Processor[];    // Optional
  criterion?: Criterion;       // Optional
}
```

---

## 5. User Interface Requirements

### 5.1 Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header: [Export] [Import]                              │
├──────────────┬──────────────────────────────────────────┤
│ Sidebar      │ Canvas Area                              │
│ (296px)      │                                          │
│              │ ┌──────────────────────────────────────┐ │
│ [Logo]       │ │ View Mode Selector                   │ │
│ [Version]    │ ├──────────────────────────────────────┤ │
│              │ │                                      │ │
│ History ▼    │ │ Monaco Editor / React Flow Canvas   │ │
│ ┌──────────┐ │ │                                      │ │
│ │ Today    │ │ │                                      │ │
│ │  Item 1  │ │ │                                      │ │
│ │  Item 2  │ │ │                                      │ │
│ │ Yesterday│ │ │                                      │ │
│ │  Item 3  │ │ │                                      │ │
│ └──────────┘ │ │                                      │ │
│              │ └──────────────────────────────────────┘ │
│ [Settings]   │                                          │
│ [About]      │                                          │
│              │                                          │
│ [Add New]    │                                          │
│ [Delete All] │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### 5.2 Empty State
When no workflow is selected:
- Display centered message
- Title: "No Workflow Selected"
- Description: "Choose an existing workflow from the sidebar or create a new one to get started with your automation journey."

### 5.3 Color Scheme
- Primary: #409EFF (blue)
- Success: #10B981 (green)
- Warning: #F59E0B (amber)
- Error: #EF4444 (red)
- Background: var(--bg)
- Text: var(--text-color-regular)

---

## 6. Technical Architecture

### 6.1 Technology Stack
- **Frontend Framework**: React 18.3+
- **Language**: TypeScript 5.9+
- **State Management**: Zustand
- **Routing**: React Router v6
- **Canvas**: React Flow (@xyflow/react v12+)
- **Editor**: Monaco Editor v0.53+
- **Storage**: Browser localStorage
- **Styling**: SCSS modules
- **Build Tool**: Vite 7+

### 6.2 Component Structure
```
WorkflowView (Main Container)
├── WorkflowSidebar
│   ├── Logo & Version
│   ├── WorkflowList
│   │   ├── WorkflowGroup (Today)
│   │   │   └── WorkflowItem[]
│   │   ├── WorkflowGroup (Yesterday)
│   │   └── ...
│   ├── Settings Link
│   ├── About Link
│   ├── Add New Button
│   └── Delete All Button
├── WorkflowHeader
│   ├── Export Button
│   └── Import Button
└── ChatBotEditorWorkflow
    ├── EditorViewMode Selector
    ├── Monaco Editor (conditional)
    └── React Flow Canvas (conditional)
        ├── Background
        ├── Controls
        ├── Nodes (WorkflowNode[])
        └── Edges (WorkflowEdge[])
```

### 6.3 State Management
```typescript
// Zustand Store
interface WorkflowStore {
  // State
  workflowList: Workflow[];
  selectedWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  getAll: () => Promise<void>;
  createWorkflow: (data: Partial<Workflow>) => Promise<Workflow>;
  updateWorkflow: (data: Partial<Workflow> & { technical_id: string }) => Promise<void>;
  deleteWorkflowById: (technical_id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  setSelectedWorkflow: (workflow: Workflow | null) => void;
}
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up workflow store (Zustand)
- [ ] Implement storage helper
- [ ] Define TypeScript types
- [ ] Add routing configuration

### Phase 2: Core UI (Week 2)
- [ ] Create WorkflowView component
- [ ] Implement WorkflowSidebar
- [ ] Build WorkflowList with grouping
- [ ] Create WorkflowItem component

### Phase 3: CRUD Operations (Week 3)
- [ ] Implement create workflow
- [ ] Implement update workflow
- [ ] Implement delete workflow
- [ ] Add workflow selection logic

### Phase 4: Canvas Integration (Week 4)
- [ ] Integrate ChatBotEditorWorkflow
- [ ] Implement auto-save with debounce
- [ ] Add view mode switching
- [ ] Implement undo/redo

### Phase 5: Import/Export (Week 5)
- [ ] Build ExportDialog
- [ ] Build ImportDialog
- [ ] Implement file validation
- [ ] Add progress tracking

### Phase 6: Polish & Testing (Week 6)
- [ ] Add empty states
- [ ] Implement loading states
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Accessibility audit
- [ ] Performance optimization

---

## 8. Acceptance Criteria

### 8.1 Workflow Management
- ✓ User can create workflow with name and description
- ✓ User can view list of workflows grouped by date
- ✓ User can select workflow to edit
- ✓ User can rename workflow
- ✓ User can delete workflow with confirmation
- ✓ User can delete all workflows with confirmation

### 8.2 Canvas Editor
- ✓ Workflow renders as visual graph
- ✓ States display as colored nodes
- ✓ Transitions display as labeled edges
- ✓ User can switch between view modes
- ✓ Changes auto-save after 500ms
- ✓ JSON editor validates syntax

### 8.3 Import/Export
- ✓ User can export selected workflows
- ✓ Export generates valid JSON file
- ✓ User can import workflows via drag & drop
- ✓ Import validates file structure
- ✓ Import shows progress and results
- ✓ User can skip existing workflows during import

### 8.4 Data Persistence
- ✓ Workflows persist in localStorage
- ✓ Workflows load on page refresh
- ✓ No data loss on browser close
- ✓ Storage errors handled gracefully

---

## 9. Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Browser storage quota exceeded | High | Medium | Implement storage monitoring, warn users |
| Complex workflows cause performance issues | Medium | Low | Optimize rendering, implement virtualization |
| Schema changes break existing workflows | High | Low | Version workflows, provide migration tools |
| Import of malformed JSON crashes app | Medium | Medium | Robust validation, error boundaries |

---

## 10. Dependencies

### 10.1 External Libraries
- @xyflow/react: ^12.x (workflow canvas)
- monaco-editor: ^0.53.0 (code editor)
- uuid: ^13.0.0 (ID generation)
- file-saver: ^2.0.5 (file download)
- lodash: ^4.17.21 (utilities)
- dayjs: ^1.11.18 (date formatting)

### 10.2 Internal Dependencies
- Existing ChatBotEditorWorkflow component
- Existing useWorkflowEditor hook
- Existing workflow utilities
- Existing theme system

---

## 11. Success Metrics

- **Adoption**: 80% of users create at least one workflow
- **Usability**: Average task completion time < 5 minutes
- **Reliability**: < 1% error rate
- **Performance**: Canvas renders in < 500ms
- **Satisfaction**: User satisfaction score > 4/5

---

## 12. Glossary

- **Workflow**: State machine definition with states and transitions
- **State**: Node in workflow representing a stage
- **Transition**: Edge connecting states with optional logic
- **Processor**: Code executed during transition
- **Criterion**: Condition determining transition path
- **Canvas**: Visual representation of workflow
- **Initial State**: Starting point of workflow (always "initial_state")
- **Terminal State**: End point with no outgoing transitions

---

## 13. References

- Workflow Schema: `packages/web/workflow_schema.json`
- Technical Requirements: `packages/web/WORKFLOW_REQUIREMENTS.md`
- Implementation Guide: `packages/web/WORKFLOW_IMPLEMENTATION_GUIDE.md`
- JSON Examples: `packages/web/WORKFLOW_JSON_EXAMPLES.md`
- Desktop Implementation: `packages/desktop-workflow/`
- UI Backup Implementation: `packages/ui-backup/`

---

**Document Approval**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Technical Lead | | | |
| QA Lead | | | |

---

**Change Log**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01 | System | Initial document |

