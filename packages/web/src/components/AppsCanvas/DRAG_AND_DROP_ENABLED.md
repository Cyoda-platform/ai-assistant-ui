# 🎉 Drag and Drop is NOW ENABLED! 🎉

## Quick Start

The AppsCanvas component now has **full drag-and-drop functionality**!

### How to Test

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Navigate to the Apps tab** in your application

3. **Try dragging nodes**:
   - Click and hold any node
   - Drag it to a new position
   - Release to drop

4. **Try the controls**:
   - **Layout buttons** (top-right) - Switch between Hierarchical, Grid, and Circular layouts
   - **Re-layout button** (top-left) - Reapply the current layout algorithm
   - **Settings button** (top-left) - Toggle minimap, grid, snap-to-grid
   - **Zoom controls** (bottom-left) - Zoom in/out, fit view
   - **Minimap** (bottom-right) - Quick navigation

## What's Enabled

### ✅ Node Dragging
Every node type is draggable:
- Environment nodes (green)
- App nodes (teal)
- Requirement nodes (orange)
- Entity-Version nodes (blue)
- Workflow nodes (purple)
- Code nodes (green)

### ✅ Grid Snapping (Optional)
Enable in settings for precise alignment:
1. Click the Settings button (gear icon)
2. Toggle "Snap to Grid"
3. Nodes will snap to grid points when dragged

### ✅ Layout Algorithms
Three layout options:
- **Hierarchical** - Top-down tree (default)
- **Grid** - Simple grid arrangement
- **Circular** - Circular arrangement

### ✅ Zoom & Pan
- **Zoom**: Mouse wheel or zoom controls
- **Pan**: Click and drag the canvas background
- **Fit View**: Click the fit view button to see all nodes

## Technical Details

### React Flow Configuration

```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodesDraggable={true}        // ✅ Drag enabled globally
  nodesConnectable={false}     // Connections disabled
  elementsSelectable={true}    // Selection enabled
  snapToGrid={settings.snapToGrid}
  snapGrid={[settings.gridSize, settings.gridSize]}
>
```

### Node Configuration

Each node is created with `draggable: true`:

```typescript
{
  id: 'node-id',
  type: 'nodeType',
  position: { x: 100, y: 100 },
  data: { ...nodeData },
  draggable: true  // ✅ This enables dragging!
}
```

## Troubleshooting

### Nodes won't drag?

1. **Check if the app is running** - Make sure `npm run dev` is running
2. **Refresh the page** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check browser console** - Look for any errors
4. **Try a different browser** - Test in Chrome/Firefox/Edge

### Nodes snap back to original position?

This is expected if:
- Auto-layout is enabled in settings
- You clicked the re-layout button
- The layout algorithm was changed

To keep manual positions:
1. Open Settings (gear icon)
2. Disable "Auto Layout"
3. Now manual positions will persist

### Performance issues with many nodes?

The sample data has a reasonable number of nodes. If you're using custom data with hundreds of nodes:
1. Disable the minimap in settings
2. Use the Grid layout (faster than Hierarchical)
3. Consider filtering to show fewer node types

## Sample Data

The component uses sample data by default:
- 3 Environments (Production, Staging, Development)
- 5 Apps
- 6 Requirements
- 6 Entity Versions
- 6 Workflows
- 3 Code files

Total: **29 nodes** with **28 edges**

## Next Steps

### Use Your Own Data

Replace the sample data with your own:

```typescript
import { AppsCanvas } from '@/components/AppsCanvas';
import type { PortalData } from '@/components/AppsCanvas';

const myData: PortalData = {
  environments: [
    {
      id: 'env-1',
      name: 'Production',
      type: 'environment',
      environmentType: 'production',
      appCount: 5,
      status: 'active'
    }
  ],
  apps: [...],
  requirements: [...],
  entityVersions: [...],
  workflows: [...],
  code: [...]
};

<AppsCanvas data={myData} />
```

### Save Node Positions

To persist node positions, add an `onNodesChange` handler:

```typescript
const handleNodesChange = (changes) => {
  // Save positions to localStorage or backend
  const positions = nodes.reduce((acc, node) => {
    acc[node.id] = node.position;
    return acc;
  }, {});
  localStorage.setItem('node-positions', JSON.stringify(positions));
};
```

### Add Custom Actions

Handle node clicks and navigation:

```typescript
<AppsCanvas
  data={myData}
  onNavigate={(tab, targetId) => {
    // Navigate to specific tab/view
    if (tab === 'workflow') {
      router.push(`/workflows/${targetId}`);
    }
  }}
  onDataUpdate={(updatedData) => {
    // Save updated data
    saveToBackend(updatedData);
  }}
/>
```

## Success Criteria ✅

- [x] Nodes are draggable
- [x] Layout algorithms work
- [x] Zoom and pan work
- [x] Minimap shows all nodes
- [x] Settings persist to localStorage
- [x] Build succeeds with no errors
- [x] Component renders without errors

## Enjoy! 🎉

You now have a fully functional, interactive Apps Canvas with drag-and-drop support!

If you encounter any issues, check:
1. Browser console for errors
2. Network tab for failed requests
3. React DevTools for component state
4. This documentation for troubleshooting tips

