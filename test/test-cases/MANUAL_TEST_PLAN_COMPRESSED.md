# MANUAL TEST PLAN - COMPRESSED
## AI Assistant UI - Functional Testing Guide

**Version:** 2.0
**Last Updated:** 2026-02-06
**Source:** 13 detailed test case documents (5,006 test cases)
**Focus:** UI interactions, clicks, functional correctness

---

## 1. AUTHORIZATION

| ID | Name | Steps | Expected Result |
|----|------|-------|-------------------|
| AU-01 | Guest Mode | 1. Open app without login<br>2. Check: guest token auto-generated (tokenType='public'), stored in localStorage<br>3. Functionality: send messages, view responses, Canvas fully functional, GitHub integrations work<br>4. Limitations: max 2 chats, 10MB file upload limit (2MB for text files), no Cloud Panel access<br>5. Guest mode indicator shows | Guest mode works with limitations: 2 chats max, files up to 10MB, no deployment access, chats saved temporarily |
| AU-02 | Login Flow | 1. Click "Log in" button → redirect to Auth0<br>2. Login successful → callback to app<br>3. Token stored, user profile loaded, redirect to original URL<br>4. Button visible when logged out, hidden when logged in | Auth0 redirect works, callback handled, token saved, loading state shows |
| AU-03 | Login Popup - Guest Restrictions | 1. Guest user triggers restricted feature → popup opens<br>2. Check: benefits list, "Continue as Guest" button, "Log in" button<br>3. Click "Log in" → Auth0 flow<br>4. Escape/backdrop → closes popup | Popup shows, buttons work, can close |
| AU-04 | User Avatar & Dropdown | 1. Logged in → avatar shows (initials or photo)<br>2. Click avatar → dropdown opens<br>3. Check: user name, email, Logout button<br>4. Click outside dropdown → closes | Avatar displays, dropdown toggles, user info shows |
| AU-05 | Super User Mode | 1. Check toggle in dropdown: "Super User Mode"<br>2. Toggle ON → badge "SUPER USER" in header appears<br>3. Access to admin features enabled<br>4. State persists in localStorage | Toggle works, badge shows, admin features accessible, state saved |
| AU-06 | Logout | 1. Click Logout → localStorage cleared<br>2. Redirect to home page<br>3. Guest mode activated<br>4. Electron: Auth0 logout executes | Logout works, state cleared, redirect executes, guest mode activates |
| AU-07 | Token Management | 1. Token stored in localStorage ('auth_token')<br>2. Token refresh: auto-refresh before expiry<br>3. Expired token → auto logout<br>4. Invalid token → clear and guest mode | Token management works, auto-refresh functional, expired/invalid tokens handled |
| AU-08 | Guest Chats Transfer on Login | 1. As guest user: create 1-2 chats<br>2. Click "Log in" → complete Auth0 flow<br>3. Check: POST /v1/chats/transfer called with guest_token<br>4. Guest chats appear in chat history<br>5. Logout → Login again → chats still accessible | Guest chats transferred to user account, visible in history, persist after logout/login, transfer uses private client |

---

## 2. HOME PAGE

| ID | Name | Steps | Expected Result |
|----|------|-------|-------------------|
| HP-01 | Hero Section Layout | 1. Check layout: "Cyoda AI Studio" + "Event-Driven AI Platform" centered<br>2. Subtitle text below<br>3. Full viewport height<br>4. Vertical spacing balanced | Layout correct, centered content, responsive, no circular logo |
| HP-02 | Prompt Examples Carousel | 1. Carousel: 4-6 examples with category badges, person images, titles<br>2. Navigation arrows (left/right)<br>3. Click example → fills input<br>4. Copy button → copies prompt and fills input<br>5. Auto-scroll every 5 seconds | Carousel works, navigation functional, click fills input, copy button works, auto-scroll works |
| HP-03 | Chat Input & Send | 1. Textarea: auto-resize (min 60px, max 200px)<br>2. Send button disabled when empty, enabled when text present<br>3. Cmd/Ctrl+Enter → sends<br>4. Creates new chat and navigates to /chat/:id?openCanvas=true | Input works, auto-resize functional, shortcuts work, navigation executes with canvas open |
| HP-04 | File Attachments | 1. Attach button → file picker opens<br>2. Select file → preview shows (name, size, X button)<br>3. Drag & drop file → drop zone highlights, preview appears<br>4. Limits: 10MB for all files | File picker works, preview shows, drag & drop functional, limits respected |
| HP-05 | Features Section | 1. Scroll down → "Cyoda AI Studio Features" section<br>2. 4 feature cards: Event-Driven, AI-Assisted, Entity Database, Runtime Governance<br>3. Grid layout 2x2 responsive<br>4. "Learn More About Cyoda" link → opens docs.cyoda.net | Features section displays, 4 cards visible, grid responsive, link works |
| HP-06 | Resources Section | 1. Scroll to bottom → "Cyoda Platform Resources" section<br>2. Primary CTA: "Visit Cyoda.com" button<br>3. Links: Documentation, GitHub<br>4. All links open in new tab | Resources section displays, CTA button works, links open in new tabs |
| HP-07 | Panel Integration | 1. Toggle Chat History → panel opens on left<br>2. Toggle Environments → panel opens on right (guest: disabled)<br>3. Main content adjusts width<br>4. Panels resizable | Panels toggle, main content adjusts, resize works, guest restrictions apply |

---

## 3. HEADER

| ID | Name | Steps | Expected Result |
|----|------|-------|-------------------|
| HD-01 | Header Layout & Sections | 1. Check: sticky position, full width<br>2. Sections: Left (logo), Center (panel buttons), Right (links, notifications, auth)<br>3. Responsive padding on different screens | Header sticky, sections layout correct, responsive |
| HD-02 | Logo & Beta Badge | 1. Click logo → navigate to "/"<br>2. Beta badge "BETA" visible next to logo<br>3. Logo clickable from any page | Logo navigates to home page, beta badge always visible |
| HD-03 | Panel Toggle Buttons | 1. Check buttons: Chat History, Canvas, Tasks, Cloud<br>2. Click each → panel toggles<br>3. Active state shows for open panel<br>4. Hover effects work | Buttons toggle panels, active state correct, transitions smooth |
| HD-04 | Notifications Dropdown | 1. Click Bell icon → dropdown opens<br>2. Notifications list shows<br>3. Badge count for unread<br>4. Empty state: "No notifications"<br>5. Click outside → closes | Dropdown toggles, notifications show, badge count correct, empty state works |
| HD-05 | External Links | 1. Check links: CYODA Website (logo icon), GitHub, LinkedIn, Documentation, Discord<br>2. Click each → opens in new tab<br>3. Hover effects: scale + color change<br>4. All hidden on mobile (lg breakpoint) | All 5 links work, target="_blank", hover animations smooth, responsive behavior correct |

---

## 4. CHAT PAGE

