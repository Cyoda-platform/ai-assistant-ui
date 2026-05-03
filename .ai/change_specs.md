Below is a Codex-ready technical specification for changing the current ai-assistant-ui / packages/web application into the Cyoda Cloud website/product entry point at https://cyoda.net/.

It is written as something you can paste directly into Codex.

⸻

Technical Specification: Rebuild ai-assistant-ui as the Cyoda Cloud Website

0. Instruction to Codex

You are working on the current ai-assistant-ui monorepo. The goal is to rebrand and rebuild the public web surface as Cyoda Cloud.

This is a website/product-entry rebuild, not a workflow editor rebuild.

Do not touch the current workflow editor implementation in this iteration. A later phase will add/replace/extend workflow editing using cyoda_workflow_editor. For this phase, treat all existing workflow editor code as out of scope unless a branding string is visible in shared chrome and can be changed without altering workflow editor behaviour.

The target deployment URL is:

https://cyoda.net/

The current project/package is still referred to as ai-assistant-ui, but the product name and public-facing documentation should become:

Cyoda Cloud

The repo should be described as the:

Cyoda Cloud UI monorepo

Relevant repo facts from the audit:

* Monorepo using Yarn workspaces.
* packages/web is the React/Vite/Tailwind web application and serves the current web UI.
* packages/desktop and packages/desktop-workflow exist, but desktop changes are out of scope unless shared assets are affected.
* The unauthenticated landing page and product interface currently share the same React app.
* The root route / renders HomeView.tsx.
* Auth is handled through Auth0, not internal login/signup routes.
* Existing routes include /, /new-chat, /chat/:technicalId, /canvas-demo, and /workflows.
* Guest access is currently allowed for / and /chat/:technicalId.
* Deep-link preservation uses LOGIN_REDIRECT_URL in localStorage.
* packages/web currently uses Roboto via Google Fonts.
* Dark mode is currently forced through index.html, App.tsx, and CSS variables.
* Monaco/editor code is currently loaded too early through synchronous imports.
* Current web metadata is incomplete or wrong.
* site.webmanifest contains placeholder names such as MyWebSite / MySite.
* Current product copy includes Cyoda AI Assistant and Solve.Build. Deploy.
* Existing workflow editor code lives in/around packages/web/src/components/WorkflowCanvas/ and must not be changed in this phase.  ￼

⸻

1. Product Direction

1.1 Public product name

Use:

Cyoda Cloud

Do not use the following as the public product name:

Cyoda AI Assistant
Cyoda AI Studio
AI Studio
AI Cyoda

1.2 Repo/documentation name

The repo should be described in README/docs as:

Cyoda Cloud UI monorepo

The previous wording “Cyoda AI Assistant UI” should be replaced in public-facing documentation unless it is clearly describing an internal legacy package or feature.

1.3 Product positioning

Cyoda Cloud is:

* a hosted Cyoda runtime
* a free-to-try developer environment
* a live beta
* suitable for developers trying Cyoda for the first time
* useful for prototypes, PoCs, and early development
* not currently a production SLA-backed service
* a path into self-hosted Cyoda and Enterprise Cyoda

The site should lead with:

Hosted Cyoda runtime

The AI assistant is a feature/differentiator, not the product name.

1.4 Primary audience

Prioritise:

Developers trying Cyoda for the first time.

Secondary audiences:

* CTOs/founding engineers evaluating Cyoda
* startup founders looking for institutional-grade backend infrastructure
* existing users logging in
* enterprise buyers comparing Cyoda Cloud with Enterprise Cyoda
* AI/agentic builders who need deterministic backend rails

⸻

2. Hard Scope Boundaries

2.1 In scope

This phase includes:

* public landing page rebuild
* product naming and branding update
* metadata, manifest, favicons/OG/social metadata where available
* font system update
* light-default visual system
* removal of forced dark mode
* removal of animated GIF loader/branding
* public navigation and footer
* CTA structure
* FAQ content
* basic free-tier / beta / no-SLA messaging
* AI assistant positioning as a feature
* README update to describe the repo as Cyoda Cloud UI monorepo
* release note / migration note if release docs exist
* email/template branding only if templates exist and are safely identifiable
* analytics preservation if Google Analytics is already present
* redirect or route compatibility for old public routes where practical

