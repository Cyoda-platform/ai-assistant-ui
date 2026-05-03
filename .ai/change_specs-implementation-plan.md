# Implementation Plan: Cyoda Cloud Rebrand

**Spec source:** `.ai/change_specs.md`
**Date:** 2026-05-01

---

## Context

The `packages/web` application is being rebranded from "Cyoda AI Studio" (AI-chat-first positioning) to "Cyoda Cloud" (hosted Cyoda runtime, developer-first positioning). The spec covers: branding, landing page rebuild, font system update, light theme default, SEO metadata, FAQ content, analytics events, and documentation. Workflow editor code (WorkflowCanvas, PortalCanvas) is explicitly out of scope for this phase.

**Target URL:** `https://cyoda.net/`
**Target product name:** Cyoda Cloud
**Target repo description:** Cyoda Cloud UI monorepo

---

## Critical Findings from Codebase Audit

| Finding | Detail |
|---------|--------|
| **FintechHomeView, not HomeView, is at `/`** | `router/index.tsx` maps `/` → `FintechHomeView.tsx`. `HomeView.tsx` is at `/home`. The spec says "HomeView" but this is inaccurate — rebuild targets `FintechHomeView.tsx`. |
| **Dark mode enforced in 3 places** | `index.html` inline script + inline CSS; `App.tsx` useEffect; `stores/app.ts` `setTheme()` hardcodes 'dark' |
| **Root font is Roboto** | `_fonts.scss` imports Roboto from Google Fonts and sets `html { font-family: "Roboto" }`. `index.html` also loads Montserrat + Inter from Google Fonts. |
| **Animated GIF loader** | `index.html` body shows `logo.gif` / `logo-dark.gif` before the app mounts. Both files exist in `public/` and `src/assets/`. |
| **GTM already installed** | `GTM-T8D3J7XB` in `index.html`. No direct GA4 script — events go through `dataLayer`. |
| **Missing SEO files** | `robots.txt`, `sitemap.xml`, `llms.txt` all absent from `public/`. |
| **Placeholder manifest** | `site.webmanifest` has `name: "MyWebSite"`, `short_name: "MySite"`. |
| **Animations in tailwind.css** | `fadeInUp`, `shimmer`, `gentlePulse` keyframes defined with no `prefers-reduced-motion` wrapper. |
| **No email templates** | No `.mjml` or email template files found in the repo. Nothing to update. |
| **One changelog file** | `CHANGELOG_FEB_11_18.md` exists. No standard `CHANGELOG.md`. |

---

## Scope Boundaries — DO NOT TOUCH

```
packages/web/src/components/WorkflowCanvas/
packages/web/src/components/PortalCanvas/
packages/web/src/services/apiService.ts
packages/web/src/stores/          ← except: remove forced-dark logic from app.ts
packages/desktop/
packages/desktop-workflow/
```

---
## Assets
Cyoda logo: packages/web/public/cyoda.svg
Hero background image: packages/web/public/cyoda-cloud-hero-background.svg
---

## Actionable Steps

### Step 1: Pre-flight Audit and Boundary Setup

**Objective:** Confirm all target files exist at expected paths and create the `.ai/` output file.

**Prerequisites:** None

**Action Items:**
1. Verify target files exist: `index.html`, `App.tsx`, `router/index.tsx`, `FintechHomeView.tsx`, `Header/Header.tsx`, `tailwind.css`, `main.scss`, `_fonts.scss`, `_common.scss`, `public/site.webmanifest`
2. Confirm protected directories exist and are documented as untouched
3. Write this plan to `.ai/change_specs-implementation-plan.md`

**Acceptance Criteria:**
- All target files confirmed present
- `.ai/change_specs-implementation-plan.md` written

---

### Step 2: Metadata and Manifest Update

**Objective:** Update `index.html` and `site.webmanifest` with correct Cyoda Cloud metadata, OG/Twitter tags, canonical URL, and remove placeholder strings.

**Prerequisites:** None (can run in parallel with Steps 3–5)

**Files:**
- `packages/web/index.html`
- `packages/web/public/site.webmanifest`

