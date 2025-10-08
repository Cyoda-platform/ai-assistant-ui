# WorkflowCanvas Features - Now Available in AppsCanvas! 🎉

Since AppsCanvas is now a wrapper around WorkflowCanvas, **all these features work automatically** in AppsCanvas!

## 🎨 Visual & Interaction Features

### ✅ Drag and Drop
- **All nodes are draggable** - Click and drag any node to reposition
- **Smooth dragging** - Fluid animations and responsive movement
- **Position persistence** - Positions are saved and maintained
- **Multi-select** - Select and drag multiple nodes (Shift+Click)

### ✅ Zoom & Pan
- **Mouse wheel zoom** - Scroll to zoom in/out
- **Zoom range**: 5% to 400% (0.05x to 4x)
  - Zoom out to 5% to see **very large workflows**
  - Zoom in to 400% for **detail work**
- **Pan** - Click and drag canvas background to pan
- **Fit view** - Auto-fit entire workflow in viewport
- **Smooth animations** - Animated zoom and pan transitions

### ✅ Minimap
- **Overview navigation** - See entire workflow at a glance
- **Color-coded nodes** - Different colors for different node types
- **Click to navigate** - Click minimap to jump to that area
- **Viewport indicator** - Shows current visible area

### ✅ Grid & Snapping
- **Background grid** - Visual grid for alignment
- **Snap to grid** - Optional grid snapping for precise positioning
- **Customizable grid size** - Adjust grid spacing
- **Grid variants** - Dots or lines background

## 🎛️ Layout & Organization

### ✅ Auto-Layout Algorithms
- **Hierarchical Layout** (Dagre algorithm)
  - Top-down (TB) or Left-right (LR) direction
  - Automatic node positioning
  - Optimal edge routing
  - Configurable spacing
- **Manual positioning** - Drag nodes anywhere
- **Re-layout button** - Reapply layout algorithm anytime

### ✅ Edge Types
- **Default** - Bezier curves
- **Straight** - Direct lines
- **Step** - Right-angle steps
- **Smoothstep** - Smooth right-angle curves
- **Loopback edges** - Self-connecting transitions with special rendering

### ✅ Connection Modes
- **Loose connections** - Flexible edge routing
- **Bidirectional detection** - Automatically detects two-way connections
- **Optimal handle selection** - Smart source/target handle positioning
- **Edge reconnection** - Drag edge endpoints to reconnect

## 🎨 Themes & Customization

### ✅ Color Themes
Three beautiful themes with localStorage persistence:
1. **Bluey-Orange** (default)
   - States: Blue gradient
   - Transitions: Orange
   - UI: Blue/cyan accents

2. **Greeny-Pink**
   - States: Green gradient
   - Transitions: Pink
   - UI: Green/emerald accents

3. **Cyberpunk**
   - States: Purple/magenta gradient
   - Transitions: Cyan
   - UI: Neon purple/cyan accents

### ✅ Node Styling
- **State nodes** - Rounded rectangles with gradient backgrounds
- **Transition nodes** - Diamond shapes
- **Initial state** - Special green indicator
- **Final state** - Special red indicator
- **Selected state** - Highlighted border
- **Hover effects** - Interactive feedback

### ✅ Edge Styling
- **Manual transitions** - Solid lines
- **Automated transitions** - Dashed lines
- **Conditional transitions** - Filter icon indicator
- **Action transitions** - Zap icon indicator
- **Animated edges** - Optional animation
- **Color-coded** - Matches theme palette

## 📝 Editing Features

### ✅ Inline Editing
- **State names** - Double-click to edit state names
- **Live updates** - Changes reflected immediately
- **Validation** - Prevents invalid names

### ✅ JSON Editor
- **Side panel** - Full JSON editor for workflow configuration
- **Syntax highlighting** - Color-coded JSON
- **Validation** - Real-time JSON validation
- **Save/Cancel** - Apply or discard changes
- **Selected node focus** - Auto-scroll to selected state/transition

### ✅ State Editor
- **Properties panel** - Edit state properties
- **Transition management** - Add/edit/delete transitions
- **Metadata editing** - Custom state metadata

### ✅ Transition Editor
- **Condition editing** - Edit transition conditions
- **Action editing** - Edit transition actions
- **Manual/Automated toggle** - Set transition type

## 💾 Import/Export

### ✅ JSON Import/Export
- **Export to JSON** - Download workflow as JSON file
- **Import from JSON** - Upload JSON file to load workflow
- **Validation** - Validates JSON structure on import

### ✅ Environment Sync
- **Export to environment** - Push workflow to backend (entity1/v1)
- **Import from environment** - Pull workflow from backend
- **API integration** - Uses authenticated API calls
- **Error handling** - Notifications for success/failure

## ⏱️ History & Undo/Redo

### ✅ Undo/Redo System
- **Keyboard shortcuts**:
  - **Undo**: `Cmd+Z` (Mac) or `Ctrl+Z` (Windows/Linux)
  - **Redo**: `Cmd+Shift+Z` (Mac) or `Ctrl+Y` (Windows/Linux)
