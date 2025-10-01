# Workflow Schema Validation ✨

## Summary
Added comprehensive schema validation to both the **Workflow JSON Editor** and **Transition Editor** with real-time error detection, IntelliSense, and helpful error messages!

---

## 🎯 **Validation Features**

### **1. Real-Time Validation**
- ✅ **Syntax checking** - JSON format validation
- ✅ **Schema validation** - Field requirements and types
- ✅ **Business logic** - Workflow-specific rules
- ✅ **IntelliSense** - Auto-complete suggestions
- ✅ **Error highlighting** - Red squiggles in editor

### **2. Helpful Error Messages**
- 🔴 **Specific errors** - Tells you exactly what's wrong
- 📍 **Location info** - Shows which field/state/transition
- 💡 **Suggestions** - Hints on how to fix
- 🎯 **Clear language** - No cryptic messages

### **3. Monaco Editor Integration**
- 📝 **Schema-aware** - Knows workflow structure
- 💚 **Auto-complete** - Suggests valid values
- 🎨 **Syntax highlighting** - Color-coded JSON
- ⚡ **Instant feedback** - See errors as you type

---

## 📋 **Validation Rules**

### **Workflow Level (Main JSON Editor)**

#### **Required Fields:**
```json
{
  "version": "string (non-empty)",
  "name": "string (non-empty)",
  "initialState": "string (must exist in states)",
  "states": "object (at least one state)"
}
```

#### **Validation Checks:**
1. ✅ `version` - Must be non-empty string
2. ✅ `name` - Must be non-empty string
3. ✅ `initialState` - Must be non-empty string AND exist in states
4. ✅ `states` - Must be object with at least one state
5. ✅ Each state must have `transitions` array
6. ✅ Each transition must have `name`, `next`, `manual`

#### **Example Errors:**
```
❌ Field "version" is required and must be a non-empty string
❌ Initial state "start" does not exist in states object
❌ State "process_payment" must have a "transitions" array
❌ State "initial", transition 1: "manual" is required and must be a boolean
```

---

### **Transition Level (Transition Editor)**

#### **Required Fields:**
```json
{
  "name": "string (non-empty)",
  "next": "string (non-empty, target state)",
  "manual": "boolean"
}
```

#### **Optional Fields:**
```json
{
  "disabled": "boolean",
  "processors": [
    {
      "name": "string (non-empty)",
      "executionMode": "SYNC | ASYNC_NEW_TX | ASYNC_SAME_TX",
      "config": {
        "calculationNodesTags": "cyoda_application",
        "responseTimeoutMs": "integer (>= 0)",
        "retryPolicy": "FIXED | EXPONENTIAL | LINEAR"
      }
    }
  ],
  "criterion": {
    "type": "simple | group | function",
    "jsonPath": "string (e.g., $.payment.status)",
    "operation": "EQUALS | GREATER_THAN | ...",
    "value": "string | number | boolean"
  }
}
```

#### **Validation Checks:**
1. ✅ `name` - Must be non-empty string
2. ✅ `next` - Must be non-empty string (target state)
3. ✅ `manual` - Must be boolean (true/false)
4. ✅ `processors[].name` - Must be non-empty string
5. ✅ `processors[].executionMode` - Must be valid enum
6. ✅ `processors[].config` - Must be object

#### **Example Errors:**
```
❌ Field "name" is required and must be a non-empty string
❌ Field "next" is required and must be a non-empty string (target state code)
❌ Field "manual" is required and must be a boolean (true or false)
❌ Processor 1: "executionMode" must be one of: SYNC, ASYNC_NEW_TX, ASYNC_SAME_TX
❌ Processor 2: "config" is required and must be an object
```

---

## 🎨 **IntelliSense Features**

### **Auto-Complete Suggestions:**

#### **Workflow Level:**
```json
{
  "version": "1.0",  // ← Suggests string
  "name": "",        // ← Suggests string
  "initialState": "", // ← Suggests string
  "states": {        // ← Suggests object
    "state1": {
      "transitions": [] // ← Suggests array
    }
  }
}
```

#### **Transition Level:**
```json
{
  "name": "",
  "next": "",
  "manual": true,    // ← Suggests true/false
  "processors": [
    {
      "name": "",
      "executionMode": "SYNC", // ← Suggests: SYNC, ASYNC_NEW_TX, ASYNC_SAME_TX
      "config": {
        "calculationNodesTags": "cyoda_application", // ← Only valid value
        "retryPolicy": "EXPONENTIAL" // ← Suggests: FIXED, EXPONENTIAL, LINEAR
      }
    }
  ]
}
```