| ID | Name | Steps | Expected Result |
|----|------|-------|-------------------|
| CH-01 | Send Message Basic | 1. Enter text in chat input<br>2. Click Send button (or Enter)<br>3. Message sends → appears in chat<br>4. AI streaming response starts | Input clears, message shows, streaming works |
| CH-02 | Streaming Animation | 1. Send message → AI response streams<br>2. Check typing animation (10ms/char)<br>3. Blinking cursor during streaming<br>4. "streaming..." indicator shows<br>5. Complete → cursor disappears, indicator hides | Typing animation smooth, cursor blinks, auto-scroll to new content |
| CH-03 | File Attachments | 1. Click attach button → file picker opens<br>2. Select file → preview card appears<br>3. Send message with file → upload works<br>4. Check limits: 10MB guest, 50MB logged in<br>5. Remove button → deletes attachment | File picker works, preview shows, upload with limits, remove functional |
| CH-04 | Drag & Drop Files | 1. Drag file onto chat input area<br>2. Drop zone highlights<br>3. Drop → file added to attachments<br>4. Multiple files supported | Drag & drop works, drop zone visually reacts, multiple files work |
| CH-05 | Textarea Auto-Resize | 1. Enter one line → min height 40px<br>2. Enter many lines → textarea grows<br>3. Reach max 200px → scroll appears<br>4. Shift+Enter → new line, Cmd/Ctrl+Enter → send | Auto-resize works, min/max limits respected, shortcuts functional |
| CH-06 | Markdown Rendering | 1. AI response with markdown: **bold**, *italic*, `code`, ```code block```<br>2. Links, lists, headers<br>3. Check syntax highlighting in code blocks<br>4. Tables, blockquotes work | Markdown renders correctly, code highlighting works, all elements supported |
| CH-07 | Canvas Integration | 1. AI creates workflow → "View in Canvas" button appears<br>2. Click button → canvas opens<br>3. Workflow loads in canvas<br>4. Disabled for archived chats | Integration works, workflow correctly passed to canvas, disabled state works |
| CH-08 | Tool Responses | 1. AI uses tool → ToolResponseMessage shows<br>2. Check: tool name badge, icon, content<br>3. Streaming tool response → animation works<br>4. Multiple tools in one response | Tool messages display separately, streaming works, multiple tools supported |
| CH-09 | Error Handling | 1. Simulate network error → StreamErrorNotification appears<br>2. Retry button → resends<br>3. Timeout error → shows timeout message<br>4. Details toggle → shows error details<br>5. Dismiss → error hides | Errors show, retry works, details accessible, dismiss functional |
| CH-10 | Message Types | 1. User messages → show on right<br>2. AI messages → show on left<br>3. Notification messages → show with badges<br>4. Error messages → visually distinct | All message types visually distinct, layout correct |
| CH-11 | StreamingMessage Display | 1. Send message → streaming starts<br>2. AI avatar, agent name badge, content bubble<br>3. Streaming indicator: dot + "streaming..."<br>4. Blinking cursor during streaming | Message displays, streaming indicator shows, cursor blinks |
| CH-12 | Typing Animation | 1. Content appears character by character (10ms/char)<br>2. Smooth typing, no lag<br>3. Complete → cursor disappears, "streaming..." hides<br>4. Auto-scroll to bottom | Typing animation smooth, auto-scroll works, completion handled |
| CH-13 | ThinkingAnimation | 1. 3 dots bounce animation<br>2. Staggered delays: 0ms, 200ms, 400ms<br>3. Duration: 1.4s, continuous loop | Bounce effect smooth, delays correct, loop works |
| CH-14 | ToolResponseMessage | 1. Tool called → message appears<br>2. Wrench icon in gradient container<br>3. Tool name badge, content bubble<br>4. Streaming: "streaming...", cursor<br>5. Tool name formatted (underscores → spaces) | Tool message displays, streaming works, formatting correct |
| CH-15 | StreamErrorNotification | 1. Stream error → notification appears<br>2. Error types: Timeout, Network, ADK, Connection, Generic<br>3. Each type: corresponding icon, message<br>4. Buttons: Retry, Dismiss<br>5. Details toggle → shows error info | Error notification shows, retry works, dismiss functional, details accessible |
| CH-16 | BackgroundTaskNotification | 1. Background task → notification appears<br>2. Task name, description<br>3. "📊 View Tasks" button<br>4. Click → opens Tasks panel | Notification shows, button opens Tasks panel |
| CH-17 | Notification Component Types | 1. Notifications: success, error, warning, info<br>2. Badge with icon, type, timestamp<br>3. Content: title, message<br>4. Auto-dismiss (5000ms), fade-out<br>5. Copy button (optional) | All types work, auto-dismiss functional, copy works |
| CH-18 | ChatBotMessageNotification Types | 1. Notification types: CODE CHANGES, BACKGROUND TASK, CYODA NOTIFICATION<br>2. Each type: corresponding icon, badge<br>3. Content displays | All notification types show, icons correct |
| CH-19 | Auto-Scroll & Animations | 1. Streaming updates → auto-scroll to bottom (smooth)<br>2. Only scrolls when isComplete = false<br>3. Animations: fade-in-up, pulse, bounce, spin<br>4. All animations smooth, no performance issues | Auto-scroll works, animations smooth, performance maintained |
| CH-20 | WizardOptionSelection - Steps | 1. AI sends repository config wizard<br>2. Step 1 (Language): select language → progress to Step 2<br>3. Step 2 (Branch): select branch type → progress to Step 3<br>4. Step 3 (Repository): select repo type<br>5. Progress indicator shows current step | Wizard steps work, progress indicator updates, navigation smooth |
| CH-21 | WizardOptionSelection - Back Button | 1. In Step 2 or 3 → click Back button<br>2. Returns to previous step<br>3. Previous selections cleared<br>4. Can re-select options | Back button works, returns to previous step, selections reset |
| CH-22 | WizardOptionSelection - Send Button | 1. Complete all 3 steps<br>2. Summary box shows all selections<br>3. Click Send → formatted data sent to AI<br>4. Button disabled until all steps complete | Send works, summary correct, button state correct |
| CH-23 | Flat Option Selection - Select Button | 1. AI sends options (non-wizard)<br>2. Select one or more options<br>3. Click Select button → text placed in textarea<br>4. User can review and edit before sending | Select button works, text in textarea, editable |
| CH-24 | Read More / Show Less | 1. AI sends long message (>10 lines)<br>2. Content truncated at ~210px with fade-out<br>3. "Read more" button appears<br>4. Click → expands, button changes to "Show less"<br>5. Click again → collapses | Read more/less works, fade-out effect shows, toggle functional |
| CH-25 | UI Function - Run It Button | 1. AI sends UI function message<br>2. Check: method badge (GET/POST/etc), path, function name<br>3. Click "Run it" → loading state shows<br>4. Response appears below (JSON or file download)<br>5. Error handling if request fails | UI function displays, Run it works, loading state shows, response handled |
| CH-26 | UI Function - Approve Button | 1. UI function with approve flag<br>2. Green circular Approve button in bottom-right<br>3. Click → loading state (2s)<br>4. Approval sent to AI | Approve button shows, click works, loading state correct |
| CH-27 | User Message - Copy Button | 1. Send user message → appears on right<br>2. Copy button in top-right corner of message bubble<br>3. Click Copy → icon changes to checkmark (2s)<br>4. Text copied to clipboard<br>5. Works for text and JSON messages | Copy button visible, click copies text, checkmark shows, clipboard works |
| CH-28 | User Message - JSON Format | 1. Send message with JSON object (message.text is object)<br>2. Message displays formatted JSON with indentation (2 spaces)<br>3. Rendered as plain text (no syntax highlighting)<br>4. Copy button copies formatted JSON | JSON formatted correctly with indentation, rendered as plain text, copy preserves formatting |

---

## 5. CHAT HISTORY PANEL

| ID | Name | Steps | Expected Result |
|----|------|-------|-------------------|
| CHP-01 | Panel Toggle & Resize | 1. Click Chat History icon → panel opens on left<br>2. Drag right border → panel resizes<br>3. Check min/max width limits<br>4. Home button → navigate to "/" | Panel toggles, resizable, limits respected, Home button works |
| CHP-02 | Chat List & Grouping | 1. Chat list loads (sorted by date, newest first)<br>2. Check grouping: Today, Yesterday, Previous 7 Days, Previous 30 Days, Older<br>3. Empty groups hidden<br>4. Scroll down → load more (pagination) | List loads, grouping works, pagination functional |
| CHP-03 | Rename Chat Dialog | 1. Hover on chat → Rename icon appears<br>2. Click Rename → dialog opens centered<br>3. Textarea with current name, auto-focused<br>4. Character counter "X / 100" displays<br>5. Validation: empty → error, > 100 chars → error<br>6. Type new name → Submit button enabled<br>7. Click Submit or Cmd/Ctrl+Enter → API call, loading state<br>8. Success → dialog closes, chat name updates, success message<br>9. Escape key → closes dialog without saving | Dialog opens, textarea auto-focused, validation works, submit functional, keyboard shortcuts work |
| CHP-04 | Delete Chat Confirmation | 1. Hover on chat → Delete icon appears<br>2. Click Delete → confirmation dialog opens<br>3. Dialog shows: warning message, chat name<br>4. Buttons: "Cancel", "Delete" (red)<br>5. Click Cancel or Escape → closes without deleting<br>6. Click Delete → API call, loading state<br>7. Success → chat removed from list, success message | Confirmation dialog shows, cancel works, delete executes, chat removed |
| CHP-05 | Context Menu | 1. Right-click on chat → context menu appears<br>2. Options: Rename, Delete, (other options if any)<br>3. Click option → executes action<br>4. Click outside → closes menu<br>5. Escape → closes menu | Context menu shows, all options functional, closes correctly |
| CHP-06 | Active Chat Highlight | 1. Select chat → opens<br>2. Check active chat visually highlighted<br>3. Switch to another chat → highlight updates | Active chat highlighted, highlight updates on switch |
| CHP-07 | Refresh Functionality | 1. Click Refresh button<br>2. Check: button disabled during refresh, icon animation (500ms)<br>3. List updated<br>4. Error handling if API fails | Refresh works, loading state shows, errors handled |

