# Workflow Fullscreen Toggle Feature

## Overview

The fullscreen button in the workflow canvas now works as a **toggle** - click once to enter fullscreen mode, click again to exit. The button changes appearance based on the current mode.

## Changes Made

### 1. WorkflowCanvas Component

**File**: `packages/web/src/components/WorkflowCanvas/Canvas/WorkflowCanvas.tsx`

#### Added Imports

```typescript
import { Minimize2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
```

#### Updated Fullscreen Handler

**Before**: Only opened fullscreen
```typescript
const handleOpenFullscreen = useCallback(() => {
  if (!modelName || !modelVersion) {
    showWarning('Cannot Open Fullscreen', '...');
    return;
  }
  navigate(`/workflows?model=${modelName}&version=${modelVersion}`);
}, [modelName, modelVersion, navigate, showWarning]);
```

**After**: Toggles between fullscreen and normal mode
```typescript
const navigate = useNavigate();
const location = useLocation();

// Check if we're currently in fullscreen mode (on /workflows page)
const isInFullscreenMode = location.pathname === '/workflows';

const handleToggleFullscreen = useCallback(() => {
  if (!modelName || !modelVersion) {
    showWarning('Cannot Open Fullscreen', '...');
    return;
  }

  if (isInFullscreenMode) {
    // Exit fullscreen - go back to previous page or home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  } else {
    // Enter fullscreen - navigate to workflows page
    navigate(`/workflows?model=${modelName}&version=${modelVersion}`);
  }
}, [modelName, modelVersion, navigate, showWarning, isInFullscreenMode]);
```

#### Updated Button Appearance

The button now changes based on mode:

```typescript
{modelName && modelVersion && (
  <ControlButton
    onClick={handleToggleFullscreen}
    title={isInFullscreenMode ? "Exit fullscreen" : "Open in fullscreen"}
    className={isInFullscreenMode 
      ? "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30"
      : "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30"
    }
    data-testid="fullscreen-button"
  >
    {isInFullscreenMode ? (
      <Minimize2 size={16} className="text-orange-600 dark:text-orange-400" />
    ) : (
      <Maximize2 size={16} className="text-purple-600 dark:text-purple-400" />
    )}
  </ControlButton>
)}
```

**Button States**:

| Mode | Icon | Color | Tooltip |
|------|------|-------|---------|
| Normal (Canvas Panel) | ⤢ Maximize2 | Purple/Indigo | "Open in fullscreen" |
| Fullscreen (/workflows) | ⤓ Minimize2 | Orange/Red | "Exit fullscreen" |

### 2. WorkflowTabsView Component

**File**: `packages/web/src/views/WorkflowTabsView.tsx`

#### Removed Header

Removed the header with back button since the fullscreen button now handles exit:

**Before**:
```typescript
<div className="h-screen w-screen overflow-hidden bg-gray-900 flex flex-col">
  {/* Header with back button */}
  <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
    <button onClick={handleGoBack}>Back</button>
    <h1>Workflow Editor</h1>
    <button onClick={handleGoBack}>Exit</button>
  </div>
  
  <div className="flex-1 overflow-hidden">
    <WorkflowTabsContainer />
  </div>
</div>
```

**After**:
```typescript
<div className="h-screen w-screen overflow-hidden bg-gray-900">
  <WorkflowTabsContainer />
</div>
```

**Rationale**: The fullscreen button in the canvas controls now handles both entering and exiting fullscreen, making a separate header redundant.

## User Experience

### Visual Flow

```
┌─────────────────────────────────────┐
│  Chat View with Canvas Panel        │
│  ┌───────────────────────────────┐  │
│  │  Workflow Canvas              │  │
│  │  Controls:                    │  │
│  │  [⤢] ← Purple Maximize button │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
                 ↓ Click [⤢]
┌─────────────────────────────────────┐
│  /workflows (Fullscreen)             │
│  ┌───────────────────────────────┐  │
│  │  Workflow Canvas              │  │
│  │  Controls:                    │  │
│  │  [⤓] ← Orange Minimize button │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
                 ↓ Click [⤓]
┌─────────────────────────────────────┐
│  Back to Chat View                   │
│  (Returns to previous page)          │
└─────────────────────────────────────┘
```

### Button Behavior

#### In Canvas Panel (Normal Mode)

**Appearance**:
- 🟣 Purple/indigo gradient background
- ⤢ Maximize2 icon (expand arrows)
- Tooltip: "Open in fullscreen"

**Action**: Click → Navigate to `/workflows` page

#### In Fullscreen Mode (/workflows)

**Appearance**:
- 🟠 Orange/red gradient background
- ⤓ Minimize2 icon (minimize arrows)
- Tooltip: "Exit fullscreen"

**Action**: Click → Navigate back to previous page

### Navigation Logic

**Exiting Fullscreen**:
1. If browser history exists → `navigate(-1)` (go back)
2. If no history → `navigate('/')` (go to home)

This ensures users always have a way to exit, even if they directly navigated to the fullscreen URL.

## Benefits

### 1. **Intuitive Toggle Behavior**
- Same button for enter/exit
- Visual feedback (color change)
- Icon changes to match action

### 2. **No Extra UI Elements**
- No separate header needed
- Clean, minimal interface
- More space for workflow

### 3. **Clear Visual State**
- Purple = Can expand
- Orange = Can minimize
- Icon matches action

