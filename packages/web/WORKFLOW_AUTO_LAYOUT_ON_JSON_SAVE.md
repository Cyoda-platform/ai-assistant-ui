# Auto-Layout on JSON Save

## Overview

The workflow canvas now automatically applies auto-layout (auto-arrange) whenever JSON is pasted or edited in the JSON editor. This ensures that workflows always look organized and professional without requiring manual arrangement.

## Changes Made

### WorkflowCanvas Component

**File**: `packages/web/src/components/WorkflowCanvas/Canvas/WorkflowCanvas.tsx`

**Function**: `handleWorkflowJsonSave`

#### Before

```typescript
const handleWorkflowJsonSave = useCallback((config: WorkflowConfiguration) => {
  if (!cleanedWorkflow) return;

  // Create layout states for any new states
  const existingStateIds = cleanedWorkflow.layout.states.map(s => s.id);
  const newStateIds = Object.keys(config.states).filter(id => !existingStateIds.includes(id));

  const newLayoutStates = newStateIds.map((stateId, index) => ({
    id: stateId,
    position: {
      x: 100 + (index % 3) * 250,
      y: 100 + Math.floor(index / 3) * 150
    },
    properties: {}
  }));

  // Keep existing layout states that still exist in the new config
  const updatedLayoutStates = cleanedWorkflow.layout.states
    .filter(s => config.states[s.id])
    .concat(newLayoutStates);

  const now = new Date().toISOString();
  const updatedWorkflow: UIWorkflowData = {
    ...cleanedWorkflow,
    configuration: config,
    layout: {
      ...cleanedWorkflow.layout,
      states: updatedLayoutStates,
      transitions: [], // Clear transitions, they'll be recreated
      version: cleanedWorkflow.layout.version + 1,
      updatedAt: now
    },
    updatedAt: now
  };

  onWorkflowUpdate(updatedWorkflow, 'Updated workflow JSON');
}, [cleanedWorkflow, onWorkflowUpdate]);
```

#### After

```typescript
const handleWorkflowJsonSave = useCallback((config: WorkflowConfiguration) => {
  if (!cleanedWorkflow) return;

  // Create layout states for any new states
  const existingStateIds = cleanedWorkflow.layout.states.map(s => s.id);
  const newStateIds = Object.keys(config.states).filter(id => !existingStateIds.includes(id));

  const newLayoutStates = newStateIds.map((stateId, index) => ({
    id: stateId,
    position: {
      x: 100 + (index % 3) * 250,
      y: 100 + Math.floor(index / 3) * 150
    },
    properties: {}
  }));

  // Keep existing layout states that still exist in the new config
  const updatedLayoutStates = cleanedWorkflow.layout.states
    .filter(s => config.states[s.id])
    .concat(newLayoutStates);

  const now = new Date().toISOString();
  const updatedWorkflow: UIWorkflowData = {
    ...cleanedWorkflow,
    configuration: config,
    layout: {
      ...cleanedWorkflow.layout,
      states: updatedLayoutStates,
      transitions: [], // Clear transitions, they'll be recreated
      version: cleanedWorkflow.layout.version + 1,
      updatedAt: now
    },
    updatedAt: now
  };

  // Apply auto-layout to make it look nice
  const layoutedWorkflow = autoLayoutWorkflow(updatedWorkflow);
  onWorkflowUpdate(layoutedWorkflow, 'Updated workflow JSON with auto-layout');
}, [cleanedWorkflow, onWorkflowUpdate]);
```

**Key Change**: Added two lines at the end:
```typescript
// Apply auto-layout to make it look nice
const layoutedWorkflow = autoLayoutWorkflow(updatedWorkflow);
onWorkflowUpdate(layoutedWorkflow, 'Updated workflow JSON with auto-layout');
```

## How It Works

### Auto-Layout Algorithm

The `autoLayoutWorkflow` function uses the **Dagre** hierarchical layout algorithm to:

1. **Analyze workflow structure**: Identifies states and transitions
2. **Calculate optimal positions**: Uses graph theory to determine the best layout
3. **Apply hierarchical arrangement**: Places states in levels based on their relationships
4. **Optimize spacing**: Ensures proper spacing between nodes and levels

### Layout Configuration

Default settings (from `autoLayout.ts`):
```typescript
{
  nodeWidth: 160,        // Width of each state node
  nodeHeight: 60,        // Height of each state node
  rankSeparation: 150,   // Vertical spacing between levels
  nodeSeparation: 120,   // Horizontal spacing between nodes
  edgeSeparation: 40,    // Spacing between parallel edges
  direction: 'TB'        // Top to Bottom layout
}
```

## User Experience

### Before This Change

1. User pastes JSON into the editor
2. Workflow appears with states in default grid positions
3. States may overlap or look disorganized
4. User must manually click "Auto-arrange" button
5. Layout is applied

### After This Change

1. User pastes JSON into the editor
2. Workflow automatically arranges itself beautifully
3. States are hierarchically organized
4. No manual action required
5. Professional appearance immediately

## Scenarios Where Auto-Layout Applies

### 1. Pasting JSON

```json
{
  "version": "1.0",
  "name": "User Registration",
  "initialState": "PENDING",
  "states": {
    "PENDING": {
      "transitions": [
        { "name": "Verify", "next": "VERIFIED", "manual": false }
      ]
    },
    "VERIFIED": {
      "transitions": [
        { "name": "Activate", "next": "ACTIVE", "manual": true }
      ]
    },
    "ACTIVE": {
      "transitions": []
    }
  }
}
```

