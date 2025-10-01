# Infinite Loop Fix - WorkflowCanvas 🔧

## Problem

When adding environment sync feature to WorkflowCanvas, encountered an infinite loop error:

```
Error: Maximum update depth exceeded. This can happen when a component 
repeatedly calls setState inside componentWillUpdate or componentDidUpdate. 
React limits the number of nested updates to prevent infinite loops.
```

**Warning:**
```
The result of getSnapshot should be cached to avoid an infinite loop
```

## Root Cause

The issue was caused by `useParsedToken()` hook creating a **new object on every render**:

```typescript
// ❌ PROBLEMATIC CODE
const parsedToken = useParsedToken();

const buildEnvironmentUrl = useCallback((path: string) => {
  if (!parsedToken) return '';
  // ... uses parsedToken
}, [parsedToken]); // parsedToken changes every render!
```

### Why This Caused Infinite Loop

1. **`useParsedToken()` returns new object** every render
2. **`buildEnvironmentUrl` dependency** on `parsedToken` causes it to recreate
3. **Component re-renders** because callback changed
4. **Loop repeats** infinitely

### The Problematic Hook

```typescript
// In auth.ts
export const useParsedToken = () => 
  useAuthStore((state) => state.token ? parseJwt(state.token) : null);

function parseJwt(token: string): Record<string, any> | null {
  // Returns NEW object every time!
  return JSON.parse(jsonPayload);
}
```

## Solution

### ✅ Fixed Approach

Instead of using the entire parsed token object, we:
1. **Extract only what we need** (org ID)
2. **Memoize the extraction** with `useMemo`
3. **Use stable token string** as dependency

```typescript
// ✅ FIXED CODE
const token = useAuthStore((state) => state.token);

// Parse token once and extract org ID
const orgId = useMemo(() => {
  if (!token) return '';
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
    return (parsed.caas_org_id || '').toLowerCase();
  } catch (e) {
    return '';
  }
}, [token]); // token is a stable string

const buildEnvironmentUrl = useCallback((path: string) => {
  if (!orgId) return '';
  // ... uses orgId
}, [orgId]); // orgId only changes when token changes
```

## Key Changes

### 1. Removed `useParsedToken` Import

```diff
- import { useAuthStore, useParsedToken } from '@/stores/auth';
+ import { useAuthStore } from '@/stores/auth';
```

### 2. Changed Token Access

```diff
- const authStore = useAuthStore();
- const parsedToken = useParsedToken();
+ const token = useAuthStore((state) => state.token);
```

### 3. Added Memoized Org ID Extraction

```typescript
const orgId = useMemo(() => {
  if (!token) return '';
  // Parse and extract org ID
  return (parsed.caas_org_id || '').toLowerCase();
}, [token]);
```

### 4. Updated buildEnvironmentUrl Dependency

```diff
const buildEnvironmentUrl = useCallback((path: string) => {
-   if (!parsedToken) return '';
-   const orgId = (parsedToken.caas_org_id || '').toLowerCase();
+   if (!orgId) return '';
    // ... rest of code
- }, [parsedToken]);
+ }, [orgId]);
```

### 5. Updated Handler Dependencies

```diff
- }, [cleanedWorkflow, authStore.token, buildEnvironmentUrl]);
+ }, [cleanedWorkflow, token, buildEnvironmentUrl]);
```

## Why This Works

### Stable Dependencies

1. **`token`** - String value, only changes when actual token changes
2. **`orgId`** - Memoized string, only recalculates when token changes
3. **`buildEnvironmentUrl`** - Only recreates when orgId changes
4. **No infinite loop** - Dependencies are stable

### Comparison

| Approach | Dependency Type | Stability | Result |
|----------|----------------|-----------|---------|
| ❌ Old | Object (`parsedToken`) | New object every render | Infinite loop |
| ✅ New | String (`orgId`) | Stable, memoized | Works perfectly |

## React Best Practices Applied

### 1. Avoid Object Dependencies in useCallback

```typescript
// ❌ BAD - Object changes every render
const obj = { foo: 'bar' };
const callback = useCallback(() => {}, [obj]);

// ✅ GOOD - Primitive value is stable
const value = 'bar';
const callback = useCallback(() => {}, [value]);
```

### 2. Use useMemo for Expensive Computations

```typescript
// ✅ Parse token only when it changes
const orgId = useMemo(() => {
  return parseToken(token);
}, [token]);
```

### 3. Extract Only What You Need

```typescript
// ❌ BAD - Entire object
const parsedToken = useParsedToken();
const orgId = parsedToken.caas_org_id;

// ✅ GOOD - Only what you need
const orgId = useMemo(() => extractOrgId(token), [token]);
```

## Testing the Fix

### Before Fix
```
1. Open workflow canvas
2. Infinite loop error immediately
3. Page crashes
4. Error boundary catches it
```

### After Fix
```
1. Open workflow canvas
2. ✅ No errors
3. ✅ Canvas renders normally
4. ✅ Environment sync buttons work
5. ✅ No performance issues
```

## Lessons Learned

### 1. Be Careful with Zustand Selectors

```typescript
// ❌ Returns new object every time
export const useParsedToken = () => 
  useAuthStore((state) => state.token ? parseJwt(state.token) : null);

// ✅ Returns stable primitive
export const useToken = () => 
  useAuthStore((state) => state.token);
```

### 2. Memoize Object Creation

If you must create objects in hooks:

```typescript
// ✅ Memoize the object
const parsedToken = useMemo(() => {
  return token ? parseJwt(token) : null;
}, [token]);
```

### 3. Use Primitive Dependencies

Prefer strings, numbers, booleans over objects in dependency arrays.

### 4. Watch for "getSnapshot" Warnings

React's warning about caching `getSnapshot` is a red flag for infinite loops.

## Related Issues

This pattern can cause issues in:
- ✅ `useCallback` with object dependencies
- ✅ `useEffect` with object dependencies
- ✅ `useMemo` with object dependencies
- ✅ Zustand selectors returning new objects
- ✅ Redux selectors returning new objects

## Prevention

### Code Review Checklist

- [ ] Are all `useCallback` dependencies stable?
- [ ] Are objects in dependency arrays memoized?
- [ ] Do Zustand selectors return primitives when possible?
- [ ] Is expensive parsing memoized?
- [ ] Are there any "getSnapshot" warnings?

### ESLint Rules

Consider adding:
```json
{
  "rules": {
    "react-hooks/exhaustive-deps": "error"
  }
}
```

## Performance Impact

### Before Fix
- ❌ Infinite re-renders
- ❌ CPU at 100%
- ❌ Page unresponsive
- ❌ Memory leak

### After Fix
- ✅ Single render per state change
- ✅ Normal CPU usage
- ✅ Responsive UI
- ✅ No memory issues

## Conclusion

The fix demonstrates the importance of:
1. **Understanding React's rendering cycle**
2. **Using stable dependencies in hooks**
3. **Memoizing expensive computations**
4. **Extracting only needed data**
5. **Preferring primitives over objects**

**Result:** Workflow canvas now works perfectly with environment sync! 🎉

---

**Key Takeaway:** When using Zustand (or any state management), be careful about selectors that return new objects. Always prefer primitives or memoize object creation.