2.2 Explicitly out of scope

Do not implement or refactor:

* cyoda_workflow_editor
* new workflow editor integration
* current workflow editor architecture
* WorkflowCanvas logic
* PortalCanvas logic
* entity/workflow state management logic
* API service logic
* Auth0 integration logic, except CTA labels/routes if necessary
* environment creation logic
* AI assistant model behaviour
* backend/API changes
* paid-tier billing
* SLA support
* desktop app rebrand
* desktop app icons
* desktop app package names
* Electron-specific UI

Do not touch these areas except for safe, superficial public branding strings if they appear in shared chrome:

packages/web/src/components/WorkflowCanvas/
packages/web/src/components/PortalCanvas/
packages/web/src/services/apiService.ts
packages/web/src/stores/
packages/desktop/
packages/desktop-workflow/

The user explicitly wants cyoda_workflow_editor added in a later phase, so do not “improve”, replace, or prepare the current workflow editor now.

⸻

3. Target Information Architecture

The public page at / should become the Cyoda Cloud landing/product-entry page.

3.1 Top navigation

Desktop nav should include:

Docs
GitHub
Open Source
Enterprise
Sign in
Try Cyoda Cloud, free

Recommended targets:

Docs: https://docs.cyoda.net/
GitHub: https://github.com/Cyoda-platform/cyoda-go
Open Source: https://cyoda.org/
Enterprise: https://cyoda.com/
Logo/Home: https://cyoda.net/ or /

The logo label should be:

Cyoda Cloud

Existing authenticated users may see a different product nav after login, but public marketing navigation should remain clear and simple.

3.2 Public page sections

Implement the public page in this order:

1. Header / navigation
2. Hero
3. First developer path / “Start with the free beta”
4. Product visual section using a clean trade-settlement workflow
5. What Cyoda Cloud is
6. AI assistant section
7. Three ways to use Cyoda
8. Free beta / limits / expectations
9. Security and data FAQ
10. General FAQ
11. Final CTA
12. Footer

Do not create a full comparison table. The user explicitly does not want a comparison table.

⸻

4. Public Copy Direction

4.1 Tone

Use a restrained, technical, developer-first voice.

Avoid:

seamlessly
leverage
robust
cutting-edge
streamline
transformative
game-changing
the kicker
let's
imagine
Solve.Build. Deploy
Solve. Build. Deploy.

Avoid exclamation marks.

Do not overpromise production readiness, uptime, compliance, backups, or support.

4.2 Hero direction

The user disliked previous hero options. The direction should emphasise:

* host Cyoda for free / free to try
* event-driven systems
* stateful systems
* history / auditability
* hosted runtime

Use this hero as the recommended starting point:

H1:
Host Cyoda for free while you build event-driven, stateful systems with history.
Subhead:
Cyoda Cloud is the hosted Cyoda runtime for developers building entity workflows, lifecycle transitions, event-driven processing, and traceable state history. It is free to try in live beta, with best-efforts support and no production SLA.
Primary CTA:
Try Cyoda Cloud, free
Secondary CTA:
Run Cyoda yourself

Alternative shorter H1 if layout needs less width:

Hosted Cyoda for event-driven, stateful systems with history.

4.3 Product description

Use language like:

Cyoda Cloud gives you a managed Cyoda environment without installing the runtime or operating a cluster. Define entity models, enforce lifecycle transitions, connect external compute, and inspect state history from the hosted UI and APIs.

4.4 AI assistant positioning

The AI assistant should be described as a feature of Cyoda Cloud.

Use wording like:

The built-in AI assistant helps you draft entity models, generate workflow JSON, edit existing workflows, explain invalid transitions, and work with Java or Python service patterns. The assistant accelerates modelling, but Cyoda remains the deterministic runtime that enforces valid state transitions and records history.

