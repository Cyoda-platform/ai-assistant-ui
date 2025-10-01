# Workflow JSON Navigation ✨

## Summary
Added two powerful features:
1. **JSON editor opens by default** when you open the workflow canvas
2. **Click-to-navigate**: Click any node or transition on the canvas to jump to its JSON definition!

---

## 🎯 **New Features**

### **1. JSON Editor Open by Default**
```
Before:
┌────────────────────────────────────┐
│  Canvas (full width)               │
│                                    │
│  ┌─────┐     ┌─────┐             │
│  │State│────▶│State│             │
│  └─────┘     └─────┘             │
│                                    │
└────────────────────────────────────┘
❌ Need to click button to open editor

After:
┌────────────────────────────────────┐
│  Canvas (flex-1)  ┃  JSON Editor   │
│                   ┃                │
│  ┌─────┐  ┌─────┐┃  {             │
│  │State│─▶│State│┃    "states"... │
│  └─────┘  └─────┘┃  }             │
│                   ┃                │
└────────────────────────────────────┘
✅ Editor open immediately
```

### **2. Click-to-Navigate**
```
Click node on canvas → Jump to state in JSON
Click transition → Jump to transition in JSON

With visual highlight! 💚
```

---

## ✨ **How It Works**

### **Opening Canvas:**
1. **Open workflow** in canvas
2. **JSON editor appears** automatically on right
3. **Both visible** side-by-side
4. **Ready to edit** immediately

### **Navigating to State:**
1. **Click any state** node on canvas
2. **JSON editor scrolls** to that state
3. **Line highlights** in lime green
4. **Fade animation** over 2 seconds
5. **Cursor positioned** at state definition

### **Navigating to Transition:**
1. **Click any transition** edge on canvas
2. **JSON editor scrolls** to transition array
3. **Line highlights** in lime green
4. **Shows context** of parent state
5. **Easy to edit** transition

---

## 💡 **Use Cases**

### **Use Case 1: Quick State Editing**
```
Scenario: Need to edit a specific state

1. Canvas opens with JSON editor visible
2. Click the state node
3. JSON jumps to state definition
4. Edit JSON directly
5. See changes on canvas immediately
```

### **Use Case 2: Transition Configuration**
```
Scenario: Configure transition processor

1. Click transition on canvas
2. JSON jumps to transition
3. See full transition config
4. Add processor configuration
5. Changes reflect on canvas
```

### **Use Case 3: Learning Workflow Structure**
```
Scenario: Understanding workflow JSON

1. Canvas and JSON both visible
2. Click different states
3. See how JSON is structured
4. Learn state definitions
5. Understand relationships
```

### **Use Case 4: Debugging**
```
Scenario: Find why transition not working

1. Click problematic transition
2. JSON shows exact definition
3. Check criterion/processor
4. Fix configuration
5. Test immediately
```

---

## 🎨 **Visual Feedback**

### **Highlight Animation:**
```
Line 42: "initial_state": {  ← Highlighted in lime
         ^^^^^^^^^^^^^^^^^^
         Fades over 2 seconds
```

### **Colors:**
- 🟢 **Lime highlight** - rgba(132, 204, 22, 0.2)
- 🟢 **Glyph marker** - rgba(132, 204, 22, 0.5)
- ✨ **Fade animation** - 2 second duration

### **Scroll Behavior:**
- 📍 **Reveal in center** - Target line centered in editor
- 🎯 **Cursor positioned** - At start of definition
- 📜 **Smooth scroll** - Animated transition

---

## 🎯 **Technical Details**

### **State Selection:**
```typescript
const handleNodeClick = (event, node) => {
  setSelectedStateId(node.id);
  setSelectedTransitionId(null);
};
```

### **Transition Selection:**
```typescript
const handleEdgeClick = (event, edge) => {
  setSelectedTransitionId(edge.id);
  setSelectedStateId(null);
};
```

