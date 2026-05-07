# Cyoda Cloud Style Guide

Version: 1.0  
Date: 2026-05-06  
Owner: Cyoda  
Scope: `cyoda.net`, `ai.cyoda.net`, and the authenticated Cyoda Cloud application in `ai-assistant-ui / packages/web`

## 1. Purpose

This guide defines the visual, content, and interaction standards for Cyoda Cloud. It is intended for designers, frontend developers, and AI coding agents working on the Cyoda Cloud website and authenticated application.

The aim is to keep Cyoda Cloud aligned with the broader Cyoda estate:

- `cyoda.org`: open-source, developer-first, run-it-yourself Cyoda.
- `cyoda.net` / `ai.cyoda.net`: Cyoda Cloud, hosted SaaS Cyoda.
- `cyoda.com`: Enterprise Cyoda, commercial and supported Cyoda.
- `docs.cyoda.net`: documentation for all modes.

Cyoda Cloud must feel like a hosted runtime and workbench for building workflow-driven backend systems. It must not feel like a cartoon AI studio, consumer chatbot, or gamified prototype.

## 2. Product and brand positioning

### 2.1 Core product identity

Use **Cyoda** as the product name.

Use **Cyoda Cloud** for the hosted SaaS mode.

Use **Enterprise Cyoda** for the commercial, supported, large-scale deployment mode.

Use **Run it yourself** for the open-source/self-run mode.

Do not describe Cyoda Cloud, open source Cyoda, or Enterprise Cyoda as separate products. They are consumption and deployment modes of Cyoda.

### 2.2 Category definition

Cyoda is a **workflow-driven Entity Database Management System (EDBMS)** for building scalable, auditable, stateful backend systems.

Cyoda unifies:

- entity state
- lifecycle workflows
- transactional processing
- event-driven behaviour
- temporal history
- bespoke business logic

This is the reason for the design language: the interface should feel structured, explicit, traceable, and technical.

### 2.3 Cloud positioning

Cyoda Cloud is the hosted Cyoda runtime. Its role is to give developers and teams the fastest path to using Cyoda without running infrastructure.

Primary message:

> Hosted Cyoda for modelling entity lifecycles, workflows, services, and history.

Alternative app/workbench message:

> Cyoda Cloud Workbench: model workflows, connect processors, and inspect state history on hosted Cyoda.

### 2.4 AI positioning

The AI assistant is a feature, not the product.

Use:

- AI assistant
- Cyoda assistant
- assistant

Avoid:

- Cyoda AI Studio
- CYODA AI as primary product identity
- AI Studio
- Build with Cyoda AI
- chatbot-first positioning

The assistant should be presented as a way to draft, explain, and iterate on Cyoda models. Cyoda remains the deterministic runtime that enforces state, workflow, transactions, and history.

## 3. Design principles

### 3.1 Principles

The visual system should be:

- calm
- technical
- developer-first
- precise
- credible
- infrastructure-led
- product-led
- restrained

### 3.2 What the design should communicate

The design should signal:

- hosted runtime
- entity lifecycle
- workflow/state-machine logic
- event flow
- auditability
- temporal history
- APIs and service integration
- clear path from local exploration to Cloud and Enterprise

### 3.3 What to avoid

Avoid:

- cartoon imagery
- mascots
- fairies, pixies, or fantasy characters
- gamified visual language
- neon/glow-heavy styling
- heavy gradients
- animated logos
- GIF loaders
- AI brain graphics
- robots
- stock photography
- person/avatar carousel imagery
- exaggerated AI claims
- generic SaaS illustration style

The authenticated UI audit identified the legacy authenticated app as dark, gamified, neon-accented, AI-first, and wrapped around powerful Canvas, Workflow Editor, and GitOps functionality. The rebrand must preserve that functionality while removing the legacy surface style.

## 4. Typography

### 4.1 Required fonts

Use **Inter** for:

- UI text
- body copy
- headings
- navigation
- labels
- cards
- buttons
- panels
- chat messages

Use **JetBrains Mono** for:

- code snippets
- API labels
- entity IDs
- timestamps
- technical metadata
- route/path labels
- JSON samples
- terminal snippets

### 4.2 Font loading

Fonts should be self-hosted where possible.

Do not add Google Fonts dependencies for the public landing page or authenticated application.

Do not use Montserrat or Roboto in Cyoda Cloud surfaces.

### 4.3 Type scale

Recommended website and app scale:

