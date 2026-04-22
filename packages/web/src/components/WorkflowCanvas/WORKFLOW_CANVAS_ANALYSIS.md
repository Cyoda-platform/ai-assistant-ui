# WorkflowCanvas Component Analysis

## Overview

Analysis of the WorkflowCanvas component focusing on:
1. JSON Editor styles and code
2. Vertical and horizontal alignment logic
3. Tab switching functionality

---

## 1. JSON Editor Implementation

### Location
- **Component**: `packages/web/src/components/WorkflowCanvas/Editors/WorkflowJsonEditor.tsx`
- **Integration**: `packages/web/src/components/WorkflowCanvas/Canvas/WorkflowCanvas.tsx` (lines 2484-2496)

### Current Design

#### Layout Structure
```tsx
<div className="h-full w-full flex">
  {/* Canvas Area - flex-1 (takes remaining space) */}
  <div className="flex-1 h-full">
    <ReactFlow>...</ReactFlow>
  </div>

  {/* JSON Editor Side Panel - fixed width, resizable */}
  {cleanedWorkflow && showJsonEditor && (
    <WorkflowJsonEditor
      workflow={cleanedWorkflow.configuration}
      isOpen={showJsonEditor}
      onClose={() => setShowJsonEditor(false)}
      ...
    />
  )}
</div>
```

#### JSON Editor Styles

**Container** (lines 629-635):
```tsx
<div
  className="h-full bg-gray-800 shadow-2xl flex flex-col border-l-2 flex-shrink-0 relative z-10"
  style={{
    width: `${width}px`,  // Dynamic width (default: 600px)
    borderColor: palette.ui.panelBorder
  }}
>
```

**Key Style Properties**:
- `h-full` - Full height of parent container
- `flex flex-col` - Vertical flex layout (header, editor, footer stacked)
- `flex-shrink-0` - Prevents shrinking when space is limited
- `relative z-10` - Positioned above canvas elements
- `border-l-2` - Left border separating from canvas
- Dynamic `width` - Resizable from 300px to 80% of viewport

**Resize Handle** (lines 636-648):
```tsx
<div
  className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:w-1.5 transition-all z-20 group"
  onMouseDown={handleResizeStart}
  ...
>
```
- Positioned on left edge
- Drag to resize functionality
- Visual feedback on hover
- Constrained between 300px and 80% viewport width

**Header** (lines 649-730):
```tsx
<div
  className="flex items-center justify-between p-4 border-b-2 flex-shrink-0"
  style={{
    borderColor: palette.ui.panelBorder,
    background: `linear-gradient(to right, ${palette.ui.panelGradientVia}30, ${palette.ui.panelGradientTo}30)`
  }}
>
```
- Fixed height (flex-shrink-0)
- Gradient background matching theme
- Contains: Import button, title, AI Assistant button, Close button

**Editor Area** (lines 747-928):
```tsx
<div className="flex-1 p-4 overflow-hidden">
  <div className="h-full rounded-lg overflow-hidden border-2 ...">
    <Editor
      height="100%"
      defaultLanguage="json"
      ...
    />
  </div>
</div>
```
- `flex-1` - Takes all remaining vertical space
- Monaco Editor fills 100% of available height
- Rounded corners with themed border
- Overflow hidden for clean edges

**Footer** (lines 930-950):
```tsx
<div
  className="flex items-center justify-between p-3 border-t-2 flex-shrink-0"
  ...
>
```
- Fixed height (flex-shrink-0)
- Shows live editing status and keyboard shortcuts

### Sizing Behavior

**Default Width**: 600px
**Min Width**: 300px
**Max Width**: 80% of viewport width

**Resize Logic** (lines 524-563):
```typescript
const handleResizeStart = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  setIsResizing(true);
  resizeStartX.current = e.clientX;
  resizeStartWidth.current = width;
}, [width]);

// In mousemove handler:
const deltaX = resizeStartX.current - e.clientX; // Inverted for left edge
const newWidth = resizeStartWidth.current + deltaX;
const minWidth = 300;
const maxWidth = window.innerWidth * 0.8;
setWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
```

---

## 2. Vertical and Horizontal Alignment Logic

### Layout Direction Setting

**State Management** (lines 301-330):
```typescript
const [layoutDirection, setLayoutDirectionState] = useState<'TB' | 'LR'>(() => {
  try {
    const stored = localStorage.getItem('workflow-canvas-layout-direction');
    if (stored && ['TB', 'LR'].includes(stored)) {
      return stored as 'TB' | 'LR';
    }
  } catch (error) {
    console.warn('Failed to load layout direction from localStorage:', error);
  }
  return 'TB'; // Default: Top to Bottom
});
```

**Persistence**:
- Saved to localStorage: `workflow-canvas-layout-direction`
- Options: `'TB'` (Top to Bottom) or `'LR'` (Left to Right)
- Default: `'TB'`

### Auto-Layout Application

**Manual Trigger** (lines 1429-1441):
```typescript
const handleAutoLayout = useCallback(() => {
  if (!cleanedWorkflow || !canAutoLayout(cleanedWorkflow)) return;

  const layoutedWorkflow = autoLayoutWorkflow(cleanedWorkflow, { 
    direction: layoutDirection 
  });

  shouldFitViewRef.current = true; // Trigger fitView after layout

  onWorkflowUpdate(layoutedWorkflow, 'Applied auto-layout');
}, [cleanedWorkflow, onWorkflowUpdate, layoutDirection]);
```

