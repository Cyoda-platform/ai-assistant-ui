# UI Audit Report: Cyoda Cloud Authenticated Experience

## 1. Summary
The current authenticated experience (after login) is heavily branded as "Cyoda AI Studio." It features a dark-themed, gamified interface with neon accents (teal, pink, orange), playful imagery (mascots, avatars, person photos), and an AI-first positioning. This contrasts sharply with the new technical, developer-first, and "calm" direction of the public Cyoda estate. The core functional power of the application (Canvas, Workflow Editor, GitOps integration) is wrapped in this legacy shell.

## 2. Current Authenticated UI Architecture
The authenticated app shell is primarily composed of:
- **Main Shell**: `packages/web/src/views/ChatBotView.tsx` acts as the primary workspace container, managing resizable panels for History, Environments, Tasks, and the Canvas.
- **Top Navigation**: `packages/web/src/components/Header/Header.tsx` provides the product branding ("Cyoda Cloud" text but uses old logos), panel toggles, and user controls.
- **Home/Landing**: `packages/web/src/views/HomeView.tsx` renders the "AI Studio" dashboard with the carousel and quick actions.
- **Layouts**: 
  - `LayoutModern.tsx`: A legacy dark layout with its own sidebar and header logic (partially redundant with `ChatBotView`).
  - `LayoutDefault.tsx`: A simple Ant Design wrapper.

## 3. Route and Layout Map
| Path | Component | Layout / Wrapper | Theme | Redesign Priority |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `FintechHomeView` | None | Light (New) | Low (Already updated) |
| `/home` | `HomeView` | None (Internal Layout) | Dark (Old) | **Critical** |
| `/chat/:technicalId` | `ChatBotView` | `Header` + Panels | Dark (Old) | **Critical** |
| `/new-chat` | `NewChatView` | `LayoutDefault` | Dark (Old) | High |
| `/workflows` | `WorkflowTabsView` | `Header` | Dark (Old) | Medium |
| `/environments` | `EnvironmentsPage` | `Header` | Dark (Old) | Medium |
| `/logs` | `LogsView` | `Header` | Dark (Old) | Medium |

## 4. Components Rendering the Old UI
- **Branding/Hero**: `HomeView.tsx` (lines 740-830) contains the "Cyoda AI Studio" title, "Build with Cyoda" tagline, and the person-based carousel.
- **Top Nav**: `Header.tsx` (lines 170-200) renders the logo and toggle buttons with neon highlights (`text-teal-400`).
- **Prompt Suggestions**: `NewChat.tsx` and `HomeView.tsx` (quickActions array).
- **Avatars/Mascots**: `Header.tsx` (user profile gradient) and `HomeView.tsx` (carousel images).
- **Panels**: `ChatHistoryPanel`, `EnvironmentsPanel`, and `TasksPanel` use `bg-slate-800` and `border-slate-700` consistent with the dark theme.

## 5. Branding and Copy Audit
| String | File Path | Context | Recommended Action |
| :--- | :--- | :--- | :--- |
| "Cyoda AI Studio" | `HomeView.tsx`, `i18n/en.json` | Main page title | Replace with **Cyoda Cloud** |
| "CYODA AI" | `Header.tsx`, `HomeView.tsx` (alt) | App identity | Replace with **Cyoda** |
| "Build with Cyoda." | `HomeView.tsx` | Tagline | Keep as feature label or rephrase |
| "BUILD WITH CYODA AI" | `i18n/en.json` | New chat header | Replace with **Cyoda Cloud** |
| "Anyone who has a problem..."| `HomeView.tsx` | Marketing copy | Remove / Replace with tech-focused copy |
| "BETA" / "ALPHA" | `Header.tsx`, `LayoutModern.tsx` | Version badges | Standardize or remove |
| "Canvas" / "History" | `Header.tsx` | Feature labels | Keep as feature labels |

## 6. Visual System Audit
- **Colors**:
  - Backgrounds: `bg-slate-900`, `bg-slate-800`, `from-slate-900 via-slate-900 to-slate-800`.
  - Accents: `text-teal-400`, `text-pink-500` (in `HomeView`), `text-orange-500`.
  - Gradients: Glow effects in `HomeView.tsx` and `LayoutModern.tsx`.
- **Assets**:
  - `logo.gif`, `logo-dark.gif`: Old animated logos.
  - `cyoda_ai.png`: Static branding.
  - `people/ppl*.png`: Gamified person images in carousel.
