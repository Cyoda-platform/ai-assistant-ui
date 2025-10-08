# 🎨 AppsCanvas Visualization Strategy

## 📊 Current Problem

The JSON structure from `app_config_example.json` doesn't match what's displayed on the canvas because:

1. **JSON Structure** (AppRoot):
   ```
   app
   ├── environments[]
   ├── entities[]
   │   ├── model
   │   └── workflows[]
   │       └── config.states{}
   ```

2. **Current Visualization** (PortalData):
   ```
   Environments → Apps → Requirements → Entities → Workflows → Code
   ```

These don't match! We need to visualize the **actual AppRoot structure**.

## 🎯 Proposed Visualization Options

### Option 1: Hierarchical Tree (Recommended)

Visualize the exact JSON hierarchy:

```
┌─────────────────────────────────────┐
│  App: "pet store"                   │
│  v1.0.0 by John Doe                 │
│  Requirement: "build pet store"     │
└─────────────────────────────────────┘
         │
         ├─────────────────────────────┐
         │                             │
    ┌────▼────┐                  ┌─────▼──────┐
    │  Env:   │                  │  Entity:   │
    │production│                  │    pet     │
    │ (active)│                  │   v1       │
    └─────────┘                  └────────────┘
                                       │
                                  ┌────▼────────┐
                                  │  Workflow:  │
                                  │pet adoption │
                                  └─────────────┘
                                       │
                                  ┌────▼────────┐
                                  │   States:   │
                                  │initial→adopt│
                                  │   →adopted  │
                                  └─────────────┘
```

**Nodes:**
1. **App Node** (Top) - Shows app name, version, author, requirement
2. **Environment Nodes** (Left branch) - Each environment
3. **Entity Nodes** (Right branch) - Each entity with model info
4. **Workflow Nodes** (Under entities) - Each workflow
5. **State Nodes** (Under workflows) - Workflow states

**Edges:**
- App → Environments
- App → Entities
- Entity → Workflows
- Workflow → States

### Option 2: Flat Entity-Centric View

Focus on entities and their workflows:

```
┌──────────────┐
│  pet (v1)    │
│  Persian, 3  │
└──────────────┘
       │
       ├─────────────────┐
       │                 │
┌──────▼──────┐    ┌─────▼──────┐
│  Workflow:  │    │   Model:   │
│pet adoption │    │ name: Tom  │
│             │    │ age: 3     │
│ initial     │    │breed:Persian│
│   ↓ adopt   │    └────────────┘
│ adopted     │
└─────────────┘
```

**Nodes:**
1. **Entity Nodes** - Main focus
2. **Workflow Nodes** - Show states inline
3. **Model Nodes** - Show model data

### Option 3: Workflow-Centric View (Current)

Show each workflow's state machine:

```
For "pet adoption" workflow:

┌─────────┐
│ initial │
└─────────┘
     │ adopt
     ▼
┌─────────┐
│ adopted │
└─────────┘
```

**Nodes:**
1. **State Nodes** - Each state in the workflow
2. **Transition Edges** - Named transitions

### Option 4: Multi-Level Expandable

Hierarchical with expand/collapse:

```
┌─────────────────────────────────────┐
│  📦 App: "pet store" v1.0.0         │  ← Click to expand
│  ▼ 1 environment, 1 entity          │
└─────────────────────────────────────┘
         │
         ├─────────────────────────────┐
         │                             │
    ┌────▼────┐                  ┌─────▼──────┐
    │🌍 Env   │                  │🐾 Entity   │  ← Click to expand
    │production│                  │   pet v1   │
    └─────────┘                  │ ▼ 1 workflow│
                                 └────────────┘
                                       │
                                  ┌────▼────────┐
                                  │⚙️ Workflow  │  ← Click to expand
                                  │pet adoption │
                                  │ ▼ 2 states  │
                                  └─────────────┘
```

## 🎯 Recommended: Option 1 (Hierarchical Tree)

### Why?

