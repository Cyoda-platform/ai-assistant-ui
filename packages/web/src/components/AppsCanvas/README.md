# Apps Canvas - React Flow Navigation System

## Overview

The Apps Canvas is an interactive, graph-based navigation system built with React Flow that visualizes the relationships between **Environments**, **Apps**, **Requirements**, **Entity Versions**, **Workflows**, and **Code**.

## ✅ Drag and Drop Enabled!

All nodes are now **fully draggable**! You can:
- **Drag any node** to reposition it on the canvas
- **Snap to grid** (optional, toggle in settings)
- **Auto-layout** with multiple algorithms (hierarchical, grid, circular)
- **Zoom and pan** freely across the canvas

## Architecture

```
Environment (Production, Staging, Dev)
  └─ App 1, 2, 3...
      └─ Requirement (versioned) 1.0, 2.0...
          └─ Entity-Version (Customer v1, v2...)
              └─ Workflow A, B, C...
                  └─ Code Files (TypeScript, Python...)
```

### Key Concepts

1. **Entity**: A data model (e.g., Customer, Order, Product)
2. **Version**: Different versions of an entity (v1.0, v2.0, etc.)
3. **Workflow**: State machines attached to entity versions
4. **Requirement**: Business requirements linked to workflows or versions

## Features

### 🎨 Visual Node Types

#### Entity Node (Blue)
- Large, prominent cards showing entity overview
- Displays version count, workflow count, requirement count
- Click to expand and view versions

#### Version Node (Green/Orange)
- Green: Active versions
- Orange: Draft/inactive versions
- Shows workflow and requirement counts
- Displays creation date

#### Workflow Node (Purple)
- Shows state count and transition count
- Double-click to edit workflow
- Displays last updated date

#### Requirement Node (Gray/Status-based)
- Color-coded by status:
  - Green: Verified
  - Blue: Implemented
  - Yellow: Approved
  - Gray: Draft
- Shows priority level (Critical, High, Medium, Low)

### 🔄 Layout Algorithms

1. **Hierarchical** (Default)
   - Organizes nodes in levels
   - Level 0: Entities
   - Level 1: Versions
   - Level 2: Workflows
   - Level 3: Requirements

2. **Grid**
   - Simple grid arrangement
   - Good for equal-sized nodes

3. **Circular**
   - Arranges nodes in a circle
   - Good for showing relationships

4. **Force-Directed** (Placeholder)
   - Physics-based layout
   - TODO: Implement with d3-force

### 🎯 Interactions

- **Click**: Select node, trigger callback
- **Double-click**: Edit workflow (for workflow nodes)
- **Drag**: Reposition nodes freely (✅ FULLY ENABLED!)
- **Zoom**: Mouse wheel or controls
- **Pan**: Click and drag canvas
- **Minimap**: Quick navigation for large graphs
- **Snap to Grid**: Optional grid snapping for precise alignment

### 🎛️ Controls

- Layout selector (Hierarchical, Grid, Circular)
- Relayout button (reapply layout algorithm)
- Fullscreen toggle
- Zoom controls
- Fit view

## Usage

### Basic Example

```tsx
import { AppsCanvas, samplePortalData } from '@/components/AppsCanvas';

function MyComponent() {
  return (
    <PortalCanvas
      data={samplePortalData}
      onEntityClick={(entityId) => console.log('Entity:', entityId)}
      onVersionClick={(versionId) => console.log('Version:', versionId)}
      onWorkflowClick={(workflowId) => console.log('Workflow:', workflowId)}
      onWorkflowEdit={(workflowId) => {
        // Open workflow editor
      }}
      onRequirementClick={(requirementId) => console.log('Requirement:', requirementId)}
    />
  );
}
```

### Custom Data

```tsx
import type { PortalData } from '@/components/PortalCanvas';

const myData: PortalData = {
  entities: [
    {
      id: 'entity-1',
      name: 'Customer',
      description: 'Customer entity',
      type: 'entity',
      versionCount: 2,
      workflowCount: 3,
      requirementCount: 5
    }
  ],
  versions: [
    {
      id: 'version-1',
      entityId: 'entity-1',
      version: '1.0',
      type: 'version',
      state: 'ACTIVE',
      workflowCount: 2,
      requirementCount: 3,
      createdAt: '2024-01-01T00:00:00Z',
      isActive: true
    }
  ],
  workflows: [
    {
      id: 'workflow-1',
      entityId: 'entity-1',
      versionId: 'version-1',
      name: 'Onboarding',
      type: 'workflow',
      stateCount: 5,
      transitionCount: 8,
      updatedAt: '2024-10-01T00:00:00Z'
    }
  ],
  requirements: [
    {
      id: 'req-1',
      entityId: 'entity-1',
      versionId: 'version-1',
      workflowId: 'workflow-1',
      title: 'Email validation',
      type: 'requirement',
      status: 'verified',
      priority: 'high'
    }
  ]
};
```

## Integration with Canvas

The Portal Canvas is integrated into the main Canvas component as a new tab:

1. **Portal Tab**: Interactive graph navigation
2. **Workflow Tab**: Workflow editor (existing)
3. **Markdown Tab**: Markdown editor (existing)

## Future Enhancements

### Phase 1: Data Integration
- [ ] Connect to real entity data from backend
- [ ] Fetch workflows from Cyoda API
- [ ] Load requirements from database

### Phase 2: Advanced Interactions
- [ ] Click entity → expand versions inline
- [ ] Click workflow → open in workflow tab
- [ ] Drag-and-drop to create relationships
- [ ] Context menu (right-click) for actions

### Phase 3: Filtering & Search
- [ ] Filter by entity type
- [ ] Filter by version status
- [ ] Search nodes by name
- [ ] Hide/show node types

### Phase 4: Advanced Layouts
- [ ] Implement force-directed layout with d3-force
- [ ] Custom layout configurations
- [ ] Save/load layout preferences
- [ ] Auto-layout on data changes

### Phase 5: Collaboration
- [ ] Real-time updates
- [ ] Multi-user cursors
- [ ] Comments on nodes
- [ ] Change history

## Technical Details

### Dependencies
- `@xyflow/react`: React Flow library for graph visualization
- `lucide-react`: Icons
- `tailwindcss`: Styling

### File Structure
```
PortalCanvas/
├── PortalCanvas.tsx          # Main component
├── types/
│   └── portal.ts              # TypeScript types
├── Nodes/
│   ├── EntityNode.tsx         # Entity node component
│   ├── VersionNode.tsx        # Version node component
│   ├── WorkflowNode.tsx       # Workflow node component
│   └── RequirementNode.tsx    # Requirement node component
├── utils/
│   └── layoutAlgorithms.ts    # Layout algorithms
├── sampleData.ts              # Sample data for demo
├── index.ts                   # Exports
└── README.md                  # This file
```

### Performance Considerations
- Nodes are memoized to prevent unnecessary re-renders
- Layout calculations are cached
- Large graphs (>100 nodes) may need virtualization
- Consider lazy loading for very large datasets

## Color Palette

- **Entity**: Blue (#2563eb)
- **Version (Active)**: Green (#16a34a)
- **Version (Draft)**: Orange (#ea580c)
- **Workflow**: Purple (#9333ea)
- **Requirement**: Gray (#6b7280) or status-based

## Accessibility

- All nodes are keyboard navigable
- ARIA labels for screen readers
- High contrast colors
- Focus indicators

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ⚠️ Limited (touch gestures work, but UI optimized for desktop)

