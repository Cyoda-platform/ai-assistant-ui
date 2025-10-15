# New App Creation - Quick Start

## 🚀 For Users

### How to Create a New App

1. **Click the "+" button** in the Apps tab bar
2. **Enter your app name** (or choose from suggestions):
   - Pet Store
   - Weather Forecast
   - Or enter your own custom name
3. **Select your programming language**:
   - 🐍 Python
   - ☕ Java
4. **Click "Start Building"**
5. **Chat with the AI assistant** to build your app

That's it! The AI will guide you through the entire process, and you'll see:
- 📜 **Chat History** on the left
- 🎨 **Canvas** in the middle (with your new app)
- 💬 **Chat Window** on the right

## 💻 For Developers

### Using the NewAppDialog Component

```typescript
import { NewAppDialog } from '@/components/AppsCanvas';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Create New App
      </button>

      <NewAppDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

### Component Props

```typescript
interface NewAppDialogProps {
  isOpen: boolean;                        // Controls dialog visibility
  onClose: () => void;                    // Called when dialog is closed
  onSuccess?: (chatId: string) => void;   // Called when chat is created successfully
}
```

## 📋 What Happens

When a user creates a new app:

1. **Dialog Opens**: User sees app name input and programming language options
2. **App Name Entry**: User enters a custom name or selects from suggestions (Pet Store, Weather Forecast)
3. **Language Selection**: User chooses Python or Java
4. **Chat Creation**: A new chat is created with this message:
   ```
   Hello! I want to build a Cyoda-based app called "{appName}" using {language}.
   Please start the build app workflow in an optimized flow.
   ```
5. **Navigation**: User is taken to the new chat with all panels open:
   - Chat History (left)
   - Canvas (middle) - showing the new app
   - Chat Window (right)
6. **AI Interaction**: AI assistant guides the user through app creation

## 🎨 UI Components

### Dialog Structure

```
┌─────────────────────────────────────────┐
│  🔵 Create New Application              │
├─────────────────────────────────────────┤
│                                         │
│  App Name *                             │
│  ┌───────────────────────────────────┐ │
│  │ Pet Store                    ▼   │ │
│  └───────────────────────────────────┘ │
│  Choose from suggestions or enter own   │
│                                         │
│  Programming Language *                 │
│  ┌───────────────────────────────────┐ │
│  │ 🐍 Python                    ▼   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ℹ️ What happens next:                  │
│  • A new chat will be created           │
│  • AI will guide you through building   │
│  • You can customize through chat       │
│                                         │
│              [Cancel] [Start Building]  │
└─────────────────────────────────────────┘
```

## 🔧 Technical Details

### Chat Creation API

```typescript
// Create a new chat
const { data } = await assistantStore.postChats({
  name: chatMessage,
  description: ''
});

// Navigate to the chat
navigate(`/chat-bot/view/${data.technical_id}`);

// Update chat list
eventBus.$emit(UPDATE_CHAT_LIST);
```

### Initial Message Format

```typescript
const chatMessage = `Hello! I want to build a Cyoda-based app called "${appName.trim()}" using ${programmingLanguage}. Please start the build app workflow in an optimized flow.`;
```

### App Name Suggestions

The dialog provides these predefined suggestions:
- **Pet Store** - A sample e-commerce application
- **Weather Forecast** - A weather data application

Users can also enter their own custom app name.

## 📁 File Structure

```
packages/web/src/components/
├── AppsCanvas/
│   ├── NewAppDialog.tsx          # Main dialog component
│   ├── index.ts                  # Exports
│   ├── NEW_APP_WORKFLOW.md       # Detailed documentation
│   └── README.md                 # This file
└── AppsTabs/
    └── AppsTabsContainer.tsx     # Integration point
```

## 🎯 Integration Points

### AppsTabsContainer

```typescript
// State for dialog
const [isNewAppDialogOpen, setIsNewAppDialogOpen] = useState(false);

// Open dialog on + button click
const handleNewTab = useCallback(() => {
  setIsNewAppDialogOpen(true);
}, []);

// Render dialog
<NewAppDialog
  isOpen={isNewAppDialogOpen}
  onClose={() => setIsNewAppDialogOpen(false)}
/>
```

## ✅ Features

- ✅ Simple language selection (Python/Java)
- ✅ Automatic chat creation
- ✅ Auto-navigation to chat
- ✅ Loading states
- ✅ Error handling
- ✅ Clean, modern UI
- ✅ Dark mode support

## 🐛 Troubleshooting

### Dialog doesn't open
```typescript
// Check if state is being set
console.log('isDialogOpen:', isNewAppDialogOpen);
```

### Chat creation fails
```typescript
// Check browser console for errors
// Verify assistantStore.postChats is working
// Check network tab for API calls
```

### Navigation doesn't work
```typescript
// Verify react-router-dom is set up correctly
// Check if navigate function is available
```

## 🎨 Styling

The dialog uses:
- **Ant Design** components (Modal, Select, Button)
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Dark mode** support built-in

## 📚 Related Documentation

- **Detailed Workflow**: See `NEW_APP_WORKFLOW.md`
- **Assistant Store**: See `packages/web/src/stores/assistant.ts`
- **Chat Components**: See `packages/web/src/components/ChatBot/`

## 🚦 Status

- ✅ UI Implementation: Complete
- ✅ Chat Integration: Complete
- ✅ Navigation: Complete
- ✅ Documentation: Complete
- ✅ Ready for Use: Yes

## 💡 Tips

### Customize the Initial Message

Edit the message in `NewAppDialog.tsx`:

```typescript
const chatMessage = `Your custom message using ${programmingLanguage}`;
```

### Add More Languages

Add more options to the Select component:

```typescript
<Option value="typescript">
  <div className="flex items-center gap-2">
    <span>📘</span>
    <span>TypeScript</span>
  </div>
</Option>
```

### Handle Success Callback

If you need to do something after chat creation:

```typescript
try {
  const { data } = await assistantStore.postChats({...});
  
  // Your custom logic here
  console.log('Chat created:', data.technical_id);
  
  navigate(`/chat-bot/view/${data.technical_id}`);
} catch (error) {
  // Handle error
}
```

## 🎉 Summary

This simplified approach:
- **Removes complexity** of branch creation and repository management
- **Leverages AI** to guide users through app creation
- **Provides flexibility** through conversational interface
- **Improves UX** with a simple, intuitive workflow

Users simply select a language and let the AI do the rest! 🚀

---

**Last Updated**: 2025-01-14  
**Version**: 2.0.0 (Simplified)  
**Status**: Production Ready ✅