1. **Matches JSON structure exactly** - What you see is what you get
2. **Clear hierarchy** - Easy to understand relationships
3. **Scalable** - Works with multiple entities, workflows, environments
4. **Editable** - Can click nodes to edit in JSON editor

### Implementation Plan

#### Node Types

1. **App Node** (Purple, Large)
   - Shows: name, version, author, requirement
   - Position: Top center
   - Size: 400x120px

2. **Environment Node** (Green)
   - Shows: name, url, status
   - Position: Left column
   - Size: 200x80px

3. **Entity Node** (Blue)
   - Shows: name, version, description
   - Position: Right column
   - Size: 200x100px

4. **Model Node** (Cyan, Small)
   - Shows: model.name, model.age, model.breed
   - Position: Under entity
   - Size: 180x80px

5. **Workflow Node** (Orange)
   - Shows: name, state count
   - Position: Under model
   - Size: 200x80px

6. **State Node** (Pink, Small)
   - Shows: state name, transition count
   - Position: Under workflow
   - Size: 150x60px

#### Layout

```
                    ┌─────────────────────┐
                    │   App Node (Top)    │
                    └─────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐          ┌────▼────┐         ┌────▼────┐
   │  Env 1  │          │  Env 2  │         │Entity 1 │
   └─────────┘          └─────────┘         └─────────┘
                                                  │
                                             ┌────▼────┐
                                             │  Model  │
                                             └─────────┘
                                                  │
                                             ┌────▼────┐
                                             │Workflow │
                                             └─────────┘
                                                  │
                                        ┌─────────┴─────────┐
                                   ┌────▼────┐         ┌────▼────┐
                                   │ State 1 │         │ State 2 │
                                   └─────────┘         └─────────┘
```

#### Colors

- **App**: `#9333ea` (Purple)
- **Environment**: `#10b981` (Green)
- **Entity**: `#3b82f6` (Blue)
- **Model**: `#06b6d4` (Cyan)
- **Workflow**: `#f59e0b` (Orange)
- **State**: `#ec4899` (Pink)

#### Interactions

1. **Click App Node** → Scroll JSON to `app` section
2. **Click Environment Node** → Scroll JSON to that environment
3. **Click Entity Node** → Scroll JSON to that entity
4. **Click Workflow Node** → Scroll JSON to that workflow
5. **Click State Node** → Scroll JSON to that state

## 🔄 Alternative: Tabbed Views

Provide multiple visualization modes:

### Tab 1: Overview
- Shows app → environments + entities

### Tab 2: Entities
- Focus on entities and their models

### Tab 3: Workflows
- Show workflow state machines

### Tab 4: Full Hierarchy
- Complete tree view

## 📝 Next Steps

1. **Create new conversion function**: `convertAppRootToWorkflow()`
2. **Define node types** with proper colors and sizes
3. **Calculate positions** using hierarchical layout
4. **Add click handlers** to scroll JSON editor
5. **Test with app_config_example.json**

## 🎨 Visual Example

For the current `app_config_example.json`:

```
                ┌──────────────────────────────┐
                │  pet store v1.0.0            │
                │  by John Doe                 │
                │  Req: build pet store        │
                └──────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
   ┌────▼────────┐                  ┌─────▼──────────┐
   │ production  │                  │  pet (v1)      │
   │ api.example │                  │  A pet         │
   │  (active)   │                  └────────────────┘
   └─────────────┘                         │
                                      ┌────▼──────────┐
                                      │ Model: Tom    │
                                      │ Age: 3        │
                                      │ Breed: Persian│
                                      └───────────────┘
                                            │
                                      ┌─────▼─────────┐
                                      │ pet adoption  │
                                      │ 2 states      │
                                      └───────────────┘
                                            │
                                   ┌────────┴────────┐
                              ┌────▼────┐      ┌─────▼────┐
                              │ initial │─adopt→│ adopted  │
                              └─────────┘      └──────────┘
```

This matches the JSON structure exactly!

