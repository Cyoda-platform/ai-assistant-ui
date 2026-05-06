# Branch Comparison: cyoda-cloud-workbench-ui vs develop

> **Context:**
> - `develop` — **original project, old working UI** (the baseline)
> - `cyoda-cloud-workbench-ui` — **new UI** (rebranding + new landing page, built on top of develop)
>
> **Diff sign convention** (`git diff cyoda-cloud-workbench-ui develop`):
> - lines with `-` — code in `cyoda-cloud-workbench-ui` (new UI, removed relative to develop)
> - lines with `+` — code in `develop` (old UI, the original)

---

## Summary

`cyoda-cloud-workbench-ui` is the **new UI built on top of `develop`**: light theme replaced with dark mode, rebranded to "CYODA AI" / "CYODA AI Studio", a marketing landing page added (FintechHomeView with GA and its own auth flow), LoginButton improved with authentication checks and `returnTo`, and `deepMergeTranslations` added for i18n.

**The backend was not changed** — only the UI, landing page, and label names differ.

**However, bugs were introduced during the dark theme migration** that broke the chat:
- `ChatBotView` was left with a light background (`bg-slate-50`) despite the dark theme
- `StreamingMessage` uses `prose` without `prose-invert` on a dark background
- An unrelated issue was also found: the backend changed its response field from `technical_id` to `chat_id`, breaking chat creation in both branches

**Update:** `App.tsx` was also changed (missed from the initial list — diff stat was truncated): post-login redirect changed to `/home`, auto-redirect of authenticated users from `/` to `/home` added, and `marketing-page` CSS class effect added for the landing page.

---

## 1. Routing & Navigation

**File:** `packages/web/src/router/index.tsx`

### Lazy loading and Suspense wrappers removed

In `cyoda-cloud-workbench-ui` all views are loaded via `React.lazy()` + `<Suspense fallback={<LoadingSpinner />}>`:
```tsx
// cyoda-cloud-workbench-ui (new UI):
const HomeView = lazy(() => import('@/views/HomeView'));
const ChatBotView = lazy(() => import('@/views/ChatBotView'));
// etc. for all 10 views
element: <Suspense fallback={<Fallback />}><HomeView /></Suspense>
```

In `develop` all views are **static imports**:
```tsx
// develop (baseline):
import HomeView from '@/views/HomeView';
import ChatBotView from '@/views/ChatBotView';
// etc.
element: <HomeView />
```

