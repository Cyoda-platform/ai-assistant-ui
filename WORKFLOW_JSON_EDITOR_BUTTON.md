# Workflow Canvas - JSON Editor Button ✨

## Summary
Added a **JSON Editor button** to the workflow canvas controls that opens a full-featured Monaco editor for editing the entire workflow configuration!

---

## 🎯 **Features**

### **1. JSON Editor Button**
- 📝 **FileJson icon** - Clearly indicates JSON editing
- 💚 **Highlighted when active** - Lime/emerald gradient when editor is open
- 🎨 **Positioned first** - Easy access before export/import buttons

### **2. Full-Featured Monaco Editor**
- 🎨 **Professional editor** - Same editor used in VS Code
- ✅ **Schema validation** - Real-time validation against workflow schema
- 💡 **IntelliSense** - Auto-complete for fields and values
- 🔍 **Minimap** - Navigate large workflows easily
- 🎯 **Error detection** - Highlights invalid JSON and schema violations
- 📏 **Line numbers** - Easy reference and navigation
- 🌈 **Syntax highlighting** - Color-coded JSON structure

### **3. Smart Workflow Updates**
- 🔄 **Preserves positions** - Existing node positions are maintained
- ➕ **Auto-layout new states** - New states get default positions
- 🗑️ **Removes deleted states** - Cleans up removed states from layout
- ⚡ **Live updates** - Changes apply immediately to canvas

---

## 🎨 **User Interface**

### **Control Buttons (Top-Right):**
```
┌─────────────────────────────┐
│  📝  JSON Editor (NEW!)     │
│  ⬇️  Export JSON            │
│  ⬆️  Import JSON            │
│  🔀  Auto Layout            │
│  ❓  Quick Help             │
└─────────────────────────────┘
```

### **JSON Editor Modal:**
```
┌────────────────────────────────────────────┐
│  { }  Workflow JSON Editor            [X] │
│       Edit the complete workflow config    │
├────────────────────────────────────────────┤
│                                            │
│  {                                         │
│    "version": "1.0",                       │
│    "name": "Order Processing",             │
│    "initialState": "initial_state",        │
│    "states": {                             │
│      "initial_state": {                    │
│        "transitions": [...]                │
│      }                                     │
│    }                                       │
│  }                                         │
│                                            │
├────────────────────────────────────────────┤
│  💡 Tip: Changes preserve node positions   │
│                          [Save Changes] 💚 │
└────────────────────────────────────────────┘
```

---

## 📋 **How to Use**

### **Open JSON Editor:**
1. Click the **📝 JSON Editor** button (first button in controls)
2. Full-screen modal opens with Monaco editor
3. Current workflow JSON is loaded

### **Edit Workflow:**
1. Edit any part of the workflow JSON
2. Real-time validation shows errors
3. IntelliSense suggests valid fields
4. Schema validation ensures correctness

### **Save Changes:**
1. Click **Save Changes** button
2. Workflow updates on canvas
3. Existing node positions preserved
4. New states get default positions
5. Modal closes automatically

---

## ✨ **Use Cases**

### **1. Bulk Editing**
```json
// Add processors to multiple transitions at once
"transitions": [
  {
    "name": "transition1",
    "processors": [/* add here */]
  },
  {
    "name": "transition2",
    "processors": [/* add here */]
  }
]
```

### **2. Copy/Paste States**
```json
// Copy entire state definition
"validate_order": {
  "transitions": [...]
},
// Paste and modify
"validate_payment": {
  "transitions": [...]
}
```

### **3. Global Changes**
```json
// Change all manual transitions to automated
// Find: "manual": true
// Replace: "manual": false
```

### **4. Add Complex Criteria**
```json
"criterion": {
  "type": "group",
  "operator": "AND",
  "conditions": [
    {
      "type": "simple",
      "jsonPath": "$.order.amount",
      "operation": "GREATER_THAN",
      "value": 1000
    },
    {
      "type": "simple",
      "jsonPath": "$.order.status",
      "operation": "EQUALS",
      "value": "approved"
    }
  ]
}
```

---

## 🚀 **Benefits**

| Feature | Visual Editor | JSON Editor |
|---------|--------------|-------------|
| **Quick edits** | ✅ Best | ⚠️ Good |
| **Bulk changes** | ❌ Tedious | ✅ Fast |
| **Copy/paste** | ❌ Limited | ✅ Easy |
| **Complex structures** | ⚠️ Multiple clicks | ✅ Direct |
| **Find/replace** | ❌ No | ✅ Yes |
| **Version control** | ⚠️ Indirect | ✅ Direct |
| **Learning curve** | ✅ Easy | ⚠️ Requires JSON knowledge |

---

## 🎯 **Validation**

### **Required Fields:**
- ✅ `version` - Workflow version
- ✅ `name` - Workflow name
- ✅ `initialState` - Starting state code
- ✅ `states` - At least one state

### **Schema Validation:**
- ✅ **State structure** - Validates state definitions
- ✅ **Transition structure** - Validates transitions
- ✅ **Processor config** - Validates processor settings
- ✅ **Criterion structure** - Validates criteria
- ✅ **Enum values** - Validates executionMode, retryPolicy, etc.

### **Error Messages:**
```
❌ "Missing required fields: version, name, initialState, states"
❌ "States object cannot be empty"
❌ "Invalid JSON: Unexpected token..."
❌ "Property 'executionMode' is not valid. Valid values: 'SYNC', 'ASYNC_NEW_TX', 'ASYNC_SAME_TX'"
```

---

## 💡 **Smart Features**

### **1. Position Preservation**
```typescript
// Existing states keep their positions
existingLayoutStates = workflow.layout.states
  .filter(s => config.states[s.id])

// New states get default positions
newLayoutStates = newStateIds.map((id, i) => ({
  id,
  position: { x: 100 + (i % 3) * 250, y: 100 + Math.floor(i / 3) * 150 }
}))
```

### **2. Transition Cleanup**
```typescript
// Transitions are cleared and recreated from configuration
layout: {
  ...workflow.layout,
  transitions: [] // Recreated from state transitions
}
```

### **3. Version Tracking**
```typescript
// Layout version increments on save
version: workflow.layout.version + 1
updatedAt: new Date().toISOString()
```

---

## 📝 **Files Created/Modified**

### **New File:**
- ✅ `WorkflowJsonEditor.tsx` - Full-featured JSON editor component

### **Modified Files:**
- ✅ `WorkflowCanvas.tsx` - Added button, state, handlers, and editor integration

---

## 🎨 **Design**

### **Color Scheme:**
- 💚 **Lime/Emerald** - Editor theme (matches automated transitions)
- 🔴 **Pink** - Error states
- ⚪ **White/Gray** - Background and text

### **Button States:**
- **Normal:** Gray background
- **Active:** Lime/emerald gradient with border
- **Hover:** Slightly darker

---

## 🌟 **Result**

**Your workflow canvas now has a powerful JSON editor!**

- 📝 **Direct JSON editing** - Edit entire workflow at once
- ✅ **Schema validation** - Real-time error detection
- 💡 **IntelliSense** - Smart auto-completion
- 🔄 **Position preservation** - Existing nodes stay in place
- ⚡ **Fast bulk edits** - Change multiple items quickly
- 🎨 **Professional UI** - Monaco editor with full features
- 💚 **Fashionable design** - Lime/emerald theme

**Perfect for power users who want direct control over workflow JSON!** 🎉✨