### 4. **Consistent Location**
- Button stays in same position
- Easy to find and click
- Muscle memory friendly

### 5. **Smart Navigation**
- Goes back to where you came from
- Fallback to home if needed
- Never leaves user stuck

## Technical Details

### Mode Detection

```typescript
const location = useLocation();
const isInFullscreenMode = location.pathname === '/workflows';
```

Uses React Router's `useLocation` to check current path.

### Toggle Logic

```typescript
if (isInFullscreenMode) {
  // Exit: Go back or home
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate('/');
  }
} else {
  // Enter: Go to fullscreen with params
  navigate(`/workflows?model=${modelName}&version=${modelVersion}`);
}
```

### Conditional Rendering

Button only shows when workflow is loaded:
```typescript
{modelName && modelVersion && (
  <ControlButton ... />
)}
```

Prevents showing button when no workflow is active.

### Dynamic Styling

```typescript
className={isInFullscreenMode 
  ? "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30"
  : "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30"
}
```

Changes color based on current mode.

### Dynamic Icon

```typescript
{isInFullscreenMode ? (
  <Minimize2 size={16} className="text-orange-600 dark:text-orange-400" />
) : (
  <Maximize2 size={16} className="text-purple-600 dark:text-purple-400" />
)}
```

Shows appropriate icon for current action.

## Usage Examples

### Example 1: Enter Fullscreen

1. User opens workflow in canvas panel
2. User sees **purple button** with ⤢ icon
3. User clicks button
4. Browser navigates to `/workflows?model=xxx&version=yyy`
5. Workflow opens in fullscreen
6. Button changes to **orange** with ⤓ icon

### Example 2: Exit Fullscreen

1. User is in fullscreen mode
2. User sees **orange button** with ⤓ icon
3. User clicks button
4. Browser navigates back to previous page
5. User returns to chat view with canvas panel
6. Button changes to **purple** with ⤢ icon

### Example 3: Direct URL Access

1. User navigates directly to `/workflows?model=xxx&version=yyy`
2. Workflow opens in fullscreen
3. Button shows **orange** with ⤓ icon
4. User clicks button
5. Since no history, navigates to home `/`

## Error Handling

### Missing Model Info

If model name or version is not available:
```typescript
showWarning(
  'Cannot Open Fullscreen',
  'Model name and version are required to open in fullscreen mode'
);
```

Button is hidden when no workflow is loaded, preventing this error in most cases.

### No Browser History

If user directly accessed fullscreen URL:
```typescript
if (window.history.length > 1) {
  navigate(-1);
} else {
  navigate('/'); // Fallback to home
}
```

Ensures user can always exit fullscreen.

## Testing

### Manual Testing Steps

1. **Test Enter Fullscreen**
   - Open workflow in canvas panel
   - Verify button is purple with ⤢ icon
   - Click button
   - Verify navigation to `/workflows`
   - Verify button changes to orange with ⤓ icon

2. **Test Exit Fullscreen**
   - In fullscreen mode
   - Verify button is orange with ⤓ icon
   - Click button
   - Verify navigation back to previous page
   - Verify button changes to purple with ⤢ icon

3. **Test Without Workflow**
   - Open canvas panel without workflow
   - Verify button is hidden
   - No error should occur

4. **Test Direct URL Access**
   - Navigate directly to `/workflows?model=test&version=1`
   - Verify button is orange with ⤓ icon
   - Click button
   - Verify navigation to home

5. **Test Multiple Toggles**
   - Toggle fullscreen on/off multiple times
   - Verify button state changes correctly each time
   - Verify navigation works consistently

### Test Cases

- ✅ Button hidden when no workflow loaded
- ✅ Button shows purple ⤢ in normal mode
- ✅ Button shows orange ⤓ in fullscreen mode
- ✅ Click in normal mode → enters fullscreen
- ✅ Click in fullscreen mode → exits fullscreen
- ✅ Tooltip changes based on mode
- ✅ Color changes based on mode
- ✅ Icon changes based on mode
- ✅ Navigation works with history
- ✅ Navigation works without history (direct URL)
- ✅ Multiple toggles work correctly

## Visual Design

### Color Scheme

**Normal Mode (Enter Fullscreen)**:
- Background: Purple/Indigo gradient
- Icon: Purple (#9333EA / #6366F1)
- Meaning: "Expand" action

**Fullscreen Mode (Exit Fullscreen)**:
- Background: Orange/Red gradient
- Icon: Orange (#EA580C / #DC2626)
- Meaning: "Minimize/Close" action

### Icon Choice

- **Maximize2** (⤢): Arrows pointing outward → expand
- **Minimize2** (⤓): Arrows pointing inward → minimize

Both icons are from Lucide React and are visually consistent.

## Related Files

- `packages/web/src/components/WorkflowCanvas/Canvas/WorkflowCanvas.tsx` - Canvas with toggle button
- `packages/web/src/views/WorkflowTabsView.tsx` - Fullscreen view (simplified)
- `packages/web/src/router/index.tsx` - Route configuration

## Future Enhancements

Possible improvements:
- [ ] Add keyboard shortcut (e.g., `F11` or `Ctrl+Shift+F`)
- [ ] Add animation when transitioning
- [ ] Remember last mode preference
- [ ] Add confirmation dialog if unsaved changes
- [ ] Support multiple fullscreen workflows in tabs

