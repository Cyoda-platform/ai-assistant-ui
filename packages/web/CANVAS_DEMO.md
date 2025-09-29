# Canvas Demo

This project includes a full-featured Canvas demo that replicates the reference implementation from the Bolt project.

## Features

### Canvas Sidebar (Left Panel)
- **Resizable**: Drag the right edge to resize (300px - 800px)
- **Collapsible**: Minimize to a thin bar
- **Two Tabs**:
  - **Workflow Tab**: Interactive workflow canvas with ReactFlow
  - **Markdown Tab**: Markdown editor placeholder

### Main Content Area
- Project overview with status cards
- Recent notifications
- Chat input with keyboard shortcuts
- Quick action buttons

### Entity Data Sidebar (Right Panel)
- Entity information display
- Entity versions history
- Action buttons

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Focus chat input
- `Ctrl/Cmd + B`: Toggle Canvas sidebar
- `Ctrl/Cmd + D`: Toggle Entity Data sidebar
- `Esc`: Close notifications dropdown

## How to Access

Navigate to: `/canvas-demo`

Example: `http://localhost:5173/canvas-demo`

## Technology Stack

- **React 19**: Latest React version
- **@xyflow/react**: Modern workflow visualization (v12.8.5)
- **Lucide React**: Icon library
- **Tailwind CSS**: Styling
- **TypeScript**: Type safety

## Components Used

- `WorkflowCanvas`: Interactive workflow diagram component
- Located at: `src/components/WorkflowCanvas/WorkflowCanvas.tsx`

## Differences from Reference

The implementation uses `@xyflow/react` (v12.8.5) instead of `reactflow` (v11.11.4). This is the newer, renamed version of the same library with improved features and better TypeScript support.

## Customization

You can customize the canvas by modifying:
- `src/views/CanvasDemoView.tsx`: Main demo view
- `src/components/WorkflowCanvas/WorkflowCanvas.tsx`: Workflow canvas component

## Notes

- The canvas is fully responsive
- All interactions are smooth with proper transitions
- The workflow canvas supports:
  - Node dragging
  - Edge connections
  - Zoom and pan
  - Mini-map navigation
  - Background grid

