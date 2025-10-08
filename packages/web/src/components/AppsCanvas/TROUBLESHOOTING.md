# AppsCanvas JSON Editor Troubleshooting

## Issue: JSON Editor Doesn't Work

### Fixed Issues

1. ✅ **Positioning** - Changed from `relative z-10` to `absolute top-0 right-0 z-[1000]`
   - The editor now overlays the canvas correctly
   - High z-index ensures it's above other elements

### How to Test

1. **Open the AppsCanvas**
   - Navigate to the page with AppsCanvas
   - You should see the canvas with nodes

2. **Open JSON Editor**
   - Click the JSON icon button in the controls (bottom-left area)
   - OR the editor should be open by default (showJsonEditor defaults to true)

3. **Check if Editor Appears**
   - Should appear on the right side of the screen
   - Should have a dark gray background
   - Should show "App Configuration" header
   - Should have Import, Save, and Close buttons

### Common Issues and Solutions

#### Issue 1: Editor Not Visible

**Symptoms:**
- Click JSON button but nothing appears
- No editor on the right side

**Solutions:**
1. Check browser console for errors
2. Verify `currentAppData` is not null
3. Check if `showJsonEditor` state is true
4. Verify z-index is high enough (should be 1000)

**Debug Code:**
```typescript
// Add to AppsCanvas.tsx
console.log('showJsonEditor:', showJsonEditor);
console.log('currentAppData:', currentAppData);
```

#### Issue 2: Editor Appears But Can't Edit

**Symptoms:**
- Editor visible but Monaco editor not loading
- Blank white/dark area where editor should be

**Solutions:**
1. Check if Monaco Editor is installed: `@monaco-editor/react`
2. Verify import statement is correct
3. Check browser console for Monaco loading errors

**Debug Code:**
```typescript
// Add to AppsJsonEditor.tsx handleEditorDidMount
console.log('Monaco editor mounted:', editor, monaco);
```

#### Issue 3: Auto-Save Not Working

**Symptoms:**
- Changes don't save automatically
- No console logs about saving

**Solutions:**
1. Check if `handleChange` is being called
2. Verify timeout is being set
3. Check if validation is passing

**Debug Code:**
```typescript
// Add to handleChange in AppsJsonEditor.tsx
console.log('JSON changed, setting timeout...');
```

#### Issue 4: Resize Not Working

**Symptoms:**
- Can't drag left edge to resize
- Width doesn't change

**Solutions:**
1. Check if `handleResizeStart` is being called
2. Verify mouse events are attached
3. Check localStorage for saved width

**Debug Code:**
```typescript
// Add to handleResizeStart
console.log('Resize started:', e.clientX);
```

### Verification Checklist

- [ ] JSON editor button exists in controls
- [ ] Clicking button sets `showJsonEditor` to true
- [ ] `currentAppData` is not null/undefined
- [ ] Editor div renders with correct classes
- [ ] Editor is positioned absolutely
- [ ] Z-index is 1000 or higher
- [ ] Monaco Editor component renders
- [ ] JSON text is initialized from appData
- [ ] Resize handle is visible on hover
- [ ] Save button works
- [ ] Close button works
- [ ] Keyboard shortcuts work (Esc, Cmd/Ctrl+S)

### Expected Behavior

1. **On Mount:**
   - Editor should be visible on right side (if showJsonEditor is true)
   - Should show current app configuration as formatted JSON
   - Width should be 600px (or last saved width from localStorage)

2. **On Edit:**
   - Changes should be reflected immediately in Monaco
   - Validation should run on each change
   - Auto-save should trigger after 500ms of no changes
   - Error messages should appear if JSON is invalid

3. **On Resize:**
   - Dragging left edge should resize the panel
   - Width should be constrained between 300px and 80% viewport
   - New width should save to localStorage

4. **On Save:**
   - Manual save (button or Cmd/Ctrl+S) should validate and save
   - Should call `onSave` callback with parsed AppRoot
   - Should clear errors if successful

5. **On Close:**
   - Clicking X or pressing Esc should close editor
   - Should call `onClose` callback
   - Should set `showJsonEditor` to false

### Browser Console Commands

Test these in the browser console:

```javascript
// Check if editor is in DOM
document.querySelector('[class*="bg-gray-800"]');

// Check localStorage
localStorage.getItem('apps-json-editor-width');

// Check React state (if React DevTools installed)
// Select AppsCanvas component and check:
// - showJsonEditor
// - currentAppData
// - jsonEditorNavigateToNode
```

### File Locations

- **Main Component**: `packages/web/src/components/AppsCanvas/AppsCanvas.tsx`
- **JSON Editor**: `packages/web/src/components/AppsCanvas/AppsJsonEditor.tsx`
- **React Flow**: `packages/web/src/components/AppsCanvas/AppsReactFlow.tsx`

### Recent Changes

1. Added absolute positioning to JSON editor
2. Changed z-index from 10 to 1000
3. Added resizable panel functionality
4. Added auto-save with 500ms debounce
5. Added keyboard shortcuts (Esc, Cmd/Ctrl+S)
6. Added localStorage persistence for width

### Next Steps if Still Not Working

1. **Check Network Tab**
   - Verify Monaco Editor files are loading
   - Check for 404 errors

2. **Check React DevTools**
   - Verify component is rendering
   - Check props are being passed correctly
   - Verify state updates

3. **Add More Logging**
   - Add console.logs to every function
   - Track state changes
   - Monitor event handlers

4. **Simplify**
   - Comment out auto-save temporarily
   - Comment out resize functionality
   - Test with minimal features first

5. **Compare with WorkflowCanvas**
   - Check if WorkflowJsonEditor works
   - Compare implementation differences
   - Verify same patterns are used

### Contact Points

If issue persists, check:
1. Is `@monaco-editor/react` installed?
2. Is React Flow rendering correctly?
3. Are there any TypeScript errors?
4. Are there any console errors?
5. Is the parent container sized correctly?