**Automatic on Direction Change** (lines 1444-1456):
```typescript
React.useEffect(() => {
  // Only auto-apply if the direction actually changed (not on initial mount)
  if (previousLayoutDirectionRef.current !== layoutDirection && 
      cleanedWorkflow && 
      canAutoLayout(cleanedWorkflow)) {
    
    const layoutedWorkflow = autoLayoutWorkflow(cleanedWorkflow, { 
      direction: layoutDirection 
    });

    shouldFitViewRef.current = true;

    onWorkflowUpdate(layoutedWorkflow, 
      `Changed layout direction to ${layoutDirection === 'TB' ? 'Top to Bottom' : 'Left to Right'}`
    );
  }
  previousLayoutDirectionRef.current = layoutDirection;
}, [layoutDirection, cleanedWorkflow, onWorkflowUpdate]);
```

### Settings Panel UI (lines 2269-2287):
```tsx
<div className="space-y-2">
  <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">
    Auto-Layout Direction
  </label>
  <select
    value={layoutDirection}
    onChange={(e) => setLayoutDirection(e.target.value as any)}
    className="w-full px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-200 ..."
  >
    <option value="TB">Top to Bottom</option>
    <option value="LR">Left to Right</option>
  </select>
  <p className="text-xs text-gray-400">
    Direction for auto-layout algorithm
  </p>
</div>
```

### Handle Calculation Logic

**Optimal Anchor Points** (lines 656-703):
```typescript
const calculateOptimalAnchorPoints = useCallback((
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number }
): { sourceHandle: string; targetHandle: string } => {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Determine best anchor points based on angle
  let sourceHandle = 'bottom-center-source';
  let targetHandle = 'top-center-target';

  if (angle >= -22.5 && angle < 22.5) {
    // Right
    sourceHandle = 'right-center-source';
    targetHandle = 'left-center-target';
  } else if (angle >= 22.5 && angle < 67.5) {
    // Bottom-right
    sourceHandle = 'bottom-right-source';
    targetHandle = 'top-left-target';
  }
  // ... more angle ranges for all 8 directions
  
  return { sourceHandle, targetHandle };
}, []);
```

**8 Anchor Points Per Node**:
- `top-left`, `top-center`, `top-right`
- `left-center`, `right-center`
- `bottom-left`, `bottom-center`, `bottom-right`

Each has both `-source` and `-target` variants.

---

## 3. Tab Switching Functionality

### ⚠️ **NO TAB SWITCHING IN WORKFLOWCANVAS**

**Important Finding**: The WorkflowCanvas component **does not have tab switching functionality**.

**What Exists Instead**:
1. **Toggle Panels** - Show/hide different panels
2. **Single Workflow View** - One workflow at a time
3. **Fullscreen Mode** - Navigate to dedicated page

### Panel Toggle System

**State Variables** (lines 281-286):
```typescript
const [showQuickHelp, setShowQuickHelp] = useState(false);
const [showJsonEditor, setShowJsonEditor] = useState(true); // Open by default
const [showWorkflowInfo, setShowWorkflowInfo] = useState(true); // Show by default
const [showSettings, setShowSettings] = useState(false);
```

**Toggle Handlers** (lines 1458-1476):
```typescript
const handleToggleQuickHelp = useCallback(() => {
  setShowQuickHelp(prev => !prev);
}, []);

const handleToggleJsonEditor = useCallback(() => {
  setShowJsonEditor(prev => !prev);
}, []);

const handleToggleWorkflowInfo = useCallback(() => {
  setShowWorkflowInfo(prev => !prev);
}, []);

const handleToggleSettings = useCallback(() => {
  setShowSettings(prev => !prev);
}, []);
```

### Toolbar Buttons

**JSON Editor Toggle** (in toolbar):
```tsx
<ControlButton
  onClick={handleToggleJsonEditor}
  title="Toggle JSON Editor"
>
  <FileJson size={16} />
</ControlButton>
```

**Info Panel Toggle**:
```tsx
<ControlButton
  onClick={handleToggleWorkflowInfo}
  title="Toggle Workflow Info"
>
  <Info size={16} />
</ControlButton>
```

**Settings Toggle**:
```tsx
<ControlButton
  onClick={handleToggleSettings}
  title="Settings"
>
  <Settings size={16} />
</ControlButton>
```

### Fullscreen Navigation

**Not Tab Switching** - This is page navigation:
```typescript
const handleToggleFullscreen = useCallback(() => {
  if (isInFullscreenMode) {
    // Exit fullscreen - go to home page
    navigate('/?canvas=true');
  } else {
    // Enter fullscreen - navigate to workflows page
    navigate(`/workflows?model=${modelName}&version=${version}`);
  }
}, [modelName, modelVersion, navigate, isInFullscreenMode]);
```

---

## Summary

### JSON Editor
✅ **Well-implemented**:
- Resizable side panel (300px - 80% viewport)
- Clean vertical flex layout
- Monaco editor with full height
- Themed styling with gradients
- Smooth resize with visual feedback

### Vertical/Horizontal Alignment
✅ **Fully functional**:
- Persistent layout direction setting (TB/LR)
- Auto-applies on direction change
- Intelligent handle calculation based on node positions
- 8-point anchor system for flexible connections

### Tab Switching
❌ **Does not exist**:
- No tab system in WorkflowCanvas
- Uses toggle panels instead
- Single workflow view at a time
- Fullscreen mode is page navigation, not tabs

---

## Recommendations

If tab switching is desired, consider:
1. **Add tab bar** above canvas for multiple workflows
2. **State management** for multiple workflow instances
3. **Tab persistence** in localStorage
4. **Keyboard shortcuts** for tab navigation (Ctrl+Tab, Ctrl+1-9)
5. **Close tab** functionality with confirmation

This would require significant architectural changes to support multiple workflow instances simultaneously.

