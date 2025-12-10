# Typography System Guide

## Overview

This document describes the standardized typography system used across the entire application. The system ensures consistency, readability, and proper visual hierarchy across all pages.

## Font Family

- **Primary**: Roboto
- **Fallback**: Arial, sans-serif

## Typography Scale

All sizes use `clamp()` for responsive scaling across different screen sizes.

### Display (H0)
- **Size**: `clamp(32px, 4vw, 48px)`
- **Weight**: Bold (700)
- **Line Height**: 1.2
- **Usage**: Largest headings on landing pages
- **Component**: `<Display />`
- **CSS Class**: `.typo-display`

### Heading 1 (H1)
- **Size**: `clamp(24px, 3vw, 32px)`
- **Weight**: Bold (700)
- **Line Height**: 1.2
- **Usage**: Main page headings, hero titles
- **Component**: `<H1 />`
- **CSS Class**: `.typo-h1`

### Heading 2 (H2)
- **Size**: `clamp(20px, 2.5vw, 28px)`
- **Weight**: Semibold (600)
- **Line Height**: 1.2
- **Usage**: Section headings
- **Component**: `<H2 />`
- **CSS Class**: `.typo-h2`

### Heading 3 (H3)
- **Size**: `clamp(16px, 1.5vw, 20px)`
- **Weight**: Semibold (600)
- **Line Height**: 1.2
- **Usage**: Subsection headings, card titles
- **Component**: `<H3 />`
- **CSS Class**: `.typo-h3`

### Heading 4 (H4)
- **Size**: `clamp(14px, 1.2vw, 18px)`
- **Weight**: Semibold (600)
- **Line Height**: 1.2
- **Usage**: Card titles, labels, feature names
- **Component**: `<H4 />`
- **CSS Class**: `.typo-h4`

### Body Large
- **Size**: `clamp(16px, 1.5vw, 20px)`
- **Weight**: Regular (400)
- **Line Height**: 1.5
- **Usage**: Main body text, descriptions
- **Component**: `<BodyLarge />`
- **CSS Class**: `.typo-body-lg`

### Body
- **Size**: `clamp(14px, 1.2vw, 16px)`
- **Weight**: Regular (400)
- **Line Height**: 1.5
- **Usage**: Standard body text
- **Component**: `<Body />`
- **CSS Class**: `.typo-body`

### Body Small
- **Size**: `clamp(12px, 0.9vw, 14px)`
- **Weight**: Regular (400)
- **Line Height**: 1.5
- **Usage**: Secondary text, descriptions, helper text
- **Component**: `<BodySmall />`
- **CSS Class**: `.typo-body-sm`

### Caption
- **Size**: `clamp(11px, 0.8vw, 13px)`
- **Weight**: Regular (400)
- **Line Height**: 1.4
- **Usage**: Small text, captions, badges
- **Component**: `<Caption />`
- **CSS Class**: `.typo-caption`

### Tiny
- **Size**: `clamp(10px, 0.7vw, 12px)`
- **Weight**: Regular (400)
- **Line Height**: 1.4
- **Usage**: Very small text, timestamps
- **Component**: `<Tiny />`
- **CSS Class**: `.typo-tiny`

### Caption Uppercase
- **Size**: `clamp(11px, 0.8vw, 13px)`
- **Weight**: Semibold (600)
- **Line Height**: 1.4
- **Letter Spacing**: 0.05em
- **Usage**: Labels, badges, category tags
- **Component**: `<CaptionUppercase />`
- **CSS Class**: `.typo-caption-uppercase`

## Font Weights

Only 3 weights are used throughout the application:

- **Regular (400)**: Body text, descriptions
- **Semibold (600)**: Subheadings, labels, accents
- **Bold (700)**: Main headings, H1, H2

## Text Colors

Standardized color palette for text:

- **Primary**: `#ffffff` - Main text, headings
- **Secondary**: `#e2e8f0` - Body text, descriptions
- **Tertiary**: `#94a3b8` - Helper text, disabled states
- **Disabled**: `#64748b` - Disabled text
- **Accent Green**: `#4ade80` - Green highlights
- **Accent Teal**: `#14b8a6` - Teal highlights

## Usage Examples

### Using React Components

```tsx
import { H1, Body, Caption } from '@/components/Typography';

export function MyComponent() {
  return (
    <div>
      <H1>Main Heading</H1>
      <Body>This is body text with standard styling.</Body>
      <Caption>Small caption text</Caption>
    </div>
  );
}
```

### Using CSS Classes

```html
<h1 class="typo-h1">Main Heading</h1>
<p class="typo-body">Body text</p>
<span class="typo-caption">Caption</span>
```

### With Custom Styling

```tsx
<H1 className="text-emerald-400">Colored Heading</H1>
<Body style={{ color: '#14b8a6' }}>Custom color text</Body>
```

## Migration Guide

When updating existing components:

1. Replace hardcoded font sizes with typography components
2. Use only the 3 standard font weights
3. Use standardized text colors
4. Remove inline style font definitions
5. Use CSS classes or components for consistency

## CSS Variables

All typography values are available as CSS variables:

```css
--font-size-display: clamp(32px, 4vw, 48px);
--font-size-h1: clamp(24px, 3vw, 32px);
--font-size-h2: clamp(20px, 2.5vw, 28px);
--font-size-h3: clamp(16px, 1.5vw, 20px);
--font-size-h4: clamp(14px, 1.2vw, 18px);
--font-size-body-lg: clamp(16px, 1.5vw, 20px);
--font-size-body: clamp(14px, 1.2vw, 16px);
--font-size-body-sm: clamp(12px, 0.9vw, 14px);
--font-size-caption: clamp(11px, 0.8vw, 13px);
--font-size-tiny: clamp(10px, 0.7vw, 12px);

--font-weight-regular: 400;
--font-weight-semibold: 600;
--font-weight-bold: 700;

--line-height-heading: 1.2;
--line-height-body: 1.5;
--line-height-caption: 1.4;
```

