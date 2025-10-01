# Draggable Transition Editor ✨

## Summary
Converted the Transition Editor from a **modal overlay** to a **draggable floating panel** so you can edit transitions while viewing the workflow canvas!

---

## 🎯 **New Design**

### **Before (Modal Overlay):**
```
┌────────────────────────────────────────┐
│ ████████████████████████████████████  │ ← Backdrop blocks canvas
│ ████████████████████████████████████  │
│ ████████  Transition Editor  ████████ │
│ ████████████████████████████████████  │
│ ████████████████████████████████████  │
└────────────────────────────────────────┘
❌ Can't see canvas
❌ Can't reference workflow
```

### **After (Draggable Panel):**
```
┌────────────────────────────────────────┐
│  Canvas Area (visible)                 │
│                                        │
│  ┌─────┐     ┌─────┐                 │
│  │State│────▶│State│                 │
│  └─────┘     └─────┘                 │
│                                        │
│         ┌──────────────────┐          │
│         │ 📝 Edit Transition│ ← Drag  │
│         ├──────────────────┤          │
│         │ JSON Editor      │          │
│         └──────────────────┘          │
└────────────────────────────────────────┘
✅ Canvas visible
✅ Can reference workflow
✅ Drag to position
```

---

## ✨ **Features**

### **1. Draggable**
- 🖱️ **Grab header** - Click and drag from header
- 📍 **Position anywhere** - Move to convenient location
- 🔒 **Constrained** - Stays within viewport
- 💾 **Smooth movement** - Fluid dragging

### **2. No Backdrop**
- 👁️ **Canvas visible** - See workflow behind
- 🎯 **Reference states** - Check state names
- 🔄 **Context aware** - See what you're editing
- 💪 **Multi-tasking** - Work with both

### **3. Resizable**
- 📏 **Corner handles** - Resize from corners
- 📐 **Edge handles** - Resize from edges
- 📦 **Min/max size** - Constrained dimensions
- 🎨 **Smooth resize** - Fluid resizing

### **4. Floating Panel**
- 🎨 **Lime border** - Matches theme
- 🌟 **Shadow** - Floats above canvas
- 💚 **Gradient header** - Lime/emerald
- ✨ **Professional** - Modern design

---

## 🖱️ **How to Use**

### **Opening:**
1. **Click transition** on canvas
2. **Panel appears** at default position (100, 100)
3. **Canvas remains visible** behind

### **Dragging:**
1. **Click header** (anywhere except buttons/inputs)
2. **Drag** to desired position
3. **Release** to drop
4. **Cursor changes** to grab/grabbing

### **Resizing:**
1. **Hover corners/edges** - Handles appear
2. **Click and drag** handle
3. **Release** to set size
4. **Min size**: 400x300px

### **Closing:**
1. **Click X button** (top-right)
2. **Press Escape** key
3. **Click Save** (saves and closes)

---

## 💡 **Use Cases**

### **Use Case 1: Reference State Names**
```
Scenario: Adding transition to specific state

1. Open transition editor
2. Drag to side of canvas
3. See state names on canvas
4. Type correct state name in "next" field
5. No need to remember or switch views
```

### **Use Case 2: Check Existing Transitions**
```
Scenario: Avoid duplicate transition names

1. Open transition editor
2. Position near source state
3. See existing transitions on canvas
4. Choose unique name
5. Edit while viewing context
```

### **Use Case 3: Complex Workflows**
```
Scenario: Large workflow with many states

1. Open transition editor
2. Drag to corner
3. Zoom/pan canvas to see full workflow
4. Reference multiple states
5. Edit with full context
```

### **Use Case 4: Multi-Step Editing**
```
Scenario: Edit multiple transitions

1. Open first transition
2. Position editor conveniently
3. Edit and save
4. Open next transition
5. Editor stays in same position
6. Efficient workflow
```

---

## 🎨 **Visual Design**

### **Header:**
```
┌────────────────────────────────────┐
│ 📝 Edit Transition            [X] │ ← Draggable area
│    transition_name                 │   Lime/emerald gradient
└────────────────────────────────────┘   Cursor: grab
```