Do not claim:

* the assistant replaces developers
* the assistant automatically imports generated workflows unless the current app supports it
* the assistant can fully build production systems
* the assistant runs without using Cyoda-hosted AI resources
* the assistant supports languages beyond current support

Current confirmed AI assistant capabilities:

* can generate workflow JSON
* can generate entity models
* can edit existing workflows
* can explain invalid transitions
* can generate processors/services
* can run tests
* currently supports Python and Java
* direct import of generated workflows is not currently supported, but desired later  ￼

4.5 Customer proof

Do not mention:

VC Trade
Tobias Zoller
customer quote
production use since 2017 in relation to VC Trade

Customer proof is reserved for the Enterprise site.

The Cloud page may say, carefully:

Cyoda is proven in regulated markets and has been live since 2017.

Do not make claims about:

* 100% uptime
* no production bugs
* transaction volumes
* no bottlenecks
* ISO certification
* security compliance certification

4.6 Beta / free-tier wording

Use:

free to try
live beta
best-efforts support
no production SLA
not intended for production workloads

Avoid:

production-ready Cloud
SLA-backed
guaranteed uptime
backed up
enterprise-grade security compliance

Confirmed status:

* Free tier exists.
* Free tier is self-serve.
* Paid self-service tier does not exist yet.
* Cyoda Cloud is live beta.
* Cyoda Cloud is not production-ready today.
* No SLA.
* Support is best-efforts.
* Free tier is not for production use.
* Users agree to terms stating there are no service guarantees.  ￼

⸻

5. Free Tier and Entitlements Content

The public page should include a simple “Free to try” section and FAQ.

Use the documentation-backed entitlement limits where appropriate.

From the Cyoda Cloud identity/entitlements documentation, the Free tier includes:

* status: Available
* model fields per model: 150
* cumulative model fields: 300
* models: 20
* client nodes: 1
* payload size: 5 MB
* disk usage: 2 GB
* API requests: 300/min
* external calls: 300/min
* free tier environments are automatically reset after an expiry period
* authoritative details are available through the Cyoda Cloud API endpoints /account and /account/subscriptions  ￼

Do not over-emphasise limits in the hero. Put this in FAQ or a compact “Free beta expectations” section.

Suggested copy:

Cyoda Cloud is free to try during live beta. The free tier is intended for evaluation, prototyping, and developer testing. It is not a production service and does not include an SLA, guaranteed retention, or guaranteed backups.

FAQ answer:

The free tier is available for developer evaluation and prototyping. Current reference limits include 20 models, 150 fields per model, 300 cumulative fields, one client node, 5 MB payloads, 2 GB disk usage, 300 API requests per minute, and 300 external calls per minute. Your account’s current limits are authoritative in the Cyoda Cloud API.

⸻

6. Security, Data, and Hosting Messaging

6.1 Confirmed public facts

Use only these facts:

* hosted in Finland
* hosted in Hetzner Finland ISO data centre
* data encrypted in transit
* hard drives encrypted at rest
* customer data is not used to train AI models
* environments are isolated per customer
* Cyoda staff can access user environments under restricted, logged, monitored break-glass access
* free tier has no backups guarantee
* free tier has no retention guarantee
* no public security contact email currently
* Cyoda itself is not currently ISO-certified
* no guarantees of uptime on the free tier
* best-efforts support only  ￼

6.2 Required FAQ entries

Add FAQ entries for:

1. Is Cyoda Cloud production-ready?
2. Is Cyoda Cloud free?
3. What are the free tier limits?
4. Is the free tier backed up?
5. Where is Cyoda Cloud hosted?
6. Is data encrypted?
7. Is my data used to train AI models?
8. Can Cyoda staff access my environment?
9. How does Cyoda Cloud authentication work?
10. Can I move from Cyoda Cloud to self-hosted or Enterprise Cyoda?
11. What is the difference between Cyoda Cloud, open-source Cyoda, and Enterprise Cyoda?
12. What does the AI assistant do?
13. Does the AI assistant replace the runtime?
14. Which languages are supported?