| Use | Size | Weight | Notes |
| --- | ---: | ---: | --- |
| Hero H1 | 48 to 64 px | 600 to 700 | Use sparingly, public landing only |
| Page H1 | 36 to 48 px | 600 to 700 | Workbench/dashboard |
| Section H2 | 24 to 32 px | 600 | Short and direct |
| Card title | 16 to 18 px | 600 | Product labels |
| Body | 15 to 17 px | 400 | Use comfortable line height |
| Small/meta | 12 to 13 px | 500 | Mono when technical |
| Button | 14 to 15 px | 600 | Avoid all-caps except small labels |
| Code/meta mono | 12 to 14 px | 400 to 500 | JetBrains Mono |

### 4.4 Line height

Use generous line height for readability:

- Body: 1.55 to 1.7
- Small/meta: 1.4 to 1.5
- Headings: 1.05 to 1.2
- Chat messages: 1.55 to 1.65

## 5. Colour system

### 5.1 Core palette

| Token | Hex | Use |
| --- | --- | --- |
| `--cy-bg` | `#FFFFFF` | Primary page background |
| `--cy-bg-soft` | `#F8FAFC` | App shell, section background |
| `--cy-bg-muted` | `#F1F5F9` | Subtle panel backgrounds |
| `--cy-border` | `#E2E8F0` | Default border |
| `--cy-border-strong` | `#CBD5E1` | Stronger panel border |
| `--cy-text` | `#0F172A` | Primary text |
| `--cy-text-secondary` | `#334155` | Body text and secondary labels |
| `--cy-text-muted` | `#64748B` | Muted text |
| `--cy-text-faint` | `#94A3B8` | Decorative metadata only |
| `--cy-blue` | `#2563EB` | Primary action, active state |
| `--cy-blue-hover` | `#1D4ED8` | Primary action hover |
| `--cy-blue-soft` | `#EFF6FF` | Active background |
| `--cy-teal` | `#0D9488` | Cyoda accent, use sparingly |
| `--cy-teal-soft` | `#CCFBF1` | Soft brand accent surface |
| `--cy-green` | `#059669` | Success/state ok |
| `--cy-orange` | `#D97706` | Warning/exception state |
| `--cy-red` | `#DC2626` | Error/destructive |

### 5.2 Colour rules

Use blue for primary CTAs and active states.

Use Cyoda teal as a brand accent, not as a neon UI wash.

Use orange only for warning or exception states.

Use green only for success or terminal/settled states.

Do not use pink or purple as core brand colours.

Do not use dark navy as the default authenticated application background.

### 5.3 Light mode requirement

Cyoda Cloud should be light-first across:

- public landing page
- authenticated workbench dashboard
- header and navigation
- history panel
- cloud/environments panel
- tasks panel
- chat workspace
- prompt input

Embedded code editors or technical code blocks may remain dark only when doing so improves readability and does not dominate the app shell.

### 5.4 Contrast rules

Primary text must be `#0F172A` or equivalent.

Body text should be `#334155` or `#475569`.

Avoid using `text-slate-300`, `text-slate-400`, or opacity-based text for readable UI copy on light backgrounds.

Low-opacity styles are acceptable only for decorative SVGs and disabled controls that are genuinely disabled.

## 6. Layout system

### 6.1 Public landing page

The landing page should use normal document scrolling.

Structure:

1. Header/navigation
2. Hero with copy, CTAs, and product/workflow visual
3. Free beta or getting-started section
4. How it works or workflow explanation
5. What Cyoda Cloud is
6. AI assistant as feature
7. Run it yourself / Cyoda Cloud / Enterprise Cyoda
8. Free beta expectations
9. Security/data FAQ
10. General FAQ
11. Final CTA
12. Footer

### 6.2 Authenticated app shell

The authenticated application is a workbench, not a marketing page.

Preserve the existing functional shell:

- top navigation
- History
- Canvas
- Cloud
- Tasks
- user controls
- notifications
- chat input
- panels
- Canvas tabs

Move the shell to light surfaces:

- app background: `#F8FAFC`
- panel background: `#FFFFFF`
- panel border: `#E2E8F0`
- panel split lines: `#CBD5E1` only where extra contrast is needed

### 6.3 Panels

History, Cloud, Tasks, and Canvas panel containers should share a common treatment:

- white or slate-50 background
- 1 px slate-200 border
- readable slate text
- clear panel header
- compact icon controls
- no glassmorphism
- no neon glow
- no dark panel by default

Do not change panel state, data fetching, resize behaviour, or core logic while restyling.

### 6.4 Chat workspace