### **Hover Documentation:**
- 📖 **Field descriptions** - Hover over field name
- 💡 **Value hints** - Hover over value
- 🎯 **Enum options** - Shows all valid values
- ⚡ **Examples** - Shows example values

---

## 🔍 **Error Detection**

### **Visual Indicators:**

#### **In Editor:**
```json
{
  "version": "",  // ← Red squiggle: must be non-empty
  "name": "Test",
  "initialState": "missing_state", // ← Red squiggle: doesn't exist
  "states": {}    // ← Red squiggle: must have at least one state
}
```

#### **Error Panel:**
```
┌────────────────────────────────────────┐
│ ⚠️ Field "version" is required and     │
│    must be a non-empty string          │
└────────────────────────────────────────┘
```

### **Error Types:**

1. **Syntax Errors:**
   - Missing comma
   - Unclosed bracket
   - Invalid JSON

2. **Schema Errors:**
   - Missing required field
   - Wrong type (string vs number)
   - Invalid enum value

3. **Business Logic Errors:**
   - Initial state doesn't exist
   - Empty states object
   - Missing transitions array

---

## 💡 **Schema Descriptions**

### **Workflow Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | ✅ | Workflow version (e.g., "1.0") |
| `name` | string | ✅ | Workflow name |
| `desc` | string | ❌ | Workflow description |
| `initialState` | string | ✅ | Initial state code (must exist in states) |
| `active` | boolean | ❌ | Whether workflow is active |
| `states` | object | ✅ | Map of state codes to state definitions |

### **Transition Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Transition name (unique within state) |
| `next` | string | ✅ | Target state code |
| `manual` | boolean | ✅ | Manual (true) or automatic (false) |
| `disabled` | boolean | ❌ | Whether transition is disabled |
| `processors` | array | ❌ | Processors to execute |
| `criterion` | object | ❌ | Condition for execution |

### **Processor Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Processor name |
| `executionMode` | enum | ✅ | SYNC, ASYNC_NEW_TX, ASYNC_SAME_TX |
| `config` | object | ✅ | Processor configuration |
| `config.calculationNodesTags` | string | ✅ | "cyoda_application" |
| `config.responseTimeoutMs` | integer | ❌ | Timeout in milliseconds (≥ 0) |
| `config.retryPolicy` | enum | ❌ | FIXED, EXPONENTIAL, LINEAR |

### **Criterion Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | enum | ✅ | simple, group, function |
| `jsonPath` | string | ⚠️ | Required for simple (e.g., "$.status") |
| `operation` | enum | ⚠️ | Required for simple (EQUALS, etc.) |
| `value` | any | ⚠️ | Required for simple (comparison value) |
| `operator` | enum | ⚠️ | Required for group (AND, OR) |
| `conditions` | array | ⚠️ | Required for group (sub-conditions) |

---

## 🚀 **How It Works**

### **Workflow JSON Editor:**

1. **Type in editor**
2. **Monaco validates** against schema
3. **Red squiggles** appear for errors
4. **Error panel** shows specific message
5. **After 500ms** of no typing
6. **Additional validation** runs
7. **If valid** → Auto-saves to canvas
8. **If invalid** → Shows error, no save

### **Transition Editor:**

1. **Type in editor**
2. **Monaco validates** against schema
3. **Red squiggles** appear for errors
4. **Error panel** shows specific message
5. **Save button** disabled if invalid
6. **Click Save** (when valid)
7. **Additional validation** runs
8. **If valid** → Saves and closes
9. **If invalid** → Shows error, stays open

---

## 🌟 **Result**

**Your workflow editors now have comprehensive validation!**

- 📝 **Real-time** - See errors as you type
- 🔴 **Specific** - Know exactly what's wrong
- 💡 **Helpful** - Get suggestions to fix
- 🎨 **Visual** - Red squiggles and error panels
- ⚡ **IntelliSense** - Auto-complete everything
- 📖 **Documentation** - Hover for help
- ✅ **Comprehensive** - Validates everything
- 🚀 **Professional** - Industry-standard validation

**Edit with confidence - the editor guides you every step!** 🎉✨

