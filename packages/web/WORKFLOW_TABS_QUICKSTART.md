# Workflow Tabs - Quick Start Guide

## 🚀 Getting Started

### 1. Access the Tabbed Workflow Interface

Navigate to the workflows page:
```
http://localhost:5173/workflows
```

### 2. Open Your First Workflow Tab

1. Click the **"+"** button in the tab bar (or the "Open New Workflow" button if no tabs are open)
2. Fill in the workflow details:
   - **Entity Model Name**: `user-registration` (example)
   - **Model Version**: `1`
   - **Display Name**: `User Registration` (optional)
3. Click **"Open"**

### 3. Start Editing

Your workflow editor will open with:
- Visual workflow canvas
- JSON editor panel
- AI Assistant support
- All standard workflow editing features

### 4. Open Multiple Workflows

Repeat step 2 to open additional workflows:
- `order-processing` v1
- `payment-flow` v2
- `notification-service` v1

Each workflow opens in its own tab!

## 💡 Key Features

### Tab Operations

| Action | How To |
|--------|--------|
| Switch tabs | Click on any tab |
| Close tab | Click the **X** button on the tab |
| Close others | Right-click tab → "Close Others" |
| Close all | Right-click tab → "Close All" |
| New tab | Click the **"+"** button |

### Visual Indicators

- **Blue line** at top = Active tab
- **Orange dot** = Unsaved changes
- **File icon** = Workflow document
- **Model info** = Entity name and version shown below tab name

## 🎯 Common Workflows

### Scenario 1: Working on Multiple Versions

Open different versions of the same entity:
1. Open `user-registration` v1
2. Open `user-registration` v2
3. Compare and edit both versions side-by-side

### Scenario 2: Related Workflows

Work on interconnected workflows:
1. Open `order-processing` v1
2. Open `payment-flow` v1
3. Open `notification-service` v1
4. Switch between them as you design the complete flow

### Scenario 3: Testing and Production

Maintain separate workflows:
1. Open `checkout` v1 (production)
2. Open `checkout` v2 (testing)
3. Make changes to v2 without affecting v1

## 🔧 Tips & Tricks

### 1. Naming Conventions
Use clear, descriptive names:
- ✅ `user-registration`, `order-processing`, `payment-flow`
- ❌ `workflow1`, `test`, `new`

### 2. Version Management
- Start with version 1
- Increment for major changes
- Keep production and development versions separate

### 3. Tab Organization
- Keep related workflows open together
- Close unused tabs to reduce clutter
- Use context menu to quickly close multiple tabs

### 4. Unsaved Changes
- Watch for the orange dot indicator
- Save frequently (Cmd/Ctrl + S)
- Don't close tabs with unsaved changes without reviewing

## 🎨 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Click tab | Switch to tab |
| Cmd/Ctrl + K | Open AI Assistant (in active tab) |
| Cmd/Ctrl + Z | Undo (in active tab) |
| Cmd/Ctrl + Shift + Z | Redo (in active tab) |

## 📝 Example: Complete Workflow

Let's create a complete user onboarding system:

### Step 1: Create Registration Workflow
```
Entity Model Name: user-registration
Model Version: 1
Display Name: User Registration
```

### Step 2: Create Verification Workflow
```
Entity Model Name: email-verification
Model Version: 1
Display Name: Email Verification
```

### Step 3: Create Onboarding Workflow
```
Entity Model Name: user-onboarding
Model Version: 1
Display Name: User Onboarding
```

Now you have three tabs open, each representing a part of your user onboarding system!

## 🐛 Troubleshooting

### Problem: Tab won't open
**Solution**: Check that model name only contains letters, numbers, hyphens, and underscores

### Problem: Can't see my workflow
**Solution**: Make sure you're on the correct tab (check the active tab indicator)

### Problem: Changes not saving
**Solution**: Check for validation errors in the workflow editor

### Problem: Too many tabs open
**Solution**: Use "Close Others" or "Close All" from the context menu

## 🎓 Next Steps

1. **Explore the AI Assistant**: Press Cmd/Ctrl + K in any tab
2. **Try the JSON Editor**: Edit workflows directly in JSON
3. **Use the Visual Canvas**: Drag and drop to create workflow states
4. **Export/Import**: Share workflows between tabs or projects

## 📚 Learn More

- See `WORKFLOW_TABS_FEATURE.md` for complete documentation
- Check `WORKFLOW_AI_ASSISTANT.md` for AI features
- Read `WORKFLOW_CANVAS_USAGE.md` for canvas tips

---

**Happy workflow editing! 🎉**

