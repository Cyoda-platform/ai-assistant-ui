# ✅ Add & Delete Nodes with Auto JSON Update!

## 🎯 What's New

### 1. ✅ Add New Instances from Group Nodes

**Feature**: Click the **+** button on any group node to add a new instance.

**Group nodes with add buttons**:
- **Environments Group** → Add new environment
- **Entities Group** → Add new entity
- **Workflows Group** → Add new workflow to that entity

**How it works**:
1. Click **+** button on group node
2. New instance is created with default values
3. JSON is automatically updated
4. Canvas refreshes with new node
5. New node appears in the group

### 2. ✅ Delete Nodes with Backspace/Delete

**Feature**: Select node(s) and press **Backspace** or **Delete** to remove them.

**Cascade deletion**:
- Deleting a **parent node** deletes all its **children**
- Deleting an **entity** deletes all its **workflows**
- Deleting a **group** is not allowed (only instances)
- Deleting the **app node** is not allowed

**How it works**:
1. Click to select one or more nodes
2. Press **Backspace** or **Delete** key
3. Node and all children are removed
4. JSON is automatically updated
5. Canvas refreshes without deleted nodes

### 3. ✅ Automatic JSON Synchronization

**All changes update JSON immediately**:
- Adding new instances → JSON updated
- Deleting nodes → JSON updated
- Changes are reflected in JSON editor
- No manual save needed

## 🎨 Visual Features

### Add Button on Group Nodes

**Appearance**:
- **+** icon in top-right corner of group nodes
- Hover effect with color transition
- Tooltip shows what will be added
- Only appears on group nodes (not regular nodes)

**Colors**:
- Environments Group: Green hover
- Entities Group: Blue hover
- Workflows Group: Orange hover

### Selection & Deletion

**Visual feedback**:
- Selected nodes have highlight border
- Multiple selection with Ctrl/Cmd + Click
- Backspace/Delete works on all selected nodes
- Children are automatically included

## 🔧 Technical Details

### Add New Instance

```typescript
// Click + button on Environments Group
handleAddNewInstance('environments')
  ↓
// Creates new environment
{
  name: 'new-environment-1',
  url: 'https://example.com',
  status: 'inactive'
}
  ↓
// Adds to JSON
updatedData.app.environments.push(newEnv)
  ↓
// Updates state
setCurrentAppData(updatedData)
  ↓
// Canvas refreshes with new node
```

### Delete Node with Cascade

```typescript
// Select entity node and press Backspace
handleDeleteNodes(['entity-pet-v1'])
  ↓
// Find all children (workflows)
nodesToDelete = ['entity-pet-v1', 'workflow-pet-adoption', 'group-workflows-entity-pet-v1']
  ↓
// Remove from JSON
updatedData.app.entities.splice(index, 1)
  ↓
// Updates state
setCurrentAppData(updatedData)
  ↓
// Canvas refreshes without deleted nodes
```

### Default Values for New Instances

**New Environment**:
```json
{
  "name": "new-environment-1",
  "url": "https://example.com",
  "status": "inactive"
}
```

**New Entity**:
```json
{
  "name": "new-entity-1",
  "version": "1",
  "description": "New entity",
  "cyoda_url": "https://example.com",
  "github_url": "https://github.com",
  "model": {},
  "workflows": []
}
```

**New Workflow**:
```json
{
  "name": "new-workflow-1",
  "cyoda_url": "https://example.com",
  "github_url": "https://github.com",
  "config": {
    "states": {
      "initial": {
        "transitions": []
      }
    }
  }
}
```

## 🎮 How to Use

### Add New Instance

1. **Find a group node**:
   - Environments Group (dark green)
   - Entities Group (dark blue)
   - Workflows Group (dark orange)

2. **Click the + button** in top-right corner

3. **New instance appears**:
   - With default name (e.g., "new-environment-1")
   - Connected to the group
   - Visible in JSON editor

4. **Edit the new instance**:
   - Click the node → JSON editor navigates to it
   - Edit name, properties, etc.
   - Save changes

### Delete Nodes

1. **Select node(s)**:
   - Click to select one node
   - Ctrl/Cmd + Click for multiple nodes
   - Selected nodes have highlight

2. **Press Backspace or Delete**

3. **Confirm deletion** (if prompted)

4. **Node and children removed**:
   - Deleted from canvas
   - Removed from JSON
   - Edges automatically cleaned up

### Cascade Deletion Examples

**Delete Entity**:
```
Before:
  Entity: pet v1
    └── Workflows Group
        └── Workflow: pet adoption

After pressing Backspace on entity:
  (All deleted)
```

**Delete Workflow**:
```
Before:
  Entity: pet v1
    └── Workflows Group
        └── Workflow: pet adoption

After pressing Backspace on workflow:
  Entity: pet v1
    └── Workflows Group
        (workflow deleted, entity remains)
```

## 🚫 Protected Nodes

**Cannot delete**:
- ❌ **App Node** - Root node, cannot be deleted
- ❌ **Group Nodes** - Delete instances instead

**Attempting to delete protected nodes**:
- Shows alert message
- No changes made
- JSON remains unchanged

## ✅ Build Status

```bash
✓ built in 15.21s
```

## 🚀 Test It

### Test Adding Instances

1. `npm run dev`
2. Go to **Apps tab**
3. **Find Environments Group** (dark green)
4. **Click + button**
5. ✅ New environment appears: "new-environment-1"
6. ✅ JSON editor shows new environment
7. **Click the new node** → JSON navigates to it
8. **Edit name** in JSON editor
9. **Save** → Canvas updates

### Test Deleting Nodes

1. **Click an environment node** (green)
2. **Press Backspace**
3. ✅ Environment deleted
4. ✅ JSON updated (environment removed)
5. ✅ Canvas refreshes

### Test Cascade Deletion

1. **Click an entity node** (blue)
2. **Press Delete**
3. ✅ Entity deleted
4. ✅ All workflows under entity deleted
5. ✅ Workflows group deleted
6. ✅ JSON updated (entity + workflows removed)

### Test Multiple Selection

1. **Click environment 1**
2. **Ctrl + Click environment 2**
3. **Press Backspace**
4. ✅ Both environments deleted
5. ✅ JSON updated

## 🎉 Summary

✅ **Add Button on Groups** - Click + to add new instances
✅ **Default Values** - New instances have sensible defaults
✅ **Backspace/Delete** - Remove selected nodes
✅ **Cascade Deletion** - Parents delete all children
✅ **Protected Nodes** - App and groups cannot be deleted
✅ **Auto JSON Update** - All changes sync to JSON
✅ **Visual Feedback** - Selection highlights, hover effects
✅ **Multiple Selection** - Delete many nodes at once
✅ **Keyboard Shortcuts** - Backspace or Delete key

## 💡 Workflow

```
User Action → Canvas Update → JSON Update → State Update → Re-render
```

**Add Instance**:
```
Click + → Create default → Update JSON → Update state → New node appears
```

**Delete Node**:
```
Select + Backspace → Find children → Update JSON → Update state → Nodes removed
```

**Perfect for rapid prototyping and editing app configurations!** 🎉

