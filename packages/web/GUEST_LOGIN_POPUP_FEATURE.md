# Guest User Login Popup Feature

## Overview
This feature implements a login prompt for guest users when they attempt to send a message on the home page. The popup encourages users to log in for a better experience while still allowing them to proceed without logging in.

## Implementation Details

### 1. Token Detection
The system detects guest users by parsing the JWT token and checking if the `caas_org_id` field starts with "guest" (e.g., "guest.d1b4456f5-07a3-4c92-b57e-64c4b4f09d6").

### 2. Components Modified

#### LoginPopUp Component (`packages/web/src/components/LoginPopUp/LoginPopUp.tsx`)
- **Enhanced to support two modes:**
  - **Guest User Mode**: Shows a friendly message encouraging login with two options:
    - "Log in" button (primary action)
    - "Proceed without login" button (secondary action)
  - **Standard Mode**: Shows the original "Login Required" message

- **Event Listener**: Listens for `SHOW_LOGIN_POPUP` event with optional data payload
- **Callback Support**: Accepts `onProceedWithoutLogin` callback for handling guest user's choice to proceed

#### HomeView Component (`packages/web/src/views/HomeView.tsx`)
- **Guest Detection**: Added `isGuestUser` computed value using `useMemo` to parse token
- **Pending Message State**: Added `pendingMessage` state to store message and files when guest user attempts to send
- **Submit Flow**:
  1. When guest user submits a message, it's stored in `pendingMessage` state
  2. Login popup is shown with guest-specific messaging
  3. User can either:
     - **Log in**: Message is automatically sent after successful authentication
     - **Proceed without login**: Message is sent immediately as guest
- **Auto-send on Login**: Added `useEffect` to watch for authentication changes and automatically send pending message when user logs in

### 3. User Flow

#### Scenario 1: Guest User Logs In
1. Guest user types a message on home page
2. Clicks send button
3. Popup appears: "Enhance Your Experience"
4. User clicks "Log in"
5. Auth0 login flow completes
6. User is redirected back to home page
7. Message is automatically sent with authenticated token
8. User is navigated to the new chat

#### Scenario 2: Guest User Proceeds Without Login
1. Guest user types a message on home page
2. Clicks send button
3. Popup appears: "Enhance Your Experience"
4. User clicks "Proceed without login"
5. Message is sent immediately with guest token
6. User is navigated to the new chat

#### Scenario 3: Authenticated User
1. Authenticated user types a message
2. Clicks send button
3. Message is sent immediately (no popup)
4. User is navigated to the new chat

### 4. Message Preservation
The pending message (including attached files) is preserved in component state:
- Stored when popup is shown
- Sent automatically after login
- Sent immediately if user chooses to proceed without login
- Cleared after successful submission

### 5. UI/UX Improvements
- **Friendly messaging**: "Enhance Your Experience" instead of "Login Required"
- **Clear explanation**: Explains benefits of logging in
- **Non-blocking**: User can still proceed without login
- **Seamless experience**: Message is preserved and sent automatically after login

## Technical Implementation

### Token Parsing
```typescript
const isGuestUser = useMemo(() => {
  const token = authStore.token;
  if (!token) return false;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    const orgId = (parsed.caas_org_id || '').toLowerCase();
    // Check if orgId starts with 'guest' (e.g., "guest.d1b4456f5-07a3-4c92-b57e-64c4b4f09d6")
    return orgId.startsWith('guest');
  } catch (e) {
    return false;
  }
}, [authStore.token]);
```

### Event Emission
```typescript
eventBus.$emit(SHOW_LOGIN_POPUP, {
  isGuestUser: true,
  onProceedWithoutLogin: () => {
    submitChat(currentInput, currentFiles);
  }
});
```

### Auto-send After Login
```typescript
useEffect(() => {
  if (!isGuestUser && pendingMessage && authStore.token && authStore.tokenType === 'private') {
    console.log('User logged in, sending pending message:', pendingMessage);
    submitChat(pendingMessage.input, pendingMessage.files);
  }
}, [isGuestUser, authStore.token, authStore.tokenType, pendingMessage]);
```

## Testing Recommendations

### Manual Testing
1. **Test as Guest User**:
   - Clear browser storage
   - Navigate to home page
   - Type a message
   - Click send
   - Verify popup appears with correct messaging
   - Test both "Log in" and "Proceed without login" options

2. **Test Message Preservation**:
   - As guest, type a message with file attachments
   - Click send and choose "Log in"
   - Complete login
   - Verify message is sent automatically with files

3. **Test Authenticated User**:
   - Log in first
   - Type a message
   - Click send
   - Verify no popup appears and message is sent directly

### Edge Cases
- Empty message (should not trigger popup)
- Message with file attachments
- Login cancellation (message should remain in pending state)
- Multiple login attempts
- Network errors during submission

## Future Enhancements
- Add analytics to track conversion rate (guest → logged in)
- Add "Don't show again" option for guest users
- Persist pending message across page refreshes
- Add visual indicator showing message will be sent after login

