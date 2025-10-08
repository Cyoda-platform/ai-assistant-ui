# Visual Guide: Separate Window JSON Editors

## Overview

This guide shows what the implementation looks like visually.

## 1. Node with Code Icon Button

### Before (No Button)
```
┌─────────────────────────────────────┐
│ 📦 My App v1.0                      │
├─────────────────────────────────────┤
│ Author: John Doe                    │
│ Description: Sample app             │
│ ...                                 │
└─────────────────────────────────────┘
```

### After (With Code Button)
```
┌─────────────────────────────────────┐
│ 📦 My App v1.0              </> │  ← Code icon button (clickable)
├─────────────────────────────────────┤
│ Author: John Doe                    │
│ Description: Sample app             │
│ ...                                 │
└─────────────────────────────────────┘
```

## 2. All Node Types with Code Buttons

### App Node (Purple)
```
┌─────────────────────────────────────────────┐
│ 📦 My App v1.0                      </> │
├─────────────────────────────────────────────┤
│ 👤 Author: John Doe                         │
│ 📄 Description: Sample application          │
│ 📋 Requirement: Build a pet management app  │
│ 🔗 Repository: github.com/...               │
│ License: MIT                                │
└─────────────────────────────────────────────┘
```

### Environment Node (Green)
```
┌─────────────────────────────────────┐
│ 🌍 Production          ✓       </> │
├─────────────────────────────────────┤
│ 🔗 URL: https://prod.example.com    │
│ Status: [active]                    │
└─────────────────────────────────────┘
```

### Entity Node (Blue)
```
┌─────────────────────────────────────┐
│ 📦 Dog v1                      </> │
├─────────────────────────────────────┤
│ 📄 Description: Dog entity          │
│ 💾 Model:                           │
│    Name: Buddy                      │
│    Age: 3                           │
│    Breed: Golden Retriever          │
│ 🔗 Cyoda | GitHub                   │
└─────────────────────────────────────┘
```

### Workflow Node (Orange)
```
┌─────────────────────────────────────┐
│ 🔄 Dog Workflow                </> │
├─────────────────────────────────────┤
│ # States: 3 states                  │
│ 🌿 State Flow:                      │
│    • initial → validated            │
│    • validated → archived           │
│    • archived                       │
│ 🔗 Cyoda | GitHub                   │
└─────────────────────────────────────┘
```

## 3. Modal Window (When Code Button is Clicked)

### Full Screen View
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  [Backdrop: Blurred + Semi-transparent Black Background]               │
│                                                                         │
│    ┌───────────────────────────────────────────────────────────┐      │
│    │ </> Edit Entity: Dog                                   [X]│      │
│    ├───────────────────────────────────────────────────────────┤      │
│    │                                                            │      │
│    │  1  {                                                      │      │
│    │  2    "name": "Dog",                                       │      │
│    │  3    "version": "1",                                      │      │
│    │  4    "description": "Dog entity",                         │      │
│    │  5    "cyoda_url": "https://example.com",                 │      │
│    │  6    "github_url": "https://github.com",                 │      │
│    │  7    "model": {                                           │      │
│    │  8      "name": "Buddy",                                   │      │
│    │  9      "age": 3,                                          │      │
│    │ 10      "breed": "Golden Retriever"                        │      │
│    │ 11    }                                                    │      │
│    │ 12  }                                                      │      │
│    │                                                            │      │
│    │                                                    [Minimap]│      │
│    ├───────────────────────────────────────────────────────────┤      │
│    │                              [Cancel] [💾 Save Changes]    │      │
│    └───────────────────────────────────────────────────────────┘      │
│                                                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Modal Features Highlighted
```
┌───────────────────────────────────────────────────────────┐
│ </> Edit Entity: Dog                                   [X]│ ← Header with title and close button
├───────────────────────────────────────────────────────────┤
│                                                            │
│  Monaco Editor Area                                        │ ← Professional code editor
│  - Syntax highlighting                                     │
│  - Line numbers                                            │
│  - Auto-completion                                         │
│  - Format on paste/type                                    │
│                                                            │
│                                                    [Minimap]│ ← Minimap for navigation
├───────────────────────────────────────────────────────────┤
│ Error: Unexpected token at line 5                         │ ← Error display (if invalid JSON)
├───────────────────────────────────────────────────────────┤
│                              [Cancel] [💾 Save Changes]    │ ← Action buttons
└───────────────────────────────────────────────────────────┘
```

