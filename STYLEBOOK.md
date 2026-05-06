# Cyoda Brand Style Guide

**Source repos analysed:**
- `Cyoda-platform/cyodalight-website` — Astro marketing site, plain CSS with CSS custom properties (BEM class naming)
- `Cyoda-platform/cyoda-launchpad` — React + Vite + TypeScript app, Tailwind CSS + shadcn/ui component library

Both repos share the same brand colour palette and typographic direction. cyodalight-website uses a hand-crafted CSS design-token system; cyoda-launchpad maps the same tokens into Tailwind CSS variables and shadcn/ui component primitives. Where the two repos agree exactly, a single value is listed. Where they diverge, both values are given.

---

## 1. Design Philosophy

- **Dark-optional, light-first.** Both repos ship with a light mode as the default. cyoda-launchpad exposes a full `.dark` override for all CSS custom properties. cyodalight-website is light-only.
- **Enterprise / regulated tone.** Typography is restrained (Inter), colour accents are muted teals rather than vivid blues, and motion is deliberately minimal.
- **8-pixel base grid.** All spacing in cyodalight-website is on an 8 px grid (`--space-1 = 0.5rem → 8 px`, `--space-2 = 1rem → 16 px`, etc.).
- **Accessibility-first.** Both repos enforce `:focus-visible` rings, honour `prefers-reduced-motion`, and use semantic HTML landmarks.

---

## 2. Colour Palette

### 2.1 Brand Anchor Colours

These four colours are the invariant Cyoda brand colours. They appear identically in both repos. In cyoda-launchpad they are registered as Tailwind utilities (`bg-cyoda-teal`, `text-cyoda-orange`, etc.) backed by CSS custom properties.

| Token | CSS variable | HSL value | Approximate hex | Usage |
|---|---|---|---|---|
| Cyoda Teal | `--cyoda-teal` | `175 67% 52%` | `#4FB8B0` | Primary brand accent, icons, active states |
| Cyoda Orange | `--cyoda-orange` | `32 95% 59%` | `#FD9E29` | Icon backgrounds, call-outs |
| Cyoda Purple | `--cyoda-purple` | `258 74% 37%` | `#5A18AC` | Decorative, code syntax booleans |
| Cyoda Green | `--cyoda-green` | `106 44% 60%` | `#6BB45A` | Code syntax strings, success states |

```css
/* CSS custom properties — paste into :root */
--cyoda-teal:   175 67% 52%;   /* #4FB8B0 */
--cyoda-orange: 32  95% 59%;   /* #FD9E29 */
--cyoda-purple: 258 74% 37%;   /* #5A18AC */
--cyoda-green:  106 44% 60%;   /* #6BB45A */
```

```tsx
// Tailwind utilities (cyoda-launchpad)
className="bg-cyoda-teal"       // hsl(175 67% 52%)
className="text-cyoda-orange"   // hsl(32 95% 59%)
className="bg-cyoda-purple"     // hsl(258 74% 37%)
className="text-cyoda-green"    // hsl(106 44% 60%)
```

### 2.2 Semantic Colours — Light Mode

| Role | CSS variable | HSL | Approximate hex | Notes |
|---|---|---|---|---|
| Page background | `--background` | `0 0% 100%` | `#ffffff` | Pure white |
| Page foreground / body text | `--foreground` | `222 47% 11%` | `#0f172a` | Near-black |
| Card background | `--card` | `0 0% 100%` | `#ffffff` | Same as background |
| Card foreground | `--card-foreground` | `222 47% 11%` | `#0f172a` | |
| Primary (interactive teal) | `--primary` | `175 65% 32%` | `#1a8a84` | Darker teal for WCAG contrast on white |
| Primary foreground | `--primary-foreground` | `0 0% 100%` | `#ffffff` | White text on teal |
| Button fill | `--button-bg` | `175 65% 36%` | `#1f9c95` | Slightly lighter than primary |
| Button text | `--button-fg` | `0 0% 100%` | `#ffffff` | |
| Button hover fill | `--button-hover` | `175 65% 28%` | `#167872` | Darkened on hover |
| Icon background | `--icon-bg` | via `--cyoda-orange` | `#FD9E29` | Orange icon containers |
| Icon foreground | `--icon-fg` | `0 0% 100%` | `#ffffff` | |
| Secondary surface | `--secondary` | `210 30% 96%` | `#f1f5f9` | Very light warm-cool grey |
| Secondary foreground | `--secondary-foreground` | `222 47% 11%` | `#0f172a` | |
| Muted surface | `--muted` | `210 30% 96%` | `#f1f5f9` | Same as secondary |
| Muted foreground | `--muted-foreground` | `215 20% 42%` | `#64748b` | Medium grey, subtext |
| Accent surface | `--accent` | `175 40% 92%` | `#d8f1ef` | Very light teal hover surface |
| Accent foreground | `--accent-foreground` | `175 65% 25%` | `#145f5b` | Dark teal text on light-teal bg |
| Destructive | `--destructive` | `0 84% 60%` | `#ef4444` | Errors, danger actions |
| Destructive foreground | `--destructive-foreground` | `0 0% 100%` | `#ffffff` | |
| Border / divider | `--border` | `214 24% 88%` | `#d1d9e0` | Standard borders |
| Input border | `--input` | `214 24% 88%` | `#d1d9e0` | Same as border |
| Focus ring | `--ring` | `175 65% 32%` | `#1a8a84` | 2 px outline, same as primary |
| Proof-bar background | `--proof-bar-bg` | `175 45% 96%` | `#e8f7f6` | Light teal strip |
| Proof-bar border | `--proof-bar-border` | `175 35% 85%` | `#afdbd8` | |
| Alternate section bg | `--section-alt-bg` | `210 25% 97%` | `#f5f7f9` | Footer, alternating sections |
| State-node background | `--state-node-bg` | `175 60% 94%` | `#dcf4f2` | Workflow state chips |
| State-node border | `--state-node-border` | `175 55% 60%` | `#52c5bc` | |
| Popover background | `--popover` | `0 0% 100%` | `#ffffff` | |
| Popover foreground | `--popover-foreground` | `222 47% 11%` | `#0f172a` | |