---

## 6. CANVAS PANEL

| ID | Name | Steps | Expected Result |
|----|------|-------|-------------------|
| CP-01 | Panel Open/Close | 1. Click Canvas button in header → panel opens on right<br>2. Click X button → panel closes<br>3. Click Canvas button again → panel reopens<br>4. Check panel width and resize handle | Panel toggles correctly, close button works, panel resizable |
| CP-02 | Tab Switching | 1. Check 4 tabs: Requirements, Entities, Workflows, Code<br>2. Click each tab → content switches<br>3. Active tab highlighted (teal background)<br>4. Inactive tabs: gray, hover effect works | All tabs switch correctly, active state shows, hover effects smooth |
| CP-03 | Pull Button | 1. Click Pull button → loading state shows<br>2. Pull completes → data refreshes<br>3. Button disabled during pull<br>4. Check button style: teal gradient, icon animation | Pull works, loading state correct, button disabled during operation |
| CP-04 | GitHub Repository Link | 1. Check link format: owner/repo (branch)<br>2. Click link → opens GitHub in new tab<br>3. Hover effect: purple background darkens<br>4. External link icon visible | Link correct, opens in new tab, hover effects work |
| CP-05 | Draft Creation Limit | 1. In Entities tab → click + button → draft created<br>2. Try to create second draft → warning shows<br>3. Warning: "You already have a draft entity..."<br>4. Send draft to chat → can create new draft | Only 1 draft allowed, warning shows, limit enforced |
| CP-06 | New App Dialog | 1. Click "New App" button → dialog opens centered<br>2. Form fields: Environment selector (dropdown), App Name (input), App Type selector (dropdown)<br>3. Validation: all fields required<br>4. Empty field → error message shows<br>5. Fill all fields → Submit button enabled<br>6. Click Submit → API call, loading state<br>7. Success → dialog closes, app list refreshes, success message<br>8. Error → error message displays, dialog stays open<br>9. Escape or Cancel → closes dialog without saving | Dialog opens, form validation works, submit functional, error handling correct |
| CP-07 | Items Layout (>5 items) | 1. Create 6+ items in any tab<br>2. Check layout: cards wrap to new row<br>3. Each card: 220px width, fixed height<br>4. Scroll works if needed | Cards wrap correctly, consistent sizing, scrolling smooth |
| CP-08 | Empty State | 1. Open tab with no items<br>2. Check empty state message<br>3. "No requirements/entities/workflows yet"<br>4. Create button visible | Empty state shows, message correct, create button accessible |

---

## 7. WORKFLOW CANVAS

