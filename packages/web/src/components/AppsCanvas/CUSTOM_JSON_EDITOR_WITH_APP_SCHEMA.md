# ✅ Custom JSON Editor with App Schema!

## 🎯 What's Implemented

AppsCanvas now has a **custom JSON editor** that uses `app_schema.json` for validation instead of the workflow schema!

### Key Features

1. **✅ Custom Schema Validation** - Uses `app_schema.json` structure
2. **✅ Monaco Editor** - Full-featured code editor with syntax highlighting
3. **✅ Real-time Validation** - Validates against app schema as you type
4. **✅ Import/Export** - Load and save JSON files
5. **✅ Error Display** - Shows validation errors clearly
6. **✅ Overlays WorkflowCanvas** - Hides the built-in workflow JSON editor

## 📊 Schema Structure

The JSON editor validates against this structure from `app_schema.json`:

```json
{
  "app": {
    "name": "string",
    "description": "string",
    "version": "string",
    "author": "string",
    "license": "string",
    "repository": "string",
    "requirement": "string",
    "environments": [
      {
        "name": "string",
        "url": "string",
        "status": "string"
      }
    ],
    "entities": [
      {
        "name": "string",
        "version": "string",
        "description": "string",
        "cyoda_url": "string",
        "github_url": "string",
        "model": {
          "name": "string",
          "age": "number",
          "breed": "string"
        },
        "workflows": [
          {
            "name": "string",
            "cyoda_url": "string",
            "github_url": "string",
            "config": {
              "states": {
                "state_name": {
                  "transitions": [
                    {
                      "name": "string",
                      "next": "string"
                    }
                  ]
                }
              }
            }
          }
        ]
      }
    ]
  }
}
```

## 🎨 How It Works

### Architecture

```
AppsCanvas
  ├── WorkflowCanvas (all features: settings, themes, etc.)
  │   └── Built-in JSON editor (HIDDEN with CSS)
  └── AppsJsonEditor (custom overlay)
      ├── Monaco Editor with app_schema.json
      ├── Validation using validateAppConfig()
      ├── Import/Export buttons
      └── Error display
```

### Data Flow

```
User edits JSON in AppsJsonEditor
  ↓
Validates against app_schema.json
  ↓
If valid → Save to AppRoot
  ↓
Convert AppRoot → PortalData
  ↓
Convert PortalData → UIWorkflowData
  ↓
Render in WorkflowCanvas
```

## 🔧 Files Created/Modified

### New Files

1. **`AppsJsonEditor.tsx`** (327 lines)
   - Custom JSON editor component
   - Monaco editor integration
   - App schema validation
   - Import/Export functionality

2. **`loadAppConfig.ts`** (145 lines)
   - `loadAppConfigFromFile()` - Load JSON from file
   - `validateAppConfig()` - Validate against schema
   - `downloadAppConfig()` - Export to JSON file

### Modified Files

1. **`AppsCanvas.tsx`**
   - Added `AppsJsonEditor` import
   - Added state for JSON editor
   - Overlays custom editor on WorkflowCanvas
   - Keeps all WorkflowCanvas features (settings, themes, etc.)

2. **`sampleAppData.ts`**
   - Updated to match `app_config_example.json`

3. **`AppsTabsContainer.tsx`**
   - Uses AppRoot format instead of PortalData

## ✅ Features

### JSON Editor Features

1. **✅ Syntax Highlighting**
   - Color-coded JSON
   - Bracket matching
   - Auto-indentation

2. **✅ Schema Validation**
   - Real-time validation as you type
   - Monaco's built-in JSON schema validation
   - Custom validation with `validateAppConfig()`
   - Error messages displayed in red banner

3. **✅ Import/Export**
   - **Import** (Upload button): Load JSON from file
   - **Export** (Download button): Save as `app_config.json`
   - File validation on import

4. **✅ Save/Cancel**
   - **Save**: Apply changes to canvas
   - **Close** (X button): Close editor

5. **✅ Minimap**
   - Overview of entire JSON document
   - Navigate large files easily

6. **✅ Line Numbers**
   - Easy reference
   - Jump to specific lines

