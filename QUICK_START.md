# Workflow Canvas - Quick Start Guide 🚀

## ✅ Installation Complete!

The new workflow canvas from `workflow-canvas-main` has been fully integrated into your application.

---

## 🎯 What You Got

### **Complete Replacement**
- ✅ All components from workflow-canvas-main copied
- ✅ Integration wrapper created
- ✅ Dependencies installed
- ✅ ChatBotCanvas updated to use new editor

### **New Features**
1. **8-Point Anchor System** - More flexible connections
2. **Loop-back Transitions** - Self-referencing states
3. **Inline Name Editing** - Edit directly on canvas
4. **Draggable Edge Labels** - Reposition transition labels
5. **Auto-Layout** - Dagre-based automatic arrangement
6. **Quick Help Panel** - Toggleable help (? button)
7. **Session History** - Undo/redo with Ctrl+Z/Y
8. **Edge Reconnection** - Drag endpoints to reconnect
9. **Modern UI** - Glass morphism, dark theme
10. **Keyboard Shortcuts** - Backspace to delete, etc.

---

## 🚀 How to Start

### **1. Run the Application**

```bash
cd /home/kseniia/IdeaProjects/ai-assistant-ui-new/packages/web
npm run dev
```

### **2. Open Workflow Canvas**

Navigate to the chat interface and open the canvas view. The new workflow editor will load automatically.

### **3. Try These Actions**

**Quick Actions:**
- Double-click canvas → Add new state
- Double-click state name → Rename inline
- Drag from handles → Connect states
- Click ? button → Show help
- Ctrl+Z / Ctrl+Y → Undo/redo

**Advanced:**
- Drag transition label → Reposition
- Connect state to itself → Loop-back
- Click layout button → Auto-arrange
- Double-click edge → Edit transition

---

## 📁 File Structure

```
packages/web/src/components/
├── ChatBot/
│   ├── ChatBotCanvas.tsx                    # ✅ Updated to use new editor
│   ├── ChatBotEditorWorkflowNew.tsx         # ✅ New integration wrapper
│   ├── ChatBotEditorWorkflowSimple.tsx      # Old (preserved for reference)
│   └── ChatBotEditorWorkflow.tsx            # Old (preserved for reference)
└── WorkflowCanvas/                          # ✅ Complete workflow-canvas-main
    ├── Canvas/
    │   ├── StateNode.tsx
    │   ├── TransitionEdge.tsx
    │   ├── LoopbackEdge.tsx
    │   └── WorkflowCanvas.tsx
    ├── Editors/
    │   ├── InlineNameEditor.tsx
    │   ├── JsonEditor.tsx
    │   ├── StateEditor.tsx
    │   └── TransitionEditor.tsx
    ├── Dialogs/
    ├── types/
    ├── utils/
    ├── services/
    └── hooks/
```

---

## 🎨 Visual Changes

### **Before (Old Canvas):**
- 4-point connection system
- Basic node design
- Modal-only editing
- Simple controls

### **After (New Canvas):**
- 8-point connection system
- Modern glass morphism UI
- Inline + modal editing
- Advanced controls with quick help
- Draggable labels
- Auto-layout
- Loop-back support
- Session history

---

## 🔧 Technical Details

### **Dependencies Added:**
```json
{
  "@dagrejs/dagre": "^1.1.5",
  "clsx": "^2.1.1",
  "@headlessui/react": "^2.2.4"
}
```

### **Integration Point:**
```typescript
// ChatBotCanvas.tsx
<ChatBotEditorWorkflowNew
  technicalId={technicalId}
  onAnswer={onAnswer}
  onUpdate={(data) => {
    console.log('Workflow updated:', data);
    setWorkflowData(data.canvasData);
  }}
/>
```

### **Data Format:**
```typescript
// Workflow data structure
{
  "version": "1.0",
  "name": "Workflow Name",
  "initialState": "start",
  "states": { ... },
  "layout": {
    "states": [{ "id": "start", "position": { "x": 100, "y": 100 } }],
    "transitions": [{ "id": "...", "labelPosition": { "x": 0, "y": 0 } }],
    "updatedAt": "2025-01-..."
  }
}
```

---

## 🐛 Troubleshooting

### **Issue: Build Errors**

**Solution:**
```bash
cd /home/kseniia/IdeaProjects/ai-assistant-ui-new/packages/web
npm install
npm run dev
```

### **Issue: Workflow Not Loading**

**Check:**
1. Browser console for errors
2. LocalStorage for workflow data
3. technicalId prop is correct

**Fix:**
```typescript
// Clear storage and reload
localStorage.removeItem(`workflow_canvas_data_${technicalId}`);
window.location.reload();
```