| ID | Name | Steps | Expected Result |
|----|------|-------|-----------------|
| WC-01 | Repository Config Prompt | 1. On chat page without repository configured<br>2. Click Canvas button in header<br>3. Dropdown appears below Canvas button with:<br>   - Title: "Repository Not Configured"<br>   - Message about Canvas requiring GitHub repository<br>   - "New Branch" button (teal)<br>   - "Existing Branch" button (blue)<br>   - Close button (X)<br>4. Click "New Branch" → sends AI message to configure new repository<br>5. Click "Existing Branch" → sends AI message to clone existing repository<br>6. Click X → closes prompt | Prompt shows when Canvas clicked without repo, buttons send appropriate AI messages, close button dismisses prompt |
| WC-01a | GitHub Path Display | 1. Open workflow canvas with configured repository<br>2. Check header shows "GitHub Path" label (left)<br>3. Right side: clickable link with GitHub icon + file path (e.g., src/main/resources/workflow/customer/version_1/Customer.json)<br>4. Hover → text changes from blue-400 to blue-300<br>5. Click → opens file on GitHub in new tab<br>6. Hidden in fullscreen mode | GitHub Path displays, link clickable, opens correct file on GitHub, hover effect works |
| WC-02 | Toolbar - Navigation & History | 1. Click Back → returns to workflows list<br>2. Add node → Undo → node deleted<br>3. Redo → node restored<br>4. Test Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z | Back works, Undo/Redo correctly revert/restore changes. Buttons disabled when no history |
| WC-03 | Toolbar - View Controls | 1. Zoom in/out → Fit View → all nodes visible and centered<br>2. Create 5+ nodes → Auto Layout → nodes arranged hierarchically<br>3. Check layout direction (TB/LR) from Settings | Fit View centers all nodes. Auto Layout applies selected algorithm and direction |
| WC-04 | Toolbar - Panels Toggle | 1. Info → panel opens/closes, shows workflow stats<br>2. JSON Editor → panel with Monaco editor<br>3. Settings → panel with settings<br>4. Help → panel with shortcuts | Each button toggles corresponding panel. Panels open on right, closable |
| WC-05 | Import/Export Workflow | 1. Download → file `{modelName}_v{modelVersion}.json` downloads<br>2. Upload valid JSON → workflow loads + auto-layout<br>3. Upload invalid JSON → shows alert with error<br>4. Upload wrapper format → extracts first workflow | Files correctly download and upload. Validation works |
| WC-06 | Node Operations | 1. Double-click on canvas → creates new node<br>2. Drag node → moves<br>3. Select node → 8 resize handles appear<br>4. Drag handle → node resizes<br>5. Select node → Delete/Backspace → node deleted | All node operations work. Handles appear on selection. Deletion works |
| WC-07 | Edge Operations | 1. Drag from one node handle to another → creates connection<br>2. Select connection → Delete → connection deleted<br>3. Settings → change Edge Type → connections update visually | Connections created and deleted. Edge type changes in settings |
| WC-08 | JSON Editor Sync | 1. Open JSON Editor<br>2. Add node on canvas → JSON updates<br>3. Edit JSON → canvas updates<br>4. Invalid JSON → shows error<br>5. Cmd/Ctrl+S → saves changes | Bidirectional sync canvas ↔ JSON. Validation works |
| WC-09 | Settings Persistence | 1. Change Edge Type → close canvas → reopen → setting saved<br>2. Change Layout Direction → check localStorage<br>3. Change Color Theme → applies | All settings saved in localStorage and restored |
| WC-10 | Keyboard Shortcuts | 1. Cmd/Ctrl+A → select all nodes<br>2. Cmd/Ctrl+C → copy<br>3. Cmd/Ctrl+V → paste<br>4. Delete/Backspace → delete selected<br>5. Check tooltips show correct shortcuts for OS | All shortcuts work. Tooltips correct for Mac/Windows |
| WC-11 | Fullscreen Mode | 1. Click Fullscreen → canvas fullscreen<br>2. Icon changes to Minimize<br>3. Click Minimize → returns to normal size<br>4. Check: button visible only if modelName/modelVersion exists | Fullscreen works. Button shows only when model data present |
| WC-12 | State Node - Inline Rename | 1. Double-click on state name → InlineNameEditor activates<br>2. Input field appears with current name selected<br>3. Edit name → Enter or Check button → saves<br>4. Escape or X button → cancels<br>5. Blur → auto-saves<br>6. Pencil icon on hover → click to edit | Inline editing works, Enter/Check saves, Escape/X cancels, blur auto-saves |
| WC-13 | State Node - Send to Chat | 1. Hover over state node → Send to Chat button appears<br>2. Click button → state data sent to chat as JSON<br>3. Chat opens with state configuration<br>4. Button stops propagation (doesn't select node) | Send to Chat works, JSON formatted correctly, chat receives data |
| WC-14 | Transition Edge - Double-Click Edit | 1. Double-click on transition edge → TransitionEditor opens<br>2. Draggable dialog appears with transition data<br>3. Dialog shows: title, name editor, JSON editor<br>4. Position: default (100, 100), draggable by header | Double-click opens editor, dialog draggable, all sections visible |
| WC-15 | Transition Editor - Rename | 1. In TransitionEditor → InlineNameEditor in header<br>2. Click pencil icon or double-click name → edit mode<br>3. Edit name → Enter/Check → saves to JSON<br>4. Name updates in both editor and JSON<br>5. Escape/X → cancels | Rename works, syncs with JSON, Enter/Check saves, Escape/X cancels |
| WC-16 | Transition Editor - JSON Configuration | 1. Monaco editor shows transition JSON<br>2. Edit JSON → real-time validation<br>3. Invalid JSON → error message shows<br>4. Valid JSON → error clears<br>5. Auto-save after 1s of no changes<br>6. Syntax highlighting, autocomplete work | JSON editor works, validation functional, auto-save executes, highlighting works |
| WC-17 | Transition Editor - Save & Close | 1. Edit transition → click Save button<br>2. Valid JSON → saves, dialog closes<br>3. Invalid JSON → error shows, dialog stays open<br>4. Click Close (X) → closes without saving<br>5. Escape key → closes dialog | Save validates and closes, Close discards changes, Escape works |
| WC-18 | Transition Editor - Send to Chat | 1. In TransitionEditor → click Send to Chat button<br>2. Transition JSON sent to chat wrapped in ```json code block<br>3. Chat opens with formatted JSON<br>4. Button available regardless of validation state | Send to Chat works, JSON formatted in code block, chat receives data |
| WC-19 | Auto Handle Recalculation on Drag | 1. Create 2 connected states (A → B)<br>2. Note current handles (e.g., right-center → left-center)<br>3. Drag state B to different position (e.g., below A)<br>4. Handles automatically recalculate to optimal (e.g., bottom-center → top-center)<br>5. Works for all connected transitions (incoming and outgoing)<br>6. Undo → handles restore to previous | Handles recalculate automatically when state moved, optimal routing maintained, undo works |
| WC-20 | Transition Badges - Criterion | 1. Add criterion to transition (JSON editor)<br>2. Pink diamond badge appears near source node<br>3. Filter icon inside rotated diamond<br>4. Hover → tooltip shows criterion details (type, field, operator, value)<br>5. Click badge → JSON editor opens, scrolls to criterion section | Criterion badge shows, tooltip displays details, click opens JSON editor at criterion |
| WC-21 | Transition Badges - Processors | 1. Add processor to transition (JSON editor)<br>2. Blue circle badge appears near target node<br>3. Zap (lightning) icon inside circle<br>4. Hover → tooltip shows processor details (name, mode, timeout, retry)<br>5. Multiple processors → tooltip lists all<br>6. Click badge → JSON editor opens, scrolls to processors section | Processor badge shows, tooltip displays all processors, click opens JSON editor at processors |

---

## 8. REQUIREMENTS EDITOR

| ID | Name | Steps | Expected Result |
|----|------|-------|-----------------|
| RE-01 | View Mode Switching | 1. Open requirement → default Split mode shows<br>2. Click Preview icon → shows only preview panel<br>3. Click Code icon → shows only Monaco editor<br>4. Click Split icon → shows both panels side-by-side | All 3 view modes work, panels display correctly |
| RE-02 | Monaco Editor - Markdown Editing | 1. In Markdown or Split mode → Monaco editor visible<br>2. Edit markdown text → changes reflected<br>3. Check syntax highlighting for markdown<br>4. Word count updates in real-time<br>5. Font settings apply (family, size) | Editor works, syntax highlighting functional, word count accurate |
| RE-03 | Enhanced Preview - Collapsible Sections | 1. In Preview or Split mode → preview panel shows<br>2. Markdown parsed into sections (## headers)<br>3. Each section has icon (Target, Shield, Zap, Users, etc.)<br>4. Click section header → collapses/expands<br>5. Chevron icon rotates (down/right) | Sections collapsible, icons display, chevron animates |
| RE-04 | GitHub Path & Link | 1. Check header shows "GitHub Path" label<br>2. Right side: GitHub icon + file path (e.g., src/main/resources/functional_requirements/...)<br>3. Hover → text color changes (blue-400 → blue-300)<br>4. Click → opens file on GitHub in new tab | GitHub path displays, link clickable, opens correct file |
| RE-05 | Toolbar - Copy to Clipboard | 1. Click Copy icon in toolbar<br>2. Check clipboard contains markdown text<br>3. Icon changes to Check (✓) for 2 seconds<br>4. Success message shows | Copy works, icon changes, message displays |
| RE-06 | Toolbar - Upload File | 1. Click Upload icon → file picker opens<br>2. Select .md file → content loads into editor<br>3. Try .txt, .json, .html, .rtf, .csv → all supported<br>4. Invalid file → error message | Upload works for all formats, validation functional |
| RE-07 | Toolbar - Download File | 1. Click Download icon<br>2. File downloads as `{requirementName}.md`<br>3. Content matches editor text<br>4. Filename sanitized (spaces → underscores) | Download works, filename correct, content accurate |
| RE-08 | Font Settings Dropdown | 1. Click Settings icon → dropdown opens<br>2. Font Family section: Consolas, Monaco, Courier New, Fira Code, JetBrains Mono<br>3. Select font → editor updates<br>4. Font Size slider (10-24px) → editor updates<br>5. Settings persist in localStorage | Dropdown works, fonts apply, size slider functional, persistence works |
| RE-09 | Send to Chat Button | 1. Click "Send to Chat" button (orange)<br>2. Markdown text sent to chat textarea<br>3. Chat panel receives content<br>4. Hover → button color changes (#f97316 → #ea580c) | Send to Chat works, content transferred, hover effect functional |
| RE-10 | Back Button Navigation | 1. Click "Back" button (left arrow)<br>2. Returns to requirements list<br>3. Navigation context cleared<br>4. Editor state not saved | Back button works, navigation functional |

---

## 9. ENTITY VIEWER

| ID | Name | Steps | Expected Result |
|----|------|-------|-----------------|
| EV-01 | Split View Layout | 1. Open entity → split view shows<br>2. Left panel: Monaco JSON editor<br>3. Right panel: Tree Preview<br>4. Both panels scrollable independently<br>5. Border between panels (gray-700) | Split view displays, both panels functional, layout correct |
| EV-02 | Monaco Editor - JSON Editing | 1. Monaco editor shows entity JSON<br>2. Edit JSON → changes reflected<br>3. Syntax highlighting for JSON (keys teal, values green, numbers amber)<br>4. Line numbers visible<br>5. Custom theme "workflow-dark" applied | Editor works, syntax highlighting functional, theme applied |
| EV-03 | JSON Validation & Errors | 1. Edit JSON → introduce syntax error<br>2. Error message shows at bottom (red background)<br>3. Tree preview shows "Fix JSON errors to see tree preview"<br>4. Fix error → error clears, tree preview updates<br>5. Warnings show (yellow background) if present | Validation works, errors display, tree preview disabled on error |
| EV-04 | Tree Preview - Collapsible Nodes | 1. Tree Preview shows entity structure<br>2. First 2 levels auto-expanded<br>3. Click chevron (ChevronRight/ChevronDown) → expand/collapse<br>4. Objects show {}, arrays show []<br>5. Primitive values show inline (strings green, numbers amber, booleans/null gray) | Tree displays, expand/collapse works, icons correct, colors accurate |
| EV-05 | Entity Metadata Display | 1. Check bottom right shows 2 boxes:<br>   - Entity Name (e.g., "audit_log")<br>   - Version (e.g., "version_1")<br>2. Both in gray-900 background with gray-400 labels<br>3. Values in white font-mono text | Metadata displays, styling correct |
| EV-06 | GitHub Path & Link | 1. Check GitHub Path section (col-span-2)<br>2. Label: GitHub icon + "GitHub Path"<br>3. Link shows file path (e.g., src/main/resources/entity/audit_log/version_1/AuditLog.json)<br>4. Hover → text changes blue-400 → blue-300<br>5. Click → opens file on GitHub in new tab | GitHub path displays, link clickable, hover effect works |
| EV-07 | Entity Details Dialog | 1. Click "View Details" button on entity card → dialog opens<br>2. Dialog shows 3 tabs: Versions, Workflows, Metadata<br>3. Versions tab: table with version history data (version number, date, author)<br>4. Workflows tab: list of workflows using this entity<br>5. Metadata tab: entity metadata (created, modified, etc.)<br>6. "Restart Workflows" button available in Workflows tab<br>7. Click Restart → confirmation → workflows restart<br>8. Close button (X) or Escape → closes dialog<br>9. Click outside (backdrop) → closes dialog | Dialog opens, all tabs functional, data displays, Restart Workflows works, close mechanisms functional |
| EV-08 | Back Button Navigation | 1. Click "Back" button (gray, left arrow icon)<br>2. Returns to entities list<br>3. Navigation context cleared<br>4. Hover → background changes gray-700 → gray-600 | Back button works, navigation functional, hover effect correct |
| EV-09 | Send to Chat Button | 1. Check "Send to Chat" button (teal, right side)<br>2. Disabled if JSON has errors<br>3. Click → entity JSON sent to chat textarea<br>4. Hover → background changes teal-600/80 → teal-500/80<br>5. Chat receives formatted JSON | Send to Chat works, disabled on error, hover effect functional |

---

## 10. TASKS PANEL

| ID | Name | Steps | Expected Result |
|----|------|-------|--------------------|
| TP-01 | Panel Toggle & Header | 1. Click Tasks icon → panel opens on right (500px width)<br>2. Check header: "Background Tasks" title, green pulsing dot, "Live" badge<br>3. Refresh button, Close button (X)<br>4. Click Close → panel closes | Panel toggles correctly, header shows all elements, Live badge visible |
| TP-02 | Task Filter Tabs | 1. Check filter tabs: All, Active, Completed, Failed<br>2. Each tab shows count badge (e.g., "All (5)", "Active (2)")<br>3. Click tab → filters tasks by status<br>4. Active tab highlighted with teal background<br>5. Counts update in real-time | Filter tabs work, counts accurate, active tab highlighted |
| TP-03 | Task Cards & Statuses | 1. Check task cards show: name, description, status icon<br>2. Different statuses visually distinct: pending, running (with animation), completed, failed, cancelled<br>3. Status icons: Clock (pending), Loader (running), CheckCircle (completed), XCircle (failed)<br>4. Click expand button → card expands | Cards display all data, statuses distinct, icons correct |
| TP-04 | Progress Bar & Stats | 1. Each task card shows progress bar<br>2. Progress percentage displayed (e.g., "75%")<br>3. Status message shown (e.g., "Building application...")<br>4. Running tasks → progress bar animates (pulse)<br>5. Progress bar color matches status (green=completed, red=failed, blue=running) | Progress bar displays, percentage accurate, animation works |
| TP-05 | Task Metadata Display | 1. Expand task → shows language badge (e.g., "Java", "Python")<br>2. Branch name with GitBranch icon<br>3. GitHub link (ExternalLink icon) if repository URL present<br>4. Build Job ID displayed<br>5. Process PID displayed (e.g., "PID: 12345") | Metadata displays correctly, all fields visible |
| TP-06 | Deployment Info Section | 1. Expand task with deployment → "Deployment Info" section shows<br>2. Server icon in section header<br>3. Build ID with copy button<br>4. Namespace with copy button<br>5. Environment URL (clickable link) with copy button<br>6. Click copy → icon feedback, clipboard works | Deployment info displays, all fields visible, copy buttons work |
| TP-07 | Error Display | 1. Failed task → expand<br>2. Error section shows with red background/border<br>3. "Error:" label in red<br>4. Error message in monospace font<br>5. Error text readable and complete | Error section displays, styling correct, message visible |
| TP-08 | CLI Output Viewer | 1. Expand task → CLI Output section shows<br>2. Terminal icon, "CLI Output" label<br>3. Running task → "Streaming..." badge with pulsing dot<br>4. Copy button, Download button<br>5. Output in monospace font, dark background<br>6. Auto-scroll to bottom when running<br>7. Max height 256px, scrollable | CLI viewer displays, buttons work, auto-scroll functional |
| TP-09 | Progress Log & File Changes | 1. Expand task → "Progress Log" section shows<br>2. Messages in reverse chronological order (newest first)<br>3. Each message: timestamp, message text<br>4. File changes summary: "+ X added", "~ X modified", "- X deleted"<br>5. Colors: green (added), blue (modified), red (deleted)<br>6. Click expand button → shows file list | Progress log displays, timestamps correct, file changes visible |
| TP-10 | Progress Log - Expanded Files | 1. Click expand on message with file changes<br>2. Shows categorized file lists: Added, Modified, Deleted<br>3. Each file in monospace font<br>4. Max height 192px, scrollable<br>5. Click collapse → hides file list | File list expands/collapses, all files visible, scrollable |
| TP-11 | Task Actions | 1. Running task → Cancel button (X icon) available<br>2. Click Cancel → confirmation modal → confirm → task cancels<br>3. Failed/Cancelled task → Restart button (RotateCcw icon)<br>4. Click Restart → task restarts with original request<br>5. Loading states during actions | Actions work, modals show, API calls execute, loading states correct |
| TP-12 | Auto-Refresh Polling | 1. Open panel → polling starts (every 20 seconds)<br>2. Statuses update automatically<br>3. CLI output updates in real-time<br>4. Progress messages append without flickering<br>5. Close panel → polling stops<br>6. Refresh button → manual refresh with spinner | Polling works, data updates smoothly, manual refresh functional |
| TP-13 | Panel Resize | 1. Drag resize handle on left border<br>2. Panel width changes (min/max limits respected)<br>3. Content adjusts to new width<br>4. Task cards responsive to width changes | Resize works, limits enforced, content responsive |
| TP-14 | Empty State | 1. No tasks → empty state shows<br>2. Message: "No tasks match the current filter"<br>3. Try different filters → message updates | Empty state displays correctly |
| TP-15 | Timestamps Display | 1. Check task card shows created/completed timestamps<br>2. Format: relative time (e.g., "2 minutes ago") or absolute<br>3. Timestamps update on refresh<br>4. Progress log timestamps in HH:mm:ss format | Timestamps display correctly, format consistent |

---

## 11. CLOUD PANEL

| ID | Name | Steps | Expected Result |
|----|------|-------|--------------------|
| CLD-01 | Panel Header & Controls | 1. Click Cloud icon in header → panel opens on right<br>2. Check header: Server icon, "Cloud" title, Refresh button, Expand button, Close button<br>3. Click Refresh → icon spins, environments reload<br>4. Click Expand → fullscreen mode, "Fullscreen" badge appears<br>5. Click Minimize → returns to normal size | Panel opens, header displays correctly, all buttons functional |
| CLD-02 | Environments List - Loading | 1. Open panel → loading state shows<br>2. Check: spinner icon, "Loading environments..." text<br>3. API call: POST /agent/environment/list_environments<br>4. Loading completes → environments display | Loading state shows, API called, data loads |
| CLD-03 | Environments List - Empty State | 1. User with no environments → open panel<br>2. Check: Server icon, "No environments found" message<br>3. Subtitle: "Please, ask in the chat to deploy Cyoda environment"<br>4. No errors shown | Empty state displays, message clear, no errors |
| CLD-04 | Environment Card Display | 1. Environments loaded → cards display<br>2. Each card shows: Server icon, environment name, status badge, namespace (truncated if long)<br>3. Hover → visual feedback (border highlight)<br>4. Click card → opens environment details | Cards display correctly, hover effect works, click opens details |
| CLD-05 | Environment Status Badge | 1. Check status badges display correctly for different statuses:<br>   - Active: green styling<br>   - Inactive: gray styling<br>   - Maintenance: yellow styling<br>2. Status text visible and readable | Status badges display with appropriate visual distinction |
| CLD-06 | Environment Details - Header | 1. Click environment card → details view opens<br>2. Check header: Back arrow icon, environment name, "View Logs" button<br>3. Click Back → returns to environments list<br>4. Click "View Logs" → navigates to /logs with env pre-selected<br>5. Close button (X) → closes panel | Details header displays, navigation works, buttons functional |
| CLD-07 | Environment Details - Info Section | 1. Details view → "ENVIRONMENT DETAILS" section visible<br>2. Check fields displayed:<br>   - Namespace with copy button<br>   - Status with refresh icon button<br>   - Client Environment URL with copy button<br>   - Organization ID with copy button<br>3. All values displayed in code blocks | Info section displays all fields correctly |
| CLD-08 | Copy to Clipboard Functionality | 1. Click copy button next to Namespace → copies to clipboard<br>2. Icon changes to checkmark for 2 seconds<br>3. Repeat for: Environment URL, Organization ID<br>4. Hover effect visible on copy buttons | Copy works, feedback shows, hover effects correct |
| CLD-09 | Environment URL Construction | 1. Check URL format: https://{namespace}.{host}<br>2. Host from VITE_APP_CYODA_CLIENT_HOST or default "cyoda.cloud"<br>3. Example: https://client-a680fca7878e4c73854cfce50b42a108-dev.cyoda.cloud<br>4. URL constructed correctly from namespace | URL format correct, host variable works |
| CLD-10 | Refresh Environment Status | 1. In details view → click refresh icon next to Status<br>2. Icon spins during refresh<br>3. API call: POST /agent/environment/list_environments<br>4. Status updates<br>5. Error handling: shows error message if fails | Refresh works, loading state shows, status updates |
| CLD-11 | User Applications - Empty State | 1. Environment with no apps → "USER APPLICATIONS" section shows<br>2. Check: Package icon, "No user applications deployed" message<br>3. Subtitle: "Deploy an application to get started"<br>4. Empty state visually distinct | Empty state displays correctly |
| CLD-12 | User Applications - List Display | 1. Environment with apps → apps list shows<br>2. Each app card shows: Package icon, app name, namespace (truncated if long)<br>3. App URL displayed in code block with copy button<br>4. Hover → visual feedback | Apps display correctly, all fields visible |
| CLD-13 | User Applications - Refresh | 1. Click Refresh button in "USER APPLICATIONS" section<br>2. Button shows refresh icon and "Refresh" text<br>3. Icon spins during loading<br>4. API call: POST /agent/environment/list_user_apps with env_name<br>5. Apps list updates | Refresh works, loading state shows, apps update |
| CLD-14 | App URL Construction | 1. Check app URL format: https://{app.namespace}.{host}<br>2. Host from VITE_APP_CYODA_CLIENT_HOST or default "cyoda.cloud"<br>3. URL displayed in code block<br>4. Copy button works | App URL format correct, copy functional |
| CLD-15 | Panel Resize | 1. Drag resize handle on left border<br>2. Panel width changes<br>3. Min/max width limits respected<br>4. Content adjusts to new width | Resize works, limits enforced, content responsive |
| CLD-16 | Try These Prompts - Collapse/Expand | 1. In environment details → "TRY THESE PROMPTS" section visible<br>2. Check header: MessageSquare icon, "Try These Prompts" title, Collapse/Expand button<br>3. Click Collapse → prompts list hides, button shows "Expand" with chevron down<br>4. Click Expand → prompts list shows, button shows "Collapse" with chevron up | Section displays, collapse/expand works, button state changes |
| CLD-17 | Prompt Cards Display | 1. Expand prompts section → 10 prompt cards display<br>2. Each card shows: icon, prompt text<br>3. Prompts include: "List all my environments", "Describe my dev environment", "List my applications in dev", etc.<br>4. Grid layout, scrollable if many prompts | All 10 prompts display, icons visible, text readable |
| CLD-18 | Copy Prompt Functionality | 1. Click copy button on any prompt card → copies to clipboard<br>2. Success message: "Prompt copied to clipboard"<br>3. Icon changes to checkmark for 2 seconds<br>4. Click anywhere on prompt card → also copies prompt<br>5. Hover → visual feedback on card and copy button | Copy works, feedback shows, click on card works |
| CLD-19 | Redeploy Section | 1. In environment details → "REDEPLOY" section visible<br>2. Text: "Copy this message to request environment redeployment:"<br>3. Code block shows: "Please, redeploy my cyoda environment: {environmentUrl}"<br>4. Copy button next to message<br>5. Click copy → message copied, checkmark shows for 2 seconds | Redeploy section displays, message correct, copy works |
| CLD-20 | Environment Logs Section | 1. "ENVIRONMENT LOGS" section visible<br>2. Card shows: File icon, "View System Logs" title, "Real-time log analysis & monitoring" subtitle<br>3. Features listed: Advanced Search, Level Filtering, Query DSL, Export JSON<br>4. Description: "Access comprehensive logging with Elasticsearch integration"<br>5. "Open" button with arrow<br>6. Click card or button → opens /logs in new tab with env_name pre-selected | Logs section displays, all features listed, click opens logs page |
| CLD-21 | Metrics & Dashboards Section | 1. "METRICS & DASHBOARDS" section visible<br>2. Card shows: BarChart3 icon, "Metrics & Dashboards" title, "Real-time performance monitoring" subtitle<br>3. Features in 2x2 grid: CPU & Memory, Network Traffic, Pod Metrics, Custom Dashboards<br>4. Description: "Grafana dashboards with real-time Kubernetes metrics"<br>5. "Open" button with arrow<br>6. Click card or button → opens /monitoring in new tab with env_name pre-selected<br>7. Hover → card lifts slightly, glow effect | Metrics section displays, all features listed, click opens monitoring page, hover effect works |
| CLD-22 | API Functions - Collapse/Expand | 1. "API FUNCTIONS" section visible<br>2. Check header: Code2 icon, "API Functions" title, Expand/Collapse button<br>3. Click Collapse → functions list hides, button shows "Expand"<br>4. Click Expand → functions list shows, button shows "Collapse"<br>5. Chevron icon rotates | Section displays, collapse/expand works, button state changes |
| CLD-23 | API Functions - List Display | 1. Expand API Functions → function cards display<br>2. Functions grouped by category: User Management, Client Management, etc.<br>3. Each card shows: icon, function name, description, method badge (GET/POST/PUT/DELETE), path<br>4. Examples: "Issue Technical User", "Get Users", "Reset Client Secret"<br>5. Scrollable if many functions | All functions display, grouped correctly, all info visible |
| CLD-24 | API Functions - Execute Function | 1. Click "Execute" button on any function card<br>2. If function has parameters → input fields appear<br>3. Fill parameters → click Execute again<br>4. Loading state shows during execution<br>5. Success → response shows below card (JSON format)<br>6. Error → error message displays<br>7. Click "View Response" → modal opens with formatted JSON | Execute works, parameters handled, loading state shows, response displays |

---

## 12. LOGS

| ID | Name | Steps | Expected Result |
|----|------|-------|-------------------|
| L-01 | LogsView - Header & Navigation | 1. Navigate to /logs<br>2. Check header: CYODA logo, "Environment Logs" title, "Real-time log monitoring and analysis" subtitle<br>3. Click logo → navigates to /<br>4. Check buttons: "Generate API Key" or "Refresh" button | Header displays, logo navigation works, buttons functional |
| L-02 | LogsView - API Key Generation | 1. No API key → "Generate API Key" button visible<br>2. Click → loading state, API call<br>3. Success → key stored in localStorage<br>4. Button changes to "Refresh"<br>5. Key used in X-API-Key header for requests | Key generation works, stored in localStorage, used in API calls |
| L-03 | LogsView - Environment & App Selection | 1. Environment dropdown → loading → populated from API<br>2. Select environment → fetches applications<br>3. Application dropdown populated<br>4. Select application → enables log fetching<br>5. URL params (env_name, app_name) pre-select if present | Dropdowns work, cascading selection functional, URL params apply |
| L-04 | LogViewer - Search & Filters | 1. Search input field for message text<br>2. Level filter buttons: INFO, WARN, ERROR, DEBUG, TRACE<br>3. Click level → toggles filter<br>4. "All Levels" button → toggles all<br>5. Apply filters → Elasticsearch query builds → logs load | Search fields work, filters apply, query builds correctly |
| L-05 | LogViewer - Entries Limit | 1. Entries dropdown: 50, 100, 500, 1000 entries<br>2. Select limit → fetches that many logs<br>3. Display shows "Showing X of Y results"<br>4. Limit applies to query | Entries limit works, display updates, query respects limit |
| L-06 | Query Templates | 1. Click "Advanced Query" → panel opens<br>2. Query Templates section shows 6 templates<br>3. Templates: Last Hour, Last 24 Hours, Search by Message, Search by Exception, By Span ID, By Trace ID<br>4. Click template → fills query editor<br>5. Can edit after applying | Templates work, query fills, editable after applying |
| L-07 | Advanced Query Editor | 1. "Advanced Query" panel → Monaco editor visible<br>2. Enter Elasticsearch query (JSON)<br>3. Syntax highlighting works<br>4. Invalid JSON → validation error shows<br>5. Valid query → "Apply Query" button enabled<br>6. Click Apply → executes query, fetches logs | Advanced editor works, validation functional, execution works |
| L-08 | Log Entries Display | 1. Logs load → entries display in list<br>2. Each entry shows: timestamp, level badge, message<br>3. Virtual scrolling for 1000+ logs<br>4. Smooth scrolling, no lag<br>5. Click entry → expands to show full details | Log entries display correctly, virtual scrolling works, click expands |
| L-09 | Log Details Modal | 1. Click log entry → modal opens<br>2. Shows full JSON of log entry<br>3. Syntax highlighting for JSON<br>4. Copy button → copies JSON to clipboard<br>5. Close button (X) → closes modal<br>6. Click outside → closes modal | Details modal works, JSON displays, copy functional |
| L-10 | Export Logs | 1. Click "Export" button<br>2. Downloads JSON file: logs-{timestamp}.json<br>3. File contains filtered logs<br>4. JSON format valid | Export works, file downloads, format correct |
| L-11 | LogsView - Loading & Error States | 1. Loading logs → spinner shows, "Loading logs..." text<br>2. No logs → empty state: "No logs available", "Load Logs" button<br>3. Error → error message displays<br>4. Retry functionality works | Loading states display correctly, empty state shows, errors handled |

---

## 13. METRICS & MONITORING

| ID | Name | Steps | Expected Result |
|----|------|-------|-------------------|
| M-01 | MonitoringView - Header & Navigation | 1. Navigate to /monitoring<br>2. Check header: CYODA logo, "Real-time metrics monitoring" text<br>3. Click logo → navigates to /<br>4. Check buttons: "Metrics (N)" button, "Refresh" button<br>5. Buttons display correctly with icons | Header displays, logo navigation works, buttons functional |
| M-02 | MonitoringView - Environment & App Selection | 1. Environment dropdown → loading → populated from API<br>2. Select environment → fetches applications<br>3. Application dropdown shows "cyoda (default)" + user apps<br>4. URL params (env_name) pre-select environment<br>5. Loading states show correctly | Dropdowns work, cascading selection, URL params apply, loading states correct |
| M-03 | Metric Selector Panel | 1. Click "Metrics (N)" button → panel opens<br>2. Shows "Select Metrics to Display" title<br>3. Grid with 16 metric checkboxes (CPU Usage Rate, Memory Usage, Pod Count, etc.)<br>4. Click "Select All" → all 16 selected<br>5. Click "Unselect All" → all deselected<br>6. Check/uncheck individual metrics → immediately fetches data<br>7. Counter updates: "Metrics (3)" | Selector panel works, all buttons functional, immediate fetch on selection |
| M-04 | Metric Cards Display | 1. Selected metrics → cards display in grid<br>2. Each card shows: icon, metric name, current value with unit<br>3. Mini line chart preview (last hour data)<br>4. Hover → card lifts slightly<br>5. Click card → opens expanded modal | Cards display correctly, all info visible, hover effect works, click opens modal |
| M-05 | Metrics Charts & Tooltips | 1. Chart: LineChart with X-axis (time), Y-axis (value)<br>2. Hover → tooltip with timestamp + value<br>3. Responsive: adjusts to container<br>4. Auto-scale Y-axis<br>5. Time format: HH:mm:ss | Chart displays, tooltips work, responsive, auto-scale functional |
| M-06 | Expanded Metric Modal | 1. Click any metric card → modal opens fullscreen<br>2. Shows: metric icon, name, timezone info<br>3. Full-size LineChart with time series data<br>4. Tooltip on hover shows timestamp + value<br>5. Close button (X) → closes modal<br>6. Click outside → closes modal | Modal opens, chart displays, tooltips work, close functional |
| M-07 | Metrics Data & Units | 1. Check metric value formatting:<br>   - CPU: "X.XXX cores"<br>   - Memory: "X.XX GB"<br>   - HTTP Latency: "X.XX ms"<br>   - HTTP Requests: "X.XX req/s"<br>   - Counts: integer values<br>2. Values update on refresh<br>3. Chart data points match values | Units display correctly, formatting accurate, data consistent |
| M-08 | Auto-Refresh | 1. Metrics auto-refresh every 30 seconds<br>2. Loading indicator during refresh<br>3. "Last update" timestamp updates<br>4. Charts update with new data<br>5. No manual toggle needed (always on) | Auto-refresh works, timestamp updates, charts refresh |
| M-09 | MonitoringView - Error Handling | 1. Trigger error (invalid environment, network issue)<br>2. Error banner displays with message<br>3. "Retry" button visible<br>4. Click Retry → re-fetches metrics<br>5. Rate limit (429) → specific error message<br>6. Error clears on successful fetch | Error handling works, retry functional, rate limit handled |
| M-10 | MonitoringView - Loading States | 1. Select environment → loading state shows<br>2. Click Refresh → button shows spinner, "Loading..." text<br>3. Metric cards show loading indicator<br>4. Loading completes → data displays<br>5. No environment selected → Refresh button disabled | Loading states display correctly, disabled states work |

---

## 14. COMMON DIALOGS & MODALS

| ID | Name | Steps | Expected Result |
|----|------|-------|-------------------|
| CDM-01 | Confirmation Dialog (Terms) | 1. First time user → dialog opens<br>2. Checkbox "I agree", links clickable<br>3. Checkbox unchecked → "Agree" button disabled<br>4. Check → button enabled → submit<br>5. Cannot close by backdrop click or Escape (must agree) | Dialog shows, checkbox controls button, must agree to proceed, not closable by backdrop/Escape |
| CDM-02 | Guest Limit Modal | 1. Guest hits limit → modal opens<br>2. Lock icon with pulse animation<br>3. "Guest Limit Reached" title, explanation text<br>4. Buttons: "Continue as Guest", "Log in"<br>5. Click button → executes action | Modal shows, animation works, buttons functional |
| CDM-03 | Error Modal - Types | 1. Trigger error → modal opens<br>2. Check 4 types: info, warning, error, network<br>3. Each type: corresponding icon (Info, AlertTriangle, XCircle, Wifi), theme color<br>4. "Close" button visible<br>5. Auto-dismiss after timeout (optional, configurable)<br>6. Escape key → closes modal | Modal shows for each type, icons correct, colors match type, close/dismiss work |
| CDM-04 | Common Dialog Behaviors | 1. Open any closable dialog → click backdrop → closes<br>2. Escape key → closes (if closable)<br>3. Tab key → focus cycles inside dialog (focus trap)<br>4. Shift+Tab → reverse focus cycle<br>5. Check animations: fade-in on open, fade-out on close<br>6. Dialog centered on screen<br>7. Backdrop darkens background | Backdrop/Escape work, focus trap functional, animations smooth, positioning correct |

---

## 15. ACCESSIBILITY & RESPONSIVE

| ID | Name | Steps | Expected Result |
|----|------|-------|-------------------|
| AR-01 | Keyboard Navigation | 1. Tab through all interactive elements<br>2. Enter/Space activates buttons<br>3. Escape closes modals/dropdowns<br>4. Arrow keys in dropdowns/lists<br>5. Cmd/Ctrl+shortcuts work | Focus visible, logical tab order, no keyboard traps, shortcuts functional |
| AR-02 | Screen Reader Support | 1. Enable screen reader (NVDA/VoiceOver/TalkBack)<br>2. All elements announced, labels clear<br>3. Live regions for streaming/notifications<br>4. ARIA attributes correct | Content readable, context clear, updates announced, ARIA correct |
| AR-03 | Color Contrast | 1. Check text readable on all backgrounds<br>2. Buttons readable<br>3. Errors clearly visible<br>4. WCAG AA compliance | All text readable, sufficient contrast |
| AR-04 | Mobile Layout (< 768px) | 1. Resize to 375px<br>2. Panels collapse/stack, buttons resize, text wraps<br>3. No horizontal scroll<br>4. Touch targets minimum 44px × 44px | Mobile layout works, all functions accessible, touch targets sufficient |
| AR-05 | Tablet & Desktop Layouts | 1. Resize to 768px → tablet layout<br>2. Resize to 1920px → desktop layout<br>3. Hover states functional on desktop<br>4. Max-width constraints apply | Layouts adapt, optimal use of space, hover works |
| AR-06 | Breakpoint Transitions | 1. Slowly resize window through breakpoints<br>2. Smooth transitions, no layout jumps<br>3. Content remains accessible | Responsive design fluid, transitions smooth |

---

## 16. EDGE CASES & PERFORMANCE

| ID | Name | Steps | Expected Result |
|----|------|-------|-------------------|
| EP-01 | Long Content Handling | 1. Send very long message (1000+ chars)<br>2. Wraps correctly, no overflow<br>3. Scrolling works<br>4. Streaming animation keeps up | Performance maintained, readable, scrolling smooth |
| EP-02 | Rapid Streaming | 1. Fast content updates<br>2. Typing animation smooth<br>3. Auto-scroll smooth<br>4. No lag | No stuttering, state updates correctly, performance maintained |
| EP-03 | Network Issues | 1. Simulate timeout → error shown<br>2. Simulate connection lost → error shown<br>3. Retry button works<br>4. Error details accurate | Graceful degradation, clear error messages, retry functional |
| EP-04 | Multiple Concurrent Streams | 1. Multiple streaming messages simultaneously<br>2. Each independent, no state conflicts<br>3. All display correctly | Streams don't conflict, auto-scroll correct |
| EP-05 | Empty States | 1. No chats → empty state message<br>2. No tasks → empty state<br>3. No environments → empty state<br>4. No logs → empty state | Clear messaging, call-to-action buttons show |
| EP-06 | Large Datasets Performance | 1. 1000+ logs → virtual scrolling<br>2. 100+ chats → pagination<br>3. 50+ nodes in canvas → performance maintained | Smooth scrolling, no lag, efficient rendering, virtual scrolling works |
| EP-07 | Special Characters & Security | 1. Content with emoji, unicode, HTML, code<br>2. Displayed correctly<br>3. HTML escaped (XSS prevention)<br>4. Code formatted | Security maintained, proper rendering, XSS prevented |
| EP-08 | Browser Compatibility | 1. Test in Chrome, Firefox, Safari, Edge (latest)<br>2. All features work<br>3. Styling consistent | Cross-browser compatibility, no errors |
| EP-09 | Offline Mode & Session | 1. Disconnect network → error messages, graceful degradation<br>2. Reload page → state restored (auth, panels, settings)<br>3. Clear localStorage → clean state | Offline handling correct, session persistence works, data persists |

---

## TECHNICAL MARKERS FOR VERIFICATION

### Timing & Performance
- **Typing animation:** 10ms per character
- **ThinkingAnimation:** 1.4s duration, staggered delays 0ms/200ms/400ms
- **Auto-refresh:** Tasks 3s, Metrics 30s, Logs manual
- **Transitions:** 200ms standard, 300ms fade-out
- **Refresh animation:** 500ms minimum
- **Auto-dismiss:** 5000ms default for notifications
- **Debounce:** 300ms for search

### Sizes & Limits
- **File uploads:** 10MB guest, 50MB logged in
- **Chat name:** max 100 characters
- **Textarea:** min 40px, max 200px (chat input)
- **Panel width:** Tasks 500px, Chat History/Cloud resizable
- **Dialog width:** Rename max-w-md, Details max-w-4xl, Login 520px
- **Touch targets:** minimum 44px × 44px (mobile)
- **Avatar:** 40px × 40px
- **Resize handles:** 8 handles on selected node

### Functional Elements
- **Keyboard shortcuts:** Cmd/Ctrl+Enter (send), Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo), Escape (close)
- **Auto-scroll:** Smooth behavior, block end, only when isComplete = false
- **Virtual scrolling:** For 1000+ items (logs, chats)
- **Pagination:** Load more for large lists
- **Focus trap:** Tab cycles inside dialogs
- **Loading states:** Show for all async operations
- **Error handling:** Retry buttons, error details, graceful degradation

### API & Integration
- **Logs:** POST /v1/logs/search, POST /v1/logs/api-key (X-API-Key header)
- **Metrics:** POST /v1/metrics/query_range (Prometheus queries)
- **Environments:** POST /agent/environment/list_environments, /create_app
- **Chats:** GET /v1/chats, POST /v1/chats, PATCH /v1/chats/{id}, DELETE /v1/chats/{id}
- **Auth:** Auth0 integration, JWT tokens (Authorization: Bearer {token})
- **Elasticsearch:** Query builder for logs
- **Rate limiting:** 429 error handling

---

## TEST PRIORITIES

### P0 (Critical) - Must Test
- Authorization (guest mode, login, logout)
- Sending messages and receiving responses
- Streaming messages with typing animation
- Canvas core operations (add/edit/delete nodes)
- Panel toggles (Chat History, Tasks, Cloud)
- File attachments (upload, preview, limits)
- Error handling (network, timeout, validation)

### P1 (High) - Should Test
- All buttons and controls in toolbars
- Dialogs (rename, delete, confirmation)
- Settings and their persistence
- Auto-refresh and polling
- Keyboard shortcuts
- Responsive design (mobile, tablet, desktop)
- Logs & Monitoring (search, filters, charts)

### P2 (Medium) - Nice to Test
- Animations (fade, pulse, bounce, spin)
- Hover effects and transitions
- Empty states
- Copy functionality
- Context menus
- Query templates
- Advanced features (super user mode, GitHub integration)

### P3 (Low) - Optional
- Edge cases (long content, special characters)
- Performance with large datasets
- Browser compatibility
- Offline mode
- Accessibility (screen reader, keyboard only)

---

## SMOKE TEST (30 minutes)

Quick check of critical functions:

1. **Auth:** Guest mode → Login → Logout (5 min)
2. **Chat:** Send message → Receive streaming response → File attachment (5 min)
3. **Canvas:** Open → Add node → Connect → Save (5 min)
4. **Panels:** Toggle Chat History → Toggle Tasks → Toggle Cloud (3 min)
5. **Dialogs:** Rename chat → Delete chat (3 min)
6. **Logs:** Generate API key → Select environment → Fetch logs (5 min)
7. **Functional:** Buttons, dropdowns, forms work (2 min)
8. **Responsive:** Resize to mobile → tablet → desktop (2 min)

---

## FULL TEST RUN (8-12 hours)

- **Authorization:** 1 hour
- **Home Page + Header:** 1 hour
- **Chat Page:** 1.5-2 hours
- **Chat History Panel:** 1 hour
- **Streaming & Notifications:** 1 hour
- **Workflow Canvas:** 1-1.5 hours
- **Apps Canvas (Requirements + Entity):** 2-2.5 hours
- **Tasks Panel:** 1 hour
- **Cloud Panel:** 1.5-2 hours
- **Logs & Monitoring:** 1.5-2 hours
- **Dialogs & Modals:** 1 hour
- **Accessibility & Responsive:** 1 hour
- **Edge Cases:** 1 hour

---

## NOTES

- **Focus on functionality** - buttons work, forms submit, data loads
- **UI interactions** - clicks, hover, drag & drop, keyboard shortcuts
- **Technical markers** (10ms, 500ms, 10MB, 8 handles) - verify using DevTools or visual inspection
- **Animations** - check smoothness, no lag, correct completion
- **Responsive** - test on real devices or DevTools device emulation
- **Accessibility** - minimum keyboard navigation and screen reader support
- **Error states** - must verify all error types and retry functionality
- **Loading states** - verify shown for all async operations
- **State persistence** - verify data saved in localStorage where needed

---

**Document created:** 2026-02-05
**Updated:** 2026-02-06
**Source:** 13 detailed documents with 5,006 test cases
**Compressed to:** ~150 scenarios for quick manual test run
**Focus:** UI functionality, clicks, correct operation of all functions

