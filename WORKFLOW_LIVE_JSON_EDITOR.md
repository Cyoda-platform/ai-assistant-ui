# Workflow Canvas - Live JSON Editor ✨

## Summary
Converted the JSON editor to a **live side-by-side panel** with real-time bidirectional synchronization between JSON and canvas!

---

## 🎯 **Live Editing Concept**

### **Bidirectional Sync:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Canvas Area (flex-1)          │  JSON Editor (600px)      │
│                                │                            │
│  ┌─────────┐     ┌─────────┐  │  {                         │
│  │ State 1 │────▶│ State 2 │  │    "version": "1.0",       │
│  └─────────┘     └─────────┘  │    "states": {             │
│                                │      "state1": {...}       │
│  Edit canvas ──────────────────┼───▶ JSON updates          │
│                                │                            │
│  Canvas updates ◀──────────────┼──── Edit JSON              │
│                                │                            │
│                                │  }                         │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ **Features**

### **1. Live Bidirectional Sync**
- 📝 **Edit JSON** → Canvas updates automatically (500ms debounce)
- 🎨 **Edit Canvas** → JSON updates automatically
- ⚡ **Real-time** → See changes immediately
- 🔄 **Two-way** → Both directions work seamlessly

### **2. Side-by-Side Layout**
- 📏 **Canvas: flex-1** - Takes remaining space
- 📝 **Editor: 600px** - Fixed width panel
- 🚫 **No backdrop** - Both visible at once
- 💪 **No overlay** - Work with both simultaneously

### **3. Auto-Save**
- ⏱️ **500ms debounce** - Prevents excessive updates
- ✅ **Validation** - Only saves valid JSON
- 🔴 **Error display** - Shows validation errors
- 💚 **Live indicator** - Pulsing green dot shows live mode

### **4. Smart Updates**
- 🎯 **Cursor preservation** - Doesn't jump while typing
- 🔄 **Change detection** - Only updates when different
- 🚀 **Performance** - Debounced for efficiency
- 📦 **Position preservation** - Node positions maintained

---

## 🎨 **User Interface**

### **Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ Controls: [📝] [⬇️] [⬆️] [🔀] [❓]                        │
├──────────────────────────────────────────────────────────┤
│                                    │                      │
│  Canvas Area                       │  JSON Editor         │
│                                    │  ┌────────────────┐  │
│  ┌─────┐      ┌─────┐            │  │ { } Editor [X] │  │
│  │State│─────▶│State│            │  ├────────────────┤  │
│  └─────┘      └─────┘            │  │                │  │
│                                    │  │  {             │  │
│  Drag, connect, edit...           │  │    "version".. │  │
│                                    │  │  }             │  │
│                                    │  │                │  │
│                                    │  ├────────────────┤  │
│                                    │  │ 🟢 Live [Close]│  │
│                                    │  └────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### **Footer:**
```
┌────────────────────────────────────┐
│ 🟢 Live Editing: Changes apply     │
│    automatically          [Close]  │
└────────────────────────────────────┘
```

---

## 📋 **How It Works**

### **JSON → Canvas:**
1. User types in JSON editor
2. After 500ms of no typing (debounce)
3. JSON is validated
4. If valid, `onSave()` is called
5. Canvas updates with new configuration
6. Node positions are preserved

### **Canvas → JSON:**
1. User edits canvas (add state, edit transition, etc.)
2. Workflow configuration updates
3. JSON editor detects change
4. JSON text updates (if different)
5. Cursor position preserved

---

## 🚀 **Use Cases**

### **1. Visual + Code Editing**
```
Scenario: Add a new state with complex processors

1. Add state on canvas (visual)
2. Switch to JSON editor
3. Add processors array to the state
4. See state update on canvas
5. Adjust position on canvas
6. Continue editing JSON
```

### **2. Bulk JSON Edits**
```
Scenario: Add same processor to multiple transitions

1. Open JSON editor
2. Find/replace to add processor
3. See all transitions update on canvas
4. Verify visually
5. Make adjustments if needed
```

### **3. Learning Workflow Structure**
```
Scenario: Understand workflow JSON format

1. Open JSON editor
2. Click on canvas elements
3. See corresponding JSON highlight
4. Edit JSON, see visual result
5. Learn by doing
```

### **4. Debugging**
```
Scenario: Fix workflow issues

1. See visual problem on canvas
2. Check JSON structure
3. Fix JSON directly
4. Verify fix on canvas
5. Continue testing
```

---

## 💡 **Technical Details**

### **Debouncing:**
```typescript
// 500ms debounce prevents excessive updates
saveTimeoutRef.current = setTimeout(() => {
  onSave(parsed);
}, 500);
```

### **Change Detection:**
```typescript
// Only update if different (prevents cursor jump)
const newJsonText = JSON.stringify(workflow, null, 2);
if (newJsonText !== jsonText) {
  setJsonText(newJsonText);
}
```

### **Layout:**
```typescript
// Flex layout for side-by-side
<div className="flex">
  <div className="flex-1">Canvas</div>
  {showEditor && <div className="w-[600px]">Editor</div>}
</div>
```

### **Validation:**
```typescript
// Validate before saving
if (!parsed.version || !parsed.name || 
    !parsed.initialState || !parsed.states) {
  setError('Missing required fields');
  return;
}
```

---

## 🎯 **Benefits**

| Feature | Before | After |
|---------|--------|-------|
| **Visibility** | ❌ Modal overlay | ✅ Side-by-side |
| **Canvas access** | ❌ Blocked | ✅ Always visible |
| **JSON → Canvas** | ⚠️ Manual save | ✅ Auto-save |
| **Canvas → JSON** | ❌ No sync | ✅ Live sync |
| **Workflow** | ⚠️ Switch back/forth | ✅ Edit both at once |
| **Learning** | ⚠️ Separate | ✅ See both together |
| **Debugging** | ⚠️ Difficult | ✅ Easy |

---

## ⚡ **Performance**

### **Optimizations:**
1. **500ms debounce** - Prevents update spam while typing
2. **Change detection** - Only updates when actually different
3. **Cursor preservation** - Doesn't reset cursor position
4. **Validation first** - Only saves valid JSON
5. **Position preservation** - Existing nodes keep positions

### **Update Flow:**
```
Type in JSON
    ↓
Wait 500ms (debounce)
    ↓
Validate JSON
    ↓
If valid → Update workflow
    ↓
Canvas re-renders
    ↓
JSON updates (if canvas changed)
```

---

## 🎨 **Design Decisions**

### **1. Width: 600px**
- ✅ Enough for comfortable JSON editing
- ✅ Leaves plenty of canvas space
- ✅ Fits most screens
- ✅ Not too cramped

### **2. No Backdrop**
- ✅ Both areas always visible
- ✅ No modal feel
- ✅ True side-by-side
- ✅ Better workflow

### **3. Auto-Save**
- ✅ No manual save needed
- ✅ Live editing feel
- ✅ Immediate feedback
- ✅ Less friction

### **4. 500ms Debounce**
- ✅ Not too fast (performance)
- ✅ Not too slow (feels responsive)
- ✅ Good balance
- ✅ Industry standard

---

## 📝 **Files Modified**

### **WorkflowJsonEditor.tsx**
- ✅ Removed backdrop overlay
- ✅ Changed to fixed 600px width
- ✅ Added auto-save with debouncing
- ✅ Added live sync from workflow changes
- ✅ Removed Save button (auto-save)
- ✅ Added live indicator (pulsing green dot)
- ✅ Updated footer text

### **WorkflowCanvas.tsx**
- ✅ Changed layout to flex container
- ✅ Canvas area uses flex-1
- ✅ Editor shows conditionally (600px)
- ✅ Side-by-side layout

---

## 🌟 **Result**

**Your workflow editor now has live bidirectional editing!**

- 📝 **Edit JSON** → Canvas updates (500ms)
- 🎨 **Edit Canvas** → JSON updates (instant)
- 👁️ **Both visible** → Side-by-side layout
- ⚡ **Real-time** → See changes immediately
- 💚 **Live indicator** → Pulsing green dot
- 🚫 **No save button** → Auto-save
- 🎯 **Smart updates** → Debounced & validated
- 📏 **Perfect layout** → Canvas (flex) + Editor (600px)

**Edit visually or with code - your choice, both work together!** 🎉✨