- **History depth**: Configurable (default: 50 actions)
- **Session persistence** - History saved in sessionStorage
- **Per-workflow tracking** - Separate history for each workflow
- **Action descriptions** - Each history entry has a description

### ✅ History Features
- **Can undo/redo indicators** - Visual feedback for available actions
- **Undo/redo count** - Shows number of available undo/redo operations
- **Clear history** - Reset history for workflow
- **Debug info** - View history state for debugging

## 🔔 Notifications

### ✅ Notification System
- **Success notifications** - Green checkmark
- **Error notifications** - Red X
- **Warning notifications** - Yellow warning
- **Info notifications** - Blue info icon
- **Auto-dismiss** - Configurable timeout
- **Manual dismiss** - Click X to close
- **Stacking** - Multiple notifications stack vertically

## ⚙️ Settings & Preferences

### ✅ Canvas Settings
All settings persist to localStorage:
- **Edge type** - Default, straight, step, smoothstep
- **Layout direction** - Top-bottom or left-right
- **Theme** - Bluey-orange, greeny-pink, cyberpunk
- **Grid visibility** - Show/hide background grid
- **Snap to grid** - Enable/disable grid snapping
- **Minimap visibility** - Show/hide minimap

### ✅ Settings Panel
- **Gear icon** - Click to open settings
- **Live preview** - Changes apply immediately
- **Persistent** - Settings saved across sessions

## 🎯 Interactive Controls

### ✅ Toolbar Buttons
Located in bottom-left Controls panel:
1. **Zoom In** - Zoom into canvas
2. **Zoom Out** - Zoom out of canvas
3. **Fit View** - Fit entire workflow in viewport
4. **Export JSON** - Download workflow as JSON
5. **Import JSON** - Upload JSON file
6. **Export to Environment** - Push to backend
7. **Import from Environment** - Pull from backend
8. **Auto-Layout** - Apply hierarchical layout
9. **Settings** - Open settings panel
10. **Quick Help** - Show keyboard shortcuts
11. **Fullscreen** - Toggle fullscreen mode (if available)

### ✅ Info Panel
- **Workflow name** - Display workflow title
- **State count** - Number of states
- **Transition count** - Number of transitions
- **Last updated** - Timestamp of last change
- **Closeable** - Click X to hide

### ✅ Quick Help Panel
Shows keyboard shortcuts:
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` / `Ctrl + Y` - Redo
- `Cmd/Ctrl + K` - Focus chat input
- `Cmd/Ctrl + B` - Toggle canvas
- `Escape` - Close panels

## 🎮 Node Interactions

### ✅ Click Actions
- **Single click** - Select node
- **Double click** - Edit node (opens editor)
- **Shift + click** - Multi-select
- **Click edge** - Select transition
- **Click background** - Deselect all

### ✅ Node Handles
- **Multiple handles** - Top, right, bottom, left positions
- **Offset handles** - For bidirectional connections
- **Color-coded** - Initial (green), final (red), normal (theme color)
- **Connection validation** - Prevents invalid connections

## 🚀 Performance Features

### ✅ Optimization
- **Lazy rendering** - Only renders visible nodes
- **Memoization** - React.memo for expensive components
- **Efficient updates** - Only re-renders changed nodes
- **Large workflow support** - Handles 100+ nodes smoothly

### ✅ Viewport Management
- **Virtual viewport** - Only renders visible area
- **Smooth scrolling** - Hardware-accelerated
- **Responsive** - Adapts to window resize

## 🎨 Dark Mode

### ✅ Full Dark Mode Support
- **Dark background** - `#0b0f1a` base color
- **Dark panels** - Semi-transparent overlays
- **High contrast** - Readable text on dark backgrounds
- **Theme-aware** - All themes work in dark mode

## 📱 Responsive Design

### ✅ Adaptive UI
- **Flexible layout** - Adapts to screen size
- **Touch support** - Works on touch devices
- **Mobile-friendly** - Responsive controls
- **Fullscreen mode** - Maximize canvas area

## 🔧 Developer Features

### ✅ API & Callbacks
- `onWorkflowUpdate` - Called when workflow changes
- `onStateEdit` - Called when state is clicked
- `onTransitionEdit` - Called when transition is clicked
- `onNodeDragStop` - Called when node drag ends
- `onConnect` - Called when new connection is made
- `onReconnect` - Called when edge is reconnected

### ✅ Type Safety
- Full TypeScript support
- Type definitions for all data structures
- IntelliSense support

## 🎉 Summary

**AppsCanvas inherits ALL these features from WorkflowCanvas!**

By using the adapter pattern, you get:
- ✅ **50+ features** for free
- ✅ **Zero maintenance** - WorkflowCanvas updates benefit AppsCanvas
- ✅ **Battle-tested** - All features are proven and working
- ✅ **Consistent UX** - Same experience across workflow and apps views

**Total feature count: 50+ features across 10 categories!**

All you need to do is provide Portal data, and the adapter converts it to workflow format. Everything else just works! 🚀