## 4. Group Nodes with Add Buttons

### Environments Group
```
┌─────────────────────────────┐
│ 📁 Environments      [+]    │ ← Add button
│ Count: 2                    │
└─────────────────────────────┘
```

### Entities Group
```
┌─────────────────────────────┐
│ 📁 Entities          [+]    │ ← Add button
│ Count: 1                    │
└─────────────────────────────┘
```

### Workflows Group (per Entity)
```
┌─────────────────────────────┐
│ 📁 Workflows         [+]    │ ← Add button
│ Count: 1                    │
└─────────────────────────────┘
```

## 5. User Interaction Flow

### Step 1: Hover Over Node
```
┌─────────────────────────────────────┐
│ 📦 Dog v1                  [</>]    │ ← Button highlights on hover
├─────────────────────────────────────┤
│ ...                                 │
└─────────────────────────────────────┘
```

### Step 2: Click Code Button
```
User clicks </> button
        ↓
Modal appears with backdrop blur
        ↓
Focus is on the editor
```

### Step 3: Edit JSON
```
User types in Monaco Editor
        ↓
Syntax highlighting updates in real-time
        ↓
Auto-formatting helps maintain structure
```

### Step 4: Save or Cancel
```
Option A: Click "Save Changes"
        ↓
    JSON is validated
        ↓
    If valid: Data updates, modal closes
    If invalid: Error shown, modal stays open

Option B: Click "Cancel" or "X" or outside modal
        ↓
    Changes discarded
        ↓
    Modal closes
```

## 6. Color Scheme

### Node Colors
- **App Node**: Purple gradient (`from-purple-600 to-purple-800`)
- **Environment Node**: Green gradient (`from-green-600 to-green-800`)
- **Entity Node**: Blue gradient (`from-blue-600 to-blue-800`)
- **Workflow Node**: Orange gradient (`from-orange-600 to-orange-800`)
- **Group Node**: Varies by type (green, blue, orange)

### Modal Colors
- **Background**: Dark slate (`bg-slate-800`)
- **Header/Footer**: Darker slate (`bg-slate-700`)
- **Border**: Slate (`border-slate-600`)
- **Backdrop**: Black with 50% opacity + blur (`bg-black/50 backdrop-blur-sm`)
- **Save Button**: Blue (`bg-blue-600`)
- **Error**: Red (`bg-red-900/50`)

## 7. Icon Reference

### Node Icons
- 📦 `Package` - App Node
- 🌍 `Globe` - Environment Node
- 📦 `Box` - Entity Node
- 🔄 `Workflow` - Workflow Node
- 📁 `Folder` - Group Node

### Action Icons
- `</>` `Code` - Open JSON editor
- `[+]` `Plus` - Add new item
- `[X]` `X` - Close modal
- `💾` `Save` - Save changes

### Status Icons
- `✓` `CheckCircle` - Active status
- `✗` `XCircle` - Inactive status

## 8. Responsive Behavior

### Modal Sizing
- **Width**: 800px (fixed)
- **Height**: 600px (fixed)
- **Position**: Centered on screen
- **Overflow**: Editor scrolls if content is large

### Button Sizing
- **Code Icon**: 16px (in node header)
- **Plus Icon**: 18px (in group header)
- **Modal Icons**: 20px (in modal header)

## 9. Accessibility

### Keyboard Navigation
- **Tab**: Navigate between buttons
- **Enter**: Activate focused button
- **Escape**: Close modal (future enhancement)

### Screen Reader Support
- All buttons have `title` attributes
- Modal has proper ARIA labels
- Error messages are announced

## 10. Animation & Transitions

### Hover Effects
```css
Code button: hover:bg-blue-700 (smooth transition)
Save button: hover:bg-blue-700 (smooth transition)
Cancel button: hover:bg-slate-600 (smooth transition)
```

### Modal Appearance
- Backdrop fades in
- Modal appears instantly (no animation for now)
- Could add slide-in or fade-in animation in future

## Summary

The implementation provides:
- ✅ Clear visual indicators (Code icon buttons)
- ✅ Professional editing experience (Monaco Editor)
- ✅ Intuitive modal design (centered, backdrop blur)
- ✅ Consistent color scheme (dark theme)
- ✅ Easy-to-use interface (one-click access)
- ✅ Visual feedback (hover effects, error messages)

All nodes are easily editable, and the add buttons work seamlessly to create new items.

