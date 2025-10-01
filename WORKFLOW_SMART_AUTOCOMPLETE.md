# Workflow Smart Autocomplete ✨

## Summary
Added **intelligent context-aware autocomplete** to both the Workflow JSON Editor and Transition Editor with templates, state name suggestions, and snippet completion!

---

## 🎯 **Autocomplete Features**

### **1. Context-Aware Suggestions**
- 🎯 **State names** - Suggests existing states for `initialState` and `next` fields
- 📝 **Templates** - Pre-built snippets for common structures
- 💡 **Smart detection** - Knows what you're typing based on context
- ⚡ **Instant** - Appears as you type

### **2. Template Snippets**
- 🔄 **Transitions** - Complete transition structures
- ⚙️ **Processors** - Processor configurations
- 🎯 **Criteria** - Condition templates (simple, group AND/OR)
- 📦 **States** - New state structures

### **3. Tab Completion**
- ⌨️ **Tab stops** - Jump between fields with Tab
- 🎨 **Placeholders** - Shows what to fill in
- 🔀 **Choices** - Dropdown for enum values
- ✨ **Smart defaults** - Pre-filled common values

---

## 📋 **Workflow JSON Editor Autocomplete**

### **1. State Name Suggestions**

#### **For `initialState` field:**
```json
{
  "initialState": "█"  // ← Type " and get suggestions
}
```

**Suggestions:**
- `initial_state` - Existing state: initial_state
- `process_payment` - Existing state: process_payment
- `fulfill_order` - Existing state: fulfill_order
- ... (all existing states)

#### **For `next` field in transitions:**
```json
{
  "transitions": [
    {
      "next": "█"  // ← Type " and get suggestions
    }
  ]
}
```

**Suggestions:** Same as above (all existing states)

---

### **2. Transition Templates**

#### **Trigger:** Type `[` after `"transitions":`
```json
{
  "transitions": [█  // ← Autocomplete appears
  ]
}
```

#### **Option 1: New Transition**
```json
{
  "name": "transition_name",  // ← Tab stop 1
  "next": "target_state",     // ← Tab stop 2
  "manual": true              // ← Tab stop 3 (true/false dropdown)
}
```

#### **Option 2: Transition with Processor**
```json
{
  "name": "transition_name",           // ← Tab stop 1
  "next": "target_state",              // ← Tab stop 2
  "manual": true,                      // ← Tab stop 3
  "processors": [
    {
      "name": "ProcessorName",         // ← Tab stop 4
      "executionMode": "SYNC",         // ← Tab stop 5 (SYNC/ASYNC_NEW_TX/ASYNC_SAME_TX)
      "config": {
        "calculationNodesTags": "cyoda_application",
        "responseTimeoutMs": 30000     // ← Tab stop 6
      }
    }
  ]
}
```

#### **Option 3: Transition with Criterion**
```json
{
  "name": "transition_name",           // ← Tab stop 1
  "next": "target_state",              // ← Tab stop 2
  "manual": true,                      // ← Tab stop 3
  "criterion": {
    "type": "simple",
    "jsonPath": "$.field.path",        // ← Tab stop 4
    "operation": "EQUALS",             // ← Tab stop 5 (dropdown)
    "value": "value"                   // ← Tab stop 6
  }
}
```

---

### **3. State Template**

#### **Trigger:** Type `:` after a state key in `"states"`
```json
{
  "states": {
    "new_state": █  // ← Autocomplete appears
  }
}
```

#### **Template:**
```json
{
  "transitions": []
}
```

---

## 📋 **Transition Editor Autocomplete**

### **1. State Name Suggestions**

#### **For `next` field:**
```json
{
  "next": "█"  // ← Type " and get suggestions
}
```

**Suggestions:**
- `initial_state` - Target state: initial_state
- `process_payment` - Target state: process_payment
- `fulfill_order` - Target state: fulfill_order
- ... (all states from workflow)

---

### **2. Processor Templates**

#### **Trigger:** Type `[` after `"processors":`
```json
{
  "processors": [█  // ← Autocomplete appears
  ]
}
```

#### **Option 1: New Processor**
```json
{
  "name": "ProcessorName",             // ← Tab stop 1
  "executionMode": "SYNC",             // ← Tab stop 2 (dropdown)
  "config": {
    "calculationNodesTags": "cyoda_application",
    "responseTimeoutMs": 30000         // ← Tab stop 3
  }
}
```

#### **Option 2: Processor with Retry**
```json
{
  "name": "ProcessorName",             // ← Tab stop 1
  "executionMode": "SYNC",             // ← Tab stop 2 (dropdown)
  "config": {
    "calculationNodesTags": "cyoda_application",
    "responseTimeoutMs": 30000,        // ← Tab stop 3
    "retryPolicy": "EXPONENTIAL"       // ← Tab stop 4 (FIXED/EXPONENTIAL/LINEAR)
  }
}
```

---

### **3. Criterion Templates**

#### **Trigger:** Type `{` after `"criterion":`
```json
{
  "criterion": {█  // ← Autocomplete appears
  }
}
```