6.3 Suggested security FAQ wording

Where is Cyoda Cloud hosted?
Cyoda Cloud is hosted in Finland in a Hetzner ISO-certified data centre.
Is my data encrypted?
Data is encrypted in transit. Storage is protected with encrypted hard drives. The free beta does not provide a production SLA or guaranteed backup/retention commitments.
Is my data used to train AI models?
No. Customer data submitted to Cyoda Cloud is not used to train AI models.
Can Cyoda staff access my environment?
Access is restricted, logged, and monitored. Break-glass access may be used for operational support where required.
Is Cyoda Cloud production-ready?
No. Cyoda Cloud is currently a live beta and free to try. It is intended for development, evaluation, and prototyping, not production workloads requiring uptime guarantees, backups, or SLA-backed support.

⸻

7. Identity and Authentication Content

The docs confirm that Cyoda Cloud authenticates users and technical clients via JWT access tokens, with tokens issued either by Cyoda-managed asymmetric signing keys or by trusted external OIDC providers. Access is bounded by subscription tier and entitlements.  ￼

Add a short FAQ answer:

Cyoda Cloud uses JWT-based authentication. Users and technical clients can authenticate through Cyoda-managed identity flows or trusted OIDC providers, depending on the environment. Access to platform features is bounded by the account subscription tier and entitlements.

Do not add a long identity technical section to the landing page. Link to:

https://docs.cyoda.net/cyoda-cloud/identity-and-entitlements/

⸻

8. Visual Design System

8.1 Font system

Replace current Roboto / Google Fonts usage.

Target font system must match the other Cyoda websites:

Inter for UI and prose
JetBrains Mono for code

Requirements:

* Remove Roboto Google Fonts import.
* Remove all fonts.googleapis.com and fonts.gstatic.com requests for the public page.
* Do not add Montserrat.
* Use self-hosted font files if available in this repo or add them under an appropriate public/assets font directory.
* Update CSS variables and/or Tailwind font family config.
* Monaco/editor font stack may remain separate and should not be changed unless required for visible consistency outside editor internals.
* Update global HTML/body font-family from Roboto to Inter.
* Use JetBrains Mono for code blocks, inline code, technical labels, and any terminal-style snippets.

Known current files from audit:

packages/web/src/assets/css/particular/_fonts.scss
packages/web/src/assets/css/particular/_common.scss
packages/web/src/styles/tailwind.css

8.2 Theme

Target:

* light theme by default
* do not force dark mode
* do not write app:theme = dark on every load
* respect user/system preference where theme support exists
* authenticated product may retain dark support, but public landing page must render correctly fresh on light

Required changes:

* Remove forced dark script from packages/web/index.html.
* Remove forced theme useEffect from packages/web/src/App.tsx if present.
* Stop forcing dark variables globally.
* Ensure a fresh browser profile with empty localStorage renders public page in light theme.
* Keep app:theme behaviour only if it respects explicit user choice and does not force dark.

8.3 Colours

Align with the Cyoda website family:

Primary blue: #2563eb
Text primary: slate-900 / #0f172a
Text secondary: slate-600 / #475569
Text tertiary: slate-400 / #94a3b8
Border: slate-200 / #e2e8f0
Section background: white and slate-50 / #f8fafc or #f1f5f9
Code background: white/light neutral

Avoid:

* purple-heavy AI-studio look
* dark-only surfaces
* animated gradients
* high-saturation playful visuals
* cartoon/gamified styling

8.4 Motion

Remove or disable:

* logo.gif
* logo-dark.gif
* animated loader logo
* animate-fade-in-up on initial page paint
* animate-shimmer on buttons
* unnecessary mount animations
* hero animation
* animated gradients
* hover bounce effects

All remaining motion must respect:

prefers-reduced-motion: reduce

Known current animations from audit:

fadeInUp
shimmer
gentlePulse

