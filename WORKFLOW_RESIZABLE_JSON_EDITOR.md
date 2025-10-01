# Resizable Workflow JSON Editor ✨

## Summary
Made the main Workflow JSON Editor **resizable** so you can drag the left edge to adjust its width and see more or less of the canvas!

---

## 🎯 **New Feature**

### **Before (Fixed Width):**
```
Canvas Area (flex-1)     │  JSON Editor (600px fixed)
                        │
┌─────┐    ┌─────┐     │  ┌─────────────────┐
│State│───▶│State│     │  │ { } Editor      │
└─────┘    └─────┘     │  │                 │
                        │  │  { "version"... │
                        │  │                 │
                        │  └─────────────────┘

❌ Fixed 600px width
❌ Can't adjust
```

### **After (Resizable):**
```
Canvas Area (flex-1)     ┃  JSON Editor (300-80% viewport)
                        ┃
┌─────┐    ┌─────┐     ┃  ┌─────────────────┐
│State│───▶│State│     ┃  │ { } Editor      │
└─────┘    └─────┘     ┃  │                 │
                        ┃  │  { "version"... │
                        ┃  │                 │
                        ┃  └─────────────────┘
                        ▲
                        │
                    Drag here!

✅ Resizable width
✅ 300px - 80% viewport
✅ Drag left edge
```

---

## ✨ **Features**

### **1. Drag to Resize**
- 🖱️ **Left edge** - Hover to see resize handle
- 📏 **Drag left** - Make editor wider (canvas smaller)
- 📏 **Drag right** - Make editor narrower (canvas larger)
- 💚 **Visual indicator** - Lime handle appears on hover

### **2. Width Constraints**
- 📐 **Minimum**: 300px (readable)
- 📐 **Maximum**: 80% of viewport (canvas visible)
- 🎯 **Default**: 600px (balanced)
- 🔒 **Constrained**: Can't go off-screen

### **3. Visual Feedback**
- 💚 **Hover indicator** - Lime bar shows on hover
- 🖱️ **Cursor change** - ew-resize cursor
- 🎨 **Smooth transition** - Animated resize
- ✨ **Professional** - Polished interaction

### **4. Persistent During Session**
- 💾 **Width maintained** - Stays at your size
- 🔄 **Until close** - Resets to 600px on reopen
- 🎯 **Convenient** - Set once, use multiple times

---

## 🖱️ **How to Use**

### **Opening:**
1. **Click 📝 button** on toolbar
2. **Editor opens** at 600px width
3. **Canvas adjusts** to remaining space

### **Resizing:**
1. **Hover left edge** - Lime handle appears
2. **Cursor changes** to ↔️ (ew-resize)
3. **Click and drag** left or right
4. **Release** to set width
5. **Canvas adjusts** automatically

### **Tips:**
- 🎯 **Drag left** - More editor, less canvas
- 🎯 **Drag right** - Less editor, more canvas
- 🎯 **Small workflows** - Make editor wider
- 🎯 **Large workflows** - Make editor narrower

---

## 💡 **Use Cases**

### **Use Case 1: Small Workflow**
```
Scenario: Simple 3-state workflow

1. Open JSON editor (600px default)
2. Drag left edge to left (expand to 800px)
3. More space for JSON editing
4. Canvas still visible but smaller
5. Focus on JSON structure
```

### **Use Case 2: Large Workflow**
```
Scenario: Complex 20-state workflow

1. Open JSON editor (600px default)
2. Drag left edge to right (shrink to 400px)
3. More space for canvas
4. See more states at once
5. Quick JSON reference
```

### **Use Case 3: Detailed Editing**
```
Scenario: Editing complex transitions

1. Open JSON editor
2. Expand to 1000px (80% viewport)
3. See full JSON structure
4. Edit multiple nested objects
5. Canvas still visible for reference
```

### **Use Case 4: Quick Reference**
```
Scenario: Just checking JSON

1. Open JSON editor
2. Shrink to 300px (minimum)
3. Quick glance at structure
4. Canvas takes most space
5. Visual workflow focus
```

---

## 🎨 **Visual Design**

### **Resize Handle:**
```
┌─────────────────────────────────────┐
┃ ← Hover here                        │
┃                                     │
┃   { "version": "1.0",               │
┃     "name": "workflow",             │
┃     "states": {                     │
┃       ...                           │
┃     }                               │
┃   }                                 │
┃                                     │
└─────────────────────────────────────┘

┃ = Lime resize handle (1px, expands to 1.5px on hover)
```

