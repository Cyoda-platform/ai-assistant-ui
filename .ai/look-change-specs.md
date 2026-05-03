Below is a change specification for the next phase: preserving the authenticated product shell and functionality, but changing the surface from cartoon AI builder / Cyoda AI Studio to hosted Cyoda runtime workbench / Cyoda Cloud.

⸻

Specification: Rebrand and Restyle Authenticated Cyoda Cloud App

0. Instruction to 

You are updating the authenticated packages/web Cyoda Cloud application UI.

This is a visual, branding, copy, and shell refinement pass.

It is not a product-logic rewrite. It is not a workflow editor rewrite. It is not an Auth0/API/stores refactor.

The public logged-out landing page at / has already been updated and should remain intact. This task is for the logged-in/authenticated app experience after Auth0 login, especially:

* /home
* /chat/:technicalId
* /new-chat
* authenticated shell/header
* panels around History / Canvas / Cloud / Tasks

The goal is to preserve the current product functionality, but replace the old “Cyoda AI Studio” / cartoon AI builder look with a Cyoda Cloud workbench look that matches the Cyoda website family.

⸻

1. Product Direction

1.1 Target identity

Use:

Cyoda Cloud

Do not use as product identity:

Cyoda AI Studio
CYODA AI
AI Studio
BUILD WITH CYODA AI

The AI assistant may remain as a feature, but not as the product name.

Acceptable feature wording:

AI assistant
Cyoda assistant
Assistant

Avoid making the whole product feel like a chatbot.

Cyoda Cloud should be framed as:

the hosted Cyoda runtime workbench for modelling entity lifecycles, workflows, code, environments, tasks, and history

This aligns with the Cyoda context: Cyoda is the product, Cloud and Enterprise are consumption/deployment modes, and the core story is workflow-driven EDBMS, entity lifecycle, transactional workflows, temporal history, and auditable transitions.  ￼

⸻

2. Design Direction

2.1 Required look and feel

Move the authenticated app to a light-mode Cyoda Cloud workbench that visually aligns with:

* cyoda.net public landing page
* cyoda.com Enterprise site
* cyoda.org open-source/developer-first site

The authenticated app should feel:

technical
calm
developer-first
credible
product-led
precise

It should not feel:

cartoon
gamified
neon
AI-hype
mascot-led
consumer-chatbot

The audit found the authenticated experience is still dark, gamified, neon-accented, playful/person-image driven, and AI-first, even though the core functional app shell is valuable and should be preserved.  ￼

2.2 Theme target

User decision:

Authenticated app should move to light mode, in line with the rest of the Cyoda websites.

Target palette:

Background: #ffffff / #f8fafc / #f1f5f9
Primary text: #0f172a / slate-900
Secondary text: #334155 / slate-700
Muted text: #64748b / slate-500
Borders: #e2e8f0 / slate-200
Primary blue: #2563eb
Hover blue: #1d4ed8
Cyoda teal: use sparingly as brand accent, not neon
Success: #059669
Warning: #d97706
Error: #dc2626
Code/mono surface: #f8fafc or #f1f5f9

Avoid:

bg-slate-900
bg-slate-800
from-slate-900 via-slate-900 to-slate-800
text-teal-400 as dominant neon
text-pink-500
text-orange-500 as primary UI accent
glow effects
heavy gradients
glassmorphism
shimmer
pulse
cartoon image cards

The audit identified hardcoded dark backgrounds, neon teal/pink/orange accents, glow effects, GIF logos, cyoda_ai.png, and people/ppl*.png assets as the current visual system problems.  ￼

⸻

3. Functional Scope

3.1 Must preserve

Preserve all current authenticated functionality:

* Auth0 login/logout state
* /home entry
* /chat/:technicalId
* /new-chat
* /workflows
* /environments
* /logs
* History
* Canvas
* Cloud
* Tasks
* Chat streaming
* Multi-agent transfers
* File attachments
* GitOps repository setup
* Repository selector
* Branch cloning
* Pull / push logic
* Requirements tab
* Entities tab
* Workflows tab
* Code tab
* Monaco editor
* current WorkflowCanvas
* current React Flow workflow editor
* Environments panel
* Monitoring/metrics
* Tasks panel
* User controls
* Notification controls
* social/docs/GitHub links
* prompt submit
* read-more/options flow