The chat workspace should be light and utilitarian.

Recommended treatment:

- chat background: `#F8FAFC`
- assistant message: white card, slate border, slate text
- user message: blue background with white text, or blue-50 card with slate text if the layout requires lower emphasis
- prompt input: white background, slate border, slate text, visible placeholder
- loading state: light card with “Assistant is thinking...”
- assistant label: “Cyoda assistant” or “Assistant”, not “CYODA AI”

## 7. Components

### 7.1 Header

The header should look like part of the Cyoda web estate.

Use:

- white background
- bottom border `#E2E8F0`
- Cyoda wordmark plus “Cloud” label if needed
- subtle BETA pill
- nav items in slate-700
- active state in blue-50 / blue-700 / blue-200 border
- icon-only controls with accessible labels

Keep feature labels:

- History
- Canvas
- Cloud
- Tasks

These are functional affordances and should not be renamed in this pass.

### 7.2 Buttons

Primary button:

```css
background: #2563EB;
color: #FFFFFF;
border: 1px solid #2563EB;
```

Hover:

```css
background: #1D4ED8;
border-color: #1D4ED8;
```

Secondary button:

```css
background: #FFFFFF;
color: #0F172A;
border: 1px solid #CBD5E1;
```

Subtle/ghost button:

```css
background: transparent;
color: #334155;
```

Rules:

- Primary CTA text must always be white on blue.
- Icons inside primary buttons must be white.
- Do not use dark text on dark blue.
- Do not use disabled-looking grey for active links.
- Use `type="button"` for buttons not submitting forms.

### 7.3 Cards

Default card:

```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 12px;
box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
```

Cards should be calm and functional. Avoid excessive shadows, gradients, or hover movement.

### 7.4 Tabs

Tabs should be clear, not decorative.

Default:

- slate-600 text
- transparent or white background
- slate-200 border if contained

Active:

- blue-50 background
- blue-700 text
- blue-200 border

Use for:

- Requirements
- Entities
- Workflows
- Code

Do not modify tab logic.

### 7.5 Inputs

Input fields:

- background: white
- border: slate-300
- text: slate-900
- placeholder: slate-400
- focus ring: blue-600, 2 px, offset 2

Prompt input should feel like a technical command surface, not a consumer chatbot box.

### 7.6 FAQ accordion

Questions:

- text: slate-900
- weight: 600

Answers:

- text: slate-700
- line-height: 1.6 to 1.7

Chevron:

- slate-500

Avoid faint text. FAQ content must never look disabled.

### 7.7 Empty states

Empty states should be practical and precise.

Use:

- icon in slate-400 or blue-500
- title in slate-900
- body in slate-600
- optional CTA

Example:

> No environments found  
> Ask the assistant to deploy a Cyoda environment, or connect an existing one.

Avoid cute illustrations or gamified language.

## 8. Imagery and graphics

### 8.1 Preferred graphic style

Use:

- abstract architectural SVGs
- fine grid lines
- runtime boundaries
- event flow lines
- trace/history tick marks
- workflow editor rendered by real component where possible
- light backgrounds
- low-opacity technical detail

### 8.2 Hero background

The Cyoda Cloud hero background should be an abstract infrastructure field behind real UI or real product components.

It should communicate:

- hosted runtime
- API connectivity
- event flow
- traceable history
- runtime/workflow architecture

It should not fake the product UI if the real workflow editor is available.

### 8.3 Icons

Use `lucide-react` style icons:

- outline
- 1.75 to 2 px stroke
- rounded caps/joins
- simple, technical, consistent

Do not use mixed icon packs unless already unavoidable.

### 8.4 Asset restrictions

Do not introduce:

- Freepik or stock imagery
- Streamline/Webalys assets unless licence is confirmed
- cartoon avatars
- person photos
- mascot imagery
- animated GIF logos
- autoplay video
- Lottie animations
- particle effects

## 9. Motion

Default: no decorative motion.

Allowed:

- immediate hover colour changes
- subtle focus states
- necessary loading spinner
- panel opening/closing where already part of product behaviour

Avoid:

- shimmer
- pulse
- bounce
- animated gradients
- scroll reveal
- confetti
- floating particles
- animated logos

All motion must respect `prefers-reduced-motion`.

## 10. Copy and voice

### 10.1 Tone

Use:

- concise
- technical
- direct
- credible
- developer-first
- plain English

### 10.2 Messaging rules

Emphasise:

- Cyoda is the product
- EDBMS / workflow-driven backend architecture
- entity lifecycle
- transactional workflows
- temporal history
- auditability
- AI fidelity through explicit architecture
- one model, one API surface, one growth path

Avoid:

- generic AI buzzwords
- hype
- vague claims
- “full Cyoda” language
- implying open-source Cyoda is a cut-down version
- “revolutionary”
- “cutting-edge”
- “seamless”
- “transformative”
- “game-changing”
- “leverage”
- “robust” when used as filler
- exclamation marks

### 10.3 Approved phrases

Use where appropriate:

- Hosted Cyoda runtime
- Cyoda Cloud Workbench
- Model entity lifecycles
- Generate workflows
- Connect processors
- Inspect history
- State, workflow, transactions, and history
- Start local. Iterate with AI. Scale without re-engineering.
- One model, one API surface, one growth path.
- Build scalable backend services on an integrated architecture.

### 10.4 Prompt examples

Approved examples for authenticated workbench:

- Model a trade settlement lifecycle
- Create a KYC onboarding workflow
- Add an entity with lifecycle states
- Connect a Java processor
- Explain this workflow
- Generate a Python service stub

### 10.5 Labels

Use:

- Cyoda Cloud
- Cyoda assistant
- Assistant
- History
- Canvas
- Cloud
- Tasks
- Requirements
- Entities
- Workflows
- Code

Avoid:

- Cyoda AI Studio
- CYODA AI as primary identity
- Build with Cyoda AI
- Canvas AI
- Anyone who has a problem to solve

## 11. Public landing page guidance

### 11.1 Header navigation

Use:

- Docs: `https://docs.cyoda.net/`
- GitHub: `https://github.com/Cyoda-platform/cyoda-go`
- Open Source: `https://cyoda.org/`
- Enterprise: `https://cyoda.com/`
- Sign in
- Try Cyoda Cloud, free

### 11.2 Hero

Preferred hero message:

> Host Cyoda for free while you build event-driven, stateful systems with history.

Supporting copy:

> Cyoda Cloud is the hosted Cyoda runtime for developers building entity workflows, lifecycle transitions, event-driven processing, and traceable state history. It is free to try in live beta, with best-efforts support and no production SLA.

CTA:

- Try Cyoda Cloud, free
- Run Cyoda yourself

### 11.3 Footer

Include:

- © 2026 Cyoda. All rights reserved.
- Cookie Preferences
- Cookie Policy
- Privacy Policy
- Terms of Service

Footer should use white or slate-50 background, slate text, and clear link contrast.

## 12. Authenticated workbench guidance

### 12.1 Default `/home`

The default authenticated page should be a dashboard/product start page.

Use title:

> Cyoda Cloud Workbench

Subtitle:

> Model entity lifecycles, generate workflows, connect processors, and inspect history on hosted Cyoda.

Supporting copy:

> Use the assistant to draft models and services, then refine them in Canvas with Requirements, Entities, Workflows, and Code.

### 12.2 Shell behaviour

Preserve:

- History
- Canvas
- Cloud
- Tasks
- user avatar/menu
- notifications
- docs/GitHub/social links where present
- repository selector
- Pull button
- prompt input
- chat history
- Canvas tabs

Restyle only. Do not rewrite logic.

### 12.3 Chat mode

Chat mode must not remain dark after the rebrand.

Target:

- light shell
- light message area
- white assistant bubbles
- readable user bubbles
- light prompt input
- assistant label changed from `CYODA AI` to `Cyoda assistant` or `Assistant`
- loading text: `Assistant is thinking...`

### 12.4 Canvas and workflow editor

The current workflow editor should remain functional.

Do not touch internals until the dedicated `cyoda_workflow_editor` phase.

Acceptable in this style phase:

- shell/panel borders
- tab styling
- surrounding background
- header labels

Avoid:

- changing workflow graph logic
- changing node layout
- changing React Flow behaviour
- changing Monaco integration
- changing state/store contracts

## 13. Engineering guardrails

### 13.1 Safe areas to change

Usually safe:

- `HomeView.tsx` copy and layout
- `Header.tsx` visual styling
- `NewChat.tsx` copy and visual styling
- `i18n/en.json` labels
- panel wrapper styling
- empty-state styling
- button classes
- prompt example copy
- visible branding strings

### 13.2 Medium-risk areas

Proceed carefully:

- `ChatBotView.tsx` wrapper surfaces
- resizable panel layout classes
- scroll containers
- modal styling
- markdown/prose styling
- panel widths
- Ant Design theme overrides

### 13.3 High-risk areas