**Action Items:**
1. Update `<title>` → `Cyoda Cloud — hosted Cyoda runtime`
2. Add/replace `<meta name="description">` with spec-exact copy
3. Add `<meta property="og:title|description|type|url|image">` tags
4. Add `<meta name="twitter:card|title|description|image">` tags
5. Add `<link rel="canonical" href="https://cyoda.net/" />`
6. Update `<meta name="apple-mobile-web-app-title">` from `"MyWebSite"` → `"Cyoda Cloud"`
7. Remove the inline `<script>` that forces `app:theme = dark` and adds `theme-dark` class
8. Remove the inline `<style>` with `background-color: #11101C !important`
9. Replace `<img src="/logo.gif">` / `<img src="/logo-dark.gif">` loader with a static SVG or the existing `logo.svg`
10. Update `site.webmanifest`: name → "Cyoda Cloud", short_name → "Cyoda", add description, theme_color and background_color → "#ffffff"
11. Leave a `<!-- TODO: create og-card.png (1200×630) consistent with light visual system -->` comment where og-card.png is referenced

**Acceptance Criteria:**
- Title: `Cyoda Cloud — hosted Cyoda runtime`
- OG + Twitter tags present
- Canonical link present
- No `MyWebSite` / `MySite` strings in metadata
- No forced dark script or inline dark CSS in `index.html`
- Static loader (no GIF)

---

### Step 3: Font System Replacement

**Objective:** Replace Roboto (Google Fonts) with self-hosted Inter (UI/prose) and JetBrains Mono (code).

**Prerequisites:** None

**Files:**
- `packages/web/index.html` — remove Google Fonts `<link>` tags
- `packages/web/src/assets/css/particular/_fonts.scss` — replace import + add `@font-face`
- `packages/web/tailwind.config.js` — add `fontFamily` tokens
- `packages/web/public/fonts/inter/` — new WOFF2 files (to be created)
- `packages/web/public/fonts/jetbrains-mono/` — new WOFF2 files (to be created)

**Action Items:**
1. Download Inter WOFF2 files (weights 400, 500, 600, 700) → `public/fonts/inter/`
2. Download JetBrains Mono WOFF2 files (weights 400, 500) → `public/fonts/jetbrains-mono/`
3. Remove `@import url('https://fonts.googleapis.com/...')` from `_fonts.scss`
4. Remove Google Fonts `<link>` tags from `index.html` (preconnect + stylesheet for Montserrat/Inter)
5. Add `@font-face` declarations in `_fonts.scss` for Inter (4 weights, `font-display: swap`)
6. Add `@font-face` declarations in `_fonts.scss` for JetBrains Mono (2 weights, `font-display: swap`)
7. Update `html { font-family: }` in `_fonts.scss` from `"Roboto"` → `"Inter"`
8. Add `fontFamily` tokens to `tailwind.config.js`: `{ sans: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] }`
9. Ensure code blocks / inline code in `tailwind.css` or `_common.scss` use `font-family: 'JetBrains Mono'`

**Acceptance Criteria:**
- Zero Google Fonts network requests on page load
- Body uses Inter
- Code elements use JetBrains Mono
- No Roboto or Montserrat references in public page CSS
- No Montserrat added

---

### Step 4: Remove Forced Dark Mode

**Objective:** Stop forcing dark mode globally. Public landing page renders light by default on a fresh browser.

**Prerequisites:** Step 2 (inline script and inline CSS already removed from `index.html`)

**Files:**
- `packages/web/src/App.tsx`
- `packages/web/src/stores/app.ts`
- `packages/web/src/assets/css/particular/_common.scss`

**Action Items:**
1. In `App.tsx`, remove the `useEffect` that calls `root.classList.remove('theme-dark', 'theme-light')` then `root.classList.add('theme-dark')`
2. In `App.tsx`, replace with: read `app:theme` from localStorage; if `'dark'` apply `theme-dark` class; if `'light'` apply `theme-light`; otherwise apply no class (defaults to light)
3. In `stores/app.ts`, change `setTheme()` to accept and persist the passed value instead of hardcoding `'dark'`
4. In `_common.scss`, add a `:root {}` block that declares CSS variable defaults matching `_variables-light.scss` values, so the page renders correctly with no theme class applied
5. Keep `.theme-dark` variable overrides intact in `_variables-dark.scss` — do not change those
6. Verify authenticated routes (chat, workflows) still render acceptably with light defaults