### **JSON Navigation:**
```typescript
useEffect(() => {
  if (!editorRef.current || !selectedStateId) return;

  const editor = editorRef.current;
  const model = editor.getModel();
  
  // Find state in JSON
  const matches = model.findMatches(`"${selectedStateId}"`, ...);
  
  if (matches.length > 0) {
    // Scroll to match
    editor.revealLineInCenter(matches[0].range.startLineNumber);
    
    // Highlight line
    editor.deltaDecorations([], [{
      range: matches[0].range,
      options: {
        isWholeLine: true,
        className: 'highlighted-line'
      }
    }]);
  }
}, [selectedStateId]);
```

### **Highlight CSS:**
```css
.highlighted-line {
  background-color: rgba(132, 204, 22, 0.2) !important;
  animation: highlight-fade 2s ease-out;
}

@keyframes highlight-fade {
  0% { background-color: rgba(132, 204, 22, 0.4); }
  100% { background-color: rgba(132, 204, 22, 0.1); }
}
```

---

## 📋 **Comparison**

| Feature | Before | After |
|---------|--------|-------|
| **Editor visibility** | ⚠️ Hidden by default | ✅ Open by default |
| **Finding state JSON** | ⚠️ Manual search | ✅ Click to jump |
| **Finding transition** | ⚠️ Manual search | ✅ Click to jump |
| **Context** | ❌ Lost | ✅ Maintained |
| **Workflow** | ⚠️ Switch/search | ✅ Click and edit |
| **Learning curve** | ⚠️ Steep | ✅ Intuitive |

---

## 🚀 **Benefits**

### **1. Immediate Access**
- ✅ No button clicking needed
- ✅ JSON visible from start
- ✅ Ready to edit
- ✅ Faster workflow

### **2. Easy Navigation**
- ✅ Click to jump
- ✅ No manual searching
- ✅ Visual feedback
- ✅ Context preserved

### **3. Better Learning**
- ✅ See structure
- ✅ Understand relationships
- ✅ Visual + JSON together
- ✅ Learn by exploring

### **4. Efficient Editing**
- ✅ Quick access
- ✅ Direct editing
- ✅ Immediate feedback
- ✅ Less context switching

---

## 🎨 **User Experience**

### **Opening Workflow:**
```
1. Click workflow to edit
2. Canvas loads with JSON editor visible
3. Both panels ready to use
4. No extra clicks needed
```

### **Editing State:**
```
1. See state on canvas
2. Click state node
3. JSON jumps to state
4. Line highlights
5. Edit JSON
6. See changes on canvas
```

### **Editing Transition:**
```
1. See transition on canvas
2. Click transition edge
3. JSON jumps to transition
4. Line highlights
5. Edit transition config
6. See changes on canvas
```

---

## 📝 **Files Modified**

### **WorkflowCanvas.tsx**
- ✅ Changed `showJsonEditor` default to `true`
- ✅ Added `selectedStateId` state
- ✅ Added `selectedTransitionId` state
- ✅ Added `handleNodeClick` handler
- ✅ Added `handleEdgeClick` handler
- ✅ Added `onNodeClick` to ReactFlow
- ✅ Added `onEdgeClick` to ReactFlow
- ✅ Pass selection to WorkflowJsonEditor

### **WorkflowJsonEditor.tsx**
- ✅ Added `selectedStateId` prop
- ✅ Added `selectedTransitionId` prop
- ✅ Added navigation effect
- ✅ Added highlight CSS
- ✅ Added Monaco find/scroll logic
- ✅ Added decoration for highlight
- ✅ Added 2-second fade animation

---

## 🌟 **Result**

**Your workflow editor now has smart navigation!**

- 📂 **JSON editor open by default** - No extra clicks
- 🎯 **Click to navigate** - Jump to any state/transition
- 💚 **Visual highlight** - See what you clicked
- ✨ **Smooth animation** - Fade over 2 seconds
- 📍 **Centered view** - Target always visible
- 🔄 **Bidirectional** - Canvas ↔ JSON
- 🚀 **Faster workflow** - Less searching
- 💡 **Better learning** - See structure clearly

**Click any node or transition to jump to its JSON!** 🎉✨