8.5 Icons and assets

Use:

* Lucide-style outline icons already available via lucide-react
* simple first-party SVGs
* static logo/wordmark

Avoid:

* Freepik marketing images on the public landing page unless licence is confirmed
* Streamline/Webalys icons for new public UI unless licence is confirmed
* external image URLs
* animated GIFs

If Freepik/Webalys assets are removed, update README licence notes if appropriate.

⸻

9. Public Product Visual

The hero or product visual should show a clean, interesting workflow.

Use:

trade settlement workflow

Do not use customer-specific names or VC Trade proof.

If real screenshots are not available, build a static product-style visual using existing UI components or a lightweight static SVG/card. Do not import or modify WorkflowCanvas internals.

The visual should communicate:

* entity lifecycle
* states
* transitions
* history/audit trail
* hosted runtime

Avoid autoplay video. No click-to-play demo video in this phase.

⸻

10. Three Ways to Use Cyoda

Add a section with three cards, not a comparison table.

Use exactly these labels:

Run it yourself
Cyoda Cloud
Enterprise Cyoda

Card guidance:

Run it yourself

Copy direction:

Use the open-source Cyoda runtime locally or in your own environment.

Links:

https://cyoda.org/
https://github.com/Cyoda-platform/cyoda-go

Mention Apache 2.0 only if already confirmed in copy/docs.

Cyoda Cloud

Copy direction:

Use the hosted Cyoda runtime in live beta. Free to try for development, evaluation, and prototyping.

CTA:

Try Cyoda Cloud, free

Enterprise Cyoda

Copy direction:

Use Cyoda with enterprise deployment, support, and production architecture options, including self-hosted, dedicated cloud, and supported on-premise deployments.

Link:

https://cyoda.com/

Mention:

Enterprise Cyoda is horizontally scalable and highly available.

Do not imply the free Cloud tier has Enterprise availability.

Confirmed:

* Users can move the same workflow/model between all three.
* API is the same across all three.
* Open-source version is Apache 2.0.
* Enterprise can mean self-hosted, dedicated cloud, supported on-premise, or all of those.  ￼

⸻

11. CTA Behaviour

11.1 Primary public CTA

Use:

Try Cyoda Cloud, free

This should trigger the current Auth0 signup/login flow if that is the existing path to create/use a free account.

If the app cannot distinguish signup from login, use the existing Auth0 flow but label clearly.

11.2 Secondary CTAs

Use:

Sign in
Run Cyoda yourself
Read the docs
Enterprise Cyoda

11.3 Existing users

If authenticated state is available:

* public nav may replace “Try Cyoda Cloud, free” with “Open Cyoda Cloud”
* do not break existing authenticated redirect/deep link logic
* preserve LOGIN_REDIRECT_URL behaviour

⸻

12. SEO, Metadata, and Machine-Readable Files

Current audit found:

* title: Cyoda AI Assistant
* missing meta description
* missing Open Graph tags
* missing Twitter card tags
* missing canonical URL
* missing robots.txt
* missing sitemap.xml
* missing llms.txt  ￼

12.1 HTML title

Use:

Cyoda Cloud — hosted Cyoda runtime

12.2 Meta description

Use:

Cyoda Cloud is the hosted Cyoda runtime for developers building event-driven, stateful systems with lifecycle workflows and traceable history. Free to try in live beta.

12.3 Open Graph

Add or update:

<meta property="og:title" content="Cyoda Cloud — hosted Cyoda runtime" />
<meta property="og:description" content="Build event-driven, stateful systems with lifecycle workflows and traceable history on hosted Cyoda. Free to try in live beta." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://cyoda.net/" />
<meta property="og:image" content="https://cyoda.net/og-card.png" />

If og-card.png does not exist, create a simple static image consistent with the new visual system or leave a clear TODO only if image generation is not practical.

12.4 Twitter card