**Risk note:** This is the highest-risk step. The entire SCSS system relies on CSS variables set by `.theme-dark`. Setting root-level defaults matching light values is required before removing the forced dark class — otherwise authenticated routes render with blank/missing styles.

**Acceptance Criteria:**
- Fresh browser (no localStorage) renders `/` in light theme
- No `theme-dark` class forced on `<html>` on initial load
- Authenticated product does not visually break
- Explicit user choice stored in localStorage is respected on subsequent visits

---

### Step 5: Motion and Animated Assets

**Objective:** Remove GIF logos and unnecessary animations; add `prefers-reduced-motion` support.

**Prerequisites:** Step 2 (GIF loader replaced in `index.html`)

**Files:**
- `packages/web/src/styles/tailwind.css`
- `packages/web/src/views/FintechHomeView.tsx` (new content — ensure clean)
- Any `.tsx` file still referencing `logo.gif` / `logo-dark.gif`

**Action Items:**
1. Grep for `logo.gif` and `logo-dark.gif` in all `packages/web/src/` files; remove or replace any remaining references with the static `logo.svg`
2. Wrap `@keyframes fadeInUp`, `shimmer`, and `gentlePulse` definitions in `tailwind.css` with `@media (prefers-reduced-motion: no-preference) { ... }`
3. Add at the end of `tailwind.css`:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
4. Ensure new landing page does not apply `.animate-shimmer`, `.animate-fade-in-up`, or `.animate-gentle-pulse` on CTAs or initial paint elements

**Acceptance Criteria:**
- No GIF assets referenced in any `.tsx` or SCSS file
- No animation plays on initial page paint
- All animations wrapped in `prefers-reduced-motion: no-preference`
- `prefers-reduced-motion: reduce` suppresses all motion

---

### Step 6: Rebuild Public Landing Page (FintechHomeView.tsx)

**Objective:** Replace the AI Studio landing page with the Cyoda Cloud product-entry page per spec sections 3–11.

**Prerequisites:** Steps 3, 4, 5

**Files:**
- `packages/web/src/views/FintechHomeView.tsx` — full rebuild

**Sections to implement (in spec order):**

| # | Section | Key content |
|---|---------|-------------|
| 1 | Skip link | `<a href="#main-content">` — visually hidden until focused |
| 2 | Hero | H1: "Host Cyoda for free while you build event-driven, stateful systems with history." + subhead + "Try Cyoda Cloud, free" (primary) + "Run Cyoda yourself" (secondary) |
| 3 | Developer quick path | "Start with the free beta" — direct path to sign up |
| 4 | Product visual | Static SVG/card: trade-settlement workflow (Trade Received → Validated → Matched → Settled) with state, transition, and history panel. No `WorkflowCanvas` imports. |
| 5 | What Cyoda Cloud is | Spec 4.3 product description copy |
| 6 | AI assistant section | Feature positioning per spec 4.4; confirmed capabilities only |
| 7 | Three ways to use | Cards: "Run it yourself" / "Cyoda Cloud" / "Enterprise Cyoda" per spec section 10 |
| 8 | Free beta expectations | Limits list; no SLA; live beta wording per spec 5 |
| 9 | Security & data FAQ | 14 FAQ items from spec 6.2; accordion with `aria-expanded` |
| 10 | General FAQ | Covered within the 14 FAQ items |
| 11 | Final CTA | "Try Cyoda Cloud, free" |
| 12 | Footer | Docs, GitHub, Open Source (cyoda.org), Enterprise (cyoda.com); copyright |

