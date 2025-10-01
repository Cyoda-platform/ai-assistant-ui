# Workflow Canvas - New Features Guide

## 🎯 Quick Reference

### New Interactions

| Action | How To | Result |
|--------|--------|--------|
| **Add State** | Double-click canvas background | Creates new state at cursor |
| **Rename State** | Double-click state name | Inline editor appears |
| **Connect States** | Drag from any of 8 handles | Creates transition |
| **Show Help** | Click ? button in controls | Displays quick help panel |

---

## 🔌 8-Point Anchor System

### Before (4 Points):
```
        [Top]
         ↑
[Left] ← ■ → [Right]
         ↓
      [Bottom]
```

### After (8 Points):
```
    [TL] [TC] [TR]
      ↖  ↑  ↗
[LC] ← ■ → [RC]
      ↙  ↓  ↘
    [BL] [BC] [BR]
```

**Benefits:**
- More connection options
- Better visual flow
- Supports loop-back connections
- Professional appearance

**How to Use:**
1. Hover over any state node
2. See 8 connection handles appear
3. Drag from any handle to another state
4. Connection automatically routes

---

## ✏️ Inline Name Editing

### Quick Edit Flow:
```
1. Double-click state name
   ┌─────────────────┐
   │ [Input Field]   │
   │ ✓ Save  ✗ Cancel│
   └─────────────────┘

2. Type new name

3. Press Enter or click ✓
   → State renamed
   → All references updated
   → Success message shown
```

### Features:
- ✅ Duplicate name detection
- ✅ Updates all transitions
- ✅ Updates initial state reference
- ✅ Auto-save on blur
- ✅ Escape to cancel

### Keyboard Shortcuts:
- `Enter` - Save changes
- `Escape` - Cancel editing
- `Tab` - (Future) Navigate to next field

---

## 🖱️ Double-Click to Add States

### Interaction Pattern:
```
Canvas Background
┌─────────────────────────────┐
│                             │
│    Double-click here        │
│         ↓                   │
│    ┌─────────┐              │
│    │New State│              │
│    └─────────┘              │
│                             │
└─────────────────────────────┘
```

### Detection Logic:
- **Time Tolerance:** 500ms between clicks
- **Position Tolerance:** 5px movement allowed
- **Result:** New state at cursor position

### Tips:
- Works only on canvas background (not on nodes)
- Position is automatically calculated
- State appears centered at click point
- Can immediately start editing

---

## ❓ Quick Help Panel

### Panel Layout:
```
┌─────────────────────────────┐
│ ? Quick Help                │
├─────────────────────────────┤
│ 🖱️ Double-click canvas      │
│    to add state             │
│                             │
│ ✏️ Double-click state name  │
│    to edit                  │
│                             │
│ 🔗 Drag from handles        │
│    to connect               │
│                             │
│ 🚚 Drag states              │
│    to rearrange             │
│                             │
│ 📐 Use layout button        │
│    to auto-arrange          │
│                             │
│ ⌨️ Ctrl+Z/Y                 │
│    for undo/redo            │
│                             │
│ ⌨️ Backspace                │
│    to delete selected       │
└─────────────────────────────┘
```

### Toggle:
- Click `?` button in controls panel
- Panel appears in top-right corner
- Click `?` again to hide
- State persists during session

---

## 🎨 Visual Enhancements

### Connection Handles:
```css
/* Default State */
opacity: 0.6
size: 12px × 12px
color: #3B82F6 (blue)

/* Hover State */
opacity: 1.0
scale: 1.1
transition: 0.2s ease
```

### Inline Editor:
```css
/* Input Field */
border: 1px solid #3B82F6
border-radius: 4px
font-size: 14px
font-weight: 600

/* Buttons */
✓ Save: #52c41a (green)
✗ Cancel: #ff4d4f (red)
```

### Quick Help Panel:
```css
/* Container */
background: rgba(15, 23, 42, 0.95)
backdrop-filter: blur(12px)
border: 1px solid rgba(148, 163, 184, 0.2)
border-radius: 12px
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3)

/* Help Items */
background: rgba(51, 65, 85, 0.5)
hover: background-color change
transition: 0.2s ease
```