The audit explicitly identifies Chat, GitOps, Canvas, Infrastructure panels, and Auth as functional inventory to preserve.  ￼

3.2 Do not touch

Do not make functional changes to:

packages/web/src/components/WorkflowCanvas/
packages/web/src/components/PortalCanvas/
packages/web/src/services/
packages/web/src/stores/
packages/desktop/
packages/desktop-workflow/

Do not alter:

* API clients
* Auth0 token management
* streaming logic
* repository/GitOps logic
* drag/drop logic
* workflow editor internals
* workflow editor data model
* ResizeHandle logic
* ChatBot ↔ ChatBotCanvas bridge logic
* store contracts

The audit identifies WorkflowCanvas, streaming logic, App.tsx auth redirects, services, and stores as high-risk areas.  ￼

⸻

4. Implementation Phasing

Implement in this order.

Phase 1 — Brand and copy cleanup

Safe files likely include:

packages/web/src/views/HomeView.tsx
packages/web/src/components/Header/Header.tsx
packages/web/src/components/NewChat/NewChat.tsx
packages/web/src/i18n/en.json

Goals:

* Replace “Cyoda AI Studio” with “Cyoda Cloud”
* Replace “CYODA AI” product identity with “Cyoda Cloud” or “Cyoda”
* Replace “BUILD WITH CYODA AI” with “Cyoda Cloud”
* Remove “For anyone who has a problem to solve”
* Remove old AI-builder positioning
* Keep “AI assistant” only where it refers to assistant functionality
* Keep “History”, “Canvas”, “Cloud”, “Tasks” as top-level feature labels
* Keep “BETA”, but restyle it subtly

Known copy targets from audit include HomeView.tsx, i18n/en.json, and visible strings such as “Cyoda AI Studio”, “CYODA AI”, “BUILD WITH CYODA AI”, and “Anyone who has a problem…”.  ￼

⸻

Phase 2 — Replace /home with product workbench dashboard

User decision:

/home should become a dashboard/product start page.
Remove cartoon/gamified/neon look.
Make it product/engineering-led.

Current problem

HomeView.tsx currently renders:

* giant “Cyoda AI Studio”
* “Build with Cyoda.”
* “For anyone who has a problem to solve”
* person/cartoon carousel
* gamified prompt cards
* neon/dark hero
* old quick action cards

The audit identifies the HomeView.tsx hero, person carousel, quick actions, Montserrat usage, and hardcoded teal/pink accents as critical redesign targets.  ￼

Replace with

A Cyoda Cloud Workbench start page.

Suggested structure:

Header/app shell remains
Main /home content:
1. Workbench hero
2. Primary prompt area
3. Suggested technical prompts
4. Workspace shortcuts
5. Current project/repository status
6. Recent activity/history preview
7. Cloud/runtime status preview

Suggested /home hero copy

Cyoda Cloud Workbench
Model entity lifecycles, generate workflows, connect processors, and inspect history on hosted Cyoda.

Secondary copy:

Use the assistant to draft models and services, then refine them in Canvas with Requirements, Entities, Workflows, and Code.

Do not use:

Cyoda AI Studio
Build with Cyoda.
For anyone who has a problem to solve

Suggested primary prompt placeholder

Ask the assistant to model a workflow, explain an entity lifecycle, or generate a service stub.

Suggested prompt examples

Use exactly these examples unless component constraints require shortening:

Model a trade settlement lifecycle
Create a KYC onboarding workflow
Add an entity with lifecycle states
Connect a Java processor
Explain this workflow
Generate a Python service stub

User explicitly approved these examples.

Suggested workbench shortcut cards

Use product/function cards, not gamified prompt cards:

Canvas
Model requirements, entities, workflows, and code.
Cloud
View environments, runtime status, and deployed applications.
History
Resume recent conversations and modelling sessions.
Tasks
Track background jobs and long-running operations.

If existing app state can provide counts, use them. If not, do not invent dynamic counts.

Visual treatment

Use:

white cards
slate borders
blue primary CTA
subtle Cyoda teal accent
small mono labels
technical iconography
no hero character/avatar

Remove:

person carousel
cartoon image/avatar hero
big neon title
pink/orange accent emphasis
large glow backgrounds

