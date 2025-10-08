# Portal Canvas Migration Status

## ✅ Phase 1: Complete Copy (DONE)

Successfully copied the entire WorkflowCanvas component to PortalCanvas without any modifications.

### What Was Done

1. **Full Component Copy**
   - Copied `packages/web/src/components/WorkflowCanvas/Canvas/WorkflowCanvas.tsx` → `packages/web/src/components/PortalCanvas/PortalCanvas.tsx`
   - All 2,514 lines copied intact
   - No modifications to logic or functionality

2. **Import Path Fixes**
   - Updated imports to point to WorkflowCanvas directory:
     - `../types/workflow` → `../WorkflowCanvas/types/workflow`
     - `./StateNode` → `../WorkflowCanvas/Canvas/StateNode`
     - `./TransitionNode` → `../WorkflowCanvas/Canvas/TransitionNode`
     - `./TransitionEdge` → `../WorkflowCanvas/Canvas/TransitionEdge`
     - `./LoopbackEdge` → `../WorkflowCanvas/Canvas/LoopbackEdge`
     - `../Editors/WorkflowJsonEditor` → `../WorkflowCanvas/Editors/WorkflowJsonEditor`
     - `../utils/transitionUtils` → `../WorkflowCanvas/utils/transitionUtils`
     - `../utils/autoLayout` → `../WorkflowCanvas/utils/autoLayout`
     - `../hooks/useTheme` → `../WorkflowCanvas/hooks/useTheme`
     - `../themes/colorPalettes` → `../WorkflowCanvas/themes/colorPalettes`

3. **Export Alias**
   - Added `export const PortalCanvas = WorkflowCanvas;` for backward compatibility
   - Both `WorkflowCanvas` and `PortalCanvas` exports available from this file

### Current Status

✅ **App compiles and runs successfully**
✅ **PortalCanvas component available**
✅ **All WorkflowCanvas features intact**
✅ **No breaking changes to existing code**

### File Structure

```
packages/web/src/components/
├── WorkflowCanvas/              # Original workflow canvas
│   ├── Canvas/
│   │   ├── WorkflowCanvas.tsx   # Original component
│   │   ├── StateNode.tsx
│   │   ├── TransitionNode.tsx
│   │   ├── TransitionEdge.tsx
│   │   └── LoopbackEdge.tsx
│   ├── Editors/
│   │   └── WorkflowJsonEditor.tsx
│   ├── utils/
│   │   ├── transitionUtils.ts
│   │   └── autoLayout.ts
│   ├── hooks/
│   │   └── useTheme.ts
│   ├── themes/
│   │   └── colorPalettes.ts
│   └── types/
│       └── workflow.ts
│
└── PortalCanvas/                # New portal canvas
    ├── PortalCanvas.tsx         # Full copy of WorkflowCanvas (2,514 lines)
    ├── Nodes/                   # Portal-specific nodes (not used yet)
    │   ├── EnvironmentNode.tsx
    │   ├── AppNode.tsx
    │   ├── RequirementNode.tsx
    │   ├── EntityNode.tsx
    │   ├── WorkflowNode.tsx
    │   └── CodeNode.tsx
    ├── types/
    │   └── portal.ts            # Portal data types (not used yet)
    └── utils/
        └── layoutAlgorithms.ts  # Portal layouts (not used yet)
```

## 📋 Next Steps: Gradual Migration

Now that we have a working copy, we can gradually adapt it to work with Portal data:

### Phase 2: Data Type Adaptation (TODO)

1. **Create Portal Data Adapter**
   - Create `PortalDataAdapter.ts` to convert Portal data → Workflow data format
   - This allows PortalCanvas to accept Portal data but internally use Workflow logic
   - No changes to core component needed

2. **Update Props Interface**
   - Add new `PortalCanvasProps` interface alongside `WorkflowCanvasProps`
   - Create wrapper component that converts Portal props → Workflow props
   - Keep original component unchanged

### Phase 3: Node Type Mapping (TODO)

1. **Map Portal Nodes to Workflow Nodes**
   - Environment → State node (green)
   - App → State node (teal)
   - Requirement → State node (orange)
   - Entity-Version → State node (blue)
   - Workflow → State node (purple)
   - Code → State node (green)

2. **Edge Mapping**
   - Environment → App: Transition edge
   - App → Requirement: Transition edge
   - Requirement → Entity: Transition edge
   - Entity → Workflow: Transition edge
   - Workflow → Code: Transition edge

### Phase 4: Feature Customization (TODO)

1. **Toolbar Customization**
   - Add Portal-specific buttons
   - Remove workflow-specific buttons (if any)
   - Add navigation handlers for tabs

2. **JSON Editor Adaptation**
   - Show Portal data structure instead of Workflow
   - Update validation for Portal schema
   - Add Portal-specific editing features

3. **Settings Panel**
   - Add Portal-specific settings
   - Add filter controls for node types
   - Add layout algorithm selector

### Phase 5: Testing & Refinement (TODO)

1. **Test all features**
   - Export/Import JSON
   - Drag & drop
   - Zoom/Pan
   - Layout algorithms
   - JSON editor
   - Settings persistence

2. **Performance optimization**
   - Test with large Portal datasets
   - Optimize rendering
   - Add virtualization if needed

## 🎯 Benefits of This Approach

1. **Zero Risk**: Original WorkflowCanvas untouched
2. **Full Features**: All WorkflowCanvas features available immediately
3. **Gradual Migration**: Can adapt piece by piece
4. **Easy Rollback**: Can revert to WorkflowCanvas anytime
5. **Parallel Development**: Both components can evolve independently

## 📝 Usage

Currently, PortalCanvas works exactly like WorkflowCanvas:

```tsx
import { PortalCanvas } from '@/components/PortalCanvas';

// Use it exactly like WorkflowCanvas
<PortalCanvas
  workflow={workflowData}
  onWorkflowUpdate={handleUpdate}
  onStateEdit={handleStateEdit}
  onTransitionEdit={handleTransitionEdit}
  darkMode={true}
/>
```

Once Phase 2 is complete, it will accept Portal data:

```tsx
import { PortalCanvas } from '@/components/PortalCanvas';

// Future usage with Portal data
<PortalCanvas
  data={portalData}
  onDataUpdate={handleUpdate}
  onNavigate={handleNavigate}
/>
```

## 🔧 Development Notes

- **No breaking changes**: Existing code continues to work
- **Type safety**: All TypeScript types preserved
- **Hot reload**: Works perfectly with Vite HMR
- **Import paths**: All imports correctly resolved
- **Build**: Compiles without errors

## 🚀 Ready for Next Phase

The foundation is solid. We can now proceed with Phase 2 (Data Type Adaptation) whenever you're ready!