### **Body:**
```
┌────────────────────────────────────┐
│ 📝 Transition Configuration (JSON) │
│ ┌────────────────────────────────┐ │
│ │ {                              │ │
│ │   "name": "...",               │ │
│ │   "next": "...",               │ │
│ │   "manual": true               │ │
│ │ }                              │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### **Footer:**
```
┌────────────────────────────────────┐
│ [Delete]              [Save] 💚    │
└────────────────────────────────────┘
```

---

## 🎯 **Technical Details**

### **Position State:**
```typescript
const [position, setPosition] = useState({ x: 100, y: 100 });
const [isDragging, setIsDragging] = useState(false);
```

### **Drag Handler:**
```typescript
const handleDragStart = (e: React.MouseEvent) => {
  // Only from header, not buttons/inputs
  if (target.closest('button') || target.closest('input')) return;
  
  setIsDragging(true);
  dragStartPos.current = {
    x: e.clientX - position.x,
    y: e.clientY - position.y
  };
};
```

### **Viewport Constraints:**
```typescript
const maxX = window.innerWidth - 400;  // min width
const maxY = window.innerHeight - 300; // min height

setPosition({
  x: Math.max(0, Math.min(newX, maxX)),
  y: Math.max(0, Math.min(newY, maxY))
});
```

### **CSS Positioning:**
```css
position: fixed;
left: ${position.x}px;
top: ${position.y}px;
z-index: 50;
cursor: isDragging ? 'grabbing' : 'default';
```

---

## 📋 **Comparison**

| Feature | Modal Overlay | Draggable Panel |
|---------|---------------|-----------------|
| **Canvas visibility** | ❌ Blocked | ✅ Visible |
| **Reference workflow** | ❌ Can't see | ✅ Can see |
| **Position** | ⚠️ Fixed center | ✅ Anywhere |
| **Multi-tasking** | ❌ Blocked | ✅ Possible |
| **Context** | ❌ Lost | ✅ Maintained |
| **Workflow** | ⚠️ Switch views | ✅ Side-by-side |

---

## 🚀 **Benefits**

### **1. Better Context**
- ✅ See what you're editing
- ✅ Reference state names
- ✅ Check existing transitions
- ✅ Understand flow

### **2. Improved Workflow**
- ✅ No view switching
- ✅ Edit in context
- ✅ Position conveniently
- ✅ Faster editing

### **3. Professional UX**
- ✅ Modern design
- ✅ Smooth interactions
- ✅ Intuitive controls
- ✅ Polished feel

### **4. Flexibility**
- ✅ Drag anywhere
- ✅ Resize as needed
- ✅ Adapt to workflow
- ✅ Personal preference

---

## 🎨 **Design Decisions**

### **1. No Backdrop**
**Why:** Keep canvas visible for reference
**Benefit:** Edit with full context

### **2. Draggable Header**
**Why:** Standard pattern (like OS windows)
**Benefit:** Familiar interaction

### **3. Default Position (100, 100)**
**Why:** Top-left but not edge
**Benefit:** Visible but not blocking

### **4. Viewport Constraints**
**Why:** Prevent panel from going off-screen
**Benefit:** Always accessible

### **5. Lime Border**
**Why:** Matches workflow theme
**Benefit:** Visual consistency

---

## 📝 **Files Modified**

### **TransitionEditor.tsx**
- ✅ Removed backdrop overlay
- ✅ Added dragging state
- ✅ Added drag handlers
- ✅ Added position state
- ✅ Changed to fixed positioning
- ✅ Added viewport constraints
- ✅ Updated header styling
- ✅ Added Escape key handler
- ✅ Made header draggable

---

## 🌟 **Result**

**Your transition editor is now a draggable floating panel!**

- 🖱️ **Drag from header** - Position anywhere
- 👁️ **Canvas visible** - See workflow behind
- 📏 **Resizable** - Adjust size as needed
- 🎨 **Lime theme** - Matches workflow
- ⌨️ **Escape to close** - Quick exit
- 💪 **No backdrop** - Full canvas access
- 🎯 **Context aware** - Edit with reference
- ✨ **Professional** - Modern floating panel

**Edit transitions while viewing your workflow!** 🎉✨

