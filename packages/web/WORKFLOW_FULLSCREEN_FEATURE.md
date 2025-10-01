# Workflow Fullscreen Feature

## Overview

Added a fullscreen button to the workflow canvas that redirects to a dedicated fullscreen workflow page (`/workflows`). This allows users to work on workflows in a distraction-free, full-screen environment.

## Changes Made

### 1. WorkflowCanvas Component

**File**: `packages/web/src/components/WorkflowCanvas/Canvas/WorkflowCanvas.tsx`

#### Added Imports

```typescript
import { Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
```

#### Added Fullscreen Button

Added a new control button in the canvas controls:

```typescript
<ControlButton
  onClick={handleOpenFullscreen}
  title="Open in fullscreen (dedicated page)"
  className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30"
  data-testid="fullscreen-button"
>
  <Maximize2 size={16} className="text-purple-600 dark:text-purple-400" />
</ControlButton>
```

**Button Styling**:
- Purple/indigo gradient background
- Maximize2 icon (expand arrows)
- Positioned at the bottom of the control panel
- Tooltip: "Open in fullscreen (dedicated page)"

#### Added Handler Function

```typescript
const navigate = useNavigate();
const handleOpenFullscreen = useCallback(() => {
  if (!modelName || !modelVersion) {
    showWarning(
      'Cannot Open Fullscreen',
      'Model name and version are required to open in fullscreen mode'
    );
    return;
  }

  // Navigate to workflows page with query parameters
  navigate(`/workflows?model=${encodeURIComponent(modelName)}&version=${encodeURIComponent(modelVersion)}`);
}, [modelName, modelVersion, navigate, showWarning]);
```

**Handler Logic**:
1. Validates that `modelName` and `modelVersion` are available
2. Shows warning if validation fails
3. Navigates to `/workflows` with query parameters:
   - `model`: Entity model name
   - `version`: Model version
4. URL encodes parameters for safety

### 2. WorkflowTabsView Component

**File**: `packages/web/src/views/WorkflowTabsView.tsx`

#### Added Imports

```typescript
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkflowTabsStore } from '@/stores/workflowTabs';
```

#### Added Auto-Open Logic

```typescript
const [searchParams] = useSearchParams();
const { openTab, tabs } = useWorkflowTabsStore();

// Auto-open workflow from query parameters
useEffect(() => {
  const modelName = searchParams.get('model');
  const modelVersion = searchParams.get('version');
  const displayName = searchParams.get('name');

  if (modelName && modelVersion) {
    // Check if this workflow is already open
    const existingTab = tabs.find(
      tab => tab.modelName === modelName && tab.modelVersion === modelVersion
    );

    // Only open if not already open
    if (!existingTab) {
      openTab(modelName, modelVersion, displayName || undefined);
    }
  }
}, [searchParams, openTab, tabs]);
```

**Auto-Open Logic**:
1. Reads query parameters from URL
2. Extracts `model`, `version`, and optional `name`
3. Checks if workflow is already open in a tab
4. Opens new tab only if not already open
5. Prevents duplicate tabs for the same workflow

## User Experience

### From Canvas Panel

1. User opens workflow in canvas panel (sidebar)
2. User clicks the **purple fullscreen button** (Maximize2 icon)
3. Browser navigates to `/workflows?model=xxx&version=yyy`
4. Workflow automatically opens in a new tab on the fullscreen page
5. User works in distraction-free fullscreen environment

### URL Structure

**Example URLs**:
```
/workflows?model=user-registration&version=1
/workflows?model=order-process&version=2&name=Order%20Processing
```

**Query Parameters**:
- `model` (required): Entity model name
- `version` (required): Model version
- `name` (optional): Display name for the tab

### Visual Flow

