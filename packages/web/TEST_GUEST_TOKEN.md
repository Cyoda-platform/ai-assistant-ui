# Guest Token Testing

## Test Token
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJndWVzdC5kMWI0NTZmNS0wN2EzLTRjOTItYjU3ZS02NGM0YjRmMDk2ZDYiLCJjYWFzX29yZ19pZCI6Imd1ZXN0LmQxYjQ1NmY1LTA3YTMtNGM5Mi1iNTdlLTY0YzRiNGYwOTZkNiIsImlhdCI6MTc1OTM1NzY5NCwiZXhwIjoxNzg5NTk3Njk0fQ.iyUgsB7pZq2F2MWRr0yeW0WNF8HvB1ZvPOV5BlECWQE
```

## Decoded Payload
```json
{
  "sub": "guest.d1b4456f5-07a3-4c92-b57e-64c4b4f09d6",
  "caas_org_id": "guest.d1b4456f5-07a3-4c92-b57e-64c4b4f09d6",
  "iat": 1759357694,
  "exp": 1789597694
}
```

## Key Observation
The `caas_org_id` field is **not** just `"guest"`, but rather `"guest.{UUID}"` format:
- Example: `"guest.d1b4456f5-07a3-4c92-b57e-64c4b4f09d6"`

## Fix Applied
Changed the guest detection logic from:
```typescript
return orgId === 'guest';
```

To:
```typescript
return orgId.startsWith('guest');
```

This now correctly identifies any token where `caas_org_id` starts with "guest" as a guest user token.

## Testing Steps

### 1. Test in Incognito Mode (Guest User)
1. Open browser in incognito/private mode
2. Navigate to the home page
3. Type a message in the input field
4. Click the send button
5. **Expected**: Popup should appear with title "Enhance Your Experience"
6. **Expected**: Two buttons: "Log in" and "Proceed without login"

### 2. Test "Proceed without login" Option
1. Follow steps 1-4 above
2. Click "Proceed without login" button
3. **Expected**: Message is sent immediately with guest token
4. **Expected**: User is navigated to the new chat page

### 3. Test "Log in" Option
1. Follow steps 1-4 above
2. Click "Log in" button
3. Complete Auth0 login flow
4. **Expected**: After login, user is redirected back
5. **Expected**: Message is automatically sent with authenticated token
6. **Expected**: User is navigated to the new chat page

### 4. Test Authenticated User (No Popup)
1. Log in to the application first
2. Navigate to home page
3. Type a message
4. Click send button
5. **Expected**: No popup appears
6. **Expected**: Message is sent directly
7. **Expected**: User is navigated to the new chat page

### 5. Test with File Attachments
1. Open in incognito mode
2. Type a message
3. Attach one or more files
4. Click send button
5. **Expected**: Popup appears
6. Choose either option
7. **Expected**: Message is sent with all attached files

## Debug Console Logs
When testing, check the browser console for these logs:
- `"User logged in, sending pending message:"` - When auto-sending after login
- `"Error creating chat:"` - If there's an error during submission
- Token parsing errors (if any)

## Token Format Examples

### Guest Token
```
caas_org_id: "guest.{UUID}"
```

### Authenticated Token
```
caas_org_id: "{organization-id}"
```
(Should NOT start with "guest")

