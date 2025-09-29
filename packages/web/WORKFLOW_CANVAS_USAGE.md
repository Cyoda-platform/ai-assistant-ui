# Workflow Canvas Usage Guide

## Overview

The enhanced workflow canvas provides a comprehensive visual editor for creating and managing state machine workflows with full schema validation.

## Features

### ✅ Implemented Features

1. **Schema-Compliant Validation**
   - Real-time validation against `workflow_schema.json`
   - Error and warning messages with detailed paths
   - Visual validation status indicator

2. **Enhanced Node Visualization**
   - Color-coded states:
     - 🟢 **Teal** (#14B8A6) - Initial state
     - 🔵 **Blue** (#3B82F6) - Normal state
     - 🟢 **Green** (#10B981) - Terminal state
   - Transition count badges
   - Manual/automatic transition indicators
   - Processor and criteria icons

3. **Rich Edge Display**
   - Transition names as labels
   - Color-coded edges (blue: auto, orange: manual, purple: conditional)
   - Dashed lines for manual transitions
   - Animated automatic transitions
   - Detailed tooltips with processor and criteria info

4. **Workflow Statistics Panel**
   - Total states, transitions, terminal states
   - Processor count
   - Conditional transitions
   - Manual vs automatic breakdown
   - Validation status with expandable errors/warnings

5. **Interactive Controls**
   - Zoom in/out
   - Lock/unlock interaction
   - Fit to view
   - Undo/redo
   - Reset position
   - Toggle layout direction (horizontal/vertical)
   - Add new state

## How to Use

### 1. Loading a Workflow

The editor automatically initializes with an empty workflow. To load your own workflow:

**Option A: Paste JSON directly**
```javascript
// In the JSON editor (left panel), paste your workflow JSON
{
  "version": "1.0",
  "name": "My Workflow",
  "initialState": "initial_state",
  "states": {
    "initial_state": {
      "transitions": []
    }
  }
}
```

**Option B: Use the component API**
```typescript
// Get reference to the editor component
const editorRef = useRef();

// Set workflow data programmatically
editorRef.current?.setWorkflowData({
  canvasData: workflowJson,
  workflowMetaData: metadata
});
```

### 2. Sample Workflow

A complete sample workflow is provided in `sample-workflow.json`. This demonstrates:
- Initial state with processor
- Validation with conditional transitions
- Payment processing with retry logic
- Multiple processors per transition
- Terminal states (completed, rejected, cancelled)

To use the sample:
1. Open `sample-workflow.json`
2. Copy the entire JSON content
3. Paste into the JSON editor panel
4. The canvas will automatically render the workflow

### 3. Creating a New Workflow

**Minimum Required Structure:**
```json
{
  "version": "1.0",
  "name": "Workflow Name",
  "initialState": "initial_state",
  "states": {
    "initial_state": {
      "transitions": []
    }
  }
}
```

**Adding States:**
1. Click the "+" button in the canvas controls
2. Or manually add to JSON:
```json
"new_state": {
  "transitions": []
}
```

**Adding Transitions:**
```json
"transitions": [
  {
    "name": "transition_name",
    "next": "target_state",
    "manual": false
  }
]
```

### 4. Adding Processors

Processors execute logic during transitions:

```json
"processors": [
  {
    "name": "ProcessorName",
    "executionMode": "SYNC",
    "config": {
      "calculationNodesTags": "cyoda_application",
      "attachEntity": true,
      "responseTimeoutMs": 30000,
      "retryPolicy": "EXPONENTIAL"
    }
  }
]
```

**Execution Modes:**
- `SYNC` - Synchronous execution
- `ASYNC_NEW_TX` - Asynchronous with new transaction
- `ASYNC_SAME_TX` - Asynchronous in same transaction

**Retry Policies:**
- `FIXED` - Fixed interval retry
- `EXPONENTIAL` - Exponential backoff
- `LINEAR` - Linear increase

### 5. Adding Criteria (Conditions)

**Simple Criterion:**
```json
"criterion": {
  "type": "simple",
  "jsonPath": "$.field.path",
  "operation": "EQUALS",
  "value": "expected_value"
}
```

**Operations:**
- `EQUALS`
- `GREATER_THAN`
- `GREATER_OR_EQUAL`
- `LESS_THAN`
- `LESS_OR_EQUAL`
- `NOT_EQUALS`

**Group Criterion (Multiple Conditions):**
```json
"criterion": {
  "type": "group",
  "operator": "AND",
  "conditions": [
    {
      "type": "simple",
      "jsonPath": "$.status",
      "operation": "EQUALS",
      "value": "active"
    },
    {
      "type": "simple",
      "jsonPath": "$.amount",
      "operation": "GREATER_THAN",
      "value": 100
    }
  ]
}
```

### 6. View Modes

Toggle between three view modes using the buttons at the top:

- **Editor Only** - JSON editor fills the screen
- **Preview Only** - Canvas fills the screen
- **Split View** - Both editor and canvas visible (default)

### 7. Validation

The editor validates your workflow in real-time:

**Validation Status Indicator** (top-right of canvas):
- ✅ Green "Valid" - No errors or warnings
- ⚠️ Yellow badge - Warnings present
- ❌ Red badge - Errors present

**Viewing Errors/Warnings:**
1. Check the Statistics Panel (bottom of left panel)
2. Expand "View Errors" or "View Warnings"
3. Each error shows the path and message

**Common Validation Errors:**
- Missing required fields (version, name, initialState, states)
- Invalid initialState value (must be "initial_state")
- Transitions array not present
- Missing transition properties (name, next, manual)
- Invalid state references in "next" field
- Invalid processor executionMode
- Invalid criterion type or operation

### 8. Keyboard Shortcuts

- **Ctrl/Cmd + Z** - Undo
- **Ctrl/Cmd + Shift + Z** - Redo
- **Ctrl/Cmd + S** - Save (if save button is visible)

### 9. Canvas Controls

**Zoom & Pan:**
- Mouse wheel to zoom
- Click and drag to pan
- Use zoom buttons for precise control

**Lock/Unlock:**
- Lock prevents accidental node movement
- Unlock allows repositioning nodes

**Layout Direction:**
- Toggle between horizontal and vertical layouts
- Workflow automatically re-layouts

**Fit to View:**
- Centers and scales workflow to fit canvas

**Reset Position:**
- Returns to default zoom and position

## Troubleshooting

### Issue: JSON won't parse
**Solution:** Check for:
- Missing commas between properties
- Trailing commas (not allowed in JSON)
- Unquoted property names
- Single quotes instead of double quotes

### Issue: Validation errors
**Solution:** 
- Check the Statistics Panel for detailed error messages
- Ensure all required fields are present
- Verify state references are correct
- Check that initialState is "initial_state"

### Issue: Canvas not rendering
**Solution:**
- Ensure JSON is valid
- Check that states object is not empty
- Verify initialState exists in states

### Issue: Can't insert JSON
**Solution:**
- Make sure you're in Editor or Split View mode
- Click in the editor panel to focus it
- Use Ctrl/Cmd + A to select all, then paste
- Or use the component's `setWorkflowData` method

## Best Practices

1. **Start Simple** - Begin with a basic workflow and add complexity gradually
2. **Validate Often** - Check validation status after each change
3. **Use Descriptive Names** - Name states and transitions clearly
4. **Document with desc** - Use the description field for workflow documentation
5. **Test Transitions** - Verify all state references are correct
6. **Use Manual Transitions** - For user-triggered actions
7. **Add Processors** - For business logic execution
8. **Use Criteria** - For conditional branching

## API Reference

### Component Props

```typescript
interface ChatBotEditorWorkflowProps {
  technicalId: string;
  onAnswer: (data: { answer: string; file?: File }) => void;
  onUpdate: (data: { canvasData: string; workflowMetaData: any }) => void;
}
```

### Component Methods (via ref)

```typescript
// Set workflow data
editorRef.current.setWorkflowData({
  canvasData: string | object,
  workflowMetaData: object
});

// Get current workflow data
const data = editorRef.current.getWorkflowData();
// Returns: { canvasData: string, workflowMetaData: object }
```

## Related Documentation

- `WORKFLOW_BUSINESS_REQUIREMENTS.md` - Complete business requirements
- `WORKFLOW_REQUIREMENTS.md` - Technical specifications
- `WORKFLOW_IMPLEMENTATION_GUIDE.md` - Implementation details
- `WORKFLOW_JSON_EXAMPLES.md` - More JSON examples
- `workflow_schema.json` - JSON schema definition
- `sample-workflow.json` - Complete working example

## Support

For issues or questions:
1. Check validation errors in the Statistics Panel
2. Review the sample workflow for reference
3. Consult the schema documentation
4. Check browser console for detailed error logs