⸻

Phase 3 — Header/app shell restyle

File likely:

packages/web/src/components/Header/Header.tsx

The header must remain functional.

Keep:

History
Canvas
Cloud
Tasks
BETA
user/avatar menu
notifications
docs/GitHub/social links if present
panel toggles

Restyle:

* light background
* border-b border-slate-200
* logo/wordmark consistent with public landing page
* app name visually reads CYODA Cloud, not Cyoda Cyoda Cloud
* subtle BETA pill
* nav text text-slate-700
* active state with blue/slate treatment, not neon teal glow
* icons text-slate-500 / active text-blue-600
* no heavy dark glass panel
* no animated logo
* no GIF logo

Suggested header style:

bg-white
border-b border-slate-200
text-slate-700
active: bg-blue-50 text-blue-700 border-blue-200
hover: bg-slate-50 text-slate-950

Keep the label Canvas, but do not change Canvas functionality.

The audit identifies the top nav in Header.tsx as a key visual and branding target, with neon text-teal-400 styling.  ￼

⸻

Phase 4 — Authenticated shell background and panels

Files likely:

packages/web/src/views/ChatBotView.tsx
packages/web/src/components/ChatHistoryPanel/ChatHistoryPanel.tsx
packages/web/src/components/EnvironmentsPanel/EnvironmentsPanel.tsx
packages/web/src/components/TasksPanel/TasksPanel.tsx
packages/web/src/assets/css/particular/_variables-dark.scss
packages/web/src/styles/tailwind.css

Move shell surfaces from dark/neon to light workbench styling.

Target shell

overall app background: bg-slate-50
panel/card background: bg-white
panel border: border-slate-200
panel text: text-slate-900 / text-slate-700
muted text: text-slate-500
active controls: blue accent
secondary controls: slate

Panel rules

For History, Canvas, Cloud, Tasks panels:

* preserve open/close behaviour
* preserve resizable behaviour
* preserve scroll behaviour
* preserve existing component state
* do not alter data fetching
* do not alter event handlers

Restyle only:

* background
* text colours
* borders
* active tabs
* empty states
* buttons
* icons

Resize and layout warning

ChatBotView.tsx manages the workspace via useResizablePanel; Canvas is a panel state, not a route, and the layout is main-layout -> sidebar/history -> canvas -> chat -> right panels. The audit marks resize logic and ChatBot/ChatBotCanvas bridge callbacks as high risk. Do not alter these behaviours.  ￼

⸻

Phase 5 — NewChat restyle

Files likely:

packages/web/src/components/NewChat/NewChat.tsx
packages/web/src/views/NewChatView.tsx
packages/web/src/i18n/en.json

/new-chat should not look like a broken/legacy AI page.

Change it to a light-mode Cyoda Cloud workbench empty state.

Suggested title:

Start a Cyoda Cloud session

Suggested subtitle:

Ask the assistant to draft an entity model, lifecycle workflow, processor, or service stub.

Suggested prompt placeholder:

Describe the entity, workflow, or service you want to build.

Suggested cards:

Model a trade settlement lifecycle
Create a KYC onboarding workflow
Add an entity with lifecycle states
Connect a Java processor
Explain this workflow
Generate a Python service stub

Remove:

* raw old translation keys
* “BUILD WITH CYODA AI”
* cartoon/gamified copy
* neon cards
* oversized branding

⸻

5. Detailed Copy Replacement Rules

5.1 Product identity

Replace user-visible:

Cyoda AI Studio
AI Studio
BUILD WITH CYODA AI
CYODA AI

With:

Cyoda Cloud

or where appropriate:

Cyoda

or:

AI assistant

Use “AI assistant” only for the chat assistant itself.

5.2 Approved high-level app copy

Use:

Cyoda Cloud Workbench
Hosted Cyoda runtime for modelling entity lifecycles, workflows, services, and history.

Alternative shorter title:

Cyoda Cloud

Subtitle:

Model workflows, connect processors, and inspect state history on hosted Cyoda.

5.3 Approved action examples

Model a trade settlement lifecycle
Create a KYC onboarding workflow
Add an entity with lifecycle states
Connect a Java processor
Explain this workflow
Generate a Python service stub

