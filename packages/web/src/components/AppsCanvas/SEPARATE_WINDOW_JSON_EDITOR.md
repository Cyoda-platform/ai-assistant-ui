# Separate Window JSON Editor Implementation

## Summary

Successfully implemented separate window (modal) JSON editors for all non-group nodes in AppsCanvas. Each node now has a Code icon button in its header that opens a professional Monaco-based JSON editor in a modal overlay.

## Key Features

### 1. Modal Window Design
- **Full-screen overlay** with semi-transparent backdrop
- **Centered modal** (800px × 600px)
- **Backdrop blur** effect for better focus
- **Click outside to close** functionality
- **High z-index** (9999) to appear above all canvas elements

### 2. Monaco Editor Integration
- **Professional code editor** with syntax highlighting
- **Auto-formatting** on paste and type
- **Line numbers** for easy navigation
- **Minimap** for large JSON files
- **Dark theme** matching the canvas aesthetic
- **JSON validation** with error messages

### 3. User Interface
- **Code icon button** in each node's header (top-right)
- **Hover effects** on the button
- **Stop propagation** to prevent node selection when clicking button
- **Save Changes** and **Cancel** buttons
- **Error display** at the bottom of the modal
- **Dynamic title** showing node type and name

## Implementation Details

### Component Structure

```
Node Component (e.g., EntityNode)
├── State: isEditorOpen (boolean)
├── Header with Code icon button
│   └── onClick: handleOpenEditor
├── Node content (unchanged)
└── NodeJsonEditor Modal
    ├── Props: data, onSave, title, isOpen, onClose
    ├── Monaco Editor
    ├── Error display
    └── Action buttons
```

### Files Modified

1. **NodeJsonEditor.tsx** (Complete rewrite)
   - Changed from inline to modal design
   - Integrated Monaco Editor
   - Added backdrop overlay
   - Added isOpen/onClose props

2. **AppNode.tsx**
   - Added useState for isEditorOpen
   - Added Code icon button in header
   - Added handleOpenEditor function
   - Wrapped in fragment for modal

3. **EntityNode.tsx**
   - Same changes as AppNode
   - Code icon in header next to entity name

4. **WorkflowNode.tsx**
   - Same changes as AppNode
   - Code icon in header next to workflow name

5. **EnvironmentNode.tsx**
   - Same changes as AppNode
   - Code icon in header next to status indicator

### Code Example

```typescript
// Node component structure
export const EntityNode: React.FC<EntityNodeProps> = ({ data }) => {
  const { metadata, onUpdate } = data;
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleJsonSave = (updatedData: any) => {
    if (onUpdate) {
      onUpdate(updatedData);
    }
  };

  const handleOpenEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditorOpen(true);
  };

  return (
    <>
      <div className="...node-container...">
        {/* Header with Code button */}
        <div className="...header...">
          <div>Node Title</div>
          <button onClick={handleOpenEditor}>
            <Code size={16} />
          </button>
        </div>
        {/* Node content */}
      </div>

      {/* Modal Editor */}
      <NodeJsonEditor
        data={metadata}
        onSave={handleJsonSave}
        title={`Edit Entity: ${metadata.name}`}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
    </>
  );
};
```

## User Experience

### Opening the Editor
1. User hovers over a node
2. Sees Code icon button in header
3. Clicks the button
4. Modal appears with backdrop blur
5. Focus is on the editor

### Editing
1. User sees formatted JSON with syntax highlighting
2. Can scroll through large JSON files using minimap
3. Can edit any field
4. Auto-formatting helps maintain structure
5. Line numbers help with navigation

### Saving
1. User clicks "Save Changes"
2. JSON is validated
3. If valid:
   - Data is updated
   - Modal closes
   - Canvas re-renders with new data
4. If invalid:
   - Error message appears at bottom
   - Modal stays open
   - User can fix errors

### Canceling
1. User can:
   - Click "Cancel" button
   - Click "X" button
   - Click outside the modal
2. Modal closes without saving
3. Changes are discarded

## Visual Design

### Modal Appearance
```
┌─────────────────────────────────────────────────────────────┐
│ [Backdrop: blur + semi-transparent black]                   │
│                                                              │
│   ┌───────────────────────────────────────────────────┐    │
│   │ 📝 Edit Entity: Dog                            [X]│    │
│   ├───────────────────────────────────────────────────┤    │
│   │                                                    │    │
│   │  {                                                 │    │
│   │    "name": "Dog",                                  │    │
│   │    "version": "1",                                 │    │
│   │    "description": "Dog entity",                    │    │
│   │    "model": {                                      │    │
│   │      "name": "Buddy",                              │    │
│   │      "age": 3,                                     │    │
│   │      "breed": "Golden Retriever"                   │    │
│   │    }                                               │    │
│   │  }                                                 │    │
│   │                                                    │    │
│   ├───────────────────────────────────────────────────┤    │
│   │                          [Cancel] [💾 Save Changes]│    │
│   └───────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Node Header with Code Button
```
┌─────────────────────────────────────────┐
│ 📦 Dog v1                          </> │  ← Code icon button
├─────────────────────────────────────────┤
│ Description: Dog entity                 │
│ ...                                     │
└─────────────────────────────────────────┘
```

## Benefits Over Inline Editor

1. **More Space**: 800×600 modal vs small inline panel
2. **Better Editor**: Monaco vs simple textarea
3. **Less Clutter**: Modal doesn't affect node layout
4. **Professional Feel**: IDE-like editing experience
5. **Better Focus**: Backdrop blur reduces distractions
6. **Easier to Use**: Larger target area, better visibility
7. **Consistent Pattern**: Familiar modal interaction pattern

## Technical Advantages

1. **No Layout Issues**: Modal doesn't affect React Flow layout
2. **No Z-Index Conflicts**: High z-index ensures visibility
3. **Better Performance**: Editor only rendered when open
4. **Cleaner Code**: Separation of concerns (node vs editor)
5. **Reusable**: Same modal component for all node types
6. **Maintainable**: Easier to update editor without touching nodes

## Testing Checklist

- [x] Code icon appears in all non-group nodes
- [x] Clicking icon opens modal
- [x] Modal shows correct node data
- [x] Monaco editor loads properly
- [x] Syntax highlighting works
- [x] Can edit JSON
- [x] Save validates JSON
- [x] Invalid JSON shows error
- [x] Valid JSON updates node
- [x] Cancel discards changes
- [x] Click outside closes modal
- [x] X button closes modal
- [x] Multiple nodes can have editors (one at a time)
- [x] Modal appears above all canvas elements
- [x] Backdrop blur works
- [x] Dark theme matches canvas

## Known Limitations

1. **One Modal at a Time**: Only one editor can be open at a time (by design)
2. **No Keyboard Shortcuts**: Ctrl+S and Esc not yet implemented
3. **No Resize**: Modal has fixed size (could be enhanced)
4. **No Drag**: Modal is centered and not draggable (could be enhanced)

## Future Enhancements

See NODE_JSON_EDITOR_FEATURE.md for detailed list of potential improvements.

## Conclusion

The separate window JSON editor provides a professional, user-friendly way to edit node data directly from the canvas. The Monaco Editor integration ensures a high-quality editing experience, while the modal design keeps the canvas clean and focused.