---

## 🔄 Workflow Examples

### Example 1: Quick State Creation
```
1. Open workflow editor
2. Double-click canvas
3. New state appears
4. Double-click name to edit
5. Type "Processing"
6. Press Enter
7. Done! ✅
```

### Example 2: Complex Connections
```
State A (8 anchor points)
  ├─ Top-Left → State B
  ├─ Top-Right → State C
  ├─ Right-Center → State D
  └─ Bottom-Center → State E

Result: Clean, organized flow
```

### Example 3: Loop-Back Transition
```
State A
  └─ Bottom-Right → Top-Right (same state)

Result: Self-referencing transition
Use case: Retry logic, polling, etc.
```

---

## 🎯 Best Practices

### State Naming:
- ✅ Use descriptive names
- ✅ Follow consistent naming convention
- ✅ Avoid special characters
- ❌ Don't use duplicate names

### Connection Routing:
- ✅ Use appropriate anchor points
- ✅ Minimize crossing connections
- ✅ Group related transitions
- ✅ Use layout button for auto-arrange

### Workflow Organization:
- ✅ Start with initial state at top/left
- ✅ Flow left-to-right or top-to-bottom
- ✅ Group related states
- ✅ Use quick help for reference

---

## 🐛 Troubleshooting

### Issue: Double-click not working
**Solution:** 
- Ensure clicking on canvas background (not nodes)
- Check click timing (< 500ms between clicks)
- Try clicking in empty area

### Issue: Inline editing not saving
**Solution:**
- Check for duplicate state names
- Ensure name is not empty
- Look for error messages
- Try pressing Enter explicitly

### Issue: Connection handles not visible
**Solution:**
- Hover over node to reveal handles
- Check zoom level (handles may be small)
- Ensure node is not selected/dragging

### Issue: Quick help panel not showing
**Solution:**
- Click ? button in controls panel
- Check if panel is behind other elements
- Try toggling off and on again

---

## 📊 Feature Comparison

| Feature | Before | After | Improvement |
|---------|--------|-------|-------------|
| **Anchor Points** | 4 | 8 | +100% flexibility |
| **Name Editing** | Modal only | Inline + Modal | Faster workflow |
| **State Creation** | Button only | Button + Double-click | More intuitive |
| **Help System** | None | Quick help panel | Better UX |

---

## 🚀 Coming Soon (Phase 2 & 3)

### Phase 2:
- 🗑️ Deletion warnings with impact analysis
- ⌨️ Enhanced keyboard shortcuts
- 🎨 Improved animations and transitions
- 📝 Better error messages

### Phase 3:
- 💾 Session-based history
- 📐 Enhanced auto-layout
- 🔄 Edge reconnection
- 🎛️ Advanced transition editor

---

## 💡 Tips & Tricks

### Power User Shortcuts:
1. **Quick Rename:** Double-click name → Type → Enter
2. **Rapid Creation:** Double-click canvas multiple times
3. **Precise Connections:** Use specific anchor points
4. **Reference Help:** Keep ? panel open while learning

### Workflow Efficiency:
1. Use double-click for quick state creation
2. Use inline editing for simple renames
3. Use modal editor for complex changes
4. Use layout button to organize

### Visual Organization:
1. Use 8-point anchors for clean routing
2. Minimize connection crossings
3. Group related states visually
4. Use consistent spacing

---

## 📞 Support

### Need Help?
- Check Quick Help panel (? button)
- Review this guide
- Check WORKFLOW_ENHANCEMENTS.md for technical details

### Found a Bug?
- Note the steps to reproduce
- Check browser console for errors
- Document expected vs. actual behavior

---

## ✨ Summary

**New Features:**
1. ✅ 8-Point Anchor System
2. ✅ Inline Name Editing
3. ✅ Double-Click to Add States
4. ✅ Quick Help Panel

**Benefits:**
- Faster workflow editing
- More intuitive interactions
- Better user guidance
- Professional appearance

**Ready to use!** Start exploring the new features today! 🎉