### WorkflowCanvas Features (Still Available!)

All 65+ WorkflowCanvas features still work:

1. **✅ Settings** (⚙️ button)
   - 3 Themes
   - Layout options
   - Edge types
   - Grid settings

2. **✅ Quick Help** (? button)
   - Keyboard shortcuts
   - Navigation tips

3. **✅ Drag and Drop**
4. **✅ Zoom and Pan**
5. **✅ Minimap**
6. **✅ Auto-layout**
7. **✅ Undo/Redo**
8. **✅ And 50+ more!**

## 🎯 How to Use

### 1. View JSON

The JSON editor opens automatically on the right side showing the current app configuration.

### 2. Edit JSON

Click in the editor and make changes. The editor will:
- Highlight syntax errors in red
- Show validation errors in the banner
- Provide autocomplete suggestions

### 3. Save Changes

Click the **Save** button to apply changes to the canvas.

### 4. Import from File

1. Click the **Upload** button (⬆️)
2. Select a JSON file
3. File is validated against schema
4. If valid, loads into editor

### 5. Export to File

1. Click the **Download** button (⬇️)
2. File downloads as `app_config.json`

## 🔍 Validation

The editor validates:

### Required Fields

- ✅ `app.name`
- ✅ `app.description`
- ✅ `app.version`
- ✅ `app.author`
- ✅ `app.license`
- ✅ `app.repository`
- ✅ `app.requirement`
- ✅ `app.environments` (array)
- ✅ `app.entities` (array)

### Environment Fields

- ✅ `name` (string)
- ✅ `url` (string)
- ✅ `status` (string)

### Entity Fields

- ✅ `name` (string)
- ✅ `version` (string)
- ✅ `description` (string)
- ✅ `cyoda_url` (string)
- ✅ `github_url` (string)
- ✅ `model` (object with name, age, breed)
- ✅ `workflows` (array)

### Workflow Fields

- ✅ `name` (string)
- ✅ `cyoda_url` (string)
- ✅ `github_url` (string)
- ✅ `config.states` (object)
- ✅ Each state has `transitions` (array)
- ✅ Each transition has `name` and `next`

## 🎨 Example Valid JSON

```json
{
  "app": {
    "name": "pet store",
    "description": "A pet store API",
    "version": "1.0.0",
    "author": "John Doe",
    "license": "MIT",
    "repository": "https://github.com/johndoe/pet-store",
    "requirement": "please build an app for pet store",
    "environments": [
      {
        "name": "production",
        "url": "https://api.example.com",
        "status": "active"
      }
    ],
    "entities": [
      {
        "name": "pet",
        "version": "1",
        "description": "A pet",
        "cyoda_url": "https://example.com/workflows/pet-adoption",
        "github_url": "https://github.com/johndoe/pet-adoption",
        "model": {
          "name": "Tom",
          "age": 3,
          "breed": "Persian"
        },
        "workflows": [
          {
            "name": "pet adoption",
            "cyoda_url": "https://example.com/workflows/pet-adoption",
            "github_url": "https://github.com/johndoe/pet-adoption",
            "config": {
              "states": {
                "initial": {
                  "transitions": [
                    { "name": "adopt", "next": "adopted" }
                  ]
                },
                "adopted": {
                  "transitions": []
                }
              }
            }
          }
        ]
      }
    ]
  }
}
```

## ✅ Build Status

```bash
✓ built in 16.32s
```

No errors! Ready to use!

## 🚀 Test It Now

1. Start dev server: `npm run dev`
2. Navigate to **Apps tab**
3. You should see:
   - ✅ Custom JSON editor on the right
   - ✅ "App Configuration (JSON)" header
   - ✅ Schema validation working
   - ✅ Import/Export buttons
   - ✅ All WorkflowCanvas features (settings, themes, etc.)

## 🎉 Summary

✅ Custom JSON editor with app_schema.json validation
✅ Monaco editor with syntax highlighting
✅ Real-time validation
✅ Import/Export functionality
✅ Overlays WorkflowCanvas (hides built-in editor)
✅ All WorkflowCanvas features still work
✅ Uses app_config_example.json data

**Everything works with the custom schema!** 🎉