5.4 Remove/avoid

For anyone who has a problem to solve
My team can't track work efficiently
Deploy my environment
What is CYODA?
What is my CYODA env?
Cyoda AI Studio
Build with Cyoda.
BUILD WITH CYODA AI
CYODA AI
Canvas AI

“Deploy my environment” may remain only if it is a real functional action, but it should be restyled and reframed. Do not present it as a gamified prompt card.

⸻

6. Typography

Use:

Inter for UI and prose
JetBrains Mono for code, IDs, route/path labels, API examples, timestamps

Remove authenticated app use of:

Montserrat
Roboto
decorative/oversized display font styling

The audit confirms Inter and JetBrains Mono are already configured, but Montserrat remains in HomeView.tsx.  ￼

⸻

7. Asset Rules

Remove from authenticated app visible surfaces:

person carousel images
people/ppl*.png usage in HomeView
cartoon/mascot/fairy/pixie imagery
cyoda_ai.png as primary branding
logo.gif
logo-dark.gif

Use:

* static Cyoda wordmark/logo
* lucide-react icons
* simple SVGs
* technical diagrams only if static and restrained

Do not delete asset files unless unused across the whole repo and safe. Prefer removing imports/usages first.

⸻

8. Specific Component Instructions

8.1 HomeView.tsx

This is the largest safe target.

Replace the old AI Studio dashboard with a light-mode workbench start page.

Must remove:

* giant “Cyoda AI Studio”
* person/carousel visual
* “For anyone who has a problem to solve”
* old quick action cards
* Montserrat use
* neon gradient/glow background

Must add:

* Cyoda Cloud Workbench or Cyoda Cloud
* technical subtitle
* prompt input area
* approved prompt examples
* shortcuts to History / Canvas / Cloud / Tasks
* optional status/recent activity cards if data is already available
* light Cyoda design system

Do not change submit logic. Reuse existing prompt submission handlers.

8.2 Header.tsx

Restyle only.

Must keep:

* History toggle
* Canvas toggle
* Cloud toggle
* Tasks toggle
* BETA badge
* notification/user controls
* social/docs links
* existing handlers

Must change:

* remove dark/neon/glow styling
* replace old logo usage if needed
* app identity as Cyoda Cloud
* active/inactive button states to light/slate/blue system

Do not change panel open/close logic.

8.3 ChatBotView.tsx

Medium risk. Be careful.

Change only visual wrapper classes where safe:

* outer background
* panel backgrounds
* borders
* text colours
* active panel indicators

Do not change:

* panel resize logic
* state management
* panel ordering
* chat streaming
* callbacks
* route behaviour

8.4 NewChat.tsx

Restyle and recopy.

Keep prompt behaviour.

Use approved prompts.

Remove old AI Studio labels and dark/gamified look.

8.5 i18n/en.json

Update strings to match the new identity.

Do not remove required keys unless code no longer references them.

Add/adjust keys for:

* Cyoda Cloud
* Cyoda Cloud Workbench
* approved prompt examples
* new prompt placeholder

⸻

9. Light Mode Strategy

The authenticated app currently has many hardcoded dark classes. The audit says moving to full light mode may be high-risk without systematic variable cleanup.  ￼

Still, the user decision is:

Move to light mode, in line with the rest of the Cyoda websites.

Implement as follows:

9.1 First pass: route/component-level light styling

Prefer updating visible authenticated shell components directly:

* HomeView.tsx
* Header.tsx
* NewChat.tsx
* safe wrapper areas in ChatBotView.tsx
* panel wrapper surfaces

Do not perform a huge global dark-variable rewrite in this pass unless necessary.

9.2 Scope product shell class

If useful, add a shell class:

<div className="cyoda-cloud-app-shell">

Then add scoped CSS/Tailwind-compatible rules to neutralise dark inherited styling only inside the authenticated app shell.

Avoid broad global changes that break:

* Monaco
* React Flow
* workflow editor internals
* modals
* Ant Design components
* existing chat message rendering

9.3 Preserve editor readability

If Monaco/WorkflowCanvas/editor internals still look dark, leave them if changing them is high-risk. The app shell should be light, but embedded editors can remain technical dark surfaces for now.

⸻

10. Accessibility Requirements

Ensure:

