# Workflow Tabs Troubleshooting Guide

## Issue: "I don't see any tabs"

### What You Should See

When you navigate to `http://localhost:5173/workflows`, you should see:

1. **Tab Bar** (at the very top):
   - Dark gray background (#111827)
   - A tab with "Sample Workflow" label
   - Model info: "sample-workflow v1"
   - A "+" button on the right side
   - Minimum height of 48px

2. **Workflow Canvas** (below the tab bar):
   - Dark background with grid pattern
   - An "INITIAL" state node in the center
   - Toolbar on the left with buttons
   - JSON editor panel on the right (can be toggled)

### Troubleshooting Steps

#### Step 1: Check the URL
Make sure you're on the correct route:
```
http://localhost:5173/workflows
```

NOT:
- `/workflow` (singular)
- `/canvas-demo`
- `/chat/...`

#### Step 2: Check Browser Console
Open browser DevTools (F12) and check the Console tab for errors:

**Common Errors:**
- `Cannot find module '@/stores/workflowTabs'` - Store not imported correctly
- `useWorkflowTabsStore is not a function` - Import issue
- React errors - Component rendering issue

#### Step 3: Verify Files Exist
Check that these files were created:
```
packages/web/src/stores/workflowTabs.ts
packages/web/src/components/WorkflowTabs/WorkflowTabs.tsx
packages/web/src/components/WorkflowTabs/WorkflowTabsContainer.tsx
packages/web/src/components/WorkflowTabs/index.ts
packages/web/src/views/WorkflowTabsView.tsx
```

#### Step 4: Check Router Configuration
Verify the route is registered in `src/router/index.tsx`:
```typescript
{
  path: "workflows",
  element: <WorkflowTabsView />,
}
```

#### Step 5: Restart Dev Server
Sometimes the dev server needs a restart:
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

#### Step 6: Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or clear cache in DevTools: Network tab → Disable cache checkbox

#### Step 7: Check for TypeScript Errors
Run TypeScript check:
```bash
npm run type-check
# or
npx tsc --noEmit
```

## Issue: "Tab bar is visible but canvas is blank"

### Possible Causes

1. **Workflow not loading**: Check browser console for errors
2. **Canvas rendering issue**: WorkflowCanvas component error
3. **Empty workflow**: No states to display (should have INITIAL state now)

### Solutions

1. **Check the active tab**:
   - Is there a blue line at the top of the tab?
   - Click on the tab to ensure it's active

2. **Open browser console**:
   - Look for React errors
   - Look for workflow loading errors

3. **Check localStorage**:
   - Open DevTools → Application → Local Storage
   - Look for keys starting with `workflow_canvas_data_`
   - Clear if corrupted: `localStorage.clear()`

4. **Try creating a new tab**:
   - Click the "+" button
   - Enter: `test-workflow`, version `1`
   - Click "Open"

## Issue: "Can't click the + button"

### Possible Causes
- Button not rendering
- Z-index issue
- Event handler not attached

### Solutions

1. **Inspect the element**:
   - Right-click where the button should be
   - Select "Inspect"
   - Check if the button element exists

2. **Check for overlays**:
   - Look for elements covering the button
   - Check z-index values

3. **Try keyboard**:
   - Tab to focus the button
   - Press Enter

## Issue: "Modal doesn't open when clicking +"

### Solutions

1. **Check console for errors**
2. **Verify Modal component is imported**:
   ```typescript
   import { Modal } from 'antd';
   ```
3. **Check state**:
   - Add console.log in handleNewTab function
   - Verify setIsNewWorkflowModalOpen is called

## Issue: "Tab closes immediately after opening"

### Possible Causes
- Error in workflow loading
- Storage issue
- Component unmounting

### Solutions

1. **Check console for errors**
2. **Verify technicalId is unique**
3. **Check that openTab is working**:
   ```typescript
   console.log('Opening tab:', tabData);
   ```

## Issue: "Multiple tabs but can't switch between them"

### Solutions

1. **Check setActiveTab function**:
   - Verify it's being called
   - Check activeTabId state

2. **Verify tab click handler**:
   ```typescript
   const handleTabClick = (tabId: string) => {
     console.log('Switching to tab:', tabId);
     setActiveTab(tabId);
   };
   ```

3. **Check for event propagation issues**:
   - Ensure onClick is on the correct element
   - Check for stopPropagation calls

## Debugging Tips

### Enable Verbose Logging

Add console.logs to track state:

```typescript
// In WorkflowTabsContainer
console.log('Tabs:', tabs);
console.log('Active Tab ID:', activeTabId);
console.log('Active Tab:', activeTab);
```

### Check Zustand Store

```typescript
// In browser console
// Access the store directly (if exposed)
window.__ZUSTAND_STORE__ = useWorkflowTabsStore.getState();
console.log(window.__ZUSTAND_STORE__);
```

### React DevTools

1. Install React DevTools extension
2. Open DevTools → Components tab
3. Find WorkflowTabsContainer
4. Inspect props and state
5. Check hooks values

### Network Tab

Check if any resources are failing to load:
1. Open DevTools → Network tab
2. Refresh page
3. Look for red (failed) requests
4. Check 404 errors

## Common Solutions Summary

| Problem | Quick Fix |
|---------|-----------|
| No tabs visible | Restart dev server, hard refresh |
| Blank canvas | Check console, clear localStorage |
| Can't open new tab | Check Modal import, verify button click |
| Tabs not switching | Check setActiveTab, verify click handler |
| TypeScript errors | Run `npm install`, check imports |

## Still Having Issues?

### Collect Debug Information

1. **Browser**: Chrome/Firefox/Safari version
2. **Console errors**: Copy full error messages
3. **Network errors**: Check Network tab
4. **React errors**: Check React DevTools
5. **Store state**: Log Zustand store state

### Manual Test

Try this in browser console:
```javascript
// Test if store is accessible
const store = window.__ZUSTAND_STORE__ || {};
console.log('Store tabs:', store.tabs);
console.log('Active tab:', store.activeTabId);

// Test opening a tab manually
if (window.openTestTab) {
  window.openTestTab();
}
```

### Verify Installation

```bash
# Check if all dependencies are installed
npm list zustand
npm list lucide-react
npm list antd

# Reinstall if needed
npm install
```

## Contact & Support

If you're still experiencing issues:
1. Check the implementation files
2. Review WORKFLOW_TABS_FEATURE.md
3. Check WORKFLOW_TABS_QUICKSTART.md
4. Look for similar issues in the codebase

---

**Most Common Issue**: Not navigating to the correct URL (`/workflows`)
**Second Most Common**: Dev server needs restart after adding new files

