# Text Responsive Container

A container component and utility system that automatically adjusts its size based on text content length, replacing the fixed `px-6 py-4` padding approach with dynamic, content-aware sizing.

## Problem Solved

The original class `"bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl rounded-tr-md px-6 py-4 shadow-lg hover:shadow-xl hover:border-slate-600 transition-all duration-200"` had several issues:

- **Fixed padding** (`px-6 py-4`) didn't adapt to content size
- **Blocking scroll bars** due to excessive horizontal padding
- **Poor text wrapping** for different content lengths
- **Inconsistent appearance** across different message sizes

## Solution

### 1. CSS Utility Classes

```css
.text-responsive-container {
  /* Dynamic padding based on content */
  padding: clamp(0.75rem, 2vw + 0.5rem, 1.5rem) clamp(1rem, 3vw + 0.75rem, 2rem);
  
  /* Responsive width */
  width: fit-content;
  max-width: 100%;
  min-width: 200px;
  
  /* Better text handling */
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
```

**Size Variants:**
- `.compact` - For short text (≤50 characters)
- `.comfortable` - For long text (≥200 characters)
- Default - For medium text (51-199 characters)

### 2. React Hook

```typescript
import { useTextResponsiveContainer } from '@/hooks/useTextResponsiveContainer';

const MyComponent = ({ text }) => {
  const containerInfo = useTextResponsiveContainer(text);
  
  return (
    <div className={containerInfo.className}>
      {text}
    </div>
  );
};
```

### 3. React Component

```typescript
import TextResponsiveContainer from '@/components/TextResponsiveContainer';

const MyComponent = ({ text }) => (
  <TextResponsiveContainer content={text}>
    {text}
  </TextResponsiveContainer>
);
```

## Usage Examples

### Basic Usage (CSS Classes)

```jsx
// Short text - automatically gets compact styling
<div className="text-responsive-container">
  Hi!
</div>

// Long text - automatically gets comfortable styling  
<div className="text-responsive-container">
  This is a much longer message that will automatically get more comfortable padding and better text wrapping to ensure optimal readability across different screen sizes and content lengths.
</div>
```

### With React Hook

```jsx
import { useTextResponsiveContainer } from '@/hooks/useTextResponsiveContainer';

const ChatMessage = ({ message }) => {
  const containerInfo = useTextResponsiveContainer(message.text);
  
  return (
    <div className={containerInfo.className}>
      <MarkdownRenderer>{message.text}</MarkdownRenderer>
      {containerInfo.isCompact && <CompactActions />}
      {containerInfo.isComfortable && <ExpandedActions />}
    </div>
  );
};
```

### With React Component

```jsx
import TextResponsiveContainer from '@/components/TextResponsiveContainer';

const Notification = ({ title, message }) => (
  <TextResponsiveContainer 
    content={`${title} ${message}`}
    variant="auto"
    className="rounded-tl-md"
  >
    <h4>{title}</h4>
    <p>{message}</p>
  </TextResponsiveContainer>
);
```

## Features

- **Automatic sizing** based on text length
- **Responsive breakpoints** for different screen sizes
- **Better text wrapping** with proper word breaks
- **Consistent spacing** that adapts to content
- **No scroll bar blocking** with proper padding calculations
- **Smooth transitions** between size variants
- **TypeScript support** with full type safety

## Chat UI Conventions

The system now properly supports standard chat UI conventions:

### User Messages (Right-aligned)
```jsx
// User messages appear on the right with teal styling
const containerInfo = useTextResponsiveContainer(messageText, {
  baseClass: 'text-responsive-container user-message'
});

<div className="flex justify-end mb-6">
  <div className="flex items-start space-x-3 max-w-[85%]">
    <div className="flex flex-col items-end">
      <div className={containerInfo.className}>
        {messageText}
      </div>
    </div>
    {/* User Avatar on the right */}
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600">
      <UserIcon />
    </div>
  </div>
</div>
```

### Bot Messages (Left-aligned)
```jsx
// Bot messages appear on the left with default styling
const containerInfo = useTextResponsiveContainer(messageText, {
  baseClass: 'text-responsive-container bot-message'
});

<div className="flex justify-start mb-6">
  <div className="flex items-start space-x-3 max-w-[95%]">
    {/* Bot Avatar on the left */}
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
      <BotIcon />
    </div>
    <div className="flex-1">
      <div className={containerInfo.className}>
        {messageText}
      </div>
    </div>
  </div>
</div>
```

## Migration

Replace the old fixed class:

```jsx
// Before
<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl rounded-tr-md px-6 py-4 shadow-lg hover:shadow-xl hover:border-slate-600 transition-all duration-200">

// After - for user messages
<div className="text-responsive-container user-message">

// After - for bot messages
<div className="text-responsive-container bot-message">
```

Or use the hook for more control:

```jsx
// Before
<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl rounded-tr-md px-6 py-4 shadow-lg hover:shadow-xl hover:border-slate-600 transition-all duration-200">

// After - User message
const containerInfo = useTextResponsiveContainer(textContent, {
  baseClass: 'text-responsive-container user-message'
});
<div className={containerInfo.className}>

// After - Bot message
const containerInfo = useTextResponsiveContainer(textContent, {
  baseClass: 'text-responsive-container bot-message'
});
<div className={containerInfo.className}>
```