### **Issue: TypeScript Errors**

**Solution:**
```bash
npm run type-check
```

If errors persist, check import paths in WorkflowCanvas components.

---

## 📚 Documentation

### **Comprehensive Guides:**
1. **WORKFLOW_REPLACEMENT_COMPLETE.md** - Technical details
2. **WORKFLOW_FEATURES_GUIDE.md** - User guide (from Phase 1)
3. **WORKFLOW_ENHANCEMENTS.md** - Phase 1 notes (partial integration)

### **Original Documentation:**
- `packages/workflow-canvas-main/README.md`
- `packages/workflow-canvas-main/features/` - Feature specifications

---

## 🎯 Quick Reference

### **Keyboard Shortcuts:**
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Backspace` - Delete selected
- `Enter` - Save inline edit
- `Escape` - Cancel inline edit

### **Mouse Actions:**
- Double-click canvas - Add state
- Double-click state name - Edit name
- Double-click edge - Edit transition
- Drag state - Move
- Drag handle - Create connection
- Drag label - Reposition

### **Controls:**
- `+` / `-` - Zoom in/out
- Fit view - Center workflow
- Lock/Unlock - Toggle dragging
- `?` - Toggle quick help
- Layout - Auto-arrange
- Undo/Redo - History navigation

---

## ✨ Key Features to Try

### **1. 8-Point Anchors**
```
Hover over any state → See 8 handles
Drag from any handle → Create connection
More flexible routing!
```

### **2. Inline Editing**
```
Double-click state name → Edit inline
Type new name → Press Enter
Fast and intuitive!
```

### **3. Loop-back Transitions**
```
Drag from state handle → Back to same state
Creates self-referencing transition
Perfect for retry logic!
```

### **4. Draggable Labels**
```
Click and drag transition label
Reposition for better readability
Position persists!
```

### **5. Auto-Layout**
```
Click layout button in controls
Dagre algorithm arranges states
Clean, organized flow!
```

### **6. Quick Help**
```
Click ? button in controls
See all available actions
Always accessible!
```

---

## 🎊 Success Indicators

### **You'll Know It's Working When:**

✅ Canvas loads with modern dark theme
✅ States have 8 connection handles
✅ Double-click canvas creates new state
✅ Double-click state name enables editing
✅ ? button shows quick help panel
✅ Ctrl+Z/Y undo/redo works
✅ Transition labels are draggable
✅ Layout button auto-arranges states

---

## 🚀 Next Steps

### **Explore Features:**
1. Create a complex workflow
2. Try all keyboard shortcuts
3. Test undo/redo extensively
4. Create loop-back transitions
5. Use auto-layout on large workflows

### **Customize (Optional):**
1. Adjust colors in WorkflowCanvas
2. Add custom node types
3. Extend transition editor
4. Add workflow templates
5. Integrate with backend API

---

## 💡 Pro Tips

### **Workflow Organization:**
- Use auto-layout for initial arrangement
- Manually adjust for fine-tuning
- Group related states visually
- Use descriptive state names

### **Performance:**
- Keep workflows under 100 states
- Use auto-layout sparingly on large workflows
- Clear history periodically (session storage)

### **Best Practices:**
- Save frequently (auto-saves on changes)
- Use undo/redo for experimentation
- Test workflows after major changes
- Keep transition logic simple

---

## 📞 Support

### **Need Help?**
- Check WORKFLOW_REPLACEMENT_COMPLETE.md for technical details
- Check WORKFLOW_FEATURES_GUIDE.md for user guide
- Check browser console for errors
- Review workflow-canvas-main documentation

### **Found a Bug?**
- Check if it's a data format issue
- Try clearing storage and reloading
- Check TypeScript errors
- Review import paths

---

## 🎉 Congratulations!

You now have a **professional-grade workflow editor** with all the advanced features from workflow-canvas-main!

**Start creating amazing workflows!** 🚀

---

## 📊 Feature Comparison

| Feature | Old Canvas | New Canvas |
|---------|-----------|-----------|
| Anchor Points | 4 | 8 ✨ |
| Inline Editing | ❌ | ✅ ✨ |
| Loop-back | ❌ | ✅ ✨ |
| Draggable Labels | ❌ | ✅ ✨ |
| Auto-Layout | Basic | Advanced ✨ |
| Quick Help | ❌ | ✅ ✨ |
| Session History | ❌ | ✅ ✨ |
| Edge Reconnect | ❌ | ✅ ✨ |
| Dark Theme | Basic | Modern ✨ |
| Keyboard Shortcuts | Limited | Extensive ✨ |

**10 major improvements!** 🎊

---

**Enjoy your new workflow canvas!** 🎨✨