Do not edit during visual rebrand:

- `WorkflowCanvas/*`
- `PortalCanvas/*`
- API clients
- services
- stores
- Auth0 token management
- streaming logic
- resize handle logic
- repository/GitOps logic
- drag/drop/editor canvas logic
- desktop and desktop workflow apps

### 13.4 Redirect and auth behaviour

Logged-out `/` should show the public landing page.

Logged-in `/` should redirect to `/home`.

Auth0 callback should show a neutral loading state, not flash the public landing page.

Generic sign-in and try-free CTAs should return to `/home`.

Meaningful deep links should be preserved.

## 14. Accessibility

Requirements:

- semantic HTML where practical
- visible focus states
- keyboard-accessible nav, tabs, accordions, and cards
- accessible names for icon-only buttons
- adequate colour contrast
- no text hidden by low opacity
- no animation required for comprehension
- reduced-motion support
- readable chat and FAQ text

## 15. SEO and metadata

Public site metadata should use:

Title:

> Cyoda Cloud — hosted Cyoda runtime

Description:

> Cyoda Cloud is the hosted Cyoda runtime for developers building event-driven, stateful systems with lifecycle workflows and traceable history. Free to try in live beta.

Open Graph and Twitter cards should match the same language.

Create or maintain:

- `robots.txt`
- `sitemap.xml`
- `llms.txt`
- `og-card.png`

Do not claim:

- SLA
- guaranteed uptime
- guaranteed backups
- guaranteed retention
- ISO certification for Cyoda
- unsupported performance claims

## 16. Implementation checklists

### 16.1 Visual review checklist

Before merging, verify:

- public landing page is light and aligned
- authenticated `/home` is light and aligned
- chat mode is light and aligned
- History panel is light
- Cloud panel is light
- Tasks panel is light or at least not legacy dark
- no primary text is too faint
- no primary CTA has dark text on blue
- no obvious neon/glow/gamified surfaces remain
- no cartoon/person carousel remains
- no `Cyoda AI Studio` visible to users

### 16.2 Functional review checklist

Verify:

- login works
- logout works
- `/` logged-out shows landing page
- `/` logged-in redirects to `/home`
- `/home` loads
- `/chat/:technicalId` loads
- `/new-chat` loads
- `/workflows` loads
- History toggles
- Canvas toggles
- Cloud toggles
- Tasks toggles
- prompt submit works
- streaming response works
- file attachment still works where available
- repository selector still works
- Pull button still works
- Requirements tab still works
- Entities tab still works
- Workflows tab still works
- Code tab still works

### 16.3 Build/test checklist

Run from `packages/web`:

```bash
corepack yarn build
corepack yarn type-check
corepack yarn lint
corepack yarn test:run
```

If typecheck, lint, or tests fail due existing repo-wide issues, document them clearly and separate them from rebrand changes.

## 17. Do and do not summary

### Do

- Use Cyoda Cloud as the hosted app identity.
- Use light-mode workbench styling.
- Use Inter and JetBrains Mono.
- Use slate/blue with restrained Cyoda teal.
- Preserve History / Canvas / Cloud / Tasks.
- Preserve workflow editor internals.
- Make chat mode light.
- Keep the assistant as a feature label.
- Make copy direct and technical.
- Keep the UI calm.

### Do not

- Reintroduce Cyoda AI Studio.
- Use cartoon/person/mascot imagery.
- Use neon/glow/gamified styling.
- Make AI the product identity.
- Break authenticated app functionality.
- Touch workflow editor internals.
- Touch services or stores for visual changes.
- Use Montserrat or Roboto.
- Add Google Fonts.
- Add hype copy.
- Claim SLA, uptime, backups, or certifications that are not explicitly approved.

## 18. Source references

This guide is based on the following source materials provided during the Cyoda Cloud redesign work:

1. `Cyoda_AI_Context_Updated_2026-04-17.json`: product positioning, website/domain split, consumption modes, messaging principles, technical core, copy guidance, and proof-point constraints.
2. `UI_AUDIT.md`: current authenticated UI architecture, route map, old UI issues, visual system audit, functional inventory to preserve, and recommended redesign direction.
3. `change_specs-implementation-plan.md`: previous implementation guidance for public landing page metadata, fonts, navigation, SEO, and visual system.
4. `Cyoda Cloud Hero v2.html`: hero background and visual-direction experiment for abstract infrastructure-field styling.
5. Current screenshots from the redesign process: public landing page, old authenticated UI, new workbench view, and remaining dark chat-mode issue.

