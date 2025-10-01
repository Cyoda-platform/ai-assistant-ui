# Workflow AI Assistant Integration 🤖✨

## Overview

The Workflow AI Assistant is a modern, context-aware AI helper integrated directly into the Workflow JSON Editor. It provides intelligent assistance for creating, modifying, and optimizing workflow configurations using natural language.

## Features

### 🎯 Context-Aware Assistance
- **Selected Text Support**: Highlight any part of your workflow JSON and ask questions about it
- **Full Workflow Context**: AI understands your entire workflow structure
- **Smart Suggestions**: Get JSON snippets that can be applied directly to your workflow

### ⌨️ Keyboard Shortcuts
- **`Cmd/Ctrl + K`**: Open AI Assistant (works anywhere in the JSON editor)
- **`Enter`**: Send message
- **`Shift + Enter`**: New line in message
- **`Escape`**: Close AI Assistant

### 🎨 Modern UI
- **Floating Button**: Beautiful gradient button with pulsing indicator
- **Modal Interface**: Full-screen modal with smooth animations
- **Quick Prompts**: Pre-built prompts for common tasks
- **Message History**: Persistent conversation within the session
- **Copy & Apply**: One-click copy or apply AI suggestions

## Usage

### Opening the AI Assistant

There are two ways to open the AI Assistant:

1. **Click the "Ask AI" button** in the JSON Editor header
   - Purple/pink gradient button with sparkles icon
   - Pulsing indicator shows it's ready to help

2. **Use the keyboard shortcut** `Cmd/Ctrl + K`
   - Works anywhere in the JSON editor
   - Automatically captures selected text if any

### Quick Actions

When you first open the AI Assistant, you'll see quick action buttons:

- 🔄 **Add a new state**: Quickly add states to your workflow
- 🔗 **Add transition**: Create transitions between states
- ✨ **Optimize workflow**: Get suggestions for improvements
- 🐛 **Find issues**: Validate and find problems in your workflow

### Asking Questions

Simply type your question in natural language:

**Examples:**
- "Add a new state called PENDING_REVIEW with transitions to APPROVED and REJECTED"
- "How do I add a processor to this transition?"
- "What's wrong with this workflow configuration?"
- "Explain what this state does"
- "Add validation criteria to the SUBMITTED state"

### Working with Selected Text

1. **Select** any part of your workflow JSON in the editor
2. **Press** `Cmd/Ctrl + K` or click "Ask AI"
3. The AI will automatically understand the context of your selection
4. Ask questions specifically about that part

**Example:**
```json
// Select this transition
{
  "name": "approve",
  "next": "APPROVED",
  "manual": true
}
```
Then ask: "Add a processor to validate the approval"

### Applying AI Suggestions

When the AI provides JSON code:

1. A **"Apply JSON"** button appears below the message
2. Click it to automatically insert the suggestion into your workflow
3. The JSON will be:
   - Validated before insertion
   - Formatted with proper indentation
   - Inserted at the selected location (if text was selected)
   - Or replace the entire workflow (if no selection)

## API Integration

The AI Assistant uses the existing chat API:

```typescript
POST /api/v1/chats/{technical_id}/text-questions
{
  "question": "Your question with workflow context"
}

Response:
{
  "message": "AI response with suggestions"
}
```

### Context Building

The assistant automatically builds context:

1. **With Selected Text**:
   ```
   Context: I'm working on this part of the workflow JSON:
   ```json
   [selected text]
   ```
   
   Question: [your question]
   ```

2. **Without Selection**:
   ```
   Context: Here's my current workflow:
   ```json
   [entire workflow]
   ```
   
   Question: [your question]
   ```

## Component Architecture

### WorkflowAIAssistant Component

Located at: `src/components/WorkflowCanvas/Editors/WorkflowAIAssistant.tsx`

**Props:**
```typescript
interface WorkflowAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkflow: string;        // Full workflow JSON
  selectedText?: string;          // Selected portion of JSON
  onApplySuggestion: (suggestion: string) => void;
  technicalId?: string;           // Chat session ID
}
```

**Features:**
- Message history management
- Context-aware question building
- JSON extraction from AI responses
- Copy to clipboard functionality
- Apply suggestions directly to editor

### Integration Points