**Action Items:**
1. Remove all current FintechHomeView content
2. Build semantic page structure: `<header>`, `<main id="main-content">`, `<footer>`, named `<section>` elements
3. Add skip link as first interactive element in the page
4. Implement Hero with spec-exact H1, subhead, and CTAs; primary CTA triggers existing Auth0 flow
5. Build static trade-settlement SVG workflow visual — inline SVG or a lightweight static component; import nothing from `WorkflowCanvas/`
6. Implement "What Cyoda Cloud is" prose section
7. Implement AI assistant feature section using only confirmed capabilities (spec 4.4)
8. Implement three-card "Ways to use Cyoda" section with exact card labels from spec 10
9. Implement free beta limits section with spec 5 copy
10. Implement FAQ accordion (14 items) using local React state + `aria-expanded`; no external accordion library
11. Implement final CTA and footer with correct links
12. Wire GA events via `window.dataLayer.push({ event: '...' })` for: `try_cyoda_cloud_free_click`, `sign_in_click`, `docs_click`, `github_click`, `open_source_click`, `enterprise_click`
13. Use only `lucide-react` icons — no Freepik, no Streamline/Webalys assets
14. Typography: Inter for prose, JetBrains Mono for any code/terminal snippets
15. Colour palette: primary `#2563eb`, text `slate-900` / `#0f172a`, secondary text `slate-600`, borders `slate-200`, backgrounds `white` / `slate-50`

**Forbidden content:**
- No "Cyoda AI Studio", "Cyoda AI Assistant" as product name, "Solve.Build. Deploy"
- No: seamlessly, leverage, robust, cutting-edge, streamline, transformative, game-changing, the kicker, let's, imagine
- No exclamation marks
- No SLA / uptime / backup / ISO / certification claims
- No VC Trade / Tobias Zoller mentions
- No comparison table
- No autoplay video
- No `WorkflowCanvas` or `PortalCanvas` imports

**Acceptance Criteria:**
- All 12 sections present in correct order
- 14 FAQ items with `aria-expanded` accordions
- Skip link present as first interactive element
- Semantic HTML: `header`, `main`, `section`, `footer`
- GA `dataLayer` events wired on all CTA clicks
- No forbidden copy or claims

---

### Step 7: Update Public Header/Navigation

**Objective:** Update `Header.tsx` to show Cyoda Cloud public navigation with correct links and CTAs.

**Prerequisites:** None (can run in parallel with Step 6)

**Files:**
- `packages/web/src/components/Header/Header.tsx`

**Action Items:**
1. Update logo label / aria-label to "Cyoda Cloud"
2. Replace current desktop nav links with: Docs (`https://docs.cyoda.net/`), GitHub (`https://github.com/Cyoda-platform/cyoda-go`), Open Source (`https://cyoda.org/`), Enterprise (`https://cyoda.com/`)
3. Add "Sign in" link (Auth0 login flow)
4. Add "Try Cyoda Cloud, free" primary CTA button (Auth0 signup/login)
5. When user is authenticated: replace "Try Cyoda Cloud, free" with "Open Cyoda Cloud" linking to `/new-chat` or the appropriate authenticated entry point
6. Preserve all existing Auth0 token/user state logic — change labels and links only
7. Preserve `LOGIN_REDIRECT_URL` deep-link logic
8. Add GA events: `sign_in_click` on Sign in, `try_cyoda_cloud_free_click` on primary CTA

**Acceptance Criteria:**
- Public nav shows: Docs, GitHub, Open Source, Enterprise, Sign in, Try Cyoda Cloud free
- Authenticated state shows "Open Cyoda Cloud" replacing the CTA
- Auth0 flow is not broken
- `LOGIN_REDIRECT_URL` logic is intact
- Logo links to `/`

---

### Step 8: SEO Files and FAQPage JSON-LD

**Objective:** Create missing SEO files and add FAQPage structured data to the landing page.

**Prerequisites:** Step 6 (FAQ content written)

**Files created:**
- `packages/web/public/robots.txt`
- `packages/web/public/sitemap.xml`
- `packages/web/public/llms.txt`

**Files modified:**
- `packages/web/src/views/FintechHomeView.tsx` — add `<script type="application/ld+json">` JSON-LD block

**Action Items:**
1. Create `robots.txt`:
   ```
   User-agent: *
   Allow: /
   Sitemap: https://cyoda.net/sitemap.xml
   ```
2. Create `sitemap.xml` with `https://cyoda.net/` as the single URL entry
3. Create `llms.txt` with spec-specified content (Cyoda Cloud description + key links)
4. Add FAQPage JSON-LD in the landing page component; questions and answers must exactly match the accordion content

