/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        // Display - Landing page hero
        'display': ['clamp(32px, 4vw, 48px)', { lineHeight: '1.2', fontWeight: '700' }],
        // Heading 1 - Main headings
        'h1': ['clamp(24px, 3vw, 32px)', { lineHeight: '1.2', fontWeight: '700' }],
        // Heading 2 - Section headings
        'h2': ['clamp(18px, 2vw, 24px)', { lineHeight: '1.3', fontWeight: '600' }],
        // Heading 3 - Subsection headings
        'h3': ['clamp(14px, 1.2vw, 18px)', { lineHeight: '1.3', fontWeight: '600' }],
        // Body - Main body text
        'body': ['clamp(14px, 1.2vw, 16px)', { lineHeight: '1.5', fontWeight: '400' }],
        // Body Small - Secondary text
        'body-sm': ['clamp(12px, 0.9vw, 14px)', { lineHeight: '1.5', fontWeight: '400' }],
        // Caption - Labels and small text
        'caption': ['clamp(11px, 0.8vw, 13px)', { lineHeight: '1.4', fontWeight: '400' }],
      },
      fontWeight: {
        'regular': '400',
        'semibold': '600',
        'bold': '700',
      },
      colors: {
        // Text colors
        'text-primary': '#ffffff',
        'text-secondary': '#e2e8f0',
        'text-tertiary': '#94a3b8',
        'text-disabled': '#64748b',
        'text-accent-green': '#4ade80',
        'text-accent-teal': '#14b8a6',
      },
    },
  },
}