1. **WorkflowJsonEditor** (`WorkflowJsonEditor.tsx`)
   - Hosts the AI Assistant button
   - Manages selected text state
   - Handles suggestion application
   - Provides keyboard shortcut handling

2. **WorkflowCanvas** (`WorkflowCanvas.tsx`)
   - Passes technicalId to JSON editor
   - Maintains workflow state

3. **ChatBotEditorWorkflowNew** (`ChatBotEditorWorkflowNew.tsx`)
   - Provides technicalId from chat session
   - Manages workflow lifecycle

## Styling

The AI Assistant uses a modern, gradient-based design:

### Colors
- **Primary Gradient**: Purple (#8B5CF6) to Pink (#EC4899)
- **Accent**: Lime green for editor integration
- **Background**: White/Gray-900 (light/dark mode)

### Animations
- **Fade In**: Modal entrance
- **Slide Up**: Modal content
- **Pulse**: AI button indicator
- **Ping**: Notification dot

### Responsive Design
- **Max Width**: 3xl (48rem)
- **Max Height**: 85vh
- **Mobile**: Full width with margins

## Best Practices

### For Users

1. **Be Specific**: The more specific your question, the better the answer
2. **Use Context**: Select relevant JSON before asking questions
3. **Iterate**: Have a conversation - ask follow-up questions
4. **Validate**: Always review AI suggestions before applying
5. **Learn**: Use the AI to understand workflow concepts

### For Developers

1. **Error Handling**: Always wrap AI calls in try-catch
2. **Validation**: Validate JSON before applying suggestions
3. **Context Limits**: Be mindful of context size for API calls
4. **User Feedback**: Show loading states and error messages
5. **Accessibility**: Maintain keyboard navigation support

## Troubleshooting

### AI Assistant Won't Open
- Check that you're in the JSON editor (not the canvas)
- Verify the technicalId is being passed correctly
- Check browser console for errors

### Suggestions Won't Apply
- Ensure the AI response contains valid JSON
- Check that the JSON structure matches workflow schema
- Verify you have edit permissions

### Context Not Working
- Make sure text is properly selected in Monaco editor
- Check that the editor ref is initialized
- Verify the selection range is valid

## Future Enhancements

Potential improvements for the AI Assistant:

- [ ] **Voice Input**: Speak your questions
- [ ] **Workflow Templates**: AI-generated workflow templates
- [ ] **Visual Suggestions**: Show changes in the canvas before applying
- [ ] **Diff View**: Preview changes before applying
- [ ] **History**: Save and replay AI conversations
- [ ] **Collaborative**: Share AI suggestions with team
- [ ] **Learning**: AI learns from your workflow patterns
- [ ] **Multi-language**: Support for multiple languages

## Examples

### Example 1: Adding a State

**User**: "Add a new state called UNDER_REVIEW"

**AI Response**:
```json
{
  "UNDER_REVIEW": {
    "name": "Under Review",
    "transitions": [
      {
        "name": "approve",
        "next": "APPROVED",
        "manual": true
      },
      {
        "name": "reject",
        "next": "REJECTED",
        "manual": true
      }
    ]
  }
}
```

### Example 2: Adding a Processor

**User** (with transition selected): "Add a validation processor"

**AI Response**:
```json
{
  "name": "approve",
  "next": "APPROVED",
  "manual": true,
  "processors": [
    {
      "name": "ValidationProcessor",
      "config": {
        "rules": ["required_fields", "valid_format"]
      },
      "executionMode": "SYNC"
    }
  ]
}
```

### Example 3: Workflow Optimization

**User**: "Review this workflow and suggest improvements"

**AI Response**:
"I've analyzed your workflow and found several optimization opportunities:

1. **Missing Error Handling**: Add an ERROR state for failed transitions
2. **Redundant Transitions**: States A and B have duplicate transitions
3. **Naming Convention**: Consider using UPPER_SNAKE_CASE for state IDs
4. **Documentation**: Add descriptions to complex transitions

Here's an improved version:
```json
[optimized workflow]
```"

## Credits

Built with:
- React + TypeScript
- Monaco Editor
- Lucide React Icons
- Tailwind CSS
- Zustand (state management)

---

**Need Help?** Press `Cmd/Ctrl + K` in the JSON editor and ask the AI! 🚀