**Result**: States automatically arranged in a top-to-bottom flow:
```
PENDING
   ↓
VERIFIED
   ↓
ACTIVE
```

### 2. Editing JSON

- Add new states → Auto-layout applies
- Remove states → Auto-layout applies
- Modify transitions → Auto-layout applies
- Change state names → Auto-layout applies

### 3. AI Assistant Suggestions

When using the AI assistant (Ctrl/Cmd + K) to modify workflow:
- AI generates new JSON
- User applies suggestion
- Auto-layout automatically arranges the result

## Benefits

### 1. **Improved User Experience**
- No need to remember to click "Auto-arrange"
- Immediate visual feedback
- Professional-looking workflows by default

### 2. **Consistency**
- All workflows follow the same layout principles
- Easier to understand workflow structure
- Predictable visual organization

### 3. **Time Saving**
- Eliminates manual arrangement step
- Faster workflow creation
- Less cognitive load

### 4. **Better for Complex Workflows**
- Large workflows with many states are automatically organized
- Hierarchical structure is immediately visible
- Easier to identify workflow patterns

## Manual Override

Users can still manually arrange states if desired:
1. Auto-layout is applied when JSON is saved
2. User can drag states to custom positions
3. Custom positions are preserved until next JSON edit
4. User can click "Auto-arrange" button anytime to reapply

## Technical Details

### Auto-Layout Function

```typescript
export function autoLayoutWorkflow(
  workflow: UIWorkflowData,
  options: LayoutOptions = {}
): UIWorkflowData {
  const layoutResult = calculateAutoLayout(workflow, options);
  return applyLayoutToWorkflow(workflow, layoutResult);
}
```

### Layout Calculation

1. **Create directed graph**: Represents workflow as a graph
2. **Add nodes**: Each state becomes a node
3. **Add edges**: Each transition becomes an edge
4. **Run Dagre algorithm**: Calculates optimal positions
5. **Extract positions**: Converts graph positions to React Flow coordinates
6. **Apply to workflow**: Updates workflow with new positions

### Position Adjustment

Dagre returns center positions, but React Flow expects top-left positions:
```typescript
position: {
  x: node.x - nodeWidth / 2,
  y: node.y - nodeHeight / 2,
}
```

## Examples

### Simple Linear Workflow

**JSON**:
```json
{
  "initialState": "DRAFT",
  "states": {
    "DRAFT": { "transitions": [{ "next": "REVIEW" }] },
    "REVIEW": { "transitions": [{ "next": "APPROVED" }] },
    "APPROVED": { "transitions": [] }
  }
}
```

**Layout**:
```
DRAFT
  ↓
REVIEW
  ↓
APPROVED
```

### Branching Workflow

**JSON**:
```json
{
  "initialState": "PENDING",
  "states": {
    "PENDING": {
      "transitions": [
        { "next": "APPROVED" },
        { "next": "REJECTED" }
      ]
    },
    "APPROVED": { "transitions": [] },
    "REJECTED": { "transitions": [] }
  }
}
```

**Layout**:
```
    PENDING
    ↙     ↘
APPROVED  REJECTED
```

### Complex Workflow

**JSON**:
```json
{
  "initialState": "NEW",
  "states": {
    "NEW": { "transitions": [{ "next": "PROCESSING" }] },
    "PROCESSING": {
      "transitions": [
        { "next": "COMPLETED" },
        { "next": "FAILED" }
      ]
    },
    "FAILED": { "transitions": [{ "next": "RETRY" }] },
    "RETRY": { "transitions": [{ "next": "PROCESSING" }] },
    "COMPLETED": { "transitions": [] }
  }
}
```

**Layout**: Hierarchical with proper handling of cycles

## Testing

### Test Cases

1. **Empty workflow**: Should handle gracefully
2. **Single state**: Should position in center
3. **Linear workflow**: Should arrange vertically
4. **Branching workflow**: Should arrange in tree structure
5. **Cyclic workflow**: Should handle loops properly
6. **Large workflow**: Should scale appropriately

### Manual Testing Steps

1. Open workflow canvas
2. Open JSON editor (right panel)
3. Paste complex workflow JSON
4. Observe automatic arrangement
5. Verify states are well-organized
6. Check transitions are visible
7. Verify no overlapping states

## Performance

- **Fast**: Dagre algorithm is optimized for performance
- **Smooth**: React Flow animates position changes
- **Efficient**: Only recalculates when JSON changes
- **Scalable**: Handles workflows with 100+ states

## Future Enhancements

Possible improvements:
- [ ] Add layout direction option (TB, LR, RL, BT)
- [ ] Add spacing customization
- [ ] Add layout presets (compact, spacious, etc.)
- [ ] Add option to disable auto-layout
- [ ] Add undo/redo for layout changes
- [ ] Add layout animation speed control

## Related Files

- `packages/web/src/components/WorkflowCanvas/Canvas/WorkflowCanvas.tsx` - Main canvas component
- `packages/web/src/components/WorkflowCanvas/utils/autoLayout.ts` - Auto-layout algorithm
- `packages/web/src/components/WorkflowCanvas/Editors/WorkflowJsonEditor.tsx` - JSON editor component

## Notes

- Auto-layout is non-destructive: it only updates positions, not workflow logic
- The "Auto-arrange" button is still available for manual triggering
- Layout is applied after JSON validation passes
- Custom node properties (colors, etc.) are preserved