```
┌─────────────────────────────────────┐
│  Chat View with Canvas Panel        │
│  ┌───────────────────────────────┐  │
│  │  Workflow Canvas              │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  Controls:              │  │  │
│  │  │  [Info] [JSON] [↓] [↑] │  │  │
│  │  │  [☁↑] [☁↓] [⚡] [?]    │  │  │
│  │  │  [⤢] ← Fullscreen btn   │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
                 ↓ Click [⤢]
┌─────────────────────────────────────┐
│  /workflows?model=xxx&version=yyy   │
│  ┌───────────────────────────────┐  │
│  │ [Sample Workflow] [+]         │  │ ← Tabs
│  ├───────────────────────────────┤  │
│  │                               │  │
│  │   Fullscreen Workflow Canvas  │  │
│  │   (Entire viewport)           │  │
│  │                               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Button Location

The fullscreen button is located in the **Controls panel** on the left side of the canvas:

```
Controls Panel (Left Side):
┌────┐
│ ℹ️  │ ← Info
├────┤
│ {} │ ← JSON Editor
├────┤
│ ↓  │ ← Export File
├────┤
│ ↑  │ ← Import File
├────┤
│ ☁↑ │ ← Export to Environment
├────┤
│ ☁↓ │ ← Import from Environment
├────┤
│ ⚡  │ ← Auto-arrange
├────┤
│ ?  │ ← Quick Help
├────┤
│ ⤢  │ ← Fullscreen (NEW!)
└────┘
```

## Benefits

### 1. **Distraction-Free Editing**
- Full viewport dedicated to workflow
- No chat history or other panels
- Maximum canvas space

### 2. **Better for Complex Workflows**
- More room to see large workflows
- Easier to navigate complex state machines
- Better overview of workflow structure

### 3. **Flexible Workflow**
- Start in canvas panel for quick edits
- Switch to fullscreen for detailed work
- Return to chat when needed

### 4. **Shareable Links**
- URL contains workflow information
- Can bookmark specific workflows
- Can share workflow links with team

### 5. **Tab Management**
- Multiple workflows in tabs
- Easy switching between workflows
- Each workflow maintains its state

## Technical Details

### Navigation Flow

1. **User clicks fullscreen button**
   ```typescript
   handleOpenFullscreen() → navigate('/workflows?model=xxx&version=yyy')
   ```

2. **Browser navigates to /workflows**
   ```typescript
   Router matches route → WorkflowTabsView renders
   ```

3. **WorkflowTabsView reads query params**
   ```typescript
   useSearchParams() → extract model & version
   ```

4. **Auto-open workflow tab**
   ```typescript
   openTab(modelName, modelVersion, displayName)
   ```

5. **Workflow loads in fullscreen**
   ```typescript
   WorkflowCanvas renders with full viewport
   ```

### State Management

- **Workflow Tabs Store**: Manages open tabs
- **Query Parameters**: Pass workflow info via URL
- **Auto-open Logic**: Prevents duplicate tabs
- **Tab State**: Each tab maintains independent state

### Validation

The fullscreen handler validates:
- ✅ Model name is present
- ✅ Model version is present
- ❌ Shows warning if validation fails
- ❌ Prevents navigation without required data

### URL Encoding

Query parameters are properly encoded:
```typescript
encodeURIComponent(modelName)
encodeURIComponent(modelVersion)
```

This handles special characters in model names:
- Spaces → `%20`
- Slashes → `%2F`
- Special chars → Encoded equivalents

## Usage Examples

### Example 1: Simple Workflow

**Canvas Panel**:
- Model: `user-registration`
- Version: `1`

**Click Fullscreen** →

**Result**:
```
URL: /workflows?model=user-registration&version=1
Tab: "user-registration v1"
```

### Example 2: Complex Workflow

**Canvas Panel**:
- Model: `order-processing-system`
- Version: `3`

**Click Fullscreen** →

**Result**:
```
URL: /workflows?model=order-processing-system&version=3
Tab: "order-processing-system v3"
```

### Example 3: With Display Name

**Canvas Panel**:
- Model: `payment-flow`
- Version: `2`
- Display Name: `Payment Processing`

**Click Fullscreen** →

**Result**:
```
URL: /workflows?model=payment-flow&version=2&name=Payment%20Processing
Tab: "Payment Processing" (payment-flow v2)
```

## Error Handling

### Missing Model Name or Version

If model name or version is not available:

```typescript
showWarning(
  'Cannot Open Fullscreen',
  'Model name and version are required to open in fullscreen mode'
);
```

**User sees**:
- Warning notification
- No navigation occurs
- User stays on current page

### Already Open Tab

If workflow is already open in a tab:

```typescript
const existingTab = tabs.find(
  tab => tab.modelName === modelName && tab.modelVersion === modelVersion
);

if (!existingTab) {
  openTab(modelName, modelVersion, displayName);
}
```

**Behavior**:
- Navigates to `/workflows` page
- Does not create duplicate tab
- Existing tab remains active

## Testing

### Manual Testing Steps

1. **Open workflow in canvas panel**
   - Navigate to any chat
   - Click Canvas button
   - Open a workflow tab

2. **Click fullscreen button**
   - Look for purple button with Maximize2 icon
   - Click the button

3. **Verify navigation**
   - URL changes to `/workflows?model=xxx&version=yyy`
   - Page loads fullscreen view

4. **Verify auto-open**
   - Workflow tab opens automatically
   - Correct model name and version
   - Canvas displays workflow

5. **Test without model info**
   - Try clicking fullscreen before opening workflow
   - Should show warning notification

6. **Test duplicate prevention**
   - Open workflow in fullscreen
   - Go back to chat
   - Click fullscreen again
   - Should not create duplicate tab

### Test Cases

- ✅ Fullscreen button visible in controls
- ✅ Button has correct styling (purple gradient)
- ✅ Tooltip shows on hover
- ✅ Click navigates to `/workflows`
- ✅ Query parameters are correct
- ✅ Workflow auto-opens in tab
- ✅ No duplicate tabs created
- ✅ Warning shown when model info missing
- ✅ URL encoding handles special characters
- ✅ Display name passed correctly (if provided)

## Related Files

- `packages/web/src/components/WorkflowCanvas/Canvas/WorkflowCanvas.tsx` - Canvas component with fullscreen button
- `packages/web/src/views/WorkflowTabsView.tsx` - Fullscreen workflow page
- `packages/web/src/stores/workflowTabs.ts` - Tab state management
- `packages/web/src/router/index.tsx` - Route configuration

## Future Enhancements

Possible improvements:
- [ ] Add keyboard shortcut for fullscreen (e.g., `Ctrl+Shift+Enter`)
- [ ] Add "Return to Chat" button in fullscreen view
- [ ] Remember last fullscreen state
- [ ] Add fullscreen animation/transition
- [ ] Support opening multiple workflows at once
- [ ] Add "Open in New Window" option