**Acceptance Criteria:**
- `robots.txt`, `sitemap.xml`, `llms.txt` present and valid at `/`
- FAQPage JSON-LD block present on the landing page

---

### Step 9: Branding String Cleanup

**Objective:** Remove all remaining AI Studio / old product name strings from non-landing-page files.

**Prerequisites:** None

**Files:**

| File | Change |
|------|--------|
| `views/ChatBotView.tsx` | Document title `"Cyoda AI Studio: Solve.Build. Deploy"` → `"Cyoda Cloud"` |
| `views/HomeView.tsx` | Remove `"Solve. Build. Deploy."` tagline — minimal edit only |
| `components/ChatBot/ChatBotSubmitForm.tsx` | Placeholder `"Ask Cyoda AI Assistant..."` → `"Ask the AI assistant..."` |
| `layouts/LayoutModern.tsx` | Same placeholder update |
| `views/CanvasDemoView.tsx` | Same placeholder update |
| `layouts/LayoutModern.test.tsx` | Update test assertion to match new placeholder |

**Action Items:**
1. Update document title in `ChatBotView.tsx`
2. Update the three placeholder strings in `ChatBotSubmitForm.tsx`, `LayoutModern.tsx`, `CanvasDemoView.tsx`
3. Update test assertion in `LayoutModern.test.tsx`
4. Remove "Solve. Build. Deploy." tagline from `HomeView.tsx` (minimal — do not rebuild HomeView)
5. Email templates: none found in repo — nothing to update; note this in final report

**Acceptance Criteria:**
- `"Cyoda AI Studio"` does not appear in any public-facing string
- `"Solve.Build. Deploy"` / `"Solve. Build. Deploy."` removed
- `"Cyoda AI Assistant"` remains only where it describes the AI assistant feature
- Test suite updated and passing

---

### Step 10: README and Changelog

**Objective:** Update the README and add a rebrand changelog entry.

**Prerequisites:** None

**Files:**
- `README.md`
- `CHANGELOG_FEB_11_18.md` (no standard `CHANGELOG.md` exists in this repo)

**Action Items:**
1. Update README top description to "Cyoda Cloud UI monorepo"
2. Update README package table: `packages/web` → "React web application for Cyoda Cloud"
3. Note `packages/desktop` and `packages/desktop-workflow` as out of scope for this rebrand
4. Keep the macOS "damaged application" Known Issues note — it is still relevant for desktop users
5. Add changelog entry to `CHANGELOG_FEB_11_18.md` per spec section 18:
   - Public product name changed to Cyoda Cloud
   - Free-to-try live beta wording
   - Removal of forced dark mode
   - Replacement of animated logo loader with static SVG
   - Metadata and manifest cleanup
6. If Freepik/Streamline assets are removed from the new landing page, add a TODO comment in the README licence note rather than deleting the legal notice

**Acceptance Criteria:**
- README describes repo as "Cyoda Cloud UI monorepo"
- Package table updated
- Changelog entry present

---

### Step 11: Performance — Route-Level Lazy Loading

**Objective:** Prevent Monaco/workflow-heavy bundles from loading on the public landing page.

**Prerequisites:** Step 6 (landing page rebuilt without heavy editor imports)

**Files:**
- `packages/web/src/router/index.tsx`

**Action Items:**
1. Identify Monaco-heavy routes: `ChatBotView`, `WorkflowTabsView`, `CanvasDemoView`, `NewChatView`
2. Convert those route components to `React.lazy()` imports wrapped in `<Suspense fallback={<LoadingSpinner />}>`
3. Keep `FintechHomeView` as a synchronous import — it must load without waiting for any lazy chunk
4. If any specific route cannot safely be lazy-loaded, document the reason in the final report and leave it as a follow-up item

**Acceptance Criteria:**
- Monaco bundle absent from the landing page's initial JS payload
- All authenticated routes still load and function correctly after lazy conversion
- Build passes

---

### Step 12: Build Validation

**Objective:** Confirm the build and all quality scripts pass.

**Prerequisites:** All previous steps

**Commands (run from `packages/web`):**
```bash
corepack yarn type-check
corepack yarn lint
corepack yarn test:run
corepack yarn build
```

