# ✅ Now Using app_config_example.json!

## 🎯 What Changed

AppsCanvas now uses the **real example data** from `app_config_example.json` instead of mock data.

### Files Updated

1. **`sampleAppData.ts`** - Updated to match app_config_example.json exactly
2. **`AppsTabsContainer.tsx`** - Changed to use AppRoot format instead of PortalData
3. **`AppsCanvas.tsx`** - Fixed require() error by using proper ES6 imports
4. **`loadAppConfig.ts`** - New utility for loading and validating app configs

### Data Structure

The app now uses this structure from `app_config_example.json`:

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
                    {
                      "name": "adopt",
                      "next": "adopted"
                    }
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

## 🎨 How It's Visualized

The AppsCanvas converts this structure to a visual graph:

### Nodes Created

1. **Environment Node** (Green)
   - Name: "production"
   - URL: "https://api.example.com"
   - Status: "active"

2. **App Node** (Teal)
   - Name: "pet store"
   - Description: "A pet store API"
   - Version: "1.0.0"

3. **Requirement Node** (Orange)
   - Title: "please build an app for pet store"
   - Version: "1.0.0"
   - Status: "approved"

4. **Entity Version Node** (Blue)
   - Name: "pet"
   - Version: "1"
   - Description: "A pet"
   - Model data: { name: "Tom", age: 3, breed: "Persian" }

5. **Workflow Node** (Purple)
   - Name: "pet adoption"
   - States: 2 (initial, adopted)
   - Transitions: 1 (adopt)

### Edges Created

- Environment → App
- App → Requirement
- Requirement → Entity
- Entity → Workflow

## 🔧 How to Use Different Data

### Option 1: Use the Example Data (Current)

```typescript
import { AppsCanvas, sampleAppData } from '@/components/AppsCanvas';

<AppsCanvas 
  appData={sampleAppData}
  onAppDataUpdate={(data) => console.log(data)}
/>
```

### Option 2: Load from File

```typescript
import { AppsCanvas } from '@/components/AppsCanvas';
import { loadExampleAppConfig } from '@/components/AppsCanvas/loadAppConfig';
import { useState, useEffect } from 'react';

function MyComponent() {
  const [appData, setAppData] = useState(null);

  useEffect(() => {
    loadExampleAppConfig().then(setAppData);
  }, []);

  if (!appData) return <div>Loading...</div>;

  return (
    <AppsCanvas 
      appData={appData}
      onAppDataUpdate={setAppData}
    />
  );
}
```

### Option 3: Load Custom JSON

```typescript
import { AppsCanvas } from '@/components/AppsCanvas';
import { loadAppConfigFromFile, validateAppConfig } from '@/components/AppsCanvas/loadAppConfig';

async function loadCustomConfig() {
  const config = await loadAppConfigFromFile('/my-custom-config.json');
  
  // Validate
  const validation = validateAppConfig(config);
  if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
    return;
  }
  
  return config;
}
```

### Option 4: Use PortalData Format (Legacy)

```typescript
import { AppsCanvas, samplePortalData } from '@/components/AppsCanvas';

<AppsCanvas 
  data={samplePortalData}
  onDataUpdate={(data) => console.log(data)}
/>
```

## ✅ Features Available

All 65+ features work with the app_config_example.json data:

### ✅ JSON Editor
- Opens on the right side
- Shows the app config in JSON format
- Edit and save changes
- Validates against schema

### ✅ Import/Export
- **Export**: Download button (⬇️) - Saves as app_config.json
- **Import**: Upload button (⬆️) - Load from JSON file
- Validates structure on import

### ✅ Settings
- **3 Themes**: Bluey-Orange, Greeny-Pink, Cyberpunk
- **Layouts**: Top-Bottom, Left-Right
- **Edge types**: Default, Straight, Step, Smoothstep
- **Grid**: Show/hide, snap to grid
- All persist to localStorage

### ✅ Quick Help
- Question mark button (?)
- Shows keyboard shortcuts
- Navigation tips

### ✅ And 50+ More Features!
- Undo/Redo
- Drag and drop
- Zoom and pan
- Minimap
- Auto-layout
- Fullscreen
- Notifications
- And more!

## 🔍 Validation

The `loadAppConfig.ts` utility includes schema validation:

```typescript
import { validateAppConfig } from '@/components/AppsCanvas/loadAppConfig';

const validation = validateAppConfig(myConfig);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  // Example errors:
  // - "Missing required field: app.name"
  // - "Missing url in environment 0"
  // - "Missing config.states in entity 0, workflow 0"
}
```

## 📊 Data Flow

```
app_config_example.json
  ↓
sampleAppData (TypeScript)
  ↓
AppsTabsContainer
  ↓
AppsCanvas (appData prop)
  ↓
convertAppRootToPortalData()
  ↓
PortalData (internal format)
  ↓
convertPortalDataToWorkflow()
  ↓
UIWorkflowData
  ↓
WorkflowCanvas (renders with all features)
```

## 🎉 Summary

✅ Now using real data from app_config_example.json
✅ Matches app_schema.json structure exactly
✅ All 65+ features work with this data
✅ Can load custom JSON files
✅ Includes validation
✅ Supports both AppRoot and PortalData formats

**Everything works with the real example data!** 🚀