### 2.3 Semantic Colours — Dark Mode

The `.dark` class overrides applied in cyoda-launchpad:

| Role | CSS variable | HSL | Approximate hex |
|---|---|---|---|
| Page background | `--background` | `220 14% 8%` | `#0f1117` |
| Page foreground | `--foreground` | `220 20% 96%` | `#f1f3f8` |
| Card background | `--card` | `220 14% 10%` | `#141720` |
| Border | `--border` | `220 10% 22%` | `#303545` |
| Primary (teal) | `--primary` | via `--cyoda-teal` | `#4FB8B0` |
| Primary foreground | `--primary-foreground` | `0 0% 0%` | `#000000` |
| Secondary surface | `--secondary` | `220 10% 18%` | `#272b38` |
| Muted foreground | `--muted-foreground` | `220 10% 70%` | `#a8adc0` |
| Accent surface | `--accent` | `175 40% 40%` | `#3d9e98` |
| Accent foreground | `--accent-foreground` | `0 0% 100%` | `#ffffff` |
| Destructive | `--destructive` | `0 84% 60%` | `#ef4444` |
| Focus ring | `--ring` | `175 40% 40%` | `#3d9e98` |
| Border radius | `--radius` | `6px` | (reduced from 8 px in light mode) |
| Proof-bar background | `--proof-bar-bg` | `220 14% 12%` | `#181c29` |
| Proof-bar border | `--proof-bar-border` | `220 10% 20%` | `#2a2f40` |
| Section alt background | `--section-alt-bg` | `220 14% 10%` | `#141720` |
| State-node background | `--state-node-bg` | `175 20% 15%` | `#1a2c2b` |
| State-node border | `--state-node-border` | `175 40% 30%` | `#2d7d77` |

### 2.4 Sidebar Tokens (cyoda-launchpad only)

```css
/* Sidebar — registered in Tailwind as sidebar.{key} */
--sidebar-background
--sidebar-foreground
--sidebar-primary
--sidebar-primary-foreground
--sidebar-accent
--sidebar-accent-foreground
--sidebar-border
--sidebar-ring
```

The sidebar is 16 rem wide by default (`--sidebar-width: 16rem`) and collapses to an icon-only rail at 3 rem (`--sidebar-width-icon: 3rem`).

### 2.5 Gradient Definitions

**Hero section gradient (cyoda-launchpad):**
```css
background: linear-gradient(
  135deg,
  hsl(175,45%,92%) 0%,    /* light teal */
  hsl(175,32%,95%) 35%,
  hsl(175,18%,97%) 65%,
  hsl(0,0%,99%)   100%    /* near white */
);
```

**Three-step / CTA section gradient:**
```css
background: linear-gradient(to bottom right,
  hsl(var(--background)),
  hsl(var(--card)),
  hsl(var(--secondary) / 0.2)
);
```

**Workflow artefact card header gradient:**
```css
background: linear-gradient(135deg, hsl(175,35%,95%) 0%, hsl(175,25%,97%) 100%);
```

**Workflow artefact card teal box-shadow:**
```css
box-shadow:
  0 2px  8px -2px hsl(175,40%,55%, 0.12),
  0 8px 32px -8px hsl(175,40%,50%, 0.16),
  0 1px  2px  0   hsl(175,30%,60%, 0.08);
```

### 2.6 Inline Colour Values (from component JSX)

These literal HSL values appear hardcoded in component inline styles — useful for precise widget styling:

| Purpose | HSL value |
|---|---|
| H1 / primary heading text | `hsl(215,28%,14%)` |
| Body copy / sub-copy | `hsl(215,18%,38%)` |
| Timestamp / metadata | `hsl(215,12%,60%)` |
| Eyebrow badge background | `hsl(175,45%,86%)` |
| Eyebrow badge text | `hsl(175,62%,24%)` |
| Committed state dot | `hsl(175,55%,42%)` |
| Active state dot | `hsl(175,50%,52%)` |
| Active state glow ring | `hsl(175,50%,90%)` |
| Pending state dot | `hsl(215,15%,80%)` |
| "Committed" badge bg | `hsl(175,40%,91%)` |
| "In progress" badge bg | `hsl(38,85%,92%)` — warm amber |
| "In progress" badge text | `hsl(32,75%,32%)` |
| Pending badge bg | `hsl(215,15%,93%)` |
| Proof / trust text | `hsl(175,45%,34%)` |
| Workflow section label | `hsl(175,55%,30%)` |
| Workflow entity name | `hsl(215,25%,18%)` |
| Live badge background | `hsl(175,45%,90%)` |
| Live badge text | `hsl(175,60%,26%)` |
| Live pulse dot | `hsl(175,60%,38%)` |
| Workflow card border | `hsl(175,35%,82%)` |
| Metadata footer bg | `hsl(175,25%,97%)` |
| Metadata footer border | `hsl(175,28%,90%)` |