**Action Items:**
1. Fix any TypeScript errors introduced by the rebuild
2. Fix any lint errors
3. Fix test failures — at minimum `LayoutModern.test.tsx` will need updating
4. Fix any build errors
5. Produce final output report per spec section 22:
   - Summary of changes
   - Files changed
   - Files deliberately not touched
   - Commands run and results
   - Remaining AI Studio / AI Assistant naming occurrences and why they remain
   - Remaining Google Fonts / GIF / forced-dark references and why they remain
   - Any risks
   - Follow-up items for the cyoda_workflow_editor phase

**Acceptance Criteria:**
- `yarn build` exits 0
- `yarn type-check` exits 0
- `yarn test:run` exits 0 (or failures documented with reason)
- `yarn lint` exits 0

---

## File Change Summary

### New files
| Path | Purpose |
|------|---------|
| `packages/web/public/robots.txt` | SEO |
| `packages/web/public/sitemap.xml` | SEO |
| `packages/web/public/llms.txt` | AI indexing |
| `packages/web/public/fonts/inter/*.woff2` | Self-hosted Inter (4 weights) |
| `packages/web/public/fonts/jetbrains-mono/*.woff2` | Self-hosted JetBrains Mono (2 weights) |

### Modified files
| Path | Scope of change |
|------|----------------|
| `packages/web/index.html` | Title, meta, OG, Twitter, canonical, remove dark script + inline CSS, replace GIF loader |
| `packages/web/public/site.webmanifest` | name, short_name, description, theme_color |
| `packages/web/src/views/FintechHomeView.tsx` | Full rebuild |
| `packages/web/src/views/HomeView.tsx` | Tagline string only |
| `packages/web/src/views/ChatBotView.tsx` | Document title string only |
| `packages/web/src/views/CanvasDemoView.tsx` | Placeholder string only |
| `packages/web/src/components/Header/Header.tsx` | Nav links, CTAs, logo label |
| `packages/web/src/components/ChatBot/ChatBotSubmitForm.tsx` | Placeholder string only |
| `packages/web/src/layouts/LayoutModern.tsx` | Placeholder string only |
| `packages/web/src/layouts/LayoutModern.test.tsx` | Test assertion to match new placeholder |
| `packages/web/src/App.tsx` | Remove forced dark theme useEffect |
| `packages/web/src/stores/app.ts` | Stop hardcoding 'dark' in setTheme() |
| `packages/web/src/assets/css/particular/_fonts.scss` | Replace Roboto import with Inter/JetBrains Mono @font-face |
| `packages/web/src/assets/css/particular/_common.scss` | Add root-level light CSS variable defaults |
| `packages/web/src/styles/tailwind.css` | Wrap animations in prefers-reduced-motion; add reduce handler |
| `packages/web/tailwind.config.js` | Add fontFamily tokens |
| `packages/web/src/router/index.tsx` | Lazy loading for Monaco-heavy routes |
| `README.md` | Rename to Cyoda Cloud UI monorepo |
| `CHANGELOG_FEB_11_18.md` | Add rebrand entry |

### Deliberately not touched
- `packages/web/src/components/WorkflowCanvas/` — all files
- `packages/web/src/components/PortalCanvas/` — all files
- `packages/web/src/services/apiService.ts`
- `packages/web/src/stores/` — all files except `app.ts` theme fix
- `packages/desktop/` — all files
- `packages/desktop-workflow/` — all files
- Auth0 integration logic (beyond label changes)
- Email templates (none exist in repo)

---

## Verification

```bash
# From packages/web:
corepack yarn type-check   # no TypeScript errors
corepack yarn lint         # no lint errors
corepack yarn test:run     # all tests pass
corepack yarn build        # build exits 0
```

**Manual checks after build:**
- Open `/` in a fresh browser profile (no localStorage) → light theme renders
- Network tab → zero `fonts.googleapis.com` requests
- Network tab → `logo.gif` and `logo-dark.gif` not loaded
- View source → `<title>Cyoda Cloud — hosted Cyoda runtime</title>`
- View source → OG and Twitter meta tags present
- `/robots.txt`, `/sitemap.xml`, `/llms.txt` return 200
- Auth0 login flow still works end to end
- `/chat/:technicalId` and `/workflows` still load