Add:

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Cyoda Cloud — hosted Cyoda runtime" />
<meta name="twitter:description" content="Build event-driven, stateful systems with lifecycle workflows and traceable history on hosted Cyoda. Free to try in live beta." />
<meta name="twitter:image" content="https://cyoda.net/og-card.png" />

12.5 Canonical

Add:

<link rel="canonical" href="https://cyoda.net/" />

12.6 Manifest

Update packages/web/public/site.webmanifest.

Use:

{
"name": "Cyoda Cloud",
"short_name": "Cyoda",
"description": "Hosted Cyoda runtime for event-driven, stateful systems with traceable history.",
"start_url": "/",
"display": "standalone",
"theme_color": "#ffffff",
"background_color": "#ffffff"
}

Remove:

MyWebSite
MySite

12.7 Robots / sitemap / llms

If absent, add:

packages/web/public/robots.txt
packages/web/public/sitemap.xml
packages/web/public/llms.txt

Minimum robots.txt:

User-agent: *
Allow: /
Sitemap: https://cyoda.net/sitemap.xml

Minimum sitemap.xml:

<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cyoda.net/</loc>
  </url>
</urlset>

Minimum llms.txt:

# Cyoda Cloud
Cyoda Cloud is the hosted Cyoda runtime for developers building event-driven, stateful systems with lifecycle workflows and traceable history.
Cyoda Cloud is free to try in live beta. It is intended for development, evaluation, and prototyping and does not provide a production SLA on the free tier.
Key links:
- Docs: https://docs.cyoda.net/
- Open source: https://cyoda.org/
- GitHub: https://github.com/Cyoda-platform/cyoda-go
- Enterprise Cyoda: https://cyoda.com/

⸻

13. Routing and Redirects

Current routes include:

/
/new-chat
/chat/:technicalId
/canvas-demo
/workflows

Requirements:

* Preserve existing routes unless obsolete and confirmed safe.
* Do not break /chat/:technicalId.
* Do not break Auth0 login flow.
* Do not break LOGIN_REDIRECT_URL.
* Do not break /workflows.
* Do not modify workflow editor logic behind /workflows.

If there are old public routes or labels for AI Studio, redirect them where feasible to /.

If no old route exists, do not invent unnecessary routing.

⸻

14. Performance Requirements

Current audit found Monaco/editor code is likely loaded on the landing page because ChatBotCanvas is imported synchronously.  ￼

Requirements:

* Public landing page should not eagerly load Monaco/editor/workflow-heavy code unless required for visible content.
* Use route-level or component-level lazy loading where safe.
* Keep authenticated/product functionality intact.
* Do not refactor editor internals.
* Remove animated GIF loader.
* Remove Google Fonts request.
* Use self-hosted fonts.
* Avoid large background images.
* Use static SVGs or lightweight visuals.
* Ensure production build passes.

If lazy-loading Monaco/workflow/editor code is too risky in this phase, document the reason and leave it for a follow-up. Do not break product functionality to optimise bundle size.

⸻

15. Accessibility Requirements

Add or preserve:

* skip link as first interactive element
* semantic header, main, section, footer
* accessible nav
* visible focus states
* aria-label for icon-only buttons
* FAQ buttons with aria-expanded
* accessible mobile menu if present
* alt text / <title> / <desc> for workflow visual
* reduced-motion handling
* no keyboard trap introduced in marketing page

Known issues from audit:

* skip link missing
* many divs instead of semantic landmarks
* some icon buttons lack aria-label
* Monaco can be a keyboard trap  ￼

Do not attempt to solve Monaco keyboard behaviour in this phase unless it is trivial and isolated.

⸻

16. Google Analytics

The user confirmed Google Analytics is used.

Requirements:

* Preserve existing Google Analytics if already implemented.
* Do not add a new analytics provider.
* If analytics event tracking already exists, add events for:
    * try_cyoda_cloud_free_click
    * sign_in_click
    * docs_click
    * github_click
    * open_source_click
    * enterprise_click
* If there is no analytics event abstraction, do not build a large new analytics subsystem. Add a small safe helper only if simple.

⸻