---

## 3. Typography

### 3.1 Font Families

| Purpose | Family | CSS variable / class |
|---|---|---|
| Body / UI | **Inter** (400, 500, 600, 700, 800, 900) | `font-family: 'Inter', sans-serif` |
| Code / monospace | **JetBrains Mono** (cyodalight-website) / **Monaco, Menlo, Ubuntu Mono** (launchpad) | `--font-mono` / `font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace` |

In cyoda-launchpad the Tailwind theme maps the `montserrat` font key to Inter (historical alias — do not use Montserrat):
```ts
fontFamily: { 'montserrat': ['Inter', 'sans-serif'] }
```
Use `font-sans` or `font-montserrat` in Tailwind; both resolve to Inter.

Google Fonts import:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
```

### 3.2 Type Scale

From cyodalight-website design tokens:

| Token | rem | px | Tailwind equivalent |
|---|---|---|---|
| `--text-xs` | `0.75rem` | 12 px | `text-xs` |
| `--text-sm` | `0.875rem` | 14 px | `text-sm` |
| `--text-base` | `1rem` | 16 px | `text-base` |
| `--text-lg` | `1.125rem` | 18 px | `text-lg` |
| `--text-xl` | `1.25rem` | 20 px | `text-xl` |
| `--text-2xl` | `1.5rem` | 24 px | `text-2xl` |
| `--text-3xl` | `1.875rem` | 30 px | `text-3xl` |
| `--text-4xl` | `2.25rem` | 36 px | `text-4xl` |
| `--text-5xl` | `3rem` | 48 px | `text-5xl` |

### 3.3 Heading Styles

| Level | Tailwind classes | Notes |
|---|---|---|
| H1 (hero) | `text-4xl md:text-5xl font-bold tracking-tight leading-tight` | 36–48 px; `color: hsl(215,28%,14%)` |
| H1 (page) | `text-4xl md:text-5xl font-semibold tracking-tight` | |
| H2 (section) | `text-4xl md:text-5xl font-bold text-foreground` | EcosystemSection, ThreeStepSection |
| H2 (secondary) | `text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground` | Legal hero |
| H3 (card) | `text-lg font-semibold mb-2 text-foreground` | Feature card titles |
| H3 (step card) | `mobile-text-xl font-bold mb-3 sm:mb-4 text-foreground` | ThreeStepSection cards |

#### Mobile-responsive heading helpers (cyoda-launchpad)

These utility classes defined in `src/index.css` scale text responsively:

```css
.mobile-text-xs   { @apply text-xs sm:text-sm; }
.mobile-text-sm   { @apply text-sm sm:text-base; }
.mobile-text-base { @apply text-base sm:text-lg; }
.mobile-text-lg   { @apply text-lg sm:text-xl; }
.mobile-text-xl   { @apply text-xl sm:text-2xl; }
.mobile-text-2xl  { @apply text-xl sm:text-2xl md:text-3xl; }
.mobile-text-3xl  { @apply text-2xl sm:text-3xl md:text-4xl; }
.mobile-text-4xl  { @apply text-3xl sm:text-4xl md:text-5xl; }
.mobile-text-5xl  { @apply text-4xl sm:text-5xl md:text-6xl; }
```

### 3.4 Body Text

- Default: `text-base` (16 px), Inter 400, `text-foreground`
- Subtext / descriptive: `text-lg leading-relaxed`, `color: hsl(215,18%,38%)` or `text-muted-foreground`
- Small UI copy: `text-sm`, `text-muted-foreground`
- Caption / micro: `text-xs` (`0.75rem`), often `text-muted-foreground`

### 3.5 Special Text Treatments

| Pattern | Classes / values |
|---|---|
| Eyebrow / label badge | `text-[11px] font-bold tracking-[0.12em] uppercase` |
| Dropdown section label | `text-xs font-semibold text-muted-foreground uppercase tracking-widest` |
| Code / monospace | `font-mono`, 0.875 rem, `text-[11px] font-mono font-semibold tracking-wide` |
| Timestamp | `text-[10px] tabular-nums font-mono` |
| Workflow state name | `text-[11px] font-mono font-semibold tracking-wide` |
| Status badge text | `text-[9px] font-bold uppercase tracking-wide` |
| Metadata key label | `text-[9px] uppercase tracking-widest font-bold` |
| Link text | `text-primary hover:text-primary/80 underline underline-offset-2` |
| "Enterprise" eyebrow | `text-[11px] font-bold tracking-[0.12em] px-3 py-1 rounded-full` |

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (cyodalight-website — 8 px grid)

| Token | rem | px |
|---|---|---|
| `--space-1` | `0.5rem` | 8 px |
| `--space-2` | `1rem` | 16 px |
| `--space-3` | `1.5rem` | 24 px |
| `--space-4` | `2rem` | 32 px |
| `--space-5` | `2.5rem` | 40 px |
| `--space-6` | `3rem` | 48 px |
| `--space-8` | `4rem` | 64 px |
| `--space-10` | `5rem` | 80 px |
| `--space-12` | `6rem` | 96 px |

### 4.2 Container

**cyoda-launchpad (Tailwind):**
```ts
container: {
  center: true,
  padding: '1.25rem',       // 20 px horizontal padding
  screens: { '2xl': '1400px' }  // max-width at 2xl
}
```
Usage: `className="container mx-auto px-4"` (inner components may use `px-4` instead of the theme padding).

**cyodalight-website:**
```css
.container {
  max-width: 1200px;  /* or 1280px — check main.css */
  margin: 0 auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
```

### 4.3 Section Vertical Padding

| Context | Tailwind classes | Result |
|---|---|---|
| Standard section | `py-24` | 96 px top + bottom |
| Hero section | `clamp(3.5rem, 7vw, 6rem)` inline style | 56–96 px, fluid |
| Three-step section | `py-16 sm:py-20 md:py-24` | 64 / 80 / 96 px |
| Legal section | `py-12 sm:py-16 md:py-20 lg:py-24` | 48–96 px |
| Footer | `py-12` | 48 px |

### 4.4 Grid System

| Layout | Tailwind classes |
|---|---|
| Hero (homepage) | `grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-center max-w-6xl mx-auto` |
| Feature cards (2-col) | `grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto` |
| Three-step cards | `grid md:grid-cols-3 gap-8 max-w-6xl mx-auto` |
| Footer | `grid grid-cols-1 md:grid-cols-5 gap-8` |
| Dropdown (2-col) | `grid grid-cols-2 w-[540px] gap-6 p-6` |

### 4.5 Breakpoints

| Name | px | Tailwind prefix |
|---|---|---|
| Mobile | < 640 px | (default) |
| sm | 640 px | `sm:` |
| md (cyodalight 900) | 768 / 900 px | `md:` |
| lg | 1024 px | `lg:` |
| xl | 1280 px | `xl:` |
| 2xl | 1400 px | `2xl:` |

cyodalight-website also uses a 1200 px breakpoint for widescreen layouts not covered by standard Tailwind breakpoints.

---

## 5. Border Radius & Elevation

### 5.1 Border Radius

| Token | Light mode | Dark mode | Tailwind class |
|---|---|---|---|
| `--radius` (base) | `8px` | `6px` | `rounded-lg` = `var(--radius)` |
| `rounded-lg` | `8px` | — | `var(--radius)` |
| `rounded-md` | `6px` | — | `calc(var(--radius) - 2px)` |
| `rounded-sm` | `4px` | — | `calc(var(--radius) - 4px)` |
| `rounded-xl` | `12px` | — | Component cards |
| `rounded-2xl` | `16px` | — | Step cards, workflow artefact |
| `rounded-full` | pill | — | Badges, eyebrow labels |

Common patterns:
```tsx
className="rounded-lg border bg-card"       // standard card
className="rounded-xl border ..."           // legal card
className="rounded-2xl border ..."          // step card, hero artefact
className="rounded-full ..."               // badge, status chip
```

### 5.2 Shadows / Elevation

| Level | CSS | Tailwind |
|---|---|---|
| None | — | `shadow-none` |
| Subtle | `box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` | `shadow-sm` |
| Card default | `box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | `shadow` (card component) |
| Card hover | `shadow-md` | `hover:shadow-md` |
| Workflow artefact | Teal-tinted multi-layer (see §2.5) | Inline style |
| Focus glow | `box-shadow: 0 0 0 3px hsl(var(--primary) / 0.12)` | `.glow-hover` utility |

**`.glow-hover` utility (cyoda-launchpad):**
```css
.glow-hover:hover {
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.12);
}
```
Used on header logo and CTA buttons.

---

## 6. Component Patterns

### 6.1 Buttons

#### Primary Button

```tsx
// cyoda-launchpad
<Button size="lg" className="px-8 text-base font-semibold">
  Talk to us
</Button>
```

Resolved Tailwind classes:
```
inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium
h-11 px-8
bg-[hsl(var(--button-bg))] text-[hsl(var(--button-fg))]
hover:bg-[hsl(var(--button-hover))]
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
disabled:pointer-events-none disabled:opacity-50
```

Visual result: teal fill (`#1f9c95`), white text, 8 px radius, no border.

**cyodalight-website CSS equivalent:**
```css
.btn--primary {
  background: var(--accent-primary);   /* #2563eb in the website variant */
  color: #fff;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: 600;
}
.btn--primary:hover {
  background: /* darkened accent-primary */;
}
```

#### Secondary / Outline Button

```tsx
<Button size="lg" variant="outline" className="px-7 text-base font-semibold"
  style={{
    borderColor: 'hsl(175,38%,65%)',
    color: 'hsl(175,62%,24%)',
    background: 'hsl(175,40%,96%)',
  }}
>
  See the architecture
</Button>
```

Standard outline variant Tailwind classes:
```
border border-input bg-background hover:bg-accent hover:text-accent-foreground
```

#### Ghost Button

```
variant="ghost"  →  hover:bg-accent hover:text-accent-foreground
```

#### Destructive Button

```
variant="destructive"  →  bg-destructive text-destructive-foreground hover:bg-destructive/90
```

#### Button Sizes

| Size key | Tailwind height | Padding |
|---|---|---|
| `sm` | `h-9` | `px-3` |
| `default` | `h-10` | `px-4 py-2` |
| `lg` | `h-11` | `px-8` |
| `icon` | `h-10 w-10` | — |
| `mobile-sm` | `h-9 sm:h-10` | responsive |
| `mobile-default` | `h-10 sm:h-11` | responsive |
| `mobile-lg` | `h-11 sm:h-12` | `px-6 py-3 sm:px-8 sm:py-4`, min-h 44 px |

Mobile minimum touch target: **44 px** (`min-h-[44px] min-w-[44px]`).

#### Text/Link Button (cyodalight-website)

```css
.btn--text {
  background: transparent;
  color: var(--accent-primary);
  text-decoration: underline;
}
```

### 6.2 Input Fields

```tsx
// cyoda-launchpad input.tsx
className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2
           text-base ring-offset-background
           placeholder:text-muted-foreground
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
           disabled:cursor-not-allowed disabled:opacity-50
           md:text-sm"
```

Key values:
- Height: `h-10` (40 px)
- Border: `1px solid hsl(var(--border))` = `#d1d9e0`
- Border radius: `rounded-md` = 6 px
- Focus ring: `2px solid hsl(var(--ring))` = primary teal, with 2 px offset
- Placeholder colour: `hsl(var(--muted-foreground))` = `#64748b`

### 6.3 Cards / Panels

#### Standard Card (shadcn/ui base)

```tsx
// card.tsx
<Card>           // "rounded-lg border bg-card text-card-foreground shadow-sm"
  <CardHeader>   // "flex flex-col space-y-1.5 p-6"
    <CardTitle>  // "text-2xl font-semibold leading-none tracking-tight"
    <CardDescription>  // "text-sm text-muted-foreground"
  <CardContent>  // "p-6 pt-0"
  <CardFooter>   // "flex items-center p-6 pt-0"
```

#### Feature Card (EcosystemSection)

```tsx
className="group p-6 rounded-xl border border-border bg-card shadow-sm
           hover:shadow-md transition-all duration-200"
```

Icon container within feature card:
```tsx
className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center"
// icon: className="w-6 h-6 text-primary"
```

#### Step Card (ThreeStepSection — glass morphism)

```tsx
className="group relative p-6 sm:p-7 md:p-8 rounded-2xl border border-border/50
           bg-card/30 backdrop-blur
           hover:bg-card/50 transition-all duration-300"
```

Hover border glow overlay (absolute child):
```tsx
className="absolute inset-0 rounded-2xl border-2 border-transparent
           group-hover:border-primary/30 transition-colors duration-300"
```

Icon inside step card:
```tsx
className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-icon
           flex items-center justify-center mb-6"
// icon: className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white"
```

#### Legal Card

```css
.legal-card {
  @apply bg-card/20 backdrop-blur border border-border/50 rounded-xl;
  @apply p-4 sm:p-6 lg:p-8 my-4 sm:my-6 lg:my-8;
  @apply transition-all duration-300 hover:bg-card/30;
}
```

#### Enterprise helper classes (cyoda-launchpad)

```css
.card        { @apply bg-card border border-border rounded-md shadow-sm; }
.link        { @apply text-primary hover:opacity-90 underline underline-offset-4; }
.sober-hover { @apply transition-opacity hover:opacity-90; }
```

### 6.4 Badges / Tags / Pills

#### shadcn Badge

```tsx
// Default
className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs
           font-semibold transition-colors
           border-transparent bg-primary text-primary-foreground hover:bg-primary/80"

// Secondary
"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"

// Destructive
"border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80"

// Outline
"text-foreground"  (border inherits from base)
```

#### Eyebrow Badge (Hero)

```tsx
className="inline-flex items-center text-[11px] font-bold tracking-[0.12em]
           px-3 py-1 rounded-full"
style={{ background: 'hsl(175,45%,86%)', color: 'hsl(175,62%,24%)' }}
// → soft teal pill, uppercase text, dark teal text
```

#### cyodalight-website Badge Pills (ProofBar)

```html
<!-- Attribute pills in ProofBar -->
<span class="proof-bar__attr">gRPC API</span>
<span class="proof-bar__attr">Apache 2.0</span>
<span class="proof-bar__attr">Open Source</span>
```

#### Workflow Status Badges (inline styles)

| Status | Background | Text colour |
|---|---|---|
| committed | `hsl(175,40%,91%)` | `hsl(175,55%,27%)` |
| in progress | `hsl(38,85%,92%)` | `hsl(32,75%,32%)` |
| pending | `hsl(215,15%,93%)` | `hsl(215,15%,55%)` |

Text sizing for status badges: `text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide`

### 6.5 Navigation / Header

**cyoda-launchpad Header structure:**

```tsx
<header className="sticky top-0 z-50 w-full border-b border-border bg-background/98 backdrop-blur-sm">
  <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
    {/* Logo | Desktop nav | Actions */}
  </div>
  {/* Mobile menu: border-t border-border/40 bg-background/95 backdrop-blur */}
</header>
```

Key values:
- Height: `h-16` (64 px) — desktop nav bar
- Background: `bg-background/98` with `backdrop-blur-sm`
- Border bottom: `border-b border-border`
- Logo height: `h-6` (24 px)
- Nav link style: `text-foreground hover:text-primary transition-colors font-medium text-sm`
- Contact CTA: `Button variant="outline"` with `glow-hover`

**cyodalight-website Navbar:**
- Sticky, 56 px height
- CSS class: `.navbar` / `.navbar__inner`
- Logo class: `.navbar__logo`
- Links class: `.navbar__links` / `.navbar__link`
- Hamburger: `.navbar__hamburger` (three `<span>` bars)
- Mobile drawer: `.navbar__drawer` / `.navbar__drawer-links` (dialog element)

**NavigationMenu dropdown content:**
```tsx
className="grid grid-cols-2 w-[540px] gap-6 p-6"
// Section labels: "text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3"
// Menu items: "text-sm font-medium text-foreground group-hover:text-primary transition-colors"
// Item sub-copy: "text-xs text-muted-foreground mt-0.5"
```

### 6.6 Hero Section

**cyoda-launchpad hero:**

```tsx
<section
  className="relative overflow-hidden"
  style={{
    background: heroGradient,
    paddingTop: 'clamp(3.5rem, 7vw, 6rem)',
    paddingBottom: 'clamp(3.5rem, 7vw, 6rem)',
  }}
>
  <ArchitectureField />  {/* SVG background decoration, opacity 0.07–0.20 */}
  <div className="relative z-10 container mx-auto px-4">
    {/* Two-column grid on desktop */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-center max-w-6xl mx-auto">
```

Left column inner max-width: `max-w-lg lg:max-w-none`

**cyodalight-website hero:**
- CSS class: `.hero` / `.hero--grid-bg` (optional SVG grid background)
- Inner: `.hero__inner`
- Left: `.hero__text`
- Right: `.hero__panel`
- Badge: `.hero__badge`
- Heading: `.hero__headline`
- Sub-copy: `.hero__subhead`
- Action buttons: `.hero__actions`
- Confirmation: `.hero__confirm`

### 6.7 Proof / Trust Bar

```tsx
// cyoda-launchpad ProofBar
className="border-y"
style={{
  background: 'hsl(var(--proof-bar-bg))',   // #e8f7f6 light
  borderColor: 'hsl(var(--proof-bar-border))'
}}
// Content: flexbox, centered, wrapped text with divider hidden on mobile
// Shield icon: lucide-react ShieldCheck, w-4 h-4
```

BEM classes in cyodalight-website: `.proof-bar`, `.proof-bar__item`, `.proof-bar__label`, `.proof-bar__attr`

### 6.8 Code Blocks

**cyodalight-website:**
- Container: `.code-block-container`
- Block: `.code-block` — dark background, `--radius-md` corners, `--space-3` padding, `--font-mono`
- Copy button: `.copy-button` — hidden by default, opacity 1 on `.code-block-container:hover`
- Syntax token classes:
  ```css
  .code-block .string  { color: hsl(var(--cyoda-green));  }  /* #6BB45A */
  .code-block .number  { color: hsl(var(--cyoda-orange)); }  /* #FD9E29 */
  .code-block .boolean { color: hsl(var(--cyoda-purple)); }  /* #5A18AC */
  .code-block .key     { color: hsl(var(--cyoda-teal));   }  /* #4FB8B0 */
  .code-block .comment { color: hsl(240 5% 64.9%); font-style: italic; }
  ```
- Shiki theme: `github-light` (colours overridden via CSS variables)

**cyoda-launchpad CopyableCodeBlock:**
- Library: `react-syntax-highlighter` with `oneDark` theme
- Container: `backdrop-blur`, subtle border
- Copy button: hidden, revealed on hover; turns green on success (`bg-green-500/20`)
- Max height: 400 px by default (scrollable)

```css
/* index.css code block */
.code-block {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;   /* 14px */
  line-height: 1.5;
  overflow-x: auto;
}
```

### 6.9 Tabs

```tsx
// shadcn Tabs
<TabsList>     // "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
<TabsTrigger>  // "... rounded-sm px-3 py-1.5 text-sm font-medium ...
               //  data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
<TabsContent>  // "mt-2 ..."
```

### 6.10 Accordion / FAQ

cyodalight-website uses native HTML `<details>` / `<summary>` elements styled through the `.faq` and `.faq__item` CSS classes.

cyoda-launchpad uses the shadcn Accordion (Radix UI) with animation:
```ts
// tailwind.config.ts
keyframes: {
  'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
  'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
},
animation: {
  'accordion-down': 'accordion-down 0.2s ease-out',
  'accordion-up':   'accordion-up 0.2s ease-out',
}
```

### 6.11 Dialog / Modal

```tsx
// DialogOverlay: "fixed inset-0 z-50 bg-black/80" + fade animations
// DialogContent:
"fixed left-[50%] top-[50%] z-[10001] grid w-full max-w-lg
 translate-x-[-50%] translate-y-[-50%]
 gap-4 border bg-background p-6
 shadow-lg duration-200
 data-[state=open]:animate-in data-[state=closed]:animate-out
 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
 data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2
 sm:rounded-lg"
```

### 6.12 Tooltip

```tsx
// TooltipContent
"z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground
 shadow-md animate-in fade-in-0 zoom-in-95
 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2
 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
// sideOffset default: 4px
```

### 6.13 Alert

```tsx
// Alert base: "relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7"
// default variant: "bg-background text-foreground"
// destructive variant: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
// AlertTitle: "mb-1 font-medium leading-none tracking-tight"
// AlertDescription: "text-sm [&_p]:leading-relaxed"
```

### 6.14 Separator

```tsx
// horizontal: "shrink-0 bg-border h-[1px] w-full"
// vertical:   "shrink-0 bg-border h-full w-[1px]"
```

### 6.15 Footer

```tsx
<footer className="border-t border-border bg-[hsl(var(--section-alt-bg))]">
  <div className="container mx-auto px-4 py-12">
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
      {/* Logo col: md:col-span-2 */}
    </div>
    <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center">
      {/* Copyright | Legal links */}
    </div>
  </div>
</footer>
```

Footer section heading: `"font-semibold mb-4 text-foreground"`  
Footer nav link: `"block text-muted-foreground hover:text-primary transition-colors"`  
Social icon button: `"p-3 rounded-lg bg-secondary border border-border hover:border-border/80 transition-all duration-200 group"`  

---

## 7. Motion & Transitions

Both repos deliberately keep animation short and restrained (enterprise tone).

| Element | Duration | Easing |
|---|---|---|
| Accordion open/close | `0.2s` | `ease-out` |
| Card hover shadow | `200ms` | `transition-all` (Tailwind default `ease-in-out`) |
| Step-card backdrop + border | `300ms` | `transition-all duration-300` |
| Button hover | `150ms` | Tailwind `transition-colors` |
| Nav link hover | default Tailwind `transition-colors` | |
| Tooltip entrance | `animate-in fade-in-0 zoom-in-95` | `data-[state=*]` |
| Dialog entrance | `200ms` | Tailwind `duration-200` |
| Logo spin (App.css — unused in prod) | `20s linear infinite` | `@media (prefers-reduced-motion: no-preference)` |
| Live pulse dot | `animate-pulse` | Tailwind infinite pulse |

**Reduced motion:** Both repos respect `prefers-reduced-motion`:
```css
/* cyodalight-website */
@media (prefers-reduced-motion: reduce) {
  /* all transitions/animations disabled */
}
/* cyoda-launchpad */
.reduce-motion * { @apply motion-reduce:transition-none motion-reduce:animate-none; }
```

---

## 8. Texture & Background Patterns

**Dot-grid texture (cyoda-launchpad):**
```css
.texture-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    circle at 1px 1px,
    hsl(var(--foreground) / 0.1) 1px,
    transparent 0
  );
  background-size: 20px 20px;
  pointer-events: none;
  opacity: 0.3;
}
```
Used with `className="... relative"` and a child `<div className="absolute inset-0 texture-overlay opacity-30 pointer-events-none" />`.

**SVG background grid (cyodalight-website hero):**
Activated by adding the `.hero--grid-bg` modifier class. CSS-only dot/line grid.

**ArchitectureField SVG (cyoda-launchpad):**
Decorative SVG with concentric circles, arc paths, and connection lines at `opacity: 0.07–0.20`. Positioned `absolute` behind hero content.

---

## 9. Iconography

- **Library:** `lucide-react` (cyoda-launchpad) — consistent stroke-based SVG icons
- **Size conventions:** `w-4 h-4` (16 px) inline, `w-5 h-5` (20 px) medium, `w-6 h-6` (24 px) standard, `w-8 h-8` (32 px) large
- **Colour:** `text-primary` for brand icons, `text-muted-foreground` for decorative/UI icons, `text-white` on coloured backgrounds
- **Social icons:** `react-icons/si` (SiGithub, SiLinkedin, SiX, SiYoutube) — `w-5 h-5`
- **cyodalight-website:** Inline SVG sprite pattern; 24×24 px viewBox, stroke-only (`stroke-width: 2`, `stroke-linecap: round`, `stroke-linejoin: round`, `currentColor`)
- **Icon containers:**
  - Feature cards: `w-12 h-12 rounded-lg bg-primary/10` (48 px, teal-tinted)
  - Step cards: `w-12 h-12 ... rounded-2xl bg-icon` (orange fill, 48–64 px responsive)
  - Social buttons: `p-3 rounded-lg bg-secondary border border-border`

---

## 10. Dark Mode

cyoda-launchpad is the only repo that ships a full dark mode. Toggle is managed by `next-themes` via `<ThemeProvider>` with a `<ThemeToggle>` UI component.

Dark mode is activated by the `.dark` class on the `<html>` element:
```html
<html class="dark">
```

Key dark-mode differences:
- Background shifts from white to `hsl(220 14% 8%)` — a very dark blue-grey
- Primary colour switches from darker teal (for contrast on white) to full brand teal `#4FB8B0`
- Card backgrounds are `hsl(220 14% 10%)` — barely distinguishable from page bg
- Border colour darkens to `hsl(220 10% 22%)`
- Border radius shrinks from 8 px to 6 px
- Button fill inherits `--cyoda-teal` directly

When building components, always test both modes using the CSS custom property system — colours should never be hardcoded hex values.

---

## 11. Accessibility

Both repos implement:

1. **Skip link** — first focusable element: "Skip to main content" targeting `#main-content`
2. **Focus-visible rings** — `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (Tailwind) or `outline: 2px solid var(--accent-primary); outline-offset: 2px;` (cyodalight-website)
3. **Reduced motion** — `@media (prefers-reduced-motion: reduce)` + `.reduce-motion` utility
4. **ARIA roles** — `role="banner"`, `role="list"`, `aria-label`, `aria-expanded`, `aria-controls`, `aria-modal`, `aria-live="polite"`
5. **Min touch targets** — `min-h-[44px] min-w-[44px]` on mobile buttons
6. **External link security** — `target="_blank" rel="noopener noreferrer"` on all external `<a>` tags
7. **Decorative SVGs** — `aria-hidden="true" focusable="false"` on all decorative icons/patterns

---

## 12. Quick Reference — What to Use Where

| Task | Use this |
|---|---|
| Primary CTA button | `<Button size="lg" className="px-8 text-base font-semibold">` |
| Outline / secondary CTA | `<Button variant="outline" size="lg">` + optional inline teal border/bg |
| Ghost button | `<Button variant="ghost">` |
| Danger action | `<Button variant="destructive">` |
| Section heading | `text-4xl md:text-5xl font-bold text-foreground` |
| Body copy | `text-base text-foreground` or `text-lg leading-relaxed text-muted-foreground` |
| Metadata / caption | `text-xs text-muted-foreground` |
| Monospace / code | `font-mono text-sm` |
| Standard card | `<Card>` → `rounded-lg border bg-card shadow-sm` |
| Glass card (dark sections) | `rounded-2xl border border-border/50 bg-card/30 backdrop-blur` |
| Feature icon container | `w-12 h-12 rounded-lg bg-primary/10` |
| Orange icon container | `w-12 h-12 rounded-2xl bg-icon` (`hsl(var(--cyoda-orange))`) |
| Eyebrow label | `text-[11px] font-bold tracking-[0.12em] px-3 py-1 rounded-full` + teal bg/text |
| Status badge | `text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide` + appropriate bg |
| Hero gradient bg | `linear-gradient(135deg, hsl(175,45%,92%) ... hsl(0,0%,99%))` |
| Alternate section bg | `bg-[hsl(var(--section-alt-bg))]` |
| Trust bar | `border-y` + `background: hsl(var(--proof-bar-bg))` |
| Dot-grid texture | `texture-overlay` pseudo-element + 20 px radial-gradient |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |
| Brand teal (direct) | `hsl(175 67% 52%)` / `#4FB8B0` |
| Brand orange (direct) | `hsl(32 95% 59%)` / `#FD9E29` |
| Primary interactive | `hsl(var(--primary))` — resolves to `#1a8a84` light / `#4FB8B0` dark |
| Transition default | `transition-colors` (150 ms) or `transition-all duration-200` |

---

## 13. Full CSS Variable Block

Paste this into `:root` and `.dark` to bootstrap the Cyoda design system in any CSS/Tailwind project:

```css
:root {
  /* Brand */
  --cyoda-teal:   175 67% 52%;
  --cyoda-orange: 32  95% 59%;
  --cyoda-purple: 258 74% 37%;
  --cyoda-green:  106 44% 60%;

  /* Surfaces */
  --background:         0 0% 100%;
  --foreground:         222 47% 11%;
  --card:               0 0% 100%;
  --card-foreground:    222 47% 11%;
  --popover:            0 0% 100%;
  --popover-foreground: 222 47% 11%;

  /* Primary */
  --primary:            175 65% 32%;
  --primary-foreground: 0 0% 100%;
  --button-bg:          175 65% 36%;
  --button-fg:          0 0% 100%;
  --button-hover:       175 65% 28%;
  --icon-bg:            var(--cyoda-orange);
  --icon-fg:            0 0% 100%;

  /* Semantic */
  --secondary:              210 30% 96%;
  --secondary-foreground:   222 47% 11%;
  --muted:                  210 30% 96%;
  --muted-foreground:       215 20% 42%;
  --accent:                 175 40% 92%;
  --accent-foreground:      175 65% 25%;
  --destructive:            0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  /* Chrome */
  --border: 214 24% 88%;
  --input:  214 24% 88%;
  --ring:   175 65% 32%;

  /* Geometry */
  --radius: 8px;

  /* Specific surfaces */
  --proof-bar-bg:     175 45% 96%;
  --proof-bar-border: 175 35% 85%;
  --section-alt-bg:   210 25% 97%;
  --state-node-bg:    175 60% 94%;
  --state-node-border:175 55% 60%;
}

.dark {
  --background:         220 14% 8%;
  --foreground:         220 20% 96%;
  --card:               220 14% 10%;
  --card-foreground:    220 20% 96%;
  --popover:            220 14% 10%;
  --popover-foreground: 220 20% 96%;
  --border:             220 10% 22%;
  --input:              220 10% 22%;

  --primary:            var(--cyoda-teal);
  --primary-foreground: 0 0% 0%;
  --button-bg:          var(--cyoda-teal);
  --button-fg:          240 10% 3.9%;

  --secondary:            220 10% 18%;
  --secondary-foreground: 220 20% 96%;
  --muted:                220 10% 16%;
  --muted-foreground:     220 10% 70%;
  --accent:               175 40% 40%;
  --accent-foreground:    0 0% 100%;
  --ring:                 175 40% 40%;
  --radius:               6px;

  --proof-bar-bg:     220 14% 12%;
  --proof-bar-border: 220 10% 20%;
  --section-alt-bg:   220 14% 10%;
  --state-node-bg:    175 20% 15%;
  --state-node-border:175 40% 30%;
}
```

---

*Generated from analysis of `Cyoda-platform/cyodalight-website` and `Cyoda-platform/cyoda-launchpad` on 2026-05-06.*
