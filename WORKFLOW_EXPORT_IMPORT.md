# Workflow Canvas - Export/Import JSON ✨

## Summary
Added **export and import** functionality for workflow JSON files, allowing you to save workflows to disk and load them back, including the sample workflow!

---

## 🎯 **Features**

### **1. Export Workflow JSON**
- 💾 **Download button** - Export current workflow as JSON file
- 📄 **Clean format** - Pretty-printed with 2-space indentation
- 🏷️ **Auto-naming** - Uses workflow name as filename
- ✅ **Schema-compliant** - Exports valid workflow configuration

### **2. Import Workflow JSON**
- 📤 **Upload button** - Import workflow from JSON file
- ✅ **Validation** - Checks required fields and structure
- 🎨 **Auto-layout** - Automatically arranges imported states
- 🔄 **Replace workflow** - Imports configuration and creates new layout

---

## 🎨 **User Interface**

### **Control Buttons (Top-Right):**
```
┌─────────────────────────────┐
│  ⬇️  Export JSON            │
│  ⬆️  Import JSON            │
│  🔀  Auto Layout            │
│  ❓  Quick Help             │
└─────────────────────────────┘
```

### **Button Order:**
1. **⬇️ Download** - Export workflow as JSON
2. **⬆️ Upload** - Import workflow from JSON
3. **🔀 Network** - Auto-arrange layout
4. **❓ Help** - Toggle quick help

---

## 📋 **How to Use**

### **Export Workflow:**
1. Click the **Download** button (⬇️)
2. Workflow is saved as `{workflow-name}.json`
3. File contains complete workflow configuration
4. Can be shared, versioned, or backed up

### **Import Workflow:**
1. Click the **Upload** button (⬆️)
2. Select a JSON file from your computer
3. Workflow is validated automatically
4. States are auto-arranged on canvas
5. Ready to edit!

---

## 📄 **JSON Format**

### **Exported JSON Structure:**
```json
{
  "version": "1.0",
  "name": "Order Processing Workflow",
  "desc": "Sample workflow for order processing",
  "initialState": "initial_state",
  "active": true,
  "states": {
    "initial_state": {
      "transitions": [
        {
          "name": "start_validation",
          "next": "validate_order",
          "manual": false,
          "processors": [...]
        }
      ]
    },
    "validate_order": {
      "transitions": [...]
    }
  }
}
```

### **Required Fields:**
- ✅ `version` - Workflow version (string)
- ✅ `name` - Workflow name (string)
- ✅ `initialState` - Starting state code (string)
- ✅ `states` - Object with state definitions (object)

### **Optional Fields:**
- ❓ `desc` - Workflow description
- ❓ `active` - Whether workflow is active
- ❓ `criterion` - Global workflow criterion

---

## 🚀 **Use Cases**

### **1. Backup & Version Control**
```bash
# Export workflow
Click Download → saves "my-workflow.json"

# Commit to git
git add my-workflow.json
git commit -m "Updated approval workflow"
```

### **2. Share Workflows**
```bash
# Export and share
Click Download → Email/Slack the JSON file

# Colleague imports
Click Upload → Select received JSON file
```

### **3. Template Library**
```bash
# Create template
Design workflow → Export JSON

# Reuse template
Click Upload → Select template JSON
Modify for new use case
```

### **4. Environment Migration**
```bash
# Development
Design workflow → Export JSON

# Production
Click Upload → Import JSON
Test and deploy
```

---

## 📦 **Sample Workflow**

### **Location:**
`/home/kseniia/IdeaProjects/ai-assistant-ui-new/packages/web/sample-workflow.json`

### **Contents:**
- **Order Processing Workflow**
- 8 states (initial, validate, payment, retry, fulfill, completed, rejected, cancelled)
- Multiple transitions with processors and criteria
- Demonstrates all workflow features

### **To Use:**
1. Click **Upload** button (⬆️)
2. Select `sample-workflow.json`
3. Workflow loads with auto-layout
4. Explore and modify!

---

## ✅ **Validation**

### **Import Validation Checks:**
1. ✅ **Valid JSON** - File must be parseable
2. ✅ **Required fields** - version, name, initialState, states
3. ✅ **Non-empty states** - At least one state required
4. ✅ **Schema compliance** - Matches workflow_schema.json

### **Error Messages:**
```
❌ "Invalid workflow JSON: missing required fields"
❌ "Invalid workflow JSON: states object cannot be empty"
❌ "Error importing workflow: {error details}"
```

---

## 🎨 **Workflow After Import**

### **What Happens:**
1. **Configuration loaded** - All states and transitions imported
2. **Layout cleared** - Old positions removed
3. **Auto-layout applied** - States arranged hierarchically
4. **Canvas updated** - New workflow displayed
5. **History saved** - Can undo if needed

### **Result:**
```
Before Import:          After Import:
┌─────────────┐        ┌─────────────┐
│ Old         │   →    │ New         │
│ Workflow    │        │ Workflow    │
│ (3 states)  │        │ (8 states)  │
└─────────────┘        └─────────────┘
                       Auto-arranged!
```

---

## 🔧 **Technical Details**

### **Export Implementation:**
```typescript
const handleExportJSON = () => {
  const jsonString = JSON.stringify(workflow.configuration, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${workflow.configuration.name}.json`;
  link.click();
};
```

### **Import Implementation:**
```typescript
const handleImportJSON = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    const text = await file.text();
    const config = JSON.parse(text);
    
    // Validate and import
    const newWorkflow = { ...workflow, configuration: config };
    const layoutedWorkflow = autoLayoutWorkflow(newWorkflow);
    onWorkflowUpdate(layoutedWorkflow, 'Imported workflow');
  };
  input.click();
};
```

---

## 📝 **Files Modified**

### **WorkflowCanvas.tsx**
- ✅ Added `Download` and `Upload` icons import
- ✅ Added `handleExportJSON` function
- ✅ Added `handleImportJSON` function
- ✅ Added Export button to Controls
- ✅ Added Import button to Controls

---

## 🌟 **Result**

**Your workflow canvas now supports full JSON export/import!**

- 💾 **Export** - Save workflows as JSON files
- 📤 **Import** - Load workflows from JSON files
- ✅ **Validation** - Automatic schema validation
- 🎨 **Auto-layout** - Imported workflows arranged automatically
- 📦 **Sample included** - Try `sample-workflow.json`
- 🔄 **Version control** - Easy to track changes
- 🤝 **Shareable** - Send workflows to colleagues
- 🎯 **Schema-compliant** - Based on `workflow_schema.json`

**Workflows are now portable, shareable, and version-controllable!** 🎉✨

