# Quick Start: Canvas Demo

## 🚀 Getting Started

### 1. Start the Development Server

```bash
cd /home/kseniia/IdeaProjects/ai-assistant-ui-new/packages/web
npm run dev
```

### 2. Open the Canvas Demo

Navigate to: **http://localhost:5173/canvas-demo**

## 🎮 Interactive Features

### Canvas Sidebar (Left)
- **Open/Close**: Click "Canvas" button in header or press `Ctrl+B`
- **Resize**: Drag the right edge of the canvas panel
- **Collapse**: Click the minimize icon in the canvas header
- **Switch Tabs**: Click "Workflow" or "Markdown" tabs

### Entity Data Sidebar (Right)
- **Open/Close**: Click "Entities" button in header or press `Ctrl+D`
- **View Data**: See entity information, transitions, and versions

### Workflow Canvas
- **Pan**: Click and drag on the background
- **Zoom**: Use mouse wheel or zoom controls
- **Move Nodes**: Click and drag any node
- **Connect Nodes**: Drag from a node's edge to another node
- **Mini-map**: Use the mini-map in the bottom-right for navigation

### Chat Input
- **Focus**: Press `Ctrl+K` or click the input field
- **Submit**: Type your message and press Enter or click Send
- **Quick Actions**: Click Deploy, Status, or Help buttons

### Notifications
- **View**: Click the bell icon in the header
- **Mark as Read**: Click on any notification
- **Close**: Press `Esc` or click outside the dropdown

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` or `Cmd+K` | Focus chat input |
| `Ctrl+B` or `Cmd+B` | Toggle Canvas sidebar |
| `Ctrl+D` or `Cmd+D` | Toggle Entity Data sidebar |
| `Esc` | Close notifications dropdown |

## 🎨 Visual Features

### Canvas Panel
- **Width Range**: 300px - 800px (resizable)
- **Tabs**: Workflow (interactive canvas) and Markdown (editor)
- **Theme**: Dark slate theme with teal accents
- **Animations**: Smooth transitions and hover effects

### Workflow Canvas
- **Nodes**: 5 sample nodes with different colors
  - Start Request (Teal)
  - Process Entity (Blue)
  - Validate Data (Purple)
  - Generate Response (Orange)
  - Complete (Green)
- **Edges**: Animated connections between nodes
- **Background**: Dotted grid pattern
- **Controls**: Zoom in/out, fit view, lock/unlock

### Entity Data Panel
- **Entity Tabs**: Switch between different entities
- **Entity ID**: Unique identifier display
- **Transitions**: Color-coded transition badges
- **Versions**: Historical version list with timestamps
- **Actions**: Refresh and close buttons

## 🔍 What to Look For

### 1. Responsive Design
- Resize your browser window
- Notice how panels adapt
- Try different screen sizes

### 2. Smooth Interactions
- Drag the canvas resize handle
- Watch the smooth transitions
- Notice the hover effects

### 3. Dark Theme
- Consistent slate-900 background
- Teal accent colors
- Proper contrast for readability

### 4. Interactive Canvas
- Drag nodes around
- Create new connections
- Use the mini-map for navigation
- Zoom in and out

## 📊 Sample Data

The demo includes:
- **5 Workflow Nodes**: Representing a typical workflow
- **2 Notifications**: Success and info messages
- **3 History Items**: Recent activity
- **2 Entity Tabs**: chat_Entity and build_general
- **2 Entity Versions**: v1 and v2

## 🛠️ Customization

### Change Canvas Width
Edit `CanvasDemoView.tsx`:
```typescript
const [canvasWidth, setCanvasWidth] = useState(400); // Change default width
```

### Modify Workflow Nodes
Edit `WorkflowCanvas.tsx`:
```typescript
const initialNodes = [
  // Add or modify nodes here
];
```

### Update Notifications
Edit `CanvasDemoView.tsx`:
```typescript
const [notifications, setNotifications] = useState([
  // Add or modify notifications here
]);
```

## 🐛 Troubleshooting

### Canvas Not Showing
- Make sure you're at `/canvas-demo` route
- Check browser console for errors
- Verify the dev server is running

### Resize Not Working
- Make sure you're dragging the right edge of the canvas
- Look for the resize handle (appears on hover)
- Check that the canvas is not collapsed

### Keyboard Shortcuts Not Working
- Make sure the page has focus
- Try clicking on the page first
- Check if another element has focus

## 📚 Learn More

- **ReactFlow Docs**: https://reactflow.dev/
- **Lucide Icons**: https://lucide.dev/
- **Tailwind CSS**: https://tailwindcss.com/

## ✨ Tips

1. **Explore the Canvas**: Try dragging nodes and creating connections
2. **Use Keyboard Shortcuts**: They make navigation much faster
3. **Resize Panels**: Find your preferred layout
4. **Check Notifications**: See how the unread badge works
5. **Try Different Tabs**: Switch between Workflow and Markdown

## 🎯 Next Steps

1. **Integrate with Your Data**: Replace mock data with real API calls
2. **Add Custom Nodes**: Create your own node types
3. **Enhance Styling**: Customize colors and themes
4. **Add Features**: Implement save/load functionality
5. **Mobile Optimize**: Further improve mobile experience

---

**Enjoy exploring the Canvas Demo! 🎉**