### **Hover State:**
```
┌─────────────────────────────────────┐
┃┃ ← Lime indicator (visible)         │
┃┃                                    │
┃┃  { "version": "1.0",               │
┃┃    "name": "workflow",             │
┃┃    "states": {                     │
┃┃      ...                           │
┃┃    }                               │
┃┃  }                                 │
┃┃                                    │
└─────────────────────────────────────┘

┃┃ = Lime handle + indicator bar (12px height, centered)
```

### **Resizing:**
```
Canvas shrinks/expands ◀──▶ Editor expands/shrinks
                       ↔️
                  (cursor: ew-resize)
```

---

## 🎯 **Technical Details**

### **Width State:**
```typescript
const [width, setWidth] = useState(600); // Default 600px
const [isResizing, setIsResizing] = useState(false);
const resizeStartX = useRef(0);
const resizeStartWidth = useRef(0);
```

### **Resize Handler:**
```typescript
const handleResizeStart = (e: React.MouseEvent) => {
  e.preventDefault();
  setIsResizing(true);
  resizeStartX.current = e.clientX;
  resizeStartWidth.current = width;
};
```

### **Mouse Move:**
```typescript
const deltaX = resizeStartX.current - e.clientX; // Inverted (left edge)
const newWidth = resizeStartWidth.current + deltaX;

// Constrain
const minWidth = 300;
const maxWidth = window.innerWidth * 0.8;
setWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
```

### **CSS:**
```css
/* Container */
width: ${width}px;

/* Resize Handle */
position: absolute;
left: 0;
top: 0;
bottom: 0;
width: 1px;
cursor: ew-resize;
hover:width: 1.5px;
hover:background: lime-500;
```

---

## 📋 **Width Presets**

| Size | Width | Use Case |
|------|-------|----------|
| **Minimum** | 300px | Quick reference |
| **Small** | 400px | Large canvas focus |
| **Default** | 600px | Balanced view |
| **Medium** | 800px | More JSON space |
| **Large** | 1000px | Detailed editing |
| **Maximum** | 80% viewport | Full JSON focus |

---

## 🚀 **Benefits**

### **1. Flexibility**
- ✅ Adjust to your needs
- ✅ Different workflows
- ✅ Personal preference
- ✅ Task-specific sizing

### **2. Better Workflow**
- ✅ See what you need
- ✅ Hide what you don't
- ✅ Focus on task
- ✅ Efficient editing

### **3. Professional UX**
- ✅ Standard pattern
- ✅ Smooth interaction
- ✅ Visual feedback
- ✅ Intuitive controls

### **4. Responsive**
- ✅ Works on any screen
- ✅ Adapts to viewport
- ✅ Constrained properly
- ✅ Always usable

---

## 🎨 **Design Decisions**

### **1. Left Edge Resize**
**Why:** Editor is on right, drag from left edge
**Benefit:** Natural interaction (pull/push)

### **2. 300px Minimum**
**Why:** Ensure JSON is readable
**Benefit:** Never too small to use

### **3. 80% Maximum**
**Why:** Keep canvas visible
**Benefit:** Always see workflow context

### **4. 600px Default**
**Why:** Balanced view
**Benefit:** Good starting point

### **5. Lime Handle**
**Why:** Matches workflow theme
**Benefit:** Visual consistency

### **6. Hover Indicator**
**Why:** Show where to drag
**Benefit:** Discoverable interaction

---

## 📊 **Comparison**

| Feature | Before | After |
|---------|--------|-------|
| **Width** | ⚠️ Fixed 600px | ✅ 300px - 80% |
| **Adjustable** | ❌ No | ✅ Yes |
| **Canvas space** | ⚠️ Fixed | ✅ Flexible |
| **User control** | ❌ None | ✅ Full |
| **Workflow** | ⚠️ One size | ✅ Adapt to task |

---

## 📝 **Files Modified**

### **WorkflowJsonEditor.tsx**
- ✅ Added width state (default 600px)
- ✅ Added resize state tracking
- ✅ Added resize handlers
- ✅ Added mouse move/up listeners
- ✅ Added left edge resize handle
- ✅ Added hover indicator
- ✅ Added cursor feedback
- ✅ Added width constraints (300px - 80%)
- ✅ Changed from fixed w-[600px] to dynamic width

---

## 🌟 **Result**

**Your JSON editor is now resizable!**

- 🖱️ **Drag left edge** - Adjust width
- 📏 **300px - 80%** - Flexible range
- 💚 **Lime handle** - Visual indicator
- 🎯 **Smooth resize** - Professional feel
- 👁️ **Canvas adjusts** - Automatic reflow
- ✨ **Better workflow** - Adapt to your needs
- 🎨 **Matches theme** - Lime/emerald colors

**Resize to fit your workflow!** 🎉✨