17. README and Documentation Updates

Update the root README and/or relevant web README.

Current README describes:

Cyoda AI Assistant UI

Change public description to:

Cyoda Cloud UI monorepo

Keep the package table but update descriptions:

packages/web: React web application for Cyoda Cloud.
packages/desktop: Electron desktop application. Out of scope for this rebrand unless actively maintained.
packages/desktop-workflow: Electron workflow editor. Out of scope for this iteration.

Remove stale “Known Issues” if no longer relevant.

Do not add a large design system section.

Do not add a release checklist.

Do not add AI coding instructions.

If third-party assets are removed, update licence notes accordingly. If uncertain, keep licence notes and add a TODO comment in the implementation summary rather than deleting legal notices blindly.

⸻

18. Release Notes

If release notes or changelog files exist, add an entry:

Rebranded the public web app from Cyoda AI Assistant UI to Cyoda Cloud. Updated landing page, metadata, manifest, navigation, fonts, theme behaviour, and public copy for the hosted Cyoda runtime live beta.

Mention:

* public product name changed to Cyoda Cloud
* free-to-try live beta wording
* removal of forced dark mode
* replacement of animated logo
* metadata/manifest cleanup

Do not claim:

* production readiness
* paid plans
* SLA
* new workflow editor
* cyoda_workflow_editor integration

⸻

19. Email Templates

If email templates exist and are safely identifiable:

* Replace public product name with Cyoda Cloud.
* Remove Cyoda AI Studio.
* Keep Cyoda AI Assistant only where referring to the assistant feature.
* Do not change email delivery logic.
* Do not change auth logic.

If no templates are found, report that.

⸻

20. Implementation Plan

This is intended as one big-bang release, but implement internally in safe commits/steps.

Step 1: Audit and protect boundaries

Before editing, confirm paths for:

packages/web/index.html
packages/web/src/main.tsx
packages/web/src/App.tsx
packages/web/src/router/index.tsx
packages/web/src/views/HomeView.tsx
packages/web/src/components/Header/Header.tsx
packages/web/src/styles/tailwind.css
packages/web/src/assets/css/main.scss
packages/web/src/assets/css/particular/_fonts.scss
packages/web/src/assets/css/particular/_common.scss
packages/web/public/site.webmanifest

Confirm no edits will be made to:

packages/web/src/components/WorkflowCanvas/
packages/web/src/components/PortalCanvas/
packages/web/src/services/apiService.ts
packages/web/src/stores/
packages/desktop/
packages/desktop-workflow/

unless only safe branding strings in shared public UI are affected.

Step 2: Metadata and manifest

Update:

* title
* meta description
* OG tags
* Twitter tags
* canonical
* site.webmanifest
* apple mobile title
* placeholder strings

Remove:

MyWebSite
MySite
Solve.Build. Deploy
Cyoda AI Studio

Step 3: Fonts

* Remove Roboto Google Font import.
* Add Inter.
* Add JetBrains Mono.
* Update global body font.
* Update Tailwind font tokens if config exists.
* Ensure no Google Fonts network request is required for the public page.

Step 4: Theme

* Remove forced dark mode.
* Remove forced localStorage.setItem('app:theme', 'dark').
* Make public page light-default.
* Ensure dark mode is not broken if existing app relies on it.
* Do not create a complex new theme system.

Step 5: Motion and logo

* Remove GIF logo usage.
* Replace loader/topbar logo with static SVG/wordmark.
* Remove initial paint animations.
* Remove shimmer/bounce effects from public CTAs.
* Respect reduced motion.

Step 6: Rebuild HomeView.tsx

Rebuild the public landing content according to this spec.

Do not import heavy editor/workflow components into the public landing unless needed and lazy-loaded.

The page should include:

* hero
* trade-settlement workflow visual
* developer-first quick path
* what Cyoda Cloud is
* AI assistant section
* three ways to use Cyoda
* free beta expectations
* FAQ
* final CTA
* footer

Step 7: Header/nav

Update public header:

