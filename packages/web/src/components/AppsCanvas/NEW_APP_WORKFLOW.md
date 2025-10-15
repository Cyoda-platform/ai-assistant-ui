# New App Creation Workflow

## Overview

This feature provides a simplified workflow for creating new Cyoda applications by:
1. Prompting the user to select a programming language (Python or Java)
2. Creating a new chat with the AI assistant
3. Automatically sending an initial message to start the app building workflow

## User Flow

```
User clicks "+" button
        ↓
NewAppDialog opens
        ↓
User selects programming language (Python/Java)
        ↓
User clicks "Start Building"
        ↓
New chat is created
        ↓
Initial message is sent to AI assistant
        ↓
User is navigated to the chat
        ↓
AI assistant guides user through app creation
```

## Components

### NewAppDialog (`NewAppDialog.tsx`)

A simple modal dialog that:
- Allows user to select programming language (Python or Java)
- Creates a new chat with a pre-formatted message
- Navigates user to the new chat

**Props:**
```typescript
interface NewAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**
- Programming language selection (Python/Java)
- Loading state during chat creation
- Error handling with user-friendly messages
- Auto-navigation to new chat

### Integration in AppsTabsContainer

The dialog is integrated into the Apps tab bar:
- Opens when user clicks the "+" button
- Closes automatically after successful chat creation

## Initial Message Format

When a user selects a programming language and clicks "Start Building", a new chat is created with this message:

```
Hello! I want to build a Cyoda-based app using {programming_language}. Please start the build app workflow in an optimized flow.
```

Where `{programming_language}` is either "python" or "java".

## Technical Implementation

### Chat Creation

The dialog uses the `useAssistantStore` to create a new chat:

```typescript
const { data } = await assistantStore.postChats({
  name: chatMessage,
  description: ''
});
```

### Navigation

After successful chat creation, the user is automatically navigated to the new chat:

```typescript
navigate(`/chat-bot/view/${data.technical_id}`);
```

### Event Emission

The chat list is updated via event bus:

```typescript
eventBus.$emit(UPDATE_CHAT_LIST);
```

## User Experience

### Step 1: Open Dialog
- User clicks the "+" button in the Apps tab bar
- NewAppDialog modal appears

### Step 2: Select Language
- User sees two options:
  - 🐍 Python
  - ☕ Java
- User selects their preferred language

### Step 3: Review Information
- Info box explains what will happen:
  - A new chat will be created with the AI assistant
  - The assistant will guide through building the Cyoda app
  - User can interact with the assistant to customize the app

### Step 4: Start Building
- User clicks "Start Building" button
- Loading state shows "Starting Chat..."
- Chat is created in the background

### Step 5: Navigate to Chat
- User is automatically taken to the new chat
- AI assistant receives the initial message
- Conversation begins

## Error Handling

If chat creation fails:
- Error message is displayed to the user
- Dialog remains open
- User can try again or cancel

## Benefits of This Approach

1. **Simplicity**: No need for branch names or complex configuration
2. **Guided Experience**: AI assistant guides the user through the entire process
3. **Flexibility**: User can customize the app through conversation
4. **No Manual Setup**: No need to manually create branches or clone repositories
5. **Interactive**: User can ask questions and get help during the process

## Code Example

### Using the NewAppDialog

```typescript
import { NewAppDialog } from '@/components/AppsCanvas';

function MyComponent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsDialogOpen(true)}>
        Create New App
      </button>

      <NewAppDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
```

## Files

### Created/Modified
- `packages/web/src/components/AppsCanvas/NewAppDialog.tsx` - Dialog component
- `packages/web/src/components/AppsTabs/AppsTabsContainer.tsx` - Integration
- `packages/web/src/components/AppsCanvas/index.ts` - Export

### Removed
- `packages/web/src/services/appService.ts` - No longer needed

## Dependencies

- `react-router-dom` - For navigation
- `@/stores/assistant` - For chat creation
- `@/plugins/eventBus` - For event emission
- `antd` - For UI components
- `lucide-react` - For icons

## Future Enhancements

1. **More Languages**: Add support for more programming languages
2. **Templates**: Allow users to select from different app templates
3. **Custom Messages**: Let users customize the initial message
4. **Recent Chats**: Show recent app-building chats for quick access
5. **Progress Tracking**: Show progress of app creation in the chat

## Testing Checklist

- [ ] Dialog opens when clicking "+" button
- [ ] Programming language selection works
- [ ] "Start Building" button is disabled when no language selected
- [ ] Loading state appears during chat creation
- [ ] Success navigates to new chat
- [ ] Error displays user-friendly message
- [ ] Cancel closes dialog without creating chat
- [ ] Chat list is updated after creation
- [ ] Initial message is correctly formatted

## Summary

This simplified approach removes the complexity of branch creation and repository management, instead leveraging the AI assistant to guide users through the entire app creation process. The user simply selects a programming language, and the AI takes care of the rest through an interactive conversation.