- **Styling Method**: Mix of **Tailwind CSS** (utility classes) and **SCSS** (`_variables-dark.scss`, `_antd-overrides.scss`).
- **Icons**: Heavily reliant on `lucide-react`.

## 7. Functional Inventory (Preserve)
- **Chat**: Streaming responses, multi-agent transfers, file attachments.
- **GitOps**: Repository selector, branch cloning, pull/push logic.
- **Canvas**: Monaco editor, `WorkflowCanvas` (React Flow), Requirements/Entities/Code tabs.
- **Infrastructure**: Environments panel (monitoring), Tasks panel (background job status).
- **Auth**: Auth0 integration and token management in `App.tsx`.

## 8. Canvas / Workspace Structure
`ChatBotView.tsx` manages the workspace using `useResizablePanel`:
- **Is Canvas a route?** No, it's a panel state (`canvasVisible`) toggled from the Header.
- **Structure**: Flexbox container (`main-layout`) -> Sidebar (History) -> Canvas (Resizable) -> Main Chat -> Right Panels (Tasks/Environments).
- **High Risk**: Touching the `ResizeHandle` logic or the bridge between `ChatBot` and `ChatBotCanvas` (event handlers for `onAddToCanvas`, etc.).

## 9. Redesign Candidates
- **Safe (Category A)**: `HomeView.tsx` hero, `NewChat.tsx` cards, `Header.tsx` colors/logo, `i18n` strings, `Footer` links.
- **Medium Risk (Category B)**: `ChatBotView.tsx` panel widths/backgrounds, `Header.tsx` toggle button styling, Scrollbar styling in SCSS.
- **High Risk (Category C)**: `WorkflowCanvas` internals, `StreamingMessage` logic, `App.tsx` auth redirects.

## 10. Typography and Theme Findings
- **Fonts**: 
  - `Inter` and `JetBrains Mono` are self-hosted and configured in Tailwind.
  - `Montserrat` is used in `HomeView.tsx` (needs removal for consistency).
- **Theme**: 
  - The `theme-dark` class is often applied to `<html>`.
  - Authenticated components often hardcode `bg-slate-900`, making a "light-first" transition high-risk without a systematic variable cleanup.

## 11. Screenshot-Specific Findings
- **Giant Branding**: `HomeView.tsx` L745 (`text-6xl font-bold`).
- **Avatar Hero**: `HomeView.tsx` L834 (`carousel` component with `ppl*.png`).
- **Quick Action Cards**: `HomeView.tsx` `quickActions` array (L140).
- **Teal/Pink Accents**: Hardcoded in Tailwind classes throughout `ChatBotView.tsx` and `HomeView.tsx`.

## 12. Recommended Future Direction
1.  **Phase 1: Brand Cleanup**: Replace "AI Studio" with "Cyoda Cloud" and swap logos/assets.
2.  **Phase 2: Shell Refinement**: Restyle `Header` and `Panels` to use the new Slate/Teal palette without neon glows.
3.  **Phase 3: Dashboard Redesign**: Replace `HomeView` hero with a technical "Get Started" or "Active Projects" surface.
4.  **Phase 4: Typography Alignment**: Standardize on Inter/JetBrains Mono globally.
5.  **Phase 5: Theme Toggle**: Enable light mode for the authenticated shell (requires replacing hardcoded `bg-slate-900` with CSS variables).

## 13. Questions for Patrick/Paul
- Should the authenticated app support a **Light Theme** like the landing page, or a "Technical Dark" theme?
- Do we keep the "History/Canvas/Cloud/Tasks" terminology, or move to more standard "Chat/Editor/Deploy/Jobs"?
- Should the "Home" view (`/home`) be merged into a "New Chat" empty state?

## 14. Files Likely to Change
- `packages/web/src/views/HomeView.tsx`
- `packages/web/src/views/ChatBotView.tsx`
- `packages/web/src/components/Header/Header.tsx`
- `packages/web/src/components/NewChat/NewChat.tsx`
- `packages/web/src/i18n/en.json`
- `packages/web/src/assets/css/particular/_variables-dark.scss`

## 15. Files NOT to Touch
- `packages/web/src/components/WorkflowCanvas/*` (Internal logic)
- `packages/web/src/services/*` (API clients)
- `packages/web/src/stores/*` (State management)
- `packages/desktop/*` (Out of scope)

## 16. Tests Affected
- `HomeView.test.tsx`: Asserts on "Cyoda AI Studio" text.
- `Header.test.tsx`: Asserts on logo and nav items.
- `NewChatView.test.tsx`: Asserts on prompt suggestions.