Cyoda Cloud
Docs
GitHub
Open Source
Enterprise
Sign in
Try Cyoda Cloud, free

Preserve authenticated header behaviour if present.

Do not break Auth0.

Step 8: FAQ and structured data

Add FAQ UI and FAQPage JSON-LD if straightforward.

FAQ must include free-tier, beta, hosting, data, AI assistant, and Cloud/Open Source/Enterprise relationship.

Step 9: README and release docs

Update README naming.

Update release notes/changelog if present.

Step 10: Build and validation

Run:

yarn
yarn build

If lint/typecheck/test scripts exist, run them too.

Report:

* commands run
* passing/failing status
* changed files
* any files intentionally not touched
* any follow-up work left for the cyoda_workflow_editor phase

⸻

21. Acceptance Criteria

The implementation is complete when all of the following are true.

21.1 Branding

* Public product name is Cyoda Cloud.
* README describes the repo as Cyoda Cloud UI monorepo.
* No public landing copy says Cyoda AI Studio.
* Cyoda AI Assistant appears only where referring to the assistant feature, if at all.
* No public copy uses Solve.Build. Deploy.

21.2 Workflow editor boundary

* No functional changes were made to WorkflowCanvas.
* No functional changes were made to /workflows.
* No cyoda_workflow_editor integration was attempted.
* Existing workflow editor route still builds and loads as before.

21.3 Metadata

* HTML title is:

Cyoda Cloud — hosted Cyoda runtime

* Meta description is present and matches this direction:

Cyoda Cloud is the hosted Cyoda runtime for developers building event-driven, stateful systems with lifecycle workflows and traceable history. Free to try in live beta.

* site.webmanifest says Cyoda Cloud / Cyoda.
* No MyWebSite or MySite strings remain in public metadata.

21.4 Fonts

* Public page uses Inter for UI/prose.
* Public page uses JetBrains Mono for code/technical snippets.
* Roboto Google Fonts import is removed.
* No Montserrat is added.
* No Google Fonts request is required for the public page.

21.5 Theme

* Fresh browser profile renders the public page in light theme.
* No inline script forces dark mode.
* No code writes app:theme = dark on every load.
* Public page is readable in light theme.
* Existing authenticated/product theme behaviour is not deliberately broken.

21.6 Motion

* No logo.gif or logo-dark.gif loads on the public page.
* No animation plays on initial page paint.
* CTAs do not use shimmer/bounce effects.
* Reduced motion is respected.

21.7 Content accuracy

* Page clearly says Cyoda Cloud is free to try in live beta.
* Page does not claim production readiness.
* Page does not claim SLA.
* Page does not claim backups or retention guarantees.
* Page does not claim Cyoda is ISO-certified.
* Page does not mention VC Trade or Tobias Zoller.
* Page links to Enterprise Cyoda for enterprise/proof path.
* Page links to open-source Cyoda and GitHub.

21.8 Security/data FAQ

FAQ includes:

* Finland hosting
* data encrypted in transit
* encrypted hard drives
* customer data not used for AI model training
* restricted/logged/monitored staff access
* no free-tier production SLA
* no guaranteed free-tier backups or retention

21.9 Routing/auth

* / loads the new Cyoda Cloud public entry page.
* Auth0 login still works.
* Existing deep-link preservation still works.
* /chat/:technicalId still works.
* /workflows still works.
* No product route is broken by landing-page changes.

21.10 Build

* yarn build passes.
* Lint/typecheck/test scripts pass if present.
* Codex reports any skipped tests or missing scripts.

⸻

22. Final Codex Output Required

At the end, return:

1. Summary of changes
2. Files changed
3. Files deliberately not touched
4. Build/test commands run
5. Results
6. Any remaining AI Studio / AI Assistant naming occurrences and why they remain
7. Any remaining Google Fonts / GIF / forced-dark references and why they remain
8. Any risks
9. Follow-up items for the future cyoda_workflow_editor phase

Do not claim the work is complete unless the build passes or you clearly state what failed.