# Canvas Features Documentation

## Overview
The Canvas is a powerful sidebar panel that provides workflow visualization and markdown editing capabilities with multiple viewing modes and fullscreen support.

## Features

### 1. Resizable Canvas Panel
- **Drag to Resize**: Grab the resize handle on the right edge of the canvas to adjust width
- **Width Range**: 400px (minimum) to 1200px (maximum)
- **Persistent State**: Canvas width is saved to localStorage and restored on next visit
- **Smooth Transitions**: Animated resize with visual feedback

### 2. Fullscreen Mode
The canvas can be expanded to fullscreen for maximum workspace.

#### How to Toggle Fullscreen:
- **Button**: Click the maximize/minimize icon in the canvas header
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+F` - Toggle fullscreen
  - `F11` - Toggle fullscreen (when canvas is open)
  - `Escape` - Exit fullscreen

#### Fullscreen Behavior:
- Canvas expands to cover the entire viewport
- Resize handle is hidden in fullscreen mode
- Other panels (chat history, entity data) are hidden
- Exit fullscreen returns to previous width

### 3. Workflow Tab
Interactive workflow diagram using ReactFlow.

#### Features:
- **Draggable Nodes**: Click and drag nodes to reposition
- **Connectable**: Create connections between nodes
- **Interactive Controls**:
  - Zoom in/out buttons
  - Fit view button
  - MiniMap for navigation
- **Visual Elements**:
  - 5 sample nodes with different colors
  - Animated edges
  - Dots background pattern
- **Submit Button**: Send workflow data to chat

### 4. Markdown Tab
Advanced markdown editor with three viewing modes.

#### Viewing Modes:

##### 📝 Edit Mode (Text Only)
- Full-width editor
- Syntax highlighting placeholder
- Character counter
- Best for: Writing and editing markdown

##### 👁️ Preview Mode (Preview Only)
- Full-width preview
- Real-time markdown rendering
- Syntax highlighting for code blocks
- Best for: Reviewing formatted content

##### 📊 Split Mode (Preview with Text)
- Side-by-side editor and preview
- Real-time preview updates as you type
- Equal width panels
- Best for: Writing while seeing results

#### Markdown Features:
- **GitHub Flavored Markdown (GFM)**: Tables, task lists, strikethrough
- **Syntax Highlighting**: Code blocks with language detection
- **Rich Formatting**:
  - Headers (H1-H6)
  - Bold, italic, strikethrough
  - Lists (ordered, unordered)
  - Blockquotes
  - Code blocks
  - Tables
  - Links
  - Images
- **Character Counter**: Track document length
- **Send Button**: Submit markdown to chat

#### Mode Selector:
Located in the canvas header when Markdown tab is active:
- **Edit** (📝): Text editor only
- **Split** (📊): Editor + Preview side-by-side
- **Preview** (👁️): Preview only

### 5. Canvas Header
- **Title**: "Canvas" with active status badge
- **Mode Selector**: Switch between Edit/Split/Preview (Markdown tab only)
- **Fullscreen Button**: Toggle fullscreen mode
- **Settings Button**: Canvas settings (placeholder)
- **Close Button**: Close the canvas panel

### 6. Tab Switching
Toggle between Workflow and Markdown tabs:
- **Workflow Tab**: ReactFlow diagram editor
- **Markdown Tab**: Markdown editor with preview modes

## Layout Structure

### Normal Mode:
```
┌─────────────────────────────────────────────────────────────┐
│                         Header                               │
├──────────────┬──────────────┬──────────────┬────────────────┤
│              │              │              │                │
│   Chat       │   Canvas     │    Main      │    Entity      │
│   History    │   (Workflow  │    Chat      │    Data        │
│   (Left)     │   /Markdown) │    Area      │    (Right)     │
│              │              │              │                │
│  Resizable   │  Resizable   │   Flexible   │   Resizable    │
│  200-400px   │  400-1200px  │   (flex-1)   │   320-600px    │
│              │              │              │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### Fullscreen Mode:
```
┌─────────────────────────────────────────────────────────────┐
│                      Canvas Header                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│                     Canvas Content                           │
│                  (Workflow or Markdown)                      │
│                                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+F` | Toggle canvas fullscreen |
| `F11` | Toggle canvas fullscreen (when canvas is open) |
| `Escape` | Exit fullscreen mode |

## Usage Examples

### Example 1: Writing Documentation
1. Click **Canvas** button to open
2. Switch to **Markdown** tab
3. Select **Split** mode to see preview while typing
4. Write your documentation
5. Click **Send** to submit to chat

### Example 2: Reviewing Markdown
1. Open Canvas with existing markdown content
2. Switch to **Markdown** tab
3. Select **Preview** mode for full-width preview
4. Review formatted content
5. Switch to **Edit** mode to make changes

### Example 3: Workflow Design
1. Open Canvas
2. Stay on **Workflow** tab (default)
3. Drag nodes to arrange workflow
4. Create connections between nodes
5. Use MiniMap to navigate large workflows
6. Click **Submit Workflow** to send to chat

### Example 4: Fullscreen Editing
1. Open Canvas
2. Click fullscreen button (or press `Ctrl+Shift+F`)
3. Work with maximum screen space
4. Press `Escape` or click minimize to exit

## Technical Details

### Dependencies
- `@xyflow/react`: ^12.8.5 - ReactFlow for workflow diagrams
- `react-markdown`: ^10.1.0 - Markdown rendering
- `remark-gfm`: ^4.0.1 - GitHub Flavored Markdown
- `rehype-highlight`: ^7.0.2 - Syntax highlighting
- `lucide-react`: ^0.544.0 - Icons

### State Management
- Canvas visibility: `canvasVisible` state
- Fullscreen mode: `isCanvasFullscreen` state
- Canvas width: Persisted to localStorage with key `canvas-width`
- Active tab: `activeTab` state (workflow/markdown)
- Markdown mode: `markdownMode` state (edit/split/preview)
- Markdown content: `markdownContent` state

### Styling
- Dark theme with slate colors
- Backdrop blur effects
- Smooth transitions
- Responsive layout
- Custom scrollbars

## Future Enhancements

### Planned Features:
- [ ] Markdown file import/export
- [ ] Workflow templates
- [ ] Collaborative editing
- [ ] Version history
- [ ] Auto-save drafts
- [ ] Markdown table editor
- [ ] Diagram export (PNG, SVG)
- [ ] Custom node types for workflows
- [ ] Workflow validation
- [ ] Markdown snippets library

### Potential Improvements:
- [ ] Vim/Emacs keybindings for editor
- [ ] Markdown toolbar with formatting buttons
- [ ] Search and replace in editor
- [ ] Line numbers in editor
- [ ] Minimap for markdown editor
- [ ] Diff view for changes
- [ ] Comments and annotations
- [ ] Real-time collaboration indicators

## Troubleshooting

### Canvas doesn't open
- Check if Canvas button is visible in header
- Verify `canvasVisible` state is being toggled
- Check browser console for errors

### Fullscreen not working
- Ensure canvas is open before trying fullscreen
- Check keyboard shortcuts are not conflicting
- Verify browser allows fullscreen API

### Markdown preview not rendering
- Check markdown syntax is valid
- Verify `react-markdown` dependencies are installed
- Check browser console for rendering errors

### Resize not working
- Ensure you're dragging the resize handle (right edge)
- Check if canvas is in fullscreen mode (resize disabled)
- Verify `useResizablePanel` hook is working

## Support
For issues or feature requests, please contact the development team or create an issue in the project repository.