* readable contrast in light mode
* visible focus states
* buttons not represented only by colour
* icons have labels/tooltips where already present
* active nav state has text/ARIA support where practical
* prompt cards are keyboard accessible
* no animation required
* no shimmer/pulse/glow

Do not introduce animations.

⸻

11. Tests

Expected affected tests from audit:

HomeView.test.tsx
Header.test.tsx
NewChatView.test.tsx

The audit says these tests assert on old names/logo/nav/prompt suggestions.  ￼

Update tests only to reflect new copy/labels.

Do not weaken tests unnecessarily.

Add/adjust tests for:

* no “Cyoda AI Studio” on /home
* /home renders Cyoda Cloud
* approved prompt examples render
* header still renders History / Canvas / Cloud / Tasks
* header still renders BETA
* NewChat no longer shows raw i18n keys
* public landing page remains unaffected

⸻

12. Acceptance Criteria

12.1 Branding

* No authenticated app surface says Cyoda AI Studio.
* No authenticated app surface says BUILD WITH CYODA AI.
* Product identity is Cyoda Cloud.
* AI assistant remains only as a feature label.

12.2 Visual

* /home is light-mode.
* /home looks like a product workbench, not a cartoon AI builder.
* No person/cartoon carousel appears.
* No giant neon AI Studio hero appears.
* Header is light-mode and visually aligned with public Cyoda Cloud.
* Authenticated shell surfaces are mostly light/slate/white.
* Inter is used for UI/prose.
* JetBrains Mono is used for code/technical labels where relevant.
* Montserrat is removed from authenticated surfaces.

12.3 Functionality

* /home still works.
* /chat/:technicalId still works.
* /new-chat still works.
* /workflows still works.
* History toggle still works.
* Canvas toggle still works.
* Cloud toggle still works.
* Tasks toggle still works.
* Canvas still shows Requirements / Entities / Workflows / Code.
* Chat input still works.
* Prompt examples still submit through existing logic.
* Repository selector still works.
* Pull button still works.
* No workflow editor logic was changed.

12.4 Safety

* No changes to WorkflowCanvas.
* No changes to PortalCanvas.
* No changes to services/API clients.
* No changes to stores.
* No desktop app changes.
* No Auth0 redirect changes.
* No streaming logic changes.
* No data model changes.

12.5 Build

Run from packages/web:

corepack yarn build

Also run if feasible:

corepack yarn type-check
corepack yarn lint
corepack yarn test:run

If typecheck/lint/test fail because of existing repo-wide issues, report clearly whether failures are pre-existing or introduced.

⸻

13. Manual Test Checklist

After implementation:

1. Log out.
2. Visit /; confirm public landing page still appears.
3. Log in.
4. Confirm redirect to /home.
5. Confirm /home is now light-mode Cyoda Cloud Workbench.
6. Confirm no “Cyoda AI Studio”.
7. Confirm no cartoon/person carousel.
8. Confirm approved prompt examples appear.
9. Submit a prompt example.
10. Confirm chat flow still starts.
11. Open History.
12. Open Canvas.
13. Confirm Requirements / Entities / Workflows / Code tabs still exist.
14. Open Cloud panel.
15. Open Tasks panel.
16. Open /chat/:technicalId.
17. Open /workflows.
18. Confirm no obvious dark/neon/gamified legacy surfaces remain in the main shell.
19. Confirm workflow editor internals still behave as before.
20. Confirm build passes.

⸻

14. Final Report Required

After changes, return:

1. Summary of changes
2. Files changed
3. Files deliberately not touched
4. Branding strings removed/replaced
5. Visual system changes
6. Functional areas verified as preserved
7. Tests updated
8. Build/typecheck/lint/test results
9. Any remaining old dark/neon/gamified surfaces and why
10. Follow-up risks for later cyoda_workflow_editor integration

⸻

15. Implementation Warning

This is not a “make it pretty” task.

This is a product-shell preservation and re-skin task.

The correct outcome is:

same authenticated functionality
same Canvas/History/Cloud/Tasks capability
same workflow editor internals
same chat/repository/environment/task behaviour
new Cyoda Cloud workbench identity
light-mode Cyoda design family
no cartoon/gamified AI Studio surface

Do not trade functionality for visual cleanup.