#### **Option 1: Simple Criterion**
```json
"type": "simple",
"jsonPath": "$.field.path",            // ← Tab stop 1
"operation": "EQUALS",                 // ← Tab stop 2 (dropdown)
"value": "value"                       // ← Tab stop 3
```

#### **Option 2: Group Criterion (AND)**
```json
"type": "group",
"operator": "AND",
"conditions": [
  {
    "type": "simple",
    "jsonPath": "$.field1",            // ← Tab stop 1
    "operation": "EQUALS",
    "value": "value1"                  // ← Tab stop 2
  },
  {
    "type": "simple",
    "jsonPath": "$.field2",            // ← Tab stop 3
    "operation": "EQUALS",
    "value": "value2"                  // ← Tab stop 4
  }
]
```

#### **Option 3: Group Criterion (OR)**
```json
"type": "group",
"operator": "OR",
"conditions": [
  {
    "type": "simple",
    "jsonPath": "$.field1",            // ← Tab stop 1
    "operation": "EQUALS",
    "value": "value1"                  // ← Tab stop 2
  },
  {
    "type": "simple",
    "jsonPath": "$.field2",            // ← Tab stop 3
    "operation": "EQUALS",
    "value": "value2"                  // ← Tab stop 4
  }
]
```

---

## ⌨️ **How to Use**

### **Basic Autocomplete:**
1. **Start typing** in the editor
2. **Autocomplete menu** appears automatically
3. **Arrow keys** to navigate suggestions
4. **Enter** or **Tab** to accept
5. **Esc** to dismiss

### **Template Snippets:**
1. **Type trigger** (e.g., `[` after `"transitions":`)
2. **Select template** from menu
3. **Press Enter** to insert
4. **Tab** to jump between fields
5. **Type values** at each stop
6. **Tab again** to next field

### **Enum Dropdowns:**
1. **Tab to enum field** (e.g., `executionMode`)
2. **Dropdown appears** with choices
3. **Arrow keys** to select
4. **Enter** to choose
5. **Continues** to next tab stop

---

## 💡 **Examples**

### **Example 1: Add Transition with Processor**

**Steps:**
1. In workflow editor, go to state's transitions array
2. Type `[` → Select "Transition with Processor"
3. Tab → Type "payment_success"
4. Tab → Type "fulfill_order"
5. Tab → Select "false"
6. Tab → Type "PaymentProcessor"
7. Tab → Select "ASYNC_NEW_TX"
8. Tab → Type "30000"
9. Done! ✅

**Result:**
```json
{
  "name": "payment_success",
  "next": "fulfill_order",
  "manual": false,
  "processors": [
    {
      "name": "PaymentProcessor",
      "executionMode": "ASYNC_NEW_TX",
      "config": {
        "calculationNodesTags": "cyoda_application",
        "responseTimeoutMs": 30000
      }
    }
  ]
}
```

---

### **Example 2: Add Criterion to Transition**

**Steps:**
1. In transition editor, add `"criterion": {`
2. Autocomplete appears → Select "Simple Criterion"
3. Tab → Type "$.payment.status"
4. Tab → Select "EQUALS"
5. Tab → Type "success"
6. Done! ✅

**Result:**
```json
{
  "criterion": {
    "type": "simple",
    "jsonPath": "$.payment.status",
    "operation": "EQUALS",
    "value": "success"
  }
}
```

---

## 🎯 **Benefits**

| Feature | Before | After |
|---------|--------|-------|
| **State references** | ⚠️ Manual typing | ✅ Autocomplete |
| **Templates** | ❌ Copy/paste | ✅ Built-in snippets |
| **Enum values** | ⚠️ Remember options | ✅ Dropdown choices |
| **Speed** | ⚠️ Slow | ✅ Fast |
| **Errors** | ⚠️ Typos common | ✅ Reduced errors |
| **Learning curve** | ⚠️ Steep | ✅ Guided |

---

## 📝 **Files Modified**

### **WorkflowJsonEditor.tsx**
- ✅ Added custom completion provider
- ✅ State name suggestions for `initialState`
- ✅ State name suggestions for `next` in transitions
- ✅ Transition templates (3 variants)
- ✅ State template

### **TransitionEditor.tsx**
- ✅ Added `workflowConfig` prop
- ✅ Added custom completion provider
- ✅ State name suggestions for `next`
- ✅ Processor templates (2 variants)
- ✅ Criterion templates (3 variants)

### **ChatBotEditorWorkflowNew.tsx**
- ✅ Pass `workflowConfig` to TransitionEditor

---

## 🌟 **Result**

**Your workflow editors now have smart autocomplete!**

- 🎯 **Context-aware** - Knows what you're typing
- 📝 **Templates** - Pre-built structures
- 💡 **State suggestions** - Existing state names
- ⌨️ **Tab completion** - Jump between fields
- 🔀 **Enum dropdowns** - Choose from options
- ⚡ **Fast** - Instant suggestions
- ✅ **Fewer errors** - Guided input
- 🚀 **Professional** - Industry-standard UX

**Type faster, make fewer mistakes, learn as you go!** 🎉✨

