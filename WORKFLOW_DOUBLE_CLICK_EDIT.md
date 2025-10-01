# Workflow Double-Click to Edit ✨

## Summary
Changed transition editing behavior:
- **Single click** → Navigate to JSON (see definition)
- **Double-click** → Open transition editor (edit in modal)

This provides better workflow: quick reference with single click, detailed editing with double-click!

---

## 🎯 **New Behavior**

### **Before:**
```
Click transition → Opens editor modal
                   (blocks canvas view)
```

### **After:**
```
Single click transition → Jump to JSON in side panel
                         (canvas still visible)

Double-click transition → Open editor modal
                         (for detailed editing)
```

---

## ✨ **How It Works**

### **Single Click (Quick Reference):**
```
1. Click transition on canvas
2. JSON editor scrolls to transition
3. Line highlights in lime green
4. Canvas remains visible
5. Quick view of configuration
```

### **Double-Click (Detailed Editing):**
```
1. Double-click transition on canvas
2. Transition editor opens (floating panel)
3. Edit JSON with Monaco editor
4. Autocomplete and validation
5. Save changes
```

---

## 💡 **Use Cases**

### **Use Case 1: Quick Check**
```
Scenario: Just want to see transition config

1. Single click transition
2. JSON shows in side panel
3. See configuration
4. No modal blocking view
5. Continue working
```

### **Use Case 2: Detailed Edit**
```
Scenario: Need to edit processor/criterion

1. Double-click transition
2. Editor opens with full features
3. Autocomplete helps
4. Validation checks
5. Save and close
```

### **Use Case 3: Comparing Transitions**
```
Scenario: Compare multiple transitions

1. Click first transition → See JSON
2. Click second transition → See JSON
3. Compare configurations
4. No modals blocking
5. Quick comparison
```

### **Use Case 4: Learning Structure**
```
Scenario: Understanding workflow

1. Click different transitions
2. See JSON structure
3. Learn patterns
4. No interruptions
5. Smooth exploration
```

---

## 🎨 **Visual Feedback**

### **Single Click:**
```
Click → JSON editor scrolls
     → Line highlights (lime green)
     → Fades over 2 seconds
     → Canvas visible
```

### **Double-Click:**
```
Double-click → Floating editor opens
            → Positioned at (100, 100)
            → Draggable and resizable
            → Canvas visible behind
```

### **Hover:**
```
Hover transition → Tooltip appears
                 → "Double-click to edit transition"
                 → Visual cue
```

---

## 🎯 **Comparison**

| Action | Before | After |
|--------|--------|-------|
| **Single click** | ⚠️ Opens editor | ✅ Jump to JSON |
| **Double-click** | ❌ Same as click | ✅ Opens editor |
| **Quick reference** | ⚠️ Opens modal | ✅ Side panel |
| **Detailed edit** | ✅ Modal editor | ✅ Modal editor |
| **Canvas visibility** | ❌ Blocked | ✅ Always visible |
| **Workflow** | ⚠️ Interrupting | ✅ Smooth |

---

## 🚀 **Benefits**

### **1. Better Workflow**
- ✅ Quick reference without modal
- ✅ Detailed editing when needed
- ✅ Less interruption
- ✅ Faster navigation

### **2. Canvas Always Visible**
- ✅ Single click doesn't block
- ✅ See context while viewing JSON
- ✅ Compare transitions easily
- ✅ Better spatial awareness

### **3. Intuitive Interaction**
- ✅ Standard pattern (single = select, double = edit)
- ✅ Tooltip guides users
- ✅ Familiar behavior
- ✅ Easy to learn

### **4. Efficient Editing**
- ✅ Quick checks with single click
- ✅ Full editor when needed
- ✅ No unnecessary modals
- ✅ Task-appropriate tools

---

## 📋 **Interaction Patterns**

### **States:**
```
Single click → Jump to JSON
Double-click → (no action, use inline editor)
```

### **Transitions:**
```
Single click → Jump to JSON
Double-click → Open transition editor
```

### **Canvas:**
```
Single click → Deselect
Double-click → Add new state
```

---

## 🎨 **User Experience Flow**

### **Exploring Workflow:**
```
1. Open workflow canvas
2. JSON editor visible on right
3. Click different transitions
4. JSON jumps to each one
5. Learn structure quickly
6. No modals interrupting
```

### **Editing Transition:**
```
1. Find transition on canvas
2. Single click → See JSON
3. Check current config
4. Double-click → Open editor
5. Edit with full features
6. Save changes
7. See updates on canvas
```

### **Comparing Configurations:**
```
1. Click transition A → See JSON
2. Note configuration
3. Click transition B → See JSON
4. Compare side-by-side
5. No modal switching
6. Efficient comparison
```

---

## 📝 **Files Modified**

### **TransitionEdge.tsx**
- ✅ Changed `handleClick` to `handleDoubleClick`
- ✅ Changed `onClick` to `onDoubleClick`
- ✅ Added tooltip: "Double-click to edit transition"

### **LoopbackEdge.tsx**
- ✅ Changed `handleClick` to `handleDoubleClick`
- ✅ Changed `onClick` to `onDoubleClick`
- ✅ Added tooltip: "Double-click to edit transition"

### **WorkflowCanvas.tsx**
- ✅ Updated Quick Help text
- ✅ "Click state/transition → jump to JSON"
- ✅ "Double-click transition → open editor"

---

## 🎯 **Technical Details**

### **Single Click (ReactFlow):**
```typescript
// Handled by ReactFlow's onEdgeClick
const handleEdgeClick = (event, edge) => {
  setSelectedTransitionId(edge.id);
  setSelectedStateId(null);
  // JSON editor navigates automatically
};
```

### **Double-Click (Edge Component):**
```typescript
// Handled by edge component
const handleDoubleClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (transition && onEdit) {
    onEdit(transition.id);
  }
};
```

### **Event Propagation:**
```
Double-click → Edge label catches it
            → Stops propagation
            → Opens editor
            → ReactFlow doesn't see it

Single click → Edge label doesn't catch
            → Propagates to ReactFlow
            → onEdgeClick fires
            → JSON navigation
```

---

## 💡 **Design Decisions**

### **1. Single Click = View**
**Why:** Quick, non-intrusive reference
**Benefit:** Fast navigation, no modals

### **2. Double-Click = Edit**
**Why:** Standard pattern for "open"
**Benefit:** Familiar, intentional action

### **3. Tooltip Guidance**
**Why:** Users need to discover double-click
**Benefit:** Self-documenting interface

### **4. Canvas Always Visible**
**Why:** Context is important
**Benefit:** Better spatial awareness

---

## 🌟 **Result**

**Your workflow editor now has smart click behavior!**

- 👆 **Single click** - Jump to JSON (quick reference)
- 👆👆 **Double-click** - Open editor (detailed editing)
- 👁️ **Canvas visible** - Always see context
- 💚 **Lime highlight** - Visual feedback
- 🎯 **Intuitive** - Standard interaction pattern
- ⚡ **Efficient** - Right tool for the task
- 💡 **Tooltip** - Guides users
- ✨ **Smooth** - No unnecessary interruptions

**Single click to view, double-click to edit!** 🎉✨

