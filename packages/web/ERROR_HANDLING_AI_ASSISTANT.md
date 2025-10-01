# AI Assistant Error Handling 🚨

## Overview

The AI Assistant now has comprehensive error handling that displays errors directly in the chat interface with clear, user-friendly messages.

## Error Display

### Visual Design

Errors are displayed as special message bubbles with:
- **Red background** (light: red-50, dark: red-950/30)
- **Red border** (2px, light: red-200, dark: red-800)
- **Red text** (light: red-900, dark: red-100)
- **Emoji indicators** for quick recognition

### Error Types Handled

#### 1. 403 - Access Denied 🔒

**Display:**
```
🔒 Access Denied (403)

[Server error message if available]
or
You don't have permission to access the AI assistant. 
Please check your authentication or contact your administrator.
```

**Styling:** Red error bubble with lock emoji

**Common Causes:**
- User doesn't have AI assistant permissions
- Invalid or expired authentication token
- Insufficient role/permissions

---

#### 2. 401 - Authentication Required 🔐

**Display:**
```
🔐 Authentication Required (401)

Your session may have expired. Please log in again.
```

**Styling:** Red error bubble with key emoji

**Common Causes:**
- Session expired
- Token invalid
- User logged out

---

#### 3. 429 - Rate Limit Exceeded ⏱️

**Display:**
```
⏱️ Rate Limit Exceeded (429)

Too many requests. Please wait a moment and try again.
```

**Styling:** Red error bubble with clock emoji

**Common Causes:**
- Too many API calls in short time
- Rate limiting by server
- Need to wait before retry

---

#### 4. 500 - Server Error ⚠️

**Display:**
```
⚠️ Server Error (500)

The server encountered an error. Please try again later.
```

**Styling:** Red error bubble with warning emoji

**Common Causes:**
- Backend service error
- Database connection issues
- Internal server problems

---

#### 5. Network Error 🌐

**Display:**
```
🌐 Network Error

Unable to connect to the server. 
Please check your internet connection.
```

**Styling:** Red error bubble with globe emoji

**Common Causes:**
- No internet connection
- Server unreachable
- Firewall blocking requests

---

#### 6. Generic HTTP Errors ❌

**Display:**
```
❌ Error [STATUS_CODE]

[Server error message or "An unexpected error occurred."]
```

**Styling:** Red error bubble with X emoji

**Applies to:** Any other 4xx or 5xx status codes

---

## Error Handling Flow

```
User sends message
    ↓
API call to /v1/chats/{id}/text-questions
    ↓
    ├─ Success → Display AI response
    │
    └─ Error → Catch error
              ↓
              Extract error details:
              - Status code
              - Error message from server
              - Error type
              ↓
              Format error message with:
              - Emoji indicator
              - Status code
              - User-friendly explanation
              ↓
              Display as assistant message
              with red error styling
```

## Implementation Details

### Error Detection

```typescript
catch (error: any) {
  if (error?.response) {
    const status = error.response.status;
    const errorData = error.response.data;
    
    // Check status code and format message
    if (status === 403) {
      // Access denied handling
    } else if (status === 401) {
      // Authentication handling
    }
    // ... etc
  }
}
```

### Error Message Styling

```typescript
const isError = message.role === 'assistant' && (
  message.content.includes('Error') || 
  message.content.includes('403') || 
  message.content.includes('401') ||
  // ... other error indicators
);

// Apply red styling if error detected
className={isError 
  ? 'bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800'
  : 'bg-gray-100 dark:bg-gray-800'
}
```

## User Experience

### What Users See

1. **User sends question** → Message appears in purple bubble
2. **Error occurs** → Red error bubble appears with clear explanation
3. **User can:**
   - Read the error message
   - Copy the error for support
   - Try again with a different question
   - Close the AI assistant

### No Global Error Modal

The AI Assistant errors are **NOT** shown in the global error modal because:
- `/text-questions` endpoint is excluded from global error handling
- Errors are displayed inline in the chat for better UX
- Users stay in context without modal interruptions

## Testing Error Scenarios

### Test 403 Error

```bash
# Mock 403 response
curl -X POST http://localhost/api/v1/chats/test-id/text-questions \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}' \
  -w "%{http_code}"
```

**Expected Result:**
```
🔒 Access Denied (403)

[Your server's error message]
```

### Test Network Error

1. Disconnect internet
2. Send a message in AI Assistant
3. Should see: "🌐 Network Error"

### Test Rate Limit

1. Send multiple messages rapidly
2. Should see: "⏱️ Rate Limit Exceeded (429)"

## Debugging

### Console Logging

All errors are logged to console:
```javascript
console.error('Error sending message to AI:', error);
```

Check browser console for:
- Full error object
- Stack trace
- Network request details

### Error Object Structure

```typescript
{
  response: {
    status: 403,
    data: {
      message: "Access denied",
      error: "Insufficient permissions"
    }
  }
}
```

## Best Practices

### For Users

1. **Read the error message** - It explains what went wrong
2. **Check your connection** - For network errors
3. **Wait and retry** - For rate limit errors
4. **Contact support** - For persistent 403/500 errors
5. **Copy error message** - Use copy button for support tickets

### For Developers

1. **Always catch errors** - Never let errors crash the UI
2. **Provide context** - Include status codes and messages
3. **Use emojis** - Quick visual indicators
4. **Log to console** - For debugging
5. **Test all scenarios** - 403, 401, 429, 500, network errors

## Future Enhancements

Potential improvements:

- [ ] **Retry button** - Automatic retry for failed requests
- [ ] **Error analytics** - Track error frequency
- [ ] **Offline mode** - Queue messages when offline
- [ ] **Error recovery** - Auto-refresh token on 401
- [ ] **Custom error pages** - Per-error-type help pages
- [ ] **Support ticket** - Create ticket from error
- [ ] **Error history** - View past errors in session

## Related Files

- `WorkflowAIAssistant.tsx` - Main error handling logic
- `error.ts` - Global error interceptor (excludes /text-questions)
- `HelperErrors.tsx` - Global error modal handler
- `ErrorModal.tsx` - Global error modal component

## FAQ

**Q: Why don't I see the global error modal?**
A: The AI Assistant handles errors inline. The `/text-questions` endpoint is excluded from global error handling for better UX.

**Q: Can I customize error messages?**
A: Yes, edit the error handling in `WorkflowAIAssistant.tsx` sendMessage function.

**Q: How do I test 403 errors locally?**
A: Mock the API response or configure your backend to return 403 for testing.

**Q: Will errors be logged?**
A: Yes, all errors are logged to browser console with `console.error()`.

**Q: Can users report errors?**
A: Users can copy the error message using the copy button and send it to support.

---

**Error handling is now production-ready!** 🎉

All HTTP errors (403, 401, 429, 500, etc.) and network errors are caught and displayed beautifully in the AI Assistant chat interface.