**Impact:** In `cyoda-cloud-workbench-ui` a loading spinner is shown on the first render of each view. In `develop` there is no code splitting — the entire bundle loads upfront. `FintechHomeView` is loaded **statically** in both branches (it's the landing page), which is correct for fast first paint.

### Route structure

The routes themselves (`/home`, `/chat/:technicalId`, `/canvas-demo`, `/workflows`, `/environments`, etc.) **are unchanged** — only the loading strategy differs.

---

## 2. State Management (stores/app.ts)

**File:** `packages/web/src/stores/app.ts`

### Forced dark mode

In `cyoda-cloud-workbench-ui` the theme is hard-coded to `'dark'`:
```ts
// cyoda-cloud-workbench-ui:
theme: 'dark', // Always dark mode - light mode not supported

setTheme(theme: string) {
  // Always enforce dark mode
  set({ theme: 'dark' });
  helperStorage.set("app:theme", 'dark');
}
```

In `develop` the theme is read from localStorage and defaults to `'light'`:
```ts
// develop:
theme: helperStorage.get('app:theme', 'light') as string,

setTheme(theme: string) {
  set({ theme });
  helperStorage.set("app:theme", theme);
}
```

**Impact:** In `cyoda-cloud-workbench-ui` it is impossible to switch to light theme either through the UI or programmatically. Any `setTheme('light')` call in the codebase has no effect.

---

## 3. App.tsx — Post-login Logic and Theme Handling

**File:** `packages/web/src/App.tsx` *(was not in the initial list — diff stat was truncated)*

### Post-login redirect

In `cyoda-cloud-workbench-ui` after a successful Auth0 login:
```tsx
const storedReturnTo = helperStorage.get<string>(LOGIN_REDIRECT_URL, APP_ENTRY_ROUTE); // default '/home'
const returnTo = !storedReturnTo || storedReturnTo === '/' ? APP_ENTRY_ROUTE : storedReturnTo;
```
`APP_ENTRY_ROUTE = '/home'`. If nothing is stored or `/` is stored — redirects to `/home`.

In `develop` the logic is simplified:
```tsx
const returnTo = helperStorage.get(LOGIN_REDIRECT_URL, '/');
```
After login, redirects to `/` (which now hosts the full chat interface — a copy of HomeView).

### Auto-redirect of authenticated users from `/` removed

In `cyoda-cloud-workbench-ui` there is an effect that pushes authenticated users from `/` to `/home`:
```tsx
useEffect(() => {
  if (auth0Loading || !isAuthenticated || location.pathname !== '/' || isAuth0Callback) return;
  navigate(APP_ENTRY_ROUTE, { replace: true }); // → '/home'
}, [...]);
```
In `develop` this effect is **removed** — authenticated users can stay at `/` (the chat UI lives there now).

### `marketing-page` class effect removed

In `cyoda-cloud-workbench-ui` visiting `/` added the `marketing-page` class to `<html>` (for landing-page-specific CSS variables). Removed in `develop` along with the landing page.

### `helperStorage` and effect dependencies

- `cyoda-cloud-workbench-ui`: `helperStorage` is created via `useMemo(() => new HelperStorage(), [])` and included in the auth effect's dependency array
- `develop`: `helperStorage` is created directly (`new HelperStorage()`) **without** `useMemo`, removed from the dep array

Functionally not critical, but in `develop` `helperStorage` is recreated on every render (potential perf issue, not a bug).

---

### Header.tsx

**File:** `packages/web/src/components/Header/Header.tsx`

All changes are **purely visual** (background color, button palette). No functional changes except:

1. **Page title (getPageTitle):**
   - `cyoda-cloud-workbench-ui`: returns `'Cyoda Cloud'`
   - `develop`: returns `'CYODA AI Assistant'`

2. **GitHub link:**
   - `cyoda-cloud-workbench-ui`: `https://github.com/Cyoda-platform/cyoda-go` (specific repo)
   - `develop`: `https://github.com/Cyoda-platform` (the entire org)

3. **Copyright year in ChatHistoryPanel footer:**
   - `cyoda-cloud-workbench-ui`: `© 2026`
   - `develop`: `Copyright © 2025`

### LayoutModern.tsx

**File:** `packages/web/src/layouts/LayoutModern.tsx`

1. **Branding:**
   - `cyoda-cloud-workbench-ui`: text `"Cyoda Cloud"` + badge `"BETA"`
   - `develop`: text `"CYODA"` + badge `"ALPHA"`

2. **Chat placeholder:**
   - `cyoda-cloud-workbench-ui`: `"Ask the AI assistant... (Ctrl+K to focus)"`
   - `develop`: `"Ask Cyoda AI Assistant... (Ctrl+K to focus)"`

---

## 4. Chat Components

### ChatBot.tsx

**File:** `packages/web/src/components/ChatBot/ChatBot.tsx`

Changes are **visual only** (dark background, modal button colors). Repository logic, `onAnswer` callbacks, event handling — **unchanged**.

### ChatBotSubmitForm.tsx

**File:** `packages/web/src/components/ChatBot/ChatBotSubmitForm.tsx`

1. **Placeholder:**
   - `cyoda-cloud-workbench-ui`: `'Ask the assistant…'`
   - `develop`: `'Ask Cyoda AI Assistant...'`

2. **Send icon color:**
   - `cyoda-cloud-workbench-ui`: `'#94a3b8'` (inactive) / `'#2563eb'` (active)
   - `develop`: `'#0D8484'` (inactive, commented "dark teal — matches CYODA logo") / `'#14b8a6'` (active)

3. **Focus border color:**
   - `cyoda-cloud-workbench-ui`: `border-blue-500 ring-blue-500/20`
   - `develop`: `border-emerald-500 ring-emerald-500/20`

All remaining changes are color-only.

### ChatLoader.tsx

**File:** `packages/web/src/components/ChatBot/ChatLoader.tsx`

1. **Default waiting message:**
   - `cyoda-cloud-workbench-ui`: `'Assistant is thinking…'`
   - `develop`: `'AI is thinking...'`

2. **Default agent name:**
   - `cyoda-cloud-workbench-ui`: `'Assistant'`
   - `develop`: `'CYODA AI'`

All remaining changes are visual.

### StreamingMessage.tsx

**File:** `packages/web/src/components/ChatBot/StreamingMessage.tsx`

1. **Default agent name:**
   - `cyoda-cloud-workbench-ui`: `'Assistant'`
   - `develop`: `'CYODA AI'`

2. **ADK error label:**
   - `cyoda-cloud-workbench-ui`: `'Processing Error'`
   - `develop`: `'AI Processing Error'`

3. **Streaming content Markdown class:**
   - `cyoda-cloud-workbench-ui`: CSS class `prose` (standard light-theme typography)
   - `develop`: CSS class `prose-invert prose` (inverted for dark background)

   **Impact:** See also the ChatBotView CSS conflict section below.

4. **Streaming font:**
   - `cyoda-cloud-workbench-ui`: default font
   - `develop`: `font-mono` during streaming (monospace)

### StreamErrorNotification.tsx

**File:** `packages/web/src/components/ChatBot/StreamErrorNotification.tsx`

1. **Error text (branding):**
   - `cyoda-cloud-workbench-ui`: refers to "the assistant"
   - `develop`: refers to "CYODA AI"

2. **ADK error icon color:**
   - `cyoda-cloud-workbench-ui`: `text-red-500`
   - `develop`: `text-purple-400`

3. **Default error icon color:**
   - `cyoda-cloud-workbench-ui`: `text-red-500`
   - `develop`: `text-pink-400`

All remaining changes are visual (red → pink/purple).

### ChatBotMessageFunction.tsx

**File:** `packages/web/src/components/ChatBot/ChatBotMessageFunction.tsx`

1. **Function badge label:**
   - `cyoda-cloud-workbench-ui`: `"UI Function"` (mixed case)
   - `develop`: `"UI FUNCTION"` (all caps)

2. **Execute button:**
   - `cyoda-cloud-workbench-ui`: blue (`bg-blue-600`)
   - `develop`: purple-indigo gradient (`from-purple-500 to-indigo-600`)

All remaining changes are visual (dark theme adaptation).

### ChatBotMessageNotification.tsx

**File:** `packages/web/src/components/ChatBot/ChatBotMessageNotification.tsx`

1. **Notification type labels:**
   - `cyoda-cloud-workbench-ui`: `"Code Changes"`, `"Background Task"`, `"Notification"`
   - `develop`: `"CODE CHANGES"`, `"BACKGROUND TASK"`, `"CYODA NOTIFICATION"` (all caps)

2. **Selected option styles:**
   - `cyoda-cloud-workbench-ui`: blue (`border-blue-400 bg-blue-50`)
   - `develop`: teal (`border-teal-500 bg-teal-500/20`)

All remaining changes are visual.

### ChatBotMessageQuestion.tsx

**File:** `packages/web/src/components/ChatBot/ChatBotMessageQuestion.tsx`

1. **AI badge label:**
   - `cyoda-cloud-workbench-ui`: `'Canvas AI'` or `'Assistant'`
   - `develop`: `'CANVAS AI'` or `'CYODA AI'` (all caps)

2. **Selected option styles in questions:**
   - `cyoda-cloud-workbench-ui`: `border-blue-400 bg-blue-50`
   - `develop`: `border-amber-400/70 bg-teal-500/15`

All remaining changes are visual (dark theme adaptation).

---

### ChatBotView.tsx — CSS Conflict (likely cause of empty chat)

**File:** `packages/web/src/views/ChatBotView.tsx`

The only functionally meaningful diff in ChatBotView (4 lines):

```tsx
// cyoda-cloud-workbench-ui:
<div className="main-layout bg-slate-50 text-slate-900">

// develop:
<div className="main-layout bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
```

**Critical conflict in `cyoda-cloud-workbench-ui`:**

- `App.tsx` forcibly adds `theme-dark` class to `<html>` → child components expect a dark background
- `ChatBot` and its child components (message bubbles, avatars, backgrounds) are styled for dark theme
- But `ChatBotView` sets a **light background** `bg-slate-50` with **dark text** `text-slate-900`
- `StreamingMessage.tsx` uses `prose` (not `prose-invert`) — text is readable on light background, but surrounding layout colors conflict

**Practical diagnosis:** if responses arrive from the server but the chat appears visually empty — check DevTools → Network → request to `/v1/chats/{id}/stream`:
- **Status 200, data flowing** → responses are rendering but `text-slate-900` (dark text) on components expecting a dark background makes them invisible
- **Status 401/403** → auth token not being sent correctly
- **Request hangs** → backend issue or CORS

---

## 5. Chat History Panel

**File:** `packages/web/src/components/ChatHistoryPanel/ChatHistoryPanel.tsx`

1. **Copyright year in footer:**
   - `cyoda-cloud-workbench-ui`: `© 2026`
   - `develop`: `Copyright © 2025`

2. **Active history item style:**
   - `cyoda-cloud-workbench-ui`: `bg-blue-50 text-slate-900 border border-blue-200`
   - `develop`: `style={{ backgroundColor: 'rgba(20, 184, 166, 0.2)' }}` (inline JS style, not Tailwind)

3. **"New Chat" button:**
   - `cyoda-cloud-workbench-ui`: `bg-blue-600 hover:bg-blue-700`
   - `develop`: `bg-gradient-to-r from-teal-500 to-cyan-600` with shadow

All remaining changes are visual (dark theme adaptation).

---

## 6. Environments Panel (EnvironmentDetails, EnvironmentsPanel)

**Files:** `packages/web/src/components/EnvironmentsPanel/EnvironmentsPanel.tsx`, `EnvironmentDetails.tsx`

All changes are **purely visual** (dark background, button and icon color palette: blue → teal). The functional logic (API calls, state management, Redeploy buttons, etc.) is **unchanged**.

---

## 7. HomeView & FintechHomeView

### HomeView.tsx

**File:** `packages/web/src/views/HomeView.tsx`

1. **PROMPT_EXAMPLES array removed:**
   - `cyoda-cloud-workbench-ui` had a `PROMPT_EXAMPLES` constant defined directly in the file
   - `develop` reads examples from i18n translations (via `t('examples.items.clickable')`)

2. **New dependencies added in `develop`:**
   - Imports `ppl1...ppl10` — 10 person images (for testimonials / personas section)
   - Imports `CyodaLogo` (`cyoda_ai.png`) and `LogoSmall`
   - Imports `ResizeHandle`, `LoadingSpinner`
   - State `currentPromptIndex` (index for examples carousel)

3. **Chat creation on error:**
   - `cyoda-cloud-workbench-ui`: `postChats(formData as any)` (forced type cast)
   - `develop`: `postChats(formData)` (no type cast)

4. **Navigation on chat creation error:**
   - `develop` explicitly added: `navigate('/', { replace: true })` — returns to home on error

5. **Example prompts display:**
   - `cyoda-cloud-workbench-ui`: simple pill buttons in `flex-wrap`
   - `develop`: Ant Design `<Row>/<Col>` grid with `<Button type="default">`

6. **Chat footer (NewChat):**
   - `cyoda-cloud-workbench-ui`: inline Tailwind styles
   - `develop`: non-Tailwind CSS classes (`new-chat__footer`)

### FintechHomeView.tsx

**File:** `packages/web/src/views/FintechHomeView.tsx`

This is the most significant change. In `cyoda-cloud-workbench-ui` FintechHomeView was a **marketing landing page** with:
- Google Analytics integration (`dataLayer`, `pushGA` function)
- Static `WorkflowEditorPreviewPlaceholder`
- FAQ section (`faqs`, `FAQItem`)
- Its own Auth0 logic (`useAuth0`, `loginWithRedirect`, `isAuthenticated`)
- Constant `APP_ENTRY_ROUTE = '/home'`
- Redirect `returnTo: APP_ENTRY_ROUTE` on login

In `develop` FintechHomeView has effectively **become a copy of HomeView** — with the same imports, the same person images, the same components (ChatHistoryPanel, EnvironmentsPanel, Header). All marketing-specific logic is **removed**:
- No `useAuth0` / `loginWithRedirect`
- No `pushGA` and Google Analytics
- No `APP_ENTRY_ROUTE`
- No `WorkflowEditorPreviewPlaceholder`
- No FAQ section

**Impact:** If the app has a route pointing to FintechHomeView, in `develop` users will see the full chat interface instead of a landing page. The authentication flow through the landing page button is **gone**.

---

## 8. Authentication (LoginButton)

**File:** `packages/web/src/components/LoginButton/LoginButton.tsx`

This is one of the **most critical functional changes**.

### cyoda-cloud-workbench-ui (full implementation):
```tsx
const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
const navigate = useNavigate();

const onClick = async (event) => {
  // Block while Auth0 is initializing
  if (isLoading) return;
  // Already authenticated — navigate to /home
  if (isAuthenticated) {
    navigate('/home');
    return;
  }
  // Save redirect target in storage
  helperStorage.set(LOGIN_REDIRECT_URL, '/home');
  localStorage.setItem('LOGIN_REDIRECT_URL', '/home');
  // Auth0 with appState
  await loginWithRedirect({
    appState: { returnTo: '/home' },
    authorizationParams: { prompt: 'login' }
  });
};
// Button is disabled during loading: disabled={isLoading}
```

### develop (simplified implementation):
```tsx
const { loginWithRedirect } = useAuth0();

const onClick = () => {
  helperStorage.set(LOGIN_REDIRECT_URL, '/');
  loginWithRedirect({
    authorizationParams: { prompt: 'login' }
  });
};
// No disabled, no checks, no try/catch
```

**What `develop` is missing:**
1. No `isLoading` check — button is clickable while Auth0 is initializing
2. No `isAuthenticated` check — already authenticated users are sent back to the login page
3. No `appState.returnTo` — Auth0 cannot return the user to the correct page after login
4. Redirect URL changed from `/home` to `/`
5. No `try/catch` — unhandled exceptions from `loginWithRedirect` bubble up uncaught
6. No `useNavigate` dependency removed
7. No `disabled={isLoading}` on the button

---

## 9. New Chat

**File:** `packages/web/src/components/NewChat/NewChat.tsx`

1. **New Ant Design components added:**
   - `develop` added `Row`, `Col` from antd for grid layout of examples

2. **Added iframe check:**
   - `develop` imports `isInIframe` (explicit usage not visible in diff)

3. **Examples style:**
   - `cyoda-cloud-workbench-ui`: `<button>` with Tailwind classes
   - `develop`: `<Button type="default" className="new-chat__example-btn">` from Ant Design + `<Row>/<Col>`

4. **Container CSS classes:**
   - `cyoda-cloud-workbench-ui`: inline Tailwind (`bg-white min-h-full`, `max-w-2xl mx-auto px-6 py-12`)
   - `develop`: BEM classes (`new-chat__content`, `new-chat__header`, `new-chat__title`, etc.)

5. **Submit field:**
   - `cyoda-cloud-workbench-ui`: `bg-blue-600` + Tailwind classes
   - `develop`: only `className="new-chat__submit-btn"` (styles via CSS, not Tailwind)

6. **Footer link:** inline Tailwind classes removed, uses inherited styles.

---

## 10. i18n / Translations

### en.json

**File:** `packages/web/src/i18n/en.json`

| Key | cyoda-cloud-workbench-ui | develop |
|-----|--------------------------|---------|
| `new_chat.h1` | `"Cyoda Cloud Workbench"` | `"BUILD WITH CYODA AI"` |
| `new_chat.h2` | `"Model entity lifecycles, generate workflows, connect processors, and inspect history on hosted Cyoda."` | `"Create complete applications with entities, workflows, and REST APIs using intelligent code generation"` |
| `new_chat.input.placeholder` | `"Describe the entity, workflow, or service you want to build."` | `"Build a customer management system, create entities, or deploy your environment..."` |
| `new_chat.title` | `"Start a Cyoda Cloud session"` | `"What would you like to build today?"` |
| `examples.items.readonly` | `"+100 different workflow types"` | `"+100 different application types"` |
| `examples.items.clickable[0]` | `"Model a trade settlement lifecycle"` | `"What is CYODA and how does it work?"` |
| `examples.items.clickable[1]` | `"Create a KYC onboarding workflow"` | `"Build a complete customer management system with CRUD operations..."` |
| `examples.items.clickable[2]` | `"Add an entity with lifecycle states"` | `"Create a simple task management app with Python"` |
| `examples.items.clickable[3]` | `"Connect a Java processor"` | `"Generate a Java application for inventory tracking..."` |
| `examples.items.clickable[4]` | `"Explain this workflow"` | `"Add a Customer entity with id, name, email, and phone fields"` |
| `examples.items.clickable[5]` | `"Generate a Python service stub"` | `"Create REST endpoints for Product entity with GET, POST, PUT, DELETE"` |

**Takeaway:** In `cyoda-cloud-workbench-ui` examples are oriented toward Cyoda's fintech/workflow specifics. In `develop` examples are reoriented toward general application development (CRUD, REST API, Python/Java).

### plugins/i18n.ts — CRITICAL CHANGE

**File:** `packages/web/src/plugins/i18n.ts`

In `cyoda-cloud-workbench-ui` a `deepMergeTranslations` function **merges** server translations with the local baseline:
```ts
// cyoda-cloud-workbench-ui:
const deepMergeTranslations = (base, overrides) => { /* recursive merge */ };
// On load:
return deepMergeTranslations(enJson, isPlainObject(data) ? data : {});
```

In `develop` this function is **removed** and server translations are returned directly:
```ts
// develop:
return data; // Simply returns server data without merging with en.json
```

**Impact:** If the server returns partial translations (only changed keys), in `develop` all other keys from `en.json` will be **lost** — the app will show empty strings. In `cyoda-cloud-workbench-ui` this was handled correctly via deepMerge. On translation load error, both variants correctly fall back to `enJson`.

---

## 11. Tests

### LoginButton.test.tsx

**File:** `packages/web/src/components/LoginButton/LoginButton.test.tsx`

1. `waitFor` and `fireEvent` imports **removed**
2. Mocks for `useNavigate`, `isAuthenticated`, `isLoading` **removed** — not used in `develop`
3. **Expected redirect URL changed:** `/home` → `/`
4. **`appState.returnTo` removed** from expected `loginWithRedirect` arguments
5. **Error handling behavior changed:**
   - `cyoda-cloud-workbench-ui`: `expect(() => fireEvent.click(button)).not.toThrow()` — errors are caught
   - `develop`: `expect(() => fireEvent.click(button)).toThrow('Auth0 error')` — errors are **not caught**, they bubble up

### LayoutModern.test.tsx

**File:** `packages/web/src/layouts/LayoutModern.test.tsx`

1. **Expected branding changed:**
   - `cyoda-cloud-workbench-ui`: `'Cyoda Cloud'` + `'BETA'`
   - `develop`: `'CYODA'` + `'ALPHA'`

2. **Placeholder changed:** `'Ask the AI assistant'` → `'Ask Cyoda AI Assistant'`

### HomeView.test.tsx

**File:** `packages/web/src/views/HomeView.test.tsx`

1. **`useAssistantStore` mock changed:**
   - `cyoda-cloud-workbench-ui`: mocked `chatList`, `chatListReady`, `isLoadingChats`, `isLoadingMoreChats`, `hasMoreChats`, `isTransferringChats`, `loadMoreChats`, `deleteChatById`
   - `develop`: mocks only `chats`, `isLoading`, `fetchChats`, `createChat`, `getChats` — part of the store API **renamed or removed**

2. **`useAuthStore` mock changed:**
   - `cyoda-cloud-workbench-ui`: `token: 'test-token'`, `useSuperUserMode: () => false`
   - `develop`: removed `token`, `useSuperUserMode: () => ({ isSuperUser: false, toggleSuperUser: vi.fn() })` — different return value shape

3. **Mocks removed:** `eventBus`, `HelperChatGroups`, `localStorageMock`

4. **Mocks added:** `ResizeHandle`, `LoadingSpinner`

5. **Test removed:** `'should not contain old AI Studio branding'` — the test verified that texts `'Cyoda AI Studio'` and `'BUILD WITH CYODA AI'` were absent. In `develop` the second text **is present** (it's the new h1 in en.json), so the test was deleted.

### AppsCanvas.tsx

**File:** `packages/web/src/components/AppsCanvas/AppsCanvas.tsx`

Only change: added `// eslint-disable-next-line react-hooks/exhaustive-deps` to a `useEffect`. Functionally no change — only suppresses an ESLint warning about hook dependencies.

---

## 12. Tailwind Configuration

**File:** `packages/web/tailwind.config.js`

In `cyoda-cloud-workbench-ui` custom fonts are declared:
```js
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'Arial', 'sans-serif'],
      mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
    },
  },
},
```

In `develop` these fonts are **removed** — Tailwind's system font defaults are used.

**Impact:** In `develop` Inter and JetBrains Mono fonts will **not be applied** even if they are loaded in CSS. Monospace text in ChatLoader (tool arguments), StreamingMessage, and other places will fall back to the system monospace font.

---

## 14. Conclusion

### What's new in cyoda-cloud-workbench-ui (relative to the old develop)

The new UI introduced the following **intentional** changes:
- Forced dark theme everywhere (`theme-dark` applied globally, `setTheme` ignores its argument)
- Rebranding: `'Cyoda Cloud'` → `'CYODA AI Assistant'`, badge `'BETA'` → `'ALPHA'`
- New marketing landing page (`FintechHomeView` with GA, FAQ, its own auth flow)
- Improved `LoginButton`: added `isAuthenticated` check, `returnTo`, error handling
- `deepMergeTranslations` in i18n — server translations now merge with local ones
- Lazy loading for all views via `React.lazy()` + `Suspense`
- Auto-redirect of authenticated users from `/` to `/home` (App.tsx)
- Inter / JetBrains Mono fonts in Tailwind config
- Prompt examples reoriented to Cyoda fintech/workflow specifics
- Copyright year: `2025` → `2026`

### Bugs introduced during the dark theme migration (fixed in cyoda-cloud-workbench-ui-2)

1. **ChatBotView — light background in a dark app** ✅ fixed:
   - Was: `bg-slate-50 text-slate-900` — light container, message components invisible
   - Now: `bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white`

2. **StreamingMessage — unreadable Markdown** ✅ fixed:
   - Was: `prose` (light typography) on dark background → text invisible
   - Now: `prose-invert prose` + dark bubble background

3. **HomeView — chat created but navigation never happened** ✅ fixed:
   - Backend changed `POST /v1/chats` response field from `technical_id` to `chat_id`
   - Code only checked `response.data.technical_id` → always `undefined` → user stuck on temp ID forever
   - Fixed: check `technical_id || chat_id`

### What remained unchanged (backend integration)

- All API endpoints and streaming logic (`streamingService.ts`)
- Auth store (`auth.ts`) and assistant store (`assistant.ts`)
- Route structure (paths `/home`, `/chat/:id`, `/environments`, etc.)
- Chat logic (streaming, retry, error handling)
- Environments panel (functionality)
- Chat history panel (functionality)

### What remains unchanged:

- All API endpoints and backend integrations
- Route structure (the paths themselves)
- All chat logic (streaming, retry, error handling)
- Environments panel (functionality)
- Chat history panel (functionality)
- Canvas/AppsCanvas (except the eslint comment)
- Auth store
- Assistant store
