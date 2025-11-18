# WorkflowCanvas Layout Structure

## Visual Layout Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WorkflowCanvas Container                            │
│                    (h-full w-full flex, bg: #0b0f1a)                        │
├─────────────────────────────────────────────┬───────────────────────────────┤
│                                             │                               │
│         Canvas Area (flex-1)                │   JSON Editor (fixed width)   │
│         (h-full, bg: #0b0f1a)               │   (600px default, resizable)  │
│                                             │                               │
│  ┌───────────────────────────────────────┐  │  ┌─────────────────────────┐ │
│  │                                       │  │  │ ┌─────────────────────┐ │ │
│  │         ReactFlow Canvas              │  │  │ │  Resize Handle      │ │ │
│  │                                       │  │  │ │  (left edge, 1px)   │ │ │
│  │  ┌─────────────────────────────────┐  │  │  │ └─────────────────────┘ │ │
│  │  │  Top-Left Panels (absolute)     │  │  │  │                         │ │
│  │  │  ┌──────────────────────────┐   │  │  │  │  ┌───────────────────┐ │ │
│  │  │  │ Workflow Info Panel      │   │  │  │  │  │ Header            │ │ │
│  │  │  │ (if showWorkflowInfo)    │   │  │  │  │  │ - Import button   │ │ │
│  │  │  └──────────────────────────┘   │  │  │  │  │ - Title           │ │ │
│  │  │                                  │  │  │  │  │ - AI button       │ │ │
│  │  │  ┌──────────────────────────┐   │  │  │  │  │ - Close button    │ │ │
│  │  │  │ Settings Panel           │   │  │  │  │  │ (flex-shrink-0)   │ │ │
│  │  │  │ (if showSettings)        │   │  │  │  │  └───────────────────┘ │ │
│  │  │  │ - Edge Type              │   │  │  │  │                         │ │
│  │  │  │ - Layout Direction       │   │  │  │  │  ┌───────────────────┐ │ │
│  │  │  │ - Color Theme            │   │  │  │  │  │ Error Message     │ │ │
│  │  │  │ - Workflow Stats         │   │  │  │  │  │ (if error)        │ │ │
│  │  │  └──────────────────────────┘   │  │  │  │  │ (flex-shrink-0)   │ │ │
│  │  │                                  │  │  │  │  └───────────────────┘ │ │
│  │  │  ┌──────────────────────────┐   │  │  │  │                         │ │
│  │  │  │ Quick Help Panel         │   │  │  │  │  ┌───────────────────┐ │ │
│  │  │  │ (if showQuickHelp)       │   │  │  │  │  │                   │ │ │
│  │  │  │ - Canvas Interactions    │   │  │  │  │  │  Monaco Editor    │ │ │
│  │  │  │ - Toolbar Buttons        │   │  │  │  │  │                   │ │ │
│  │  │  │ - Keyboard Shortcuts     │   │  │  │  │  │  (flex-1)         │ │ │
│  │  │  │ - Tips                   │   │  │  │  │  │  height: 100%     │ │ │
│  │  │  └──────────────────────────┘   │  │  │  │  │                   │ │ │
│  │  └─────────────────────────────────┘  │  │  │  │  - Syntax         │ │ │
│  │                                       │  │  │  │    highlighting   │ │ │
│  │  ┌─────────────────────────────────┐  │  │  │  │  - Line numbers   │ │ │
│  │  │  State Nodes                    │  │  │  │  │  - Minimap        │ │ │
│  │  │  - Initial state (green)        │  │  │  │  │  - Auto-complete  │ │ │
│  │  │  - Normal states (blue)         │  │  │  │  │  - Validation     │ │ │
│  │  │  - Final states (purple)        │  │  │  │  │                   │ │ │
│  │  │  - 8 anchor points each         │  │  │  │  │                   │ │ │
│  │  └─────────────────────────────────┘  │  │  │  └───────────────────┘ │ │
│  │                                       │  │  │                         │ │
│  │  ┌─────────────────────────────────┐  │  │  │  ┌───────────────────┐ │ │
│  │  │  Transition Nodes                │  │  │  │  │ Footer            │ │ │
│  │  │  - Manual (dashed, orange)      │  │  │  │  │ - Live status     │ │ │
│  │  │  - Automated (solid, blue)      │  │  │  │  │ - Keyboard hints  │ │ │
│  │  │  - Positioned between states    │  │  │  │  │ (flex-shrink-0)   │ │ │
│  │  └─────────────────────────────────┘  │  │  │  └───────────────────┘ │ │
│  │                                       │  │  │                         │ │
│  │  ┌─────────────────────────────────┐  │  │  └─────────────────────────┘ │
│  │  │  Bottom Controls (absolute)     │  │  │                               │
│  │  │  ┌──────────────────────────┐   │  │  │  (if showJsonEditor)          │
│  │  │  │ React Flow Controls      │   │  │  │                               │
│  │  │  │ - Zoom in/out            │   │  │  │                               │
│  │  │  │ - Fit view               │   │  │  │                               │
│  │  │  │ - Lock/unlock            │   │  │  │                               │
│  │  │  └──────────────────────────┘   │  │  │                               │
│  │  │                                  │  │  │                               │
│  │  │  ┌──────────────────────────┐   │  │  │                               │
│  │  │  │ MiniMap                  │   │  │  │                               │
│  │  │  │ - Overview of workflow   │   │  │  │                               │
│  │  │  └──────────────────────────┘   │  │  │                               │
│  │  │                                  │  │  │                               │
│  │  │  ┌──────────────────────────┐   │  │  │                               │
│  │  │  │ Custom Toolbar           │   │  │  │                               │
│  │  │  │ - Info toggle            │   │  │  │                               │
│  │  │  │ - JSON editor toggle     │   │  │  │                               │
│  │  │  │ - Download/Upload        │   │  │  │                               │
│  │  │  │ - Cloud export/import    │   │  │  │                               │
│  │  │  │ - Auto-layout            │   │  │  │                               │
│  │  │  │ - Settings               │   │  │  │                               │
│  │  │  │ - Help                   │   │  │  │                               │
│  │  │  │ - Fullscreen             │   │  │  │                               │
│  │  │  └──────────────────────────┘   │  │  │                               │
│  │  └─────────────────────────────────┘  │  │                               │
│  │                                       │  │                               │
│  └───────────────────────────────────────┘  │                               │
│                                             │                               │
└─────────────────────────────────────────────┴───────────────────────────────┘
```

## Component Hierarchy

```
WorkflowCanvas (outer wrapper with ReactFlowProvider)
└── WorkflowCanvasInner
    ├── div.h-full.w-full.flex (main container)
    │   ├── div.flex-1.h-full (canvas area)
    │   │   └── ReactFlow
    │   │       ├── Background (dots pattern)
    │   │       ├── Controls (zoom, fit view, lock)
    │   │       ├── MiniMap
    │   │       ├── Panel (position="top-left")
    │   │       │   └── Custom Toolbar (buttons)
    │   │       ├── Panel (position="top-left", if showWorkflowInfo)
    │   │       │   └── Workflow Info Panel
    │   │       ├── Panel (position="top-right", if showSettings)
    │   │       │   └── Settings Panel
    │   │       └── Panel (position="top-right", if showQuickHelp)
    │   │           └── Quick Help Panel
    │   │
    │   └── WorkflowJsonEditor (if showJsonEditor)
    │       ├── Resize Handle (left edge)
    │       ├── Header (flex-shrink-0)
    │       │   ├── Import button
    │       │   ├── Title
    │       │   ├── AI Assistant button
    │       │   └── Close button
    │       ├── Error Message (if error, flex-shrink-0)
    │       ├── Monaco Editor (flex-1)
    │       └── Footer (flex-shrink-0)
    │
    └── NotificationManager (absolute positioned)
```

## Flex Layout Breakdown

### Main Container
```css
.h-full.w-full.flex {
  display: flex;
  flex-direction: row; /* default */
  height: 100%;
  width: 100%;
}
```

### Canvas Area
```css
.flex-1.h-full {
  flex: 1 1 0%; /* grow, shrink, basis 0 */
  height: 100%;
  /* Takes all remaining space after JSON editor */
}
```

### JSON Editor
```css
.h-full.flex.flex-col.flex-shrink-0 {
  display: flex;
  flex-direction: column;
  flex-shrink: 0; /* Don't shrink */
  height: 100%;
  width: 600px; /* or dynamic width */
}
```

### JSON Editor Internal Layout
```css
/* Header */
.flex-shrink-0 {
  flex-shrink: 0; /* Fixed height */
}

/* Monaco Editor Container */
.flex-1 {
  flex: 1 1 0%; /* Takes all remaining vertical space */
}

/* Footer */
.flex-shrink-0 {
  flex-shrink: 0; /* Fixed height */
}
```

## Responsive Behavior

### JSON Editor Width
- **Default**: 600px
- **Minimum**: 300px
- **Maximum**: 80% of viewport width
- **Resize**: Drag left edge handle

### Canvas Area
- **Width**: Automatically fills remaining space
- **Calculation**: `100vw - JSON_EDITOR_WIDTH`
- **Minimum**: 20% of viewport (when editor is at max 80%)

### Breakpoints
No explicit breakpoints, but:
- At viewport < 375px: Editor hits minimum width (300px)
- At viewport > 750px: Editor can expand to max (80% = 600px+)

## Z-Index Layers

```
Layer 10: JSON Editor (z-10)
Layer 20: Resize Handle (z-20)
Layer 1: ReactFlow Canvas (default)
Layer 2: React Flow Controls (default)
Layer 3: React Flow Panels (default)
Layer 9999: Notification Manager (absolute)
Layer 9999: AI Assistant Modal (when open)
```

## Positioning Strategy

### Canvas Elements
- **ReactFlow**: Relative positioning (default)
- **Panels**: Absolute positioning within ReactFlow
  - `position="top-left"` - Toolbar, Workflow Info
  - `position="top-right"` - Settings, Quick Help
  - `position="bottom-left"` - Controls
  - `position="bottom-right"` - MiniMap

### JSON Editor
- **Position**: Static (in flex container)
- **Resize Handle**: Absolute (within editor container)
- **Scroll**: Overflow hidden on container, scroll in Monaco

## Alignment Logic

### Horizontal Alignment (Layout Direction: LR)
```
State A → Transition → State B
  (x: 100)  (x: 250)    (x: 400)
```
- States arranged left to right
- Transitions positioned between states
- Handles: `right-center-source` → `left-center-target`

### Vertical Alignment (Layout Direction: TB)
```
State A
   ↓
Transition
   ↓
State B
```
- States arranged top to bottom
- Transitions positioned between states
- Handles: `bottom-center-source` → `top-center-target`

### Auto-Layout Algorithm
Uses Dagre library with:
- **Direction**: TB or LR
- **Node Separation**: 150px
- **Rank Separation**: 200px
- **Alignment**: Center

## Summary

**Layout Type**: Horizontal split (flex row)
- Left: Canvas (flex-1, grows)
- Right: JSON Editor (fixed width, resizable)

**JSON Editor**: Vertical stack (flex column)
- Top: Header (fixed)
- Middle: Monaco Editor (flex-1, grows)
- Bottom: Footer (fixed)

**No Tab System**: Single workflow view with toggle panels

**Alignment**: Configurable TB/LR with auto-layout support

